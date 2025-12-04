/**
 * useMediaUpload Hook
 * Handle file uploads with progress tracking
 */

import { useState, useCallback } from 'react';
import { api } from '../lib/apiClient';
import { environment } from '../config/environment';
import { toast } from '../stores/uiStore';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  url: string | null;
}

export const useMediaUpload = () => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    url: null,
  });

  const upload = useCallback(async (file: File): Promise<string | null> => {
    // Validate file size
    if (file.size > environment.MAX_FILE_SIZE) {
      const error = 'File is too large';
      setState((prev) => ({ ...prev, error }));
      toast.error(error);
      return null;
    }

    // Validate file type
    const fileType = file.type;
    const isImage = environment.ALLOWED_IMAGE_TYPES.includes(fileType);
    const isVideo = environment.ALLOWED_VIDEO_TYPES.includes(fileType);
    const isAudio = environment.ALLOWED_AUDIO_TYPES.includes(fileType);

    if (!isImage && !isVideo && !isAudio) {
      const error = 'Invalid file type';
      setState((prev) => ({ ...prev, error }));
      toast.error(error);
      return null;
    }

    setState({
      isUploading: true,
      progress: 0,
      error: null,
      url: null,
    });

    try {
      const response = await api.upload<{ url: string }>(
        '/upload',
        file,
        (progress) => {
          setState((prev) => ({ ...prev, progress }));
        }
      );

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        url: response.url,
      });

      return response.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        url: null,
      });
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      url: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
};

export default useMediaUpload;
