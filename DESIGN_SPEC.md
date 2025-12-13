# CRYB Platform - Complete Design Specification
## Based on v.1 Screenshots (2022-01-15)

---

## 🎨 DESIGN PHILOSOPHY
Clean, modern, crypto-native platform with:
- Light theme (professional, accessible)
- Colorful crypto branding
- Generous spacing and whitespace
- Playful illustrations for learning content
- Mobile-first responsive design

---

## 📱 COLOR PALETTE

### Brand Colors
```css
--brand-primary: #58a6ff;           /* Blue */
--brand-secondary: #a371f7;         /* Purple */
--brand-gradient: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
```

### Backgrounds (Light Theme)
```css
--bg-primary: #F8F9FA;              /* Page background - very light gray */
--bg-secondary: #FFFFFF;            /* Cards, modals - white */
--bg-tertiary: #F0F2F5;             /* Subtle elevated surfaces */
--bg-gradient-hero: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
--bg-gradient-subtle: linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%);
```

### Text Colors
```css
--text-primary: #1A1A1A;            /* Headings, primary content */
--text-secondary: #666666;          /* Body text, labels */
--text-tertiary: #999999;           /* Muted text, metadata */
--text-inverse: #FFFFFF;            /* Text on dark/colored backgrounds */
```

### Crypto-Specific Colors
```css
--crypto-bitcoin: #F7931A;          /* Orange */
--crypto-ethereum: #627EEA;         /* Purple-blue */
--crypto-cardano: #0033AD;          /* Dark blue */
--crypto-solana: #14F195;           /* Bright green-cyan */
--crypto-tether: #50AF95;           /* Teal-green */
--crypto-avalanche: #E84142;        /* Red */
--crypto-polygon: #8247E5;          /* Purple */
--crypto-binance: #F3BA2F;          /* Yellow-gold */
--crypto-litecoin: #345D9D;         /* Medium blue */
--crypto-polkadot: #E6007A;         /* Hot pink */
```

### Semantic Colors
```css
--color-success: #00D26A;           /* Green - positive, growth */
--color-error: #FF3B3B;             /* Red - negative, decline */
--color-warning: #FFA500;           /* Orange - caution */
--color-info: #58a6ff;              /* Blue - informational */
```

### Borders & Dividers
```css
--border-subtle: #E8EAED;           /* Very light gray borders */
--border-default: #D1D5DB;          /* Standard borders */
--border-strong: #9CA3AF;           /* Emphasized borders */
```

### Shadows (Light Theme)
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.12);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.18);
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.22);
```

---

## ✍️ TYPOGRAPHY

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI",
             "Roboto", "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", "Roboto Mono", "Monaco", "Consolas", monospace;
```

### Font Sizes (16px base)
```css
--text-xs: 0.75rem;      /* 12px - Small labels, metadata */
--text-sm: 0.875rem;     /* 14px - Secondary text, captions */
--text-base: 1rem;       /* 16px - Body text, buttons */
--text-lg: 1.125rem;     /* 18px - Large body, card titles */
--text-xl: 1.25rem;      /* 20px - Section headings */
--text-2xl: 1.5rem;      /* 24px - Page headings */
--text-3xl: 1.875rem;    /* 30px - Hero headings */
--text-4xl: 2.25rem;     /* 36px - Large hero */
--text-5xl: 3rem;        /* 48px - Display headings */
```

### Font Weights
```css
--font-regular: 400;     /* Body text */
--font-medium: 500;      /* Emphasized text, labels */
--font-semibold: 600;    /* Headings, buttons */
--font-bold: 700;        /* Important headings */
```

### Line Heights
```css
--leading-tight: 1.25;   /* Headings */
--leading-snug: 1.375;   /* Subheadings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625;/* Long-form content */
```

---

## 📐 SPACING SYSTEM (4px base unit)

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Common Usage
- **Card padding**: 24px (--space-6)
- **Section margins**: 48-64px (--space-12 to --space-16)
- **Button padding**: 12px 24px (--space-3 --space-6)
- **Input padding**: 12px 16px (--space-3 --space-4)

---

## 🔘 BORDER RADIUS

```css
--radius-none: 0;
--radius-sm: 4px;       /* Small elements */
--radius-md: 8px;       /* Inputs, badges */
--radius-lg: 12px;      /* Buttons, small cards */
--radius-xl: 16px;      /* Large cards */
--radius-2xl: 20px;     /* Hero cards, modals */
--radius-3xl: 24px;     /* Extra large cards */
--radius-full: 9999px;  /* Pills, circular elements */
```

