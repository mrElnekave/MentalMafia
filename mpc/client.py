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
from dataclasses import dataclass
from ecies.utils import generate_key
from ecies import encrypt, decrypt
from coincurve.keys import PublicKey, PrivateKey
from typeguard import typechecked
import os
import json
import hashlib
from enum import Enum
from typing import List, Dict, Annotated, Literal, Tuple

MPC_DIRECTORY = os.environ.get("MP_SPDZ_HOME")
STATE_FILE = f'{MPC_DIRECTORY}/state.json'

# Type the current phase a.k.a. "global_enum"
class PHASE(Enum):
    # SETUP GAME
    INIT_JS = 0
    ROLE_DISTRIBUTION_JS = 1
    ROLE_ACCEPT_PY = 2
    GEN_DETECTIVE_KEYS_PY = 3
    POPULATE_KEYS_JS = 4
    EVERYONE_ACCEPT_DETECTIVE_PK_PY = 5
    # GAMEPLAY
    DETECTIVE_CHOICE_JS = 6
    DETECTIVE_MPC_PY = 7
    ANGEL_MAFIA_CHOICE_JS = 8
    ANGEL_MAFIA_MPC_PY = 9
    TALK_JS = 10
    VOTE_MPC_PY = 11
    GAME_OVER_ADMISSION_JS = 12
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
  detective_public_key: PublicKey       # detective's public key
  output: str                           # output of the MPC phases
  # PERSONAL STATE (unique to each individual)
  private_id: ID                        # private id (maps to role)
  detective_private_key: PrivateKey     # detective's private key (only detective has this)

def generate_detective_key_pair() -> Tuple[PublicKey, PrivateKey]:
    """
    Generate an secp256k1 key pair for the detective.
    """
    secp_k = generate_key()
    return secp_k.public_key, secp_k

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

async def populate_input_from_state() -> Tuple[MPC_PROTOCOL | None, int] :
    """
    Populate the input files for each player from the state file.
    """
    with open(STATE_FILE, 'r') as f:
        # Load and verify state is in acceptable format
        object = json.load(f)
        state = State(**object) # Raises exception if state is not in valid format

        # Check if we are in an MPC phase
        python_phases = [PHASE.ROLE_ACCEPT_PY, PHASE.GEN_DETECTIVE_KEYS_PY, PHASE.EVERYONE_ACCEPT_DETECTIVE_PK_PY, PHASE.DETECTIVE_MPC_PY, PHASE.ANGEL_MAFIA_MPC_PY, PHASE.VOTE_MPC_PY]
        if state.global_enum not in python_phases:
          raise ValueError(f"Not in MPC phase")
        num_players = 5 # num_players = state['num_players']

        # TODO: Handle write_player_input for each of these cases
        # Handle role assignment phase
        if state.global_enum == PHASE.ROLE_ACCEPT_PY:
            write_player_input(f"{player_id}\n0", player_id)
            return MPC_PROTOCOL.ASSIGN_ROLES, num_players
        # Generate detective key pair (if you are detective)
        elif state.global_enum == PHASE.GEN_DETECTIVE_KEYS_PY:
          if ROLES_FROM_SID[state.private_id] == ROLE.DETECTIVE:
            pk, sk = generate_detective_key_pair()
            state.detective_public_key = pk
            state.detective_private_key = sk
            await write_output_to_state(state)
        # Everyone receives detective's public key
        elif state.global_enum == PHASE.EVERYONE_ACCEPT_DETECTIVE_PK_PY:
          for player_id in range(num_players):
            if ROLES_FROM_SID[state.private_id] != ROLE.DETECTIVE:
              input_value = "0"
              write_player_input(input_value, player_id)
            else:
              input_value = f"{player_id}\n{state.detective_public_key}" # TODO: work on handling input logic
              write_player_input(input_value, player_id)
          return MPC_PROTOCOL.BROADCAST, num_players
        # Detective chooses someone to reveal
        elif state.global_enum == PHASE.DETECTIVE_MPC_PY:
            write_player_input(f"{player_id}\n{state.inputs[player_id]}", player_id)
            return MPC_PROTOCOL.DETECTIVE, num_players
        # Angel and Mafia choose someone to kill
        elif state.global_enum == PHASE.ANGEL_MAFIA_MPC_PY:
            write_player_input(f"{player_id}\n{state.inputs[player_id]}", player_id)
            return MPC_PROTOCOL.ANGEL_MAFIA, num_players
        # Everyone votes
        elif state.global_enum == PHASE.VOTE_MPC_PY:
            write_player_input(f"{player_id}\n{state.inputs[player_id]}", player_id)
            return MPC_PROTOCOL.DAYTIME_VOTE, num_players
    return None, 0

async def write_output_to_state(state: State):
    """
    Write the output to the state file.
    """
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

async def run_detective_protocol():
    # Set up playerdata such that the
    # detective has input "0\n{index_to_detect(player_id)}"
    # And the rest of the players have "{Encrypt(secret_id)}\n{player_id}"

    # If I am the detective, write out to my state file



async def run_angel_mafia_protocol():
    # The first input is relevant to the angels save
    # Angel puts player_id to save all others 0
    # Second input (second line) is what mafia kills
    # Angel puts player_id to save all others 0


    # do logic to figure out who died or if no-one died, update state
    # update living list if necessary


async def run_voting_protocol(state):
    # Get everyones votes and put it in the right player_data


    # do logic to figure out who died or if no-one died, update state
    # update living list if necessary


def check_state_metadata() -> Tuple[str, float]:
    """
    Checks hash and modified time of state file
    """
    mtime = os.path.getmtime(STATE_FILE)
    with open(STATE_FILE, 'r') as f:
        hash = hashlib.sha256(f.read().encode()).hexdigest()
        return hash, mtime

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
        # Update hash and mtime to most recent
        last_hash, last_mtime = check_state_metadata()

        # Ensure all required fields are present in state file
        try:
          protocol, num_players = await populate_input_from_state()
          # Run the MPC protocol for N players concurrently
          if protocol is not None:
            tasks = [run_mpc_protocol(protocol, player_id, num_players) for player_id in range(num_players)]
            results = await asyncio.gather(*tasks)

            # Print the results and write back to state
            for player_id, result in enumerate(results):
                if player_id == 0:
                    print(f"Output is: \n{result}")
                    await write_output_to_state(result)
        except ValueError as e:
          continue

if __name__ == '__main__':
    asyncio.run(main())
