import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect, useState } from 'react';

export const useOnboardingTour = () => {
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has already seen the tour
    const tourCompleted = localStorage.getItem('onboarding_tour_completed');
    if (tourCompleted) {
      setHasSeenTour(true);
    }
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#app-logo',
          popover: {
            title: 'Welcome to CRYB! 🎉',
            description: 'The next-generation community platform where conversations come alive. Let\'s take a quick tour of all the features!',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#home-feed',
          popover: {
            title: 'Your Feed',
            description: 'This is your personalized feed. See posts from communities you follow and discover new content tailored to your interests.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#create-post-button',
          popover: {
            title: 'Create Posts',
            description: 'Share your thoughts, images, links, or start discussions. Express yourself and connect with the community!',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#explore-tab',
          popover: {
            title: 'Explore',
            description: 'Discover trending communities, popular posts, and new people to follow. Never run out of interesting content!',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#communities-section',
          popover: {
            title: 'Join Communities',
            description: 'Find and join communities that match your interests. From gaming to art, finance to tech - there\'s something for everyone!',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#create-community-button',
          popover: {
            title: 'Create Your Own Community',
            description: 'Got an idea? Create your own community! Set custom rules, themes, and build your tribe.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#messages-tab',
          popover: {
            title: 'Private Messages',
            description: 'Chat privately with other users, create group conversations, and stay connected with your network.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#wallet-button',
          popover: {
            title: 'Web3 Wallet',
            description: 'Connect your crypto wallet! Send tips, trade NFTs, and participate in token-gated communities. The future is here! 🚀',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#crypto-features',
          popover: {
            title: 'Crypto Features',
            description: 'View your portfolio, trade tokens, mint NFTs, and engage with DeFi right from the platform. Web3 made easy!',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#notifications-button',
          popover: {
            title: 'Stay Updated',
            description: 'Get instant notifications for mentions, replies, new followers, and community updates. Never miss a thing!',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#search-button',
          popover: {
            title: 'Search Everything',
            description: 'Find users, posts, communities, NFTs, and more. Our powerful search helps you discover exactly what you\'re looking for.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#profile-menu',
          popover: {
            title: 'Your Profile',
            description: 'Customize your profile, manage settings, view your stats, and showcase your NFT collection.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#voice-chat',
          popover: {
            title: 'Voice & Video',
            description: 'Join voice channels, start video calls, and connect with your community in real-time. Face-to-face conversations!',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#token-rewards',
          popover: {
            title: 'Earn Rewards',
            description: 'Earn CRYB tokens by contributing quality content, helping communities, and staying active. Get rewarded for being awesome! 💰',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#bottom-navigation',
          popover: {
            title: 'Quick Navigation',
            description: 'Use the bottom bar to quickly switch between Home, Explore, Create, Messages, and Profile. That\'s it! You\'re all set to start your CRYB journey! 🎊',
            side: 'top',
            align: 'center',
            onNextClick: () => {
              // Mark tour as completed
              localStorage.setItem('onboarding_tour_completed', 'true');
              setHasSeenTour(true);
              driverObj.destroy();
            }
          }
        }
      ],
      onDestroyed: () => {
        // Mark tour as completed when user exits early
        localStorage.setItem('onboarding_tour_completed', 'true');
        setHasSeenTour(true);
      }
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding_tour_completed');
    setHasSeenTour(false);
  };

  return {
    startTour,
    resetTour,
    hasSeenTour
  };
};
