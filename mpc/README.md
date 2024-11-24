

## Recompile the mental mafia mpc
```bash
docker build -t yelnekave/mental-mafia-spdz .
docker push yelnekave/mental-mafia-spdz
```

## Pull the image from docker hub and run

```bash
docker pull yelnekave/mental-mafia-spdz
docker run --rm -it yelnekave/mental-mafia-spdz 3
```

## Running docker compose

Option 1: Modify the docker-compose file "command" to set the desired number of parties and protocol

Then run

```bash
docker compose up
```

Option 2: Run dynamic arguments with docker compose run

```bash
docker compose run client [NPARTIES] [PROTOCOL]
```
