#!/usr/bin/env bash
# Galaxy install script for SIFT Workstation.
# Usage: curl -fsSL https://raw.githubusercontent.com/<your-user>/galaxy/main/install.sh | bash

set -euo pipefail

GALAXY_VERSION="${GALAXY_VERSION:-0.1.0}"
GALAXY_BIN_DIR="${GALAXY_BIN_DIR:-/usr/local/bin}"
GALAXY_CONFIG_DIR="${GALAXY_CONFIG_DIR:-$HOME/.galaxy}"

color_blue() { printf "\033[34m%s\033[0m" "$1"; }
color_green() { printf "\033[32m%s\033[0m" "$1"; }
color_red() { printf "\033[31m%s\033[0m" "$1"; }

echo "$(color_blue "Galaxy installer") — version $GALAXY_VERSION"
echo

# Pre-flight checks.
if ! command -v go >/dev/null 2>&1; then
  echo "$(color_red "[error]") Go 1.21+ is required but not installed."
  echo "  Install with: sudo apt-get install golang-go"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "$(color_red "[error]") Node 20+ is required for the investigator agent."
  echo "  Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi

if ! command -v vol >/dev/null 2>&1 && ! command -v vol3.py >/dev/null 2>&1; then
  echo "$(color_red "[warning]") Volatility 3 not detected. Galaxy still installs, but the investigator will not be able to run memory analysis until Volatility is available."
fi

# Build.
echo "$(color_blue "[1/4]") Building galaxy CLI..."
go build -o galaxy .

echo "$(color_blue "[2/4]") Installing binary to $GALAXY_BIN_DIR..."
sudo install -m 0755 galaxy "$GALAXY_BIN_DIR/galaxy"

echo "$(color_blue "[3/4]") Setting up config dir at $GALAXY_CONFIG_DIR..."
mkdir -p "$GALAXY_CONFIG_DIR"
chmod 0700 "$GALAXY_CONFIG_DIR"

echo "$(color_blue "[4/4]") Installing investigator agent dependencies..."
cd agents/investigator
npm install --silent
cd -

echo
echo "$(color_green "Galaxy installed.")"
echo
echo "  Binary: $GALAXY_BIN_DIR/galaxy"
echo "  Config: $GALAXY_CONFIG_DIR"
echo
echo "  Next: galaxy demo  — run a fixture investigation"
echo "        galaxy investigate --evidence <path>  — investigate real evidence"
echo
