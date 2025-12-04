/**
 * CRYB.AI Molecular Components - Usage Examples
 *
 * This file demonstrates how to use the molecular components in real-world scenarios.
 * These are reference examples - not meant to be imported directly.
 */

import React from 'react';
import {
  Card,
  ListItem,
  SearchBar,
  Header,
  TabBar,
  SegmentedControl,
  Menu,
  Modal,
  BottomSheet,
  Toast,
  Alert,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonListItem,
} from './index';

// Example 1: User Profile Card
export const UserProfileCard = () => {
  const [isFollowing, setIsFollowing] = React.useState(false);

  return (
    <Card variant="elevated" padding={5}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/avatar.jpg"
          alt="User"
          style={{ width: '60px', height: '60px', borderRadius: '50%' }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>John Doe</h3>
          <p style={{ margin: 0, color: '#A0A0A0' }}>@johndoe</p>
        </div>
        <button onClick={() => setIsFollowing(!isFollowing)}>
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </Card>
  );
};

// Example 2: Message List with Search
export const MessageList = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [messages, setMessages] = React.useState([
    { id: '1', name: 'Alice', message: 'Hey there!', time: '2m', avatar: '/alice.jpg' },
    { id: '2', name: 'Bob', message: 'Meeting at 3?', time: '5m', avatar: '/bob.jpg' },
  ]);

  return (
    <div>
      <SearchBar
        value={searchQuery}
        placeholder="Search messages..."
        onChange={setSearchQuery}
        showCancel
      />
      <div style={{ marginTop: '16px' }}>
        {messages.map((msg) => (
          <ListItem
            key={msg.id}
            leftAvatar={msg.avatar}
            title={msg.name}
            subtitle={msg.message}
            rightText={msg.time}
            swipeActions={[
              {
                label: 'Delete',
                icon: <span>🗑️</span>,
                backgroundColor: '#FF3B3B',
                onAction: () => console.log('Delete', msg.id),
              },
            ]}
            onClick={() => console.log('Open chat', msg.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Example 3: Settings Page with Header
export const SettingsPage = () => {
  const [viewMode, setViewMode] = React.useState('list');

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your preferences"
        showBackButton
        rightActions={[
          {
            id: 'search',
            icon: <span>🔍</span>,
            label: 'Search',
            onClick: () => console.log('Search settings'),
          },
        ]}
        onBack={() => window.history.back()}
      />

      <div style={{ padding: '16px' }}>
        <SegmentedControl
          segments={[
            { id: 'list', label: 'List', icon: <span>📋</span> },
            { id: 'grid', label: 'Grid', icon: <span>▦</span> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>
    </div>
  );
};

// Example 4: Bottom Navigation
export const AppLayout = () => {
  const [activeTab, setActiveTab] = React.useState('home');

  return (
    <div>
      {/* Main content */}
      <div style={{ paddingBottom: '72px' }}>
        {activeTab === 'home' && <div>Home Content</div>}
        {activeTab === 'explore' && <div>Explore Content</div>}
        {activeTab === 'profile' && <div>Profile Content</div>}
      </div>

      {/* Bottom Tab Bar */}
      <TabBar
        position="bottom"
        activeTab={activeTab}
        tabs={[
          { id: 'home', label: 'Home', icon: <span>🏠</span>, badge: 5 },
          { id: 'explore', label: 'Explore', icon: <span>🧭</span> },
          { id: 'profile', label: 'Profile', icon: <span>👤</span> },
        ]}
        onChange={setActiveTab}
      />
    </div>
  );
};

// Example 5: Confirmation Dialog
export const DeleteConfirmation = () => {
  const [showAlert, setShowAlert] = React.useState(false);

  return (
    <>
      <button onClick={() => setShowAlert(true)}>Delete Account</button>

      <Alert
        isOpen={showAlert}
        variant="destructive"
        title="Delete Account?"
        message="This action cannot be undone. All your data will be permanently deleted."
        actions={[
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: () => {
              console.log('Account deleted');
              setShowAlert(false);
            },
          },
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowAlert(false),
          },
        ]}
      />
    </>
  );
};

// Example 6: Toast Notifications
export const NotificationExample = () => {
  const [toast, setToast] = React.useState<any>(null);

  const showSuccess = () => {
    setToast({
      variant: 'success',
      message: 'Changes saved',
      description: 'Your profile has been updated successfully',
    });
  };

  const showError = () => {
    setToast({
      variant: 'error',
      message: 'Upload failed',
      description: 'File size exceeds 10MB limit',
      actionLabel: 'Retry',
      onAction: () => console.log('Retrying...'),
    });
  };

  return (
    <>
      <button onClick={showSuccess}>Show Success</button>
      <button onClick={showError}>Show Error</button>

      {toast && (
        <Toast
          {...toast}
          position="bottom"
          duration={4000}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
};

// Example 7: Modal with Form
export const EditProfileModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Edit Profile</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Profile"
        size="md"
        footer={
          <>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => {
              console.log('Save', name);
              setIsOpen(false);
            }}>
              Save
            </button>
          </>
        }
      >
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
      </Modal>
    </>
  );
};

// Example 8: Bottom Sheet with Filters
export const FilterSheet = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [category, setCategory] = React.useState('all');

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Filters</button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={[80, 50]}
        title="Filter Results"
      >
        <div>
          <h4>Category</h4>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            <option value="tech">Technology</option>
            <option value="design">Design</option>
          </select>
        </div>
      </BottomSheet>
    </>
  );
};

// Example 9: Empty State
export const EmptyInbox = () => {
  return (
    <EmptyState
      icon={<span style={{ fontSize: '64px' }}>📭</span>}
      title="No messages yet"
      description="Start a conversation to see your messages here"
      ctaLabel="New Message"
      ctaIcon={<span>✉️</span>}
      onCtaClick={() => console.log('Compose new message')}
      secondaryCtaLabel="Learn More"
      onSecondaryCtaClick={() => console.log('Open help')}
    />
  );
};

// Example 10: Error State with Retry
export const ErrorPage = () => {
  const handleRetry = async () => {
    console.log('Retrying...');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <ErrorState
      title="Connection Failed"
      message="Unable to connect to the server. Please check your internet connection."
      errorCode="ERR_NETWORK_500"
      showRetry
      showSupport
      onRetry={handleRetry}
      supportEmail="support@cryb.ai"
    />
  );
};

// Example 11: Loading Skeletons
export const LoadingList = () => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any[]>([]);

  React.useEffect(() => {
    setTimeout(() => {
      setData([
        { id: 1, name: 'Item 1', description: 'Description 1' },
        { id: 2, name: 'Item 2', description: 'Description 2' },
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div>
        <SkeletonListItem showAvatar showSubtitle />
        <SkeletonListItem showAvatar showSubtitle />
        <SkeletonListItem showAvatar showSubtitle />
      </div>
    );
  }

  return (
    <div>
      {data.map((item) => (
        <ListItem
          key={item.id}
          title={item.name}
          subtitle={item.description}
        />
      ))}
    </div>
  );
};

// Example 12: Context Menu
export const ContextMenuExample = () => {
  return (
    <Menu
      trigger={<button>Options ⋮</button>}
      placement="bottom-right"
      groups={[
        {
          id: 'actions',
          title: 'Actions',
          items: [
            { id: 'edit', label: 'Edit', icon: <span>✏️</span>, shortcut: '⌘E' },
            { id: 'duplicate', label: 'Duplicate', icon: <span>📋</span> },
            { id: 'share', label: 'Share', icon: <span>↗️</span> },
          ],
        },
        {
          id: 'danger',
          items: [
            { id: 'delete', label: 'Delete', icon: <span>🗑️</span>, destructive: true },
          ],
        },
      ]}
      onItemClick={(id) => console.log('Action:', id)}
    />
  );
};

// Example 13: Complete App Structure
export const CompleteExample = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);

  return (
    <div>
      {/* Header */}
      <Header
        variant="large"
        title="CRYB.AI"
        subtitle="Decentralized Social Platform"
        sticky
        rightActions={[
          {
            id: 'notifications',
            icon: <span>🔔</span>,
            label: 'Notifications',
            badge: 3,
            onClick: () => console.log('Notifications'),
          },
        ]}
      />

      {/* Content */}
      <div style={{ padding: '16px', paddingBottom: '88px' }}>
        {loading && <SkeletonListItem showAvatar showSubtitle />}
        {error && (
          <ErrorState
            title="Something went wrong"
            onRetry={() => setLoading(true)}
          />
        )}
        {empty && (
          <EmptyState
            title="Nothing here yet"
            description="Start exploring to see content"
          />
        )}
        {!loading && !error && !empty && <div>Content goes here</div>}
      </div>

      {/* Bottom Navigation */}
      <TabBar
        position="bottom"
        activeTab={activeTab}
        tabs={[
          { id: 'home', label: 'Home', icon: <span>🏠</span> },
          { id: 'explore', label: 'Explore', icon: <span>🧭</span> },
          { id: 'create', label: 'Create', icon: <span>➕</span> },
          { id: 'messages', label: 'Messages', icon: <span>💬</span>, badge: 5 },
          { id: 'profile', label: 'Profile', icon: <span>👤</span> },
        ]}
        onChange={setActiveTab}
        hapticFeedback
      />
    </div>
  );
};
