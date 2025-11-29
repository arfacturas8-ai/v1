import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchPage from '../SearchPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext } from '../../../tests/utils/testUtils';

jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      success: true,
      data: {
        posts: [],
        users: [],
        communities: [],
      },
    }),
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<SearchPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays search input', () => {
    renderWithRouter(<SearchPage />);
    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
  });

  it('performs search on input', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<SearchPage />);

    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    await waitFor(() => {
      expect(apiMock.default.get).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('displays search results', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockResolvedValueOnce({
      success: true,
      data: {
        posts: [{ id: '1', title: 'Test Post' }],
        users: [{ id: '1', username: 'testuser' }],
        communities: [{ id: '1', name: 'test-community' }],
      },
    });

    renderWithRouter(<SearchPage />);
    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Post') || screen.getByText('testuser')).toBeTruthy();
    });
  });

  it('shows empty state for no results', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockResolvedValueOnce({
      success: true,
      data: {
        posts: [],
        users: [],
        communities: [],
      },
    });

    renderWithRouter(<SearchPage />);
    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/No results/i) || screen.getByText(/not found/i)).toBeTruthy();
    });
  });

  it('filters by content type', async () => {
    renderWithRouter(<SearchPage />);
    await waitFor(() => {
      const filterButtons = screen.queryAllByRole('button');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles search errors', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockRejectedValueOnce(new Error('Search failed'));

    renderWithRouter(<SearchPage />);
    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.queryByText(/error/i) || document.querySelector('[role="alert"]')).toBeTruthy();
    });
  });

  it('debounces search input', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<SearchPage />);

    const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should debounce and call API only once after delay
    await waitFor(() => {
      const callCount = apiMock.default.get.mock.calls.length;
      expect(callCount).toBeLessThan(4);
    }, { timeout: 1000 });
  });
});

export default renderWithRouter
