import { Project } from './types';

// Portable storage interface - will be injected by Electron
interface ElectronAPI {
  storage: {
    saveProjects: (projects: Project[]) => Promise<{success: boolean; error?: string}>;
    loadProjects: () => Promise<{success: boolean; data?: Project[]; error?: string}>;
    saveSettings: (settings: any) => Promise<{success: boolean; error?: string}>;
    loadSettings: () => Promise<{success: boolean; data?: any; error?: string}>;
    exportData: () => Promise<{success: boolean; data?: string; error?: string}>;
    importData: (data: string) => Promise<{success: boolean; error?: string}>;
    isPortable: () => Promise<{success: boolean; data?: boolean; error?: string}>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Fallback to IndexedDB if not in Electron
const isElectronAvailable = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

// Storage abstraction layer
export class StorageManager {
  private static instance: StorageManager;
  private isPortableMode = false;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async initialize(): Promise<void> {
    if (isElectronAvailable()) {
      const result = await window.electronAPI!.storage.isPortable();
      this.isPortableMode = result.success ? (result.data || false) : false;
      console.log('Storage mode:', this.isPortableMode ? 'Portable' : 'IndexedDB');
    } else {
      console.log('Storage mode: IndexedDB (web)');
    }
  }

  async saveProjects(projects: Project[]): Promise<void> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.saveProjects(projects);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save projects');
      }
    } else {
      // Fallback to existing IndexedDB implementation
      const { saveProjectsToDB } = await import('./db');
      return await saveProjectsToDB(projects);
    }
  }

  async loadProjects(): Promise<Project[] | null> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.loadProjects();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load projects');
      }
      return result.data || null;
    } else {
      // Fallback to existing IndexedDB implementation
      const { getProjectsFromDB } = await import('./db');
      return await getProjectsFromDB();
    }
  }

  async saveSettings(settings: any): Promise<void> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.saveSettings(settings);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
    } else {
      // Fallback to existing IndexedDB implementation
      if (settings.adminStatus !== undefined) {
        const { saveAdminLoginStatusToDB } = await import('./db');
        await saveAdminLoginStatusToDB(settings.adminStatus);
      }
      if (settings.customAdminUser) {
        const { saveCustomAdminUserToDB } = await import('./db');
        await saveCustomAdminUserToDB(settings.customAdminUser);
      }
    }
  }

  async loadSettings(): Promise<any> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.loadSettings();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load settings');
      }
      return result.data || { adminStatus: false, customAdminUser: null };
    } else {
      // Fallback to existing IndexedDB implementation
      const { getAdminLoginStatusFromDB, getCustomAdminUserFromDB } = await import('./db');
      const adminStatus = await getAdminLoginStatusFromDB();
      const customAdminUser = await getCustomAdminUserFromDB();
      return { adminStatus, customAdminUser };
    }
  }

  async exportData(): Promise<string> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.exportData();
      if (!result.success) {
        throw new Error(result.error || 'Failed to export data');
      }
      return result.data || '{}';
    } else {
      // Fallback implementation
      const projects = await this.loadProjects();
      const settings = await this.loadSettings();
      return JSON.stringify({
        projects: projects || [],
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }, null, 2);
    }
  }

  async importData(data: string): Promise<void> {
    if (this.isPortableMode && isElectronAvailable()) {
      const result = await window.electronAPI!.storage.importData(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to import data');
      }
    } else {
      // Fallback implementation
      const importedData = JSON.parse(data);
      if (importedData.projects) {
        await this.saveProjects(importedData.projects);
      }
      if (importedData.settings) {
        await this.saveSettings(importedData.settings);
      }
    }
  }

  getStorageInfo(): { mode: string; location: string } {
    if (this.isPortableMode) {
      return {
        mode: 'Portable',
        location: 'data/ folder next to application'
      };
    } else {
      return {
        mode: 'IndexedDB',
        location: 'Browser storage (AppData/Local)'
      };
    }
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();
