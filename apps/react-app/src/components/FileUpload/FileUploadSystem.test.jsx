import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import FileUpload, { FileAttachment, FilePreview, formatFileSize, getFileType, FILE_TYPES } from './FileUploadSystem'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: ({ size, className }) => <svg data-testid="upload-icon" data-size={size} className={className} />,
  Image: ({ size, className }) => <svg data-testid="image-icon" data-size={size} className={className} />,
  FileText: ({ size, className }) => <svg data-testid="filetext-icon" data-size={size} className={className} />,
  Video: ({ size, className }) => <svg data-testid="video-icon" data-size={size} className={className} />,
  Music: ({ size, className }) => <svg data-testid="music-icon" data-size={size} className={className} />,
  Archive: ({ size, className }) => <svg data-testid="archive-icon" data-size={size} className={className} />,
  X: ({ size, className }) => <svg data-testid="x-icon" data-size={size} className={className} />,
  Check: ({ size, className }) => <svg data-testid="check-icon" data-size={size} className={className} />,
  AlertCircle: ({ size, className }) => <svg data-testid="alert-icon" data-size={size} className={className} />,
  Loader: ({ size, className }) => <svg data-testid="loader-icon" data-size={size} className={className} />,
  Download: ({ size, className }) => <svg data-testid="download-icon" data-size={size} className={className} />,
  Eye: ({ size, className }) => <svg data-testid="eye-icon" data-size={size} className={className} />,
  Trash2: ({ size, className }) => <svg data-testid="trash-icon" data-size={size} className={className} />,
  Paperclip: ({ size, className }) => <svg data-testid="paperclip-icon" data-size={size} className={className} />,
  Camera: ({ size, className }) => <svg data-testid="camera-icon" data-size={size} className={className} />,
  Mic: ({ size, className }) => <svg data-testid="mic-icon" data-size={size} className={className} />,
  Film: ({ size, className }) => <svg data-testid="film-icon" data-size={size} className={className} />,
  File: ({ size, className }) => <svg data-testid="file-icon" data-size={size} className={className} />,
}))

