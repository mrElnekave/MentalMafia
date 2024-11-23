

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