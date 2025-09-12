'use client';

import React, { useState, useCallback } from 'react';
import {
  Users,
  Globe,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface CommunityFormData {
  name: string;
  displayName: string;
  description: string;
  isPublic: boolean;
  isNsfw: boolean;
}

interface CommunityCreationFormProps {
  onSubmit: (communityData: any) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

interface FormState {
  data: CommunityFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  nameAvailable: boolean | null;
  checkingName: boolean;
}

export function CommunityCreationForm({
  onSubmit,
  onCancel,
  className,
}: CommunityCreationFormProps) {
  const [state, setState] = useState<FormState>({
    data: {
      name: '',
      displayName: '',
      description: '',
      isPublic: true,
      isNsfw: false,
    },
    errors: {},
    isSubmitting: false,
    nameAvailable: null,
    checkingName: false,
  });

  // Validate community name
  const validateName = useCallback((name: string): string | null => {
    if (!name) return 'Community name is required';
    if (name.length < 3) return 'Name must be at least 3 characters';
    if (name.length > 21) return 'Name must be 21 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return 'Name can only contain letters, numbers, and underscores';
    }
    if (/^[_]/.test(name) || /[_]$/.test(name)) {
      return 'Name cannot start or end with underscore';
    }
    return null;
  }, []);

  // Check name availability
  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name || validateName(name)) return;

    setState(prev => ({ ...prev, checkingName: true }));

    try {
      const response = await api.request(`/api/v1/communities/check-name?name=${encodeURIComponent(name)}`);
      setState(prev => ({
        ...prev,
        nameAvailable: response.success && response.data?.available,
        checkingName: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        nameAvailable: null,
        checkingName: false,
      }));
    }
  }, [validateName]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof CommunityFormData, value: any) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' },
    }));

    // Check name availability when name changes
    if (field === 'name' && typeof value === 'string') {
      const trimmedName = value.toLowerCase().trim();
      setState(prev => ({ 
        ...prev, 
        data: { ...prev.data, name: trimmedName },
        nameAvailable: null 
      }));
      
      // Debounce name check
      const timer = setTimeout(() => {
        checkNameAvailability(trimmedName);
      }, 500);

      return () => clearTimeout(timer);
    }

    // Auto-generate display name from name if empty
    if (field === 'name' && !state.data.displayName) {
      setState(prev => ({
        ...prev,
        data: { 
          ...prev.data, 
          name: typeof value === 'string' ? value.toLowerCase().trim() : value,
          displayName: typeof value === 'string' ? 
            value.charAt(0).toUpperCase() + value.slice(1) : value
        },
      }));
    }
  }, [state.data.displayName, checkNameAvailability]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    const nameError = validateName(state.data.name);
    if (nameError) errors.name = nameError;

    if (!state.data.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (state.data.displayName.length > 100) {
      errors.displayName = 'Display name must be 100 characters or less';
    }

    if (state.data.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    if (state.nameAvailable === false) {
      errors.name = 'This community name is already taken';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [state.data, state.nameAvailable, validateName]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await api.createCommunity({
        name: state.data.name,
        displayName: state.data.displayName,
        description: state.data.description,
        isPublic: state.data.isPublic,
        isNsfw: state.data.isNsfw,
      });

      if (response.success && response.data) {
        await onSubmit(response.data);
      } else {
        throw new Error(response.error || 'Failed to create community');
      }
    } catch (error) {
      console.error('Failed to create community:', error);
      setState(prev => ({
        ...prev,
        errors: { 
          general: error instanceof Error ? error.message : 'Failed to create community' 
        },
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.data, validateForm, onSubmit]);

  const nameError = state.errors.name;
  const nameValid = !nameError && state.nameAvailable === true && state.data.name;

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create a Community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error display */}
          {state.errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {state.errors.general}
              </div>
            </div>
          )}

          {/* Community Name */}
          <div>
            <Label htmlFor="name">Community Name *</Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                r/
              </div>
              <Input
                id="name"
                value={state.data.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="mycommunity"
                className={cn(
                  "pl-8",
                  nameError && "border-red-500",
                  nameValid && "border-green-500"
                )}
                maxLength={21}
              />
              {state.checkingName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
                </div>
              )}
              {nameValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-1">
              {nameError ? (
                <p className="text-sm text-red-600">{nameError}</p>
              ) : state.nameAvailable === true ? (
                <p className="text-sm text-green-600">✓ Available</p>
              ) : state.nameAvailable === false ? (
                <p className="text-sm text-red-600">✗ Not available</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Letters, numbers, and underscores only
                </p>
              )}
              
              <span className={cn(
                "text-xs",
                state.data.name.length > 18 ? "text-red-500" : "text-gray-500"
              )}>
                {state.data.name.length}/21
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={state.data.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              placeholder="My Community"
              className={cn(state.errors.displayName && "border-red-500")}
              maxLength={100}
            />
            <div className="flex justify-between items-center mt-1">
              {state.errors.displayName && (
                <p className="text-sm text-red-600">{state.errors.displayName}</p>
              )}
              <span className={cn(
                "text-xs ml-auto",
                state.data.displayName.length > 90 ? "text-red-500" : "text-gray-500"
              )}>
                {state.data.displayName.length}/100
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={state.data.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="What is your community about?"
              className={cn("min-h-[80px]", state.errors.description && "border-red-500")}
              maxLength={500}
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              {state.errors.description && (
                <p className="text-sm text-red-600">{state.errors.description}</p>
              )}
              <span className={cn(
                "text-xs ml-auto",
                state.data.description.length > 450 ? "text-red-500" : "text-gray-500"
              )}>
                {state.data.description.length}/500
              </span>
            </div>
          </div>

          {/* Community Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Community Settings</h3>
            
            {/* Public/Private */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {state.data.isPublic ? (
                  <Globe className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <div className="font-medium">
                    {state.data.isPublic ? 'Public' : 'Private'} Community
                  </div>
                  <div className="text-sm text-gray-600">
                    {state.data.isPublic 
                      ? 'Anyone can view and participate'
                      : 'Only approved members can participate'
                    }
                  </div>
                </div>
              </div>
              <Switch
                checked={state.data.isPublic}
                onCheckedChange={(isPublic) => handleFieldChange('isPublic', isPublic)}
              />
            </div>

            {/* NSFW */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {state.data.isNsfw ? (
                  <EyeOff className="h-5 w-5 text-red-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <div className="font-medium">
                    NSFW Content {state.data.isNsfw && <Badge variant="destructive">18+</Badge>}
                  </div>
                  <div className="text-sm text-gray-600">
                    Community contains mature content not suitable for work
                  </div>
                </div>
              </div>
              <Switch
                checked={state.data.isNsfw}
                onCheckedChange={(isNsfw) => handleFieldChange('isNsfw', isNsfw)}
              />
            </div>
          </div>

          {/* Preview */}
          {(state.data.name || state.data.displayName) && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {state.data.displayName.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="font-medium">
                    r/{state.data.name || 'communityname'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {state.data.displayName || 'Community Display Name'}
                  </div>
                  {state.data.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {state.data.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={state.data.isPublic ? 'default' : 'secondary'} className="text-xs">
                      {state.data.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    {state.data.isNsfw && (
                      <Badge variant="destructive" className="text-xs">NSFW</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={state.isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={
                state.isSubmitting || 
                !state.data.name.trim() || 
                !state.data.displayName.trim() ||
                state.nameAvailable === false ||
                state.checkingName
              }
              className="min-w-[140px]"
            >
              {state.isSubmitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}