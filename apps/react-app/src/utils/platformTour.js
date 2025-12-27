/**
 * CRYB Platform Tour with Driver.js
 * 10-step guided tour for first-time users
 */

import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export const createPlatformTour = () => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    steps: [
      {
        element: '[data-tour="home"]',
        popover: {
          title: 'Welcome to Cryb.ai! 👋',
          description: 'Your decentralized community platform. Let\'s take a quick tour to get you started!',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#home-feed',
        popover: {
          title: 'Your Feed 📰',
          description: 'Discover trending posts, updates from communities you follow, and personalized recommendations.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="search"]',
        popover: {
          title: 'Search Everything 🔍',
          description: 'Find communities, users, posts, NFTs, and more. Our powerful search helps you discover exactly what you\'re looking for.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="communities"]',
        popover: {
          title: 'Join Communities 👥',
          description: 'Find and join communities that match your interests. From gaming to crypto, there\'s something for everyone.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="create-post"]',
        popover: {
          title: 'Create Content ✍️',
          description: 'Share your thoughts, images, links, or start discussions. Express yourself and connect with the community!',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#messages-tab',
        popover: {
          title: 'Direct Messages 💬',
          description: 'Chat privately with other users, create group conversations, and stay connected with your network.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '[data-tour="notifications"]',
        popover: {
          title: 'Stay Updated 🔔',
          description: 'Get instant notifications for mentions, replies, new followers, and community updates. Never miss a thing!',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '#wallet-button',
        popover: {
          title: 'Web3 Wallet 🔐',
          description: 'Connect your crypto wallet! Send tips, trade NFTs, and participate in token-gated communities. The future is here! 🚀',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="profile"]',
        popover: {
          title: 'Your Profile ⚡',
          description: 'Customize your profile, manage settings, view your stats, and showcase your NFT collection.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="settings"]',
        popover: {
          title: 'Personalize Everything ⚙️',
          description: 'Customize themes, privacy settings, notifications, and more. Make Cryb.ai yours! That\'s it - you\'re ready to explore! 🎊',
          side: 'left',
          align: 'start'
        }
      }
    ],
    onDestroyStarted: () => {
      // Mark tour as completed
      localStorage.setItem('cryb_tour_completed', 'true')
      driverObj.destroy()
    }
  })

  return driverObj
}

// Custom theme for iOS styling
export const tourTheme = `
  .driver-popover {
    background: #FFFFFF !important;
    color: #1A1A1A !important;
    border: 1px solid #E8EAED !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
    padding: 20px !important;
  }

  .driver-popover-title {
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #1A1A1A !important;
    margin-bottom: 12px !important;
  }

  .driver-popover-description {
    font-size: 15px !important;
    color: #666666 !important;
    line-height: 1.6 !important;
    margin-bottom: 20px !important;
  }

  .driver-popover-progress-text {
    font-size: 13px !important;
    color: #999999 !important;
    font-weight: 600 !important;
  }

  .driver-popover-footer {
    display: flex !important;
    gap: 12px !important;
    margin-top: 20px !important;
  }

  .driver-popover-prev-btn,
  .driver-popover-next-btn,
  .driver-popover-close-btn {
    padding: 12px 20px !important;
    border-radius: 12px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    transition: all 0.2s !important;
    border: none !important;
    cursor: pointer !important;
  }

  .driver-popover-prev-btn {
    background: #F8F9FA !important;
    color: #1A1A1A !important;
    border: 1px solid #E8EAED !important;
  }

  .driver-popover-prev-btn:hover {
    background: #F0F2F5 !important;
  }

  .driver-popover-next-btn {
    background: linear-gradient(90deg, #58a6ff 0%, #a371f7 100%) !important;
    color: #FFFFFF !important;
  }

  .driver-popover-next-btn:hover {
    opacity: 0.9 !important;
  }

  .driver-popover-close-btn {
    background: transparent !important;
    color: #666666 !important;
    padding: 8px !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    position: absolute !important;
    top: 16px !important;
    right: 16px !important;
  }

  .driver-popover-close-btn:hover {
    background: #F0F2F5 !important;
  }

  .driver-overlay {
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px) !important;
  }

  .driver-highlighted-element {
    outline: 3px solid #58a6ff !important;
    outline-offset: 4px !important;
    border-radius: 12px !important;
  }
`

// Check if user should see tour
export const shouldShowTour = () => {
  const tourCompleted = localStorage.getItem('cryb_tour_completed')
  const isFirstVisit = !localStorage.getItem('cryb_visited_before')

  if (!tourCompleted && isFirstVisit) {
    localStorage.setItem('cryb_visited_before', 'true')
    return true
  }

  return false
}

// Start tour for first-time users
export const startPlatformTour = () => {
  if (shouldShowTour()) {
    // Add custom theme CSS only once
    if (!document.getElementById('cryb-tour-theme')) {
      const styleElement = document.createElement('style')
      styleElement.id = 'cryb-tour-theme'
      styleElement.textContent = tourTheme
      document.head.appendChild(styleElement)
    }

    // Start tour after a short delay to ensure DOM is ready
    setTimeout(() => {
      const tour = createPlatformTour()
      tour.drive()
    }, 1000)
  }
}
