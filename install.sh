#!/bin/bash

echo "================================================"
echo "  ZenTrack - Minimalist Project Tracker"
echo "  Easy Installation Script for Mac/Linux"
echo "================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org/"
    echo "2. Download and install the LTS version"
    echo "3. Run this script again"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Node.js is installed: $(node --version)"

echo
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to install dependencies!"
    echo "Try running: npm cache clean --force"
    read -p "Press Enter to exit..."
    exit 1
fi

echo
echo "================================================"
echo "  Installation Complete!"
echo "================================================"
echo
echo "To start the app, run: npm start"
echo "Or double-click the 'start.sh' file"
echo
echo "The app will open in your browser at:"
echo "http://localhost:5173"
echo
read -p "Press Enter to continue..."
