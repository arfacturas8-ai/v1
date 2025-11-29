import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommunitiesPage from '../CommunitiesPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext } from '../../../tests/utils/testUtils';

jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'community-1', displayName: 'Community 1', memberCount: 100 },
        { id: '2', name: 'community-2', displayName: 'Community 2', memberCount: 200 },
      ],
    }),
  },
}));

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('CommunitiesPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing', () => {
    renderWithRouter(<CommunitiesPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays communities list', async () => {
    renderWithRouter(<CommunitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Community 1') || screen.getByText('Community 2')).toBeTruthy();
    });
  });

  it('shows loading state', () => {
    renderWithRouter(<CommunitiesPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('displays member counts', async () => {
    renderWithRouter(<CommunitiesPage />);
    await waitFor(() => {
      expect(screen.getByText(/100|200/)).toBeTruthy();
    });
  });

  it('handles API errors', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockRejectedValueOnce(new Error('Failed'));

    renderWithRouter(<CommunitiesPage />);
    await waitFor(() => {
      expect(screen.queryByText(/error/i) || document.querySelector('[role="alert"]')).toBeTruthy();
    });
  });
});

export default renderWithRouter
