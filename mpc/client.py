#!/usr/bin/env python3
"""
Usage: python3 client.py
Reads inputs from the state file and runs the MPC protocol using specified parameters in state.
Inputs in the state file are separated by spaces if the protocol expects multiple inputs
"""
import asyncio
import sys
import os
import json
import hashlib

MPC_DIRECTORY = os.environ.get("MP_SPDZ_HOME")
STATE_FILE = f'{MPC_DIRECTORY}/state.json'

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

async def run_mpc_protocol(mpc_program, player_id, num_players):
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

def verify_state(state):
  required = ['inputs', 'protocol', 'num_players']
  for field in required:
    if field not in state:
      raise ValueError(f"State file must contain field {field}")

async def populate_input_from_state():
    """
    Populate the input files for each player from the state file.
    """
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
        verify_state(state)
        for player_id, input_value in enumerate(state['inputs']):
            write_player_input(input_value, player_id)
        protocol = state['protocol']
        num_players = state['num_players']
        return protocol, num_players


async def write_output_to_state(result):
    """
    Write the output to the state file.
    """
    with open(STATE_FILE, 'r+') as f:
        state = json.load(f)
        state['output'] = result
        print(state)
        # Overwrite the file with the updated state
        f.seek(0)
        json.dump(state, f, indent=2)

def check_state():
    """
    Update hash and mtime of state file
    """
    mtime = os.path.getmtime(STATE_FILE)
    with open(STATE_FILE, 'r') as f:
        hash = hashlib.sha256(f.read().encode()).hexdigest()
        return hash, mtime

async def main():
    """
    Poll for updates to state file and run MPC protocol when state changes.
    """
    poll_interval = 1 # seconds
    last_hash, last_mtime = check_state()
    while True:
      await asyncio.sleep(poll_interval)
      hash, mtime = check_state()
      # If state file changed, populate inputs from state and run protocol, then write back to state
      if mtime != last_mtime and hash != last_hash:
        # Ensure all required fields are present in state file
        try:
          protocol, num_players = await populate_input_from_state()
          # Run the MPC protocol for N players concurrently
          tasks = [run_mpc_protocol(protocol, player_id, num_players) for player_id in range(num_players)]
          results = await asyncio.gather(*tasks)

          # Print the results and write back to state
          for player_id, result in enumerate(results):
              if player_id == 0:
                  print(f"Output is: \n{result}")
                  await write_output_to_state(result)

          # Update hash and mtime to most recent
          last_hash, last_mtime = check_state()
        except ValueError as e:
          continue

if __name__ == '__main__':
    asyncio.run(main())
