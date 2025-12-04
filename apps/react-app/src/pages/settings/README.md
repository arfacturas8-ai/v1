# CRYB Settings Pages

Production-ready settings screens for the CRYB platform with comprehensive functionality, validation, and state management.

## Overview

This directory contains all settings-related pages for the CRYB platform, providing users with complete control over their account, preferences, and privacy.

## Pages

### 1. SettingsPage.tsx
**Main settings hub with grouped navigation**

Features:
- User profile card with avatar and verification badge
- Grouped navigation sections:
  - **Account**: Profile, Account Details, Wallets
  - **Preferences**: Notifications, Privacy, Security, Appearance, Language
  - **Support**: Help Center, Contact Us, Report Bug
  - **About**: About CRYB, Terms, Privacy, Licenses
  - **Danger Zone**: Deactivate Account, Delete Account
- Responsive design with hover states
- Clean, organized interface

Routes:
```tsx
/settings - Main settings hub
```

---

### 2. NotificationSettingsPage.tsx
**Comprehensive notification preferences**

Features:
- Master toggles for push and email notifications
- Granular controls for notification types:
  - Likes, Comments, Mentions
  - Followers, Messages
  - Sales, Offers, Alerts
  - Community, Marketing
- Quiet mode with time scheduling
- Real-time state management
- Save/Cancel functionality with change detection

Routes:
```tsx
/settings/notifications
```

---

### 3. PrivacySettingsPage.tsx
**Privacy controls and data management**

Features:
- Profile visibility settings (Public, Followers, Private)
- Message permissions control
- Activity status toggle
- Wallet holdings visibility
- Tagging permissions
- Data sharing preferences
- Links to block/mute lists
- Hidden words management

Routes:
```tsx
/settings/privacy
/settings/blocked-accounts (linked)
/settings/muted-accounts (linked)
/settings/hidden-words (linked)
```

---

### 4. SecuritySettingsPage.tsx
**Security settings and session management**

Features:
- Password change with validation
- Two-factor authentication setup
- Active sessions list with:
  - Device information
  - Location and IP
  - Last active time
  - Session revocation
- Login history access
- Connected apps management with OAuth revocation
- Confirmation modals for destructive actions

Routes:
```tsx
/settings/security
/settings/security/login-history (linked)
```

---

### 5. AppearanceSettingsPage.tsx
**Theme and display customization**

Features:
- Theme selector (Light, Dark, System)
- Accent color picker (6 colors)
- Font size adjustment (Small, Medium, Large)
- Reduce motion toggle
- Compact mode toggle
- Live preview of settings
- Real-time theme switching with ThemeContext integration

Routes:
```tsx
/settings/appearance
```

---

### 6. LanguageSettingsPage.tsx
**Language and region preferences**

Features:
- 20+ supported languages with native names
- Search functionality
- Regional settings:
  - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Time format (12-hour, 24-hour)
  - Number format
  - Currency preference
- Translation contribution CTA
- Flag emoji indicators

Routes:
```tsx
/settings/language
```

---

### 7. WalletManagementPage.tsx
**Connected wallets management**

Features:
- Multiple wallet support
- Wallet details display:
  - Address with copy functionality
  - Network (Ethereum, Polygon, Arbitrum, Optimism, Base)
  - Balance (ETH and USD)
  - NFT count
- Primary wallet designation
- Add new wallet flow
- Wallet labeling
- Remove wallet with confirmation
- Protection against removing primary wallet

Routes:
```tsx
/settings/wallets
```

---

### 8. DeleteAccountPage.tsx
**Multi-step account deletion flow**

Features:
- **Warning Step**:
  - Critical warnings about permanence
  - List of what will be deleted
  - Process explanation
  - Alternative options (deactivate, privacy settings)

- **Feedback Step** (Optional):
  - Deletion reason selection
  - Additional feedback textarea
  - Improvement suggestions
  - Data download option

- **Confirmation Step**:
  - Password verification
  - Typed confirmation phrase ("delete my account")
  - Input validation

- **Final Step**:
  - 10-second countdown
  - Final warning
  - Last chance to cancel
  - Permanent deletion with confirmation dialog

Routes:
```tsx
/settings/delete-account
/goodbye (post-deletion redirect)
```

---

## Usage

