const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadVocabTrainer: (callback) => ipcRenderer.on('load-vocab-trainer', callback),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  maximizeApp: () => ipcRenderer.invoke('maximize-app'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  login: () => ipcRenderer.invoke('login'),
  logout: () => ipcRenderer.invoke('logout'),
  setReminderFrequency: (minutes) => ipcRenderer.invoke('set-reminder-frequency', minutes),
  setMinimizeToTray: (value) => ipcRenderer.invoke('set-minimize-to-tray', value)
});