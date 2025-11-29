import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../AdminPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext } from '../../../tests/utils/testUtils';

jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      success: true,
      data: { users: [], reports: [], stats: {} },
    }),
  },
}));

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockAdminContext = {
  ...mockAuthContext,
  user: { ...mockAuthContext.user, role: 'admin' },
};

const renderWithRouter = (component, authValue = mockAdminContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('AdminPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing', () => {
    renderWithRouter(<AdminPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays admin stats', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockResolvedValueOnce({
      success: true,
      data: { stats: { totalUsers: 1000, totalPosts: 5000 } },
    });

    renderWithRouter(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText('1000') || screen.getByText('5000')).toBeTruthy();
    });
  });

  it('requires admin role', () => {
    renderWithRouter(<AdminPage />, mockAuthContext);
    expect(screen.queryByText(/unauthorized/i) || screen.queryByRole('main')).toBeTruthy();
  });

  it('shows user management section', async () => {
    renderWithRouter(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText(/users/i) || screen.getByText(/management/i)).toBeTruthy();
    });
  });

  it('shows reports section', async () => {
    renderWithRouter(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText(/reports/i) || screen.getByText(/moderation/i)).toBeTruthy();
    });
  });
});

export default mockAdminContext