### Common Usage
- **Buttons**: `--radius-full` (pill-shaped)
- **Cards**: `--radius-xl` (16px)
- **Inputs**: `--radius-lg` (12px)
- **Badges**: `--radius-full` (pill-shaped)
- **Crypto icons**: `--radius-full` (circular)

---

## 🧩 COMPONENT SPECIFICATIONS

### 1. Button Component

#### Primary Button
```
Background: Linear gradient (blue → purple)
Text: White, semibold
Padding: 12px 24px
Border Radius: 9999px (full pill)
Shadow: sm on default, lg on hover
Hover: Lift up 2px, increase shadow
Font Size: 16px (base)
```

#### Secondary Button
```
Background: Transparent/White
Text: Brand primary color
Border: 2px solid brand primary
Padding: 12px 24px
Border Radius: 9999px (full pill)
Hover: Light blue background (#E3F2FD)
```

#### Ghost Button
```
Background: Transparent
Text: Primary text color
Padding: 12px 24px
Border: None
Hover: Subtle gray background
```

### 2. Card Component

#### Standard Card
```
Background: White (#FFFFFF)
Border: 1px solid subtle (#E8EAED)
Border Radius: 16px (xl)
Shadow: sm on default, md on hover
Padding: 24px
Hover: Lift 2px, increase shadow
Transition: 200ms ease
```

#### Crypto Community Card
```
Background: White
Border Radius: 16px
Padding: 24px
Shadow: md
Crypto Icon: Circular, 48px, brand color background
Title: Semibold, 18px
Stats: 14px secondary text
Hover: Lift 4px, shadow lg
```

#### Learn/Article Card
```
Background: White or colorful illustration background
Border Radius: 16px
Image Area: Colorful illustration, 16:9 or 1:1 ratio
Content Area: 20px padding
Title: Semibold 16px
Metadata: Secondary text 14px
Skill Badge: Pill-shaped, positioned top-right
Shadow: sm default, lg hover
```

### 3. Input Component

#### Search Bar
```
Background: White
Border: 1px solid default border
Border Radius: 12px (lg)
Padding: 12px 16px 12px 44px (space for icon)
Icon: 20px, positioned left, secondary color
Placeholder: Secondary text color
Focus: Border changes to primary color, shadow
Height: 44px (good touch target)
```

#### Form Input
```
Background: White
Border: 1px solid default border
Border Radius: 12px
Padding: 12px 16px
Font Size: 16px
Focus: Primary border, subtle shadow
```

### 4. Badge Component

#### Skill Level Badge
```
Background: Varies by level
  - Beginner: Light blue (#E3F2FD)
  - Intermediate: Light orange (#FFE5CC)
  - Expert: Light purple (#F3E5F5)
Text: Corresponding dark color
Padding: 6px 12px
Border Radius: 9999px (full pill)
Font Size: 12px
Font Weight: Medium
```

#### Status Badge
```
"New!": Gradient background, white text
"Coming Soon": Gray background
"Premium": Gold gradient
Border Radius: Full pill
Padding: 4px 10px
Font Size: 11px
```

### 5. Navigation Components

#### Mobile Bottom Nav (Mobile Only)
```
Position: Fixed bottom
Background: White with shadow
Height: 64px
Items: 4 (Community, Discover, Wallet, Profile)
Icons: 24px outlined, centered
Labels: 11px, below icon
Active State: Primary color
Inactive State: Secondary text color
Safe Area: Account for iPhone notch (env(safe-area-inset-bottom))
```

#### Desktop Top Nav
```
Position: Sticky top
Background: White with shadow
Height: 64px
Logo: Left (height 32px)
Search: Center (max-width 500px)
Actions: Right (Sign In, Get Started, Download App buttons)
Padding: 0 24px (mobile), 0 48px (tablet), 0 80px (desktop)
```

### 6. Crypto Icon Component

#### Standard Size
```
Container: 48px × 48px circle
Background: Crypto brand color
Icon/Logo: 28px, white or contrasting color
Border Radius: Full
Shadow: sm
```

#### Small Size (Lists)
```
Container: 32px × 32px circle
Icon: 20px
```

