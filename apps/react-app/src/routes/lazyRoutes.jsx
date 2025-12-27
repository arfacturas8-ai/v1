import { lazy } from 'react';

/**
 * Lazy-loaded routes for code splitting and better performance
 * These pages are loaded on-demand rather than in the initial bundle
 */

// === HIGH PRIORITY PAGES (Load on demand) ===

// Chat & Messaging
export const ChatPage = lazy(() => import('../pages/ChatPage'));
export const DirectMessagesPage = lazy(() => import('../pages/DirectMessagesPage'));
export const VoiceChatPage = lazy(() => import('../pages/VoiceChatPage'));
export const MessageRequestsPage = lazy(() => import('../pages/MessageRequestsPage'));

// Communities & Content
export const CommunityPage = lazy(() => import('../pages/CommunityPage'));
export const CommunitiesPage = lazy(() => import('../pages/CommunitiesPage'));
export const CreateCommunityPage = lazy(() => import('../pages/CreateCommunityPage'));
export const PostDetailPage = lazy(() => import('../pages/PostDetailPage'));
export const CreatePostPage = lazy(() => import('../pages/CreatePostPage'));

// User Management
export const ProfilePage = lazy(() => import('../pages/ProfilePage'));
export const EditProfilePage = lazy(() => import('../pages/EditProfilePage'));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const AccountSettingsPage = lazy(() => import('../pages/AccountSettingsPage'));

// Web3 & Crypto
export const NFTMarketplacePage = lazy(() => import('../pages/NFTMarketplacePage'));
export const NFTGalleryPage = lazy(() => import('../pages/NFTGalleryPage'));
export const NFTDetailPage = lazy(() => import('../pages/NFTDetailPage'));
export const WalletSettingsPage = lazy(() => import('../pages/WalletSettingsPage'));
export const WalletConnectionPage = lazy(() => import('../pages/WalletConnectionPage'));
export const TokenEconomicsPage = lazy(() => import('../pages/TokenEconomicsPage'));
export const TokenGatingSetupPage = lazy(() => import('../pages/TokenGatingSetupPage'));

// Admin & Moderation
export const AdminPage = lazy(() => import('../pages/AdminPage'));
export const ModerationPage = lazy(() => import('../pages/ModerationPage'));
export const ModerationQueuePage = lazy(() => import('../pages/ModerationQueuePage'));
export const UserManagementPage = lazy(() => import('../pages/UserManagementPage'));
export const BotManagementPage = lazy(() => import('../pages/BotManagementPage'));
export const AuditLogPage = lazy(() => import('../pages/AuditLogPage'));
export const ReportsPage = lazy(() => import('../pages/ReportsPage'));

// === MEDIUM PRIORITY PAGES ===

// Discovery & Navigation
export const DiscoverPage = lazy(() => import('../pages/DiscoverPage'));
export const SearchPage = lazy(() => import('../pages/SearchPage'));
export const ActivityFeedPage = lazy(() => import('../pages/ActivityFeedPage'));
export const CategoryBrowsePage = lazy(() => import('../pages/CategoryBrowsePage'));
export const TagPage = lazy(() => import('../pages/TagPage'));

// Notifications & Communication
export const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
export const NotificationSettingsPage = lazy(() => import('../pages/NotificationSettingsPage'));

// Settings
export const PrivacySettingsPage = lazy(() => import('../pages/PrivacySettingsPage'));
export const SecuritySettingsPage = lazy(() => import('../pages/SecuritySettingsPage'));
export const AppearanceSettingsPage = lazy(() => import('../pages/AppearanceSettingsPage'));
export const NotificationSettingsPage2 = lazy(() => import('../pages/NotificationSettingsPage'));
export const LanguageRegionPage = lazy(() => import('../pages/LanguageRegionPage'));
export const DataPrivacyPage = lazy(() => import('../pages/DataPrivacyPage'));
export const SystemSettingsPage = lazy(() => import('../pages/SystemSettingsPage'));

// Community Features
export const CommunityAnalyticsPage = lazy(() => import('../pages/CommunityAnalyticsPage'));
export const CommunityLeaderboardPage = lazy(() => import('../pages/CommunityLeaderboardPage'));
export const CommunityRulesPage = lazy(() => import('../pages/CommunityRulesPage'));
export const CommunityStorePage = lazy(() => import('../pages/CommunityStorePage'));
export const CommunityWikiPage = lazy(() => import('../pages/CommunityWikiPage'));

// Events
export const EventsCalendarPage = lazy(() => import('../pages/EventsCalendarPage'));
export const EventDetailsPage = lazy(() => import('../pages/EventDetailsPage'));

// Integrations
export const IntegrationsPage = lazy(() => import('../pages/IntegrationsPage'));

// Announcements
export const AnnouncementsPage = lazy(() => import('../pages/AnnouncementsPage'));

// === LOW PRIORITY PAGES (Heavy/Infrequent) ===

// Voice & Media
export const CallScreenPage = lazy(() => import('../pages/CallScreenPage'));
export const VoiceMessagesPage = lazy(() => import('../pages/VoiceMessagesPage'));
export const SharedMediaGalleryPage = lazy(() => import('../pages/SharedMediaGalleryPage'));

// Servers
export const ServersPage = lazy(() => import('../pages/ServersPage'));
export const GroupDMSettingsPage = lazy(() => import('../pages/GroupDMSettingsPage'));

// Governance
export const CreateProposalPage = lazy(() => import('../pages/CreateProposalPage'));

// Billing
export const BillingPage = lazy(() => import('../pages/BillingPage'));

// Help & Support
export const HelpPage = lazy(() => import('../pages/HelpPage'));
export const GuidelinesPage = lazy(() => import('../pages/GuidelinesPage'));
export const ContactPage = lazy(() => import('../pages/ContactPage'));

// Legal
export const TermsPage = lazy(() => import('../pages/TermsPage'));
export const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));

// Mobile Components
export const MobileCameraIntegration = lazy(() => import('../pages/MobileCameraIntegration'));
export const MobileCommunityDrawer = lazy(() => import('../pages/MobileCommunityDrawer'));
export const MobileGestureControls = lazy(() => import('../pages/MobileGestureControls'));
export const MobileShareSheet = lazy(() => import('../pages/MobileShareSheet'));

// Modals & Overlays
export const CryptoTippingModal = lazy(() => import('../pages/CryptoTippingModal'));
export const InviteMembersModal = lazy(() => import('../pages/InviteMembersModal'));
export const NewMessageModal = lazy(() => import('../pages/NewMessageModal'));

// === ERROR & STATUS PAGES (Always needed, keep small) ===
// Don't lazy load these - they should be available immediately

export const UsersPage = lazy(() => import('../pages/UsersPage'));
export const ProfileDemoPage = lazy(() => import('../pages/ProfileDemoPage'));

/**
 * Loading fallback component
 */
export const PageLoadingFallback = () => null;

export default ChatPage
