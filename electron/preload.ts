import { contextBridge } from 'electron';

// Expose limited APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  version: process.versions.electron,
});

export default {};
