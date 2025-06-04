#!/bin/bash

echo "Starting ZenTrack..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Installing..."
    npm install
    echo
fi

echo "Opening ZenTrack in your browser..."
echo "Press Ctrl+C to stop the server"
echo

npm start
