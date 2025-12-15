/**
 * CRYB Onboarding - Step 3: Select Interests
 * Choose at least 3 interests to personalize feed
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Gamepad, Music, Palette, Camera, Code,
  TrendingUp, Book, Coffee, Plane, Heart, Dumbbell, Film, Headphones,
  Tv, Zap, Globe, Users, MessageCircle, Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const interests = [
  { id: 'gaming', name: 'Gaming', icon: Gamepad, color: '#9B59B6' },
  { id: 'music', name: 'Music', icon: Music, color: '#E91E63' },
  { id: 'art', name: 'Art & Design', icon: Palette, color: '#FF5722' },
  { id: 'photography', name: 'Photography', icon: Camera, color: '#00BCD4' },
  { id: 'technology', name: 'Technology', icon: Code, color: '#2196F3' },
  { id: 'crypto', name: 'Crypto & NFTs', icon: TrendingUp, color: '#FFC107' },
  { id: 'books', name: 'Books', icon: Book, color: '#8BC34A' },
  { id: 'food', name: 'Food & Cooking', icon: Coffee, color: '#FF9800' },
  { id: 'travel', name: 'Travel', icon: Plane, color: '#03A9F4' },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: '#F44336' },
  { id: 'movies', name: 'Movies & TV', icon: Film, color: '#9C27B0' },
  { id: 'podcasts', name: 'Podcasts', icon: Headphones, color: '#673AB7' },
  { id: 'fashion', name: 'Fashion', icon: Heart, color: '#E91E63' },
  { id: 'sports', name: 'Sports', icon: Zap, color: '#4CAF50' },
  { id: 'science', name: 'Science', icon: Globe, color: '#009688' },
  { id: 'community', name: 'Community', icon: Users, color: '#3F51B5' },
];

export default function OnboardingInterestsPage() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const minInterests = 3;
  const canContinue = selectedInterests.length >= minInterests;

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canContinue) return;

    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Proceed to next step
      navigate('/auth/onboarding-follow');
    } catch (err) {
      console.error('Failed to save interests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/auth/onboarding-profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                'h-1.5 rounded-full transition-all',
                step === 3 ? 'w-8 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]' : step < 3 ? 'w-1.5 bg-blue-500' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-4xl bg-white  border-[var(--border-subtle)]">
        <CardContent className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--text-primary)]">Choose your interests</h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Select at least {minInterests} topics you're interested in
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)]">
              Step 3 of 5
            </span>
          </div>

          {/* Selected count */}
          <div className="mb-6 text-center">
            <span className={cn(
              'text-sm font-medium',
              canContinue ? 'text-green-500' : 'text-[var(--text-secondary)]'
            )}>
              {selectedInterests.length} selected {canContinue && '✓'}
            </span>
          </div>

          {/* Interests grid */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {interests.map((interest) => {
                const Icon = interest.icon;
                const isSelected = selectedInterests.includes(interest.id);

                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      'group relative p-6 rounded-xl border-2 transition-all',
                      'hover:scale-105 active:scale-95',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                          isSelected ? 'bg-blue-500/20' : 'bg-gray-100 group-hover:bg-gray-200'
                        )}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: isSelected ? interest.color : '#9CA3AF' }}
                        />
                      </div>
                      <span className={cn(
                        'text-sm font-medium transition-colors text-center',
                        isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      )}>
                        {interest.name}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg style={{color: "var(--text-primary)"}} className="w-4 h-4 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleBack}
                disabled={loading}
                className="bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                disabled={loading || !canContinue}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
