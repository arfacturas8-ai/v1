/**
 * CRYB Onboarding - Step 2: Profile Setup
 * Username, display name, avatar, and bio
 */

import React, { useState, useRef } from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import { useNavigate } from 'react-router-dom';
import { User, Camera, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar } from '../../components/ui/avatar';
import { cn } from '../../lib/utils';

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check username availability
  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate availability check (random)
      const isAvailable = Math.random() > 0.3;
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    } catch (err) {
      setUsernameStatus('idle');
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric and underscore
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: sanitized });
    checkUsername(sanitized);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Proceed to next step
      navigate('/auth/onboarding-interests');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/auth/onboarding-welcome');
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
                step === 2 ? 'w-8 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]' : step < 2 ? 'w-1.5 bg-blue-500' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl bg-white  border-[var(--border-subtle)]">
        <CardContent className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--text-primary)]">Set up your profile</h1>
            <p className="text-lg text-[var(--text-secondary)]">Tell us about yourself</p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)]">
              Step 2 of 5
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--bg-secondary)] border-4 border-[var(--border-subtle)]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Camera style={{color: "var(--text-primary)"}} className="w-5 h-5 " />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Upload a profile picture (optional)</p>
              <p className="text-xs text-[var(--text-secondary)]">JPG, PNG or GIF. Max 5MB</p>
            </div>

            {/* Username */}
            <div>
              <Input
                type="text"
                label="Username"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                rightIcon={
                  usernameStatus === 'checking' ? (
                    <Loader2 className="w-4 h-4 text-gray-400 " />
                  ) : usernameStatus === 'available' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : usernameStatus === 'taken' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : null
                }
                helperText={
                  usernameStatus === 'available'
                    ? 'Username is available!'
                    : usernameStatus === 'taken'
                    ? 'Username is already taken'
                    : 'Choose a unique username (3-20 characters)'
                }
                success={usernameStatus === 'available' ? 'Username is available!' : undefined}
                error={usernameStatus === 'taken' ? 'Username is already taken' : undefined}
                required
              />
            </div>

            {/* Display name */}
            <Input
              type="text"
              label="Display Name"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              helperText="This is how others will see your name"
              required
            />

            {/* Bio */}
            <Textarea
              label="Bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              helperText={`${formData.bio.length}/160 characters`}
              rows={4}
              maxLength={160}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                disabled={loading || usernameStatus !== 'available' || !formData.displayName}
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