// Helper function to create mock files
const createMockFile = (name, size, type) => {
  const file = new File(['a'.repeat(size)], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUploadSystem', () => {
  describe('Utility Functions', () => {
    describe('formatFileSize', () => {
      test('should format 0 bytes correctly', () => {
        expect(formatFileSize(0)).toBe('0 B')
      })

      test('should format bytes correctly', () => {
        expect(formatFileSize(500)).toBe('500 B')
      })

      test('should format kilobytes correctly', () => {
        expect(formatFileSize(1024)).toBe('1 KB')
        expect(formatFileSize(2048)).toBe('2 KB')
      })

      test('should format megabytes correctly', () => {
        expect(formatFileSize(1048576)).toBe('1 MB')
        expect(formatFileSize(5242880)).toBe('5 MB')
      })

      test('should format gigabytes correctly', () => {
        expect(formatFileSize(1073741824)).toBe('1 GB')
      })

      test('should format with decimal precision', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB')
        expect(formatFileSize(2621440)).toBe('2.5 MB')
      })
    })

    describe('getFileType', () => {
      test('should identify image files correctly', () => {
        const jpgFile = createMockFile('test.jpg', 1000, 'image/jpeg')
        const { type, config } = getFileType(jpgFile)
        expect(type).toBe('IMAGE')
        expect(config.color).toBe('blue')
        expect(config.preview).toBe(true)
      })

      test('should identify video files correctly', () => {
        const mp4File = createMockFile('test.mp4', 1000, 'video/mp4')
        const { type, config } = getFileType(mp4File)
        expect(type).toBe('VIDEO')
        expect(config.color).toBe('purple')
        expect(config.preview).toBe(true)
      })

      test('should identify audio files correctly', () => {
        const mp3File = createMockFile('test.mp3', 1000, 'audio/mp3')
        const { type, config } = getFileType(mp3File)
        expect(type).toBe('AUDIO')
        expect(config.color).toBe('green')
        expect(config.preview).toBe(false)
      })

      test('should identify document files correctly', () => {
        const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf')
        const { type, config } = getFileType(pdfFile)
        expect(type).toBe('DOCUMENT')
        expect(config.color).toBe('orange')
      })

      test('should identify archive files correctly', () => {
        const zipFile = createMockFile('test.zip', 1000, 'application/zip')
        const { type, config } = getFileType(zipFile)
        expect(type).toBe('ARCHIVE')
        expect(config.color).toBe('gray')
      })

      test('should handle unknown file types', () => {
        const unknownFile = createMockFile('test.xyz', 1000, 'application/unknown')
        const { type, config } = getFileType(unknownFile)
        expect(type).toBe('UNKNOWN')
        expect(config.color).toBe('gray')
      })

      test('should handle case-insensitive extensions', () => {
        const file = createMockFile('test.JPG', 1000, 'image/jpeg')
        const { type } = getFileType(file)
        expect(type).toBe('IMAGE')
      })
    })

    describe('FILE_TYPES configuration', () => {
      test('should have correct image configuration', () => {
        expect(FILE_TYPES.IMAGE.maxSize).toBe(10 * 1024 * 1024)
        expect(FILE_TYPES.IMAGE.extensions).toContain('.jpg')
        expect(FILE_TYPES.IMAGE.extensions).toContain('.png')
      })

      test('should have correct video configuration', () => {
        expect(FILE_TYPES.VIDEO.maxSize).toBe(100 * 1024 * 1024)
        expect(FILE_TYPES.VIDEO.extensions).toContain('.mp4')
      })

      test('should have correct audio configuration', () => {
        expect(FILE_TYPES.AUDIO.maxSize).toBe(25 * 1024 * 1024)
        expect(FILE_TYPES.AUDIO.extensions).toContain('.mp3')
      })
    })
  })

  describe('FileUpload Component', () => {
    let mockOnFilesUploaded

    beforeEach(() => {
      mockOnFilesUploaded = jest.fn()
      jest.clearAllMocks()
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    describe('Initial Rendering', () => {
      test('should render the drop zone', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument()
      })

      test('should render upload instructions', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        expect(screen.getByText('Support for images, videos, documents and more')).toBeInTheDocument()
      })

      test('should render quick upload buttons', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        expect(screen.getByTitle('Upload Images')).toBeInTheDocument()
        expect(screen.getByTitle('Upload Videos')).toBeInTheDocument()
        expect(screen.getByTitle('Upload Audio')).toBeInTheDocument()
        expect(screen.getByTitle('Upload Files')).toBeInTheDocument()
      })

      test('should render with custom className', () => {
        const { container } = render(
          <FileUpload onFilesUploaded={mockOnFilesUploaded} className="custom-class" />
        )
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })

      test('should have hidden file input', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        expect(fileInput).toHaveStyle({ display: 'none' })
      })

      test('should have multiple attribute on file input', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        expect(fileInput).toHaveAttribute('multiple')
      })
    })

    describe('File Selection via Click', () => {
      test('should open file dialog when clicking drop zone', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')
        const fileInput = document.querySelector('input[type="file"]')

        const clickSpy = jest.spyOn(fileInput, 'click')
        fireEvent.click(dropZone)

        expect(clickSpy).toHaveBeenCalled()
      })

      test('should handle single file selection', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should handle multiple file selection', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.png', 2048, 'image/png'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('2 files selected')).toBeInTheDocument()
        })
      })

      test('should clear input value after selection', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        expect(fileInput.value).toBe('')
      })
    })

    describe('Drag and Drop Functionality', () => {
      test('should handle drag over event', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')

        fireEvent.dragOver(dropZone)

        expect(dropZone).toHaveClass('drag-over')
      })

      test('should handle drag leave event', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')

        fireEvent.dragOver(dropZone)
        expect(dropZone).toHaveClass('drag-over')

        fireEvent.dragLeave(dropZone)
        expect(dropZone).not.toHaveClass('drag-over')
      })

      test('should handle file drop', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file] },
        })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should remove drag-over class after drop', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')

        fireEvent.dragOver(dropZone)
        expect(dropZone).toHaveClass('drag-over')

        const file = createMockFile('test.jpg', 1024, 'image/jpeg')
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file] },
        })

        expect(dropZone).not.toHaveClass('drag-over')
      })

      test('should handle multiple files drop', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.png', 2048, 'image/png'),
          createMockFile('test3.mp4', 4096, 'video/mp4'),
        ]

        fireEvent.drop(dropZone, {
          dataTransfer: { files },
        })

        await waitFor(() => {
          expect(screen.getByText('3 files selected')).toBeInTheDocument()
        })
      })

      test('should prevent default on drag over', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')
        const event = new Event('dragover', { bubbles: true })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

        fireEvent(dropZone, event)

        expect(preventDefaultSpy).toHaveBeenCalled()
      })

      test('should prevent default on drop', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const dropZone = document.querySelector('.file-drop-zone')
        const event = new Event('drop', { bubbles: true })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

        fireEvent(dropZone, event)

        expect(preventDefaultSpy).toHaveBeenCalled()
      })
    })

    describe('File Validation - Size', () => {
      test('should reject image file exceeding max size', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.getByText('Upload Errors')).toBeInTheDocument()
        })
      })

      test('should accept image file within size limit', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const validFile = createMockFile('valid.jpg', 5 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [validFile] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should display size error message', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.getByText(/is too large/)).toBeInTheDocument()
        })
      })

      test('should reject video file exceeding max size', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeVideo = createMockFile('large.mp4', 150 * 1024 * 1024, 'video/mp4')

        fireEvent.change(fileInput, { target: { files: [largeVideo] } })

        await waitFor(() => {
          expect(screen.getByText('Upload Errors')).toBeInTheDocument()
        })
      })

      test('should validate each file individually', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('valid.jpg', 1024, 'image/jpeg'),
          createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('Upload Errors')).toBeInTheDocument()
        })
      })
    })

    describe('File Validation - Type', () => {
      test('should reject unsupported file type', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const unsupportedFile = createMockFile('test.xyz', 1024, 'application/unknown')

        fireEvent.change(fileInput, { target: { files: [unsupportedFile] } })

        await waitFor(() => {
          expect(screen.getByText(/File type not supported/)).toBeInTheDocument()
        })
      })

      test('should accept all supported image types', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const extensions = ['.jpg', '.png', '.gif', '.webp']

        for (const ext of extensions) {
          const file = createMockFile(`test${ext}`, 1024, 'image/jpeg')
          fireEvent.change(fileInput, { target: { files: [file] } })
        }

        await waitFor(() => {
          expect(screen.getByText(/4 files selected/)).toBeInTheDocument()
        })
      })

      test('should accept supported video types', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.mp4', 1024, 'video/mp4')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should accept supported audio types', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.mp3', 1024, 'audio/mp3')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should accept supported document types', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.pdf', 1024, 'application/pdf')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })
    })

    describe('File Count Validation', () => {
      test('should respect maxFiles limit', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} maxFiles={2} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
          createMockFile('test3.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText(/Cannot upload more than 2 files/)).toBeInTheDocument()
        })
      })

      test('should allow up to maxFiles', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} maxFiles={5} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = Array.from({ length: 5 }, (_, i) =>
          createMockFile(`test${i}.jpg`, 1024, 'image/jpeg')
        )

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('5 files selected')).toBeInTheDocument()
        })
      })

      test('should use default maxFiles of 10', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = Array.from({ length: 11 }, (_, i) =>
          createMockFile(`test${i}.jpg`, 1024, 'image/jpeg')
        )

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText(/Cannot upload more than 10 files/)).toBeInTheDocument()
        })
      })

      test('should track cumulative file count', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} maxFiles={3} />)
        const fileInput = document.querySelector('input[type="file"]')

        const files1 = [createMockFile('test1.jpg', 1024, 'image/jpeg')]
        fireEvent.change(fileInput, { target: { files: files1 } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })

        const files2 = [
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
          createMockFile('test3.jpg', 1024, 'image/jpeg'),
          createMockFile('test4.jpg', 1024, 'image/jpeg'),
        ]
        fireEvent.change(fileInput, { target: { files: files2 } })

        await waitFor(() => {
          expect(screen.getByText(/Cannot upload more than 3 files/)).toBeInTheDocument()
        })
      })
    })

    describe('Error Display and Handling', () => {
      test('should display error card when errors exist', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.getByText('Upload Errors')).toBeInTheDocument()
        })
      })

      test('should display multiple error messages', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg'),
          createMockFile('test.xyz', 1024, 'application/unknown'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          const errorList = screen.getByRole('list')
          expect(errorList.children.length).toBeGreaterThan(0)
        })
      })

      test('should auto-dismiss errors after 5 seconds', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.getByText('Upload Errors')).toBeInTheDocument()
        })

        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          expect(screen.queryByText('Upload Errors')).not.toBeInTheDocument()
        })
      })

      test('should show alert icon in error message', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.getAllByTestId('alert-icon')[0]).toBeInTheDocument()
        })
      })

      test('should not add invalid files to preview', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [largeFile] } })

        await waitFor(() => {
          expect(screen.queryByText(/file selected/)).not.toBeInTheDocument()
        })
      })
    })

    describe('File Preview Display', () => {
      test('should display file previews after selection', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument()
        })
      })

      test('should display file size in preview', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 KB')).toBeInTheDocument()
        })
      })

      test('should display file icon based on type', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getAllByTestId('image-icon').length).toBeGreaterThan(0)
        })
      })

      test('should show preview and download buttons', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Preview')).toBeInTheDocument()
          expect(screen.getByText('Download')).toBeInTheDocument()
        })
      })

      test('should display multiple file previews', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.png', 2048, 'image/png'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('test1.jpg')).toBeInTheDocument()
          expect(screen.getByText('test2.png')).toBeInTheDocument()
        })
      })

      test('should show correct file count in header', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
          createMockFile('test3.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('3 files selected')).toBeInTheDocument()
        })
      })
    })

    describe('File Removal', () => {
      test('should remove individual file when X button clicked', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument()
        })

        const removeButtons = screen.getAllByTestId('x-icon')
        const fileRemoveButton = removeButtons.find(btn =>
          btn.parentElement?.classList?.contains('remove-file-btn')
        )
        fireEvent.click(fileRemoveButton.parentElement)

        await waitFor(() => {
          expect(screen.queryByText('test.jpg')).not.toBeInTheDocument()
        })
      })

      test('should update file count after removal', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('2 files selected')).toBeInTheDocument()
        })

        const removeButtons = screen.getAllByTestId('x-icon')
        const fileRemoveButton = removeButtons.find(btn =>
          btn.parentElement?.classList?.contains('remove-file-btn')
        )
        fireEvent.click(fileRemoveButton.parentElement)

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })
      })

      test('should remove all files when Clear All clicked', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('2 files selected')).toBeInTheDocument()
        })

        const clearButton = screen.getByText('Clear All')
        fireEvent.click(clearButton)

        await waitFor(() => {
          expect(screen.queryByText(/files selected/)).not.toBeInTheDocument()
        })
      })

      test('should hide file previews section after clearing all', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1 file selected')).toBeInTheDocument()
        })

        const clearButton = screen.getByText('Clear All')
        fireEvent.click(clearButton)

        await waitFor(() => {
          expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
        })
      })
    })

    describe('Upload Progress Tracking', () => {
      test('should show upload progress when upload starts', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          expect(screen.getByText(/Uploading 1 file/)).toBeInTheDocument()
        })
      })

      test('should display progress for multiple files', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          expect(screen.getByText(/Uploading 2 files/)).toBeInTheDocument()
        })
      })

      test('should show progress bar for each file', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          const progressBar = document.querySelector('.upload-progress-fill')
          expect(progressBar).toBeInTheDocument()
        })
      })

      test('should show uploading status with loader icon', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          const loaderIcons = screen.getAllByTestId('loader-icon')
          expect(loaderIcons.length).toBeGreaterThan(0)
        })
      })

      test('should show percentage during upload', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(300)

        await waitFor(() => {
          const percentageRegex = /\d+%/
          expect(screen.getByText(percentageRegex)).toBeInTheDocument()
        })
      })

      test('should show completed status when upload finishes', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(2000)

        await waitFor(() => {
          expect(screen.getByText('Done')).toBeInTheDocument()
        })
      })

      test('should show check icon when upload completes', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(2000)

        await waitFor(() => {
          expect(screen.getByTestId('check-icon')).toBeInTheDocument()
        })
      })
    })

    describe('Cancel Upload Functionality', () => {
      test('should show cancel button during upload', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          const cancelButtons = screen.getAllByTestId('x-icon')
          const cancelUploadButton = cancelButtons.find(btn =>
            btn.parentElement?.classList?.contains('cancel-upload-btn')
          )
          expect(cancelUploadButton).toBeInTheDocument()
        })
      })

      test('should cancel upload when cancel button clicked', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          expect(screen.getByText(/Uploading/)).toBeInTheDocument()
        })

        const cancelButtons = screen.getAllByTestId('x-icon')
        const cancelUploadButton = cancelButtons.find(btn =>
          btn.parentElement?.classList?.contains('cancel-upload-btn')
        )
        fireEvent.click(cancelUploadButton.parentElement)

        await waitFor(() => {
          expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument()
        })
      })

      test('should clear files after canceling upload', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        await waitFor(() => {
          expect(screen.getByText(/Uploading/)).toBeInTheDocument()
        })

        const cancelButtons = screen.getAllByTestId('x-icon')
        const cancelUploadButton = cancelButtons.find(btn =>
          btn.parentElement?.classList?.contains('cancel-upload-btn')
        )
        fireEvent.click(cancelUploadButton.parentElement)

        await waitFor(() => {
          expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument()
        })
      })
    })

    describe('Upload Completion and Callback', () => {
      test('should call onFilesUploaded when upload completes', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(3000)

        await waitFor(() => {
          expect(mockOnFilesUploaded).toHaveBeenCalled()
        })
      })

      test('should pass correct files to callback', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(3000)

        await waitFor(() => {
          expect(mockOnFilesUploaded).toHaveBeenCalledWith(files)
        })
      })

      test('should reset to initial state after upload completes', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })

        const uploadButton = screen.getByText('Upload All')
        fireEvent.click(uploadButton)

        jest.advanceTimersByTime(3000)

        await waitFor(() => {
          expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument()
        })
      })
    })

    describe('Compact Mode', () => {
      test('should render compact mode when compact prop is true', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        expect(document.querySelector('.file-upload-compact')).toBeInTheDocument()
      })

      test('should show paperclip icon in compact mode', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument()
      })

      test('should have upload button in compact mode', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        expect(screen.getByTitle('Upload Files')).toBeInTheDocument()
      })

      test('should show file count badge in compact mode after selection', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        const fileInput = document.querySelector('input[type="file"]')
        const files = [
          createMockFile('test1.jpg', 1024, 'image/jpeg'),
          createMockFile('test2.jpg', 1024, 'image/jpeg'),
        ]

        fireEvent.change(fileInput, { target: { files } })

        await waitFor(() => {
          expect(screen.getByText('2')).toBeInTheDocument()
        })
      })

      test('should show clear button in compact mode when files selected', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          const clearButton = document.querySelector('.clear-files-btn')
          expect(clearButton).toBeInTheDocument()
        })
      })

      test('should clear files in compact mode', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('1')).toBeInTheDocument()
        })

        const clearButton = document.querySelector('.clear-files-btn')
        fireEvent.click(clearButton)

        await waitFor(() => {
          expect(screen.queryByText('1')).not.toBeInTheDocument()
        })
      })

      test('should open file dialog in compact mode', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} compact={true} />)
        const uploadButton = screen.getByTitle('Upload Files')
        const fileInput = document.querySelector('input[type="file"]')

        const clickSpy = jest.spyOn(fileInput, 'click')
        fireEvent.click(uploadButton)

        expect(clickSpy).toHaveBeenCalled()
      })
    })

    describe('Upload Button Behavior', () => {
      test('should not start upload when no files selected', () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        expect(screen.queryByText('Upload All')).not.toBeInTheDocument()
      })

      test('should show Upload All button when files selected', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Upload All')).toBeInTheDocument()
        })
      })

      test('should show Clear All button when files selected', async () => {
        render(<FileUpload onFilesUploaded={mockOnFilesUploaded} />)
        const fileInput = document.querySelector('input[type="file"]')
        const file = createMockFile('test.jpg', 1024, 'image/jpeg')

        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
          expect(screen.getByText('Clear All')).toBeInTheDocument()
        })
      })
    })
  })

  describe('FilePreview Component', () => {
    let mockOnRemove

    beforeEach(() => {
      mockOnRemove = jest.fn()
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          this.onload({ target: { result: 'data:image/jpeg;base64,fake' } })
        }),
        result: 'data:image/jpeg;base64,fake'
      }))
    })

    afterEach(() => {
      delete global.FileReader
    })

    test('should render file name', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })

    test('should render file size', () => {
      const file = createMockFile('test.jpg', 2048, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)
      expect(screen.getByText('2 KB')).toBeInTheDocument()
    })

    test('should render appropriate icon for file type', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)
      expect(screen.getAllByTestId('image-icon').length).toBeGreaterThan(0)
    })

    test('should call onRemove when remove button clicked', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)

      const removeButton = document.querySelector('.remove-file-btn')
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledWith(file)
    })

    test('should show preview actions', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    test('should generate image preview for image files', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)

      await waitFor(() => {
        const img = screen.getByAltText('test.jpg')
        expect(img).toBeInTheDocument()
      })
    })

    test('should not show preview for non-previewable files', () => {
      const file = createMockFile('test.pdf', 1024, 'application/pdf')
      render(<FilePreview file={file} onRemove={mockOnRemove} />)

      const preview = document.querySelector('.file-preview-content')
      expect(preview).not.toBeInTheDocument()
    })
  })

  describe('FileAttachment Component', () => {
    test('should render attachment name', () => {
      const attachment = { name: 'document.pdf', size: 5000 }
      render(<FileAttachment attachment={attachment} />)
      expect(screen.getAllByText('document.pdf')[0]).toBeInTheDocument()
    })

    test('should render attachment size', () => {
      const attachment = { name: 'document.pdf', size: 5000 }
      render(<FileAttachment attachment={attachment} />)
      expect(screen.getByText('4.88 KB')).toBeInTheDocument()
    })

    test('should render in compact mode', () => {
      const attachment = { name: 'document.pdf', size: 5000 }
      render(<FileAttachment attachment={attachment} compact={true} />)
      expect(document.querySelector('.file-attachment-compact')).toBeInTheDocument()
    })

    test('should show download button in compact mode', () => {
      const attachment = { name: 'document.pdf', size: 5000 }
      render(<FileAttachment attachment={attachment} compact={true} />)
      expect(document.querySelector('.download-attachment-btn')).toBeInTheDocument()
    })

    test('should show preview and download actions in normal mode', () => {
      const attachment = { name: 'document.pdf', size: 5000 }
      render(<FileAttachment attachment={attachment} />)
      const actions = document.querySelectorAll('.attachment-action-btn')
      expect(actions.length).toBe(2)
    })

    test('should render image preview when url provided', () => {
      const attachment = { name: 'photo.jpg', size: 5000, url: 'https://example.com/photo.jpg' }
      render(<FileAttachment attachment={attachment} />)
      const img = screen.getByAltText('photo.jpg')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })

    test('should render video preview when url provided', () => {
      const attachment = { name: 'video.mp4', size: 50000, url: 'https://example.com/video.mp4' }
      render(<FileAttachment attachment={attachment} />)
      const video = document.querySelector('.attachment-video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
    })

    test('should not render preview for non-previewable types', () => {
      const attachment = { name: 'document.pdf', size: 5000, url: 'https://example.com/doc.pdf' }
      render(<FileAttachment attachment={attachment} />)
      const preview = document.querySelector('.attachment-preview')
      expect(preview).not.toBeInTheDocument()
    })
  })
})

export default createMockFile
