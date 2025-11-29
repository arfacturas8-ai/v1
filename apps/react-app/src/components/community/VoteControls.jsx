import React, { useState, useEffect, useCallback } from 'react'

const VoteControls = ({ 
  postId, 
  initialScore = 0, 
  userVote = null, 
  onVote,
  size = 'md',
  orientation = 'vertical',
  disabled = false,
  userKarma = 0,
  showControvery = false,
  controversyScore = 0,
  fuzzing = true,
  communityRules = {}
}) => {
  const [score, setScore] = useState(initialScore)
  const [currentVote, setCurrentVote] = useState(userVote)
  const [isAnimating, setIsAnimating] = useState(false)
  const [voteWeight, setVoteWeight] = useState(1)
  const [displayScore, setDisplayScore] = useState(initialScore)
  const [lastVoteTime, setLastVoteTime] = useState(null)

  // Calculate vote weight based on user karma and community rules
  const calculateVoteWeight = useCallback(() => {
    let weight = 1
    
    // Base karma multiplier
    if (userKarma >= 50000) weight = 3
    else if (userKarma >= 10000) weight = 2.5
    else if (userKarma >= 5000) weight = 2
    else if (userKarma >= 1000) weight = 1.5
    else if (userKarma >= 100) weight = 1.2
    
    // Community-specific rules
    if (communityRules.highKarmaBonus && userKarma >= communityRules.highKarmaThreshold) {
      weight *= communityRules.highKarmaMultiplier || 1.5
    }
    
    // Trusted user bonus
    if (communityRules.trustedUsers?.includes(postId?.toString())) {
      weight *= 1.3
    }
    
    return Math.min(weight, communityRules.maxVoteWeight || 3)
  }, [userKarma, communityRules, postId])

  // Apply vote fuzzing to prevent gaming
  const applyVoteFuzzing = useCallback((realScore) => {
    if (!fuzzing || realScore < 10) return realScore
    
    const fuzzRange = Math.min(Math.floor(realScore * 0.1), 50)
    const fuzz = Math.floor(Math.random() * (fuzzRange * 2 + 1)) - fuzzRange
    return Math.max(0, realScore + fuzz)
  }, [fuzzing])

  useEffect(() => {
    setScore(initialScore)
    setCurrentVote(userVote)
    setDisplayScore(applyVoteFuzzing(initialScore))
    setVoteWeight(calculateVoteWeight())
  }, [initialScore, userVote, applyVoteFuzzing, calculateVoteWeight])

  const handleVote = async (voteType) => {
    if (disabled || isAnimating) return

    // Rate limiting check
    const now = Date.now()
    if (lastVoteTime && now - lastVoteTime < 1000) {
      return // Prevent spam voting
    }

    setIsAnimating(true)
    setLastVoteTime(now)
    
    const previousVote = currentVote
    const previousScore = score
    const previousDisplayScore = displayScore
    
    // Optimistic update with vote weight
    let newVote = voteType
    let newScore = score
    const weightedValue = voteWeight

    if (currentVote === voteType) {
      // Remove vote if clicking same button
      newVote = null
      newScore = score + (voteType === 'upvote' ? -weightedValue : weightedValue)
    } else {
      // New vote or changing vote
      if (currentVote) {
        // Changing from existing vote
        const previousWeight = voteWeight // Could be different if karma changed
        newScore = score + (voteType === 'upvote' ? weightedValue + previousWeight : -(weightedValue + previousWeight))
      } else {
        // New vote
        newScore = score + (voteType === 'upvote' ? weightedValue : -weightedValue)
      }
    }

    setCurrentVote(newVote)
    setScore(newScore)
    setDisplayScore(applyVoteFuzzing(newScore))

    try {
      const voteData = {
        postId,
        voteType,
        newVote,
        weight: voteWeight,
        userKarma,
        timestamp: now
      }
      
      await onVote?.(voteData)
      
      // Add success animation
      setTimeout(() => setIsAnimating(false), 300)
    } catch (error) {
      // Revert on error
      setCurrentVote(previousVote)
      setScore(previousScore)
      setDisplayScore(previousDisplayScore)
      console.error('Vote failed:', error)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const formatScore = (num) => {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getControversyIndicator = () => {
    if (!showControvery || controversyScore < 0.5) return null
    
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}} title={`Controversy Score: ${controversyScore.toFixed(2)}`}>
        <div style={{
  position: 'relative'
}}>
          <svg style={{
  width: '12px',
  height: '12px'
}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    )
  }

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1',
    lg: 'text-base gap-sm'
  }

  const buttonSizeClasses = {
    sm: 'w-6 h-6 text-sm p-1',
    md: 'w-7 h-7 text-base p-1',
    lg: 'w-8 h-8 text-lg p-1'
  }

  const containerClasses = orientation === 'vertical' 
    ? `flex flex-col items-center ${sizeClasses[size]} opacity-70 hover:opacity-100 transition-opacity`
    : `flex items-center ${sizeClasses[size]} opacity-70 hover:opacity-100 transition-opacity`

  return (
    <div className={containerClasses}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={disabled || isAnimating}
        style={{
  display: 'flex',
  alignItems: 'center'
}}
        aria-label="Upvote"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-all duration-200 ${currentVote === 'upvote' ? 'fill-current' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 2 3 3H7v4H5V5H3l3-3z"/>
        </svg>
      </button>

      {/* Score Display */}
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}}>
        <div 
          style={{
  fontWeight: '500',
  paddingLeft: '4px',
  paddingRight: '4px'
}}
          title={`Actual score: ${score} | Your vote weight: ${voteWeight.toFixed(1)}x`}
        >
          {formatScore(displayScore)}
          {voteWeight > 1 && (
            <span style={{
  position: 'absolute',
  fontWeight: 'bold'
}}>
              {voteWeight.toFixed(1)}x
            </span>
          )}
        </div>
        {getControversyIndicator()}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={disabled || isAnimating}
        style={{
  display: 'flex',
  alignItems: 'center'
}}
        aria-label="Downvote"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-all duration-200 ${currentVote === 'downvote' ? 'fill-current' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 10-3-3h2V3h2v4h2l-3 3z"/>
        </svg>
      </button>
    </div>
  )
}



export default VoteControls