#### Large Size (Hero)
```
Container: 64px × 64px circle
Icon: 40px
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
--breakpoint-sm: 640px;   /* Mobile landscape, small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### Layout Patterns

#### Mobile (< 640px)
```
- Single column layouts
- Bottom navigation (64px, fixed)
- Full-width cards with 16px margin
- Stack all content vertically
- Hide secondary navigation elements
- Hamburger menu for additional options
```

#### Tablet (640px - 1024px)
```
- 2-column grid for cards
- Top navigation appears
- Bottom nav transitions to side nav or disappears
- Increased margins (24px)
- Side-by-side content in some areas
```

#### Desktop (> 1024px)
```
- 3-4 column grid for cards
- Full top navigation with all elements
- Max content width: 1280px, centered
- Generous whitespace (48px margins)
- Sidebar layouts where appropriate
```

---

## 🎯 PAGE-SPECIFIC LAYOUTS

### 1. Landing Page / Home

#### Hero Section
```
Background: Gradient (blue → purple) or white with gradient overlay
Height: 100vh (mobile), 70vh (desktop)
Content: Centered
  - Logo/Brand mark
  - Headline: 36-48px bold
  - Subheading: 18-20px regular
  - CTA Buttons: Primary + Secondary
Spacing: Generous vertical rhythm
```

#### Features Section
```
Grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
Card Style: White cards with icons
Icon: Top, centered, 48px, primary color
Title: 20px semibold
Description: 16px secondary text
Spacing: 32px gap between cards
```

### 2. Communities Page

#### Layout
```
Grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
Card: CryptoCard component
Crypto Icon: 48px circle, brand color
Title: Crypto name, 18px semibold
Stats: Coin holders + Members, 14px secondary
Grade: Optional badge
Spacing: 24px gap
```

#### Sorting/Filters
```
Position: Top of page, sticky
Options: All, By Grade, By Market Cap, etc.
Style: Pill buttons, outlined
```

### 3. Learn Page

#### Hero Section
```
Title: "Getting Started with Bitcoin" (or selected topic)
Subtitle: Descriptive text
Tabs: Filter by skill level (Beginner, Intermediate, Expert)
Background: White or subtle gradient
```

#### Tutorial Grid
```
Grid: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
Card: LearnCard component with colorful illustration
Illustration: Top half, colorful, playful
Content: Bottom half, white background
Title: 16px semibold
Author: 13px secondary text
Skill Badge: Top-right corner
```

### 4. Coin/Crypto Detail Page

#### Header
```
Crypto Icon: 64px circle, brand color
Name + Symbol: 24px + 16px
Tabs: Overview, Learn, News, Community, Coin Info
```

#### Price Section
```
Label: "# Crypto Currency"
Price: 48px bold
Actions: Website button, White Paper button
Stats: Trust system explanation, member avatars
CTA: "Join Community" - large primary button
```

#### Hero Visual
```
Large illustration: 3D render or illustration
Background: Crypto brand color gradient
Aspect Ratio: 16:9
Border Radius: 16px
```

#### Chart Section
```
Title: "Price Chart"
Tabs: Minutes, Hours, Days, Weeks, Months, Years, All Time
Chart: Line chart, smooth curves
Tooltip: Show price on hover
Grid: Subtle horizontal lines
```

#### Articles Section
```
Similar to Learn page
Filtered by skill level
Related to specific crypto
```

### 5. Wallet Page

#### Portfolio Overview
```
Cards: Balance, 24h Change, Holdings
Chart: Portfolio value over time
Asset List: Table or card grid
  - Icon, Name, Amount, Value, Change %
```

#### NFT Section
```
Tabs: Coins / NFTs
Grid: 2 columns (mobile), 3 columns (tablet), 4 columns (desktop)
Card: NFT preview, title, collection
```

### 6. Discover Page

#### Search Bar
```
Position: Top, prominent
Width: Full width (mobile), centered max 600px (desktop)
Style: Large search input with icon
Placeholder: "Search Cryptos, Communities, NFT's..."
```

#### Filters
```
Tabs: Crypto Currency, DeFi, NFT, Metaverse
Style: Horizontal scroll on mobile, full width on desktop
```

#### Content Grid
```
Mixed layout: Featured cards + standard grid
Featured: Larger cards, 1 column
Standard: 2-3 columns depending on viewport
```

---

## 🎨 ICON SYSTEM

### Style
- **Outlined/Stroke icons** (NOT filled)
- Source: Lucide Icons (already in project)
- Stroke Width: 2px
- Consistent sizing

### Common Sizes
```
--icon-xs: 16px;   /* Inline with text */
--icon-sm: 20px;   /* Small buttons, badges */
--icon-md: 24px;   /* Default buttons, navigation */
--icon-lg: 32px;   /* Large buttons, features */
--icon-xl: 48px;   /* Hero sections, empty states */
```

### Navigation Icons
```
Home/Community: Users or Home icon
Discover: Compass or Search icon
Wallet: Wallet or CreditCard icon
Profile: User or UserCircle icon
```

### Action Icons
```
Search: Search (magnifying glass)
Filter: Filter (funnel)
Sort: ArrowUpDown or SlidersHorizontal
Menu: Menu (hamburger)
Close: X
Settings: Settings (gear)
Notifications: Bell
```

### Crypto/Finance Icons
```
Bitcoin: Bitcoin symbol or custom logo
Chart: TrendingUp, TrendingDown, LineChart
Wallet: Wallet
Transaction: ArrowLeftRight
NFT: Image or Frame
```

---

## 🎭 ANIMATIONS & TRANSITIONS

### Timing Functions
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);    /* Smooth deceleration */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth acceleration */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce */
```

