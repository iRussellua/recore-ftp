import React, { useState, useEffect } from 'react'
import { Plus, Folder, File, Server, Globe, HardDrive, Database, Settings, Trash2, ChevronRight, ChevronLeft, FileCode, Image, FileText, Music, Film, Terminal, Archive, Lock, FileJson, X, RefreshCw, Edit2, Download, Upload, LogOut } from 'lucide-react'
import ConnectionModal from './components/ConnectionModal'
import ContextMenu from './components/ContextMenu'
import PreviewModal from './components/PreviewModal'

export const THEMES = [
  { id: '', name: 'Modern Dark (Default)', group: 'Standard' },
  { id: 'latte', name: 'Latte (Light)', group: 'Standard' },
  { id: 'frappe', name: 'Frappé', group: 'Catppuccin' },
  { id: 'macchiato', name: 'Macchiato', group: 'Catppuccin' },
  { id: 'mocha', name: 'Mocha (Dark)', group: 'Catppuccin' },
  { id: 'bird', name: 'Purple Bird', group: 'Author Themes' },
  { id: 'mint', name: 'Mint South', group: 'Author Themes' },
  { id: 'mint-light', name: 'Mint South Light', group: 'Author Themes' },
  { id: 'merch-red', name: 'Merch Red', group: 'Author Themes' },
  { id: 'sand', name: 'Sand', group: 'Author Themes' },
  { id: 'neon', name: 'Amoled NEON', group: 'Author Themes' },
  { id: 'vue-hc', name: 'Vue High Contrast', group: 'VSCode Aesthetics' },
  { id: 'gray-matter', name: 'Gray Matter Dark', group: 'VSCode Aesthetics' },
  { id: 'gruvbox', name: 'Gruvbox', group: 'VSCode Aesthetics' },
  { id: 'merko', name: 'Merko Green', group: 'VSCode Aesthetics' },
  { id: 'zenburn', name: 'Zenburn', group: 'VSCode Aesthetics' },
  { id: 'relaxed', name: 'Relaxed', group: 'VSCode Aesthetics' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', group: 'VSCode Aesthetics' },
  { id: 'vitesse', name: 'Vitesse Light', group: 'VSCode Aesthetics' }
]

interface FileItemProps {
  file: any
  type: 'local' | 'remote'
  level?: number
  path: string
  onNavigate: (fullPath: string, isDirectory: boolean) => void
  onContextMenu: (e: React.MouseEvent, type: 'local' | 'remote', file: any, path: string) => void
  onSelect: (file: any, type: 'local' | 'remote', path: string) => void
  selectedFile: { file: any, type: 'local' | 'remote', path: string } | null
  renamingPath: string | null
  onRenameComplete: (newName?: string) => void
  showHidden: boolean
}

const getFileIcon = (fileName: string, isDirectory: boolean) => {
  if (isDirectory) return <Folder size={14} color="#4a9eff" fill="#4a9eff22" />
  
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const size = 14

  const colors = {
    code: '#4a9eff',
    image: '#4ec9b0',
    text: '#cccccc',
    json: '#dcdcaa',
    config: '#9cdcfe',
    archive: '#ce9178',
    media: '#c586c0',
    script: '#b5cea8',
    database: '#4a9eff',
    security: '#f44747'
  }

  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'php':
    case 'html':
    case 'css':
    case 'scss':
    case 'py':
    case 'go':
    case 'rb':
    case 'c':
    case 'cpp':
    case 'java':
      return <FileCode size={size} color={colors.code} />
    case 'json':
      return <FileJson size={size} color={colors.json} />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'ico':
    case 'icns':
      return <Image size={size} color={colors.image} />
    case 'txt':
    case 'md':
    case 'log':
      return <FileText size={size} color={colors.text} />
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'dmg':
    case 'pkg':
      return <Archive size={size} color={colors.archive} />
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'ogg':
      return <Music size={size} color={colors.media} />
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return <Film size={size} color={colors.media} />
    case 'sh':
    case 'bash':
    case 'bat':
    case 'cmd':
      return <Terminal size={size} color={colors.script} />
    case 'env':
    case 'yml':
    case 'yaml':
    case 'conf':
    case 'ini':
    case 'xml':
      return <Settings size={size} color={colors.config} />
    case 'sql':
    case 'db':
    case 'sqlite':
      return <Database size={size} color={colors.database} />
    case 'pem':
    case 'key':
    case 'cert':
    case 'pub':
      return <Lock size={size} color={colors.security} />
    default:
      return <File size={size} color="var(--text-secondary)" />
  }
}

