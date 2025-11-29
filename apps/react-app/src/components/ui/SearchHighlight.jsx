import React from 'react'

/**
 * SearchHighlight Component
 * Highlights search terms in text
 */

const SearchHighlight = ({
  text = '',
  query = '',
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-900 font-semibold',
  className = ''
}) => {
  if (!query || !text) {
    return <span className={className}>{text}</span>
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}




export default SearchHighlight
