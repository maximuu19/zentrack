# 🖥️ ZenTrack Windows Native App

Transform your ZenTrack web app into a native Windows application using Electron!

## 🚀 Quick Start

### Option 1: Build Installer + Portable App
```bash
# Double-click this file:
build-windows-app.bat
```

### Option 2: Test in Development
```bash
# Double-click this file:
run-electron-dev.bat
```

### Option 3: Manual Commands
```bash
npm install
npm run build
npm run build:win
```

## 📦 What You Get

After building, you'll find in the `release/` folder:

1. **ZenTrack Setup 1.0.0.exe** - Full installer
   - Creates desktop shortcut
   - Adds to Start Menu
   - Registers file associations
   - Can be uninstalled normally

2. **ZenTrack-Portable-1.0.0.exe** - Portable version
   - No installation required
   - Can run from USB drive
   - Perfect for work computers
   - Self-contained executable

## ✨ Native Features

Your Windows app includes:

### 🎯 **Desktop Integration**
- ✅ Native Windows look and feel
- ✅ Desktop shortcut and Start Menu entry
- ✅ Windows taskbar integration
- ✅ File association support
- ✅ System notifications
- ✅ Auto-updater ready

### 📋 **Enhanced Menu System**
- **File Menu**: New Project, Import/Export, Exit
- **Edit Menu**: Undo, Redo, Cut, Copy, Paste
- **View Menu**: Zoom, Fullscreen, Developer Tools
- **Help Menu**: About, Documentation

### ⌨️ **Keyboard Shortcuts**
- `Ctrl+N` - New Project
- `Ctrl+I` - Import Data
- `Ctrl+E` - Export Data
- `Ctrl+Q` - Quit App
- `F11` - Toggle Fullscreen
- `Ctrl+R` - Reload App

### 💾 **Native File Operations**
- Native file dialogs for import/export
- Better file handling than web version
- Direct access to local filesystem
- No browser security restrictions

## 🔧 Development

### Prerequisites
- Node.js 16+ installed
- Windows 10/11 (for building Windows apps)

### Development Workflow
```bash
# 1. Install dependencies
npm install

# 2. Start web development server
npm run dev

# 3. Test Electron app (in another terminal)
npm run electron:dev

# 4. Build for production
npm run build:win
```

### Build Options
- `npm run electron` - Run Electron with current build
- `npm run pack` - Create unpacked app in `release/`
- `npm run build:win` - Build installer + portable
- `npm run build:portable` - Build only portable version

## 🎨 Customization

### App Icons
Replace icons in `electron/` folder:
- `icon.ico` - Windows executable icon
- `icon.png` - App window icon

### App Information
Edit `package.json` build section:
```json
{
  "build": {
    "appId": "com.yourcompany.zentrack",
    "productName": "Your App Name",
    "copyright": "Your Copyright",
    "win": {
      "publisherName": "Your Company"
    }
  }
}
```

### Window Settings
Edit `electron/main.js`:
```javascript
new BrowserWindow({
  width: 1400,     // Window width
  height: 900,     // Window height
  minWidth: 800,   // Minimum width
  minHeight: 600   // Minimum height
})
```

## 🚀 Distribution

### For Individual Users
1. **Portable Version**: Just send the `.exe` file
2. **Installer**: Send the setup file for full installation

### For Organizations
1. **MSI Package**: Use electron-builder with MSI target
2. **Auto-Updates**: Configure update server
3. **Code Signing**: Sign executables for security

### Example Distribution Commands
```bash
# Build for different architectures
npm run build:win -- --x64    # 64-bit
npm run build:win -- --ia32   # 32-bit
npm run build:win -- --arm64  # ARM64

# Build different package types
npm run build:win -- --win nsis    # Installer
npm run build:win -- --win portable # Portable
npm run build:win -- --win appx     # Microsoft Store
```

## 🔒 Security Features

- **No Node.js exposure** - Web content runs in isolated context
- **Context isolation** - Secure communication between processes
- **CSP headers** - Content Security Policy protection
- **External link handling** - Opens links in default browser
- **File system access** - Controlled through secure APIs

## 📱 Multi-Platform Support

Extend to other platforms:
```bash
# macOS (requires macOS to build)
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

## 🆘 Troubleshooting

### "electron command not found"
```bash
npm install
# or
npm install electron --save-dev
```

### "Build failed - icon not found"
- Add `icon.ico` to `electron/` folder
- Use 256x256 PNG converted to ICO format

### "App won't start"
- Check `npm run build` completed successfully
- Ensure `dist/` folder exists with built files
- Try `npm run electron:dev` for debugging

### "Import/Export not working"
- This is normal in web version due to browser security
- Native app has full file system access

## 🎯 Benefits Over Web Version

| Feature | Web Version | Native App |
|---------|-------------|------------|
| **Installation** | None required | One-click install |
| **File Access** | Limited | Full access |
| **Offline Use** | Limited | Complete |
| **Performance** | Good | Better |
| **Integration** | Basic | Full OS integration |
| **Updates** | Manual | Can be automatic |
| **Shortcuts** | Limited | Full keyboard support |
| **Menus** | Browser only | Native app menus |

---

**🎉 Your ZenTrack app is now a professional Windows application!**
