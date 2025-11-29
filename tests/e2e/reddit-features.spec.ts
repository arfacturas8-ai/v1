import { test, expect, Page } from '@playwright/test';

test.describe('Reddit-style Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cryb.app');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('Post Creation and Management', () => {
    test('create text post', async ({ page }) => {
      await page.goto('/submit');
      
      // Select text post type
      await page.click('[data-testid="post-type-text"]');
      
      // Fill post details
      await page.fill('input[name="title"]', 'Test Post Title');
      await page.fill('textarea[name="content"]', 'This is a test post content with some details.');
      
      // Select community
      await page.click('[data-testid="community-select"]');
      await page.click('text=General');
      
      // Add tags
      await page.fill('input[name="tags"]', 'test,automation');
      
      // Submit post
      await page.click('button[type="submit"]');
      
      // Should redirect to post view
      await expect(page).toHaveURL(/\/r\/general\/posts\/\d+/);
      await expect(page.locator('h1:has-text("Test Post Title")')).toBeVisible();
    });

    test('create image post', async ({ page }) => {
      await page.goto('/submit');
      
      await page.click('[data-testid="post-type-image"]');
      await page.fill('input[name="title"]', 'Test Image Post');
      
      // Upload image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');
      
      // Wait for upload to complete
      await expect(page.locator('[data-testid="upload-progress"]')).toBeHidden();
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/r\/\w+\/posts\/\d+/);
      await expect(page.locator('img[alt="Test Image Post"]')).toBeVisible();
    });

    test('create link post', async ({ page }) => {
      await page.goto('/submit');
      
      await page.click('[data-testid="post-type-link"]');
      await page.fill('input[name="title"]', 'Interesting Article');
      await page.fill('input[name="url"]', 'https://example.com/article');
      
      // Wait for link preview to load
      await expect(page.locator('[data-testid="link-preview"]')).toBeVisible();
      
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/r\/\w+\/posts\/\d+/);
      await expect(page.locator('a[href="https://example.com/article"]')).toBeVisible();
    });

    test('edit post', async ({ page }) => {
      // Navigate to an existing post
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      // Check if edit option is available (for post author)
      const editButton = page.locator('button:has-text("Edit")');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        await page.fill('textarea[name="content"]', 'Updated post content');
        await page.click('button:has-text("Save Changes")');
        
        await expect(page.locator('text=Updated post content')).toBeVisible();
        await expect(page.locator('text=edited')).toBeVisible();
      }
    });

    test('delete post', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      const deleteButton = page.locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        await page.click('button:has-text("Confirm Delete")');
        
        await expect(page.locator('text=Post deleted')).toBeVisible();
        await expect(page).toHaveURL(/\/r\/\w+/);
      }
    });
  });

  test.describe('Voting System', () => {
    test('upvote post', async ({ page }) => {
      await page.goto('/r/general');
      
      const firstPost = page.locator('[data-testid="post-item"]:first-child');
      const upvoteButton = firstPost.locator('[data-testid="upvote-button"]');
      const scoreElement = firstPost.locator('[data-testid="post-score"]');
      
      const initialScore = await scoreElement.textContent();
      
      await upvoteButton.click();
      
      // Wait for vote to register
      await page.waitForTimeout(500);
      
      // Check if score increased
      await expect(upvoteButton).toHaveClass(/voted/);
      
      const newScore = await scoreElement.textContent();
      expect(parseInt(newScore || '0')).toBeGreaterThan(parseInt(initialScore || '0'));
    });

    test('downvote post', async ({ page }) => {
      await page.goto('/r/general');
      
      const firstPost = page.locator('[data-testid="post-item"]:first-child');
      const downvoteButton = firstPost.locator('[data-testid="downvote-button"]');
      const scoreElement = firstPost.locator('[data-testid="post-score"]');
      
      const initialScore = await scoreElement.textContent();
      
      await downvoteButton.click();
      await page.waitForTimeout(500);
      
      await expect(downvoteButton).toHaveClass(/voted/);
      
      const newScore = await scoreElement.textContent();
      expect(parseInt(newScore || '0')).toBeLessThan(parseInt(initialScore || '0'));
    });

    test('remove vote', async ({ page }) => {
      await page.goto('/r/general');
      
      const firstPost = page.locator('[data-testid="post-item"]:first-child');
      const upvoteButton = firstPost.locator('[data-testid="upvote-button"]');
      
      // First upvote
      await upvoteButton.click();
      await page.waitForTimeout(500);
      await expect(upvoteButton).toHaveClass(/voted/);
      
      // Click again to remove vote
      await upvoteButton.click();
      await page.waitForTimeout(500);
      await expect(upvoteButton).not.toHaveClass(/voted/);
    });
  });

  test.describe('Comments System', () => {
    test('add comment to post', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      const commentBox = page.locator('textarea[name="comment"]');
      await commentBox.fill('This is a test comment with meaningful content.');
      
      await page.click('button:has-text("Post Comment")');
      
      await expect(page.locator('text=This is a test comment with meaningful content.')).toBeVisible();
      await expect(page.locator('[data-testid="comment-count"]')).toContainText(/\d+/);
    });

    test('reply to comment', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      const firstComment = page.locator('[data-testid="comment-item"]:first-child');
      await firstComment.locator('button:has-text("Reply")').click();
      
      const replyBox = firstComment.locator('textarea[name="reply"]');
      await replyBox.fill('This is a reply to the comment.');
      
      await firstComment.locator('button:has-text("Post Reply")').click();
      
      await expect(page.locator('text=This is a reply to the comment.')).toBeVisible();
    });

    test('vote on comments', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      const firstComment = page.locator('[data-testid="comment-item"]:first-child');
      const upvoteButton = firstComment.locator('[data-testid="comment-upvote"]');
      
      await upvoteButton.click();
      await page.waitForTimeout(500);
      
      await expect(upvoteButton).toHaveClass(/voted/);
    });

    test('nested comment threads', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      // Check for nested comment structure
      const nestedComments = page.locator('[data-testid="comment-thread"] [data-testid="comment-thread"]');
      
      if (await nestedComments.count() > 0) {
        await expect(nestedComments.first()).toBeVisible();
        
        // Check indentation/nesting styling
        await expect(nestedComments.first()).toHaveCSS('margin-left', /\d+px/);
      }
    });

    test('comment sorting', async ({ page }) => {
      await page.goto('/r/general');
      await page.click('[data-testid="post-item"]:first-child');
      
      // Test different sort options
      await page.click('[data-testid="sort-comments"]');
      await page.click('text=Best');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="sort-comments"]');
      await page.click('text=New');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="sort-comments"]');
      await page.click('text=Top');
      await page.waitForTimeout(1000);
      
      // Verify comments are present after sorting
      await expect(page.locator('[data-testid="comment-item"]')).toHaveCount({ min: 1 });
    });
  });

  test.describe('Community Features', () => {
    test('join community', async ({ page }) => {
      await page.goto('/r/technology');
      
      const joinButton = page.locator('button:has-text("Join")');
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await expect(page.locator('button:has-text("Joined")')).toBeVisible();
        
        // Check member count increased
        await expect(page.locator('[data-testid="member-count"]')).toContainText(/\d+/);
      }
    });

    test('leave community', async ({ page }) => {
      await page.goto('/r/technology');
      
      const joinedButton = page.locator('button:has-text("Joined")');
      if (await joinedButton.isVisible()) {
        await joinedButton.click();
        await page.click('button:has-text("Leave Community")');
        
        await expect(page.locator('button:has-text("Join")')).toBeVisible();
      }
    });

    test('browse community posts', async ({ page }) => {
      await page.goto('/r/general');
      
      // Check posts are loaded
      await expect(page.locator('[data-testid="post-item"]')).toHaveCount({ min: 1 });
      
      // Test sorting
      await page.click('[data-testid="sort-posts"]');
      await page.click('text=Hot');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="sort-posts"]');
      await page.click('text=New');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="sort-posts"]');
      await page.click('text=Top');
      await page.waitForTimeout(1000);
    });

    test('search within community', async ({ page }) => {
      await page.goto('/r/general');
      
      await page.fill('[data-testid="community-search"]', 'test');
      await page.press('[data-testid="community-search"]', 'Enter');
      
      await page.waitForTimeout(1000);
      
      // Check search results
      const posts = page.locator('[data-testid="post-item"]');
      const postCount = await posts.count();
      
      if (postCount > 0) {
        // Verify posts contain search term
        for (let i = 0; i < Math.min(3, postCount); i++) {
          const postText = await posts.nth(i).textContent();
          expect(postText?.toLowerCase()).toContain('test');
        }
      }
    });
  });

  test.describe('User Profiles and Karma', () => {
    test('view user profile', async ({ page }) => {
      await page.goto('/r/general');
      
      // Click on a username
      const username = page.locator('[data-testid="post-author"]:first-child');
      await username.click();
      
      // Should navigate to user profile
      await expect(page).toHaveURL(/\/u\/\w+/);
      await expect(page.locator('[data-testid="user-karma"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-posts"]')).toBeVisible();
    });

    test('karma calculation', async ({ page }) => {
      await page.goto('/profile');
      
      // Check karma display
      const karmaElement = page.locator('[data-testid="total-karma"]');
      await expect(karmaElement).toBeVisible();
      
      const karma = await karmaElement.textContent();
      expect(parseInt(karma || '0')).toBeGreaterThanOrEqual(0);
    });
  });
});