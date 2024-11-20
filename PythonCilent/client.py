"""
Usage: python3 client.py <number of players>
number of players must be the same as compiled MP-SPDZ program
MUST BE RUN FROM MP-SPDZ DIRECTORY

Inputs are separated by spaces if the protocol expects multiple inputs
"""
import asyncio
import sys

MPC_DIRECTORY = '.'
NUM_PLAYERS = int(sys.argv[1])  # Expect number of players as argument 

def write_player_input(input_value, player_id):
    """
    Write this player's input to its designated input file.
    """
    input_file = f'{MPC_DIRECTORY}/Player-Data/Input-P{player_id}-0'
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
    # print(f"Error from MP-SPDZ (Player {player_id}): {stderr.decode()}")
    return output

async def main():
    # get program name from command line
    mpc_program = input("Enter the name of the MPC program: ")    

    # populate inputs
    inputs = [input(f"input for {i}: ") for i in range(NUM_PLAYERS)]
    for player_id, input_value in enumerate(inputs):
        write_player_input(input_value, player_id)

    # Run the MPC protocol for N players concurrently
    tasks = [run_mpc_protocol(mpc_program, player_id) for player_id in range(NUM_PLAYERS)]
    results = await asyncio.gather(*tasks)

    # Print the results
    for player_id, result in enumerate(results):
        print(f"Result for Player {player_id}: {result}")

if __name__ == '__main__':
    asyncio.run(main())


