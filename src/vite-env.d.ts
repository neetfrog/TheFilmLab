/// <reference types="vite/client" />

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      version: string;
    };
  }
}

export {};
