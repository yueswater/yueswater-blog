#!/bin/bash
set -e

QUARTO_VERSION="${QUARTO_VERSION:-1.8.24}"
INSTALL_DIR="$HOME/.local"
BIN_DIR="$INSTALL_DIR/bin"

echo "Installing Quarto v${QUARTO_VERSION}..."

wget -qO quarto.tar.gz \
  "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.tar.gz"

mkdir -p "$INSTALL_DIR"
tar -xzf quarto.tar.gz -C "$INSTALL_DIR"
rm quarto.tar.gz

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/quarto-${QUARTO_VERSION}/bin/quarto" "$BIN_DIR/quarto"
export PATH="$BIN_DIR:$PATH"

echo "Quarto installed: $(quarto --version)"
