#!/bin/bash
set -euo pipefail

VER="${QUARTO_VERSION:-1.8.24}"
echo "▶ Installing Quarto ${VER}..."
wget -q "https://github.com/quarto-dev/quarto-cli/releases/download/v${VER}/quarto-${VER}-linux-amd64.tar.gz" \
    -O /tmp/quarto.tar.gz
mkdir -p /opt/quarto
tar -xzf /tmp/quarto.tar.gz --strip-components=1 -C /opt/quarto
export PATH="/opt/quarto/bin:$PATH"

echo "▶ Quarto $(quarto --version)"
echo "▶ Rendering site..."
quarto render
