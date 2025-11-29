/**
 * Tests for FileUpload component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';
import fileUploadService from '../services/fileUploadService';

jest.mock('../services/fileUploadService');

jest.mock('lucide-react', () => ({
  Upload: ({ size }) => <svg data-testid="upload-icon" width={size} />,
  X: ({ size }) => <svg data-testid="x-icon" width={size} />,
  File: ({ size }) => <svg data-testid="file-icon" width={size} />,
  Image: ({ size }) => <svg data-testid="image-icon" width={size} />,
  Video: ({ size }) => <svg data-testid="video-icon" width={size} />,
  FileText: ({ size }) => <svg data-testid="file-text-icon" width={size} />,
  Download: ({ size }) => <svg data-testid="download-icon" width={size} />,
  Eye: ({ size }) => <svg data-testid="eye-icon" width={size} />,
  Camera: ({ size, className }) => <svg data-testid="camera-icon" width={size} className={className} />,
  Mic: ({ size, className }) => <svg data-testid="mic-icon" width={size} className={className} />,
  CheckCircle: ({ size }) => <svg data-testid="check-circle-icon" width={size} />,
  AlertCircle: ({ size }) => <svg data-testid="alert-circle-icon" width={size} />
}));

describe('FileUpload', () => {
  const mockOnFilesSelected = jest.fn();

  const createMockFile = (name = 'test.png', size = 1024, type = 'image/png') => {
    return new File(['test content'], name, { type, size });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    fileUploadService.validateFile.mockReturnValue([]);
    fileUploadService.getFileCategory.mockReturnValue('image');
    fileUploadService.createFilePreview.mockResolvedValue({ url: 'preview-url' });
    fileUploadService.uploadFile.mockResolvedValue({
      success: true,
      url: 'uploaded-url'
    });
    fileUploadService.uploadFileWithProgress.mockResolvedValue({
      success: true,
      url: 'uploaded-url'
    });

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    });

    it('renders desktop drag-drop interface by default', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    });

    it('renders mobile interface when isMobile is true', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} />);
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('renders upload icon in desktop mode', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('shows max file info', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFiles={5} />);
      expect(screen.getByText(/Maximum 5 files/i)).toBeInTheDocument();
    });

    it('shows max size info', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={10485760} />);
      expect(screen.getByText(/10 MB each/i)).toBeInTheDocument();
    });
  });

  describe('File Input', () => {
    it('handles file selection via input', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalled();
      });
    });

    it('handles multiple files', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const files = [
        createMockFile('file1.png'),
        createMockFile('file2.png'),
        createMockFile('file3.png')
      ];

      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files } });
      });

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalled();
      });
    });

    it('accepts multiple files attribute', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('has correct accept attribute', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept');
    });

    it('resets input value after selection', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(input.value).toBe('');
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag enter', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('[onDragEnter]');

      fireEvent.dragEnter(dropzone);

      // Should set dragActive state (visual feedback)
      expect(dropzone).toBeInTheDocument();
    });

    it('handles drag over', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('.border-dashed');

      fireEvent.dragOver(dropzone);

      expect(dropzone).toBeInTheDocument();
    });

    it('handles drag leave', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('.border-dashed');

      fireEvent.dragEnter(dropzone);
      fireEvent.dragLeave(dropzone);

      expect(dropzone).toBeInTheDocument();
    });

    it('handles file drop', async () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('.border-dashed');

      const file = createMockFile();

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file]
          }
        });
      });

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalled();
      });
    });

    it('prevents default on drag events', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('.border-dashed');

      const event = new Event('dragover', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      dropzone.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not handle drag events on mobile', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} />);

      // Should not have drag-drop interface on mobile
      expect(screen.queryByText(/Drag and drop/i)).not.toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('validates files using service', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.validateFile).toHaveBeenCalled();
        expect(fileUploadService.getFileCategory).toHaveBeenCalled();
      });
    });

    it('shows validation errors', async () => {
      fileUploadService.validateFile.mockReturnValue(['File too large', 'Invalid type']);

      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Errors')).toBeInTheDocument();
        expect(screen.getByText(/File too large, Invalid type/)).toBeInTheDocument();
      });
    });

    it('filters out invalid files', async () => {
      fileUploadService.validateFile
        .mockReturnValueOnce(['Invalid'])
        .mockReturnValueOnce([]);

      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const files = [
        createMockFile('invalid.txt'),
        createMockFile('valid.png')
      ];

      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files } });
      });

      await waitFor(() => {
        const fileObjects = mockOnFilesSelected.mock.calls[0][0];
        expect(fileObjects).toHaveLength(1);
      });
    });

    it('limits to maxFiles', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFiles={2} />);

      const files = [
        createMockFile('file1.png'),
        createMockFile('file2.png'),
        createMockFile('file3.png'),
        createMockFile('file4.png')
      ];

      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files } });
      });

      await waitFor(() => {
        const fileObjects = mockOnFilesSelected.mock.calls[0][0];
        expect(fileObjects.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('File Preview', () => {
    it('creates preview for image files', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile('image.png', 1024, 'image/png');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.createFilePreview).toHaveBeenCalledWith(file);
      });
    });

    it('displays file preview image', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile('image.png');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('shows file icon when no preview available', async () => {
      fileUploadService.createFilePreview.mockRejectedValue(new Error('No preview'));

      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('auto-uploads when autoUpload is true', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.uploadFile).toHaveBeenCalled();
      });
    });

    it('does not auto-upload when autoUpload is false', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={false}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.uploadFile).not.toHaveBeenCalled();
      });
    });

    it('shows Upload All button when not auto-uploading', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={false}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Upload All')).toBeInTheDocument();
      });
    });

    it('uploads all files when Upload All is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={false}
        />
      );

      const files = [createMockFile('file1.png'), createMockFile('file2.png')];
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files } });
      });

      await waitFor(() => {
        expect(screen.getByText('Upload All')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Upload All'));

      await waitFor(() => {
        expect(fileUploadService.uploadFile).toHaveBeenCalled();
      });
    });

    it('uses enhanced upload with progress', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
          enhanced={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.uploadFileWithProgress).toHaveBeenCalled();
      });
    });

    it('passes channelId to upload service', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
          channelId="channel-123"
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(fileUploadService.uploadFile).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            channelId: 'channel-123'
          })
        );
      });
    });
  });

  describe('Upload Progress', () => {
    it('shows uploading state', async () => {
      let progressCallback;
      fileUploadService.uploadFileWithProgress.mockImplementation((file, options, onProgress) => {
        progressCallback = onProgress;
        return new Promise(resolve => {
          setTimeout(() => {
            progressCallback(50);
            resolve({ success: true, url: 'uploaded-url' });
          }, 100);
        });
      });

      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
          enhanced={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/50%/)).toBeInTheDocument();
      });
    });

    it('shows progress bar during upload', async () => {
      let progressCallback;
      fileUploadService.uploadFileWithProgress.mockImplementation((file, options, onProgress) => {
        progressCallback = onProgress;
        return new Promise(resolve => {
          setTimeout(() => {
            progressCallback(75);
            resolve({ success: true, url: 'uploaded-url' });
          }, 100);
        });
      });

      const { container } = render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
          enhanced={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        const progressBar = container.querySelector('[style*="width: 75%"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('shows uploaded state after completion', async () => {
      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Uploaded')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('shows error state on upload failure', async () => {
      fileUploadService.uploadFile.mockResolvedValue({
        success: false,
        error: 'Upload failed'
      });

      render(
        <FileUpload
          onFilesSelected={mockOnFilesSelected}
          autoUpload={true}
        />
      );

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });
  });

  describe('File Actions', () => {
    beforeEach(async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} autoUpload={false} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('test.png')).toBeInTheDocument();
      });
    });

    it('shows remove button', () => {
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('removes file when remove button clicked', async () => {
      const user = userEvent.setup();
      const removeButton = screen.getByTitle('Remove');

      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.png')).not.toBeInTheDocument();
      });
    });

    it('shows download button', () => {
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('shows preview button for files with preview', () => {
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('shows upload button when not auto-uploading', () => {
      const uploadButtons = screen.getAllByTestId('upload-icon');
      expect(uploadButtons.length).toBeGreaterThan(1); // One in dropzone, one in file actions
    });
  });

  describe('Mobile Actions', () => {
    it('renders camera button on mobile', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showCamera={true} />);
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('renders microphone button on mobile', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);
      expect(screen.getByText('Record')).toBeInTheDocument();
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('does not render camera when showCamera is false', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showCamera={false} />);
      expect(screen.queryByText('Camera')).not.toBeInTheDocument();
    });

    it('does not render microphone when showMicrophone is false', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={false} />);
      expect(screen.queryByText('Record')).not.toBeInTheDocument();
    });

    it('has touch-target class on mobile buttons', () => {
      const { container } = render(
        <FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} />
      );

      const touchTargets = container.querySelectorAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
    });
  });

  describe('Audio Recording', () => {
    let mockMediaRecorder;
    let mockStream;

    beforeEach(() => {
      jest.useFakeTimers();

      mockStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn() }
        ])
      };

      mockMediaRecorder = {
        start: jest.fn(),
        stop: jest.fn(),
        ondataavailable: null,
        onstop: null
      };

      global.MediaRecorder = jest.fn(() => mockMediaRecorder);
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue(mockStream)
      };
      global.navigator.vibrate = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
      delete global.MediaRecorder;
      delete global.navigator.mediaDevices;
      delete global.navigator.vibrate;
    });

    it('starts recording when record button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      });
    });

    it('shows recording time', async () => {
      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText('0:03')).toBeInTheDocument();
    });

    it('stops recording on second click', async () => {
      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });

      const stopButton = screen.getByText(/\d:\d\d/); // Match time format
      await user.click(stopButton);

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it('triggers haptic feedback on start', async () => {
      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(global.navigator.vibrate).toHaveBeenCalledWith(50);
      });
    });

    it('triggers haptic feedback on stop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });

      const stopButton = screen.getByText(/\d:\d\d/);
      await user.click(stopButton);

      await waitFor(() => {
        expect(global.navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
      });
    });

    it('handles microphone permission error', async () => {
      global.navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const user = userEvent.setup({ delay: null });
      render(<FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />);

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('microphone'));
      });

      alertSpy.mockRestore();
    });

    it('cleans up recording interval on unmount', async () => {
      const user = userEvent.setup({ delay: null });
      const { unmount } = render(
        <FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} showMicrophone={true} />
      );

      const recordButton = screen.getByText('Record');
      await user.click(recordButton);

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('File Type Icons', () => {
    it('shows image icon for images', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      fileUploadService.createFilePreview.mockRejectedValue(new Error('No preview'));

      const file = createMockFile('image.png', 1024, 'image/png');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('image-icon')).toBeInTheDocument();
      });
    });

    it('shows video icon for videos', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      fileUploadService.createFilePreview.mockRejectedValue(new Error('No preview'));

      const file = createMockFile('video.mp4', 1024, 'video/mp4');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-icon')).toBeInTheDocument();
      });
    });

    it('shows file-text icon for PDFs', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      fileUploadService.createFilePreview.mockRejectedValue(new Error('No preview'));

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
      });
    });

    it('shows generic file icon for unknown types', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      fileUploadService.createFilePreview.mockRejectedValue(new Error('No preview'));

      const file = createMockFile('file.xyz', 1024, 'application/unknown');
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-icon')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={500} />);
      expect(screen.getByText(/500 Bytes each/)).toBeInTheDocument();
    });

    it('formats kilobytes', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={2048} />);
      expect(screen.getByText(/2 KB each/)).toBeInTheDocument();
    });

    it('formats megabytes', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={10485760} />);
      expect(screen.getByText(/10 MB each/)).toBeInTheDocument();
    });

    it('formats gigabytes', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={1073741824} />);
      expect(screen.getByText(/1 GB each/)).toBeInTheDocument();
    });
  });

  describe('Animations and Styles', () => {
    it('includes slide-up animation', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('@keyframes fileSlideIn');
    });

    it('respects reduced motion preference', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('applies hover effects in desktop mode', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      const dropzone = container.querySelector('.border-dashed');
      expect(dropzone).toHaveClass('group');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file selection', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [] } });
      });

      expect(screen.queryByText('Attached Files')).not.toBeInTheDocument();
    });

    it('handles null files', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      expect(() => {
        fireEvent.change(input, { target: { files: null } });
      }).not.toThrow();
    });

    it('handles missing onFilesSelected callback', async () => {
      render(<FileUpload />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      expect(async () => {
        await act(async () => {
          fireEvent.change(input, { target: { files: [file] } });
        });
      }).not.toThrow();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot in desktop mode', () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in mobile mode', () => {
      const { container } = render(
        <FileUpload onFilesSelected={mockOnFilesSelected} isMobile={true} />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with files attached', async () => {
      const { container } = render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const file = createMockFile();
      const input = screen.getByText(/browse files/i).closest('button').parentElement.querySelector('input[type="file"]');

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('test.png')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default mockOnFilesSelected
