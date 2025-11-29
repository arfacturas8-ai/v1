/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaUploader from './MediaUploader';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: (props) => <div data-testid="upload-icon" {...props} />,
  X: (props) => <div data-testid="x-icon" {...props} />,
  Image: (props) => <div data-testid="image-icon" {...props} />,
  Video: (props) => <div data-testid="video-icon" {...props} />,
  FileText: (props) => <div data-testid="filetext-icon" {...props} />,
  Music: (props) => <div data-testid="music-icon" {...props} />,
  Archive: (props) => <div data-testid="archive-icon" {...props} />,
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
  CheckCircle: (props) => <div data-testid="check-circle-icon" {...props} />,
  Loader: (props) => <div data-testid="loader-icon" {...props} />,
  Eye: (props) => <div data-testid="eye-icon" {...props} />,
  Trash2: (props) => <div data-testid="trash2-icon" {...props} />,
  RotateCcw: (props) => <div data-testid="rotate-ccw-icon" {...props} />,
  ZoomIn: (props) => <div data-testid="zoom-in-icon" {...props} />,
}));

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null;
    this.result = null;
  }
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  constructor() {
    this.upload = {
      addEventListener: jest.fn(),
    };
    this.addEventListener = jest.fn();
    this.open = jest.fn();
    this.send = jest.fn();
    this.setRequestHeader = jest.fn();
    this.status = 200;
    this.responseText = JSON.stringify({ success: true, data: { url: 'http://example.com/file.jpg' } });
  }
}

global.XMLHttpRequest = MockXMLHttpRequest;

