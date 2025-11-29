import React from 'react'

const Awards = ({ awards = [], size = 'md', maxVisible = 5 }) => {
  if (!awards || awards.length === 0) return null

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  }

  // Group awards by type and count them
  const groupedAwards = awards.reduce((acc, award) => {
    if (acc[award.type]) {
      acc[award.type].count += 1
    } else {
      acc[award.type] = { ...award, count: 1 }
    }
    return acc
  }, {})

  const awardList = Object.values(groupedAwards)
  const visibleAwards = awardList.slice(0, maxVisible)
  const hiddenCount = awardList.length - maxVisible

  const getAwardIcon = (type) => {
    switch (type) {
      case 'gold':
        return '🥇'
      case 'silver':
        return '🥈'
      case 'platinum':
        return '💎'
      case 'helpful':
        return '💙'
      case 'wholesome':
        return '🤍'
      case 'rocket':
        return '🚀'
      case 'fire':
        return '🔥'
      case 'mind_blown':
        return '🤯'
      case 'laughing':
        return '😆'
      case 'crying':
        return '😢'
      case 'star':
        return '⭐'
      case 'heart':
        return '❤️'
      case 'thumbs_up':
        return '👍'
      case 'clap':
        return '👏'
      case 'brain':
        return '🧠'
      default:
        return '✨'
    }
  }

  const getAwardName = (type) => {
    switch (type) {
      case 'gold':
        return 'Gold Award'
      case 'silver':
        return 'Silver Award'
      case 'platinum':
        return 'Platinum Award'
      case 'helpful':
        return 'Helpful Award'
      case 'wholesome':
        return 'Wholesome Award'
      case 'rocket':
        return 'Rocket Like'
      case 'fire':
        return 'Fire Award'
      case 'mind_blown':
        return 'Mind Blown'
      case 'laughing':
        return 'Laughing Award'
      case 'crying':
        return 'Crying Award'
      default:
        return 'Award'
    }
  }

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexWrap: 'wrap'
}}>
      {visibleAwards.map((award) => (
        <div
          key={award.type}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
          title={`${award.count} ${getAwardName(award.type)}${award.count > 1 ? 's' : ''}`}
        >
          <span className={`${sizeClasses[size]} group-hover:scale-110 transition-transform duration-200`}>
            {getAwardIcon(award.type)}
          </span>
          {award.count > 1 && (
            <span style={{
  fontWeight: '500'
}}>
              {award.count}
            </span>
          )}
        </div>
      ))}

      {hiddenCount > 0 && (
        <div
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
          title={`${hiddenCount} more award${hiddenCount > 1 ? 's' : ''}`}
        >
          <svg style={{
  width: '12px',
  height: '12px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span style={{
  fontWeight: '500'
}}>
            {hiddenCount}
          </span>
        </div>
      )}
    </div>
  )
}



export default Awards