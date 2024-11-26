FROM python:3.10.3-bullseye

ENV MP_SPDZ_HOME=/usr/src/MP-SPDZ
ENV LD_LIBRARY_PATH=$MP_SPDZ_HOME
WORKDIR $MP_SPDZ_HOME

RUN pip install eciespy typeguard

COPY Compiler/ ./Compiler
COPY compile.py .
COPY Source ./Programs/Source

RUN for file in Programs/Source/*.mpc; do ./compile.py $file; done

COPY mascot-party.x libSPDZ.so client.py ./

ENTRYPOINT ["python3", "client.py"]

# docker build -t mental-mafia .
# docker run --rm -it -v ./state.json:/usr/src/MP-SPDZ/state.json mental-mafia
