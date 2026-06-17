#!/bin/bash

# Navigate to the correct web directory
cd /Users/robertle/salesagentic_web

# Source Node Version Manager (NVM) to fix the 'npm not found' error
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Start the Command Center interface
echo "[!] Booting up SalesAgentic.AI Command Center..."
npm run dev
