import { app, shell, BrowserWindow, ipcMain, Menu, nativeImage, protocol, net, dialog } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import Store from 'electron-store'
import checkDiskSpace from 'check-disk-space'
import { FTPService, ConnectionConfig } from './services/ftpService'

const execFileAsync = promisify(execFile)

// Register custom protocol for media files
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, stream: true, secure: true, supportFetchAPI: true } }
])

app.name = 'RECORE FTP'
app.setName('RECORE FTP')

const ftpService = new FTPService()
const store = new (Store as any)()

// Ensure demo data exists
const currentConnections = store.get('connections', []) as any[]
const hasDemo = currentConnections.some(c => c.id.startsWith('demo-'))
if (!hasDemo) {
  const demoData = [
    { id: 'demo-1', name: 'Wing SFTP Demo', protocol: 'sftp', host: 'demo.wftpserver.com', port: 22, user: 'demo', password: 'demo', color: 'blue', project: 'DEMO' },
    { id: 'demo-2', name: 'GNU Public FTP', protocol: 'ftp', host: 'ftp.gnu.org', port: 21, user: 'anonymous', password: '', color: 'green', project: 'DEMO' }
  ]
  store.set('connections', [...demoData, ...currentConnections])
}

// Set About Panel
app.setAboutPanelOptions({
  applicationName: 'RECORE FTP',
  applicationVersion: '1.0.0',
  version: '1.0.0',
  copyright: '© 2026 iRussellua',
  authors: ['iRussellua'],
  iconPath: join(__dirname, '../../resources/icon.png')
})

