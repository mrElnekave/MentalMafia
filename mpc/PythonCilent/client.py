#!/usr/bin/env python3
"""
Usage: client.py <number of players>
number of players must be the same as compiled MP-SPDZ program
MUST BE RUN FROM MP-SPDZ DIRECTORY

Inputs are separated by spaces if the protocol expects multiple inputs
"""
import asyncio
import subprocess
import sys
import os
import security as sec
import json


from enum import Enum

class State(Enum):
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


STATE_FILE_PATH = '../../state.json'
MPC_DIRECTORY = '.'
NUM_PLAYERS = int(sys.argv[1])  # Expect number of players as argument 

# 0,1 = Townsperson, 2 = Mafia, 3 = Angel, 4 = Detective
ROLES_FROM_SID = {
    0: "Townsperson",
    1: "Townsperson",
    2: "Mafia",
    3: "Angel",
    4: "Detective"
}
SID_FROM_ROLES = {
    "Townsperson": [0, 1],
    "Mafia": [1],
    "Angel": [2],
    "Detective": [3]
}

# My state
state = State.INIT_JS
secret_id = None
player_id = None
living = [1 * NUM_PLAYERS] # indexed by player_id
# end state

def write_player_input(input_value, player_id):
    """
    Write this player's input to its designated input file.
    """
    input_file = f'{MPC_DIRECTORY}/Player-Data/Input-P{player_id}-0'
    os.makedirs(os.path.dirname(input_file), exist_ok=True)

    with open(input_file, 'w') as f:
        for val in input_value.split(" "):
            f.write(str(val))
            f.write("\n")

async def run_mpc_protocol(mpc_program, player_id):
    """
    Run the add MPC program with MP-SPDZ for N players.
    """
    command = [f'{MPC_DIRECTORY}/mascot-party.x', mpc_program, '-N', f'{NUM_PLAYERS}', '-p', str(player_id)]
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
    # print(f"Output from MP-SPDZ (Player {player_id}): {output}")
    print(f"Error from MP-SPDZ (Player {player_id}): {stderr.decode()}")
    return output

async def get_result_from_mpc_protocol(mpc_program):
    tasks = [run_mpc_protocol(mpc_program, i) for i in range(NUM_PLAYERS)]
    results = await asyncio.gather(*tasks)
    return results[0]

def populate_input_from_state():
    """
    Populate the input files for each player from the state file.
    Returns the input mapping (secret_id : input_val)
    """
    try:
        # Open and load the state file
        with open(STATE_FILE_PATH, 'r') as f:
            state = json.load(f)
        # Set the return value to the input mapping
        inputs_mapping = state.get('inputs', {})
        # Error check
        if not isinstance(inputs_mapping, dict):
            print("Invalid format for inputs. Should be a map")
        # Return the input map
        return inputs_mapping
    except Exception as e:
        print(f"An error occured: {e}")

def write_output_to_state(result):
    """
    Write the output to the state file.
    Returns true if the write was successful, false if an error occured
    """
    try:
        # Open and load the current state of the JSON
        with open(STATE_FILE_PATH, 'r') as f:
            state = json.load(f)
        # Set the output entry to your result
        state['output'] = result
        # Update the state file
        with open(STATE_FILE_PATH, 'w') as f:
            json.dump(state, f, indent=2)
        return True
    # If an error occured, throw this message
    except Exception as e:
        print(f"An error occured with the state file: {e}" )
        return False

def change_global_enum(phase):
    """
    Updates the global enum in the state.json file
    """
    try: 
        with open(STATE_FILE_PATH, 'r') as f:
            state = json.load(f)
        state['global_enum'] = phase
        with open(STATE_FILE_PATH, 'w') as f:
            json.dump(state, f, indent=2)
        return True
    except Exception as e:
        print("Error occured changing the enum")


def send_detective_public_key():
    """SHOULD ONLY BE RUN BY DETECTIVE"""
    sec.generate_detective_key_pair()
    sec.populate_detective_sk()
    sec.populate_detective_pk()
    
    # put the public key in the input and perfor an AAB
    
async def run_detective_protocol():
    populate_input_from_state()
    # Set up playerdata such that the
    # detective has input "0\n{index_to_detect(player_id)}"
    # And the rest of the players have "{Encrypt(secret_id)}\n{player_id}"
    result_for_detective = get_result_from_mpc_protocol("anon_reveal")

    # If I am the detective, write out to my state file
    sec.decrypt_with_private_key(result_for_detective)
    
    write_output_to_state()
    
async def run_angel_mafia_protocol():
    populate_input_from_state()
    # The first input is relevant to the angels save
    # Angel puts player_id to save all others 0
    # Second input (second line) is what mafia kills
    # Angel puts player_id to save all others 0
    
    result_for_everyone = get_result_from_mpc_protocol("angel_mafia")
    
    # do logic to figure out who died or if no-one died, update state
    # update living list if necessary    

    write_output_to_state()

async def run_voting_protocol():
    populate_input_from_state()
    # Get everyones votes and put it in the right player_data
    
    voted_out_or_not = get_result_from_mpc_protocol("daytime_vote")
    
    # do logic to figure out who died or if no-one died, update state
    # update living list if necessary    

    write_output_to_state()

async def test_main():
    # ---------------------------------------------------------
    # get program name from command line
    mpc_program = input("Enter the name of the MPC program: ")    

    # populate inputs
    inputs = [input(f"input for {i}: ") for i in range(NUM_PLAYERS)]
    for player_id, input_value in enumerate(inputs):
        write_player_input(input_value, player_id)
    # ---------------------------------------------------------
    # Replace the above with populate_input_from_state()

    # Run the MPC protocol for N players concurrently
    tasks = [run_mpc_protocol(mpc_program, player_id) for player_id in range(NUM_PLAYERS)]
    results = await asyncio.gather(*tasks)

    # Print the results
    for player_id, result in enumerate(results):
        if player_id == 0:
            print(f"Output is: \n{result}")
            write_output_to_state(result)

async def main():
    # look at the state of the file, see if it is the turn of the mpc to go
    while 1:
        populate_input_from_state()
        if state == State.ROLE_ACCEPT_PY:
            pass
        elif 1:
            pass
    pass

if __name__ == '__main__':
    asyncio.run(test_main())
    # asyncio.run(main())


