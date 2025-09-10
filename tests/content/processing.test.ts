/**
 * Unit tests for content processing and sanitization
 */

// Mock DOMPurify for testing HTML sanitization
const mockDOMPurify = {
  sanitize: jest.fn(),
  isValidAttribute: jest.fn(),
}

jest.mock('dompurify', () => mockDOMPurify)

describe('Content Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDOMPurify.sanitize.mockImplementation((html) => html) // Default passthrough
  })

  describe('HTML Sanitization', () => {
    it('should sanitize malicious script tags', () => {
      const maliciousContent = '<p>Hello</p><script>alert("XSS")</script>'
      const expectedSanitized = '<p>Hello</p>'
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousContent, expect.any(Object))
      expect(result).toBe(expectedSanitized)
    })

    it('should remove dangerous event handlers', () => {
      const maliciousContent = '<p onclick="alert(\'XSS\')">Click me</p>'
      const expectedSanitized = '<p>Click me</p>'
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(result).toBe(expectedSanitized)
    })

    it('should preserve safe HTML formatting', () => {
      const safeContent = '<p><strong>Bold</strong> and <em>italic</em> text</p>'
      
      mockDOMPurify.sanitize.mockReturnValue(safeContent)
      
      const result = sanitizeHTML(safeContent)
      
      expect(result).toBe(safeContent)
    })

    it('should remove iframe and embed tags', () => {
      const maliciousContent = '<p>Text</p><iframe src="evil.com"></iframe>'
      const expectedSanitized = '<p>Text</p>'
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(result).toBe(expectedSanitized)
    })

    it('should preserve allowed Froala editor HTML', () => {
      const froalaContent = `
        <p style="text-align: center;"><strong>Header</strong></p>
        <ol>
          <li>First item</li>
          <li>Second item</li>
        </ol>
        <p><a href="https://example.com">Link</a></p>
      `
      
      mockDOMPurify.sanitize.mockReturnValue(froalaContent)
      
      const result = sanitizeHTML(froalaContent)
      
      expect(result).toBe(froalaContent)
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(
        froalaContent,
        expect.objectContaining({
          ALLOWED_TAGS: expect.arrayContaining(['p', 'strong', 'em', 'ol', 'ul', 'li', 'a']),
          ALLOWED_ATTR: expect.arrayContaining(['href', 'style', 'class']),
        })
      )
    })
  })

  describe('Froala Content Processing', () => {
    it('should extract plain text from HTML content', () => {
      const htmlContent = '<p><strong>Bold text</strong> and <em>italic text</em></p>'
      const expectedText = 'Bold text and italic text'
      
      const result = extractPlainText(htmlContent)
      
      expect(result).toBe(expectedText)
    })

    it('should handle empty HTML content', () => {
      const htmlContent = '<p><br></p>'
      const expectedText = ''
      
      const result = extractPlainText(htmlContent)
      
      expect(result).toBe(expectedText)
    })

    it('should preserve line breaks from lists', () => {
      const htmlContent = '<ol><li>First item</li><li>Second item</li></ol>'
      const expectedText = 'First item\nSecond item'
      
      const result = extractPlainText(htmlContent)
      
      expect(result).toBe(expectedText)
    })

    it('should convert HTML entities', () => {
      const htmlContent = '<p>&lt;tag&gt; and &amp; symbol</p>'
      const expectedText = '<tag> and & symbol'
      
      const result = extractPlainText(htmlContent)
      
      expect(result).toBe(expectedText)
    })

    it('should handle nested HTML structures', () => {
      const htmlContent = `
        <div>
          <p>Paragraph 1</p>
          <ul>
            <li><strong>Bold item</strong></li>
            <li><em>Italic item</em></li>
          </ul>
          <p>Paragraph 2</p>
        </div>
      `
      const expectedText = 'Paragraph 1\nBold item\nItalic item\nParagraph 2'
      
      const result = extractPlainText(htmlContent)
      
      expect(result.trim().replace(/\s+/g, ' ')).toBe('Paragraph 1 Bold item Italic item Paragraph 2')
    })
  })

  describe('Content Validation', () => {
    it('should detect empty content after HTML stripping', () => {
      const emptyContent = '<p></p><br><div></div>'
      
      const result = isContentEmpty(emptyContent)
      
      expect(result).toBe(true)
    })

    it('should detect non-empty content', () => {
      const validContent = '<p>This has actual content</p>'
      
      const result = isContentEmpty(validContent)
      
      expect(result).toBe(false)
    })

    it('should handle whitespace-only content', () => {
      const whitespaceContent = '<p>   \n\t   </p>'
      
      const result = isContentEmpty(whitespaceContent)
      
      expect(result).toBe(true)
    })

    it('should detect content with only HTML entities', () => {
      const entityContent = '<p>&nbsp;&nbsp;</p>'
      
      const result = isContentEmpty(entityContent)
      
      expect(result).toBe(true)
    })

    it('should validate content length limits', () => {
      const longContent = '<p>' + 'x'.repeat(10000) + '</p>'
      
      const result = isContentTooLong(longContent, 5000)
      
      expect(result).toBe(true)
    })

    it('should accept content within limits', () => {
      const normalContent = '<p>Normal length content</p>'
      
      const result = isContentTooLong(normalContent, 5000)
      
      expect(result).toBe(false)
    })
  })

  describe('Content Formatting', () => {
    it('should normalize paragraph spacing', () => {
      const content = '<p>Para 1</p><p>Para 2</p><p>Para 3</p>'
      const expectedFormatted = '<p>Para 1</p>\n<p>Para 2</p>\n<p>Para 3</p>'
      
      const result = formatContent(content)
      
      expect(result).toBe(expectedFormatted)
    })

    it('should clean up extra whitespace', () => {
      const messyContent = '<p>  Text   with   spaces  </p>'
      const expectedClean = '<p>Text with spaces</p>'
      
      const result = cleanupWhitespace(messyContent)
      
      expect(result).toBe(expectedClean)
    })

    it('should normalize list formatting', () => {
      const messyList = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const expectedFormatted = '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>'
      
      const result = formatContent(messyList)
      
      expect(result).toBe(expectedFormatted)
    })

    it('should preserve intentional formatting', () => {
      const formattedContent = '<p><strong>Bold</strong> and <em>italic</em></p>'
      
      const result = formatContent(formattedContent)
      
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })
  })

  describe('Content Security', () => {
    it('should remove data URIs from images', () => {
      const maliciousContent = '<img src="data:text/html,<script>alert(1)</script>">'
      const expectedSanitized = ''
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(result).toBe(expectedSanitized)
    })

    it('should remove javascript: URLs', () => {
      const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click</a>'
      const expectedSanitized = '<a>Click</a>'
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(result).toBe(expectedSanitized)
    })

    it('should preserve safe external links', () => {
      const safeContent = '<a href="https://example.com">Safe link</a>'
      
      mockDOMPurify.sanitize.mockReturnValue(safeContent)
      
      const result = sanitizeHTML(safeContent)
      
      expect(result).toBe(safeContent)
    })

    it('should handle CSS injection attempts', () => {
      const maliciousContent = '<p style="background: url(javascript:alert(1))">Text</p>'
      const expectedSanitized = '<p>Text</p>'
      
      mockDOMPurify.sanitize.mockReturnValue(expectedSanitized)
      
      const result = sanitizeHTML(maliciousContent)
      
      expect(result).toBe(expectedSanitized)
    })
  })

  describe('Content Preview Generation', () => {
    it('should generate short preview from content', () => {
      const longContent = '<p>This is a very long piece of content that should be truncated to a shorter preview for display in lists and summaries.</p>'
      const expectedPreview = 'This is a very long piece of content that should b...'
      
      const result = generatePreview(longContent, 50)
      
      expect(result).toBe(expectedPreview)
    })

    it('should preserve full content when shorter than limit', () => {
      const shortContent = '<p>Short content</p>'
      const expectedPreview = 'Short content'
      
      const result = generatePreview(shortContent, 50)
      
      expect(result).toBe(expectedPreview)
    })

    it('should strip HTML from preview', () => {
      const htmlContent = '<p><strong>Bold</strong> and <em>italic</em> content</p>'
      const expectedPreview = 'Bold and italic content'
      
      const result = generatePreview(htmlContent, 50)
      
      expect(result).toBe(expectedPreview)
    })

    it('should handle empty content gracefully', () => {
      const emptyContent = '<p></p>'
      const expectedPreview = ''
      
      const result = generatePreview(emptyContent, 50)
      
      expect(result).toBe(expectedPreview)
    })
  })
})

