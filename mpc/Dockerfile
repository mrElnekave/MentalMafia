FROM python:3.10.3-bullseye

# Install dependencies
RUN apt-get update && apt-get -y install \
  libboost-dev \
  libboost-thread-dev \
  libboost-filesystem-dev \
  libboost-iostreams-dev \
  libclang-dev \
  libgmp-dev \
  libntl-dev \
  libsodium-dev \
  libssl-dev \
  libtool

# Setup work environment
ENV MP_SPDZ_HOME=/usr/src/MP-SPDZ
ENV LD_LIBRARY_PATH=$MP_SPDZ_HOME
WORKDIR $MP_SPDZ_HOME

# Create directories for MP-SPDZ files
RUN mkdir -p Programs/Schedules Programs/Bytecode Player-Data PythonClient

# Copy the compiled mascot-party.x binary
COPY mascot-party.x .
COPY libSPDZ.so .

# Make mascot-party.x executable and the spdz library readable
RUN chmod +x mascot-party.x
RUN chmod +rwx libSPDZ.so

# Copy the required schedule and bytecode files
COPY Programs/Schedules/*.sch ./Programs/Schedules/
COPY Programs/Bytecode/*.bc ./Programs/Bytecode/

# Copy Python client
COPY PythonClient/client.py ./PythonClient/
RUN chmod +x ./PythonClient/client.py

# Default entrypoint
ENTRYPOINT ["python3", "./PythonClient/client.py"]


# docker build -t yelnekave/mental-mafia-spdz .
# docker push yelnekave/mental-mafia-spdz
# docker pull yelnekave/mental-mafia-spdz
# docker run --rm -it yelnekave/mental-mafia-spdz 3
