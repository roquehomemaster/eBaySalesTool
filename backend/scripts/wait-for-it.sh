#!/usr/bin/env bash

# wait-for-it.sh -- A script to wait for a service to become available

set -e

hostport="$1"
shift
cmd="$@"

host="$(echo "$hostport" | cut -d: -f1)"
port="$(echo "$hostport" | cut -d: -f2)"

while ! nc -z "$host" "$port"; do
  echo "Waiting for $host:$port to be available..."
  sleep 1
done

echo "$host:$port is available. Starting the application..."
exec $cmd