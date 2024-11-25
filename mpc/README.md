# README

## Build the docker container and run
```bash
docker build -t yelnekave/mental-mafia-spdz .
docker run --rm -it -v ./state.json:/usr/src/MP-SPDZ/state.json yelnekave/mental-mafia-spdz
```

Optionally publish the container to Docker Hub
```bash
docker push yelnekave/mental-mafia-spdz
```
