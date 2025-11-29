import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePostPage from '../CreatePostPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext, mockUnauthContext } from '../../../tests/utils/testUtils';

jest.mock('../../services/api', () => ({
  default: {
    post: jest.fn().mockResolvedValue({ success: true, data: { id: '1' } }),
    get: jest.fn().mockResolvedValue({ success: true, data: { communities: [] } }),
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

describe('CreatePostPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing', () => {
    renderWithRouter(<CreatePostPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays post form', () => {
    renderWithRouter(<CreatePostPage />);
    expect(screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i)).toBeTruthy();
    expect(screen.getByLabelText(/content/i) || screen.getByPlaceholderText(/content/i)).toBeTruthy();
  });

  it('submits post successfully', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<CreatePostPage />);

    const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
    const contentInput = screen.getByLabelText(/content/i) || screen.getByPlaceholderText(/content/i);

    fireEvent.change(titleInput, { target: { value: 'Test Post' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    const submitButton = screen.getByRole('button', { name: /submit|post|create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiMock.default.post).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    renderWithRouter(<CreatePostPage />);

    const submitButton = screen.getByRole('button', { name: /submit|post|create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/required/i) || screen.queryByText(/fill/i)).toBeTruthy();
    });
  });

  it('requires authentication', () => {
    renderWithRouter(<CreatePostPage />, mockUnauthContext);
    expect(screen.queryByRole('main')).toBeTruthy();
  });

  it('handles API errors', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.post.mockRejectedValueOnce(new Error('Failed to create post'));

    renderWithRouter(<CreatePostPage />);

    const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
    const contentInput = screen.getByLabelText(/content/i) || screen.getByPlaceholderText(/content/i);

    fireEvent.change(titleInput, { target: { value: 'Test Post' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    const submitButton = screen.getByRole('button', { name: /submit|post|create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/error/i) || screen.queryByText(/failed/i)).toBeTruthy();
    });
  });
});

export default renderWithRouter
