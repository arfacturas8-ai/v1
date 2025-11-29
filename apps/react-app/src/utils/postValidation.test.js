/**
 * Tests for postValidation utilities
 */
import {
  validatePost,
  validateTitle,
  validateContent,
  validateUrl,
  validatePoll,
  validateMedia,
  validateTags,
  validateSchedule,
  validateFieldRealTime,
  VALIDATION_RULES
} from './postValidation';

describe('postValidation', () => {
  describe('VALIDATION_RULES', () => {
    it('exports validation rules configuration', () => {
      expect(VALIDATION_RULES).toBeDefined();
      expect(VALIDATION_RULES.title).toBeDefined();
      expect(VALIDATION_RULES.content).toBeDefined();
      expect(VALIDATION_RULES.url).toBeDefined();
      expect(VALIDATION_RULES.tags).toBeDefined();
      expect(VALIDATION_RULES.poll).toBeDefined();
      expect(VALIDATION_RULES.media).toBeDefined();
    });
  });

  describe('validateTitle', () => {
    it('validates correct title', () => {
      const result = validateTitle('This is a valid title');

      expect(result.errors.length).toBe(0);
    });

    it('requires title when required is true', () => {
      const result = validateTitle('', { required: true });

      expect(result.errors).toContain('Title is required');
    });

    it('allows empty title when required is false', () => {
      const result = validateTitle('', { required: false });

      expect(result.errors.length).toBe(0);
    });

    it('validates minimum length', () => {
      const result = validateTitle('ab');

      expect(result.errors.some(err => err.includes('at least 3 characters'))).toBe(true);
    });

    it('validates maximum length', () => {
      const longTitle = 'a'.repeat(301);
      const result = validateTitle(longTitle);

      expect(result.errors.some(err => err.includes('less than 300 characters'))).toBe(true);
    });

    it('detects forbidden words', () => {
      const result = validateTitle('This is [deleted] content');

      expect(result.errors.some(err => err.includes('forbidden word'))).toBe(true);
    });

    it('detects profanity', () => {
      const result = validateTitle('This contains badword1');

      expect(result.errors.some(err => err.includes('inappropriate language'))).toBe(true);
    });

    it('rejects HTML tags', () => {
      const result = validateTitle('Title with <script>alert()</script>');

      expect(result.errors).toContain('Title cannot contain HTML tags');
    });

    it('warns about long titles', () => {
      const longTitle = 'a'.repeat(280);
      const result = validateTitle(longTitle);

      expect(result.warnings.some(warn => warn.includes('getting quite long'))).toBe(true);
    });

    it('warns about titles with many words', () => {
      const title = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one';
      const result = validateTitle(title);

      expect(result.warnings.some(warn => warn.includes('more concise'))).toBe(true);
    });

    it('warns about ALL CAPS titles', () => {
      const result = validateTitle('THIS IS ALL CAPS TITLE');

      expect(result.warnings.some(warn => warn.includes('ALL CAPS'))).toBe(true);
    });

    it('allows short ALL CAPS titles', () => {
      const result = validateTitle('NASA');

      expect(result.warnings.some(warn => warn.includes('ALL CAPS'))).toBe(false);
    });

    it('trims whitespace', () => {
      const result = validateTitle('   ');

      expect(result.errors).toContain('Title is required');
    });
  });

  describe('validateContent', () => {
    it('validates correct content', () => {
      const result = validateContent('This is valid content for a text post', 'text');

      expect(result.errors.length).toBe(0);
    });

    it('requires content for text posts', () => {
      const result = validateContent('', 'text', { required: true });

      expect(result.errors).toContain('Content is required for text posts');
    });

    it('allows empty content for non-text posts when not required', () => {
      const result = validateContent('', 'image', { required: false });

      expect(result.errors.length).toBe(0);
    });

    it('validates maximum length', () => {
      const longContent = 'a'.repeat(40001);
      const result = validateContent(longContent);

      expect(result.errors.some(err => err.includes('less than 40,000 characters'))).toBe(true);
    });

    it('warns about profanity', () => {
      const result = validateContent('Content with badword2');

      expect(result.warnings.some(warn => warn.includes('inappropriate language'))).toBe(true);
    });

    it('detects spam patterns', () => {
      const result = validateContent('aaaaaaaaaaaaaaaa click here for free money');

      expect(result.errors.some(err => err.includes('spam'))).toBe(true);
    });

    it('rejects script tags', () => {
      const result = validateContent('Content with <script>alert("xss")</script>');

      expect(result.errors).toContain('Content cannot contain scripts or executable code');
    });

    it('rejects javascript: protocol', () => {
      const result = validateContent('Link: javascript:alert("xss")');

      expect(result.errors).toContain('Content cannot contain scripts or executable code');
    });

    it('warns about excessive formatting', () => {
      const result = validateContent('**bold** __italic__ *more* _formatting_ ~~strike~~');

      expect(result.warnings.some(warn => warn.includes('Excessive formatting'))).toBe(true);
    });

    it('warns about too many links', () => {
      const links = Array(11).fill('https://example.com').join(' ');
      const result = validateContent(links);

      expect(result.warnings.some(warn => warn.includes('Too many links'))).toBe(true);
    });

    it('warns about suspicious structure patterns', () => {
      const content = '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n'; // Too many line breaks
      const result = validateContent(content);

      expect(result.warnings.some(warn => warn.includes('readability'))).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('validates correct URL', () => {
      const result = validateUrl('https://example.com/article');

      expect(result.errors.length).toBe(0);
    });

    it('requires URL when required is true', () => {
      const result = validateUrl('', { required: true });

      expect(result.errors).toContain('URL is required for link posts');
    });

    it('allows empty URL when not required', () => {
      const result = validateUrl('', { required: false });

      expect(result.errors.length).toBe(0);
    });

    it('validates HTTP protocol', () => {
      const result = validateUrl('http://example.com');

      expect(result.errors.length).toBe(0);
    });

    it('validates HTTPS protocol', () => {
      const result = validateUrl('https://example.com');

      expect(result.errors.length).toBe(0);
    });

    it('rejects invalid protocols', () => {
      const result = validateUrl('ftp://example.com');

      expect(result.errors).toContain('URL must use HTTP or HTTPS protocol');
    });

    it('rejects blocked domains', () => {
      const result = validateUrl('https://spam.com/article');

      expect(result.errors).toContain('This domain is not allowed');
    });

    it('warns about shortened URLs', () => {
      const result = validateUrl('https://bit.ly/abc123');

      expect(result.warnings.some(warn => warn.includes('Shortened URLs'))).toBe(true);
    });

    it('detects suspicious path patterns', () => {
      const result = validateUrl('https://example.com/../etc/passwd');

      expect(result.errors.some(err => err.includes('suspicious patterns'))).toBe(true);
    });

    it('detects suspicious query parameters', () => {
      const result = validateUrl('https://example.com?param=<script>');

      expect(result.errors.some(err => err.includes('suspicious patterns'))).toBe(true);
    });

    it('validates maximum length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2048);
      const result = validateUrl(longUrl);

      expect(result.errors.some(err => err.includes('too long'))).toBe(true);
    });

    it('rejects malformed URLs', () => {
      const result = validateUrl('not a url');

      expect(result.errors).toContain('Invalid URL format');
    });

    it('handles URLs with query params', () => {
      const result = validateUrl('https://example.com/search?q=test&sort=recent');

      expect(result.errors.length).toBe(0);
    });

    it('handles URLs with hash', () => {
      const result = validateUrl('https://example.com/page#section');

      expect(result.errors.length).toBe(0);
    });
  });

  describe('validatePoll', () => {
    it('validates correct poll', () => {
      const result = validatePoll(['Option 1', 'Option 2', 'Option 3'], 7);

      expect(result.errors.length).toBe(0);
    });

    it('requires minimum options', () => {
      const result = validatePoll(['Option 1'], 7, { required: true });

      expect(result.errors.some(err => err.includes('at least 2 options'))).toBe(true);
    });

    it('filters empty options', () => {
      const result = validatePoll(['Option 1', '', 'Option 2', '   '], 7, { required: true });

      expect(result.errors.length).toBe(0);
    });

    it('limits maximum options', () => {
      const options = ['1', '2', '3', '4', '5', '6', '7'];
      const result = validatePoll(options, 7);

      expect(result.errors.some(err => err.includes('cannot have more than 6'))).toBe(true);
    });

    it('validates option length', () => {
      const longOption = 'a'.repeat(201);
      const result = validatePoll(['Option 1', longOption], 7);

      expect(result.errors.some(err => err.includes('too long'))).toBe(true);
    });

    it('warns about profanity in options', () => {
      const result = validatePoll(['Option 1', 'badword1'], 7);

      expect(result.warnings.some(warn => warn.includes('inappropriate language'))).toBe(true);
    });

    it('detects duplicate options', () => {
      const result = validatePoll(['Same', 'Same', 'Different'], 7);

      expect(result.errors.some(err => err.includes('must be unique'))).toBe(true);
    });

    it('validates minimum duration', () => {
      const result = validatePoll(['Option 1', 'Option 2'], 0);

      expect(result.errors.some(err => err.includes('between 1 and 30 days'))).toBe(true);
    });

    it('validates maximum duration', () => {
      const result = validatePoll(['Option 1', 'Option 2'], 31);

      expect(result.errors.some(err => err.includes('between 1 and 30 days'))).toBe(true);
    });

    it('allows valid duration range', () => {
      const result1 = validatePoll(['Option 1', 'Option 2'], 1);
      const result2 = validatePoll(['Option 1', 'Option 2'], 30);

      expect(result1.errors.length).toBe(0);
      expect(result2.errors.length).toBe(0);
    });

    it('handles empty array when not required', () => {
      const result = validatePoll([], 7, { required: false });

      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateMedia', () => {
    it('validates correct media attachments', () => {
      const files = [
        { type: 'image/jpeg', size: 1024 * 1024, name: 'photo.jpg' }
      ];
      const result = validateMedia(files, 'image');

      expect(result.errors.length).toBe(0);
    });

    it('limits maximum files', () => {
      const files = Array(21).fill({ type: 'image/jpeg', size: 1024 });
      const result = validateMedia(files);

      expect(result.errors.some(err => err.includes('Too many files'))).toBe(true);
    });

    it('validates file size', () => {
      const files = [
        { type: 'image/jpeg', size: 600 * 1024 * 1024, name: 'huge.jpg' }
      ];
      const result = validateMedia(files, 'image');

      expect(result.errors.some(err => err.includes('too large'))).toBe(true);
    });

    it('validates file type for images', () => {
      const files = [
        { type: 'application/pdf', size: 1024, name: 'doc.pdf' }
      ];
      const result = validateMedia(files, 'image');

      expect(result.errors.some(err => err.includes('type not allowed'))).toBe(true);
    });

    it('allows valid image types', () => {
      const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      types.forEach(type => {
        const files = [{ type, size: 1024, name: 'image.jpg' }];
        const result = validateMedia(files, 'image');

        expect(result.errors.length).toBe(0);
      });
    });

    it('validates file type for videos', () => {
      const files = [
        { type: 'video/mp4', size: 1024, name: 'video.mp4' }
      ];
      const result = validateMedia(files, 'video');

      expect(result.errors.length).toBe(0);
    });

    it('warns about large image dimensions', () => {
      const files = [
        {
          type: 'image/jpeg',
          size: 1024,
          name: 'huge.jpg',
          width: 9000,
          height: 9000
        }
      ];
      const result = validateMedia(files, 'image');

      expect(result.warnings.some(warn => warn.includes('large dimensions'))).toBe(true);
    });

    it('rejects files with invalid characters in name', () => {
      const files = [
        { type: 'image/jpeg', size: 1024, name: '<script>.jpg' }
      ];
      const result = validateMedia(files, 'image');

      expect(result.errors.some(err => err.includes('invalid characters'))).toBe(true);
    });

    it('warns about large total file size', () => {
      const files = Array(10).fill({
        type: 'image/jpeg',
        size: 15 * 1024 * 1024,
        name: 'large.jpg'
      });
      const result = validateMedia(files, 'image');

      expect(result.warnings.some(warn => warn.includes('Large total file size'))).toBe(true);
    });

    it('handles empty attachments array', () => {
      const result = validateMedia([]);

      expect(result.errors.length).toBe(0);
    });

    it('handles files without size', () => {
      const files = [{ type: 'image/jpeg', name: 'image.jpg' }];
      const result = validateMedia(files, 'image');

      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateTags', () => {
    it('validates correct tags', () => {
      const result = validateTags(['javascript', 'react', 'programming']);

      expect(result.errors.length).toBe(0);
    });

    it('limits maximum tag count', () => {
      const tags = Array(11).fill('tag');
      const result = validateTags(tags);

      expect(result.errors.some(err => err.includes('Too many tags'))).toBe(true);
    });

    it('rejects empty tags', () => {
      const result = validateTags(['valid', '', 'another']);

      expect(result.errors.some(err => err.includes('empty'))).toBe(true);
    });

    it('validates minimum tag length', () => {
      const result = validateTags(['a']);

      expect(result.errors.some(err => err.includes('too short'))).toBe(true);
    });

    it('validates maximum tag length', () => {
      const longTag = 'a'.repeat(51);
      const result = validateTags([longTag]);

      expect(result.errors.some(err => err.includes('too long'))).toBe(true);
    });

    it('validates allowed characters', () => {
      const result = validateTags(['valid-tag', 'another_tag', 'Tag123']);

      expect(result.errors.length).toBe(0);
    });

    it('rejects invalid characters', () => {
      const result = validateTags(['invalid tag', 'tag@special', 'tag!']);

      expect(result.errors.some(err => err.includes('invalid characters'))).toBe(true);
    });

    it('rejects forbidden tags', () => {
      const result = validateTags(['spam']);

      expect(result.errors.some(err => err.includes('not allowed'))).toBe(true);
    });

    it('warns about duplicate tags', () => {
      const result = validateTags(['javascript', 'react', 'JavaScript']);

      expect(result.warnings.some(warn => warn.includes('Duplicate tags'))).toBe(true);
    });

    it('trims whitespace from tags', () => {
      const result = validateTags(['  tag  ']);

      expect(result.errors.length).toBe(0);
    });

    it('handles empty array', () => {
      const result = validateTags([]);

      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateSchedule', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('validates future date', () => {
      const future = new Date('2024-01-02T12:00:00Z');
      const result = validateSchedule(future);

      expect(result.errors.length).toBe(0);
    });

    it('rejects past dates', () => {
      const past = new Date('2023-12-31T12:00:00Z');
      const result = validateSchedule(past);

      expect(result.errors).toContain('Scheduled time must be in the future');
    });

    it('rejects dates too far in future', () => {
      const farFuture = new Date('2025-06-01T12:00:00Z');
      const result = validateSchedule(farFuture);

      expect(result.errors).toContain('Cannot schedule more than 1 year in advance');
    });

    it('warns about scheduling very soon', () => {
      const soon = new Date('2024-01-01T12:02:00Z');
      const result = validateSchedule(soon);

      expect(result.warnings.some(warn => warn.includes('very soon'))).toBe(true);
    });

    it('allows null/undefined', () => {
      const result1 = validateSchedule(null);
      const result2 = validateSchedule(undefined);

      expect(result1.errors.length).toBe(0);
      expect(result2.errors.length).toBe(0);
    });

    it('accepts date 1 year from now', () => {
      const oneYearMinus1Day = new Date('2024-12-31T12:00:00Z');
      const result = validateSchedule(oneYearMinus1Day);

      expect(result.errors.length).toBe(0);
    });
  });

  describe('validatePost', () => {
    it('validates complete text post', () => {
      const postData = {
        type: 'text',
        title: 'My First Post',
        content: 'This is a great post with enough content',
        communityId: 'community-1',
        tags: ['javascript', 'react']
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('validates link post with URL', () => {
      const postData = {
        type: 'link',
        title: 'Interesting Article',
        url: 'https://example.com/article',
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(true);
    });

    it('validates poll post', () => {
      const postData = {
        type: 'poll',
        title: 'What do you prefer?',
        pollOptions: ['Option A', 'Option B', 'Option C'],
        pollDuration: 7,
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(true);
    });

    it('validates image post with attachments', () => {
      const postData = {
        type: 'image',
        title: 'Check out this photo',
        attachments: [
          { type: 'image/jpeg', size: 1024 * 1024, name: 'photo.jpg' }
        ],
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(true);
    });

    it('requires community when not in draft mode', () => {
      const postData = {
        type: 'text',
        title: 'My Post',
        content: 'Some content'
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.community).toBeDefined();
    });

    it('allows missing community in draft mode', () => {
      const postData = {
        type: 'text',
        title: 'My Draft',
        content: 'Draft content'
      };

      const result = validatePost(postData, { draftMode: true });

      expect(result.errors.community).toBeUndefined();
    });

    it('validates scheduled post', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const postData = {
        type: 'text',
        title: 'Scheduled Post',
        content: 'This will be posted later',
        communityId: 'community-1',
        scheduledFor: new Date('2024-01-02T12:00:00Z')
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(true);
      expect(result.summary.isScheduled).toBe(true);

      jest.useRealTimers();
    });

    it('accumulates errors from all validators', () => {
      const postData = {
        type: 'text',
        title: 'ab', // Too short
        content: '', // Empty for text post
        tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] // Too many
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
      expect(result.errors.content).toBeDefined();
      expect(result.errors.tags).toBeDefined();
    });

    it('collects warnings', () => {
      const postData = {
        type: 'text',
        title: 'THIS IS AN ALL CAPS TITLE WITH MANY WORDS',
        content: 'Content with badword1',
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('cross-validates link posts', () => {
      const postData = {
        type: 'link',
        title: 'Link Post',
        communityId: 'community-1'
        // Missing URL and content
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.linkContent).toBeDefined();
    });

    it('cross-validates poll posts', () => {
      const postData = {
        type: 'poll',
        title: 'Poll Post',
        communityId: 'community-1',
        pollOptions: ['Only one'] // Not enough options
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.pollContent).toBeDefined();
    });

    it('cross-validates image posts', () => {
      const postData = {
        type: 'image',
        title: 'Image Post',
        communityId: 'community-1'
        // Missing attachments
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.mediaContent).toBeDefined();
    });

    it('cross-validates video posts', () => {
      const postData = {
        type: 'video',
        title: 'Video Post',
        communityId: 'community-1'
        // Missing attachments
      };

      const result = validatePost(postData);

      expect(result.isValid).toBe(false);
      expect(result.errors.mediaContent).toBeDefined();
    });

    it('warns about NSFW text posts without content', () => {
      const postData = {
        type: 'text',
        title: 'NSFW Post',
        content: 'Short',
        nsfw: true,
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.warnings.some(warn => warn.includes('NSFW'))).toBe(true);
    });

    it('warns about spoiler posts without context', () => {
      const postData = {
        type: 'text',
        title: 'Spoiler Alert',
        spoiler: true,
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.warnings.some(warn => warn.includes('Spoiler'))).toBe(true);
    });

    it('generates validation summary', () => {
      const postData = {
        type: 'text',
        title: 'My Post',
        content: 'Some content here',
        communityId: 'community-1'
      };

      const result = validatePost(postData);

      expect(result.summary).toBeDefined();
      expect(result.summary.hasErrors).toBe(false);
      expect(result.summary.errorCount).toBe(0);
      expect(result.summary.contentLength).toBe(17);
      expect(result.summary.readinessScore).toBeGreaterThan(0);
    });

    it('calculates readiness score', () => {
      const goodPost = {
        type: 'text',
        title: 'Well Crafted Title',
        content: 'This is comprehensive content with good length and structure',
        tags: ['tag1', 'tag2'],
        communityId: 'community-1'
      };

      const result = validatePost(goodPost);

      expect(result.summary.readinessScore).toBeGreaterThan(80);
    });

    it('handles validation exceptions gracefully', () => {
      const badData = {
        type: 'text',
        title: null // This might cause issues
      };

      const result = validatePost(badData);

      // Should not throw, should return error structure
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('allows incomplete posts in draft mode', () => {
      const draftPost = {
        type: 'text',
        title: 'Draft'
        // Missing content and community
      };

      const result = validatePost(draftPost, { draftMode: true });

      // Should have fewer errors than regular mode
      expect(result.errors.community).toBeUndefined();
    });
  });

  describe('validateFieldRealTime', () => {
    it('validates title field', () => {
      const result = validateFieldRealTime('title', 'My Title');

      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('validates content field', () => {
      const result = validateFieldRealTime('content', 'My content', { type: 'text' });

      expect(result.errors).toBeDefined();
    });

    it('validates url field', () => {
      const result = validateFieldRealTime('url', 'https://example.com');

      expect(result.errors).toBeDefined();
    });

    it('validates tags field', () => {
      const result = validateFieldRealTime('tags', ['tag1', 'tag2']);

      expect(result.errors).toBeDefined();
    });

    it('returns empty for unknown field', () => {
      const result = validateFieldRealTime('unknown', 'value');

      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('uses required: false for real-time validation', () => {
      const result = validateFieldRealTime('title', '');

      // Should not error on empty since it's real-time
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles post with all optional fields', () => {
      const minimalPost = {
        type: 'text',
        title: 'Minimal Post',
        content: 'Just enough content',
        communityId: 'community-1'
      };

      const result = validatePost(minimalPost);

      expect(result.isValid).toBe(true);
    });

    it('handles post with all fields populated', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const maximalPost = {
        type: 'text',
        title: 'Complete Post',
        content: 'This is a complete post with all fields populated',
        communityId: 'community-1',
        tags: ['tag1', 'tag2'],
        attachments: [
          { type: 'image/jpeg', size: 1024, name: 'image.jpg' }
        ],
        scheduledFor: new Date('2024-01-02T12:00:00Z'),
        nsfw: false,
        spoiler: false
      };

      const result = validatePost(maximalPost);

      expect(result.isValid).toBe(true);

      jest.useRealTimers();
    });

    it('handles unicode characters in title', () => {
      const result = validateTitle('Hello 世界 🌍');

      expect(result.errors.length).toBe(0);
    });

    it('handles unicode characters in content', () => {
      const result = validateContent('Content with émojis 🎉 and 中文');

      expect(result.errors.length).toBe(0);
    });

    it('handles very long valid content', () => {
      const longContent = 'a'.repeat(30000);
      const result = validateContent(longContent);

      expect(result.errors.length).toBe(0);
    });

    it('handles mixed valid and invalid tags', () => {
      const result = validateTags(['valid', 'spam', 'another-valid']);

      expect(result.errors.some(err => err.includes('spam'))).toBe(true);
    });
  });
});
