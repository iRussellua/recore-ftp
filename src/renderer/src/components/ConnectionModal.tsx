import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Plus, Image as ImageIcon } from 'lucide-react'
import { THEMES } from '../App'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: any, onlySave?: boolean) => Promise<any>
  initialData?: any
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    project: '',
    protocol: 'sftp',
    host: '',
    port: 22,
    user: '',
    password: '',
    encoding: 'UTF-8',
    baseUrl: '',
    note: '',
    color: 'default',
    icon: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData })
    } else {
      setFormData({
        id: '',
        name: '',
        project: '',
        protocol: 'sftp',
        host: '',
        port: 22,
        user: '',
        password: '',
        encoding: 'UTF-8',
        baseUrl: '',
        note: '',
        color: 'default',
        icon: ''
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(formData)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateField('icon', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '500px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{formData.id ? 'Edit Connection' : 'Add New Connection'}</h2>
          <X size={20} style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={onClose} />
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', overflowY: 'auto', maxHeight: '70vh' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Connection Name</label>
            <input type="text" style={inputStyle} placeholder="e.g. Production API" value={formData.name} onChange={e => updateField('name', e.target.value)} />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Project</label>
            <input type="text" style={inputStyle} placeholder="Select Project..." value={formData.project} onChange={e => updateField('project', e.target.value)} />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Protocol</label>
            <select 
              style={inputStyle} 
              value={formData.protocol} 
              onChange={e => {
                const proto = e.target.value
                let port = formData.port
                if (proto === 'sftp') port = 22
                else if (proto === 'ftp') port = 21
                setFormData(prev => ({ ...prev, protocol: proto, port }))
              }}
            >
              <option value="sftp">SFTP (Port 22)</option>
              <option value="ftp">FTP (Port 21)</option>
              <option value="drive">Google Drive (Cloud)</option>
              <option value="s3">Amazon S3 (Cloud)</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>
              {formData.protocol === 's3' ? 'S3 Endpoint / Region' : 
               formData.protocol === 'drive' ? 'Google Project / Folder ID' : 
               'Server / Host'}
            </label>
            <input 
              type="text" 
              style={inputStyle} 
              placeholder={formData.protocol === 's3' ? 's3.amazonaws.com' : 'ftp.example.com'} 
              value={formData.host} 
              onChange={e => updateField('host', e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Port</label>
            <input 
              type="number" 
              style={inputStyle} 
              value={formData.port} 
              disabled={formData.protocol === 'drive' || formData.protocol === 's3'}
              onChange={e => updateField('port', parseInt(e.target.value))} 
            />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Encoding</label>
            <input type="text" style={inputStyle} value={formData.encoding} onChange={e => updateField('encoding', e.target.value)} />
          </div>

          <div className="form-group">
            <label style={labelStyle}>
              {formData.protocol === 's3' ? 'Access Key ID' : 
               formData.protocol === 'drive' ? 'Client ID / Email' : 
               'Username'}
            </label>
            <input type="text" style={inputStyle} value={formData.user} onChange={e => updateField('user', e.target.value)} />
          </div>

          <div className="form-group">
            <label style={labelStyle}>
              {formData.protocol === 's3' ? 'Secret Access Key' : 
               formData.protocol === 'drive' ? 'Refresh Token / Key' : 
               'Password'}
            </label>
            <input type="password" style={inputStyle} value={formData.password} onChange={e => updateField('password', e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Base URL</label>
            <input type="text" style={inputStyle} placeholder="https://example.com" value={formData.baseUrl} onChange={e => updateField('baseUrl', e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Note</label>
            <textarea style={{ ...inputStyle, height: '60px', resize: 'none' }} value={formData.note} onChange={e => updateField('note', e.target.value)}></textarea>
          </div>

          <div className="form-group">
            <label style={labelStyle}>Theme (Visual Studio)</label>
            <select style={inputStyle} value={formData.color} onChange={e => updateField('color', e.target.value)}>
              {Array.from(new Set(THEMES.map(t => t.group))).map(group => (
                <optgroup key={group} label={group}>
                  {THEMES.filter(t => t.group === group).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={labelStyle}>Logo / Icon</label>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                border: '1px dashed var(--border)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'var(--bg-secondary)'
              }}>
                {formData.icon ? (
                  <img src={formData.icon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Plus size={14} style={{ color: 'var(--text-primary)' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{formData.icon ? 'Change Icon' : 'Upload Icon'}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>SVG, PNG or JPG</span>
              </div>
              {formData.icon && (
                <X
                  size={14}
                  style={{ marginLeft: 'auto', opacity: 0.5, color: 'var(--text-primary)' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateField('icon', '')
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }} onClick={onClose}>Cancel</button>
          
          {formData.id && (
            <button 
              onClick={() => onSave(formData, true)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}>
              Save Changes
            </button>
          )}

          <button 
            onClick={async () => {
              const res = await onSave(formData, false)
              if (res && res.success && res.connection) {
                setFormData(res.connection)
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
            <Save size={16} />
            {formData.id ? 'Save & Connect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}


const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginBottom: '4px',
  textTransform: 'uppercase'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '8px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '13px'
}

export default ConnectionModal
