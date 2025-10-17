#!/usr/bin/env bash

set -e

if command -v podman >/dev/null 2>&1; then
  echo "podman"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "docker"
  exit 0
fi

echo "Error: Neither podman nor docker is installed." >&2
echo "Please install either Podman or Docker to run the database." >&2
exit 1
