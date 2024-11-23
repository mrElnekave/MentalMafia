#!/bin/bash

# Function to kill any processes running on a specified port
kill_process_on_port() {
  PORT=$1
  PID=$(lsof -t -i :$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)..."
    kill -9 $PID
  else
    echo "No process running on port $PORT."
  fi
}

# Function to start a React instance on a specified port
start_react_instance() {
  PORT=$1
  echo "Starting React frontend on port $PORT..."
  PORT=$PORT npm start > "port_$PORT.log" 2>&1 &
  echo "Check logs: port_$PORT.log"
}

# List of ports to clean and start React on
PORTS=(3000 3006 3003 3004 3005)

# Kill existing processes on the specified ports
for PORT in "${PORTS[@]}"; do
  kill_process_on_port $PORT
done

# Start React instances on the specified ports
for PORT in "${PORTS[@]}"; do
  start_react_instance $PORT
done

# Wait a bit for all instances to start
sleep 7

echo "All frontend instances are starting. Check your browser at:"
for PORT in "${PORTS[@]}"; do
  echo "http://localhost:$PORT"
done
