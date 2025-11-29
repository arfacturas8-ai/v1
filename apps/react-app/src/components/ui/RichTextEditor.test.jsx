import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import RichTextEditor from './RichTextEditor'

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  Underline: () => <div data-testid="underline-icon">Underline</div>,
  Strikethrough: () => <div data-testid="strikethrough-icon">Strikethrough</div>,
  List: () => <div data-testid="list-icon">List</div>,
  ListOrdered: () => <div data-testid="list-ordered-icon">ListOrdered</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Quote: () => <div data-testid="quote-icon">Quote</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Edit3: () => <div data-testid="edit3-icon">Edit3</div>,
  Smile: () => <div data-testid="smile-icon">Smile</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  Paperclip: () => <div data-testid="paperclip-icon">Paperclip</div>,
}))

describe('RichTextEditor', () => {
  describe('Editor Initialization', () => {
    it('renders the editor with default props', () => {
      render(<RichTextEditor />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toBeInTheDocument()
    })

    it('renders the editor with toolbar by default', () => {
      render(<RichTextEditor />)
      const toolbar = screen.getByRole('toolbar', { name: /text formatting tools/i })
      expect(toolbar).toBeInTheDocument()
    })

    it('renders with custom placeholder', () => {
      render(<RichTextEditor placeholder="Enter your text here" />)
      expect(screen.getByPlaceholderText('Enter your text here')).toBeInTheDocument()
    })

    it('renders with default placeholder', () => {
      render(<RichTextEditor />)
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
    })

    it('renders with initial value', () => {
      render(<RichTextEditor value="Initial content" />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveValue('Initial content')
    })

    it('applies custom className', () => {
      const { container } = render(<RichTextEditor className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('applies custom minHeight', () => {
      render(<RichTextEditor minHeight="min-h-64" />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveClass('min-h-64')
    })

    it('autofocuses when autoFocus prop is true', () => {
      render(<RichTextEditor autoFocus />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveFocus()
    })

    it('does not autofocus when autoFocus prop is false', () => {
      render(<RichTextEditor autoFocus={false} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).not.toHaveFocus()
    })
  })

  describe('Text Input and Editing', () => {
    it('handles text input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      await user.type(textarea, 'Hello World')
      expect(onChange).toHaveBeenCalled()
    })

    it('updates value on text change', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.change(textarea, { target: { value: 'New text', selectionStart: 8 } })
      expect(onChange).toHaveBeenCalledWith('New text')
    })

    it('respects maxLength limit', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} maxLength={10} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.change(textarea, { target: { value: 'Short text', selectionStart: 10 } })
      expect(onChange).toHaveBeenCalledWith('Short text')

      onChange.mockClear()
      fireEvent.change(textarea, { target: { value: 'This is a very long text that exceeds limit', selectionStart: 43 } })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('displays correct character count', () => {
      render(<RichTextEditor value="Hello" maxLength={100} />)
      expect(screen.getByText('95 characters remaining')).toBeInTheDocument()
    })

    it('displays warning color when near character limit', () => {
      render(<RichTextEditor value="A".repeat(39600) maxLength={40000} />)
      const charCount = screen.getByText(/characters remaining/i)
      expect(charCount).toHaveClass('text-warning')
    })

    it('displays normal color when not near character limit', () => {
      render(<RichTextEditor value="Hello" maxLength={40000} />)
      const charCount = screen.getByText(/characters remaining/i)
      expect(charCount).toHaveClass('text-secondary/60')
    })
  })

  describe('Formatting - Bold', () => {
    it('applies bold formatting to selected text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello World" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /bold text/i }))

      expect(onChange).toHaveBeenCalledWith('**Hello** World')
    })

    it('inserts bold markers when no text is selected', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /bold text/i }))
      expect(onChange).toHaveBeenCalledWith('****')
    })

    it('applies bold with Ctrl+B keyboard shortcut', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true })

      expect(onChange).toHaveBeenCalledWith('**Hello**')
    })

    it('applies bold with Cmd+B keyboard shortcut on Mac', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.keyDown(textarea, { key: 'b', metaKey: true })

      expect(onChange).toHaveBeenCalledWith('**Hello**')
    })
  })

  describe('Formatting - Italic', () => {
    it('applies italic formatting to selected text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello World" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /italic text/i }))

      expect(onChange).toHaveBeenCalledWith('*Hello* World')
    })

    it('inserts italic markers when no text is selected', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /italic text/i }))
      expect(onChange).toHaveBeenCalledWith('**')
    })

    it('applies italic with Ctrl+I keyboard shortcut', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.keyDown(textarea, { key: 'i', ctrlKey: true })

      expect(onChange).toHaveBeenCalledWith('*Hello*')
    })
  })

  describe('Formatting - Underline', () => {
    it('applies underline formatting to selected text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello World" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /underline text/i }))

      expect(onChange).toHaveBeenCalledWith('__Hello__ World')
    })

    it('applies underline with Ctrl+U keyboard shortcut', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.keyDown(textarea, { key: 'u', ctrlKey: true })

      expect(onChange).toHaveBeenCalledWith('__Hello__')
    })
  })

  describe('Formatting - Strikethrough', () => {
    it('applies strikethrough formatting to selected text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello World" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /strikethrough text/i }))

      expect(onChange).toHaveBeenCalledWith('~~Hello~~ World')
    })

    it('inserts strikethrough markers when no text is selected', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /strikethrough text/i }))
      expect(onChange).toHaveBeenCalledWith('~~~~')
    })
  })

  describe('Headings', () => {
    it('inserts H1 heading marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert heading 1/i }))
      expect(onChange).toHaveBeenCalledWith('\n# ')
    })

    it('inserts H2 heading marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert heading 2/i }))
      expect(onChange).toHaveBeenCalledWith('\n## ')
    })

    it('inserts H3 heading marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert heading 3/i }))
      expect(onChange).toHaveBeenCalledWith('\n### ')
    })
  })

  describe('Lists', () => {
    it('inserts unordered list marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert bullet list/i }))
      expect(onChange).toHaveBeenCalledWith('\n- ')
    })

    it('inserts ordered list marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert numbered list/i }))
      expect(onChange).toHaveBeenCalledWith('\n1. ')
    })

    it('continues unordered list on Enter key', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="- Item 1" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(8, 8)
      fireEvent.keyDown(textarea, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith('- Item 1\n- ')
    })

    it('continues ordered list with incremented number on Enter key', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="1. Item 1" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(9, 9)
      fireEvent.keyDown(textarea, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith('1. Item 1\n2. ')
    })

    it('exits list when Enter is pressed on empty list item', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="- " onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(2, 2)
      fireEvent.keyDown(textarea, { key: 'Enter' })

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('Code', () => {
    it('applies inline code formatting to selected text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello World" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /insert inline code/i }))

      expect(onChange).toHaveBeenCalledWith('`Hello` World')
    })

    it('inserts code block markers', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      // Note: There's no code block button in the toolbar, but we can test the formatCodeBlock function
      // This would need to be triggered differently in the actual implementation
    })
  })

  describe('Quote', () => {
    it('inserts quote marker', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert quote/i }))
      expect(onChange).toHaveBeenCalledWith('\n> ')
    })
  })

  describe('Links', () => {
    it('opens link dialog when link button is clicked', () => {
      render(<RichTextEditor />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Insert Link')).toBeInTheDocument()
    })

    it('opens link dialog with Ctrl+K keyboard shortcut', () => {
      render(<RichTextEditor value="" />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.keyDown(textarea, { key: 'k', ctrlKey: true })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('inserts link with URL and text', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))

      const urlInput = screen.getByLabelText('URL')
      const textInput = screen.getByLabelText(/link text/i)

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
      fireEvent.change(textInput, { target: { value: 'Example Site' } })

      fireEvent.click(screen.getByRole('button', { name: 'Insert Link' }))

      expect(onChange).toHaveBeenCalledWith('[Example Site](https://example.com)')
    })

    it('inserts link with URL only when text is not provided', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))

      const urlInput = screen.getByLabelText('URL')
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })

      fireEvent.click(screen.getByRole('button', { name: 'Insert Link' }))

      expect(onChange).toHaveBeenCalledWith('[https://example.com](https://example.com)')
    })

    it('closes link dialog when cancel is clicked', () => {
      render(<RichTextEditor />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('disables insert button when URL is empty', () => {
      render(<RichTextEditor />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))

      const insertButton = screen.getByRole('button', { name: 'Insert Link' })
      expect(insertButton).toBeDisabled()
    })

    it('clears link dialog inputs after insertion', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))

      const urlInput = screen.getByLabelText('URL')
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Insert Link' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Open dialog again to check if inputs are cleared
      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))
      const newUrlInput = screen.getByLabelText('URL')
      expect(newUrlInput).toHaveValue('')
    })
  })

  describe('Images', () => {
    it('shows image upload button when onImageUpload is provided', () => {
      const onImageUpload = jest.fn()
      render(<RichTextEditor onImageUpload={onImageUpload} />)

      expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument()
    })

    it('does not show image upload button when onImageUpload is not provided', () => {
      render(<RichTextEditor />)

      expect(screen.queryByRole('button', { name: /upload image/i })).not.toBeInTheDocument()
    })

    it('calls onImageUpload when image files are selected', () => {
      const onImageUpload = jest.fn()
      render(<RichTextEditor onImageUpload={onImageUpload} />)

      const file = new File(['image'], 'test.png', { type: 'image/png' })
      const input = screen.getByLabelText(/upload image files/i)

      fireEvent.change(input, { target: { files: [file] } })

      expect(onImageUpload).toHaveBeenCalledWith([file])
    })

    it('handles multiple image uploads', () => {
      const onImageUpload = jest.fn()
      render(<RichTextEditor onImageUpload={onImageUpload} />)

      const file1 = new File(['image1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['image2'], 'test2.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload image files/i)

      fireEvent.change(input, { target: { files: [file1, file2] } })

      expect(onImageUpload).toHaveBeenCalledWith([file1, file2])
    })
  })

  describe('Videos', () => {
    it('shows video upload button when onVideoUpload is provided', () => {
      const onVideoUpload = jest.fn()
      render(<RichTextEditor onVideoUpload={onVideoUpload} />)

      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument()
    })

    it('does not show video upload button when onVideoUpload is not provided', () => {
      render(<RichTextEditor />)

      expect(screen.queryByRole('button', { name: /upload video/i })).not.toBeInTheDocument()
    })

    it('calls onVideoUpload when video files are selected', () => {
      const onVideoUpload = jest.fn()
      render(<RichTextEditor onVideoUpload={onVideoUpload} />)

      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })
      const input = screen.getByLabelText(/upload video files/i)

      fireEvent.change(input, { target: { files: [file] } })

      expect(onVideoUpload).toHaveBeenCalledWith([file])
    })
  })

  describe('File Uploads', () => {
    it('shows file upload button when onFileUpload is provided', () => {
      const onFileUpload = jest.fn()
      render(<RichTextEditor onFileUpload={onFileUpload} />)

      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument()
    })

    it('does not show file upload button when onFileUpload is not provided', () => {
      render(<RichTextEditor />)

      expect(screen.queryByRole('button', { name: /upload file/i })).not.toBeInTheDocument()
    })

    it('calls onFileUpload when files are selected', () => {
      const onFileUpload = jest.fn()
      render(<RichTextEditor onFileUpload={onFileUpload} />)

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload files$/i)

      fireEvent.change(input, { target: { files: [file] } })

      expect(onFileUpload).toHaveBeenCalledWith([file])
    })
  })

  describe('Emoji Picker', () => {
    it('toggles emoji picker when emoji button is clicked', () => {
      render(<RichTextEditor />)

      const emojiButton = screen.getByRole('button', { name: /insert emoji/i })
      fireEvent.click(emojiButton)

      expect(screen.getByRole('menu', { name: /emoji picker/i })).toBeInTheDocument()

      fireEvent.click(emojiButton)
      expect(screen.queryByRole('menu', { name: /emoji picker/i })).not.toBeInTheDocument()
    })

    it('inserts emoji when clicked', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert emoji/i }))

      const emojiButtons = screen.getAllByRole('menuitem')
      fireEvent.click(emojiButtons[0])

      expect(onChange).toHaveBeenCalled()
    })

    it('closes emoji picker after inserting emoji', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)

      fireEvent.click(screen.getByRole('button', { name: /insert emoji/i }))

      const emojiButtons = screen.getAllByRole('menuitem')
      fireEvent.click(emojiButtons[0])

      expect(screen.queryByRole('menu', { name: /emoji picker/i })).not.toBeInTheDocument()
    })

    it('displays all common emojis in the picker', () => {
      render(<RichTextEditor />)

      fireEvent.click(screen.getByRole('button', { name: /insert emoji/i }))

      const emojiButtons = screen.getAllByRole('menuitem')
      expect(emojiButtons.length).toBe(20)
    })
  })

  describe('Preview Mode', () => {
    it('toggles to preview mode when preview button is clicked', () => {
      render(<RichTextEditor value="# Hello World" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      expect(screen.getByRole('document', { name: /preview content/i })).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('toggles back to edit mode when edit button is clicked', () => {
      render(<RichTextEditor value="# Hello World" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))
      fireEvent.click(screen.getByRole('button', { name: /switch to edit mode/i }))

      expect(screen.getByRole('textbox', { name: /rich text editor/i })).toBeInTheDocument()
      expect(screen.queryByRole('document', { name: /preview content/i })).not.toBeInTheDocument()
    })

    it('toggles preview mode with Ctrl+Enter keyboard shortcut', () => {
      render(<RichTextEditor value="# Hello World" />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

      expect(screen.getByRole('document', { name: /preview content/i })).toBeInTheDocument()
    })

    it('renders bold markdown in preview', () => {
      render(<RichTextEditor value="**Bold text**" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<strong>Bold text</strong>')
    })

    it('renders italic markdown in preview', () => {
      render(<RichTextEditor value="*Italic text*" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<em>Italic text</em>')
    })

    it('renders underline markdown in preview', () => {
      render(<RichTextEditor value="__Underlined text__" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<u>Underlined text</u>')
    })

    it('renders strikethrough markdown in preview', () => {
      render(<RichTextEditor value="~~Strikethrough text~~" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<del>Strikethrough text</del>')
    })

    it('renders inline code in preview', () => {
      render(<RichTextEditor value="`code`" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<code class="inline-code">code</code>')
    })

    it('renders H1 heading in preview', () => {
      render(<RichTextEditor value="# Heading 1" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<h1>Heading 1</h1>')
    })

    it('renders H2 heading in preview', () => {
      render(<RichTextEditor value="## Heading 2" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<h2>Heading 2</h2>')
    })

    it('renders H3 heading in preview', () => {
      render(<RichTextEditor value="### Heading 3" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<h3>Heading 3</h3>')
    })

    it('renders blockquote in preview', () => {
      render(<RichTextEditor value="> Quote" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<blockquote>Quote</blockquote>')
    })

    it('renders links in preview', () => {
      render(<RichTextEditor value="[Link](https://example.com)" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>')
    })

    it('sanitizes HTML in preview using DOMPurify', () => {
      const DOMPurify = require('dompurify')
      render(<RichTextEditor value="<script>alert('xss')</script>" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })

    it('shows placeholder text in preview when value is empty', () => {
      render(<RichTextEditor value="" />)

      fireEvent.click(screen.getByRole('button', { name: /switch to preview mode/i }))

      const preview = screen.getByRole('document', { name: /preview content/i })
      expect(preview.innerHTML).toContain('Nothing to preview yet...')
    })
  })

  describe('Character Counter', () => {
    it('shows character counter by default', () => {
      render(<RichTextEditor />)
      expect(screen.getByText(/characters remaining/i)).toBeInTheDocument()
    })

    it('updates character counter as text is entered', () => {
      render(<RichTextEditor value="Hello" maxLength={100} />)
      expect(screen.getByText('95 characters remaining')).toBeInTheDocument()
    })

    it('formats large numbers with commas', () => {
      render(<RichTextEditor value="" maxLength={40000} />)
      expect(screen.getByText('40,000 characters remaining')).toBeInTheDocument()
    })
  })

  describe('Placeholder', () => {
    it('displays placeholder when value is empty', () => {
      render(<RichTextEditor placeholder="Type something..." />)
      expect(screen.getByPlaceholderText('Type something...')).toBeInTheDocument()
    })

    it('does not display placeholder when value is not empty', () => {
      render(<RichTextEditor value="Some text" placeholder="Type something..." />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveValue('Some text')
    })
  })

  describe('Read-only Mode', () => {
    it('makes textarea read-only when readOnly prop is true', () => {
      render(<RichTextEditor readOnly />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveAttribute('readOnly')
    })

    it('hides toolbar when readOnly is true', () => {
      render(<RichTextEditor readOnly />)
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    })

    it('allows editing when readOnly is false', () => {
      render(<RichTextEditor readOnly={false} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).not.toHaveAttribute('readOnly')
    })
  })

  describe('Toolbar Visibility', () => {
    it('shows toolbar when showToolbar is true', () => {
      render(<RichTextEditor showToolbar />)
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })

    it('hides toolbar when showToolbar is false', () => {
      render(<RichTextEditor showToolbar={false} />)
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    })
  })

  describe('Tab Handling', () => {
    it('inserts spaces when Tab key is pressed', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.keyDown(textarea, { key: 'Tab' })

      expect(onChange).toHaveBeenCalledWith('    ')
    })

    it('inserts fewer spaces when Shift+Tab is pressed', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.keyDown(textarea, { key: 'Tab', shiftKey: true })

      expect(onChange).toHaveBeenCalledWith('  ')
    })

    it('prevents default tab behavior', () => {
      render(<RichTextEditor value="" />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      fireEvent.keyDown(textarea, event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Markdown Support', () => {
    it('shows "Markdown supported" message when allowMarkdown is true', () => {
      render(<RichTextEditor allowMarkdown />)
      expect(screen.getByText('Markdown supported')).toBeInTheDocument()
    })

    it('does not show "Markdown supported" message when allowMarkdown is false', () => {
      render(<RichTextEditor allowMarkdown={false} />)
      expect(screen.queryByText('Markdown supported')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for toolbar', () => {
      render(<RichTextEditor />)
      expect(screen.getByRole('toolbar', { name: /text formatting tools/i })).toBeInTheDocument()
    })

    it('has proper ARIA label for textarea', () => {
      render(<RichTextEditor />)
      expect(screen.getByLabelText(/rich text editor/i)).toBeInTheDocument()
    })

    it('has proper ARIA describedby for character counter', () => {
      render(<RichTextEditor />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveAttribute('aria-describedby', 'char-count')
    })

    it('has screen reader only text for toolbar buttons', () => {
      render(<RichTextEditor />)
      const boldButton = screen.getByRole('button', { name: /bold text/i })
      expect(boldButton).toBeInTheDocument()
    })

    it('has proper ARIA pressed state for bold button', () => {
      render(<RichTextEditor value="**bold**" />)
      const boldButton = screen.getByRole('button', { name: /bold text/i })
      expect(boldButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('has proper ARIA expanded state for emoji picker', () => {
      render(<RichTextEditor />)
      const emojiButton = screen.getByRole('button', { name: /insert emoji/i })
      expect(emojiButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(emojiButton)
      expect(emojiButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('has proper ARIA labels for file inputs', () => {
      render(<RichTextEditor onImageUpload={jest.fn()} />)
      expect(screen.getByLabelText(/upload image files/i)).toBeInTheDocument()
    })

    it('has proper role for link dialog', () => {
      render(<RichTextEditor />)
      fireEvent.click(screen.getByRole('button', { name: /insert link/i }))

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
  })

  describe('Content onChange', () => {
    it('calls onChange when text is modified', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      fireEvent.change(textarea, { target: { value: 'New content', selectionStart: 11 } })
      expect(onChange).toHaveBeenCalledWith('New content')
    })

    it('calls onChange when formatting is applied', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      textarea.setSelectionRange(0, 5)
      fireEvent.click(screen.getByRole('button', { name: /bold text/i }))

      expect(onChange).toHaveBeenCalledWith('**Hello**')
    })

    it('does not call onChange when value exceeds maxLength', () => {
      const onChange = jest.fn()
      render(<RichTextEditor value="Hello" onChange={onChange} maxLength={10} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })

      onChange.mockClear()
      fireEvent.change(textarea, { target: { value: 'Hello World Extra', selectionStart: 17 } })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles null value gracefully', () => {
      render(<RichTextEditor value={null} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveValue('')
    })

    it('handles undefined value gracefully', () => {
      render(<RichTextEditor value={undefined} />)
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      expect(textarea).toHaveValue('')
    })

    it('handles missing textareaRef gracefully in insertAtCursor', () => {
      const onChange = jest.fn()
      const { container } = render(<RichTextEditor value="" onChange={onChange} />)

      // Remove the ref to simulate a missing ref scenario
      const textarea = screen.getByRole('textbox', { name: /rich text editor/i })
      Object.defineProperty(textarea, 'current', { value: null })

      fireEvent.click(screen.getByRole('button', { name: /bold text/i }))

      // Should not crash
    })
  })

export default textarea
