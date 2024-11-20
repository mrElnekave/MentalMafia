# Use Ubuntu as the base image
FROM ubuntu:latest

RUN apt-get update && apt-get -y install \
        python3 \
        libboost-dev \
        libboost-thread-dev \
        libclang-dev \
        libgmp-dev \
        libntl-dev \
        libsodium-dev \
        libssl-dev \
        libtool 


RUN apt-get -y install \
    libboost-filesystem-dev \
    libboost-iostreams-dev

# Create directories for MP-SPDZ files
RUN mkdir -p /mp-spdz/Programs/Schedules /mp-spdz/Programs/Bytecode

# Copy the compiled mascot-party.x binary
COPY mascot-party.x /mp-spdz/
COPY libSPDZ.so /mp-spdz/

# Copy the required schedule and bytecode files
COPY Programs/Schedules/*.sch /mp-spdz/Programs/Schedules/
COPY Programs/Bytecode/*-0.bc /mp-spdz/Programs/Bytecode/

RUN mkdir PythonClient Player-Data

COPY PythonClient/client.py /mp-spdz/PythonClient/

# Set the working directory
WORKDIR /mp-spdz

# Make mascot-party.x executable and the spdz library readable
RUN chmod +x /mp-spdz/mascot-party.x
RUN chmod +rwx /mp-spdz/libSPDZ.so

ENV LD_LIBRARY_PATH=/mp-spdz


# Default entrypoint
ENTRYPOINT ["/mp-spdz/PythonClient/client.py"]


# docker build -t yelnekave/mental-mafia-spdz .
# docker push yelnekave/mental-mafia-spdz
# docker pull yelnekave/mental-mafia-spdz
# docker run --rm -it yelnekave/mental-mafia-spdz 3