const FileItem: React.FC<FileItemProps> = ({ file, type, level = 0, path, onNavigate, onContextMenu, onSelect, selectedFile, renamingPath, onRenameComplete, showHidden }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [children, setChildren] = useState<any[]>([])
  const [newName, setNewName] = useState(file.name)

  useEffect(() => {
    setNewName(file.name)
  }, [file.name])

  if (!showHidden && file.name.startsWith('.')) return null

  const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
  const isSelected = selectedFile?.file.name === file.name && selectedFile?.path === path && selectedFile?.type === type
  const isRenaming = renamingPath === fullPath

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!file.isDirectory) {
      onSelect(file, type, path)
      return
    }
    
    if (!isExpanded) {
      const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
      const result = await (type === 'local' ? window.api.listLocalFiles(fullPath) : window.api.listFiles(fullPath))
      if (result.success) {
        setChildren(result.files)
        setIsExpanded(true)
      }
    } else {
      setIsExpanded(false)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
    onNavigate(fullPath, file.isDirectory)
  }

  const handleDragStart = (e: React.DragEvent) => {
    const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
    e.dataTransfer.setData('application/json', JSON.stringify({ file, type, path: fullPath }))
  }

  return (
    <div style={{ marginLeft: level * 12 }}>
      <div 
        className={`tree-item ${isSelected ? 'active' : ''}`} 
        onClick={(e) => {
          e.stopPropagation()
          onSelect(file, type, path)
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, type, file, path)}
        draggable
        onDragStart={handleDragStart}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 8px',
          borderRadius: '4px'
        }}
      >
        <div 
          onClick={toggleExpand}
          style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {file.isDirectory && (
             <ChevronRight size={12} style={{ 
               transform: isExpanded ? 'rotate(90deg)' : 'none', 
               transition: 'transform 0.2s',
               opacity: 0.5
             }} />
          )}
        </div>
        {!file.isDirectory && <div style={{ width: '12px' }}></div>}
        {getFileIcon(file.name, file.isDirectory)}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          {isRenaming ? (
            <input 
              autoFocus
              className="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => onRenameComplete()}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
                  const targetPath = `${path}/${newName}`.replace(/\/\//g, '/')
                  const res = await window.api.renameFile(fullPath, targetPath, type)
                  if (res.success) {
                    onRenameComplete(newName)
                  } else {
                    alert(`Rename failed: ${res.error}`)
                    onRenameComplete()
                  }
                } else if (e.key === 'Escape') {
                  onRenameComplete()
                  setNewName(file.name)
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          )}
        </div>
        
        <div style={{ width: '80px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right', opacity: 0.7 }}>
          {!file.isDirectory ? (file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : (file.size / 1024).toFixed(1) + ' KB') : '-'}
        </div>
        <div style={{ width: '120px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right', opacity: 0.7, paddingRight: '8px' }}>
          {file.modifiedAt ? new Date(file.modifiedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
        </div>
      </div>
      {isExpanded && (
        <div style={{ marginLeft: '12px', borderLeft: '1px dashed var(--border)' }}>
          {children.map((child, i) => (
            <FileItem 
              key={`${path}/${file.name}/${child.name}`} 
              file={child} 
              type={type} 
              level={level + 1} 
              path={`${path}/${file.name}`.replace(/\/\//g, '/')}
              onNavigate={onNavigate}
              onContextMenu={onContextMenu}
              onSelect={onSelect}
              selectedFile={selectedFile}
              renamingPath={renamingPath}
              onRenameComplete={onRenameComplete}
              showHidden={showHidden}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const App: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<any>(null)
  
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [localPath, setLocalPath] = useState('')
  
  const [remoteFiles, setRemoteFiles] = useState<any[]>([])
  const [remotePath, setRemotePath] = useState('/')
  
  const [isConnected, setIsConnected] = useState(false)
  const [defaultTheme, setDefaultTheme] = useState(localStorage.getItem('recore-default-theme') || '')
  const [theme, setTheme] = useState(defaultTheme)
  const [activeConnection, setActiveConnection] = useState<any>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'local' | 'remote', file: any, path: string } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<{ file: any, type: 'local' | 'remote', path: string } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{ type: 'text' | 'image' | 'audio' | 'video' | 'info', data: string, localPath?: string, mime?: string, previewData?: string } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>([])
  const [localDiskInfo, setLocalDiskInfo] = useState<any>(null)
  const [externalDrives, setExternalDrives] = useState<any[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [logs, setLogs] = useState<{ time: string, message: string, type: 'info' | 'error' | 'success' }[]>([])
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [activityLogs, setActivityLogs] = useState<{ time: string, action: string, file: string, type: string }[]>([])
  const [stats, setStats] = useState({ transfers: 0, deletes: 0, edits: 0, renames: 0 })
  const [isActivityOpen, setIsActivityOpen] = useState(false)

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [{ time, message, type }, ...prev].slice(0, 50))
  }

  const addActivity = (action: string, file: string, type: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setActivityLogs(prev => [{ time, action, file, type }, ...prev].slice(0, 50))
    
    setStats(prev => {
      const newStats = { ...prev }
      if (action.includes('Upload') || action.includes('Download')) newStats.transfers++
      else if (action.includes('Delete')) newStats.deletes++
      else if (action.includes('Rename')) newStats.renames++
      else if (action.includes('Save') || action.includes('Edit')) newStats.edits++
      return newStats
    })
  }

  const sortFiles = (files: any[]) => {
    return [...files].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    if (collapsedProjects.length > 0 || connections.length > 0) {
      window.api.setCollapsed(collapsedProjects)
    }
  }, [collapsedProjects])

  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatus({ message, type })
    setTimeout(() => setStatus(null), 3000)
  }

  useEffect(() => {
    loadConnections()
    initLocalFS()
    loadDiskInfo()
    
    // Load persisted collapsed projects
    window.api.getCollapsed().then(setCollapsedProjects)
    
    const cleanup = window.api.onProgress((p) => {
      setProgress(p)
      if (p === 100) setTimeout(() => setProgress(null), 2000)
    })
    
    return cleanup
  }, [])

  const loadDiskInfo = async () => {
    const home = await window.api.getHome()
    const info = await window.api.getDiskSpace(home)
    setLocalDiskInfo(info)
    
    const drives = await window.api.getExternalDrives()
    setExternalDrives(drives)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

      if (e.code === 'Space' && selectedFile) {
        e.preventDefault()
        if (isPreviewOpen) {
          setIsPreviewOpen(false)
        } else {
          handleQuickLook()
        }
      }
      if (e.code === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFile, isPreviewOpen])

  const handleQuickLook = async () => {
    if (!selectedFile) return
    setIsPreviewOpen(true)
    setPreviewData(null)
    
    const file = selectedFile.file
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const mediaExts = ['mp3', 'wav', 'ogg', 'mp4', 'mov', 'mkv', 'webm']
    const binaryExts = ['dmg', 'pkg', 'zip', 'rar', 'iso', 'bin', 'exe', 'app', 'pdf', 'mp4', 'mov', 'icns', 'ico', 'png', 'jpg', 'jpeg', 'gif', 'webp', ...mediaExts]
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'icns', 'ico'].includes(ext)
    const isMedia = mediaExts.includes(ext)
    const isHeavy = file.size > (isMedia ? 50 : 10) * 1024 * 1024 || (binaryExts.includes(ext) && !isImage && !isMedia)

    if (isHeavy) {
      setPreviewData({ type: 'info' as any, data: '' })
      return
    }
    
    if (selectedFile.type === 'local') {
      const fullPath = `${selectedFile.path}/${selectedFile.file.name}`.replace(/\/\//g, '/')
      const res = await window.api.readLocalFile(fullPath)
        if (res.success) {
          let type: any = res.type
          if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio'
          if (['mp4', 'mov', 'mkv', 'webm'].includes(ext)) type = 'video'
          setPreviewData({ type, data: res.data, localPath: res.localPath, mime: res.mime, previewData: res.previewData })
        }
        else setPreviewData({ type: 'text', data: `Error reading file: ${res.error}` })
      } else {
        try {
          const fullRemotePath = `${selectedFile.path}/${selectedFile.file.name}`.replace(/\/\//g, '/')
          const tempPath = `/tmp/recore_preview_${Date.now()}_${selectedFile.file.name}`
          const downRes = await window.api.download(fullRemotePath, tempPath)
          if (downRes.success) {
            const res = await window.api.readLocalFile(tempPath)
            if (res.success) {
              let type: any = res.type
              if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio'
              if (['mp4', 'mov', 'mkv', 'webm'].includes(ext)) type = 'video'
              setPreviewData({ type, data: res.data, localPath: res.localPath, mime: res.mime, previewData: res.previewData })
            }
          else setPreviewData({ type: 'text', data: `Read error: ${res.error}` })
        } else {
          setPreviewData({ type: 'text', data: `Download error: ${downRes.error}` })
        }
      } catch (err: any) {
        setPreviewData({ type: 'text', data: `Error: ${err.message}` })
      }
    }
  }

  const initLocalFS = async () => {
    const home = await window.api.getHome()
    const downloads = `${home}/Downloads`.replace(/\/\//g, '/')
    setLocalPath(downloads)
    loadLocalFiles(downloads)
  }

  const loadLocalFiles = async (path: string) => {
    const result = await window.api.listLocalFiles(path)
    if (result.success) {
      setLocalFiles(result.files)
      setLocalPath(path)
    }
  }

  const loadConnections = async () => {
    const data = await window.api.getConnections()
    setConnections(data)
  }

  const handleConnect = async (config: any, onlySave = false) => {
    const saveResult = await window.api.saveConnection(config)
    if (saveResult.success) {
      setConnections(saveResult.connections)
    }

    if (onlySave) {
      showStatus('Connection settings saved')
      setIsModalOpen(false)
      if (activeConnection?.id === config.id) {
        setTheme(config.color || '')
        setActiveConnection(config)
      }
      return
    }

    showStatus('Connecting...', 'info')
    addLog(`Connecting to: ${config.host} (${config.protocol})`, 'info')
    
    const result = await window.api.connect(config)
    if (result.success) {
      showStatus('Connected successfully')
      addLog(`Connected successfully to: ${config.host}`, 'success')
      setIsConnected(true)
      setIsModalOpen(false)
      setActiveConnection(config)
      setRemotePath('/')
      loadRemoteFiles('/')
      setTheme(config.color || '')
    } else {
      showStatus(`Connection failed: ${result.error}`, 'error')
      addLog(`Connection error: ${result.error}`, 'error')
      alert(`Connection failed: ${result.error}`)
      if (!isConnected) setTheme(defaultTheme)
    }
    return saveResult
  }

  const loadRemoteFiles = async (path: string) => {
    const filesResult = await window.api.listFiles(path)
    if (filesResult.success) {
      setRemoteFiles(filesResult.files)
      setRemotePath(path)
    }
  }

  const navigateLocal = (fullPath: string, isDirectory: boolean) => {
    if (isDirectory) {
      loadLocalFiles(fullPath)
    }
  }

  const navigateRemote = (fullPath: string, isDirectory: boolean) => {
    if (isDirectory) {
      loadRemoteFiles(fullPath)
    }
  }

  const goBackLocal = () => {
    const parts = localPath.split('/')
    parts.pop()
    const newPath = parts.join('/') || '/'
    loadLocalFiles(newPath)
  }

  const goBackRemote = () => {
    const parts = remotePath.split('/')
    parts.pop()
    const newPath = parts.join('/') || '/'
    loadRemoteFiles(newPath)
  }

  const handleContextMenu = (e: React.MouseEvent, type: 'local' | 'remote', file: any, path: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, file, path })
    setSelectedFile({ file, type, path })
  }

  const handleAction = async (action: string) => {
    if (!contextMenu) return
    const { type, file, path } = contextMenu
    const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')
    setContextMenu(null)

    if (action === 'upload' && type === 'local') {
      if (file.isDirectory) return showStatus('Uploading directories is not supported yet.', 'info')
      const remoteFilePath = `${remotePath}/${file.name}`.replace(/\/\//g, '/')
      addLog(`Uploading ${file.name} to remote...`, 'info')
      const res = await window.api.upload(fullPath, remoteFilePath)
      if (res.success) {
        loadRemoteFiles(remotePath)
        showStatus('File uploaded successfully')
        addLog(`Uploaded: ${file.name}`, 'success')
        addActivity('Upload', file.name, 'remote')
      } else {
        showStatus(`Upload failed: ${res.error}`, 'error')
        addLog(`Upload failed: ${file.name} - ${res.error}`, 'error')
      }
    }

    if (action === 'download' && type === 'remote') {
      if (file.isDirectory) return showStatus('Downloading directories is not supported yet.', 'info')
      const localFilePath = `${localPath}/${file.name}`.replace(/\/\//g, '/')
      addLog(`Downloading ${file.name} to local...`, 'info')
      const res = await window.api.download(fullPath, localFilePath)
      if (res.success) {
        loadLocalFiles(localPath)
        showStatus('File downloaded successfully')
        addLog(`Downloaded: ${file.name}`, 'success')
        addActivity('Download', file.name, 'local')
      } else {
        showStatus(`Download failed: ${res.error}`, 'error')
        addLog(`Download failed: ${file.name} - ${res.error}`, 'error')
      }
    }

    if (action === 'delete') {
      if (confirm(`Delete ${file.name}?`)) {
        addLog(`Deleting ${file.name} from ${type}...`, 'info')
        const res = await window.api.deleteFile(fullPath, type)
        if (res.success) {
          type === 'local' ? loadLocalFiles(localPath) : loadRemoteFiles(remotePath)
          showStatus('File deleted')
          addLog(`Deleted: ${file.name}`, 'success')
          addActivity('Delete', file.name, type)
        } else {
          showStatus(`Delete failed: ${res.error}`, 'error')
          addLog(`Delete failed: ${file.name} - ${res.error}`, 'error')
        }
      }
    }

    if (action === 'rename') {
      setRenamingPath(fullPath)
    }

    if (action === 'edit') {
      handleQuickLook()
    }
  }

  const handleFileSave = async (content: string) => {
    if (!selectedFile) return
    const { type, file, path } = selectedFile
    const fullPath = `${path}/${file.name}`.replace(/\/\//g, '/')

    if (type === 'local') {
      addLog(`Saving changes to ${file.name} (local)...`, 'info')
      const res = await window.api.writeLocalFile(fullPath, content)
      if (res.success) {
        loadLocalFiles(localPath)
        setPreviewData({ type: 'text', data: content })
        showStatus('Changes saved locally')
        addLog(`Saved: ${file.name}`, 'success')
        addActivity('Save', file.name, 'local')
      } else {
        showStatus(`Save failed: ${res.error}`, 'error')
        addLog(`Save failed: ${file.name} - ${res.error}`, 'error')
      }
    } else {
      try {
        addLog(`Saving changes and uploading ${file.name}...`, 'info')
        const tempPath = `/tmp/recore_edit_${Date.now()}_${file.name}`
        const writeRes = await window.api.writeLocalFile(tempPath, content)
        if (writeRes.success) {
          const uploadRes = await window.api.upload(tempPath, fullPath)
          if (uploadRes.success) {
            loadRemoteFiles(remotePath)
            setPreviewData({ type: 'text', data: content })
            showStatus('Changes saved and uploaded')
            addLog(`Saved and uploaded: ${file.name}`, 'success')
            addActivity('Edit/Save', file.name, 'remote')
            window.api.deleteFile(tempPath, 'local')
          } else {
            showStatus(`Remote upload failed: ${uploadRes.error}`, 'error')
            addLog(`Remote upload failed: ${file.name} - ${uploadRes.error}`, 'error')
          }
        }
      } catch (err: any) {
        showStatus(`Error: ${err.message}`, 'error')
        addLog(`Error saving ${file.name}: ${err.message}`, 'error')
      }
    }
  }

  const handleExportConnections = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const res = await (window.api as any).ipcRenderer.invoke('dialog:save', {
      title: 'Export Bookmarks',
      defaultPath: `recore-bookmarks-${timestamp}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (!res.canceled && res.filePath) {
      const data = JSON.stringify(connections, null, 2)
      await (window.api as any).ipcRenderer.invoke('fs:writeFile', { filePath: res.filePath, content: data })
      addLog('Bookmarks exported successfully', 'success')
      showStatus(`Exported ${connections.length} bookmarks`)
    }
    setIsSettingsOpen(false)
  }

  const handleImportConnections = async () => {
    const res = await (window.api as any).ipcRenderer.invoke('dialog:open', {
      title: 'Import Bookmarks',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!res.canceled && res.filePaths.length > 0) {
      try {
        const response = await (window.api as any).ipcRenderer.invoke('fs:readFile', res.filePaths[0])
        const content = response && typeof response === 'object' && 'data' in response ? response.data : response
        
        addLog(`Reading file: ${res.filePaths[0].split('/').pop()}`, 'info')
        if (typeof content === 'string') {
          addLog(`Content preview: ${content.substring(0, 50)}...`, 'info')
        }
        
        let importedData
        try {
          importedData = typeof content === 'string' ? JSON.parse(content) : content
        } catch (parseErr: any) {
          addLog(`JSON Parse Error: ${parseErr.message}`, 'error')
          return
        }
        
        // Advanced discovery: find any array that contains objects with 'host'
        const findBookmarks = (obj: any, depth = 0): any[] | null => {
          if (depth > 5) return null // Prevent deep recursion
          
          if (Array.isArray(obj)) {
            // Check if this array looks like connections or is a known connection array
            const looksLikeConnections = obj.length === 0 || obj.some(item => item && (item.host || item.name || item.protocol))
            if (looksLikeConnections) return obj
            
            for (const item of obj) {
              const found = findBookmarks(item, depth + 1)
              if (found) return found
            }
          } else if (obj && typeof obj === 'object') {
            const knownKeys = ['connections', 'bookmarks', 'sites', 'list', 'data', 'ftp_accounts']
            for (const key of knownKeys) {
              if (Array.isArray(obj[key])) return obj[key]
            }
            for (const key in obj) {
              const found = findBookmarks(obj[key], depth + 1)
              if (found) return found
            }
          }
          return null
        }

        const bookmarks = findBookmarks(importedData)

        if (Array.isArray(bookmarks)) {
          let updatedCount = 0
          let addedCount = 0
          const newConnections = [...connections]
          
          bookmarks.forEach(conn => {
            if (!conn || typeof conn !== 'object' || (!conn.host && !conn.name)) return
            
            const index = newConnections.findIndex(c => 
              (conn.id && c.id === conn.id) || 
              (c.host === conn.host && c.user === conn.user && c.protocol === conn.protocol)
            )
            
            if (index !== -1) {
              newConnections[index] = { ...newConnections[index], ...conn }
              updatedCount++
            } else {
              const newConn = { 
                ...conn, 
                id: conn.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                protocol: conn.protocol || 'ftp'
              }
              newConnections.push(newConn)
              addedCount++
            }
          })
          
          setConnections(newConnections)
          localStorage.setItem('ftp-connections', JSON.stringify(newConnections))
          addLog(`Import complete: ${addedCount} added, ${updatedCount} updated`, 'success')
          showStatus(`Imported ${addedCount + updatedCount} bookmarks`)
        } else {
          addLog('Invalid format: No valid connection list found in the file', 'error')
          showStatus('Invalid file format', 'error')
          console.log('Failed to discover bookmarks in:', importedData)
        }
      } catch (e: any) {
        addLog(`Import failed: ${e.message}`, 'error')
        showStatus('Import failed', 'error')
      }
    }
    setIsSettingsOpen(false)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setActiveConnection(null)
    setRemoteFiles([])
    setTheme(defaultTheme)
    addLog('Disconnected from server', 'info')
    setIsSettingsOpen(false)
  }

  const handleRefresh = async () => {
    setIsSettingsOpen(false)
    addLog('Refreshing file lists...', 'info')
    try {
      await loadLocalFiles(localPath)
      if (isConnected) {
        await loadRemoteFiles(remotePath)
      }
      addLog('File lists refreshed', 'success')
    } catch (err: any) {
      addLog(`Refresh failed: ${err.message}`, 'error')
    }
  }

  const handleDrop = async (e: React.DragEvent, targetType: 'local' | 'remote') => {
    e.preventDefault()
    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) return
      const { file, type, path } = JSON.parse(data)
      
      if (type === targetType) return // Same pane

      if (type === 'local' && targetType === 'remote') {
        if (file.isDirectory) return alert('Uploading directories is not supported yet.')
        const remoteFilePath = `${remotePath}/${file.name}`.replace(/\/\//g, '/')
        addLog(`Uploading ${file.name} to remote via drag & drop...`, 'info')
        const res = await window.api.upload(path, remoteFilePath)
        if (res.success) {
          loadRemoteFiles(remotePath)
          showStatus('Upload complete')
          addLog(`Uploaded: ${file.name}`, 'success')
          addActivity('Upload', file.name, 'remote')
        } else {
          showStatus(`Upload failed: ${res.error}`, 'error')
          addLog(`Upload failed: ${file.name} - ${res.error}`, 'error')
        }
      } else if (type === 'remote' && targetType === 'local') {
        if (file.isDirectory) return alert('Downloading directories is not supported yet.')
        const localFilePath = `${localPath}/${file.name}`.replace(/\/\//g, '/')
        addLog(`Downloading ${file.name} to local via drag & drop...`, 'info')
        const res = await window.api.download(path, localFilePath)
        if (res.success) {
          loadLocalFiles(localPath)
          showStatus('Download complete')
          addLog(`Downloaded: ${file.name}`, 'success')
          addActivity('Download', file.name, 'local')
        } else {
          showStatus(`Download failed: ${res.error}`, 'error')
          addLog(`Download failed: ${file.name} - ${res.error}`, 'error')
        }
      }
    } catch (err: any) {
      console.error('Drop error:', err)
    }
  }

  const deleteConnection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this connection?')) {
      const result = await window.api.deleteConnection(id)
      if (result.success) {
        setConnections(result.connections)
        if (activeConnection?.id === id) {
          setIsConnected(false)
          setActiveConnection(null)
          setTheme('')
        }
      }
    }
  }

  const openEditModal = (e: React.MouseEvent, conn: any) => {
    e.stopPropagation()
    setEditingConnection(conn)
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setEditingConnection(null)
    setIsModalOpen(true)
  }
  
  return (
    <div id="root" className={theme}>
      {status && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '30px',
          backgroundColor: status.type === 'error' ? '#f44747' : 'var(--accent)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {status.message}
        </div>
      )}
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div 
            className="drag-region"
            style={{ 
              padding: '8px 16px', 
              fontSize: '11px', 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              cursor: 'default',
              userSelect: 'none'
            }}>
            Connections
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div 
              className={`tree-item ${!activeConnection ? 'active' : ''}`} 
              onClick={() => { setActiveConnection(null); setIsConnected(false); setTheme(''); }}
              style={{ position: 'relative' }}
            >
              <HardDrive size={14} />
              <span style={{ flex: 1 }}>Local Machine</span>
              {localDiskInfo && (
                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px', opacity: 0.6 }}>
                  {localDiskInfo.freeGB}GB
                </span>
              )}
            </div>

            {externalDrives.map((drive) => (
              <div 
                key={drive.path}
                className="tree-item"
                onClick={() => {
                  setActiveConnection(null)
                  setIsConnected(false)
                  setTheme('')
                  setLocalPath(drive.path)
                  loadLocalFiles(drive.path)
                }}
                style={{ position: 'relative', opacity: 0.8 }}
              >
                <Database size={14} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{drive.name}</span>
                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px', opacity: 0.6 }}>
                  {drive.freeGB}GB
                </span>
              </div>
            ))}
            
            <div style={{ height: '8px' }}></div>
            
            {Object.entries(connections.reduce((acc: any, conn: any) => {
              const project = conn.project || 'OTHER'
              if (!acc[project]) acc[project] = []
              acc[project].push(conn)
              return acc
            }, {})).map(([project, conns]: [string, any]) => {
              const isCollapsed = collapsedProjects.includes(project)
              return (
                <div key={project} style={{ marginTop: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '12px' }}>
                  <div 
                    onClick={() => {
                      const newCollapsed = isCollapsed 
                        ? collapsedProjects.filter(p => p !== project) 
                        : [...collapsedProjects, project];
                      setCollapsedProjects(newCollapsed);
                    }}
                    style={{ padding: '0 16px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Folder size={10} /> 
                    <span style={{ flex: 1 }}>{project.toUpperCase()}</span>
                    <ChevronRight size={10} style={{ transform: isCollapsed ? 'none' : 'rotate(90deg)', transition: 'transform 0.2s', opacity: 0.5 }} />
                  </div>
                  {!isCollapsed && conns.map((conn: any) => (
                    <div 
                      key={conn.id} 
                      className={`tree-item ${activeConnection?.id === conn.id ? 'active' : ''}`}
                      onClick={() => handleConnect(conn)}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: activeConnection?.id === conn.id 
                          ? (isConnected ? '#50fa7b' : '#ff5555') 
                          : 'rgba(255,255,255,0.15)',
                        boxShadow: activeConnection?.id === conn.id && isConnected ? '0 0 8px #50fa7b' : 'none',
                        transition: 'all 0.3s'
                      }} />
                      {conn.icon ? (
                        <img src={conn.icon} style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '2px', marginRight: '4px' }} />
                      ) : null}
                      <span style={{ flex: 1 }}>{conn.name}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Settings 
                          size={12} 
                          className="edit-icon" 
                          onClick={(e) => openEditModal(e, conn)}
                          style={{ opacity: 0.5, cursor: 'pointer' }}
                        />
                        <Trash2 
                          size={12} 
                          className="delete-icon" 
                          onClick={(e) => deleteConnection(e, conn.id)}
                          style={{ opacity: 0.5, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          
          <div className="add-btn" title="Add New Connection" onClick={openAddModal}>
            <Plus size={18} />
          </div>
        </aside>

        {/* Status Log Panel */}
      {isLogOpen && (
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '240px',
          right: '0',
          height: '180px',
          background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Connection Log</span>
            <X 
              size={14} 
              style={{ cursor: 'pointer', opacity: 0.5 }} 
              onClick={() => setIsLogOpen(false)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5, fontSize: '12px' }}>
                No connection events recorded yet.
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: log.type === 'error' ? 'rgba(var(--error-rgb, 255, 85, 85), 0.1)' : 
                             log.type === 'success' ? 'rgba(var(--success-rgb, 80, 250, 123), 0.1)' : 
                             'transparent',
                  color: log.type === 'error' ? 'var(--error)' : 
                         log.type === 'success' ? 'var(--success)' : 
                         'var(--text-primary)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <span style={{ opacity: 0.4, minWidth: '65px' }}>[{log.time}]</span>
                  <span style={{ fontWeight: log.type !== 'info' ? 600 : 400 }}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Activity Log Panel */}
      {isActivityOpen && (
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '240px',
          right: '0',
          height: '220px',
          background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Session Activity</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={10} style={{ color: stats.transfers > 0 ? 'var(--success)' : 'var(--text-secondary)' }} />
                  <span style={{ color: stats.transfers > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>{stats.transfers} Transfers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={10} style={{ color: stats.deletes > 0 ? 'var(--error)' : 'var(--text-secondary)' }} />
                  <span style={{ color: stats.deletes > 0 ? 'var(--error)' : 'var(--text-secondary)', fontWeight: 600 }}>{stats.deletes} Deletes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit2 size={10} style={{ color: stats.edits > 0 ? 'var(--warning)' : 'var(--text-secondary)' }} />
                  <span style={{ color: stats.edits > 0 ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 600 }}>{stats.edits} Edits</span>
                </div>
              </div>
            </div>
            <X 
              size={14} 
              style={{ cursor: 'pointer', opacity: 0.5 }} 
              onClick={() => setIsActivityOpen(false)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 16px' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '6px 16px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '6px 16px' }}>File</th>
                  <th style={{ textAlign: 'left', padding: '6px 16px' }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                      No activity recorded in this session.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', opacity: 0.7 }}>{item.time}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '10px', 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: item.action === 'Upload' || item.action === 'Download' ? 'rgba(var(--success-rgb, 80, 250, 123), 0.15)' :
                                     item.action === 'Delete' ? 'rgba(var(--error-rgb, 255, 85, 85), 0.15)' :
                                     'rgba(var(--warning-rgb, 252, 238, 10), 0.15)',
                          color: 'var(--text-primary)',
                          border: `1px solid ${item.action === 'Upload' || item.action === 'Download' ? 'var(--success)' :
                                               item.action === 'Delete' ? 'var(--error)' :
                                               'var(--warning)'}`
                        }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.file}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          background: 'rgba(255,255,255,0.05)', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          color: 'var(--text-secondary)'
                        }}>
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content (Dual Pane) */}
      <main className="main-content" style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          {/* Left Pane (Local) */}
          <div 
            className="file-pane"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', minWidth: 0 }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={e => handleDrop(e, 'local')}
          >
            <div className="pane-header drag-region">
              <div className="drag-region" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', width: '100%' }}>
                <ChevronLeft className="no-drag" size={16} onClick={goBackLocal} style={{ cursor: 'pointer', opacity: localPath === '/' ? 0.3 : 1 }} />
                <HardDrive className="no-drag" size={14} />
                <span className="path-bar no-drag" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localPath}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', padding: '6px 20px', borderBottom: '1px dashed var(--border)', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', opacity: 0.8 }}>
              <span style={{ flex: 1 }}>Name</span>
              <span style={{ width: '80px', textAlign: 'right' }}>Size</span>
              <span style={{ width: '120px', textAlign: 'right', paddingRight: '8px' }}>Date</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
              {sortFiles(localFiles).map((file) => (
                <FileItem 
                  key={`${localPath}/${file.name}`} 
                  file={file} 
                  type="local" 
                  path={localPath} 
                  onNavigate={navigateLocal}
                  onContextMenu={handleContextMenu}
                  onSelect={(f, t, p) => setSelectedFile({ file: f, type: t, path: p })}
                  selectedFile={selectedFile}
                  renamingPath={renamingPath}
                  onRenameComplete={(newName) => {
                    setRenamingPath(null)
                    if (newName) loadLocalFiles(localPath)
                  }}
                  showHidden={showHidden}
                />
              ))}
            </div>
          </div>

          {/* Right Pane (Remote) */}
          <div 
            className="file-pane"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={e => handleDrop(e, 'remote')}
          >
            <div className="pane-header drag-region">
              <div className="drag-region" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', width: '100%' }}>
                <ChevronLeft className="no-drag" size={16} onClick={goBackRemote} style={{ cursor: 'pointer', opacity: !isConnected || remotePath === '/' ? 0.3 : 1 }} />
                <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeConnection?.icon ? (
                    <img src={activeConnection.icon} style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '2px' }} />
                  ) : (
                    activeConnection?.protocol === 's3' ? <Globe size={14} /> : <Server size={14} />
                  )}
                  <span className="path-bar" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isConnected ? remotePath : 'Not Connected'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', padding: '6px 20px', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', opacity: 0.8 }}>
              <span style={{ flex: 1 }}>Name</span>
              <span style={{ width: '80px', textAlign: 'right' }}>Size</span>
              <span style={{ width: '120px', textAlign: 'right', paddingRight: '8px' }}>Date</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
              {isConnected ? (
                remoteFiles.length > 0 ? sortFiles(remoteFiles).map((file) => (
                  <FileItem 
                    key={`${remotePath}/${file.name}`} 
                    file={file} 
                    type="remote" 
                    path={remotePath} 
                    onNavigate={navigateRemote}
                    onContextMenu={handleContextMenu}
                    onSelect={(f, t, p) => setSelectedFile({ file: f, type: t, path: p })}
                    selectedFile={selectedFile}
                    renamingPath={renamingPath}
                    onRenameComplete={(newName) => {
                      setRenamingPath(null)
                      if (newName) loadRemoteFiles(remotePath)
                    }}
                    showHidden={showHidden}
                  />
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Directory is empty.
                  </div>
                )
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Server size={48} style={{ opacity: 0.1 }} />
                  <p>Select a connection from the sidebar to browse files.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="status-bar">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
           <span style={{ fontWeight: 600, color: 'var(--accent)' }}>RECORE FTP</span>
           <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: isConnected ? '#50fa7b' : '#ff5555',
                boxShadow: isConnected ? '0 0 8px #50fa7b' : 'none'
              }} />
              <span>{isConnected ? `Connected to ${activeConnection.name}` : 'Ready'}</span>
           </div>
           {progress !== null && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '200px' }}>
               <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                 <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.1s' }}></div>
               </div>
               <span style={{ fontSize: '10px' }}>{progress}%</span>
             </div>
           )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            onClick={() => {
              setIsActivityOpen(!isActivityOpen)
              setIsLogOpen(false)
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              padding: '1px 8px',
              borderRadius: '4px',
              background: isActivityOpen ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: isActivityOpen ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              fontSize: '10px',
              height: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCw size={10} style={{ color: isActivityOpen ? 'white' : (stats.transfers > 0 ? 'var(--success)' : 'inherit') }} />
              <span>{stats.transfers}</span>
            </div>
            <span style={{ opacity: 0.3 }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Trash2 size={10} style={{ color: isActivityOpen ? 'white' : (stats.deletes > 0 ? 'var(--error)' : 'inherit') }} />
              <span>{stats.deletes}</span>
            </div>
            <span style={{ opacity: 0.3 }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Edit2 size={10} style={{ color: isActivityOpen ? 'white' : (stats.edits > 0 ? 'var(--warning)' : 'inherit') }} />
              <span>{stats.edits}</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
          <div 
            onClick={() => {
              setIsLogOpen(!isLogOpen)
              setIsActivityOpen(false)
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              background: isLogOpen ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: isLogOpen ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              fontSize: '11px',
              height: '18px'
            }}
          >
            <Server size={12} />
            <span>Status Log</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
          <div 
            onClick={() => setShowHidden(!showHidden)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              background: showHidden ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: showHidden ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              fontSize: '11px',
              height: '18px'
            }}
          >
            <Settings size={12} />
            <span>Hidden Files: {showHidden ? 'OFF' : 'ON'}</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
          <span>{isConnected ? activeConnection.protocol.toUpperCase() : 'NONE'}</span>
          <span>UTF-8</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Settings 
              size={12} 
              style={{ cursor: 'pointer', opacity: isSettingsOpen ? 1 : 0.5, color: isSettingsOpen ? 'var(--accent)' : 'inherit' }} 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            />
            {isSettingsOpen && (
              <div style={{
                position: 'absolute',
                bottom: '25px',
                right: '0',
                width: '180px',
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 1000,
                overflow: 'hidden',
                padding: '4px'
              }}>
                <div 
                  onClick={handleRefresh}
                  style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '4px' }}
                  className="menu-item"
                >
                  <RefreshCw size={12} />
                  <span>Refresh Lists</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                <div 
                  onClick={handleExportConnections}
                  style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '4px' }}
                  className="menu-item"
                >
                  <Download size={12} />
                  <span>Export Bookmarks</span>
                </div>
                <div 
                  onClick={handleImportConnections}
                  style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '4px' }}
                  className="menu-item"
                >
                  <Upload size={12} />
                  <span>Import Bookmarks</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Default Theme</div>
                <div style={{ padding: '4px 8px' }}>
                  <select 
                    value={defaultTheme}
                    onChange={(e) => {
                      const newTheme = e.target.value
                      setDefaultTheme(newTheme)
                      localStorage.setItem('recore-default-theme', newTheme)
                      if (!isConnected) setTheme(newTheme)
                      showStatus(`Default theme: ${e.target.options[e.target.selectedIndex].text}`)
                    }}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '4px', 
                      color: 'var(--text-primary)', 
                      fontSize: '11px',
                      padding: '4px 8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from(new Set(THEMES.map(t => t.group))).map(group => (
                      <optgroup key={group} label={group} style={{ background: 'var(--bg-panel)' }}>
                        {THEMES.filter(t => t.group === group).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                <div 
                  onClick={handleDisconnect}
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '11px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer', 
                    borderRadius: '4px',
                    color: isConnected ? 'var(--error)' : 'inherit',
                    opacity: isConnected ? 1 : 0.3,
                    pointerEvents: isConnected ? 'auto' : 'none'
                  }}
                  className="menu-item"
                >
                  <LogOut size={12} />
                  <span>Disconnect</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>

      <ConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleConnect}
        initialData={editingConnection}
      />

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          type={contextMenu.type} 
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}

      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onSave={handleFileSave}
        file={selectedFile?.file}
        data={previewData}
      />
    </div>
  )
}

export default App
