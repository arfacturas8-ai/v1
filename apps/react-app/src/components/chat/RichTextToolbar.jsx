import React from 'react'
import { Bold, Italic, Underline, Code, Link, AtSign, Hash, Quote } from 'lucide-react'

const RichTextToolbar = ({ onFormat, isMobile }) => {
  const formatButtons = [
    { 
      icon: Bold, 
      label: 'Bold', 
      format: '**',
      shortcut: 'Ctrl+B',
      action: (selection) => `**${selection || 'bold text'}**`
    },
    { 
      icon: Italic, 
      label: 'Italic', 
      format: '*',
      shortcut: 'Ctrl+I',
      action: (selection) => `*${selection || 'italic text'}*`
    },
    { 
      icon: Underline, 
      label: 'Underline', 
      format: '__',
      shortcut: 'Ctrl+U',
      action: (selection) => `__${selection || 'underlined text'}__`
    },
    { 
      icon: Code, 
      label: 'Inline Code', 
      format: '`',
      shortcut: 'Ctrl+`',
      action: (selection) => `\`${selection || 'code'}\``
    },
    {
      icon: Quote,
      label: 'Quote',
      format: '> ',
      shortcut: 'Ctrl+Shift+.',
      action: (selection) => `> ${selection || 'quoted text'}`
    },
    { 
      icon: Link, 
      label: 'Link', 
      format: '[]',
      shortcut: 'Ctrl+K',
      action: (selection) => `[${selection || 'link text'}](url)`
    },
    { 
      icon: AtSign, 
      label: 'Mention', 
      format: '@',
      shortcut: '@',
      action: (selection) => `@${selection || 'username'}`
    },
    {
      icon: Hash,
      label: 'Channel',
      format: '#',
      shortcut: '#',
      action: (selection) => `#${selection || 'channel'}`
    }
  ]

  const handleFormat = (button, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onFormat) {
      onFormat(button.action)
    }
  }

  if (isMobile) return null

  return (
    <div 
      style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
      style={{
        background: 'rgba(21, 21, 23, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      {formatButtons.map(({ icon: Icon, label, shortcut, ...button }, index) => (
        <React.Fragment key={label}>
          <button
            onClick={(e) => handleFormat(button, e)}
            style={{
  position: 'relative',
  padding: '8px',
  borderRadius: '12px'
}}
            title={`${label} (${shortcut})`}
            type="button"
          >
            <Icon size={16} />
            
            {/* Tooltip */}
            <div style={{
  position: 'absolute',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              {label}
              <br />
              <span className="text-tertiary text-[10px]">{shortcut}</span>
            </div>
          </button>
          
          {/* Separator after certain groups */}
          {(index === 3 || index === 4 || index === 5) && (
            <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}}></div>
          )}
        </React.Fragment>
      ))}
      
      {/* Code Block Button (Special) */}
      <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}}></div>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (onFormat) {
            onFormat((selection) => `\`\`\`\n${selection || 'code block'}\n\`\`\``)
          }
        }}
        style={{
  position: 'relative',
  padding: '8px',
  borderRadius: '12px'
}}
        title="Code Block (Ctrl+Shift+`)"
        type="button"
      >
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}}>
          <div style={{
  width: '16px',
  height: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
            <div style={{
  width: '100%'
}}></div>
            <div className="w-2/3 h-px bg-current mt-0.5"></div>
          </div>
        </div>
        
        {/* Tooltip */}
        <div style={{
  position: 'absolute',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          Code Block
          <br />
          <span className="text-tertiary text-[10px]">Ctrl+Shift+`</span>
        </div>
      </button>
    </div>
  )
}



export default RichTextToolbar