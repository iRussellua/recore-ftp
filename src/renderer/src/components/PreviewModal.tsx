import React, { useState, useEffect, useRef } from 'react'
import { X, File, Music, Save, Edit2 } from 'lucide-react'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (content: string) => Promise<void>
  file: any
  data: { type: 'text' | 'image' | 'audio' | 'video' | 'info', data: string, localPath?: string, mime?: string, previewData?: string } | null
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, onSave, file, data }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data && data.type === 'text') {
      setEditedContent(data.data)
    }
  }, [data])

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false)
    }
  }, [isOpen, file?.name])

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop
      preRef.current.scrollLeft = scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart, selectionEnd } = e.currentTarget
      const value = e.currentTarget.value
      const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd)
      setEditedContent(newValue)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 2
        }
      }, 0)
    }
  }

  if (!isOpen || !file) return null

  const handleClose = () => {
    if (isEditing && editedContent !== (data?.data || '')) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) return
    }
    onClose()
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const editableExts = ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'php', 'py', 'sql', 'json', 'yaml', 'yml', 'env', 'xml', 'svg', 'conf', 'ini', 'sh', 'bash']
  const canEdit = data && data.type === 'text' && editableExts.includes(ext)

  const highlight = (code: string) => {
    if (!code) return ''
    if (code.length > 50000) {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color: #ce9178">$1</span>')
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span style="color: #6a9955">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|export|import|from|extends|await|async|try|catch|new|this|case|switch|break|continue|public|private|protected|static|interface|type)\b/g, '<span style="color: #569cd6">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #569cd6">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color: #b5cea8">$1</span>')
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(editedContent)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const fontStyle = {
    fontSize: '14px',
    fontFamily: '"Fira Code", "Source Code Pro", monospace',
    lineHeight: '22px',
  }

  const editorStyles: React.CSSProperties = {
    ...fontStyle,
    margin: 0,
    padding: '30px',
    whiteSpace: 'pre',
    wordBreak: 'normal',
    tabSize: 2,
    border: 'none',
    outline: 'none',
    background: 'transparent'
  }

  const lineCount = editedContent.split('\n').length

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(10px)'
    }} onClick={handleClose}>
      <div style={{
        width: '95%',
        height: '90%',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <File size={16} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{file.name}</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>{ (file.size / 1024).toFixed(2) } KB</span>
            {isEditing && <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>EDITING</span>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {canEdit && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ 
                  background: 'var(--accent)', 
                  border: 'none', 
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Edit2 size={14} /> Edit File
              </button>
            )}
            
            {isEditing && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ 
                    background: 'var(--accent)', 
                    border: 'none', 
                    color: 'white',
                    padding: '6px 20px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    fontWeight: 600
                  }}
                >
                  <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
            
            <X size={20} style={{ cursor: 'pointer', opacity: 0.5, color: 'var(--text-primary)' }} onClick={handleClose} />
          </div>
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
          {!data ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.05)' }}>
              <div className="spinner">Loading Preview...</div>
            </div>
          ) : isEditing ? (
            <div style={{ flex: 1, display: 'flex', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
              <div 
                ref={gutterRef}
                style={{
                  width: '50px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  padding: '30px 0',
                  color: 'rgba(255,255,255,0.2)',
                  textAlign: 'right',
                  paddingRight: '12px',
                  userSelect: 'none',
                  ...fontStyle
                }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} style={{ height: '22px' }}>{i + 1}</div>
                ))}
              </div>

              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <pre 
                  ref={preRef}
                  style={{ 
                    ...editorStyles,
                    color: '#d4d4d4',
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                  }}
                  dangerouslySetInnerHTML={{ __html: highlight(editedContent) + '\n' }}
                />
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  wrap="off"
                  style={{
                    ...editorStyles,
                    width: '100%',
                    height: '100%',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    zIndex: 2,
                    position: 'relative',
                    caretColor: '#fff',
                    overflow: 'auto'
                  }}
                />
              </div>
            </div>
          ) : (data.type as string) === 'audio' ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: '60px', 
                borderRadius: '32px', 
                width: '100%', 
                maxWidth: '600px',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '200px', 
                  height: '200px', 
                  borderRadius: '24px', 
                  background: 'rgba(255,255,255,0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 40px auto',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                }}>
                  {data.previewData ? (
                    <img src={data.previewData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Music size={80} style={{ color: 'var(--accent)', opacity: 0.5 }} />
                  )}
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700 }}>{file.name}</h3>
                <p style={{ margin: '0 0 40px 0', opacity: 0.4, fontSize: '15px' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Audio Track
                </p>
                <audio key={data.localPath || data.data} controls style={{ width: '100%', height: '48px' }}>
                  <source src={data.localPath ? `media://${data.localPath}` : data.data} />
                </audio>
              </div>
            </div>
          ) : (data.type as string) === 'video' ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', background: 'rgba(0,0,0,0.2)' }}>
              <video 
                key={data.localPath || data.data} 
                controls 
                poster={data.previewData}
                style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <source src={data.localPath ? `media://${data.localPath}` : data.data} />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (data.type === 'image' || (data.type === 'text' && data.previewData)) ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <img src={data.previewData || data.data} style={{ maxWidth: '100%', maxHeight: '90%', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderRadius: '8px' }} />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                {file.name.split('.').pop()?.toUpperCase()} File
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
               <pre 
                 style={{ 
                   ...editorStyles,
                   color: 'var(--text-primary)'
                 }}
                 dangerouslySetInnerHTML={{ __html: highlight(data.data as string) }}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
