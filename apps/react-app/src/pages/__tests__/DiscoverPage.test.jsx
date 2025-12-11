import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DiscoverPage from '../DiscoverPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext } from '../../../tests/utils/testUtils';

jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      success: true,
      data: {
        posts: [
          {
            id: '1',
            title: 'Trending Post',
            content: 'Test content',
            author: { username: 'testuser' },
            likes: 100,
          },
        ],
        communities: [
          {
            id: '1',
            name: 'test-community',
            displayName: 'Test Community',
            memberCount: 500,
          },
        ],
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

describe('DiscoverPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<DiscoverPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays trending posts', async () => {
    renderWithRouter(<DiscoverPage />);
    await waitFor(() => {
      expect(screen.getByText('Trending Post')).toBeInTheDocument();
    });
  });

  it('displays recommended communities', async () => {
    renderWithRouter(<DiscoverPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });
  });

  it('shows search functionality', () => {
    renderWithRouter(<DiscoverPage />);
    const searchInput = screen.queryByPlaceholderText(/search/i) || screen.queryByRole('searchbox');
    expect(searchInput).toBeTruthy();
  });

  it('filters content by category', async () => {
    renderWithRouter(<DiscoverPage />);
    await waitFor(() => {
      const categoryButtons = screen.queryAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles API errors gracefully', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithRouter(<DiscoverPage />);
    await waitFor(() => {
      expect(screen.queryByText(/error/i) || document.querySelector('[role="alert"]')).toBeTruthy();
    });
  });

  it('shows loading state', () => {
    renderWithRouter(<DiscoverPage />);
    expect(document.querySelector('.') || screen.queryByTestId('loading')).toBeTruthy();
  });

  it('displays tab navigation', async () => {
    renderWithRouter(<DiscoverPage />);
    await waitFor(() => {
      const tabs = screen.queryAllByRole('tab') || screen.queryAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
});

export default renderWithRouter
