#!/bin/bash

# List of Redis ports
REDIS_PORTS=(6379 6380 6381)

# Function to create necessary directories
create_directories() {
  echo "Creating necessary directories..."
  for port in "${REDIS_PORTS[@]}"; do
    mkdir -p ./data/$port/logs
  done
}

# Function to start Redis servers
start_redis_servers() {
  echo "Starting Redis servers..."
  for port in "${REDIS_PORTS[@]}"; do
    config_file="config/redis-${port}.conf"
    echo "Starting Redis server on port $port using config file $config_file..."
    redis-server $config_file &
    if [ $? -eq 0 ]; then
      echo "Successfully started Redis server on port $port."
    else
      echo "Failed to start Redis server on port $port."
    fi
  done
}

# Function to check if Redis servers are already running
check_redis_servers_running() {
  for port in "${REDIS_PORTS[@]}"; do
    redis-cli -p $port ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      return 0
    fi
  done
  return 1
}

# Function to shut down Redis servers
shutdown_redis_servers() {
  echo "Shutting down Redis servers..."
  for port in "${REDIS_PORTS[@]}"; do
    echo "Shutting down Redis server on port $port..."
    redis-cli -p $port shutdown
    if [ $? -eq 0 ]; then
      echo "Successfully shut down Redis server on port $port."
    else
      echo "Failed to shut down Redis server on port $port."
    fi
  done
}

# Function to check if Redis servers are shut down
check_redis_servers_shutdown() {
  echo "Checking if Redis servers are shut down..."
  for port in "${REDIS_PORTS[@]}"; do
    redis-cli -p $port ping > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      echo "Redis server on port $port is shut down."
    else
      echo "Redis server on port $port is still running."
    fi
  done
}

# Function to create Redis cluster
create_redis_cluster() {
  echo "Creating Redis cluster..."
  sleep 3 # Wait a bit to ensure Redis servers are fully started
  create_cluster_command="redis-cli --cluster create 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 --cluster-replicas 0"
  $create_cluster_command
  if [ $? -eq 0 ]; then
    echo "Redis cluster created successfully."
  else
    echo "Failed to create Redis cluster."
    exit 1
  fi
}

# Function to check if Redis cluster exists
check_redis_cluster_exists() {
  echo "Checking if Redis cluster exists..."
  for port in "${REDIS_PORTS[@]}"; do
    nodes=$(redis-cli -p $port cluster nodes)
    if [ -n "$nodes" ]; then
      echo "Redis cluster already exists on port $port."
      return 0
    fi
  done
  return 1
}

# Function to check if all nodes are connected to the same cluster
check_cluster_consistency() {
  echo "Checking cluster consistency..."
  cluster_ips_ports=""
  for port in "${REDIS_PORTS[@]}"; do
    ips_ports=$(redis-cli -p $port cluster nodes | awk '{print $2}' | sort)
    if [ -z "$cluster_ips_ports" ]; then
      cluster_ips_ports=$ips_ports
    else
      if [ "$cluster_ips_ports" != "$ips_ports" ]; then
        echo "Cluster information is inconsistent on port $port."
        return 1
      fi
    fi
  done
  echo "All nodes are connected to the same cluster."
  return 0
}

# Main script logic
case "$1" in
  start)
    if check_redis_servers_running; then
      echo "Redis servers are already running. Please shut them down first."
      exit 1
    fi

    create_directories
    start_redis_servers
    sleep 3 # Wait a bit to ensure Redis servers are fully started

    if ! check_cluster_consistency; then
      echo "Creating a new cluster..."
      create_redis_cluster
    fi
    ;;
  stop)
    shutdown_redis_servers
    ;;
  check-stop)
    check_redis_servers_shutdown
    ;;
  check-cluster)
    check_redis_cluster_exists
    ;;
  *)
    echo "Usage: $0 {start|stop|check-stop|check-cluster}"
    exit 1
    ;;
esac