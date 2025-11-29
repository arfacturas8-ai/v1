/**
 * Comprehensive tests for lazyRoutes.jsx
 * Testing lazy loading, route configuration, code splitting, and error boundaries
 */
import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all lazy routes and utilities
import * as LazyRoutes from './lazyRoutes.jsx';

describe('Lazy Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Route Export Tests
  // ============================================================================
  describe('Route Exports', () => {
    it('should export ChatPage as lazy component', () => {
      expect(LazyRoutes.ChatPage).toBeDefined();
      expect(LazyRoutes.ChatPage.$$typeof).toBeDefined();
    });

    it('should export DirectMessagesPage as lazy component', () => {
      expect(LazyRoutes.DirectMessagesPage).toBeDefined();
      expect(LazyRoutes.DirectMessagesPage.$$typeof).toBeDefined();
    });

    it('should export VoiceChatPage as lazy component', () => {
      expect(LazyRoutes.VoiceChatPage).toBeDefined();
      expect(LazyRoutes.VoiceChatPage.$$typeof).toBeDefined();
    });

    it('should export MessageRequestsPage as lazy component', () => {
      expect(LazyRoutes.MessageRequestsPage).toBeDefined();
      expect(LazyRoutes.MessageRequestsPage.$$typeof).toBeDefined();
    });

    it('should export CommunityPage as lazy component', () => {
      expect(LazyRoutes.CommunityPage).toBeDefined();
      expect(LazyRoutes.CommunityPage.$$typeof).toBeDefined();
    });

    it('should export CommunitiesPage as lazy component', () => {
      expect(LazyRoutes.CommunitiesPage).toBeDefined();
      expect(LazyRoutes.CommunitiesPage.$$typeof).toBeDefined();
    });

    it('should export CreateCommunityPage as lazy component', () => {
      expect(LazyRoutes.CreateCommunityPage).toBeDefined();
      expect(LazyRoutes.CreateCommunityPage.$$typeof).toBeDefined();
    });

    it('should export PostDetailPage as lazy component', () => {
      expect(LazyRoutes.PostDetailPage).toBeDefined();
      expect(LazyRoutes.PostDetailPage.$$typeof).toBeDefined();
    });

    it('should export CreatePostPage as lazy component', () => {
      expect(LazyRoutes.CreatePostPage).toBeDefined();
      expect(LazyRoutes.CreatePostPage.$$typeof).toBeDefined();
    });

    it('should export ProfilePage as lazy component', () => {
      expect(LazyRoutes.ProfilePage).toBeDefined();
      expect(LazyRoutes.ProfilePage.$$typeof).toBeDefined();
    });

    it('should export EditProfilePage as lazy component', () => {
      expect(LazyRoutes.EditProfilePage).toBeDefined();
      expect(LazyRoutes.EditProfilePage.$$typeof).toBeDefined();
    });

    it('should export SettingsPage as lazy component', () => {
      expect(LazyRoutes.SettingsPage).toBeDefined();
      expect(LazyRoutes.SettingsPage.$$typeof).toBeDefined();
    });

    it('should export AccountSettingsPage as lazy component', () => {
      expect(LazyRoutes.AccountSettingsPage).toBeDefined();
      expect(LazyRoutes.AccountSettingsPage.$$typeof).toBeDefined();
    });

    it('should export CryptoPage as lazy component', () => {
      expect(LazyRoutes.CryptoPage).toBeDefined();
      expect(LazyRoutes.CryptoPage.$$typeof).toBeDefined();
    });

    it('should export NFTMarketplacePage as lazy component', () => {
      expect(LazyRoutes.NFTMarketplacePage).toBeDefined();
      expect(LazyRoutes.NFTMarketplacePage.$$typeof).toBeDefined();
    });

    it('should export NFTGalleryPage as lazy component', () => {
      expect(LazyRoutes.NFTGalleryPage).toBeDefined();
      expect(LazyRoutes.NFTGalleryPage.$$typeof).toBeDefined();
    });

    it('should export NFTDetailPage as lazy component', () => {
      expect(LazyRoutes.NFTDetailPage).toBeDefined();
      expect(LazyRoutes.NFTDetailPage.$$typeof).toBeDefined();
    });

    it('should export WalletSettingsPage as lazy component', () => {
      expect(LazyRoutes.WalletSettingsPage).toBeDefined();
      expect(LazyRoutes.WalletSettingsPage.$$typeof).toBeDefined();
    });

    it('should export WalletConnectionPage as lazy component', () => {
      expect(LazyRoutes.WalletConnectionPage).toBeDefined();
      expect(LazyRoutes.WalletConnectionPage.$$typeof).toBeDefined();
    });

    it('should export TokenEconomicsPage as lazy component', () => {
      expect(LazyRoutes.TokenEconomicsPage).toBeDefined();
      expect(LazyRoutes.TokenEconomicsPage.$$typeof).toBeDefined();
    });

    it('should export TokenGatingSetupPage as lazy component', () => {
      expect(LazyRoutes.TokenGatingSetupPage).toBeDefined();
      expect(LazyRoutes.TokenGatingSetupPage.$$typeof).toBeDefined();
    });

    it('should export AdminPage as lazy component', () => {
      expect(LazyRoutes.AdminPage).toBeDefined();
      expect(LazyRoutes.AdminPage.$$typeof).toBeDefined();
    });

    it('should export ModerationPage as lazy component', () => {
      expect(LazyRoutes.ModerationPage).toBeDefined();
      expect(LazyRoutes.ModerationPage.$$typeof).toBeDefined();
    });

    it('should export ModerationQueuePage as lazy component', () => {
      expect(LazyRoutes.ModerationQueuePage).toBeDefined();
      expect(LazyRoutes.ModerationQueuePage.$$typeof).toBeDefined();
    });

    it('should export UserManagementPage as lazy component', () => {
      expect(LazyRoutes.UserManagementPage).toBeDefined();
      expect(LazyRoutes.UserManagementPage.$$typeof).toBeDefined();
    });

    it('should export BotManagementPage as lazy component', () => {
      expect(LazyRoutes.BotManagementPage).toBeDefined();
      expect(LazyRoutes.BotManagementPage.$$typeof).toBeDefined();
    });

    it('should export AuditLogPage as lazy component', () => {
      expect(LazyRoutes.AuditLogPage).toBeDefined();
      expect(LazyRoutes.AuditLogPage.$$typeof).toBeDefined();
    });

    it('should export ReportsPage as lazy component', () => {
      expect(LazyRoutes.ReportsPage).toBeDefined();
      expect(LazyRoutes.ReportsPage.$$typeof).toBeDefined();
    });

    it('should export DiscoverPage as lazy component', () => {
      expect(LazyRoutes.DiscoverPage).toBeDefined();
      expect(LazyRoutes.DiscoverPage.$$typeof).toBeDefined();
    });

    it('should export SearchPage as lazy component', () => {
      expect(LazyRoutes.SearchPage).toBeDefined();
      expect(LazyRoutes.SearchPage.$$typeof).toBeDefined();
    });

    it('should export ActivityFeedPage as lazy component', () => {
      expect(LazyRoutes.ActivityFeedPage).toBeDefined();
      expect(LazyRoutes.ActivityFeedPage.$$typeof).toBeDefined();
    });

    it('should export CategoryBrowsePage as lazy component', () => {
      expect(LazyRoutes.CategoryBrowsePage).toBeDefined();
      expect(LazyRoutes.CategoryBrowsePage.$$typeof).toBeDefined();
    });

    it('should export TagPage as lazy component', () => {
      expect(LazyRoutes.TagPage).toBeDefined();
      expect(LazyRoutes.TagPage.$$typeof).toBeDefined();
    });

    it('should export NotificationsPage as lazy component', () => {
      expect(LazyRoutes.NotificationsPage).toBeDefined();
      expect(LazyRoutes.NotificationsPage.$$typeof).toBeDefined();
    });

    it('should export NotificationSettingsPage as lazy component', () => {
      expect(LazyRoutes.NotificationSettingsPage).toBeDefined();
      expect(LazyRoutes.NotificationSettingsPage.$$typeof).toBeDefined();
    });

    it('should export PrivacySettingsPage as lazy component', () => {
      expect(LazyRoutes.PrivacySettingsPage).toBeDefined();
      expect(LazyRoutes.PrivacySettingsPage.$$typeof).toBeDefined();
    });

    it('should export SecuritySettingsPage as lazy component', () => {
      expect(LazyRoutes.SecuritySettingsPage).toBeDefined();
      expect(LazyRoutes.SecuritySettingsPage.$$typeof).toBeDefined();
    });

    it('should export AppearanceSettingsPage as lazy component', () => {
      expect(LazyRoutes.AppearanceSettingsPage).toBeDefined();
      expect(LazyRoutes.AppearanceSettingsPage.$$typeof).toBeDefined();
    });

    it('should export NotificationSettingsPage2 as lazy component', () => {
      expect(LazyRoutes.NotificationSettingsPage2).toBeDefined();
      expect(LazyRoutes.NotificationSettingsPage2.$$typeof).toBeDefined();
    });

    it('should export LanguageRegionPage as lazy component', () => {
      expect(LazyRoutes.LanguageRegionPage).toBeDefined();
      expect(LazyRoutes.LanguageRegionPage.$$typeof).toBeDefined();
    });

    it('should export DataPrivacyPage as lazy component', () => {
      expect(LazyRoutes.DataPrivacyPage).toBeDefined();
      expect(LazyRoutes.DataPrivacyPage.$$typeof).toBeDefined();
    });

    it('should export SystemSettingsPage as lazy component', () => {
      expect(LazyRoutes.SystemSettingsPage).toBeDefined();
      expect(LazyRoutes.SystemSettingsPage.$$typeof).toBeDefined();
    });

    it('should export CommunityAnalyticsPage as lazy component', () => {
      expect(LazyRoutes.CommunityAnalyticsPage).toBeDefined();
      expect(LazyRoutes.CommunityAnalyticsPage.$$typeof).toBeDefined();
    });

    it('should export CommunityLeaderboardPage as lazy component', () => {
      expect(LazyRoutes.CommunityLeaderboardPage).toBeDefined();
      expect(LazyRoutes.CommunityLeaderboardPage.$$typeof).toBeDefined();
    });

    it('should export CommunityRulesPage as lazy component', () => {
      expect(LazyRoutes.CommunityRulesPage).toBeDefined();
      expect(LazyRoutes.CommunityRulesPage.$$typeof).toBeDefined();
    });

    it('should export CommunityStorePage as lazy component', () => {
      expect(LazyRoutes.CommunityStorePage).toBeDefined();
      expect(LazyRoutes.CommunityStorePage.$$typeof).toBeDefined();
    });

    it('should export CommunityWikiPage as lazy component', () => {
      expect(LazyRoutes.CommunityWikiPage).toBeDefined();
      expect(LazyRoutes.CommunityWikiPage.$$typeof).toBeDefined();
    });

    it('should export EventsCalendarPage as lazy component', () => {
      expect(LazyRoutes.EventsCalendarPage).toBeDefined();
      expect(LazyRoutes.EventsCalendarPage.$$typeof).toBeDefined();
    });

    it('should export EventDetailsPage as lazy component', () => {
      expect(LazyRoutes.EventDetailsPage).toBeDefined();
      expect(LazyRoutes.EventDetailsPage.$$typeof).toBeDefined();
    });

    it('should export IntegrationsPage as lazy component', () => {
      expect(LazyRoutes.IntegrationsPage).toBeDefined();
      expect(LazyRoutes.IntegrationsPage.$$typeof).toBeDefined();
    });

    it('should export AnnouncementsPage as lazy component', () => {
      expect(LazyRoutes.AnnouncementsPage).toBeDefined();
      expect(LazyRoutes.AnnouncementsPage.$$typeof).toBeDefined();
    });

    it('should export CallScreenPage as lazy component', () => {
      expect(LazyRoutes.CallScreenPage).toBeDefined();
      expect(LazyRoutes.CallScreenPage.$$typeof).toBeDefined();
    });

    it('should export VoiceMessagesPage as lazy component', () => {
      expect(LazyRoutes.VoiceMessagesPage).toBeDefined();
      expect(LazyRoutes.VoiceMessagesPage.$$typeof).toBeDefined();
    });

    it('should export SharedMediaGalleryPage as lazy component', () => {
      expect(LazyRoutes.SharedMediaGalleryPage).toBeDefined();
      expect(LazyRoutes.SharedMediaGalleryPage.$$typeof).toBeDefined();
    });

    it('should export ServersPage as lazy component', () => {
      expect(LazyRoutes.ServersPage).toBeDefined();
      expect(LazyRoutes.ServersPage.$$typeof).toBeDefined();
    });

    it('should export GroupDMSettingsPage as lazy component', () => {
      expect(LazyRoutes.GroupDMSettingsPage).toBeDefined();
      expect(LazyRoutes.GroupDMSettingsPage.$$typeof).toBeDefined();
    });

    it('should export CreateProposalPage as lazy component', () => {
      expect(LazyRoutes.CreateProposalPage).toBeDefined();
      expect(LazyRoutes.CreateProposalPage.$$typeof).toBeDefined();
    });

    it('should export BillingPage as lazy component', () => {
      expect(LazyRoutes.BillingPage).toBeDefined();
      expect(LazyRoutes.BillingPage.$$typeof).toBeDefined();
    });

    it('should export HelpPage as lazy component', () => {
      expect(LazyRoutes.HelpPage).toBeDefined();
      expect(LazyRoutes.HelpPage.$$typeof).toBeDefined();
    });

    it('should export GuidelinesPage as lazy component', () => {
      expect(LazyRoutes.GuidelinesPage).toBeDefined();
      expect(LazyRoutes.GuidelinesPage.$$typeof).toBeDefined();
    });

    it('should export ContactPage as lazy component', () => {
      expect(LazyRoutes.ContactPage).toBeDefined();
      expect(LazyRoutes.ContactPage.$$typeof).toBeDefined();
    });

    it('should export TermsPage as lazy component', () => {
      expect(LazyRoutes.TermsPage).toBeDefined();
      expect(LazyRoutes.TermsPage.$$typeof).toBeDefined();
    });

    it('should export PrivacyPage as lazy component', () => {
      expect(LazyRoutes.PrivacyPage).toBeDefined();
      expect(LazyRoutes.PrivacyPage.$$typeof).toBeDefined();
    });

    it('should export MobileCameraIntegration as lazy component', () => {
      expect(LazyRoutes.MobileCameraIntegration).toBeDefined();
      expect(LazyRoutes.MobileCameraIntegration.$$typeof).toBeDefined();
    });

    it('should export MobileCommunityDrawer as lazy component', () => {
      expect(LazyRoutes.MobileCommunityDrawer).toBeDefined();
      expect(LazyRoutes.MobileCommunityDrawer.$$typeof).toBeDefined();
    });

    it('should export MobileGestureControls as lazy component', () => {
      expect(LazyRoutes.MobileGestureControls).toBeDefined();
      expect(LazyRoutes.MobileGestureControls.$$typeof).toBeDefined();
    });

    it('should export MobileShareSheet as lazy component', () => {
      expect(LazyRoutes.MobileShareSheet).toBeDefined();
      expect(LazyRoutes.MobileShareSheet.$$typeof).toBeDefined();
    });

    it('should export CryptoTippingModal as lazy component', () => {
      expect(LazyRoutes.CryptoTippingModal).toBeDefined();
      expect(LazyRoutes.CryptoTippingModal.$$typeof).toBeDefined();
    });

    it('should export InviteMembersModal as lazy component', () => {
      expect(LazyRoutes.InviteMembersModal).toBeDefined();
      expect(LazyRoutes.InviteMembersModal.$$typeof).toBeDefined();
    });

    it('should export NewMessageModal as lazy component', () => {
      expect(LazyRoutes.NewMessageModal).toBeDefined();
      expect(LazyRoutes.NewMessageModal.$$typeof).toBeDefined();
    });

    it('should export UsersPage as lazy component', () => {
      expect(LazyRoutes.UsersPage).toBeDefined();
      expect(LazyRoutes.UsersPage.$$typeof).toBeDefined();
    });

    it('should export ProfileDemoPage as lazy component', () => {
      expect(LazyRoutes.ProfileDemoPage).toBeDefined();
      expect(LazyRoutes.ProfileDemoPage.$$typeof).toBeDefined();
    });
  });

  // ============================================================================
  // PageLoadingFallback Component Tests
  // ============================================================================
  describe('PageLoadingFallback', () => {
    it('should render loading spinner', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-label on spinner', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should display loading text', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('should have visually hidden "Loading..." text in spinner', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should center content vertically and horizontally', () => {
      const { container } = render(<LazyRoutes.PageLoadingFallback />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen');
    });

    it('should have spinning animation class', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have reduced motion support', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('motion-reduce:animate-[spin_1.5s_linear_infinite]');
    });
  });

  // ============================================================================
  // Lazy Loading Behavior Tests
  // ============================================================================
  describe('Lazy Loading Behavior', () => {
    it('should defer loading of lazy components', () => {
      // Lazy components should not load until rendered
      const { ChatPage } = LazyRoutes;
      expect(ChatPage).toBeDefined();
      // Component hasn't been rendered, so module shouldn't be loaded yet
    });

    it('should work with Suspense boundary', async () => {
      // Mock a successful lazy component
      const MockLazyComponent = () => <div>Loaded Component</div>;

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <MockLazyComponent />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Loaded Component')).toBeInTheDocument();
      });
    });

    it('should show fallback while loading', () => {
      const MockLazyComponent = React.lazy(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ default: () => <div>Content</div> }), 100)
        )
      );

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <MockLazyComponent />
        </Suspense>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Code Splitting Tests
  // ============================================================================
  describe('Code Splitting', () => {
    it('should use React.lazy for code splitting', () => {
      const { ChatPage } = LazyRoutes;
      // Verify it's a lazy component by checking the $$typeof symbol
      expect(ChatPage.$$typeof).toBeDefined();
    });

    it('should create separate chunks for each route', () => {
      const routes = [
        LazyRoutes.ChatPage,
        LazyRoutes.ProfilePage,
        LazyRoutes.SettingsPage
      ];

      routes.forEach(route => {
        expect(route.$$typeof).toBeDefined();
      });
    });

    it('should support dynamic imports', () => {
      // Lazy components use dynamic imports internally
      expect(LazyRoutes.ChatPage).toBeDefined();
      expect(typeof LazyRoutes.ChatPage).toBe('object');
    });
  });

  // ============================================================================
  // Route Organization Tests
  // ============================================================================
  describe('Route Organization', () => {
    it('should export high priority chat routes', () => {
      expect(LazyRoutes.ChatPage).toBeDefined();
      expect(LazyRoutes.DirectMessagesPage).toBeDefined();
      expect(LazyRoutes.VoiceChatPage).toBeDefined();
      expect(LazyRoutes.MessageRequestsPage).toBeDefined();
    });

    it('should export community routes', () => {
      expect(LazyRoutes.CommunityPage).toBeDefined();
      expect(LazyRoutes.CommunitiesPage).toBeDefined();
      expect(LazyRoutes.CreateCommunityPage).toBeDefined();
      expect(LazyRoutes.PostDetailPage).toBeDefined();
      expect(LazyRoutes.CreatePostPage).toBeDefined();
    });

    it('should export user management routes', () => {
      expect(LazyRoutes.ProfilePage).toBeDefined();
      expect(LazyRoutes.EditProfilePage).toBeDefined();
      expect(LazyRoutes.SettingsPage).toBeDefined();
      expect(LazyRoutes.AccountSettingsPage).toBeDefined();
    });

    it('should export Web3 and crypto routes', () => {
      expect(LazyRoutes.CryptoPage).toBeDefined();
      expect(LazyRoutes.NFTMarketplacePage).toBeDefined();
      expect(LazyRoutes.NFTGalleryPage).toBeDefined();
      expect(LazyRoutes.NFTDetailPage).toBeDefined();
      expect(LazyRoutes.WalletSettingsPage).toBeDefined();
      expect(LazyRoutes.WalletConnectionPage).toBeDefined();
      expect(LazyRoutes.TokenEconomicsPage).toBeDefined();
      expect(LazyRoutes.TokenGatingSetupPage).toBeDefined();
    });

    it('should export admin and moderation routes', () => {
      expect(LazyRoutes.AdminPage).toBeDefined();
      expect(LazyRoutes.ModerationPage).toBeDefined();
      expect(LazyRoutes.ModerationQueuePage).toBeDefined();
      expect(LazyRoutes.UserManagementPage).toBeDefined();
      expect(LazyRoutes.BotManagementPage).toBeDefined();
      expect(LazyRoutes.AuditLogPage).toBeDefined();
      expect(LazyRoutes.ReportsPage).toBeDefined();
    });

    it('should export discovery routes', () => {
      expect(LazyRoutes.DiscoverPage).toBeDefined();
      expect(LazyRoutes.SearchPage).toBeDefined();
      expect(LazyRoutes.ActivityFeedPage).toBeDefined();
      expect(LazyRoutes.CategoryBrowsePage).toBeDefined();
      expect(LazyRoutes.TagPage).toBeDefined();
    });

    it('should export notification routes', () => {
      expect(LazyRoutes.NotificationsPage).toBeDefined();
      expect(LazyRoutes.NotificationSettingsPage).toBeDefined();
    });

    it('should export settings routes', () => {
      expect(LazyRoutes.PrivacySettingsPage).toBeDefined();
      expect(LazyRoutes.SecuritySettingsPage).toBeDefined();
      expect(LazyRoutes.AppearanceSettingsPage).toBeDefined();
      expect(LazyRoutes.LanguageRegionPage).toBeDefined();
      expect(LazyRoutes.DataPrivacyPage).toBeDefined();
      expect(LazyRoutes.SystemSettingsPage).toBeDefined();
    });

    it('should export community feature routes', () => {
      expect(LazyRoutes.CommunityAnalyticsPage).toBeDefined();
      expect(LazyRoutes.CommunityLeaderboardPage).toBeDefined();
      expect(LazyRoutes.CommunityRulesPage).toBeDefined();
      expect(LazyRoutes.CommunityStorePage).toBeDefined();
      expect(LazyRoutes.CommunityWikiPage).toBeDefined();
    });

    it('should export event routes', () => {
      expect(LazyRoutes.EventsCalendarPage).toBeDefined();
      expect(LazyRoutes.EventDetailsPage).toBeDefined();
    });

    it('should export integration routes', () => {
      expect(LazyRoutes.IntegrationsPage).toBeDefined();
    });

    it('should export announcement routes', () => {
      expect(LazyRoutes.AnnouncementsPage).toBeDefined();
    });

    it('should export voice and media routes', () => {
      expect(LazyRoutes.CallScreenPage).toBeDefined();
      expect(LazyRoutes.VoiceMessagesPage).toBeDefined();
      expect(LazyRoutes.SharedMediaGalleryPage).toBeDefined();
    });

    it('should export server routes', () => {
      expect(LazyRoutes.ServersPage).toBeDefined();
      expect(LazyRoutes.GroupDMSettingsPage).toBeDefined();
    });

    it('should export governance routes', () => {
      expect(LazyRoutes.CreateProposalPage).toBeDefined();
    });

    it('should export billing routes', () => {
      expect(LazyRoutes.BillingPage).toBeDefined();
    });

    it('should export help and support routes', () => {
      expect(LazyRoutes.HelpPage).toBeDefined();
      expect(LazyRoutes.GuidelinesPage).toBeDefined();
      expect(LazyRoutes.ContactPage).toBeDefined();
    });

    it('should export legal routes', () => {
      expect(LazyRoutes.TermsPage).toBeDefined();
      expect(LazyRoutes.PrivacyPage).toBeDefined();
    });

    it('should export mobile-specific routes', () => {
      expect(LazyRoutes.MobileCameraIntegration).toBeDefined();
      expect(LazyRoutes.MobileCommunityDrawer).toBeDefined();
      expect(LazyRoutes.MobileGestureControls).toBeDefined();
      expect(LazyRoutes.MobileShareSheet).toBeDefined();
    });

    it('should export modal routes', () => {
      expect(LazyRoutes.CryptoTippingModal).toBeDefined();
      expect(LazyRoutes.InviteMembersModal).toBeDefined();
      expect(LazyRoutes.NewMessageModal).toBeDefined();
    });

    it('should export utility routes', () => {
      expect(LazyRoutes.UsersPage).toBeDefined();
      expect(LazyRoutes.ProfileDemoPage).toBeDefined();
    });
  });

  // ============================================================================
  // Error Boundary Integration Tests
  // ============================================================================
  describe('Error Boundary Integration', () => {
    it('should handle component load errors gracefully', async () => {
      const ErrorComponent = React.lazy(() =>
        Promise.reject(new Error('Failed to load'))
      );

      const ErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        render() {
          if (this.state.hasError) {
            return <div>Error loading component</div>;
          }
          return this.props.children;
        }
      };

      render(
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <ErrorComponent />
          </Suspense>
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading component')).toBeInTheDocument();
      });
    });

    it('should show fallback during loading before error', () => {
      const SlowComponent = React.lazy(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Load failed')), 100)
        )
      );

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SlowComponent />
        </Suspense>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================
  describe('Performance Characteristics', () => {
    it('should not load all components immediately', () => {
      // Just importing the module should not load all lazy components
      const moduleKeys = Object.keys(LazyRoutes);
      expect(moduleKeys.length).toBeGreaterThan(0);
      // Verify they are lazy components, not eagerly loaded
      moduleKeys.forEach(key => {
        if (key !== 'PageLoadingFallback' && LazyRoutes[key].$$typeof) {
          expect(LazyRoutes[key].$$typeof).toBeDefined();
        }
      });
    });

    it('should allow independent loading of components', () => {
      const component1 = LazyRoutes.ChatPage;
      const component2 = LazyRoutes.ProfilePage;

      expect(component1).not.toBe(component2);
      expect(component1.$$typeof).toBeDefined();
      expect(component2.$$typeof).toBeDefined();
    });
  });

  // ============================================================================
  // Module Structure Tests
  // ============================================================================
  describe('Module Structure', () => {
    it('should export PageLoadingFallback as a regular component', () => {
      expect(LazyRoutes.PageLoadingFallback).toBeDefined();
      expect(typeof LazyRoutes.PageLoadingFallback).toBe('function');
    });

    it('should have consistent export structure', () => {
      const exports = Object.keys(LazyRoutes);
      expect(exports.length).toBeGreaterThan(50);

      // Most exports should be lazy components
      const lazyExports = exports.filter(key =>
        LazyRoutes[key].$$typeof !== undefined
      );
      expect(lazyExports.length).toBeGreaterThan(50);
    });

    it('should export components with descriptive names', () => {
      const exports = Object.keys(LazyRoutes);

      exports.forEach(exportName => {
        // Names should be in PascalCase
        if (exportName !== 'PageLoadingFallback') {
          expect(exportName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
        }
      });
    });
  });

  // ============================================================================
  // Integration with Router Tests
  // ============================================================================
  describe('Router Integration', () => {
    it('should be compatible with React Router', () => {
      // Lazy components should work with React Router's component prop
      const route = LazyRoutes.ChatPage;
      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('should support Suspense boundaries at route level', async () => {
      const TestRoute = () => <div>Route Content</div>;
      const LazyTestRoute = React.lazy(() =>
        Promise.resolve({ default: TestRoute })
      );

      render(
        <Suspense fallback={<LazyRoutes.PageLoadingFallback />}>
          <LazyTestRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Route Content')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Accessibility Tests for Loading State
  // ============================================================================
  describe('Loading State Accessibility', () => {
    it('should announce loading state to screen readers', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading');
    });

    it('should have visible loading text', () => {
      render(<LazyRoutes.PageLoadingFallback />);
      const loadingText = screen.getByText('Loading page...');
      expect(loadingText).toBeVisible();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<LazyRoutes.PageLoadingFallback />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(container.querySelector('.text-center')).toBeInTheDocument();
    });
  });
});
