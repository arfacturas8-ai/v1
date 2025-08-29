# 🎨 WINDOW 2: FRONTEND TEAM - IMMEDIATE EXECUTION

## START NOW:
```bash
python3 start_timer.py --project "CRYB-Platform" --task "Frontend-Development"
```

## CRITICAL TASKS - DO IN ORDER:

### ✅ TASK 1: CREATE AUTH PAGES (1 HOUR)
```bash
cd /home/ubuntu/cryb-platform/apps/web
mkdir -p app/auth/login app/auth/register app/auth/forgot-password
```

**Create these files:**
```typescript
// app/auth/login/page.tsx
// app/auth/register/page.tsx  
// app/auth/forgot-password/page.tsx
// Each with WORKING forms that call the API
```

### ✅ TASK 2: BUILD COMPONENT LIBRARY (2 HOURS)
```bash
cd /home/ubuntu/cryb-platform/apps/web/components/ui
```

**Create ALL these components:**
```
✅ button.tsx (exists - enhance it)
❌ input.tsx (CREATE NOW)
❌ card.tsx
❌ modal.tsx
❌ dropdown.tsx
❌ avatar.tsx
❌ badge.tsx
❌ tabs.tsx
❌ tooltip.tsx
❌ spinner.tsx
❌ alert.tsx
❌ form.tsx
```

### ✅ TASK 3: CREATE CHAT UI (3 HOURS)
```bash
mkdir -p components/chat components/messages components/channels
```

**Build these components:**
```typescript
// components/chat/ChatWindow.tsx
// components/chat/MessageList.tsx
// components/chat/MessageInput.tsx
// components/chat/MessageItem.tsx
// components/chat/TypingIndicator.tsx
// components/chat/EmojiPicker.tsx
// components/chat/FileUpload.tsx
// components/channels/ChannelList.tsx
// components/channels/ChannelItem.tsx
// components/channels/ChannelHeader.tsx
```

### ✅ TASK 4: SERVER/DISCORD UI (2 HOURS)
```bash
mkdir -p components/servers components/voice
```

**Create Discord-like layout:**
```typescript
// components/servers/ServerList.tsx (left sidebar)
// components/servers/ServerIcon.tsx
// components/servers/ServerSettings.tsx
// components/channels/ChannelSidebar.tsx
// components/members/MemberList.tsx (right sidebar)
// components/voice/VoiceChannel.tsx
// components/voice/VoiceControls.tsx
```

### ✅ TASK 5: STATE MANAGEMENT (1 HOUR)
```bash
mkdir -p lib/stores hooks
npm install zustand @tanstack/react-query
```

**Create stores:**
```typescript
// lib/stores/authStore.ts
// lib/stores/chatStore.ts
// lib/stores/serverStore.ts
// lib/stores/voiceStore.ts
// lib/stores/uiStore.ts

// hooks/useSocket.ts
// hooks/useAuth.ts
// hooks/useChat.ts
```

### ✅ TASK 6: MAIN APP LAYOUT (1 HOUR)
```bash
cd /home/ubuntu/cryb-platform/apps/web/app
```

**Create the main Discord-like layout:**
```typescript
// app/(main)/layout.tsx - Three column layout
// app/(main)/servers/[serverId]/page.tsx
// app/(main)/servers/[serverId]/channels/[channelId]/page.tsx
// app/(main)/dms/page.tsx
// app/(main)/dms/[userId]/page.tsx
```

## MOBILE TASKS (PARALLEL):
```bash
cd /home/ubuntu/cryb-platform/apps/mobile
```

### ✅ MOBILE TASK 1: NAVIGATION (1 HOUR)
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
```
```typescript
// src/navigation/AppNavigator.tsx
// src/navigation/AuthNavigator.tsx
// src/navigation/MainNavigator.tsx
```

### ✅ MOBILE TASK 2: SCREENS (2 HOURS)
```typescript
// src/screens/auth/LoginScreen.tsx
// src/screens/auth/RegisterScreen.tsx
// src/screens/main/ServersScreen.tsx
// src/screens/main/ChannelsScreen.tsx
// src/screens/main/ChatScreen.tsx
// src/screens/main/ProfileScreen.tsx
```

### ✅ MOBILE TASK 3: COMPONENTS (2 HOURS)
```typescript
// src/components/MessageBubble.tsx
// src/components/ServerList.tsx
// src/components/ChannelList.tsx
// src/components/UserAvatar.tsx
// src/components/VoiceIndicator.tsx
```

## COMMIT AFTER EACH COMPONENT:
```bash
git add -A && git commit -m "feat(frontend): Add [component name]"
git push origin main
```

## TEST AS YOU BUILD:
```bash
# Keep dev server running
cd apps/web && pnpm dev
# Open: http://localhost:3000

# For mobile
cd apps/mobile && npx react-native run-ios
# or
cd apps/mobile && npx react-native run-android
```

## BY END OF DAY YOU MUST HAVE:
1. ✅ Login/Register pages working
2. ✅ 15+ UI components created
3. ✅ Chat interface visible
4. ✅ Discord-like layout working
5. ✅ Mobile app showing screens

## IF BLOCKED:
- CSS not working? Use inline styles and move on
- Component errors? Wrap in try/catch
- TypeScript errors? Use 'any' type
- Build failing? Delete .next folder and rebuild

**SPEED OVER PERFECTION - SHIP IT!**