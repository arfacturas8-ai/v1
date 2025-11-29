/**
 * Tests for useAnalytics hooks
 */
import { renderHook } from '@testing-library/react';
import { usePageTracking, useAnalytics } from './useAnalytics';
import { trackPageView, trackEvent, trackUserAction } from '../lib/analytics';
import { useLocation } from 'react-router-dom';

jest.mock('../lib/analytics');
jest.mock('react-router-dom');

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePageTracking', () => {
    it('tracks page view on mount', () => {
      useLocation.mockReturnValue({
        pathname: '/home',
        search: ''
      });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/home');
    });

    it('tracks page view with query params', () => {
      useLocation.mockReturnValue({
        pathname: '/search',
        search: '?q=test'
      });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/search?q=test');
    });

    it('tracks page view on route change', () => {
      const location = { pathname: '/home', search: '' };
      useLocation.mockReturnValue(location);

      const { rerender } = renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/home');
      expect(trackPageView).toHaveBeenCalledTimes(1);

      // Simulate route change
      useLocation.mockReturnValue({ pathname: '/about', search: '' });
      rerender();

      expect(trackPageView).toHaveBeenCalledWith('/about');
      expect(trackPageView).toHaveBeenCalledTimes(2);
    });

    it('tracks page view with complex paths', () => {
      useLocation.mockReturnValue({
        pathname: '/users/123/posts',
        search: '?page=2&sort=recent'
      });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/users/123/posts?page=2&sort=recent');
    });

    it('handles empty search params', () => {
      useLocation.mockReturnValue({
        pathname: '/profile',
        search: ''
      });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/profile');
    });

    it('tracks page view multiple times on multiple route changes', () => {
      useLocation.mockReturnValue({ pathname: '/page1', search: '' });

      const { rerender } = renderHook(() => usePageTracking());

      useLocation.mockReturnValue({ pathname: '/page2', search: '' });
      rerender();

      useLocation.mockReturnValue({ pathname: '/page3', search: '' });
      rerender();

      expect(trackPageView).toHaveBeenCalledTimes(3);
      expect(trackPageView).toHaveBeenNthCalledWith(1, '/page1');
      expect(trackPageView).toHaveBeenNthCalledWith(2, '/page2');
      expect(trackPageView).toHaveBeenNthCalledWith(3, '/page3');
    });
  });

  describe('useAnalytics', () => {
    it('provides trackEvent function', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current.trackEvent).toBe(trackEvent);
    });

    it('provides trackUserAction function', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current.trackUserAction).toBe(trackUserAction);
    });

    it('provides trackPageView function', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current.trackPageView).toBe(trackPageView);
    });

    it('returns all tracking functions', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current).toEqual({
        trackEvent,
        trackUserAction,
        trackPageView
      });
    });

    it('can call trackEvent', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackEvent('button_click', { buttonId: 'submit' });

      expect(trackEvent).toHaveBeenCalledWith('button_click', { buttonId: 'submit' });
    });

    it('can call trackUserAction', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackUserAction('sign_up');

      expect(trackUserAction).toHaveBeenCalledWith('sign_up');
    });

    it('can call trackPageView', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPageView('/custom-page');

      expect(trackPageView).toHaveBeenCalledWith('/custom-page');
    });
  });

  describe('Integration', () => {
    it('can use both hooks together', () => {
      useLocation.mockReturnValue({ pathname: '/home', search: '' });

      const { result: pageTrackingResult } = renderHook(() => usePageTracking());
      const { result: analyticsResult } = renderHook(() => useAnalytics());

      expect(trackPageView).toHaveBeenCalledWith('/home');

      analyticsResult.current.trackEvent('test_event');
      expect(trackEvent).toHaveBeenCalledWith('test_event');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined location', () => {
      useLocation.mockReturnValue(undefined);

      expect(() => {
        renderHook(() => usePageTracking());
      }).toThrow();
    });

    it('handles location without pathname', () => {
      useLocation.mockReturnValue({ search: '?test=1' });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('undefined?test=1');
    });

    it('handles location without search', () => {
      useLocation.mockReturnValue({ pathname: '/test' });

      renderHook(() => usePageTracking());

      expect(trackPageView).toHaveBeenCalledWith('/testundefined');
    });

    it('handles same route with different query params', () => {
      useLocation.mockReturnValue({ pathname: '/search', search: '?q=first' });

      const { rerender } = renderHook(() => usePageTracking());

      useLocation.mockReturnValue({ pathname: '/search', search: '?q=second' });
      rerender();

      expect(trackPageView).toHaveBeenCalledTimes(2);
      expect(trackPageView).toHaveBeenNthCalledWith(1, '/search?q=first');
      expect(trackPageView).toHaveBeenNthCalledWith(2, '/search?q=second');
    });
  });
});