### Durations
```css
--duration-fast: 150ms;     /* Small UI changes */
--duration-normal: 200ms;   /* Hover, focus states */
--duration-slow: 300ms;     /* Page transitions, modals */
```

### Common Animations

#### Hover Lift
```css
transform: translateY(-2px);
box-shadow: [increase shadow];
transition: all 200ms ease-out;
```

#### Button Press
```css
transform: scale(0.98);
transition: transform 100ms ease-out;
```

#### Card Hover
```css
transform: translateY(-4px);
box-shadow: var(--shadow-lg);
transition: all 200ms ease-out;
```

#### Fade In
```css
opacity: 0 → 1;
transform: translateY(10px) → translateY(0);
transition: all 300ms ease-out;
```

---

## ♿ ACCESSIBILITY

### Touch Targets
- Minimum: 44px × 44px (mobile)
- Recommended: 48px × 48px
- Spacing: 8px between interactive elements

### Focus States
```css
outline: 2px solid var(--brand-primary);
outline-offset: 2px;
border-radius: inherit;
```

### Color Contrast
- Text on white: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Clear visual states

### Motion
- Respect `prefers-reduced-motion`
- Provide alternatives to auto-playing content

---

## 📊 DATA VISUALIZATION

### Charts
- **Style**: Clean, minimal
- **Colors**: Use crypto brand colors
- **Grid**: Subtle, light gray
- **Tooltips**: White card with shadow
- **Animations**: Smooth entrance animations

### Stats Display
```
Large Number: 36-48px bold
Label: 14px secondary text
Trend Indicator: Arrow icon + percentage
Color: Green (positive), Red (negative)
```

---

## 🌐 STATES

### Interactive States
```
Default: Normal appearance
Hover: Lift, shadow increase, color shift
Active/Pressed: Scale down, shadow decrease
Focus: Outline ring
Disabled: 40% opacity, no pointer events
```

### Loading States
```
Skeleton: Subtle gray background, shimmer animation
Spinner: Brand-colored, centered
Progress Bar: Linear, brand gradient
```

### Empty States
```
Icon: Large (48-64px), secondary color
Title: 20px semibold
Description: 16px secondary text
Action: Primary button CTA
```

---

## 📝 CONTENT GUIDELINES

### Headings
- Clear hierarchy (h1 → h6)
- Sentence case for most headings
- Short and descriptive

### Body Text
- 16px base size (never smaller than 14px)
- Line length: 45-75 characters optimal
- Generous line height (1.5-1.625)

### Microcopy
- Friendly, approachable tone
- Action-oriented button text
- Clear error messages
- Helpful placeholder text

---

## 🚀 PERFORMANCE

### Images
- WebP format with fallbacks
- Lazy loading below fold
- Responsive images with srcset
- Optimized illustrations (SVG preferred)

### Code Splitting
- Route-based splitting
- Component lazy loading
- Defer non-critical CSS

### Fonts
- System fonts preferred
- Web font subset for branding
- font-display: swap

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Update design-system.css with all variables
- [ ] Create base components (Button, Card, Input, Badge)
- [ ] Set up responsive breakpoints
- [ ] Configure icon system

### Phase 2: Navigation
- [ ] Mobile bottom navigation
- [ ] Desktop top navigation
- [ ] Search component
- [ ] Filter/sort components

### Phase 3: Specialized Components
- [ ] CryptoCard component
- [ ] LearnCard component
- [ ] ArticleCard component
- [ ] Chart components
- [ ] NFT gallery components

### Phase 4: Pages
- [ ] Landing page
- [ ] Communities page
- [ ] Learn page (new)
- [ ] Discover page
- [ ] Coin detail pages
- [ ] Wallet page
- [ ] Profile page

### Phase 5: Polish
- [ ] Responsive testing (all breakpoints)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Animation polish
- [ ] Cross-browser testing

---

**Reference Screenshots**: `/home/ubuntu/v.1/76gyub/`
**Design System**: This specification
**Target Platform**: platform.cryb.ai
**Framework**: React + Tailwind CSS
**Icons**: Lucide React
**Charts**: Recharts or similar

---

*This specification ensures pixel-perfect implementation matching the v.1 design screenshots while maintaining flexibility for future enhancements.*
