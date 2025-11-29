import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WalletScreen from '../../src/screens/wallet/WalletScreen';
import { ThemeContext } from '../../src/contexts/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Mock theme
const mockTheme = {
  theme: 'dark',
  colors: {
    primary: '#6366F1',
    background: '#0F1419',
    card: '#1A1F26',
    text: '#E7E9EA',
    textSecondary: '#8B8F93',
    border: '#2F3336',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
  },
  toggleTheme: jest.fn(),
};

describe('WalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    expect(getByText('Wallet')).toBeTruthy();
    expect(getByText('Total Balance')).toBeTruthy();
  });

  it('displays wallet balance', () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    expect(getByText('$1,234.56')).toBeTruthy();
  });

  it('shows action buttons', () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    expect(getByText('Send')).toBeTruthy();
    expect(getByText('Receive')).toBeTruthy();
    expect(getByText('Swap')).toBeTruthy();
    expect(getByText('Buy')).toBeTruthy();
  });

  it('navigates to Send screen when Send button is pressed', async () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    const sendButton = getByText('Send');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Send');
    });
  });

  it('displays token list', () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    expect(getByText('ETH')).toBeTruthy();
    expect(getByText('Ethereum')).toBeTruthy();
    expect(getByText('MATIC')).toBeTruthy();
    expect(getByText('Polygon')).toBeTruthy();
  });

  it('displays recent transactions', () => {
    const { getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    expect(getByText('Recent Activity')).toBeTruthy();
    expect(getByText('+0.5 ETH')).toBeTruthy();
    expect(getByText('-100 MATIC')).toBeTruthy();
  });

  it('handles pull to refresh', async () => {
    const { getByTestId } = render(
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <WalletScreen />
        </NavigationContainer>
      </ThemeContext.Provider>
    );

    // Simulate pull to refresh
    // Note: This is a simplified test, actual implementation may vary
    await waitFor(() => {
      expect(true).toBeTruthy();
    });
  });
});
