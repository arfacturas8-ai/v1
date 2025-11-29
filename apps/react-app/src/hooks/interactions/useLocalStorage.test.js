/**
 * Tests for useLocalStorage hook
 */
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;

    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      expect(result.current[0]).toBe('initial');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
    });

    it('initializes with value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      expect(result.current[0]).toBe('stored');
    });

    it('parses JSON from localStorage', () => {
      const storedObject = { name: 'John', age: 30 };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedObject));

      const { result } = renderHook(() => useLocalStorage('user', {}));

      expect(result.current[0]).toEqual(storedObject);
    });

    it('returns initial value on JSON parse error', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('default');
      expect(console.error).toHaveBeenCalled();
    });

    it('handles localStorage read error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'fallback'));

      expect(result.current[0]).toBe('fallback');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('SetValue Function', () => {
    it('updates stored value', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify('updated')
      );
    });

    it('handles function updater', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(5));

      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(6);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'counter',
        JSON.stringify(6)
      );
    });

    it('stores objects correctly', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('user', {}));

      const userData = { id: 1, name: 'Alice' };

      act(() => {
        result.current[1](userData);
      });

      expect(result.current[0]).toEqual(userData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(userData)
      );
    });

    it('stores arrays correctly', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('items', []));

      const items = [1, 2, 3, 4, 5];

      act(() => {
        result.current[1](items);
      });

      expect(result.current[0]).toEqual(items);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'items',
        JSON.stringify(items)
      );
    });

    it('handles null values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify(null)
      );
    });

    it('handles localStorage write error', () => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('RemoveValue Function', () => {
    it('removes value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      act(() => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBe('default');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('resets to initial value', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('initial');
    });

    it('handles localStorage remove error', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored'));
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      act(() => {
        result.current[2]();
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Return Value', () => {
    it('returns array with value, setValue, and removeValue', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      expect(result.current).toHaveLength(3);
      expect(typeof result.current[0]).toBe('string');
      expect(typeof result.current[1]).toBe('function');
      expect(typeof result.current[2]).toBe('function');
    });

    it('supports array destructuring', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));
      const [value, setValue, removeValue] = result.current;

      expect(value).toBe('initial');
      expect(typeof setValue).toBe('function');
      expect(typeof removeValue).toBe('function');
    });
  });

  describe('Different Data Types', () => {
    it('handles string values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('text', 'hello'));

      act(() => {
        result.current[1]('world');
      });

      expect(result.current[0]).toBe('world');
    });

    it('handles number values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('count', 0));

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
    });

    it('handles boolean values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('flag', false));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
    });

    it('handles complex objects', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const complexObj = {
        user: { id: 1, name: 'John' },
        settings: { theme: 'dark', notifications: true },
        items: [1, 2, 3]
      };

      const { result } = renderHook(() => useLocalStorage('data', {}));

      act(() => {
        result.current[1](complexObj);
      });

      expect(result.current[0]).toEqual(complexObj);
    });
  });

  describe('Use Cases', () => {
    it('persists user preferences', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() =>
        useLocalStorage('userPreferences', { theme: 'light' })
      );

      act(() => {
        result.current[1]({ theme: 'dark', fontSize: 16 });
      });

      expect(result.current[0]).toEqual({ theme: 'dark', fontSize: 16 });
    });

    it('stores authentication token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('authToken', null));

      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      act(() => {
        result.current[1](token);
      });

      expect(result.current[0]).toBe(token);
    });

    it('manages shopping cart', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('cart', []));

      act(() => {
        result.current[1]([
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 }
        ]);
      });

      expect(result.current[0]).toHaveLength(2);
    });

    it('tracks form draft', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('formDraft', { title: '', content: '' }));

      act(() => {
        result.current[1]({ title: 'My Post', content: 'Draft content...' });
      });

      expect(result.current[0].title).toBe('My Post');
      expect(result.current[0].content).toBe('Draft content...');
    });

    it('clears user session on logout', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 1, token: 'abc' }));

      const { result } = renderHook(() => useLocalStorage('session', null));

      expect(result.current[0]).toEqual({ userId: 1, token: 'abc' });

      act(() => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBe(null);
    });
  });

  describe('Multiple Instances', () => {
    it('handles multiple hooks with different keys', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
      const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

      expect(result1.current[0]).toBe('value1');
      expect(result2.current[0]).toBe('value2');

      act(() => {
        result1.current[1]('updated1');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('value2');
    });

    it('updates independently', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result: countResult } = renderHook(() => useLocalStorage('count', 0));
      const { result: nameResult } = renderHook(() => useLocalStorage('name', ''));

      act(() => {
        countResult.current[1](5);
        nameResult.current[1]('Alice');
      });

      expect(countResult.current[0]).toBe(5);
      expect(nameResult.current[0]).toBe('Alice');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const largeArray = Array(1000).fill(0).map((_, i) => ({ id: i, data: 'item' }));

      const { result } = renderHook(() => useLocalStorage('largeData', []));

      act(() => {
        result.current[1](largeArray);
      });

      expect(result.current[0]).toHaveLength(1000);
    });

    it('handles special characters in key', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('key-with-dashes_and_underscores', 'value'));

      expect(result.current[0]).toBe('value');
    });

    it('handles undefined initial value', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', undefined));

      expect(result.current[0]).toBeUndefined();
    });

    it('handles rapid updates', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1](1);
        result.current[1](2);
        result.current[1](3);
      });

      expect(result.current[0]).toBe(3);
    });

    it('handles function updater with previous value', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(10));

      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1](prev => prev + 5);
        result.current[1](prev => prev * 2);
      });

      expect(result.current[0]).toBe(30);
    });
  });
});
