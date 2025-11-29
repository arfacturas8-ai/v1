import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from '../../src/navigation/AuthNavigator';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { NetworkProvider } from '../../src/contexts/NetworkContext';
import { NotificationProvider } from '../../src/contexts/NotificationContext';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock API service
jest.mock('../../src/services/ApiService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
}));

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <NetworkProvider>
        <NotificationProvider>
          <AuthProvider>
            {component}
          </AuthProvider>
        </NotificationProvider>
      </NetworkProvider>
    </NavigationContainer>
  );
};

describe('AuthNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders welcome screen by default', () => {
    renderWithProviders(<AuthNavigator />);
    
    expect(screen.getByText('Welcome to CRYB')).toBeTruthy();
    expect(screen.getByTestID('welcome-screen')).toBeTruthy();
  });

  test('shows login and register buttons on welcome screen', () => {
    renderWithProviders(<AuthNavigator />);
    
    expect(screen.getByTestID('login-button')).toBeTruthy();
    expect(screen.getByTestID('register-button')).toBeTruthy();
  });

  test('navigates to login screen when login button is pressed', async () => {
    renderWithProviders(<AuthNavigator />);
    
    const loginButton = screen.getByTestID('login-button');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(screen.getByTestID('login-screen')).toBeTruthy();
    });
  });

  test('navigates to register screen when register button is pressed', async () => {
    renderWithProviders(<AuthNavigator />);
    
    const registerButton = screen.getByTestID('register-button');
    fireEvent.press(registerButton);
    
    await waitFor(() => {
      expect(screen.getByTestID('register-screen')).toBeTruthy();
    });
  });

  test('login screen renders correctly', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      expect(screen.getByTestID('email-input')).toBeTruthy();
      expect(screen.getByTestID('password-input')).toBeTruthy();
      expect(screen.getByTestID('submit-login-button')).toBeTruthy();
      expect(screen.getByTestID('forgot-password-link')).toBeTruthy();
    });
  });

  test('register screen renders correctly', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('register-button'));
    
    await waitFor(() => {
      expect(screen.getByTestID('username-input')).toBeTruthy();
      expect(screen.getByTestID('email-input')).toBeTruthy();
      expect(screen.getByTestID('password-input')).toBeTruthy();
      expect(screen.getByTestID('confirm-password-input')).toBeTruthy();
      expect(screen.getByTestID('submit-register-button')).toBeTruthy();
    });
  });

  test('validates required fields on login form', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      const submitButton = screen.getByTestID('submit-login-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
      expect(screen.getByText('Password is required')).toBeTruthy();
    });
  });

  test('validates email format on login form', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      const emailInput = screen.getByTestID('email-input');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const submitButton = screen.getByTestID('submit-login-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  test('validates password strength on register form', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('register-button'));
    
    await waitFor(() => {
      const passwordInput = screen.getByTestID('password-input');
      fireEvent.changeText(passwordInput, '123');
      
      const submitButton = screen.getByTestID('submit-register-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  test('validates password confirmation on register form', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('register-button'));
    
    await waitFor(() => {
      const passwordInput = screen.getByTestID('password-input');
      const confirmPasswordInput = screen.getByTestID('confirm-password-input');
      
      fireEvent.changeText(passwordInput, 'SecurePassword123!');
      fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123!');
      
      const submitButton = screen.getByTestID('submit-register-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
  });

  test('handles successful login', async () => {
    const mockLogin = require('../../src/services/ApiService').login;
    mockLogin.mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' }
      }
    });

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      const emailInput = screen.getByTestID('email-input');
      const passwordInput = screen.getByTestID('password-input');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      
      const submitButton = screen.getByTestID('submit-login-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('handles login error', async () => {
    const mockLogin = require('../../src/services/ApiService').login;
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      const emailInput = screen.getByTestID('email-input');
      const passwordInput = screen.getByTestID('password-input');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      
      const submitButton = screen.getByTestID('submit-login-button');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  test('handles successful registration', async () => {
    const mockRegister = require('../../src/services/ApiService').register;
    mockRegister.mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', email: 'newuser@example.com', username: 'newuser' },
        tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' }
      }
    });

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('register-button'));
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('username-input'), 'newuser');
      fireEvent.changeText(screen.getByTestID('email-input'), 'newuser@example.com');
      fireEvent.changeText(screen.getByTestID('password-input'), 'SecurePassword123!');
      fireEvent.changeText(screen.getByTestID('confirm-password-input'), 'SecurePassword123!');
      
      fireEvent.press(screen.getByTestID('submit-register-button'));
    });
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      });
    });
  });

  test('shows loading state during login', async () => {
    const mockLogin = require('../../src/services/ApiService').login;
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestID('password-input'), 'password123');
      fireEvent.press(screen.getByTestID('submit-login-button'));
    });
    
    expect(screen.getByTestID('loading-indicator')).toBeTruthy();
    expect(screen.getByText('Signing in...')).toBeTruthy();
  });

  test('shows loading state during registration', async () => {
    const mockRegister = require('../../src/services/ApiService').register;
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('register-button'));
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('username-input'), 'newuser');
      fireEvent.changeText(screen.getByTestID('email-input'), 'newuser@example.com');
      fireEvent.changeText(screen.getByTestID('password-input'), 'SecurePassword123!');
      fireEvent.changeText(screen.getByTestID('confirm-password-input'), 'SecurePassword123!');
      fireEvent.press(screen.getByTestID('submit-register-button'));
    });
    
    expect(screen.getByTestID('loading-indicator')).toBeTruthy();
    expect(screen.getByText('Creating account...')).toBeTruthy();
  });

  test('navigates to forgot password screen', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      fireEvent.press(screen.getByTestID('forgot-password-link'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestID('forgot-password-screen')).toBeTruthy();
      expect(screen.getByText('Reset Password')).toBeTruthy();
    });
  });

  test('handles forgot password form', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      fireEvent.press(screen.getByTestID('forgot-password-link'));
    });
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('forgot-password-email-input'), 'test@example.com');
      fireEvent.press(screen.getByTestID('send-reset-button'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Reset instructions sent to your email')).toBeTruthy();
    });
  });

  test('handles back navigation correctly', async () => {
    renderWithProviders(<AuthNavigator />);
    
    // Navigate to login screen
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      expect(screen.getByTestID('login-screen')).toBeTruthy();
    });
    
    // Navigate back to welcome screen
    fireEvent.press(screen.getByTestID('back-button'));
    
    await waitFor(() => {
      expect(screen.getByTestID('welcome-screen')).toBeTruthy();
    });
  });

  test('switches between login and register screens', async () => {
    renderWithProviders(<AuthNavigator />);
    
    // Start at login
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      expect(screen.getByTestID('login-screen')).toBeTruthy();
    });
    
    // Switch to register
    fireEvent.press(screen.getByTestID('switch-to-register-link'));
    
    await waitFor(() => {
      expect(screen.getByTestID('register-screen')).toBeTruthy();
    });
    
    // Switch back to login
    fireEvent.press(screen.getByTestID('switch-to-login-link'));
    
    await waitFor(() => {
      expect(screen.getByTestID('login-screen')).toBeTruthy();
    });
  });

  test('persists form data when navigating', async () => {
    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('email-input'), 'test@example.com');
    });
    
    // Navigate away and back
    fireEvent.press(screen.getByTestID('back-button'));
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    });
  });

  test('clears form data on successful authentication', async () => {
    const mockLogin = require('../../src/services/ApiService').login;
    mockLogin.mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' }
      }
    });

    renderWithProviders(<AuthNavigator />);
    
    fireEvent.press(screen.getByTestID('login-button'));
    
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestID('email-input'), 'test@example.com');
      fireEvent.changeText(screen.getByTestID('password-input'), 'password123');
      fireEvent.press(screen.getByTestID('submit-login-button'));
    });
    
    await waitFor(() => {
      // After successful login, form should be cleared
      expect(screen.queryByDisplayValue('test@example.com')).toBeFalsy();
    });
  });
});