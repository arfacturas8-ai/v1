"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh_token');
        const provider = searchParams.get('provider');
        const csrfToken = searchParams.get('csrf_token');
        const error = searchParams.get('error');

        if (error) {
          setError(`OAuth authentication failed: ${error}`);
          setStatus('error');
          return;
        }

        if (!token || !refreshToken) {
          setError('Authentication tokens not received');
          setStatus('error');
          return;
        }

        // Store tokens
        localStorage.setItem('auth-token', token);
        localStorage.setItem('refresh-token', refreshToken);
        
        if (csrfToken) {
          localStorage.setItem('csrf-token', csrfToken);
        }

        // Get user data
        const userResponse = await api.getCurrentUser();
        
        if (!userResponse.success || !userResponse.data?.user) {
          setError('Failed to get user data');
          setStatus('error');
          return;
        }

        // Set user in store
        setUser(userResponse.data.user);
        
        // Connect socket
        try {
          socket.connect(token);
        } catch (socketError) {
          console.warn('Failed to connect socket:', socketError);
        }

        setStatus('success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, setUser, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Completing authentication...</h2>
          <p className="text-gray-400">Please wait while we log you in.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication successful!</h2>
          <p className="text-gray-400">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Authentication failed</h2>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}