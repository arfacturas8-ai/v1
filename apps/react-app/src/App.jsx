import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { HeroUIProvider } from '@heroui/react'

// Production Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { OnboardingProvider } from './contexts/OnboardingContext.jsx'
import { NavigationProvider } from './contexts/NavigationContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

// Core Components
import { Web3Provider } from './Web3Provider'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LazyRoute from './components/LazyRoute'
import Header from './components/Header'
import MobileHeader from './components/MobileHeader'
import MobileBottomNav from './components/Navigation/MobileBottomNav'
import CookieConsent from './components/CookieConsent'
import TermsAcceptanceModal from './components/TermsAcceptanceModal'
import PageLoader from './components/PageLoader'
import OnboardingOverlay from './components/onboarding/OnboardingOverlay'
import CommandPalette from './components/CommandPalette'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import { UndoToastContainer } from './components/UndoToast'

// Hooks
import { useCommandPalette } from './hooks/useCommandPalette'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useUndoToast } from './hooks/useUndoToast'
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard'

// Analytics
import { usePageTracking } from './hooks/useAnalytics'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DocProgressPage = lazy(() => import('./pages/DocProgressPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const CreateCommunityPage = lazy(() => import('./pages/CreateCommunityPage'))
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ProfileDemoPage = lazy(() => import('./pages/ProfileDemoPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const TokenEconomicsPage = lazy(() => import('./pages/TokenEconomicsPage'))
const CryptoPage = lazy(() => import('./pages/CryptoPage'))
const NFTMarketplacePage = lazy(() => import('./pages/NFTMarketplacePage'))
const BotManagementPage = lazy(() => import('./pages/BotManagementPage'))
const VoiceChatPage = lazy(() => import('./pages/VoiceChatPage'))
const DirectMessagesPage = lazy(() => import('./pages/DirectMessagesPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ServersPage = lazy(() => import('./pages/ServersPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ModerationPage = lazy(() => import('./pages/ModerationPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'))
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const OnboardingFlowPage = lazy(() => import('./pages/OnboardingFlowPage'))
const MFASetupPage = lazy(() => import('./pages/MFASetupPage'))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'))
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'))
const RateLimitedPage = lazy(() => import('./pages/RateLimitedPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const NFTGalleryPage = lazy(() => import('./pages/NFTGalleryPage'))
const WalletConnectionPage = lazy(() => import('./pages/WalletConnectionPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))

// Create Hub
const CreateHubPage = lazy(() => import('./pages/CreateHubPage'))

// COMING SOON - Crypto Features
const MarketsPage = lazy(() => import('./pages/MarketsPage'))
const TradePage = lazy(() => import('./pages/TradePage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const NFTMintPage = lazy(() => import('./pages/NFTMintPage'))
const DeFiPage = lazy(() => import('./pages/DeFiPage'))

// NEW SCREENS - Messaging & DMs
const NewMessageModal = lazy(() => import('./pages/NewMessageModal'))
const MessageRequestsPage = lazy(() => import('./pages/MessageRequestsPage'))
const VoiceMessagesPage = lazy(() => import('./pages/VoiceMessagesPage'))
const CallScreenPage = lazy(() => import('./pages/CallScreenPage'))
const CallsPage = lazy(() => import('./pages/CallsPage'))
const ActiveCallPage = lazy(() => import('./pages/ActiveCallPage'))
const GroupDMSettingsPage = lazy(() => import('./pages/GroupDMSettingsPage'))
const SharedMediaGalleryPage = lazy(() => import('./pages/SharedMediaGalleryPage'))

// NEW SCREENS - Search & Discovery
const TagPage = lazy(() => import('./pages/TagPage'))
const CategoryBrowsePage = lazy(() => import('./pages/CategoryBrowsePage'))

// NEW SCREENS - Web3 & NFT
const NFTDetailPage = lazy(() => import('./pages/NFTDetailPage'))
const TokenGatingSetupPage = lazy(() => import('./pages/TokenGatingSetupPage'))
const CryptoTippingModal = lazy(() => import('./pages/CryptoTippingModal'))
const CreateProposalPage = lazy(() => import('./pages/CreateProposalPage'))

// NEW SCREENS - Error & Edge Cases
const NetworkOfflinePage = lazy(() => import('./pages/NetworkOfflinePage'))
const BrowserNotSupportedPage = lazy(() => import('./pages/BrowserNotSupportedPage'))
const AccountSuspendedPage = lazy(() => import('./pages/AccountSuspendedPage'))

// NEW SCREENS - Admin & Moderation
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'))
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'))

// NEW SCREENS - Authentication & Security
const MFALoginPage = lazy(() => import('./pages/MFALoginPage'))
const PasskeySetupPage = lazy(() => import('./pages/PasskeySetupPage'))
const AccountRecoveryPage = lazy(() => import('./pages/AccountRecoveryPage'))

// NEW SCREENS - Community Features
const InviteMembersModal = lazy(() => import('./pages/InviteMembersModal'))
const CommunityAnalyticsPage = lazy(() => import('./pages/CommunityAnalyticsPage'))
const ModerationQueuePage = lazy(() => import('./pages/ModerationQueuePage'))
const CommunityRulesPage = lazy(() => import('./pages/CommunityRulesPage'))
const EventsCalendarPage = lazy(() => import('./pages/EventsCalendarPage'))
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'))
const CommunityStorePage = lazy(() => import('./pages/CommunityStorePage'))
const CommunityLeaderboardPage = lazy(() => import('./pages/CommunityLeaderboardPage'))
const CommunityWikiPage = lazy(() => import('./pages/CommunityWikiPage'))

// NEW SCREENS - User Profile & Settings
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'))
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'))
const PrivacySettingsPage = lazy(() => import('./pages/PrivacySettingsPage'))
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'))
const AppearanceSettingsPage = lazy(() => import('./pages/AppearanceSettingsPage'))
const SecuritySettingsPage = lazy(() => import('./pages/SecuritySettingsPage'))
const WalletSettingsPage = lazy(() => import('./pages/WalletSettingsPage'))
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))
const LanguageRegionPage = lazy(() => import('./pages/LanguageRegionPage'))
const DataPrivacyPage = lazy(() => import('./pages/DataPrivacyPage'))

// NEW SCREENS - Mobile Specific
const MobileCommunityDrawer = lazy(() => import('./pages/MobileCommunityDrawer'))
const MobileCameraIntegration = lazy(() => import('./pages/MobileCameraIntegration'))
const MobileShareSheet = lazy(() => import('./pages/MobileShareSheet'))
const MobileGestureControls = lazy(() => import('./pages/MobileGestureControls'))

// Analytics wrapper to track page views
function AnalyticsWrapper({ children }) {
  usePageTracking()
  return children
}

// Layout wrapper for authenticated pages
function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* Main Content with bottom padding for mobile nav */}
      <main className="pb-16 lg:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Onboarding Overlay (shows for new users) */}
      <OnboardingOverlay />
    </div>
  )
}

// Root App Component
export default function App() {
  // Command Palette
  const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette()

  // Keyboard Shortcuts Modal
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = React.useState(false)
  useKeyboardShortcuts({ onShowHelp: () => setIsShortcutsModalOpen(true) })

  // Undo Toast System
  const { toasts, removeToast } = useUndoToast()

  // Virtual Keyboard handling for mobile
  useVirtualKeyboard({
    adjustViewport: true,
    onKeyboardShow: (height) => {
      // Keyboard opened - viewport adjusted automatically
    },
    onKeyboardHide: () => {
      // Keyboard closed - viewport restored automatically
    }
  })

  return (
    <ErrorBoundary name="App">
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <ThemeProvider>
            <NavigationProvider>
              <AuthProvider>
                <ToastProvider>
                  <OnboardingProvider>
                    <Web3Provider autoConnect={false}>
                      <AnalyticsWrapper>
                    {/* Global UI Components */}
                    <CookieConsent />
                    <TermsAcceptanceModal />
                    <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
                    <KeyboardShortcutsModal
                      isOpen={isShortcutsModalOpen}
                      onClose={() => setIsShortcutsModalOpen(false)}
                    />
                    <UndoToastContainer toasts={toasts} onRemove={removeToast} />

                      <Routes>
                    {/* ========== PUBLIC ROUTES ========== */}
                    <Route path="/" element={<LazyRoute component={LandingPage} name="LandingPage" />} />
                  <Route path="/landing" element={<LazyRoute component={LandingPage} name="LandingPage" />} />
                  <Route path="/doc-progress" element={<LazyRoute component={DocProgressPage} name="DocProgressPage" />} />
                  <Route path="/login" element={<LazyRoute component={LoginPage} name="LoginPage" />} />
                  <Route path="/register" element={<LazyRoute component={RegisterPage} name="RegisterPage" />} />
                  <Route path="/signup" element={<LazyRoute component={RegisterPage} name="RegisterPage" />} />
                  <Route path="/privacy" element={<LazyRoute component={PrivacyPage} name="PrivacyPage" />} />
                  <Route path="/terms" element={<LazyRoute component={TermsPage} name="TermsPage" />} />
                  <Route path="/guidelines" element={<LazyRoute component={GuidelinesPage} name="GuidelinesPage" />} />
                  <Route path="/help" element={<LazyRoute component={HelpPage} name="HelpPage" />} />
                  <Route path="/docs" element={<LazyRoute component={HelpPage} name="HelpPage" />} />
                  <Route path="/faq" element={<LazyRoute component={HelpPage} name="HelpPage" />} />
                  <Route path="/about" element={<LazyRoute component={HelpPage} name="HelpPage" />} />
                  <Route path="/contact" element={<LazyRoute component={ContactPage} name="ContactPage" />} />
                  <Route path="/tokenomics" element={<LazyRoute component={TokenEconomicsPage} name="TokenEconomicsPage" />} />
                  <Route path="/token-economics" element={<LazyRoute component={TokenEconomicsPage} name="TokenEconomicsPage" />} />
                  <Route path="/verify-email" element={<LazyRoute component={EmailVerificationPage} name="EmailVerificationPage" />} />
                  <Route path="/reset-password" element={<LazyRoute component={PasswordResetPage} name="PasswordResetPage" />} />
                  <Route path="/password-reset" element={<LazyRoute component={PasswordResetPage} name="PasswordResetPage" />} />
                  <Route path="/forgot-password" element={<LazyRoute component={ForgotPasswordPage} name="ForgotPasswordPage" />} />
                  <Route path="/account-recovery" element={<LazyRoute component={AccountRecoveryPage} name="AccountRecoveryPage" />} />
                  <Route path="/mfa-login" element={<LazyRoute component={MFALoginPage} name="MFALoginPage" />} />
                  <Route path="/oauth/callback" element={<LazyRoute component={OAuthCallbackPage} name="OAuthCallbackPage" />} />
                  <Route path="/maintenance" element={<LazyRoute component={MaintenancePage} name="MaintenancePage" />} />
                  <Route path="/403" element={<LazyRoute component={ForbiddenPage} name="ForbiddenPage" />} />
                  <Route path="/forbidden" element={<LazyRoute component={ForbiddenPage} name="ForbiddenPage" />} />
                  <Route path="/500" element={<LazyRoute component={ServerErrorPage} name="ServerErrorPage" />} />
                  <Route path="/429" element={<LazyRoute component={RateLimitedPage} name="RateLimitedPage" />} />

                  {/* ========== PROTECTED ROUTES (Require Auth) ========== */}
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={HomePage} name="HomePage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Posts/Feed */}
                  <Route
                    path="/posts"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ActivityFeedPage} name="ActivityFeedPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Wallet */}
                  <Route
                    path="/wallet"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={WalletSettingsPage} name="WalletSettingsPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ChatPage} name="ChatPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/servers"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ServersPage} name="ServersPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/voice"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={VoiceChatPage} name="VoiceChatPage" />
                      </ProtectedRoute>
                    }
                  />

                  {/* Direct Messages */}
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={DirectMessagesPage} name="DirectMessagesPage" />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/direct-messages"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={DirectMessagesPage} name="DirectMessagesPage" />
                      </ProtectedRoute>
                    }
                  />

                  {/* New message modal */}
                  <Route
                    path="/direct-messages/new"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={NewMessageModal} name="NewMessageModal" />
                      </ProtectedRoute>
                    }
                  />

                  {/* Message Requests */}
                  <Route
                    path="/message-requests"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={MessageRequestsPage} name="MessageRequestsPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/messages/:conversationId"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={DirectMessagesPage} name="DirectMessagesPage" />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={NotificationsPage} name="NotificationsPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/communities"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CommunitiesPage} name="CommunitiesPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Teams (alias for communities) */}
                  <Route
                    path="/teams"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CommunitiesPage} name="CommunitiesPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/community/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CommunityPage} name="CommunityPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/create-community"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CreateCommunityPage} name="CreateCommunityPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/communities/create"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CreateCommunityPage} name="CreateCommunityPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Create Hub */}
                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CreateHubPage} name="CreateHubPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Create Post */}
                  <Route
                    path="/submit"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CreatePostPage} name="CreatePostPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/create-post"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CreatePostPage} name="CreatePostPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/post/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={PostDetailPage} name="PostDetailPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Current user's profile */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ProfilePage} name="ProfilePage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Other user's profile */}
                  <Route
                    path="/profile/:username"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ProfilePage} name="ProfilePage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile-demo"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ProfileDemoPage} name="ProfileDemoPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={SettingsPage} name="SettingsPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={SearchPage} name="SearchPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/activity"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ActivityFeedPage} name="ActivityFeedPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/discover"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={DiscoverPage} name="DiscoverPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/explore"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ExplorePage} name="ExplorePage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={OnboardingPage} name="OnboardingPage" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/flow"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={OnboardingFlowPage} name="OnboardingFlowPage" />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/mfa-setup"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={MFASetupPage} name="MFASetupPage" />
                      </ProtectedRoute>
                    }
                  />

                  {/* NFT Gallery */}
                  <Route
                    path="/nft"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={NFTGalleryPage} name="NFTGalleryPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/nft-gallery"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={NFTGalleryPage} name="NFTGalleryPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/wallet-connect"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={WalletConnectionPage} name="WalletConnectionPage" />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={UsersPage} name="UsersPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={ReportsPage} name="ReportsPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/crypto"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CryptoPage} name="CryptoPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Governance (DAO features in CryptoPage) */}
                  <Route
                    path="/governance"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={CryptoPage} name="CryptoPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/nft-marketplace"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={NFTMarketplacePage} name="NFTMarketplacePage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/bots"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LazyRoute component={BotManagementPage} name="BotManagementPage" />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={AdminPage} name="AdminPage" />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/moderation"
                    element={
                      <ProtectedRoute>
                        <LazyRoute component={ModerationPage} name="ModerationPage" />
                      </ProtectedRoute>
                    }
                  />

                  {/* ========== NEW ROUTES - MESSAGING & DMS ========== */}
                  <Route path="/messages/new" element={<ProtectedRoute><AppLayout><LazyRoute component={NewMessageModal} name="NewMessageModal" isOpen={true} /></AppLayout></ProtectedRoute>} />
                  <Route path="/voice-messages" element={<ProtectedRoute><AppLayout><LazyRoute component={VoiceMessagesPage} name="VoiceMessagesPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/call/:callId" element={<ProtectedRoute><LazyRoute component={CallScreenPage} name="CallScreenPage" /></ProtectedRoute>} />
                  <Route path="/messages/:conversationId/settings" element={<ProtectedRoute><AppLayout><LazyRoute component={GroupDMSettingsPage} name="GroupDMSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/messages/:conversationId/media" element={<ProtectedRoute><AppLayout><LazyRoute component={SharedMediaGalleryPage} name="SharedMediaGalleryPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/files" element={<ProtectedRoute><AppLayout><LazyRoute component={SharedMediaGalleryPage} name="SharedMediaGalleryPage" /></AppLayout></ProtectedRoute>} />

                  {/* Calls */}
                  <Route path="/calls" element={<ProtectedRoute><AppLayout><LazyRoute component={CallsPage} name="CallsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/calls/:callId" element={<ProtectedRoute><LazyRoute component={ActiveCallPage} name="ActiveCallPage" /></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - SEARCH & DISCOVERY ========== */}
                  <Route path="/tag/:tag" element={<ProtectedRoute><AppLayout><LazyRoute component={TagPage} name="TagPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/categories" element={<ProtectedRoute><AppLayout><LazyRoute component={CategoryBrowsePage} name="CategoryBrowsePage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/category/:categoryId" element={<ProtectedRoute><AppLayout><LazyRoute component={CategoryBrowsePage} name="CategoryBrowsePage" /></AppLayout></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - WEB3 & NFT ========== */}
                  <Route path="/nft/:nftId" element={<ProtectedRoute><AppLayout><LazyRoute component={NFTDetailPage} name="NFTDetailPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/token-gating" element={<ProtectedRoute><AppLayout><LazyRoute component={TokenGatingSetupPage} name="TokenGatingSetupPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/crypto-tip" element={<ProtectedRoute><AppLayout><LazyRoute component={CryptoTippingModal} name="CryptoTippingModal" isOpen={true} /></AppLayout></ProtectedRoute>} />
                  <Route path="/proposals/create" element={<ProtectedRoute><AppLayout><LazyRoute component={CreateProposalPage} name="CreateProposalPage" /></AppLayout></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - ERROR & EDGE CASES ========== */}
                  <Route path="/offline" element={<LazyRoute component={NetworkOfflinePage} name="NetworkOfflinePage" />} />
                  <Route path="/browser-not-supported" element={<LazyRoute component={BrowserNotSupportedPage} name="BrowserNotSupportedPage" />} />
                  <Route path="/account-suspended" element={<LazyRoute component={AccountSuspendedPage} name="AccountSuspendedPage" />} />

                  {/* ========== NEW ROUTES - ADMIN & MODERATION ========== */}
                  <Route path="/admin/users" element={<ProtectedRoute><AppLayout><LazyRoute component={UserManagementPage} name="UserManagementPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AppLayout><LazyRoute component={SystemSettingsPage} name="SystemSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/announcements" element={<ProtectedRoute><AppLayout><LazyRoute component={AnnouncementsPage} name="AnnouncementsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/audit-log" element={<ProtectedRoute><AppLayout><LazyRoute component={AuditLogPage} name="AuditLogPage" /></AppLayout></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - COMMUNITY FEATURES ========== */}
                  <Route path="/community/:id/invite" element={<ProtectedRoute><AppLayout><LazyRoute component={InviteMembersModal} name="InviteMembersModal" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/analytics" element={<ProtectedRoute><AppLayout><LazyRoute component={CommunityAnalyticsPage} name="CommunityAnalyticsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/moderation-queue" element={<ProtectedRoute><AppLayout><LazyRoute component={ModerationQueuePage} name="ModerationQueuePage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/rules" element={<ProtectedRoute><AppLayout><LazyRoute component={CommunityRulesPage} name="CommunityRulesPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/events" element={<ProtectedRoute><AppLayout><LazyRoute component={EventsCalendarPage} name="EventsCalendarPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/events/:eventId" element={<ProtectedRoute><AppLayout><LazyRoute component={EventDetailsPage} name="EventDetailsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/store" element={<ProtectedRoute><AppLayout><LazyRoute component={CommunityStorePage} name="CommunityStorePage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/leaderboard" element={<ProtectedRoute><AppLayout><LazyRoute component={CommunityLeaderboardPage} name="CommunityLeaderboardPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/community/:id/wiki" element={<ProtectedRoute><AppLayout><LazyRoute component={CommunityWikiPage} name="CommunityWikiPage" /></AppLayout></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - USER PROFILE & SETTINGS ========== */}
                  <Route path="/profile/edit" element={<ProtectedRoute><AppLayout><LazyRoute component={EditProfilePage} name="EditProfilePage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/account" element={<ProtectedRoute><AppLayout><LazyRoute component={AccountSettingsPage} name="AccountSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/privacy" element={<ProtectedRoute><AppLayout><LazyRoute component={PrivacySettingsPage} name="PrivacySettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/notifications" element={<ProtectedRoute><AppLayout><LazyRoute component={NotificationSettingsPage} name="NotificationSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/appearance" element={<ProtectedRoute><AppLayout><LazyRoute component={AppearanceSettingsPage} name="AppearanceSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/security" element={<ProtectedRoute><AppLayout><LazyRoute component={SecuritySettingsPage} name="SecuritySettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/security/passkey" element={<ProtectedRoute><AppLayout><LazyRoute component={PasskeySetupPage} name="PasskeySetupPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/wallet" element={<ProtectedRoute><AppLayout><LazyRoute component={WalletSettingsPage} name="WalletSettingsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/integrations" element={<ProtectedRoute><AppLayout><LazyRoute component={IntegrationsPage} name="IntegrationsPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/billing" element={<ProtectedRoute><AppLayout><LazyRoute component={BillingPage} name="BillingPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/language" element={<ProtectedRoute><AppLayout><LazyRoute component={LanguageRegionPage} name="LanguageRegionPage" /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings/data-privacy" element={<ProtectedRoute><AppLayout><LazyRoute component={DataPrivacyPage} name="DataPrivacyPage" /></AppLayout></ProtectedRoute>} />

                  {/* ========== COMING SOON ROUTES - CRYPTO FEATURES ========== */}
                  <Route path="/markets" element={<ProtectedRoute><LazyRoute component={MarketsPage} name="MarketsPage" /></ProtectedRoute>} />
                  <Route path="/trade" element={<ProtectedRoute><LazyRoute component={TradePage} name="TradePage" /></ProtectedRoute>} />
                  <Route path="/swap" element={<ProtectedRoute><LazyRoute component={TradePage} name="TradePage" /></ProtectedRoute>} />
                  <Route path="/portfolio" element={<ProtectedRoute><LazyRoute component={PortfolioPage} name="PortfolioPage" /></ProtectedRoute>} />
                  <Route path="/defi" element={<ProtectedRoute><LazyRoute component={DeFiPage} name="DeFiPage" /></ProtectedRoute>} />
                  <Route path="/mint-nft" element={<ProtectedRoute><LazyRoute component={NFTMintPage} name="NFTMintPage" /></ProtectedRoute>} />
                  <Route path="/create-nft" element={<ProtectedRoute><LazyRoute component={NFTMintPage} name="NFTMintPage" /></ProtectedRoute>} />

                  {/* ========== NEW ROUTES - MOBILE SPECIFIC ========== */}
                  <Route path="/mobile/drawer" element={<ProtectedRoute><LazyRoute component={MobileCommunityDrawer} name="MobileCommunityDrawer" isOpen={true} /></ProtectedRoute>} />
                  <Route path="/mobile/camera" element={<ProtectedRoute><LazyRoute component={MobileCameraIntegration} name="MobileCameraIntegration" /></ProtectedRoute>} />
                  <Route path="/mobile/share" element={<ProtectedRoute><LazyRoute component={MobileShareSheet} name="MobileShareSheet" isOpen={true} /></ProtectedRoute>} />
                  <Route path="/mobile/gestures" element={<ProtectedRoute><AppLayout><LazyRoute component={MobileGestureControls} name="MobileGestureControls" /></AppLayout></ProtectedRoute>} />

                  {/* ========== 404 NOT FOUND ========== */}
                  <Route path="*" element={<LazyRoute component={NotFoundPage} name="NotFoundPage" />} />
                      </Routes>
                    </AnalyticsWrapper>
                  </Web3Provider>
                </OnboardingProvider>
              </ToastProvider>
            </AuthProvider>
          </NavigationProvider>
        </ThemeProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// Export auth hook for backward compatibility
export { useAuth }
