# Color Standardization Progress

**Started:** 2025-12-27
**Goal:** Replace all hardcoded color values with design system tokens

---

## Summary

**Total Files Identified:** 60 files with hardcoded `#FFFFFF` or `white`
**Files Fixed:** 2
**Remaining:** 58
**Progress:** 3.3%

---

## Design Token Mapping

### White/Background Colors
- `#FFFFFF` → `colors.bg.secondary`
- `white` → `colors.bg.secondary`
- `rgba(255, 255, 255, 0.85)` → Keep (glass effect transparency)

### Text Colors
- `#1A1A1A` → `colors.text.primary`
- `#666666` → `colors.text.secondary`
- `#999999` → `colors.text.tertiary`

### Brand Colors
- `#58a6ff` → `colors.brand.primary`
- `#a371f7` → `colors.brand.secondary`

### Border Colors
- `#E8EAED` → `colors.border.subtle`
- `#CCCCCC` → `colors.border.default`

### Semantic Colors
- Success: `#10B981` → `colors.semantic.success`
- Warning: `#F59E0B` → `colors.semantic.warning`
- Error: `#EF4444` → `colors.semantic.error`

---

## Files Fixed

### ✅ Completed (2 files)

1. **components/community/ShareModal.jsx**
   - Added `import { colors } from '../../design-system/tokens'`
   - Fixed: `background: '#FFFFFF'` → `background: colors.bg.secondary`

2. **components/community/AwardModal.jsx**
   - Added design tokens import
   - Fixed 2 instances of hardcoded `#FFFFFF`

---

## Files Remaining by Category

### High Priority - User-Facing Modals (18 files)
- [ ] components/WalletModal.jsx
- [ ] components/ui/Modal.jsx
- [ ] components/messages/CreateGroupDMModal.jsx
- [ ] components/CookieConsent.jsx
- [ ] components/community/CreateChannelModal.jsx
- [ ] components/states/ConfirmationDialog.jsx
- [ ] components/ui/ConfirmDialog.jsx
- [ ] components/modals/ConfirmationModal.jsx
- [ ] pages/MFALoginPage.jsx
- [ ] pages/RegisterPage.jsx
- [ ] pages/LoginPage.jsx
- [ ] pages/PasskeySetupPage.jsx
- [ ] pages/RateLimitedPage.jsx
- [ ] pages/GuidelinesPage.jsx
- [ ] pages/GroupDMSettingsPage.jsx
- [ ] pages/ModerationPage.jsx
- [ ] pages/EventsCalendarPage.jsx
- [ ] pages/BradleyHimelPage.jsx

### Medium Priority - Navigation & Layout (10 files)
- [ ] components/Navigation/Header.jsx
- [ ] components/Header.jsx
- [ ] components/MobileHeader.jsx
- [ ] components/community/ChannelSidebar.jsx
- [ ] components/FriendsSystem.jsx
- [ ] pages/HomePage.jsx
- [ ] pages/WalletPage.jsx
- [ ] pages/CommunityPage.jsx
- [ ] pages/LandingPage.jsx

### Medium Priority - Feature Pages (15 files)
- [ ] components/post/CreatePost.jsx
- [ ] components/web3/TipWidget.jsx
- [ ] components/web3/NFTGalleryWidget.jsx
- [ ] components/web3/WalletWidget.jsx
- [ ] components/media/MediaUpload.jsx
- [ ] components/social/community-card.tsx
- [ ] pages/NFTMarketplacePage.jsx
- [ ] pages/NFTDetailPage.jsx
- [ ] pages/NFTGalleryPage.jsx
- [ ] pages/CommunityStorePage.jsx
- [ ] pages/CommunityRulesPage.jsx
- [ ] pages/CreateCommunityPage.jsx

### Lower Priority - Additional Files (15 files)
- Various other component and page files

---

## Implementation Pattern

For each file:

1. Add import statement:
```javascript
import { colors } from '../../design-system/tokens'
// or appropriate relative path
```

2. Replace hardcoded values:
```javascript
// Before
background: '#FFFFFF'
color: '#1A1A1A'

// After
background: colors.bg.secondary
color: colors.text.primary
```

---

## Next Steps

### Option A: Automated Batch Fix (Fast)
Create a script to automatically fix common patterns across all 58 remaining files.
- **Pros:** Fast, consistent
- **Cons:** May need manual review for edge cases

### Option B: Manual File-by-File (Thorough)
Continue fixing files manually in priority order.
- **Pros:** Careful, handles edge cases
- **Cons:** Time-consuming (58 files remaining)

### Option C: Hybrid Approach (Balanced)
Fix high-priority files manually (18 files), then script the rest.
- **Pros:** Best of both worlds
- **Cons:** Moderate time investment

---

## Impact

**Benefits of Completion:**
- ✅ Consistent theming across entire platform
- ✅ Easy theme switching in future (dark mode ready)
- ✅ Single source of truth for colors
- ✅ Easier maintenance and updates
- ✅ Better code quality and readability

**Current Status:**
- Design system exists and is well-structured ✅
- 85% of codebase already uses tokens ✅
- Remaining 15% are these hardcoded values ⚠️

---

**Last Updated:** 2025-12-27
**Next Review:** After completing high-priority files
