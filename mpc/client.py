#!/usr/bin/env python3
"""
Usage: python3 client.py
Reads inputs from the state file and runs the MPC protocol using specified parameters in state.
Inputs in the state file are separated by spaces if the protocol expects multiple inputs
"""
import asyncio
from posix import write
import sys
import subprocess
from dataclasses import dataclass, asdict
from ecies.utils import generate_key
from ecies import encrypt, decrypt
from coincurve.keys import PublicKey, PrivateKey
from typeguard import typechecked
import os
import json
import hashlib
from enum import Enum
from typing import List, Dict, Annotated, Literal, Tuple, Callable

MPC_DIRECTORY = os.environ.get("MP_SPDZ_HOME")
STATE_FILE = f'{MPC_DIRECTORY}/state.json'

# Type the current phase a.k.a. "global_enum"
class PHASE(Enum):
  # SETUP GAME
  ROLE_DISTRIBUTION_JS = 1
  GEN_DETECTIVE_KEYS_PY = 2
  POPULATE_KEYS_JS = 3
  # GAMEPLAY
  DETECTIVE_CHOICE_JS = 4
  DETECTIVE_MPC_PY = 5
  ANGEL_MAFIA_CHOICE_JS = 6 # decrypt for detective to see the role of the chosen player
  ANGEL_MAFIA_MPC_PY = 7
  TALK_JS = 8
  VOTE_MPC_PY = 9
  GAME_OVER_ADMISSION_JS = 10
  # REPEAT GAMEPLAY

class MPC_PROTOCOL(Enum):
  ASSIGN_ROLES = "assign_roles",
  ANGEL_MAFIA = "angel_mafia",
  DETECTIVE = "anon_reveal",
  DAYTIME_VOTE = "daytime_vote"
  BROADCAST = "add"

# Type IDs (number from 0-4)
ID = Annotated[int, Literal[0, 1, 2, 3, 4]]
# Type roles
class ROLE(Enum):
  TOWNSPERSON = "Townsperson"
  MAFIA = "Mafia"
  ANGEL = "Angel"
  DETECTIVE = "Detective"

# 0,1 = Townsperson, 2 = Mafia, 3 = Angel, 4 = Detective
ROLES_FROM_SID: Dict[ID, ROLE] = {
    0: ROLE.TOWNSPERSON,
    1: ROLE.TOWNSPERSON,
    2: ROLE.MAFIA,
    3: ROLE.ANGEL,
    4: ROLE.DETECTIVE
}
SID_FROM_ROLES: Dict[ROLE, List[ID]]= {
    ROLE.TOWNSPERSON: [0, 1],
    ROLE.MAFIA: [1],
    ROLE.ANGEL: [2],
    ROLE.DETECTIVE: [3]
}

# State file serialization
@dataclass
@typechecked
class State:
    # SHARED STATE (everyone has same values)
    global_enum: PHASE                    # current phase of the game
    inputs: dict                          # player inputs
    public_id_to_status: Dict[ID, bool]   # player statuses (mapping public ids to dead/false or alive/true)
    detective_public_key: str             # detective's public key (hex str)
    output: str                           # output of the MPC phases
    # PERSONAL STATE (unique to each individual)
    private_id: ID                        # private id (maps to role)
    detective_private_key: str  | None    # detective's private key (only detective has this) (hex str)
    
    def to_dict(self):
        state_dict = asdict(self)
        state_dict['global_enum'] = self.global_enum.value
        return state_dict

def generate_detective_key_pair(_: State) -> Tuple[str, str]:
    """
    Generate an secp256k1 key pair for the detective.
    """
    secp_k = generate_key()
    return secp_k.public_key.format(True).hex(), secp_k.to_hex()

def write_player_input(input_value, player_id: ID):
    """
    Write this player's input to its designated input file.
    """
    input_file = f'{MPC_DIRECTORY}/Player-Data/Input-P{player_id}-0'
    os.makedirs(os.path.dirname(input_file), exist_ok=True)

    with open(input_file, 'w') as f:
        for val in input_value.split(" "):
            f.write(str(val))
            f.write("\n")

async def run_mpc_protocol(mpc_program: MPC_PROTOCOL, player_id: ID, num_players: int = 5):
    """
    Run the add MPC program with MP-SPDZ for N players.
    """
    command = [f'{MPC_DIRECTORY}/mascot-party.x', mpc_program, '-N', f'{num_players}', '-p', str(player_id)]
    [print(command[i], end=' ') for i in range(len(command))]
    print("&")
    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()

    # Capture and return the output
    output = stdout.decode()
    print(f"Output from MP-SPDZ (Player {player_id}): {output}")
    print(f"Error from MP-SPDZ (Player {player_id}): {stderr.decode()}")
    return output

async def get_result_from_mpc_protocol(mpc_program: MPC_PROTOCOL, num_players: int = 5):
    tasks = [run_mpc_protocol(mpc_program, i) for i in range(num_players)]
    results = await asyncio.gather(*tasks)
    return results[0]

async def detective_key_gen(state: State):
   if ROLES_FROM_SID[state.private_id] == ROLE.DETECTIVE:
      state.detective_public_key, state.detective_private_key = generate_detective_key_pair()
      await write_output_to_state(state)

