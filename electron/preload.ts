const { contextBridge } = require('electron');

// Expose limited APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  version: process.versions.electron,
});
