# CRYB Authentication Flow

Complete authentication and onboarding system for CRYB platform.

## Pages Overview

### Authentication Pages

#### 1. LoginPage.tsx
- **Route**: `/auth/login`
- **Features**:
  - Wallet connect options (MetaMask, WalletConnect, Coinbase, Rainbow)
  - Email/password login
  - Magic link authentication
  - Social OAuth (Google, Apple, Twitter)
  - Remember me functionality
  - Terms and conditions checkbox
  - Forgot password link
  - All error handling and validation

#### 2. SignupPage.tsx
- **Route**: `/auth/signup`
- **Features**:
  - Wallet connect signup
  - Email registration with real-time password validation
  - Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
  - Confirm password matching
  - Social OAuth signup
  - Username availability check
  - Terms acceptance
  - Email verification flow

#### 3. ForgotPasswordPage.tsx
- **Route**: `/auth/forgot-password`
- **Features**:
  - Email input for password reset
  - Reset link sent confirmation
  - Resend link functionality
  - Back to login navigation
  - Success state with email confirmation

#### 4. ResetPasswordPage.tsx
- **Route**: `/auth/reset-password?token=xxx`
- **Features**:
  - New password creation with requirements
  - Real-time password validation
  - Confirm password matching
  - Token validation
  - Success redirect to login
  - Expired link handling

#### 5. VerifyEmailPage.tsx
- **Route**: `/auth/verify-email?token=xxx`
- **Features**:
  - Auto-verification with token
  - Manual resend option with countdown timer
  - Verification success animation
  - Redirect to onboarding
  - Check spam folder reminder

### Onboarding Flow (5 Steps)

#### Step 1: OnboardingWelcomePage.tsx
- **Route**: `/auth/onboarding-welcome`
- **Features**:
  - Wallet connection (optional)
  - 4 wallet providers with descriptions
  - Skip option
  - Progress indicator (Step 1 of 5)

#### Step 2: OnboardingProfilePage.tsx
- **Route**: `/auth/onboarding-profile`
- **Features**:
  - Avatar upload with preview
  - Username with real-time availability check
  - Display name
  - Bio (160 character limit)
  - Character counter
  - Validation feedback
  - Progress indicator (Step 2 of 5)

#### Step 3: OnboardingInterestsPage.tsx
- **Route**: `/auth/onboarding-interests`
- **Features**:
  - 16 interest categories with icons
  - Minimum 3 selections required
  - Visual selection feedback
  - Selection counter
  - Grid layout (responsive)
  - Progress indicator (Step 3 of 5)

#### Step 4: OnboardingFollowPage.tsx
- **Route**: `/auth/onboarding-follow`
- **Features**:
  - 6 suggested users to follow
  - Follow/unfollow buttons
  - Follow all option
  - User cards with avatar, bio, followers
  - Verification badges
  - Scrollable list
  - Progress indicator (Step 4 of 5)

#### Step 5: OnboardingCompletePage.tsx
- **Route**: `/auth/onboarding-complete`
- **Features**:
  - Success animation (loading → success → ready)
  - Setup summary stats
  - What's next checklist
  - Auto-redirect to home (5s countdown)
  - Manual navigation button
  - Celebration effects
  - Progress indicator (Step 5 of 5)

## Design Features

