describe('CRYB Mobile App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Authentication Flow', () => {
    it('should show welcome screen on first launch', async () => {
      await expect(element(by.id('welcomeScreen'))).toBeVisible();
      await expect(element(by.text('Welcome to CRYB'))).toBeVisible();
    });

    it('should navigate to login screen', async () => {
      await element(by.id('loginButton')).tap();
      await expect(element(by.id('loginScreen'))).toBeVisible();
      await expect(element(by.id('emailInput'))).toBeVisible();
      await expect(element(by.id('passwordInput'))).toBeVisible();
    });

    it('should show error on invalid login', async () => {
      await element(by.id('loginButton')).tap();
      await element(by.id('emailInput')).typeText('invalid@test.com');
      await element(by.id('passwordInput')).typeText('wrongpass');
      await element(by.id('submitButton')).tap();

      await waitFor(element(by.text('Invalid credentials')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate to register screen', async () => {
      await element(by.id('registerButton')).tap();
      await expect(element(by.id('registerScreen'))).toBeVisible();
    });
  });

  describe('Home Screen', () => {
    beforeAll(async () => {
      // Login with test account
      await element(by.id('loginButton')).tap();
      await element(by.id('emailInput')).typeText('test@cryb.ai');
      await element(by.id('passwordInput')).typeText('testpassword');
      await element(by.id('submitButton')).tap();

      await waitFor(element(by.id('homeScreen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should display home screen', async () => {
      await expect(element(by.id('homeScreen'))).toBeVisible();
    });

    it('should show feed posts', async () => {
      await expect(element(by.id('postFeed'))).toBeVisible();
    });

    it('should scroll through posts', async () => {
      await element(by.id('postFeed')).scrollTo('bottom');
      await element(by.id('postFeed')).scrollTo('top');
    });

    it('should navigate to post detail on tap', async () => {
      await element(by.id('postCard-0')).tap();
      await expect(element(by.id('postDetailScreen'))).toBeVisible();
      await device.pressBack(); // Android
    });
  });

  describe('Bottom Tab Navigation', () => {
    it('should navigate to Communities tab', async () => {
      await element(by.id('tab-Communities')).tap();
      await expect(element(by.id('communitiesScreen'))).toBeVisible();
    });

    it('should navigate to Chat tab', async () => {
      await element(by.id('tab-Chat')).tap();
      await expect(element(by.id('messagesScreen'))).toBeVisible();
    });

    it('should navigate to Profile tab', async () => {
      await element(by.id('tab-Profile')).tap();
      await expect(element(by.id('profileScreen'))).toBeVisible();
    });

    it('should navigate back to Home tab', async () => {
      await element(by.id('tab-Home')).tap();
      await expect(element(by.id('homeScreen'))).toBeVisible();
    });
  });

  describe('Search Functionality', () => {
    it('should open search screen', async () => {
      await element(by.id('searchButton')).tap();
      await expect(element(by.id('searchScreen'))).toBeVisible();
    });

    it('should search for communities', async () => {
      await element(by.id('searchInput')).typeText('tech');
      await waitFor(element(by.id('searchResults')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should clear search', async () => {
      await element(by.id('clearSearchButton')).tap();
      await expect(element(by.id('searchInput'))).toHaveText('');
    });
  });

  describe('Community Interactions', () => {
    it('should join a community', async () => {
      await element(by.id('tab-Communities')).tap();
      await element(by.id('communityCard-0')).tap();
      await element(by.id('joinButton')).tap();
      await waitFor(element(by.id('leaveButton')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should leave a community', async () => {
      await element(by.id('leaveButton')).tap();
      await waitFor(element(by.id('joinButton')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Post Creation', () => {
    it('should open create post screen', async () => {
      await element(by.id('tab-Home')).tap();
      await element(by.id('createPostButton')).tap();
      await expect(element(by.id('createPostScreen'))).toBeVisible();
    });

    it('should create a text post', async () => {
      await element(by.id('postTitleInput')).typeText('Test Post');
      await element(by.id('postContentInput')).typeText('This is a test post');
      await element(by.id('submitPostButton')).tap();

      await waitFor(element(by.id('homeScreen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Wallet', () => {
    it('should open wallet screen', async () => {
      await element(by.id('walletButton')).tap();
      await expect(element(by.id('walletScreen'))).toBeVisible();
    });

    it('should display wallet balance', async () => {
      await expect(element(by.id('totalBalance'))).toBeVisible();
    });

    it('should show token list', async () => {
      await expect(element(by.id('tokenList'))).toBeVisible();
    });

    it('should show recent transactions', async () => {
      await expect(element(by.id('transactionList'))).toBeVisible();
    });
  });

  describe('NFT Marketplace', () => {
    it('should open NFT marketplace', async () => {
      await element(by.id('nftMarketplaceButton')).tap();
      await expect(element(by.id('nftMarketplaceScreen'))).toBeVisible();
    });

    it('should display NFT grid', async () => {
      await expect(element(by.id('nftGrid'))).toBeVisible();
    });

    it('should open NFT detail', async () => {
      await element(by.id('nftCard-0')).tap();
      await expect(element(by.id('nftDetailScreen'))).toBeVisible();
    });
  });

  describe('Settings', () => {
    it('should open settings', async () => {
      await element(by.id('tab-Profile')).tap();
      await element(by.id('settingsButton')).tap();
      await expect(element(by.id('settingsScreen'))).toBeVisible();
    });

    it('should toggle dark mode', async () => {
      await element(by.id('darkModeToggle')).tap();
      // Verify theme changed
    });

    it('should navigate to privacy settings', async () => {
      await element(by.id('privacySettingsButton')).tap();
      await expect(element(by.id('privacySettingsScreen'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh home feed', async () => {
      await element(by.id('tab-Home')).tap();
      await element(by.id('postFeed')).swipe('down', 'fast', 0.5);
      await waitFor(element(by.id('refreshIndicator')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      await element(by.id('tab-Profile')).tap();
      await element(by.id('settingsButton')).tap();
      await element(by.id('logoutButton')).tap();
      await element(by.text('Logout')).tap(); // Confirm dialog

      await waitFor(element(by.id('welcomeScreen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
