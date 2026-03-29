#!/bin/bash
# Claude Code UI — process management
APP_DIR="/Users/steve/Documents/git/claudecodeui"
LOG_DIR="$APP_DIR/tmp"
PID_FILE="$LOG_DIR/claudecodeui.pid"

mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Already running (PID $(cat "$PID_FILE"))"
  exit 0
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1
export PATH="$HOME/.local/bin:$PATH"
unset CLAUDECODE

cd "$APP_DIR"
node server/index.js >> "$LOG_DIR/claudecodeui.log" 2>&1 &
echo $! > "$PID_FILE"
echo "Started (PID $!)"