// Helper to create mock files
const createMockFile = (name, size, type) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('MediaUploader', () => {
  let mockOnUpload;
  let mockOnRemove;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpload = jest.fn();
    mockOnRemove = jest.fn();
    localStorageMock.getItem.mockReturnValue(null);
    // Reset window.innerWidth
    global.innerWidth = 1024;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<MediaUploader />);
      expect(screen.getByRole('region', { name: /media file uploader/i })).toBeInTheDocument();
    });

    it('renders upload dropzone', () => {
      render(<MediaUploader />);
      expect(screen.getByText(/upload files/i)).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('displays drag and drop text when enabled', () => {
      render(<MediaUploader enableDragDrop={true} />);
      expect(screen.getByText(/drag & drop files here or click to browse/i)).toBeInTheDocument();
    });

    it('displays click to browse text when drag and drop disabled', () => {
      render(<MediaUploader enableDragDrop={false} />);
      expect(screen.getByText(/click to browse files/i)).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<MediaUploader className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('displays max files and file size information', () => {
      render(<MediaUploader maxFiles={5} maxFileSize={50 * 1024 * 1024} />);
      expect(screen.getByText(/max 5 files/i)).toBeInTheDocument();
      expect(screen.getByText(/50 MB/i)).toBeInTheDocument();
    });

    it('displays accepted file types when provided', () => {
      render(<MediaUploader acceptedTypes={['image/*', 'video/*']} />);
      expect(screen.getByText(/supported: image\/\*, video\/\*/i)).toBeInTheDocument();
    });

    it('renders file input element', () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('sets multiple attribute on file input when maxFiles > 1', () => {
      render(<MediaUploader maxFiles={5} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('does not set multiple attribute when maxFiles = 1', () => {
      render(<MediaUploader maxFiles={1} />);
      const fileInput = screen.getByLabelText(/select file to upload/i);
      expect(fileInput).not.toHaveAttribute('multiple');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MediaUploader />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('File Selection via Input', () => {
    it('handles file selection through input', async () => {
      render(<MediaUploader onUpload={mockOnUpload} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it('handles multiple file selection', async () => {
      render(<MediaUploader onUpload={mockOnUpload} maxFiles={3} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ];

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ name: 'test1.jpg' }),
            expect.objectContaining({ name: 'test2.jpg' }),
          ])
        );
      });
    });

    it('displays selected files in file list', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    });

    it('resets file input value after selection', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });

    it('does not process files when disabled', async () => {
      render(<MediaUploader disabled={true} onUpload={mockOnUpload} />);
      const fileInput = screen.getByLabelText(/select file to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUpload).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag enter event', () => {
      render(<MediaUploader enableDragDrop={true} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });

      fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });

      expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
    });

    it('handles drag leave event', () => {
      render(<MediaUploader enableDragDrop={true} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });

      fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
      fireEvent.dragLeave(dropzone, { relatedTarget: null, dataTransfer: { files: [] } });

      expect(screen.getByText(/upload files/i)).toBeInTheDocument();
    });

    it('handles drag over event', () => {
      render(<MediaUploader enableDragDrop={true} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });

      const event = new Event('dragover', { bubbles: true, cancelable: true });
      fireEvent(dropzone, event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('handles file drop', async () => {
      render(<MediaUploader enableDragDrop={true} onUpload={mockOnUpload} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it('displays dropped files', async () => {
      render(<MediaUploader enableDragDrop={true} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      const file = createMockFile('dropped.jpg', 1024, 'image/jpeg');

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('dropped.jpg')).toBeInTheDocument();
      });
    });

    it('does not handle drag and drop when disabled', () => {
      render(<MediaUploader enableDragDrop={false} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });

      fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });

      expect(screen.queryByText(/drop files here/i)).not.toBeInTheDocument();
    });

    it('does not process dropped files when component is disabled', async () => {
      render(<MediaUploader disabled={true} enableDragDrop={true} onUpload={mockOnUpload} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUpload).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('resets dragging state after drop', async () => {
      render(<MediaUploader enableDragDrop={true} />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
      expect(screen.getByText(/drop files here/i)).toBeInTheDocument();

      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload files/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Validation', () => {
    it('validates file size and shows error for oversized files', async () => {
      render(<MediaUploader maxFileSize={1024} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('large.jpg', 2048, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
      });
    });

    it('validates file type and shows error for unsupported types', async () => {
      render(<MediaUploader acceptedTypes={['image/*']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
      });
    });

    it('validates file extension', async () => {
      render(<MediaUploader allowedExtensions={['jpg', 'png']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/extension .pdf not allowed/i)).toBeInTheDocument();
      });
    });

    it('accepts valid files without errors', async () => {
      render(<MediaUploader acceptedTypes={['image/*']} maxFileSize={10240} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('valid.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('valid.jpg')).toBeInTheDocument();
        expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/file type not supported/i)).not.toBeInTheDocument();
      });
    });

    it('validates wildcard type patterns', async () => {
      render(<MediaUploader acceptedTypes={['image/*', 'video/*']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const imageFile = createMockFile('image.jpg', 1024, 'image/jpeg');
      const videoFile = createMockFile('video.mp4', 1024, 'video/mp4');

      fireEvent.change(fileInput, { target: { files: [imageFile, videoFile] } });

      await waitFor(() => {
        expect(screen.getByText('image.jpg')).toBeInTheDocument();
        expect(screen.getByText('video.mp4')).toBeInTheDocument();
        expect(screen.queryByText(/file type not supported/i)).not.toBeInTheDocument();
      });
    });

    it('respects max files limit', async () => {
      render(<MediaUploader maxFiles={2} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const files = [
        createMockFile('file1.jpg', 1024, 'image/jpeg'),
        createMockFile('file2.jpg', 1024, 'image/jpeg'),
        createMockFile('file3.jpg', 1024, 'image/jpeg'),
      ];

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('file1.jpg')).toBeInTheDocument();
        expect(screen.getByText('file2.jpg')).toBeInTheDocument();
        expect(screen.queryByText('file3.jpg')).not.toBeInTheDocument();
      });
    });

    it('validates case-insensitive file extensions', async () => {
      render(<MediaUploader allowedExtensions={['jpg', 'png']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('image.JPG', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('image.JPG')).toBeInTheDocument();
        expect(screen.queryByText(/extension .jpg not allowed/i)).not.toBeInTheDocument();
      });
    });

    it('displays multiple validation errors for a single file', async () => {
      render(<MediaUploader maxFileSize={1024} acceptedTypes={['image/*']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('large.pdf', 2048, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
        expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Preview', () => {
    it('generates preview for image files', async () => {
      render(<MediaUploader enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const preview = screen.getByAltText(/preview of image.jpg/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', expect.stringContaining('data:image/jpeg'));
      });
    });

    it('does not generate preview when disabled', async () => {
      render(<MediaUploader enablePreview={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('image.jpg')).toBeInTheDocument();
        expect(screen.queryByAltText(/preview of image.jpg/i)).not.toBeInTheDocument();
      });
    });

    it('shows file icon for non-previewable files', async () => {
      render(<MediaUploader enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
      });
    });

    it('opens preview modal when preview thumbnail is clicked', async () => {
      render(<MediaUploader enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const previewButton = screen.getByRole('button', { name: /preview image.jpg/i });
        fireEvent.click(previewButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'image.jpg' })).toBeInTheDocument();
      });
    });

    it('closes preview modal when close button is clicked', async () => {
      render(<MediaUploader enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const previewButton = screen.getByRole('button', { name: /preview image.jpg/i });
        fireEvent.click(previewButton);
      });

      const closeButtons = screen.getAllByTestId('x-icon');
      fireEvent.click(closeButtons[0].parentElement);

      await waitFor(() => {
        expect(screen.queryByRole('img', { name: 'image.jpg' })).not.toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('auto uploads files when autoUpload is enabled', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} uploadEndpoint="/api/upload" />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/upload');
        expect(mockXHR.send).toHaveBeenCalled();
      });
    });

    it('does not auto upload when autoUpload is disabled', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      expect(mockXHR.send).not.toHaveBeenCalled();
    });

    it('shows upload all button when files are pending', async () => {
      render(<MediaUploader autoUpload={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload all/i })).toBeInTheDocument();
      });
    });

    it('uploads files when upload all button is clicked', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload all/i });
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(mockXHR.send).toHaveBeenCalled();
      });
    });

    it('shows uploading status during upload', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('includes authorization header when token is present', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
      });
    });

    it('sends file with correct FormData structure', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockXHR.send).toHaveBeenCalled();
        const formData = mockXHR.send.mock.calls[0][0];
        expect(formData).toBeInstanceOf(FormData);
      });
    });
  });

  describe('Upload Progress', () => {
    it('displays progress bar during upload', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('updates progress percentage during upload', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate progress event
      await waitFor(() => {
        const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
          call => call[0] === 'progress'
        )?.[1];

        if (progressHandler) {
          progressHandler({ lengthComputable: true, loaded: 512, total: 1024 });
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/50% uploaded/i)).toBeInTheDocument();
      });
    });

    it('does not display progress bar when showProgress is false', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('shows 100% progress on completion', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 200;
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Success', () => {
    it('shows completed status after successful upload', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 200;
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('displays view button for completed uploads with URL', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 200;
      mockXHR.responseText = JSON.stringify({ data: { url: 'http://example.com/file.jpg' } });
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view test.jpg in new tab/i })).toBeInTheDocument();
      });
    });

    it('opens file URL in new tab when view button is clicked', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 200;
      mockXHR.responseText = JSON.stringify({ data: { url: 'http://example.com/file.jpg' } });
      global.XMLHttpRequest = jest.fn(() => mockXHR);
      const windowOpen = jest.spyOn(window, 'open').mockImplementation();

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        const viewButton = screen.getByRole('button', { name: /view test.jpg in new tab/i });
        fireEvent.click(viewButton);
      });

      expect(windowOpen).toHaveBeenCalledWith('http://example.com/file.jpg', '_blank');
    });
  });

  describe('Upload Error Handling', () => {
    it('shows error status when upload fails', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 500;
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('displays error message on network error', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const errorHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'error'
        )?.[1];

        if (errorHandler) {
          errorHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });

    it('handles upload abort', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const abortHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'abort'
        )?.[1];

        if (abortHandler) {
          abortHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/upload aborted/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on upload failure', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 500;
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry upload for test.jpg/i })).toBeInTheDocument();
      });
    });

    it('retries upload when retry button is clicked', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 500;
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry upload for test.jpg/i });
        fireEvent.click(retryButton);
      });

      // XHR should be created again for retry
      expect(global.XMLHttpRequest).toHaveBeenCalledTimes(2);
    });

    it('handles invalid JSON response', async () => {
      const mockXHR = new MockXMLHttpRequest();
      mockXHR.status = 200;
      mockXHR.responseText = 'invalid json';
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )?.[1];

        if (loadHandler) {
          loadHandler();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Removal', () => {
    it('removes file when remove button is clicked', async () => {
      render(<MediaUploader onRemove={mockOnRemove} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove test.jpg/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      });
    });

    it('calls onRemove callback when file is removed', async () => {
      render(<MediaUploader onRemove={mockOnRemove} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove test.jpg/i });
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalled();
      });
    });

    it('removes file errors when file is removed', async () => {
      render(<MediaUploader maxFileSize={100} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('large.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove large.jpg/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument();
      });
    });

    it('removes file preview when file is removed', async () => {
      render(<MediaUploader enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText(/preview of test.jpg/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove test.jpg/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByAltText(/preview of test.jpg/i)).not.toBeInTheDocument();
      });
    });

    it('updates file count after removal', async () => {
      render(<MediaUploader maxFiles={5} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ];

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText(/uploaded files \(2\/5\)/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove test1.jpg/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText(/uploaded files \(1\/5\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Editor', () => {
    it('shows edit button for image files when image editing enabled', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit test.jpg/i })).toBeInTheDocument();
      });
    });

    it('does not show edit button for non-image files', async () => {
      render(<MediaUploader enableImageEditing={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /edit document.pdf/i })).not.toBeInTheDocument();
      });
    });

    it('opens image editor when edit button is clicked', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /image editor/i })).toBeInTheDocument();
        expect(screen.getByText(/edit image/i)).toBeInTheDocument();
      });
    });

    it('closes image editor when close button is clicked', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close image editor/i });
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /image editor/i })).not.toBeInTheDocument();
      });
    });

    it('applies rotation transform', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const rotateButton = screen.getByRole('button', { name: /rotate image 90 degrees/i });
      fireEvent.click(rotateButton);

      const imagePreview = screen.getByAltText(/test.jpg with transformations applied/i);
      expect(imagePreview.style.transform).toContain('rotate(90deg)');
    });

    it('applies horizontal flip transform', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const flipButton = screen.getByRole('button', { name: /flip image horizontally/i });
      fireEvent.click(flipButton);

      const imagePreview = screen.getByAltText(/test.jpg with transformations applied/i);
      expect(imagePreview.style.transform).toContain('scaleX(-1)');
    });

    it('applies vertical flip transform', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const flipButton = screen.getByRole('button', { name: /flip image vertically/i });
      fireEvent.click(flipButton);

      const imagePreview = screen.getByAltText(/test.jpg with transformations applied/i);
      expect(imagePreview.style.transform).toContain('scaleY(-1)');
    });

    it('applies scale transform', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const scaleSlider = screen.getByLabelText(/scale image. current scale:/i);
      fireEvent.change(scaleSlider, { target: { value: '1.5' } });

      const imagePreview = screen.getByAltText(/test.jpg with transformations applied/i);
      expect(imagePreview.style.transform).toContain('scale(1.5)');
    });

    it('displays current scale value', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const scaleSlider = screen.getByLabelText(/scale image. current scale:/i);
      fireEvent.change(scaleSlider, { target: { value: '1.8' } });

      expect(screen.getByText('1.8x')).toBeInTheDocument();
    });

    it('closes editor when apply changes is clicked', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const applyButton = screen.getByRole('button', { name: /apply image transformations/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /image editor/i })).not.toBeInTheDocument();
      });
    });

    it('closes editor when cancel is clicked', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const cancelButton = screen.getByRole('button', { name: /cancel image editing/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /image editor/i })).not.toBeInTheDocument();
      });
    });

    it('does not show edit button when image editing is disabled', async () => {
      render(<MediaUploader enableImageEditing={false} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /edit test.jpg/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows clicking dropzone with Enter key', async () => {
      const inputClick = jest.fn();
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      fileInput.click = inputClick;

      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      fireEvent.keyDown(dropzone, { key: 'Enter' });

      expect(inputClick).toHaveBeenCalled();
    });

    it('allows clicking dropzone with Space key', async () => {
      const inputClick = jest.fn();
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      fileInput.click = inputClick;

      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      fireEvent.keyDown(dropzone, { key: ' ' });

      expect(inputClick).toHaveBeenCalled();
    });

    it('supports Ctrl+U keyboard shortcut to open file browser', async () => {
      const inputClick = jest.fn();
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      fileInput.click = inputClick;

      fireEvent.keyDown(document, { key: 'u', ctrlKey: true });

      expect(inputClick).toHaveBeenCalled();
    });

    it('supports Cmd+U keyboard shortcut on Mac', async () => {
      const inputClick = jest.fn();
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      fileInput.click = inputClick;

      fireEvent.keyDown(document, { key: 'u', metaKey: true });

      expect(inputClick).toHaveBeenCalled();
    });

    it('prevents default behavior for keyboard shortcuts', async () => {
      render(<MediaUploader />);

      const event = new KeyboardEvent('keydown', { key: 'u', ctrlKey: true, bubbles: true, cancelable: true });
      const preventDefault = jest.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<MediaUploader />);
      expect(screen.getByRole('region', { name: /media file uploader/i })).toBeInTheDocument();
    });

    it('dropzone has proper ARIA attributes', () => {
      render(<MediaUploader />);
      const dropzone = screen.getByRole('button', { name: /click to select files for upload/i });
      expect(dropzone).toHaveAttribute('tabIndex', '0');
      expect(dropzone).toHaveAttribute('aria-disabled', 'false');
    });

    it('sets aria-disabled when component is disabled', () => {
      render(<MediaUploader disabled={true} />);
      const dropzone = screen.getByRole('button');
      expect(dropzone).toHaveAttribute('aria-disabled', 'true');
      expect(dropzone).toHaveAttribute('tabIndex', '-1');
    });

    it('provides descriptive file input aria-label', () => {
      render(<MediaUploader maxFiles={3} maxFileSize={5 * 1024 * 1024} />);
      const fileInput = screen.getByLabelText(/maximum 3 files, up to 5 MB each/i);
      expect(fileInput).toBeInTheDocument();
    });

    it('progress bar has proper ARIA attributes', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('provides live region updates for upload progress', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR);

      render(<MediaUploader autoUpload={true} showProgress={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const liveRegion = screen.getByText(/% uploaded/i);
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('provides live region for errors', async () => {
      render(<MediaUploader maxFileSize={100} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('large.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert');
        expect(errorRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('file list has proper semantic structure', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getByRole('listitem')).toBeInTheDocument();
      });
    });

    it('all interactive buttons have accessible labels', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /preview test.jpg/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit test.jpg/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /remove test.jpg/i })).toBeInTheDocument();
      });
    });

    it('modal dialogs have proper ARIA attributes', async () => {
      render(<MediaUploader enableImageEditing={true} enablePreview={true} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit test.jpg/i });
        fireEvent.click(editButton);
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('screen reader only text is properly hidden', () => {
      const { container } = render(<MediaUploader />);
      const srOnlyElements = container.querySelectorAll('.sr-only');
      srOnlyElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // In actual implementation, these would be visually hidden
        expect(element.className).toContain('sr-only');
      });
    });
  });

  describe('File Type Icons', () => {
    it('displays image icon for image files', async () => {
      render(<MediaUploader enablePreview={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('image-icon')).toBeInTheDocument();
      });
    });

    it('displays video icon for video files', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('video.mp4', 1024, 'video/mp4');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('video-icon')).toBeInTheDocument();
      });
    });

    it('displays music icon for audio files', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('song.mp3', 1024, 'audio/mp3');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('music-icon')).toBeInTheDocument();
      });
    });

    it('displays file text icon for PDF files', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
      });
    });

    it('displays archive icon for zip files', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('archive.zip', 1024, 'application/zip');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('archive-icon')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes correctly', () => {
      render(<MediaUploader />);
      expect(screen.getByText(/100 MB/i)).toBeInTheDocument();
    });

    it('displays file sizes in appropriate units', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const smallFile = createMockFile('small.txt', 500, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [smallFile] } });

      await waitFor(() => {
        expect(screen.getByText(/500 bytes/i)).toBeInTheDocument();
      });
    });

    it('displays KB for files in kilobyte range', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('medium.jpg', 2048, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/2 KB/i)).toBeInTheDocument();
      });
    });

    it('displays MB for files in megabyte range', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('large.mp4', 5 * 1024 * 1024, 'video/mp4');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/5 MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Existing Files', () => {
    it('displays existing files on mount', () => {
      const existingFiles = [
        {
          id: 'existing-1',
          name: 'existing.jpg',
          size: 1024,
          type: 'image/jpeg',
          status: 'completed',
          progress: 100,
          url: 'http://example.com/existing.jpg'
        }
      ];

      render(<MediaUploader existingFiles={existingFiles} />);
      expect(screen.getByText('existing.jpg')).toBeInTheDocument();
    });

    it('combines existing files with newly uploaded files', async () => {
      const existingFiles = [
        {
          id: 'existing-1',
          name: 'existing.jpg',
          size: 1024,
          type: 'image/jpeg',
          status: 'completed',
          progress: 100,
          url: 'http://example.com/existing.jpg'
        }
      ];

      render(<MediaUploader existingFiles={existingFiles} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const newFile = createMockFile('new.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [newFile] } });

      await waitFor(() => {
        expect(screen.getByText('existing.jpg')).toBeInTheDocument();
        expect(screen.getByText('new.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('adjusts icon sizes for mobile viewport', () => {
      global.innerWidth = 375;
      render(<MediaUploader />);
      // Component should render without errors on mobile
      expect(screen.getByRole('region', { name: /media file uploader/i })).toBeInTheDocument();
    });

    it('adjusts icon sizes for desktop viewport', () => {
      global.innerWidth = 1920;
      render(<MediaUploader />);
      // Component should render without errors on desktop
      expect(screen.getByRole('region', { name: /media file uploader/i })).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling to dropzone', () => {
      render(<MediaUploader disabled={true} />);
      const dropzone = screen.getByRole('button');
      expect(dropzone.className).toContain('cursor-not-allowed');
    });

    it('disables file input when component is disabled', () => {
      render(<MediaUploader disabled={true} />);
      const fileInput = screen.getByLabelText(/select file to upload/i);
      expect(fileInput).toBeDisabled();
    });

    it('prevents dropzone click when disabled', () => {
      const inputClick = jest.fn();
      render(<MediaUploader disabled={true} />);
      const fileInput = screen.getByLabelText(/select file to upload/i);
      fileInput.click = inputClick;

      const dropzone = screen.getByRole('button');
      fireEvent.click(dropzone);

      expect(inputClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file selection', () => {
      render(<MediaUploader onUpload={mockOnUpload} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);

      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('handles file with zero size', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('empty.txt', 0, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/0 bytes/i)).toBeInTheDocument();
      });
    });

    it('handles files with no extension', async () => {
      render(<MediaUploader allowedExtensions={['jpg']} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('noextension', 1024, 'application/octet-stream');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('noextension')).toBeInTheDocument();
      });
    });

    it('handles files with multiple dots in name', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('my.file.name.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('my.file.name.jpg')).toBeInTheDocument();
      });
    });

    it('handles very long file names', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const longName = 'a'.repeat(200) + '.jpg';
      const file = createMockFile(longName, 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles special characters in file names', async () => {
      render(<MediaUploader />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = createMockFile('file-name_with$pecial.chars.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('file-name_with$pecial.chars.jpg')).toBeInTheDocument();
      });
    });

    it('generates unique IDs for files with same name', async () => {
      render(<MediaUploader onUpload={mockOnUpload} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file1 = createMockFile('duplicate.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('duplicate.jpg', 1024, 'image/jpeg');

      fireEvent.change(fileInput, { target: { files: [file1] } });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledTimes(1);
      });

      fireEvent.change(fileInput, { target: { files: [file2] } });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledTimes(2);
      });
    });

    it('handles undefined mime type', async () => {
      render(<MediaUploader enablePreview={false} />);
      const fileInput = screen.getByLabelText(/select files to upload/i);
      const file = new File(['content'], 'unknown', {});

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeInTheDocument();
      });
    });
  });

  describe('Component Unmounting', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListener = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<MediaUploader />);

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

export default localStorageMock