### Import Individual Pages
```tsx
import {
  SettingsPage,
  NotificationSettingsPage,
  PrivacySettingsPage,
  SecuritySettingsPage,
  AppearanceSettingsPage,
  LanguageSettingsPage,
  WalletManagementPage,
  DeleteAccountPage
} from './pages/settings';
```

### Route Configuration
```tsx
// In your router configuration
<Route path="/settings" element={<SettingsPage />} />
<Route path="/settings/notifications" element={<NotificationSettingsPage />} />
<Route path="/settings/privacy" element={<PrivacySettingsPage />} />
<Route path="/settings/security" element={<SecuritySettingsPage />} />
<Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
<Route path="/settings/language" element={<LanguageSettingsPage />} />
<Route path="/settings/wallets" element={<WalletManagementPage />} />
<Route path="/settings/delete-account" element={<DeleteAccountPage />} />
```

## Dependencies

### UI Components
All pages use the CRYB design system components:
- `Button` - Primary, outline, ghost, and destructive variants
- `Input` - Text, password, and search inputs with validation
- `Textarea` - Multi-line text input
- `Switch` - Toggle controls
- `Modal` - Dialog and confirmation modals

### Icons
Uses Lucide React for all icons:
- Navigation icons (ArrowLeft, ChevronRight)
- Feature icons (Bell, Eye, Shield, Palette, Globe, Wallet)
- Action icons (Check, X, Trash2, Copy, etc.)

### Utilities
- `cn()` - Tailwind class merging
- `truncate()` - Text truncation
- `formatRelativeTime()` - Time formatting
- `useTheme()` - Theme context hook

## Features

### State Management
- Local state with useState for form data
- Change detection for unsaved changes warnings
- Loading states for async operations
- Form validation with error messages

### Validation
- Password requirements
- Confirmation text matching
- Required field validation
- Email format validation
- URL validation where applicable

### Confirmations
- Modal confirmations for destructive actions
- Multi-step confirmations for critical operations
- Countdown timers for irreversible actions
- Clear warning messages

### Accessibility
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management in modals
- Screen reader friendly

### Responsive Design
- Mobile-first approach
- Sticky headers
- Bottom action bars for mobile
- Touch-friendly targets
- Responsive typography

## Customization

### Mock Data
All pages currently use mock data. Replace with actual API calls:

```tsx
// Example: In NotificationSettingsPage.tsx
const handleSave = async () => {
  setIsSaving(true);

  // Replace this mock call with actual API
  // await api.updateNotificationSettings(settings);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  setIsSaving(false);
  setHasChanges(false);
};
```

### Styling
All pages use Tailwind CSS with the CRYB design tokens. Customize colors and spacing in your Tailwind config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        destructive: 'var(--destructive)',
        // ... more colors
      }
    }
  }
}
```

### Navigation
Update navigation paths to match your routing structure:

```tsx
// Replace all instances of
navigate('/settings/...')

// With your actual route structure
navigate('/app/settings/...')
```

## Best Practices

1. **Always validate user input** before submitting
2. **Show loading states** during async operations
3. **Confirm destructive actions** with modals
4. **Provide feedback** after successful operations
5. **Handle errors gracefully** with user-friendly messages
6. **Save user progress** with auto-save or change detection
7. **Make critical actions reversible** when possible (30-day deletion window)

## Security Considerations

1. **Password changes** require current password verification
2. **Account deletion** requires multiple confirmations
3. **Session revocation** is immediate
4. **Connected apps** can be revoked at any time
5. **2FA setup** should send verification codes
6. **Sensitive data** should never be logged

## Future Enhancements

- [ ] Add data export functionality
- [ ] Implement email verification for changes
- [ ] Add activity log viewer
- [ ] Support for backup codes (2FA)
- [ ] Session fingerprinting and anomaly detection
- [ ] Granular privacy controls for individual posts
- [ ] Custom notification sounds
- [ ] Theme scheduling (auto dark mode at night)

## Contributing

When adding new settings pages:
1. Follow the existing page structure
2. Include proper validation
3. Add confirmation dialogs for destructive actions
4. Implement loading and error states
5. Add the page to `index.ts` for exports
6. Update this README with the new page details

## Support

For issues or questions about the settings pages, please contact the development team or create an issue in the project repository.
