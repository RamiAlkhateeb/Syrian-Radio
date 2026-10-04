#!/bin/sh
set -eu

# Shared Nxt.UI components live in a git submodule.
git submodule update --init --recursive

curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh -c 10.0 -InstallDir ./dotnet
./dotnet/dotnet publish -c Release -o output