function createWindow(): void {
  // Create the browser window.
  // Set Dock Icon
  const iconPath = join(__dirname, '../../resources/icon.png')
  const image = nativeImage.createFromPath(iconPath)
  if (app.dock) app.dock.setIcon(image)

  const mainWindow = new BrowserWindow({
    title: 'RECORE FTP',
    icon: image,
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true
    }
  })

  // Create Application Menu to force name in macOS menu bar
  const template: any[] = [
    {
      label: 'RECORE FTP',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  // IPC Handlers
  ipcMain.handle('ftp:connect', async (_, config: any) => {
    try {
      console.log('Connecting to:', config.host, config.protocol)
      // Sanitize config - remove UI-only fields
      const { icon, color, project, note, baseUrl, ...ftpConfig } = config
      await ftpService.connect(ftpConfig)
      console.log('Connected successfully to:', config.host)
      return { success: true }
    } catch (error: any) {
      console.error('Connection error:', error.message)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ftp:listFiles', async (_, path: string) => {
    try {
      const files = await ftpService.listFiles(path)
      return { success: true, files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ftp:disconnect', async () => {
    await ftpService.disconnect()
    return { success: true }
  })

  // Connection Persistence Handlers
  ipcMain.handle('connections:get', () => {
    return store.get('connections', [])
  })

  ipcMain.handle('connections:save', (_, connection: any) => {
    const connections: any[] = store.get('connections', [])
    const index = connection.id ? connections.findIndex(c => c.id === connection.id) : -1
    let savedConnection = { ...connection }
    if (index > -1) {
      connections[index] = savedConnection
    } else {
      savedConnection = { ...connection, id: Date.now().toString() }
      connections.push(savedConnection)
    }
    
    store.set('connections', connections)
    return { success: true, connections, connection: savedConnection }
  })

  ipcMain.handle('ftp:upload', async (event, { localPath, remotePath }) => {
    try {
      await ftpService.uploadFile(localPath, remotePath, (progress) => {
        event.sender.send('transfer:progress', progress)
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ftp:download', async (event, { remotePath, localPath }) => {
    try {
      await ftpService.downloadFile(remotePath, localPath, (progress) => {
        event.sender.send('transfer:progress', progress)
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('connections:delete', (_, id: string) => {
    const connections: any[] = store.get('connections', [])
    const filtered = connections.filter(c => c.id !== id)
    store.set('connections', filtered)
    return { success: true, connections: filtered }
  })

  ipcMain.handle('fs:delete', async (_, filePath: string) => {
    try {
      await fs.unlink(filePath)
      return { success: true }
    } catch (error: any) {
      // If it's a directory
      try {
        await fs.rm(filePath, { recursive: true })
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  })

  ipcMain.handle('fs:rename', async (_, { oldPath, newPath }) => {
    try {
      await fs.rename(oldPath, newPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ftp:delete', async (_, path: string) => {
    try {
      await ftpService.deleteFile(path)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ftp:rename', async (_, { oldPath, newPath }) => {
    try {
      await ftpService.renameFile(oldPath, newPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Settings persistence
  ipcMain.handle('settings:getCollapsed', () => {
    return store.get('collapsedProjects', [])
  })

  ipcMain.handle('settings:setCollapsed', (_, projects: string[]) => {
    store.set('collapsedProjects', projects)
    return { success: true }
  })

  ipcMain.handle('fs:getDiskSpace', async (_, path: string) => {
    try {
      const diskSpace = await checkDiskSpace(path)
      return { 
        free: diskSpace.free, 
        size: diskSpace.size,
        freeGB: (diskSpace.free / (1024 * 1024 * 1024)).toFixed(1),
        totalGB: (diskSpace.size / (1024 * 1024 * 1024)).toFixed(1),
        percent: Math.round((diskSpace.free / diskSpace.size) * 100)
      }
    } catch (e) {
      return null
    }
  })

  ipcMain.handle('fs:getExternalDrives', async () => {
    try {
      const volumes = await fs.readdir('/Volumes')
      const drives = await Promise.all(volumes.filter(v => !v.startsWith('.')).map(async (v) => {
        const path = `/Volumes/${v}`
        const diskSpace = await checkDiskSpace(path)
        return {
          name: v,
          path,
          freeGB: (diskSpace.free / (1024 * 1024 * 1024)).toFixed(1),
          totalGB: (diskSpace.size / (1024 * 1024 * 1024)).toFixed(1),
          percent: Math.round((diskSpace.free / diskSpace.size) * 100)
        }
      }))
      return drives
    } catch (e) {
      return []
    }
  })

  // Better protocol handling with Range support for Video
  app.whenReady().then(() => {
    protocol.handle('media', (request) => {
      const filePath = decodeURIComponent(request.url.replace('media://', ''))
      return net.fetch(pathToFileURL(filePath).toString())
    })
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      let actualPath = filePath
      let isHeic = ext === 'heic'
      let isIcns = ext === 'icns'
      let tempPath = ''

      if (isHeic || isIcns) {
        try {
          tempPath = join(os.tmpdir(), `recore_conv_${Date.now()}.png`)
          await execFileAsync('sips', ['-s', 'format', 'png', filePath, '--out', tempPath])
          actualPath = tempPath
        } catch (e) {
          console.error('Conversion failed', e)
        }
      }

      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'icns', 'heic'].includes(ext)
      const isAudio = ['mp3', 'wav', 'ogg'].includes(ext)
      const isVideo = ['mp4', 'mov', 'mkv', 'webm'].includes(ext)

      if (isImage || isAudio || isVideo) {
        let previewData: string | undefined = undefined
        
        // Try to get embedded cover/thumbnail using macOS native thumbnailing
        if (isAudio || isVideo) {
          try {
            const thumb = await nativeImage.createThumbnailFromPath(filePath, { width: 400, height: 400 })
            if (!thumb.isEmpty()) {
              previewData = thumb.toDataURL()
            }
          } catch (e) {
            console.error('Thumbnail extraction failed', e)
          }
        }

        return { 
          success: true, 
          type: isImage ? 'image' : (isAudio ? 'audio' : 'video'), 
          data: isImage ? `data:image/png;base64,${(await fs.readFile(actualPath)).toString('base64')}` : filePath,
          localPath: filePath,
          previewData: previewData,
          mime: isAudio ? 'audio/mpeg' : isVideo ? 'video/mp4' : 'image/png'
        }
      }
      
      const data = await fs.readFile(filePath, 'utf-8')
      
      if (ext === 'svg') {
        const svgBase64 = Buffer.from(data).toString('base64')
        return { 
          success: true, 
          type: 'text', 
          data: data, 
          previewData: `data:image/svg+xml;base64,${svgBase64}` 
        }
      }

      return { success: true, type: 'text', data: data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:writeFile', async (_, { filePath, content }) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('dialog:save', async (_, options) => {
    return await dialog.showSaveDialog(options)
  })

  ipcMain.handle('dialog:open', async (_, options) => {
    return await dialog.showOpenDialog(options)
  })

  // Local File System Handlers
  ipcMain.handle('fs:listFiles', async (_, directoryPath: string) => {
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true })
      const files = await Promise.all(entries.map(async entry => {
        const fullPath = join(directoryPath, entry.name)
        try {
          const stats = await fs.stat(fullPath)
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modifiedAt: stats.mtime.toISOString()
          }
        } catch {
          return { name: entry.name, isDirectory: entry.isDirectory(), size: 0, mtime: new Date() }
        }
      }))
      return { success: true, files: files.sort((a, b) => (b.isDirectory ? 1 : -1) - (a.isDirectory ? 1 : -1) || a.name.localeCompare(b.name)) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:getHome', () => {
    return os.homedir()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
