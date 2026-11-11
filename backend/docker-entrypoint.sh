#!/bin/sh
set -eu

# Named volumes are mounted as root. Fix ownership of the shared data
# directory, then drop privileges before starting the API.
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"
chown -R appuser:appuser "$DATA_DIR"

exec gosu appuser "$@"
