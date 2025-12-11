/**
 * CRYB Onboarding - Step 5: Complete
 * Success animation and welcome message
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Home, Zap, Users, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

export default function OnboardingCompletePage() {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'success' | 'ready'>('loading');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Initial loading phase
    const loadingTimer = setTimeout(() => {
      setAnimationPhase('success');
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    // Success phase
    if (animationPhase === 'success') {
      const successTimer = setTimeout(() => {
        setAnimationPhase('ready');
      }, 1500);

      return () => clearTimeout(successTimer);
    }
  }, [animationPhase]);

  useEffect(() => {
    // Countdown timer
    if (animationPhase === 'ready' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate('/home');
    }
  }, [animationPhase, countdown, navigate]);

  const handleGoToHome = () => {
    navigate('/home');
  };

  const stats = [
    { icon: Users, label: 'Interests', value: '5 topics', color: '#58a6ff' },
    { icon: Heart, label: 'Following', value: '3 creators', color: '#a371f7' },
    { icon: Zap, label: 'Profile', value: 'Complete', color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0D0D0D] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10 " />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10 " />
      </div>

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className="h-1.5 w-1.5 rounded-full bg-blue-500"
            />
          ))}
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl bg-[#141414]/80 backdrop-blur-xl border-white/10">
        <CardContent className="p-8 md:p-12">
          {/* Loading phase */}
          {animationPhase === 'loading' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] opacity-20 animate-ping" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white " />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Setting up your profile...</h2>
              <p className="text-gray-400">This will only take a moment</p>
            </div>
          )}

          {/* Success phase */}
          {animationPhase === 'success' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                <div className="relative w-full h-full rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">All set!</h2>
              <p className="text-gray-400">Your profile is ready</p>
            </div>
          )}

          {/* Ready phase */}
          {animationPhase === 'ready' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                Welcome to CRYB!
              </h1>
              <p className="text-lg text-gray-400 mb-8">
                You're all set to start exploring
              </p>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-[#0D0D0D] rounded-xl">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div
                        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                      <p className="text-sm text-white font-medium mb-1">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Features list */}
              <div className="mb-8 text-left space-y-4 p-6 bg-[#0D0D0D] rounded-xl">
                <h3 className="text-white font-semibold mb-4">What's next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Explore your personalized feed</p>
                      <p className="text-gray-400 text-xs">Discover content based on your interests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Join communities</p>
                      <p className="text-gray-400 text-xs">Connect with like-minded people</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Create your first post</p>
                      <p className="text-gray-400 text-xs">Share your thoughts with the community</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleGoToHome}
                  className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Home
                </Button>

                <p className="text-sm text-gray-400">
                  Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>

              {/* Celebration elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-${Math.random() * 20}%`,
                      background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
