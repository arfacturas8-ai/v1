/**
 * Example Routes Configuration
 * Add these routes to your React Router setup
 */

import { Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  OnboardingWelcomePage,
  OnboardingProfilePage,
  OnboardingInterestsPage,
  OnboardingFollowPage,
  OnboardingCompletePage,
} from './pages/auth';

// Example route configuration
export const AuthRoutes = () => {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

      {/* Onboarding Routes */}
      <Route path="/auth/onboarding-welcome" element={<OnboardingWelcomePage />} />
      <Route path="/auth/onboarding-profile" element={<OnboardingProfilePage />} />
      <Route path="/auth/onboarding-interests" element={<OnboardingInterestsPage />} />
      <Route path="/auth/onboarding-follow" element={<OnboardingFollowPage />} />
      <Route path="/auth/onboarding-complete" element={<OnboardingCompletePage />} />
    </Routes>
  );
};

// Alternative: Protected onboarding routes
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = false; // Replace with actual auth check
  return isAuthenticated ? children : <Navigate to="/auth/login" />;
};

const RequireVerification = ({ children }: { children: JSX.Element }) => {
  const isVerified = false; // Replace with actual verification check
  return isVerified ? children : <Navigate to="/auth/verify-email" />;
};

export const ProtectedAuthRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Verification Required */}
      <Route
        path="/auth/verify-email"
        element={
          <RequireAuth>
            <VerifyEmailPage />
          </RequireAuth>
        }
      />

      {/* Onboarding Routes - Require auth and verification */}
      <Route
        path="/auth/onboarding-welcome"
        element={
          <RequireAuth>
            <RequireVerification>
              <OnboardingWelcomePage />
            </RequireVerification>
          </RequireAuth>
        }
      />
      <Route
        path="/auth/onboarding-profile"
        element={
          <RequireAuth>
            <RequireVerification>
              <OnboardingProfilePage />
            </RequireVerification>
          </RequireAuth>
        }
      />
      <Route
        path="/auth/onboarding-interests"
        element={
          <RequireAuth>
            <RequireVerification>
              <OnboardingInterestsPage />
            </RequireVerification>
          </RequireAuth>
        }
      />
      <Route
        path="/auth/onboarding-follow"
        element={
          <RequireAuth>
            <RequireVerification>
              <OnboardingFollowPage />
            </RequireVerification>
          </RequireAuth>
        }
      />
      <Route
        path="/auth/onboarding-complete"
        element={
          <RequireAuth>
            <RequireVerification>
              <OnboardingCompletePage />
            </RequireVerification>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

/**
 * Integration Example with App.tsx
 */

// In your main App.tsx or router configuration:
/*
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthRoutes } from './pages/auth/ROUTES_EXAMPLE';
import HomePage from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes *\/}
        <Route path="/auth/*" element={<AuthRoutes />} />

        {/* Main App Routes *\/}
        <Route path="/home" element={<HomePage />} />
        <Route path="/" element={<LandingPage />} />

        {/* 404 *\/}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
*/

/**
 * Navigation Examples
 */

// From LoginPage to home after successful login:
// navigate('/home', { replace: true });

// From SignupPage to email verification:
// navigate('/auth/verify-email', { state: { email: formData.email } });

// From VerifyEmailPage to onboarding:
// navigate('/auth/onboarding-welcome');

// From ForgotPasswordPage to reset password:
// User clicks email link with token: /auth/reset-password?token=abc123

// From ResetPasswordPage to login after success:
// navigate('/auth/login', { state: { message: 'Password reset successfully' } });

// Onboarding flow navigation:
// Step 1: /auth/onboarding-welcome → /auth/onboarding-profile
// Step 2: /auth/onboarding-profile → /auth/onboarding-interests
// Step 3: /auth/onboarding-interests → /auth/onboarding-follow
// Step 4: /auth/onboarding-follow → /auth/onboarding-complete
// Step 5: /auth/onboarding-complete → /home

export default AuthRoutes;
