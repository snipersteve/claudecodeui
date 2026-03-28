#!/bin/bash
# Claude Code UI — source-managed startup script
LOG_DIR="/Users/steve/Documents/git/claudecodeui/tmp"
mkdir -p "$LOG_DIR"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1
export PATH="$HOME/.local/bin:$PATH"

# Prevent "cannot launch inside another Claude Code session" error
unset CLAUDECODE

cd /Users/steve/Documents/git/claudecodeui
exec node server/index.js >> "$LOG_DIR/claudecodeui.log" 2>&1
