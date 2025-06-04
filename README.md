# 🎯 ZenTrack - Minimalist Project Tracker

<div align="center">

![ZenTrack Logo](https://img.shields.io/badge/ZenTrack-Project%20Tracker-blue?style=for-the-badge&logo=task&logoColor=white)

**A clean, intuitive, and truly portable project management tool for organizing tasks and tracking progress.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-33-lightblue.svg)](https://www.electronjs.org/)

[📥 Download](#-download) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 🎯 **Ready-to-Use Portable Version**

### 📁 **Get the Truly Portable ZenTrack**

**Want to use ZenTrack immediately without any setup?** The fully portable version is available here:

```
📂 Location: D:\ZenTrack-Portable-Final\
📱 Usage: Copy the entire folder anywhere and run ZenTrack.exe
💾 Data Storage: All your projects are saved in the 'data' folder next to the app
🚀 Zero Setup: No installation required - runs from USB drives, network drives, anywhere!
```

**Key Benefits:**
- ✅ **100% Portable** - Copy to USB drive, cloud storage, or any computer
- ✅ **Data Persistence** - All projects automatically saved in local `data/` folder
- ✅ **No Installation** - Just run `ZenTrack.exe` and start working
- ✅ **Cross-Device** - Take your projects anywhere, work offline completely

### 📋 **How to Use:**
1. Copy the `ZenTrack-Portable-Final` folder to your desired location
2. Double-click `ZenTrack.exe` to start
3. Your projects will be automatically saved in the `data/` folder
4. Copy the entire folder to move between computers/devices

---

## ✨ Features

### 🎯 **Core Functionality**
- 📋 **Project Management** - Create and organize multiple projects with ease
- ✅ **Task Tracking** - Add tasks, subtasks, and track completion status
- 📊 **Progress Visualization** - Real-time progress bars and status indicators
- 🔄 **Multiple Views** - Switch between List, Canvas, and Timeline views

### 💾 **Portable Data Storage**
- 🚀 **True Portability** - Run from USB drive with all data stored alongside the app
- 🔄 **Auto-Backup** - Automatic daily backups of your project data
- 📤 **Import/Export** - Easy data transfer between devices and backup creation
- 🌐 **Hybrid Storage** - Falls back to browser storage when not in portable mode

### 🔐 **Admin Features**
- 👤 **User Management** - Admin login system for advanced controls
- 🛡️ **Data Protection** - Secure project data with admin authentication
- 🔧 **System Management** - Full reset and admin account creation tools

### 🎨 **User Experience**
- 🎯 **Minimalist Design** - Clean, distraction-free interface
- ⚡ **Fast Performance** - Built with modern React and TypeScript
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- 🌙 **No Internet Required** - Fully offline-capable application

---

## 📥 Download

### 🪟 Windows (Recommended)
- **[ZenTrack Portable](./release/ZenTrack-Portable-1.0.0.exe)** - No installation required, runs from anywhere
- **[ZenTrack Installer](./release/ZenTrack%20Setup%201.0.0.exe)** - Traditional Windows installer

### 🌐 Web Version
Access ZenTrack directly in your browser at your localhost after following the [development setup](#-development-setup).

---

## 🚀 Quick Start

### Option 1: Portable Windows App (Easiest) 🏆
1. Download **ZenTrack-Portable-1.0.0.exe**
2. Run the executable from anywhere (USB drive, desktop, etc.)
3. Your data is automatically stored in a `data/` folder next to the app
4. **That's it!** No installation, no setup, truly portable.

### Option 2: Development/Web Version
```bash
# Clone the repository
git clone https://github.com/maximuu19/zentrack-minimalist-project-tracker.git
cd zentrack-minimalist-project-tracker

# Quick setup and start
npm run setup && npm start
```

### Option 3: Work/Restricted Environments 🏢
**No Node.js installation required!**
1. Double-click `run-on-work-laptop.bat`
2. App opens in browser automatically
3. See `WORK_LAPTOP_GUIDE.md` for details

---

## �️ Development Setup

### Prerequisites
- **Node.js** 16.0.0+ ([Download here](https://nodejs.org/))
- **npm** 7.0.0+
- **Git** ([Download here](https://git-scm.com/))

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/maximuu19/zentrack-minimalist-project-tracker.git
cd zentrack-minimalist-project-tracker

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

### 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run build:electron` | Build portable Windows app |
| `npm run preview` | Preview production build |
| `npm run setup` | Install dependencies |
| `npm run clean` | Clean install |

---

## 💾 Data Storage & Portability

### 🚀 Portable Mode (Windows App)
- **Location**: `data/` folder next to the executable
- **Structure**:
  ```
  ZenTrack-Portable-1.0.0.exe
  data/
  ├── current/
  │   ├── projects.json
  │   └── settings.json
  ├── backups/
  │   └── [daily backups]
  └── exports/
      └── [manual exports]
  ```
- **Auto-Backup**: Daily backups kept for 7 days
- **Migration**: Copy the entire `data/` folder to transfer between computers

### 🌐 Browser Mode (Web Version)
- **Location**: Browser's IndexedDB storage
- **Fallback**: Automatically used when not running as Electron app
- **Transfer**: Use Export/Import features to backup or transfer data

---

## 📖 Documentation

### 🎯 Using ZenTrack

1. **Creating Projects**
   - Click the "+" button in the header
   - Fill in project name and description
   - Add custom colors and priority levels

2. **Managing Tasks**
   - Click on any project to view its tasks
   - Add tasks with descriptions, due dates, and priorities
   - Create subtasks for complex workflows
   - Track completion with progress indicators

3. **Different Views**
   - **List View**: Traditional task list with filters
   - **Canvas View**: Visual board with drag-and-drop
   - **Timeline View**: Gantt-style timeline display

4. **Data Management**
   - **Export**: Create JSON backups of all your data
   - **Import**: Restore data from previous exports
   - **Reset**: Admin can reset entire application

### 🔐 Admin Features

Default admin credentials:
- Username: `admin` | Password: `password123`
- Username: `editor` | Password: `editpass`

Admin capabilities:
- Full application reset
- Custom admin account creation
- System data management
- Enhanced export/import controls

---

## 🏗️ Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Hooks** for state management

### Backend/Storage
- **Electron** for native Windows app
- **Node.js** backend with file-based JSON storage
- **IndexedDB** fallback for browser mode
- **IPC Bridge** for secure frontend-backend communication

### Build System
- **electron-builder** for creating portable executables
- **Vite** for optimized web builds
- **TypeScript** for type safety
- **ESLint** for code quality

---

## 🛠️ Troubleshooting

### Common Issues

**"npm not found" or "node not found"**
```bash
# Install Node.js from nodejs.org and restart terminal
node --version  # Should show 16.0.0+
npm --version   # Should show 7.0.0+
```

**Electron app won't start**
```bash
# Rebuild native dependencies
npm run clean && npm install
npm run build:electron
```

**Data not persisting**
- **Portable mode**: Check if `data/` folder has write permissions
- **Browser mode**: Check if browser storage is enabled
- **Admin mode**: Ensure admin login is successful

**Build fails**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add TypeScript types for new features
- Test both browser and Electron modes
- Update documentation for new features

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**[maximuu19](https://github.com/maximuu19)**

- GitHub: [@maximuu19](https://github.com/maximuu19)
- Project Link: [ZenTrack Minimalist Project Tracker](https://github.com/maximuu19/zentrack-minimalist-project-tracker)

---

## � Acknowledgments

- Built with modern web technologies for maximum compatibility
- Inspired by the need for truly portable project management tools
- Special thanks to the open-source community for the amazing tools and libraries

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

*ZenTrack - Where productivity meets simplicity* 🎯

</div>
