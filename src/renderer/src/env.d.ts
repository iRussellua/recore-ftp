interface Window {
  api: {
    connect: (config: any) => Promise<{ success: boolean; error?: string }>;
    listFiles: (path: string) => Promise<{ success: boolean; files: any[]; error?: string }>;
    disconnect: () => Promise<{ success: boolean }>;
    getConnections: () => Promise<any[]>;
    saveConnection: (connection: any) => Promise<{ success: boolean; connections: any[] }>;
    deleteConnection: (id: string) => Promise<{ success: boolean; connections: any[] }>;
    listLocalFiles: (path: string) => Promise<{ success: boolean; files: any[]; error?: string }>;
    getHome: () => Promise<string>;
    upload: (localPath: string, remotePath: string) => Promise<{ success: boolean; error?: string }>;
    download: (remotePath: string, localPath: string) => Promise<{ success: boolean; error?: string }>;
    deleteFile: (path: string, type: 'local' | 'remote') => Promise<{ success: boolean; error?: string }>;
    renameFile: (oldPath: string, newPath: string, type: 'local' | 'remote') => Promise<{ success: boolean; error?: string }>;
    readLocalFile: (path: string) => Promise<{ success: boolean; type: 'text' | 'image' | 'audio' | 'video' | 'info'; data: string; localPath?: string; mime?: string; error?: string; previewData?: string }>;
    writeLocalFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    getDiskSpace: (path: string) => Promise<{ free: number; size: number; freeGB: string; totalGB: string; percent: number } | null>;
    getExternalDrives: () => Promise<any[]>;
    getCollapsed: () => Promise<string[]>;
    setCollapsed: (projects: string[]) => Promise<{ success: boolean }>;
    onProgress: (callback: (progress: number) => void) => () => void;
  };
}
