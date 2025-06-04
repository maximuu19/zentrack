#!/usr/bin/env python3
"""
Simple HTTP server for ZenTrack
Works on any computer with Python (most have it pre-installed)
No installation or admin rights required!
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
DIRECTORY = "dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add headers to prevent caching issues
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Check if dist directory exists
    if not os.path.exists(DIRECTORY):
        print(f"❌ Error: '{DIRECTORY}' directory not found!")
        print("Please make sure you have the built version of ZenTrack.")
        print("Run 'npm run build' first if you have the source code.")
        sys.exit(1)
    
    # Find available port
    port = PORT
    while port < PORT + 10:
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                print("=" * 50)
                print("🎯 ZenTrack Server Starting...")
                print("=" * 50)
                print(f"📁 Serving directory: {DIRECTORY}")
                print(f"🌐 Server running at: http://localhost:{port}")
                print(f"🖥️  Open your browser to: http://localhost:{port}")
                print()
                print("💡 Tips:")
                print("   - Bookmark the URL for easy access")
                print("   - Works offline after first load")
                print("   - Press Ctrl+C to stop the server")
                print("=" * 50)
                
                # Try to open browser automatically
                try:
                    webbrowser.open(f'http://localhost:{port}')
                    print("✅ Browser opened automatically!")
                except:
                    print("⚠️  Please open your browser manually")
                
                print("🚀 ZenTrack is now running!")
                httpd.serve_forever()
                
        except OSError:
            port += 1
            continue
        break
    else:
        print(f"❌ Could not find an available port starting from {PORT}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 ZenTrack server stopped. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure Python is installed and try again.")
        sys.exit(1)