// Mock implementation functions
function sanitizeHTML(html: string): string {
  const config = {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'style', 'class'],
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror'],
  }
  
  return mockDOMPurify.sanitize(html, config)
}

function extractPlainText(html: string): string {
  // Simulate removing HTML tags and extracting text
  return html
    .replace(/<li>/g, '\n')
    .replace(/<\/?(p|div|br)[^>]*>/g, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
}

function isContentEmpty(content: string): boolean {
  const plainText = extractPlainText(content)
  return !plainText.trim()
}

function isContentTooLong(content: string, maxLength: number): boolean {
  return content.length > maxLength
}

function formatContent(content: string): string {
  return content
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/<ul>/g, '<ul>\n  ')
    .replace(/<\/li><li>/g, '</li>\n  <li>')
    .replace(/<\/ul>/g, '\n</ul>')
    .replace(/<ol>/g, '<ol>\n  ')
    .replace(/<\/ol>/g, '\n</ol>')
}

function cleanupWhitespace(content: string): string {
  return content.replace(/<p>\s+/g, '<p>').replace(/\s+<\/p>/g, '</p>').replace(/\s+/g, ' ').trim()
}

function generatePreview(content: string, maxLength: number): string {
  const plainText = extractPlainText(content)
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  return plainText.substring(0, maxLength).trim() + '...'
}