### Visual Design
- Dark theme (#0D0D0D background, #141414 cards)
- Gradient accent colors (#58a6ff blue to #a371f7 purple)
- Glassmorphism effects with backdrop blur
- Animated gradient background blobs
- Smooth transitions and hover states
- Responsive mobile-first design

### Components Used
- Button (with variants, loading states, icons)
- Input (with labels, icons, validation, helper text)
- Textarea (with character counter)
- Card (glassmorphic styling)
- Avatar (with fallbacks, sizes, variants)

### Validation & Error Handling
- Real-time form validation
- Password strength indicators
- Username availability checks
- Error messages with icons
- Success confirmations
- Loading states on all async actions

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus states
- Screen reader friendly
- Error announcements
- Loading indicators

### Mobile Optimization
- Touch-friendly button sizes
- Responsive grid layouts
- Mobile-optimized spacing
- Swipe gestures ready
- Virtual keyboard aware

## Authentication Flow

```
1. User lands on LoginPage or SignupPage
   ↓
2. Choose authentication method:
   - Wallet Connect → OnboardingWelcomePage
   - Email/Password → VerifyEmailPage → OnboardingWelcomePage
   - Social OAuth → OnboardingWelcomePage
   - Magic Link → VerifyEmailPage → OnboardingWelcomePage
   ↓
3. Onboarding Flow:
   Step 1: OnboardingWelcomePage (Wallet - Optional)
   Step 2: OnboardingProfilePage (Profile Setup)
   Step 3: OnboardingInterestsPage (Select 3+ Interests)
   Step 4: OnboardingFollowPage (Follow Creators)
   Step 5: OnboardingCompletePage (Success!)
   ↓
4. Redirect to /home
```

## Password Reset Flow

```
1. User clicks "Forgot Password" on LoginPage
   ↓
2. ForgotPasswordPage - Enter email
   ↓
3. Email sent confirmation
   ↓
4. User clicks link in email
   ↓
5. ResetPasswordPage - Create new password
   ↓
6. Success → Redirect to LoginPage
```

## Integration Notes

### Mock API Calls
All pages currently use mock API calls with setTimeout. Replace with actual API endpoints:

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/magic-link` - Send magic link
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/wallet-connect` - Connect Web3 wallet
- `GET /api/auth/username-available` - Check username availability
- `POST /api/onboarding/profile` - Save profile data
- `POST /api/onboarding/interests` - Save selected interests
- `POST /api/onboarding/follow` - Follow users

### State Management
Consider implementing:
- Auth context for user state
- Onboarding progress persistence
- Form data localStorage backup
- Session management

### Wallet Integration
Replace mock wallet connections with actual Web3 libraries:
- MetaMask: `@metamask/sdk`
- WalletConnect: `@walletconnect/web3-provider`
- Coinbase Wallet: `@coinbase/wallet-sdk`
- Rainbow: `@rainbow-me/rainbowkit`

### Social OAuth
Implement OAuth flows with:
- Google: Google Sign-In SDK
- Apple: Sign in with Apple
- Twitter: Twitter OAuth 2.0

## Customization

### Colors
Update colors in the gradient and accent sections:
```tsx
// Blue-purple gradient
from-[#58a6ff] to-[#a371f7]

// Background colors
bg-[#0D0D0D] // Main background
bg-[#141414] // Card background
```

### Wallet Providers
Add/remove wallet providers in `WalletProviders` array:
```tsx
const WalletProviders = [
  { id: 'metamask', name: 'MetaMask', icon: Wallet, color: '#F6851B' },
  // Add more...
];
```

### Interests
Customize interests in `OnboardingInterestsPage.tsx`:
```tsx
const interests = [
  { id: 'gaming', name: 'Gaming', icon: Gamepad, color: '#9B59B6' },
  // Add more...
];
```

### Required Fields
Adjust minimum selections:
```tsx
const minInterests = 3; // Minimum interests to select
```

## Testing Checklist

- [ ] Login with email/password
- [ ] Login with wallet (all providers)
- [ ] Login with social OAuth (all providers)
- [ ] Magic link authentication
- [ ] Signup with email
- [ ] Signup with wallet
- [ ] Password validation requirements
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Username availability check
- [ ] Avatar upload
- [ ] Interest selection (min 3)
- [ ] Follow/unfollow users
- [ ] Follow all functionality
- [ ] Onboarding completion
- [ ] All loading states
- [ ] All error states
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader accessibility

## Next Steps

1. Connect to actual authentication API
2. Implement Web3 wallet integrations
3. Add OAuth provider connections
4. Set up email service for magic links and verification
5. Implement auth context/state management
6. Add analytics tracking
7. Set up error monitoring (Sentry)
8. Add rate limiting
9. Implement CSRF protection
10. Add session management
