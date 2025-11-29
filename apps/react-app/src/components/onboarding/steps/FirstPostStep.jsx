import React, { useState } from 'react'

const FirstPostStep = ({ onComplete, onSkip }) => {
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    community: 'welcome'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!postData.title.trim() || !postData.content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          communityId: postData.community,
          type: 'introduction'
        })
      })

      if (response.ok) {
        onComplete()
      } else {
        throw new Error('Failed to create post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      // Still allow progression
      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = postData.title.trim().length > 0 && postData.content.trim().length > 0

  return (
    <div style={{
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        <h3 style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>Create Your First Post</h3>
        <p style={{
  color: '#c9d1d9'
}}>
          Introduce yourself to the community! Share something about yourself or ask a question.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
            Post Title
          </label>
          <input
            type="text"
            value={postData.title}
            onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Introduce yourself or ask a question..."
            style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            maxLength={200}
          />
          <p style={{
  color: '#c9d1d9'
}}>
            {postData.title.length}/200 characters
          </p>
        </div>

        <div>
          <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
            Your Message
          </label>
          <textarea
            value={postData.content}
            onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Tell us about yourself, your interests, or ask the community a question..."
            style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            rows={6}
            maxLength={2000}
          />
          <p style={{
  color: '#c9d1d9'
}}>
            {postData.content.length}/2000 characters • Markdown supported
          </p>
        </div>

        <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
          <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>💡 First Post Ideas</h5>
          <div style={{
  color: '#c9d1d9'
}}>
            <div>• "Hello CRYB! I'm [name] and I'm interested in [interests]"</div>
            <div>• "New to crypto/Web3, where should I start?"</div>
            <div>• "What's your favorite feature of CRYB so far?"</div>
            <div>• "Looking for communities about [topic]"</div>
            <div>• "Here's a project I'm working on..."</div>
          </div>
        </div>

        <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
          <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>📝 Post Guidelines</h5>
          <div style={{
  color: '#c9d1d9'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500">✓</span>
              <span>Be respectful and welcoming</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500">✓</span>
              <span>Stay on topic for the community</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500">✓</span>
              <span>Use proper formatting and grammar</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-green-500">✓</span>
              <span>Add relevant tags to help others find your post</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <button
          onClick={onSkip}
          style={{
  color: '#c9d1d9'
}}
        >
          Skip for now
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
        >
          {isSubmitting ? (
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
              <span>Publishing...</span>
            </div>
          ) : (
            'Publish Post & Continue'
          )}
        </button>
      </div>
    </div>
  )
}




export default FirstPostStep
