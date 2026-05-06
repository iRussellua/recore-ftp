import { Client as SFTPClient } from 'ssh2'
import * as ftp from 'basic-ftp'

export interface ConnectionConfig {
  id: string
  name: string
  protocol: 'ftp' | 'sftp'
  host: string
  port: number
  user: string
  password?: string
  encoding?: string
}

export class FTPService {
  private sftpClient: any = null
  private sftpWrapper: any = null
  private ftpClient: any = null

  async connect(config: ConnectionConfig) {
    if (config.protocol === 'sftp') {
      return this.connectSFTP(config)
    } else {
      return this.connectFTP(config)
    }
  }

  private connectSFTP(config: ConnectionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftpClient = new SFTPClient()
      this.sftpClient
        .on('ready', () => {
          this.sftpClient.sftp((err: any, sftp: any) => {
            if (err) reject(err)
            else {
              this.sftpWrapper = sftp
              resolve()
            }
          })
        })
        .on('error', (err: any) => reject(err))
        .connect({
          host: config.host,
          port: config.port,
          username: config.user,
          password: config.password,
          readyTimeout: 20000
        })
    })
  }

  private async connectFTP(config: ConnectionConfig): Promise<void> {
    this.ftpClient = new ftp.Client()
    await this.ftpClient.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    })
  }

  async listFiles(path: string = '/') {
    if (this.sftpWrapper) {
      return new Promise((resolve, reject) => {
        this.sftpWrapper.readdir(path, (err: any, list: any[]) => {
          if (err) return reject(err)
          resolve(list.map((f: any) => ({
            name: f.filename,
            isDirectory: f.longname.startsWith('d'),
            size: f.attrs.size,
            modifiedAt: new Date(f.attrs.mtime * 1000).toISOString()
          })))
        })
      })
    } else if (this.ftpClient) {
      const list = await this.ftpClient.list(path)
      return list.map((f: any) => ({
        name: f.name,
        isDirectory: f.isDirectory,
        size: f.size,
        modifiedAt: f.modifiedAt ? new Date(f.modifiedAt).toISOString() : null
      }))
    }
    throw new Error('Not connected')
  }

  async disconnect() {
    if (this.sftpClient) {
      this.sftpClient.end()
      this.sftpClient = null
      this.sftpWrapper = null
    }
    if (this.ftpClient) {
      this.ftpClient.close()
      this.ftpClient = null
    }
  }

  async uploadFile(localPath: string, remotePath: string, onProgress?: (progress: number) => void) {
    if (this.sftpWrapper) {
      return new Promise((resolve, reject) => {
        this.sftpWrapper.fastPut(localPath, remotePath, {
          step: (transferred: number, chunk: number, total: number) => {
            if (onProgress) onProgress(Math.round((transferred / total) * 100))
          }
        }, (err: any) => {
          if (err) reject(err)
          else resolve(true)
        })
      })
    } else if (this.ftpClient) {
      this.ftpClient.trackProgress((info: any) => {
        if (onProgress && info.bytesOverall > 0) {
          onProgress(0) // Start
        }
      })
      await this.ftpClient.uploadFrom(localPath, remotePath)
      if (onProgress) onProgress(100)
    }
  }

  async downloadFile(remotePath: string, localPath: string, onProgress?: (progress: number) => void) {
    if (this.sftpWrapper) {
      return new Promise((resolve, reject) => {
        this.sftpWrapper.fastGet(remotePath, localPath, {
          step: (transferred: number, chunk: number, total: number) => {
            if (onProgress) onProgress(Math.round((transferred / total) * 100))
          }
        }, (err: any) => {
          if (err) reject(err)
          else resolve(true)
        })
      })
    } else if (this.ftpClient) {
      this.ftpClient.trackProgress((info: any) => {
        if (onProgress) onProgress(0)
      })
      await this.ftpClient.downloadTo(localPath, remotePath)
      if (onProgress) onProgress(100)
    }
  }

  async deleteFile(path: string) {
    if (this.sftpWrapper) {
      return new Promise((resolve, reject) => {
        this.sftpWrapper.unlink(path, (err: any) => {
          if (err) {
            this.sftpWrapper.rmdir(path, (err2: any) => {
              if (err2) reject(err2)
              else resolve(true)
            })
          } else {
            resolve(true)
          }
        })
      })
    } else if (this.ftpClient) {
      try {
        await this.ftpClient.remove(path)
      } catch (err) {
        await this.ftpClient.removeDir(path)
      }
    }
  }

  async renameFile(oldPath: string, newPath: string) {
    if (this.sftpWrapper) {
      return new Promise((resolve, reject) => {
        this.sftpWrapper.rename(oldPath, newPath, (err: any) => {
          if (err) reject(err)
          else resolve(true)
        })
      })
    } else if (this.ftpClient) {
      await this.ftpClient.rename(oldPath, newPath)
    }
  }
}
