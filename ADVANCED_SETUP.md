# Advanced Installation Options

## Option 1: Create Desktop Executable (Windows)

To create a standalone desktop app that doesn't require installing Node.js:

1. Install electron globally:
   ```bash
   npm install -g electron electron-builder
   ```

2. Add to package.json dependencies:
   ```json
   "electron": "^latest",
   "electron-builder": "^latest"
   ```

3. Create electron-main.js in project root:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   
   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: true
       }
     });
     
     win.loadFile('dist/index.html');
   }
   
   app.whenReady().then(createWindow);
   ```

4. Build and package:
   ```bash
   npm run build
   electron-builder
   ```

## Option 2: Docker Container

For ultimate portability across any system:

1. Create Dockerfile:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5173
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t zentrack .
   docker run -p 5173:5173 zentrack
   ```

## Option 3: Static Build for Any Web Server

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to any web hosting service
3. No server-side requirements needed

## Option 4: PWA (Progressive Web App)

Add PWA capabilities so users can "install" it from their browser:

1. Add to vite.config.ts:
   ```javascript
   import { VitePWA } from 'vite-plugin-pwa'
   
   plugins: [
     VitePWA({
       registerType: 'autoUpdate',
       workbox: {
         globPatterns: ['**/*.{js,css,html,ico,png,svg}']
       }
     })
   ]
   ```

This would make your app installable directly from the browser!
