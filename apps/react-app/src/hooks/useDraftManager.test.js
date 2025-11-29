/**
 * Tests for useDraftManager hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDraftManager } from './useDraftManager';
import * as AuthContext from '../contexts/AuthContext.jsx';
import * as ToastContext from '../contexts/ToastContext';

// Mock contexts
jest.mock('../contexts/AuthContext.jsx');
jest.mock('../contexts/ToastContext');

describe('useDraftManager', () => {
  let mockUser;
  let mockShowToast;
  let localStorageMock;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock user
    mockUser = { id: 'user-123', email: 'test@example.com' };
    AuthContext.useAuth = jest.fn(() => ({ user: mockUser }));

    // Mock toast
    mockShowToast = jest.fn();
    ToastContext.useToast = jest.fn(() => ({ showToast: mockShowToast }));

    // Mock localStorage
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    global.localStorage = localStorageMock;

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => useDraftManager());

      expect(result.current.drafts).toEqual([]);
      expect(result.current.currentDraft).toBe(null);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isAutoSaving).toBe(false);
      expect(result.current.lastSaved).toBe(null);
    });

    it('loads drafts from localStorage on mount', () => {
      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb_post_drafts_user-123');
      expect(result.current.drafts).toEqual(storedDrafts);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useDraftManager());

      expect(mockShowToast).toHaveBeenCalledWith('Failed to load drafts', 'error');
      expect(result.current.drafts).toEqual([]);
    });

    it('filters out invalid drafts', () => {
      const storedDrafts = [
        { id: 'draft-1', title: 'Valid' },
        null,
        { title: 'No ID' },
        { id: 'draft-2', title: 'Valid 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      expect(result.current.drafts).toHaveLength(2);
    });
  });

  describe('createDraft', () => {
    it('creates new draft with defaults', () => {
      const { result } = renderHook(() => useDraftManager());

      let newDraft;
      act(() => {
        newDraft = result.current.createDraft();
      });

      expect(newDraft.id).toMatch(/^draft_\d+_/);
      expect(newDraft.title).toBe('');
      expect(newDraft.content).toBe('');
      expect(newDraft.type).toBe('text');
      expect(newDraft.tags).toEqual([]);
      expect(result.current.currentDraft).toEqual(newDraft);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('creates draft with provided data', () => {
      const { result } = renderHook(() => useDraftManager());

      let newDraft;
      act(() => {
        newDraft = result.current.createDraft({
          title: 'My Draft',
          content: 'Draft content',
          communityId: 'community-1',
          type: 'link'
        });
      });

      expect(newDraft.title).toBe('My Draft');
      expect(newDraft.content).toBe('Draft content');
      expect(newDraft.communityId).toBe('community-1');
      expect(newDraft.type).toBe('link');
    });

    it('sets lastSaved timestamp', () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft();
      });

      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('loadDraft', () => {
    it('loads existing draft', () => {
      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', content: 'Content 1', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      let loadedDraft;
      act(() => {
        loadedDraft = result.current.loadDraft('draft-1');
      });

      expect(loadedDraft).toEqual(storedDrafts[0]);
      expect(result.current.currentDraft).toEqual(storedDrafts[0]);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('returns null for non-existent draft', () => {
      const { result } = renderHook(() => useDraftManager());

      let loadedDraft;
      act(() => {
        loadedDraft = result.current.loadDraft('non-existent');
      });

      expect(loadedDraft).toBe(null);
    });
  });

  describe('updateDraft', () => {
    it('updates current draft', () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Original' });
      });

      act(() => {
        result.current.updateDraft({ title: 'Updated' });
      });

      expect(result.current.currentDraft.title).toBe('Updated');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('increments version', () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft();
      });

      const initialVersion = result.current.currentDraft.version;

      act(() => {
        result.current.updateDraft({ title: 'Updated' });
      });

      expect(result.current.currentDraft.version).toBe(initialVersion + 1);
    });

    it('does nothing without current draft', () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.updateDraft({ title: 'Updated' });
      });

      expect(result.current.currentDraft).toBe(null);
    });
  });

  describe('saveDraft', () => {
    it('saves draft to localStorage', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test Draft' });
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb_post_drafts_user-123',
        expect.any(String)
      );
      expect(mockShowToast).toHaveBeenCalledWith('Draft saved successfully', 'success');
    });

    it('saves draft to server', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'server-id-123' } })
      });

      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test Draft' });
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('handles server errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test Draft' });
      });

      await act(async () => {
        await result.current.saveDraft(false);
      });

      // Should still save locally
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('suppresses notification when showNotification is false', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test Draft' });
      });

      await act(async () => {
        await result.current.saveDraft(false);
      });

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('updates hasUnsavedChanges to false', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
        result.current.updateDraft({ title: 'Updated' });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Auto-save', () => {
    it('auto-saves after delay', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
        result.current.updateDraft({ title: 'Updated' });
      });

      expect(result.current.isAutoSaving).toBe(false);

      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('debounces rapid updates', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
      });

      act(() => {
        result.current.updateDraft({ title: 'Update 1' });
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.updateDraft({ title: 'Update 2' });
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.updateDraft({ title: 'Update 3' });
      });

      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      });

      // Should only save once after final update
      expect(result.current.currentDraft.title).toBe('Update 3');
    });
  });

  describe('deleteDraft', () => {
    it('deletes draft from storage', async () => {
      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', lastModified: new Date().toISOString() },
        { id: 'draft-2', title: 'Draft 2', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      await act(async () => {
        await result.current.deleteDraft('draft-1');
      });

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.drafts[0].id).toBe('draft-2');
      expect(mockShowToast).toHaveBeenCalledWith('Draft deleted', 'info');
    });

    it('clears current draft if deleted', async () => {
      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
      });

      const draftId = result.current.currentDraft.id;

      await act(async () => {
        await result.current.deleteDraft(draftId);
      });

      expect(result.current.currentDraft).toBe(null);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('deletes from server if has serverId', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const storedDrafts = [
        { id: 'draft-1', serverId: 'server-1', title: 'Draft', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      await act(async () => {
        await result.current.deleteDraft('draft-1');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/posts/server-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('clearAllDrafts', () => {
    it('clears all drafts from storage', async () => {
      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', lastModified: new Date().toISOString() },
        { id: 'draft-2', title: 'Draft 2', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      await act(async () => {
        await result.current.clearAllDrafts();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cryb_post_drafts_user-123');
      expect(result.current.drafts).toEqual([]);
      expect(mockShowToast).toHaveBeenCalledWith('All drafts cleared', 'info');
    });
  });

  describe('publishDraft', () => {
    it('publishes draft to server', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'post-123' } })
      });

      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', content: 'Content', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      let published;
      await act(async () => {
        published = await result.current.publishDraft('draft-1');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/posts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"isDraft":false')
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith('Post published successfully!', 'success');
    });

    it('deletes draft after successful publish', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'post-123' } })
      });

      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      await act(async () => {
        await result.current.publishDraft('draft-1');
      });

      expect(result.current.drafts).toEqual([]);
    });

    it('handles publish errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Validation failed' })
      });

      const storedDrafts = [
        { id: 'draft-1', title: 'Draft 1', lastModified: new Date().toISOString() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedDrafts));

      const { result } = renderHook(() => useDraftManager());

      await expect(
        act(async () => {
          await result.current.publishDraft('draft-1');
        })
      ).rejects.toThrow();

      expect(mockShowToast).toHaveBeenCalledWith('Validation failed', 'error');
    });
  });

  describe('getDraftSummary', () => {
    it('calculates word count', () => {
      const { result } = renderHook(() => useDraftManager());

      const draft = {
        content: 'This is a test draft with some words',
        lastModified: new Date().toISOString()
      };

      const summary = result.current.getDraftSummary(draft);

      expect(summary.wordCount).toBe(8);
    });

    it('detects media presence', () => {
      const { result } = renderHook(() => useDraftManager());

      const draft = {
        content: 'Content',
        attachments: ['file1.jpg', 'file2.png'],
        lastModified: new Date().toISOString()
      };

      const summary = result.current.getDraftSummary(draft);

      expect(summary.hasMedia).toBe(true);
    });

    it('detects scheduled posts', () => {
      const { result } = renderHook(() => useDraftManager());

      const draft = {
        content: 'Content',
        scheduledFor: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      const summary = result.current.getDraftSummary(draft);

      expect(summary.isScheduled).toBe(true);
    });
  });

  describe('Backup and Restore', () => {
    it('creates backup on unmount with unsaved changes', () => {
      const { result, unmount } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
        result.current.updateDraft({ title: 'Updated' });
      });

      unmount();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb_post_drafts_user-123_backup',
        expect.any(String)
      );
    });

    it('restores from backup', () => {
      const backup = { id: 'backup-1', title: 'Backup Draft' };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key.includes('backup')) {
          return JSON.stringify(backup);
        }
        return null;
      });

      const { result } = renderHook(() => useDraftManager());

      let restored;
      act(() => {
        restored = result.current.restoreFromBackup();
      });

      expect(restored).toEqual(backup);
      expect(result.current.currentDraft).toEqual(backup);
      expect(mockShowToast).toHaveBeenCalledWith('Draft restored from backup', 'info');
    });
  });

  describe('Edge Cases', () => {
    it('limits drafts to MAX_DRAFTS', async () => {
      const manyDrafts = Array.from({ length: 15 }, (_, i) => ({
        id: `draft-${i}`,
        title: `Draft ${i}`,
        lastModified: new Date(Date.now() - i * 1000).toISOString()
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(manyDrafts));

      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'New Draft' });
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.length).toBeLessThanOrEqual(10);
    });

    it('handles no user gracefully', () => {
      AuthContext.useAuth = jest.fn(() => ({ user: null }));

      const { result } = renderHook(() => useDraftManager());

      act(() => {
        result.current.createDraft({ title: 'Test' });
      });

      // Should not try to save
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
