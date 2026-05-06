import React from 'react'
import { Download, Upload, Trash2, Edit3 } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  type: 'local' | 'remote'
  onClose: () => void
  onAction: (action: string) => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, onClose, onAction }) => {
  React.useEffect(() => {
    const handleClick = () => onClose()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    minWidth: '160px'
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '2px',
    color: 'var(--text-primary)'
  }

  return (
    <div style={menuStyle} onClick={e => e.stopPropagation()}>
      {type === 'local' ? (
        <div style={itemStyle} className="context-item" onClick={() => onAction('upload')}>
          <Upload size={14} />
          <span>Upload to Remote</span>
        </div>
      ) : (
        <div style={itemStyle} className="context-item" onClick={() => onAction('download')}>
          <Download size={14} />
          <span>Download to Local</span>
        </div>
      )}
      <div style={itemStyle} className="context-item" onClick={() => onAction('edit')}>
        <Edit3 size={14} />
        <span>Edit</span>
      </div>
      <div style={itemStyle} className="context-item" onClick={() => onAction('rename')}>
        <Edit3 size={14} />
        <span>Rename</span>
      </div>
      <div style={{ ...itemStyle, color: '#ff4d4d' }} className="context-item" onClick={() => onAction('delete')}>
        <Trash2 size={14} />
        <span>Delete</span>
      </div>
    </div>
  )
}

export default ContextMenu
