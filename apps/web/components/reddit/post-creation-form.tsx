'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Type,
  Link2,
  Image,
  BarChart3,
  Send,
  Save,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Hash,
  Clock,
  Plus,
  Minus,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { PostType, PostFormData, PostFormState, PostFormErrors, Community } from './post-types';
import { RedditErrorBoundary, useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

interface PostCreationFormProps {
  onSubmit: (postData: PostFormData) => Promise<void>;
  onCancel: () => void;
  onSaveDraft?: (postData: PostFormData) => Promise<void>;
  initialData?: Partial<PostFormData>;
  communities?: Community[];
  className?: string;
}

const POST_TYPES = [
  { id: 'text', label: 'Text', icon: Type, description: 'Share your thoughts and ideas' },
  { id: 'link', label: 'Link', icon: Link2, description: 'Share a link to an article, video, or website' },
  { id: 'image', label: 'Image', icon: Image, description: 'Upload and share an image' },
  { id: 'poll', label: 'Poll', icon: BarChart3, description: 'Create a poll for the community' },
] as const;

const POLL_DURATIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
];

export function PostCreationForm({
  onSubmit,
  onCancel,
  onSaveDraft,
  initialData,
  communities = [],
  className,
}: PostCreationFormProps) {
  const { reportError } = useRedditErrorReporting('post-creation');
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<PostFormState>({
    data: {
      title: '',
      content: '',
      type: 'text' as PostType,
      communityId: '',
      flair: '',
      nsfw: false,
      url: '',
      pollOptions: ['', ''],
      pollDuration: 7,
      ...initialData,
    },
    errors: {},
    isSubmitting: false,
    isDraft: false,
    lastSaved: undefined,
  });

  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-save draft functionality
  useEffect(() => {
    if (!onSaveDraft) return;

    const timer = setTimeout(() => {
      if (state.data.title || state.data.content) {
        handleSaveDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [state.data, onSaveDraft]);

  // Focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Validate form data
  const validateForm = useCallback((): PostFormErrors => {
    const errors: PostFormErrors = {};

    if (!state.data.title.trim()) {
      errors.title = 'Title is required';
    } else if (state.data.title.length > 300) {
      errors.title = 'Title must be less than 300 characters';
    }

    if (!state.data.communityId) {
      errors.communityId = 'Please select a community';
    }

    if (state.data.type === 'text') {
      if (!state.data.content.trim()) {
        errors.content = 'Content is required for text posts';
      } else if (state.data.content.length > 40000) {
        errors.content = 'Content must be less than 40,000 characters';
      }
    }

    if (state.data.type === 'link') {
      if (!state.data.url?.trim()) {
        errors.url = 'URL is required for link posts';
      } else {
        try {
          new URL(state.data.url);
        } catch {
          errors.url = 'Please enter a valid URL';
        }
      }
    }

    if (state.data.type === 'poll') {
      const validOptions = state.data.pollOptions?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        errors.pollOptions = 'At least 2 poll options are required';
      } else if (validOptions.length > 6) {
        errors.pollOptions = 'Maximum 6 poll options allowed';
      }
    }

    return errors;
  }, [state.data]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof PostFormData, value: any) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: undefined },
    }));

    // Auto-fetch link preview for URLs
    if (field === 'url' && value && state.data.type === 'link') {
      fetchLinkPreview(value);
    }
  }, [state.data.type]);

  // Fetch link preview
  const fetchLinkPreview = useCallback(async (url: string) => {
    if (!url) {
      setLinkPreview(null);
      return;
    }

    try {
      const urlObj = new URL(url);
      setIsPreviewLoading(true);
      
      // Simple preview generation (in production, use a proper service)
      setLinkPreview({
        title: `Preview for ${urlObj.hostname}`,
        description: `Link to ${url}`,
        image: null,
        url: url,
      });
    } catch (error) {
      setLinkPreview(null);
      console.error('Failed to fetch link preview:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  // Handle poll options
  const updatePollOption = useCallback((index: number, value: string) => {
    const newOptions = [...(state.data.pollOptions || [])];
    newOptions[index] = value;
    handleFieldChange('pollOptions', newOptions);
  }, [state.data.pollOptions, handleFieldChange]);

  const addPollOption = useCallback(() => {
    const newOptions = [...(state.data.pollOptions || []), ''];
    if (newOptions.length <= 6) {
      handleFieldChange('pollOptions', newOptions);
    }
  }, [state.data.pollOptions, handleFieldChange]);

  const removePollOption = useCallback((index: number) => {
    const newOptions = state.data.pollOptions?.filter((_, i) => i !== index) || [];
    if (newOptions.length >= 2) {
      handleFieldChange('pollOptions', newOptions);
    }
  }, [state.data.pollOptions, handleFieldChange]);

  // Handle file upload for images
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, general: 'Please select an image file' },
      }));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, general: 'Image must be less than 10MB' },
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const response = await api.request('/api/v1/uploads', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set multipart headers
      });

      if (response.success && response.data?.url) {
        handleFieldChange('url', response.data.url);
        setState(prev => ({ 
          ...prev, 
          errors: { ...prev.errors, general: undefined } 
        }));
      } else {
        throw new Error(response.error || 'Failed to upload image');
      }
    } catch (error) {
      reportError(error as Error, { action: 'image-upload', fileName: file.name });
      setState(prev => ({
        ...prev,
        errors: { 
          ...prev.errors, 
          general: error instanceof Error ? error.message : 'Failed to upload image' 
        },
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [handleFieldChange, reportError]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    if (!onSaveDraft) return;

    try {
      setState(prev => ({ ...prev, isDraft: true }));
      await onSaveDraft(state.data);
      setState(prev => ({ 
        ...prev, 
        isDraft: false,
        lastSaved: new Date(),
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isDraft: false }));
      reportError(error as Error, { action: 'save-draft' });
    }
  }, [state.data, onSaveDraft, reportError]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    setState(prev => ({ ...prev, errors }));

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true }));
      await onSubmit(state.data);
    } catch (error) {
      reportError(error as Error, { action: 'submit-post', postType: state.data.type });
      setState(prev => ({
        ...prev,
        errors: { 
          general: error instanceof Error ? error.message : 'Failed to create post' 
        },
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.data, validateForm, onSubmit, reportError]);

  // Character counts
  const titleCount = state.data.title.length;
  const contentCount = state.data.content.length;

  return (
    <RedditErrorBoundary context="post-creation">
      <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create a post</h1>
          <div className="flex items-center gap-2">
            {state.lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {state.lastSaved.toLocaleTimeString()}
              </span>
            )}
            {onSaveDraft && (
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={state.isDraft || state.isSubmitting}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {state.isDraft ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
          </div>
        </div>

        {/* Error display */}
        {state.errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {state.errors.general}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Community Selection */}
            <div>
              <Label htmlFor="community">Choose a community *</Label>
              <Select 
                value={state.data.communityId} 
                onValueChange={(value) => handleFieldChange('communityId', value)}
              >
                <SelectTrigger className={cn(state.errors.communityId && "border-red-500")}>
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map(community => (
                    <SelectItem key={community.id} value={community.id}>
                      <div className="flex items-center gap-2">
                        {community.icon && (
                          <img 
                            src={community.icon} 
                            alt={community.name}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span>r/{community.name}</span>
                        <span className="text-gray-500">• {community.memberCount} members</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors.communityId && (
                <p className="text-sm text-red-600 mt-1">{state.errors.communityId}</p>
              )}
            </div>

            {/* Post Type Selection */}
            <div>
              <Label>Post Type</Label>
              <Tabs 
                value={state.data.type} 
                onValueChange={(value) => handleFieldChange('type', value as PostType)}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-4">
                  {POST_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Title - Common to all types */}
                <div className="mt-6">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    ref={titleRef}
                    id="title"
                    value={state.data.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="An interesting title"
                    className={cn(state.errors.title && "border-red-500")}
                    maxLength={300}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {state.errors.title && (
                      <p className="text-sm text-red-600">{state.errors.title}</p>
                    )}
                    <span className={cn(
                      "text-xs ml-auto",
                      titleCount > 250 ? "text-red-500" : "text-gray-500"
                    )}>
                      {titleCount}/300
                    </span>
                  </div>
                </div>

                {/* Text Post Content */}
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="content">Text (optional)</Label>
                    <Textarea
                      id="content"
                      value={state.data.content}
                      onChange={(e) => handleFieldChange('content', e.target.value)}
                      placeholder="Text (optional)"
                      className={cn("min-h-[200px]", state.errors.content && "border-red-500")}
                      maxLength={40000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {state.errors.content && (
                        <p className="text-sm text-red-600">{state.errors.content}</p>
                      )}
                      <span className={cn(
                        "text-xs ml-auto",
                        contentCount > 35000 ? "text-red-500" : "text-gray-500"
                      )}>
                        {contentCount}/40,000
                      </span>
                    </div>
                  </div>
                </TabsContent>

                {/* Link Post Content */}
                <TabsContent value="link" className="space-y-4">
                  <div>
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={state.data.url || ''}
                      onChange={(e) => handleFieldChange('url', e.target.value)}
                      placeholder="https://example.com"
                      className={cn(state.errors.url && "border-red-500")}
                    />
                    {state.errors.url && (
                      <p className="text-sm text-red-600 mt-1">{state.errors.url}</p>
                    )}
                    
                    {/* Link Preview */}
                    {isPreviewLoading && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="animate-pulse">Loading preview...</div>
                      </div>
                    )}
                    
                    {linkPreview && (
                      <div className="mt-2 p-3 border rounded-lg">
                        <h4 className="font-medium">{linkPreview.title}</h4>
                        <p className="text-sm text-gray-600">{linkPreview.description}</p>
                        {linkPreview.image && (
                          <img 
                            src={linkPreview.image} 
                            alt="Preview" 
                            className="mt-2 max-w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Image Post Content */}
                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label>Upload Image *</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {state.data.url ? (
                        <div className="space-y-2">
                          <img 
                            src={state.data.url} 
                            alt="Uploaded" 
                            className="max-w-full h-48 object-cover rounded mx-auto"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={state.isSubmitting}
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          <div>
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={state.isSubmitting}
                            >
                              Choose Image
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Poll Post Content */}
                <TabsContent value="poll" className="space-y-4">
                  <div>
                    <Label>Poll Options *</Label>
                    <div className="space-y-2 mt-2">
                      {state.data.pollOptions?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 min-w-[20px]">{index + 1}.</span>
                          <Input
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          {state.data.pollOptions && state.data.pollOptions.length > 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePollOption(index)}
                              className="p-2"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {state.data.pollOptions && state.data.pollOptions.length < 6 && (
                        <Button
                          variant="outline"
                          onClick={addPollOption}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>
                    
                    {state.errors.pollOptions && (
                      <p className="text-sm text-red-600">{state.errors.pollOptions}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pollDuration">Poll Duration</Label>
                    <Select 
                      value={state.data.pollDuration?.toString()} 
                      onValueChange={(value) => handleFieldChange('pollDuration', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLL_DURATIONS.map(duration => (
                          <SelectItem key={duration.value} value={duration.value.toString()}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {duration.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Post Options */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Post Options</h3>
              
              {/* NSFW Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nsfw">Mark as NSFW</Label>
                  <p className="text-sm text-gray-500">Not Safe For Work</p>
                </div>
                <Switch
                  id="nsfw"
                  checked={state.data.nsfw}
                  onCheckedChange={(checked) => handleFieldChange('nsfw', checked)}
                />
              </div>

              {/* Flair Selection */}
              <div>
                <Label htmlFor="flair">Flair (optional)</Label>
                <Input
                  id="flair"
                  value={state.data.flair || ''}
                  onChange={(e) => handleFieldChange('flair', e.target.value)}
                  placeholder="Add a flair to categorize your post"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Preview Toggle */}
            {(state.data.title || state.data.content) && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>

                {showPreview && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-2">Post Preview</h3>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{state.data.title}</h4>
                      {state.data.flair && (
                        <Badge variant="secondary">{state.data.flair}</Badge>
                      )}
                      {state.data.nsfw && (
                        <Badge variant="destructive">NSFW</Badge>
                      )}
                      {state.data.content && (
                        <p className="text-gray-700 whitespace-pre-wrap">{state.data.content}</p>
                      )}
                    </div>
                  </div>
                )}
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
                disabled={state.isSubmitting || !state.data.title.trim() || !state.data.communityId}
                className="min-w-[120px]"
              >
                {state.isSubmitting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RedditErrorBoundary>
  );
}