import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  connect: (config: any) => ipcRenderer.invoke('ftp:connect', config),
  listFiles: (path: string) => ipcRenderer.invoke('ftp:listFiles', path),
  disconnect: () => ipcRenderer.invoke('ftp:disconnect'),
  getConnections: () => ipcRenderer.invoke('connections:get'),
  saveConnection: (connection: any) => ipcRenderer.invoke('connections:save', connection),
  deleteConnection: (id: string) => ipcRenderer.invoke('connections:delete', id),
  listLocalFiles: (path: string) => ipcRenderer.invoke('fs:listFiles', path),
  getHome: () => ipcRenderer.invoke('fs:getHome'),
  upload: (localPath: string, remotePath: string) => ipcRenderer.invoke('ftp:upload', { localPath, remotePath }),
  download: (remotePath: string, localPath: string) => ipcRenderer.invoke('ftp:download', { remotePath, localPath }),
  deleteFile: (path: string, type: 'local' | 'remote') => ipcRenderer.invoke(type === 'local' ? 'fs:delete' : 'ftp:delete', path),
  renameFile: (oldPath: string, newPath: string, type: 'local' | 'remote') => ipcRenderer.invoke(type === 'local' ? 'fs:rename' : 'ftp:rename', { oldPath, newPath }),
  readLocalFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeLocalFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', { filePath: path, content }),
  getDiskSpace: (path: string) => ipcRenderer.invoke('fs:getDiskSpace', path),
  getExternalDrives: () => ipcRenderer.invoke('fs:getExternalDrives'),
  getCollapsed: () => ipcRenderer.invoke('settings:getCollapsed'),
  setCollapsed: (projects: string[]) => ipcRenderer.invoke('settings:setCollapsed', projects),
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
  },
  onProgress: (callback: (progress: number) => void) => {
    const listener = (_event: any, value: number) => callback(value)
    ipcRenderer.on('transfer:progress', listener)
    return () => ipcRenderer.removeListener('transfer:progress', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if main world isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
