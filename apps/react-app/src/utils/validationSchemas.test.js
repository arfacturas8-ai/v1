/**
 * Tests for validation schemas
 */
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  changePasswordSchema,
  communityCreationSchema,
  postCreationSchema,
  commentSchema,
  profileUpdateSchema,
  privacySettingsSchema,
  appearanceSettingsSchema,
  notificationPreferencesSchema,
  contactFormSchema,
  reportSchema,
  searchSchema,
  apiKeyCreationSchema,
  messageSchema,
  conversationSchema,
  validateField,
  validateForm,
  getSchema
} from './validationSchemas';

describe('validationSchemas', () => {
  describe('Authentication Schemas', () => {
    describe('loginSchema', () => {
      it('validates correct login data', async () => {
        const data = {
          email: 'user@example.com',
          password: 'password123'
        };

        await expect(loginSchema.validate(data)).resolves.toEqual(data);
      });

      it('requires email', async () => {
        const data = { password: 'password123' };

        await expect(loginSchema.validate(data)).rejects.toThrow('Email is required');
      });

      it('validates email format', async () => {
        const data = {
          email: 'invalid-email',
          password: 'password123'
        };

        await expect(loginSchema.validate(data)).rejects.toThrow('valid email');
      });

      it('requires password', async () => {
        const data = { email: 'user@example.com' };

        await expect(loginSchema.validate(data)).rejects.toThrow('Password is required');
      });

      it('validates minimum password length', async () => {
        const data = {
          email: 'user@example.com',
          password: 'short'
        };

        await expect(loginSchema.validate(data)).rejects.toThrow('at least 8 characters');
      });
    });

    describe('registerSchema', () => {
      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true
      };

      it('validates correct registration data', async () => {
        await expect(registerSchema.validate(validData)).resolves.toBeTruthy();
      });

      it('validates username length', async () => {
        const data = { ...validData, username: 'ab' };

        await expect(registerSchema.validate(data)).rejects.toThrow('at least 3 characters');
      });

      it('validates username max length', async () => {
        const data = { ...validData, username: 'a'.repeat(21) };

        await expect(registerSchema.validate(data)).rejects.toThrow('less than 20 characters');
      });

      it('validates username format', async () => {
        const data = { ...validData, username: 'invalid user!' };

        await expect(registerSchema.validate(data)).rejects.toThrow('letters, numbers, underscores');
      });

      it('requires lowercase letter in password', async () => {
        const data = { ...validData, password: 'PASSWORD123!', confirmPassword: 'PASSWORD123!' };

        await expect(registerSchema.validate(data)).rejects.toThrow('lowercase letter');
      });

      it('requires uppercase letter in password', async () => {
        const data = { ...validData, password: 'password123!', confirmPassword: 'password123!' };

        await expect(registerSchema.validate(data)).rejects.toThrow('uppercase letter');
      });

      it('requires number in password', async () => {
        const data = { ...validData, password: 'Password!', confirmPassword: 'Password!' };

        await expect(registerSchema.validate(data)).rejects.toThrow('at least one number');
      });

      it('requires special character in password', async () => {
        const data = { ...validData, password: 'Password123', confirmPassword: 'Password123' };

        await expect(registerSchema.validate(data)).rejects.toThrow('special character');
      });

      it('validates password confirmation', async () => {
        const data = { ...validData, confirmPassword: 'DifferentPassword1!' };

        await expect(registerSchema.validate(data)).rejects.toThrow('must match');
      });

      it('requires terms acceptance', async () => {
        const data = { ...validData, acceptTerms: false };

        await expect(registerSchema.validate(data)).rejects.toThrow('accept the Terms');
      });
    });

    describe('changePasswordSchema', () => {
      const validData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      it('validates correct password change', async () => {
        await expect(changePasswordSchema.validate(validData)).resolves.toBeTruthy();
      });

      it('ensures new password differs from current', async () => {
        const data = {
          currentPassword: 'Password123!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!'
        };

        await expect(changePasswordSchema.validate(data)).rejects.toThrow('different from current');
      });
    });
  });

  describe('Community Schemas', () => {
    describe('communityCreationSchema', () => {
      const validData = {
        name: 'technology',
        displayName: 'Technology Community',
        description: 'A community for tech enthusiasts',
        category: 'technology',
        isPrivate: false
      };

      it('validates correct community data', async () => {
        await expect(communityCreationSchema.validate(validData)).resolves.toBeTruthy();
      });

      it('validates community name format', async () => {
        const data = { ...validData, name: 'Invalid Name!' };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('lowercase letters and numbers');
      });

      it('validates community name length', async () => {
        const data = { ...validData, name: 'ab' };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('at least 3 characters');
      });

      it('validates description min length', async () => {
        const data = { ...validData, description: 'Short' };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('at least 10 characters');
      });

      it('validates category', async () => {
        const data = { ...validData, category: 'invalid-category' };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('valid category');
      });

      it('validates icon file size', async () => {
        const data = {
          ...validData,
          icon: { size: 6 * 1024 * 1024, type: 'image/png' }
        };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('too large');
      });

      it('validates icon file type', async () => {
        const data = {
          ...validData,
          icon: { size: 1024, type: 'application/pdf' }
        };

        await expect(communityCreationSchema.validate(data)).rejects.toThrow('must be an image');
      });
    });
  });

  describe('Post & Comment Schemas', () => {
    describe('postCreationSchema', () => {
      it('validates text post', async () => {
        const data = {
          title: 'My Post Title',
          content: 'This is my post content',
          type: 'text',
          communityId: 'community-1'
        };

        await expect(postCreationSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires content for text posts', async () => {
        const data = {
          title: 'My Post',
          type: 'text',
          communityId: 'community-1'
        };

        await expect(postCreationSchema.validate(data)).rejects.toThrow('Content is required');
      });

      it('validates link post with URL', async () => {
        const data = {
          title: 'Link Post',
          url: 'https://example.com',
          type: 'link',
          communityId: 'community-1'
        };

        await expect(postCreationSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires URL for link posts', async () => {
        const data = {
          title: 'Link Post',
          type: 'link',
          communityId: 'community-1'
        };

        await expect(postCreationSchema.validate(data)).rejects.toThrow('URL is required');
      });

      it('validates title length', async () => {
        const data = {
          title: 'ab',
          content: 'Content',
          type: 'text',
          communityId: 'community-1'
        };

        await expect(postCreationSchema.validate(data)).rejects.toThrow('at least 3 characters');
      });

      it('validates tag count limit', async () => {
        const data = {
          title: 'Post Title',
          content: 'Content',
          type: 'text',
          communityId: 'community-1',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
        };

        await expect(postCreationSchema.validate(data)).rejects.toThrow('up to 5 tags');
      });

      it('requires communityId', async () => {
        const data = {
          title: 'Post Title',
          content: 'Content',
          type: 'text'
        };

        await expect(postCreationSchema.validate(data)).rejects.toThrow('select a community');
      });
    });

    describe('commentSchema', () => {
      it('validates correct comment', async () => {
        const data = { content: 'This is a comment' };

        await expect(commentSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires content', async () => {
        const data = { content: '' };

        await expect(commentSchema.validate(data)).rejects.toThrow('cannot be empty');
      });

      it('validates max length', async () => {
        const data = { content: 'a'.repeat(10001) };

        await expect(commentSchema.validate(data)).rejects.toThrow('less than 10,000 characters');
      });
    });
  });

  describe('Profile & Settings Schemas', () => {
    describe('profileUpdateSchema', () => {
      it('validates correct profile data', async () => {
        const data = {
          displayName: 'John Doe',
          bio: 'Software developer',
          website: 'https://johndoe.com',
          interests: ['coding', 'music']
        };

        await expect(profileUpdateSchema.validate(data)).resolves.toBeTruthy();
      });

      it('validates website URL format', async () => {
        const data = {
          website: 'not-a-url'
        };

        await expect(profileUpdateSchema.validate(data)).rejects.toThrow('valid URL');
      });

      it('validates interests count', async () => {
        const data = {
          interests: Array(21).fill('interest')
        };

        await expect(profileUpdateSchema.validate(data)).rejects.toThrow('up to 20 interests');
      });

      it('validates social links', async () => {
        const data = {
          socialLinks: {
            twitter: 'https://twitter.com/user',
            github: 'https://github.com/user'
          }
        };

        await expect(profileUpdateSchema.validate(data)).resolves.toBeTruthy();
      });
    });

    describe('privacySettingsSchema', () => {
      it('validates correct privacy settings', async () => {
        const data = {
          profileVisibility: 'public',
          friendRequestsFrom: 'everyone',
          messagePrivacy: 'friends',
          onlineStatus: true,
          showEmail: false
        };

        await expect(privacySettingsSchema.validate(data)).resolves.toBeTruthy();
      });

      it('validates profileVisibility options', async () => {
        const data = {
          profileVisibility: 'invalid',
          friendRequestsFrom: 'everyone',
          messagePrivacy: 'friends'
        };

        await expect(privacySettingsSchema.validate(data)).rejects.toThrow('Invalid visibility');
      });
    });

    describe('appearanceSettingsSchema', () => {
      it('validates appearance settings', async () => {
        const data = {
          reduceMotion: false,
          highContrast: true,
          compactMode: false
        };

        await expect(appearanceSettingsSchema.validate(data)).resolves.toBeTruthy();
      });
    });

    describe('notificationPreferencesSchema', () => {
      it('validates notification preferences', async () => {
        const data = {
          friend_requests: true,
          messages: true,
          mentions: false
        };

        await expect(notificationPreferencesSchema.validate(data)).resolves.toBeTruthy();
      });
    });
  });

  describe('Contact & Support Schemas', () => {
    describe('contactFormSchema', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about features',
        message: 'I would like to know more about the platform features',
        category: 'general'
      };

      it('validates correct contact form', async () => {
        await expect(contactFormSchema.validate(validData)).resolves.toBeTruthy();
      });

      it('validates message min length', async () => {
        const data = { ...validData, message: 'Short' };

        await expect(contactFormSchema.validate(data)).rejects.toThrow('at least 20 characters');
      });

      it('validates category', async () => {
        const data = { ...validData, category: 'invalid' };

        await expect(contactFormSchema.validate(data)).rejects.toThrow('valid category');
      });
    });

    describe('reportSchema', () => {
      it('validates correct report', async () => {
        const data = {
          reason: 'spam',
          description: 'This post contains spam content'
        };

        await expect(reportSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires description', async () => {
        const data = {
          reason: 'spam',
          description: 'Short'
        };

        await expect(reportSchema.validate(data)).rejects.toThrow('at least 10 characters');
      });
    });
  });

  describe('Search Schema', () => {
    it('validates search query', async () => {
      const data = {
        query: 'javascript',
        type: 'posts'
      };

      await expect(searchSchema.validate(data)).resolves.toBeTruthy();
    });

    it('validates query min length', async () => {
      const data = {
        query: 'a',
        type: 'all'
      };

      await expect(searchSchema.validate(data)).rejects.toThrow('at least 2 characters');
    });

    it('validates search type', async () => {
      const data = {
        query: 'test',
        type: 'invalid'
      };

      await expect(searchSchema.validate(data)).rejects.toThrow('Invalid search type');
    });
  });

  describe('API Key Schema', () => {
    it('validates API key creation', async () => {
      const data = {
        name: 'My API Key',
        description: 'For testing',
        scopes: ['read', 'write']
      };

      await expect(apiKeyCreationSchema.validate(data)).resolves.toBeTruthy();
    });

    it('requires at least one scope', async () => {
      const data = {
        name: 'My API Key',
        scopes: []
      };

      await expect(apiKeyCreationSchema.validate(data)).rejects.toThrow('at least one scope');
    });

    it('validates expiration date', async () => {
      const pastDate = new Date('2020-01-01');
      const data = {
        name: 'My API Key',
        scopes: ['read'],
        expiresAt: pastDate
      };

      await expect(apiKeyCreationSchema.validate(data)).rejects.toThrow('in the future');
    });
  });

  describe('Messaging Schemas', () => {
    describe('messageSchema', () => {
      it('validates message', async () => {
        const data = {
          content: 'Hello, how are you?',
          recipientId: 'user-123'
        };

        await expect(messageSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires recipient', async () => {
        const data = { content: 'Hello' };

        await expect(messageSchema.validate(data)).rejects.toThrow('Recipient is required');
      });

      it('validates max length', async () => {
        const data = {
          content: 'a'.repeat(2001),
          recipientId: 'user-123'
        };

        await expect(messageSchema.validate(data)).rejects.toThrow('less than 2,000 characters');
      });
    });

    describe('conversationSchema', () => {
      it('validates 1-on-1 conversation', async () => {
        const data = {
          participantIds: ['user-1']
        };

        await expect(conversationSchema.validate(data)).resolves.toBeTruthy();
      });

      it('requires title for group conversations', async () => {
        const data = {
          participantIds: ['user-1', 'user-2', 'user-3']
        };

        await expect(conversationSchema.validate(data)).rejects.toThrow('title is required');
      });

      it('validates group conversation with title', async () => {
        const data = {
          participantIds: ['user-1', 'user-2', 'user-3'],
          title: 'Team Chat'
        };

        await expect(conversationSchema.validate(data)).resolves.toBeTruthy();
      });

      it('validates participant limit', async () => {
        const data = {
          participantIds: Array(51).fill('user-id'),
          title: 'Large Group'
        };

        await expect(conversationSchema.validate(data)).rejects.toThrow('up to 50 participants');
      });
    });
  });

  describe('Helper Functions', () => {
    describe('validateField', () => {
      it('validates single field successfully', async () => {
        const result = await validateField(
          loginSchema,
          'email',
          'user@example.com'
        );

        expect(result.valid).toBe(true);
        expect(result.error).toBe(null);
      });

      it('returns error for invalid field', async () => {
        const result = await validateField(
          loginSchema,
          'email',
          'invalid-email'
        );

        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    describe('validateForm', () => {
      it('validates entire form successfully', async () => {
        const data = {
          email: 'user@example.com',
          password: 'password123'
        };

        const result = await validateForm(loginSchema, data);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('returns all errors for invalid form', async () => {
        const data = {
          email: 'invalid',
          password: 'short'
        };

        const result = await validateForm(loginSchema, data);

        expect(result.valid).toBe(false);
        expect(result.errors.email).toBeTruthy();
        expect(result.errors.password).toBeTruthy();
      });
    });

    describe('getSchema', () => {
      it('returns login schema', () => {
        const schema = getSchema('login');

        expect(schema).toBe(loginSchema);
      });

      it('returns register schema', () => {
        const schema = getSchema('register');

        expect(schema).toBe(registerSchema);
      });

      it('returns null for unknown schema', () => {
        const schema = getSchema('nonexistent');

        expect(schema).toBe(null);
      });

      it('returns all major schemas', () => {
        expect(getSchema('communityCreation')).toBe(communityCreationSchema);
        expect(getSchema('postCreation')).toBe(postCreationSchema);
        expect(getSchema('comment')).toBe(commentSchema);
        expect(getSchema('profileUpdate')).toBe(profileUpdateSchema);
        expect(getSchema('contactForm')).toBe(contactFormSchema);
        expect(getSchema('message')).toBe(messageSchema);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings in optional fields', async () => {
      const data = {
        displayName: '',
        bio: null,
        location: undefined
      };

      await expect(profileUpdateSchema.validate(data)).resolves.toBeTruthy();
    });

    it('validates nested objects in social links', async () => {
      const data = {
        socialLinks: {
          twitter: 'https://twitter.com/user',
          github: 'invalid-url'
        }
      };

      await expect(profileUpdateSchema.validate(data)).rejects.toThrow('valid URL');
    });

    it('validates array fields', async () => {
      const data = {
        title: 'Test Post',
        content: 'Content',
        type: 'text',
        communityId: 'comm-1',
        tags: ['javascript', 'react', 'testing']
      };

      await expect(postCreationSchema.validate(data)).resolves.toBeTruthy();
    });
  });
});