async def write_output_to_state(state: State):
    """
    Write the output to the state file.
    """
    with open(STATE_FILE, 'w') as f:
        json.dump(state.to_dict(), f, indent=2)


def populate_inputs_from_state(state: State):
   for player_id, input in state.inputs.items():
        write_player_input(input, player_id)


async def run_detective_protocol(state: State, num_players: int = 5):
    
    output = get_result_from_mpc_protocol(MPC_PROTOCOL.DETECTIVE, num_players)    
    # need to do some output cleanup here

    # If I am the detective, write out to my state file
    if ROLES_FROM_SID[state.private_id] == ROLE.DETECTIVE:
        decrypted_output = decrypt(state.detective_private_key, output)
        state.output = decrypted_output
        

async def run_angel_mafia_protocol(state: State, num_players: int = 5):
    # The first input is relevant to the angels save
    # Angel puts player_id to save all others 0
    # Second input (second line) is what mafia kills
    # Angel puts player_id to save all others 0

    # do logic to figure out who died or if no-one died, update state
    output = get_result_from_mpc_protocol(MPC_PROTOCOL.ANGEL_MAFIA, num_players)
    # update living list if necessary

    if str(output) == "Saved":
        state.output = "Saved"
    else:
        output = int(output)
        state.public_id_to_status[output] = False
        state.output = f"Killed {output}"
    

async def run_voting_protocol(state: State, num_players: int = 5):
    # do logic to figure out who died or if no-one died, update state
    output = get_result_from_mpc_protocol(MPC_PROTOCOL.DAYTIME_VOTE, num_players)
    # update living list if necessary
    if str(output) == "No Majority":
        state.output = "No Majority"
    else:
        output = int(output)
        state.public_id_to_status[output] = False
        state.output = f"Executed {output}"


async def populate_input_from_state() -> Tuple[Callable[[State], None] | None, int, State] :
    """
    Populate the input files for each player from the state file.
    Returns the MPC protocol to run, the number of players, and the state object.
    """
    with open(STATE_FILE, 'r') as f:
        # Load and verify state is in acceptable format
        object = json.load(f)
        state = State(**object) # Raises exception if state is not in valid format

        # Check if we are in an MPC phase
        python_phases = [PHASE.GEN_DETECTIVE_KEYS_PY.value, PHASE.DETECTIVE_MPC_PY.value, PHASE.ANGEL_MAFIA_MPC_PY.value, PHASE.VOTE_MPC_PY.value]
        if state.global_enum not in python_phases:
          print(state.global_enum)
          raise ValueError("Not in MPC phase")
        num_players = 5 # num_players = state['num_players']

        # Generate detective key pair (if you are detective)
        if state.global_enum == PHASE.GEN_DETECTIVE_KEYS_PY.value:
            return generate_detective_key_pair, num_players, state
        # Detective chooses someone to reveal
        # Detective has input "0\n{index_to_detect(player_id)}"
        # And the rest of the players have "{Encrypt(secret_id)}\n{player_id}"
        elif state.global_enum == PHASE.DETECTIVE_MPC_PY.value:
            populate_inputs_from_state(state)
            return run_detective_protocol, num_players, state
        # Angel and Mafia choose someone to kill
        elif state.global_enum == PHASE.ANGEL_MAFIA_MPC_PY.value:
            populate_inputs_from_state(state)
            return run_angel_mafia_protocol, num_players, state
        # Everyone votes
        elif state.global_enum == PHASE.VOTE_MPC_PY.value:
            populate_inputs_from_state(state)
            return run_voting_protocol, num_players, state
    return None, 0, state


def check_state_metadata() -> Tuple[str, float]:
    """
    Checks hash and modified time of state file
    """
    mtime = os.path.getmtime(STATE_FILE)
    with open(STATE_FILE, 'r') as f:
        hash = hashlib.sha256(f.read().encode()).hexdigest()
        return hash, mtime

async def play_one_round():
    protocol, _, state = await populate_input_from_state()
    
    if protocol != None:
        print(f"Running protocol {state.global_enum}, protocol: {protocol.__name__}")

        # Run the MPC protocol for N players concurrently# Run the MPC protocol for N players concurrently    
        await protocol(state) # Run the protocol
        
        write_output_to_state(state)

async def main() -> None:
    """
    Poll for updates to state file and run MPC protocol when state changes.
    """
    poll_interval = 1 # seconds
    last_hash, last_mtime = check_state_metadata()
    while True:
        await asyncio.sleep(poll_interval)
        hash, mtime = check_state_metadata()
        # If state file changed, populate inputs from state and run protocol, then write back to state
        if mtime != last_mtime and hash != last_hash:
            print("State file changed, running protocol")
            # Update hash and mtime to most recent
            last_hash, last_mtime = check_state_metadata()
            
            try:
                await play_one_round()
            except ValueError:
                print("Not in MPC phase")
            

if __name__ == '__main__':
    asyncio.run(main())


def prime_state():
    with open(STATE_FILE, 'w') as f:
        temp_state = State(global_enum=PHASE.ROLE_DISTRIBUTION_JS, inputs={}, public_id_to_status={}, detective_public_key="", output="", private_id=0, detective_private_key=None).to_dict()
        json.dump(temp_state, f, indent=2)