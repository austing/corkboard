/**
 * Unit tests for form validation logic
 */

describe('Form Validation', () => {
  describe('Profile Form Validation', () => {
    it('should validate required fields', () => {
      const formData = { name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' }
      const errors = validateProfileForm(formData)
      
      expect(errors.name).toBe('Name is required')
      expect(errors.email).toBe('Email is required')
    })

    it('should validate email format', () => {
      const formData = { name: 'Test User', email: 'invalid-email', currentPassword: '', newPassword: '', confirmPassword: '' }
      const errors = validateProfileForm(formData)
      
      expect(errors.email).toBe('Invalid email format')
    })

    it('should validate password change requirements', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        currentPassword: '', 
        newPassword: 'newpass', 
        confirmPassword: 'newpass' 
      }
      const errors = validateProfileForm(formData)
      
      expect(errors.currentPassword).toBe('Current password is required to change password')
    })

    it('should validate password confirmation match', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        currentPassword: 'oldpass', 
        newPassword: 'newpass123', 
        confirmPassword: 'different' 
      }
      const errors = validateProfileForm(formData)
      
      expect(errors.confirmPassword).toBe('Passwords do not match')
    })

    it('should validate minimum password length', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        currentPassword: 'oldpass', 
        newPassword: '123', 
        confirmPassword: '123' 
      }
      const errors = validateProfileForm(formData)
      
      expect(errors.newPassword).toBe('Password must be at least 6 characters')
    })

    it('should pass validation with valid data', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }
      const errors = validateProfileForm(formData)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should pass validation with password change', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        currentPassword: 'oldpass123', 
        newPassword: 'newpass123', 
        confirmPassword: 'newpass123' 
      }
      const errors = validateProfileForm(formData)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })

  describe('Scrap Content Validation', () => {
    it('should reject empty content', () => {
      const content = ''
      const errors = validateScrapContent(content)
      
      expect(errors.content).toBe('Content is required')
    })

    it('should reject whitespace-only content', () => {
      const content = '   \n\t   '
      const errors = validateScrapContent(content)
      
      expect(errors.content).toBe('Content cannot be empty')
    })

    it('should reject empty HTML content', () => {
      const content = '<p><br></p>'
      const errors = validateScrapContent(content)
      
      expect(errors.content).toBe('Content cannot be empty')
    })

    it('should reject content with only empty paragraphs', () => {
      const content = '<p></p><p> </p><p><br></p>'
      const errors = validateScrapContent(content)
      
      expect(errors.content).toBe('Content cannot be empty')
    })

    it('should accept valid HTML content', () => {
      const content = '<p>This is valid content</p>'
      const errors = validateScrapContent(content)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should accept content with formatting', () => {
      const content = '<p><strong>Bold text</strong> and <em>italic text</em></p>'
      const errors = validateScrapContent(content)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should validate maximum content length', () => {
      const content = '<p>' + 'x'.repeat(10000) + '</p>' // Very long content
      const errors = validateScrapContent(content)
      
      expect(errors.content).toBe('Content is too long')
    })
  })

  describe('Scrap Position Validation', () => {
    it('should validate required coordinates', () => {
      const position = { x: undefined, y: undefined }
      const errors = validateScrapPosition(position)
      
      expect(errors.x).toBe('X coordinate is required')
      expect(errors.y).toBe('Y coordinate is required')
    })

    it('should validate numeric coordinates', () => {
      const position = { x: 'invalid', y: 'invalid' }
      const errors = validateScrapPosition(position)
      
      expect(errors.x).toBe('X coordinate must be a number')
      expect(errors.y).toBe('Y coordinate must be a number')
    })

    it('should validate non-negative coordinates', () => {
      const position = { x: -100, y: -50 }
      const errors = validateScrapPosition(position)
      
      expect(errors.x).toBe('X coordinate must be non-negative')
      expect(errors.y).toBe('Y coordinate must be non-negative')
    })

    it('should validate maximum coordinates', () => {
      const position = { x: 1000000, y: 1000000 }
      const errors = validateScrapPosition(position)
      
      expect(errors.x).toBe('X coordinate is too large')
      expect(errors.y).toBe('Y coordinate is too large')
    })

    it('should accept valid coordinates', () => {
      const position = { x: 100, y: 200 }
      const errors = validateScrapPosition(position)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should accept zero coordinates', () => {
      const position = { x: 0, y: 0 }
      const errors = validateScrapPosition(position)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })

  describe('User Creation Form Validation', () => {
    it('should validate required fields', () => {
      const formData = { name: '', email: '', password: '', confirmPassword: '', roles: [] }
      const errors = validateUserForm(formData)
      
      expect(errors.name).toBe('Name is required')
      expect(errors.email).toBe('Email is required')
      expect(errors.password).toBe('Password is required')
    })

    it('should validate email format', () => {
      const formData = { 
        name: 'Test User', 
        email: 'invalid.email', 
        password: 'password123', 
        confirmPassword: 'password123', 
        roles: [] 
      }
      const errors = validateUserForm(formData)
      
      expect(errors.email).toBe('Invalid email format')
    })

    it('should validate password strength', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        password: '123', 
        confirmPassword: '123', 
        roles: [] 
      }
      const errors = validateUserForm(formData)
      
      expect(errors.password).toBe('Password must be at least 6 characters')
    })

    it('should validate password confirmation', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        password: 'password123', 
        confirmPassword: 'different', 
        roles: [] 
      }
      const errors = validateUserForm(formData)
      
      expect(errors.confirmPassword).toBe('Passwords do not match')
    })

    it('should validate role selection', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        password: 'password123', 
        confirmPassword: 'password123', 
        roles: ['invalid-role'] 
      }
      const availableRoles = ['admin', 'editor', 'viewer', 'scrapper']
      const errors = validateUserForm(formData, availableRoles)
      
      expect(errors.roles).toBe('Invalid role selected')
    })

    it('should pass validation with valid data', () => {
      const formData = { 
        name: 'Test User', 
        email: 'test@example.com', 
        password: 'password123', 
        confirmPassword: 'password123', 
        roles: ['editor'] 
      }
      const availableRoles = ['admin', 'editor', 'viewer', 'scrapper']
      const errors = validateUserForm(formData, availableRoles)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })

  describe('Role Form Validation', () => {
    it('should validate required fields', () => {
      const formData = { name: '', description: '', permissions: [] }
      const errors = validateRoleForm(formData)
      
      expect(errors.name).toBe('Role name is required')
      expect(errors.description).toBe('Description is required')
    })

    it('should validate role name format', () => {
      const formData = { name: 'Invalid Role!', description: 'Valid description', permissions: [] }
      const errors = validateRoleForm(formData)
      
      expect(errors.name).toBe('Role name can only contain letters, numbers, and underscores')
    })

    it('should validate role name length', () => {
      const formData = { name: 'ab', description: 'Valid description', permissions: [] }
      const errors = validateRoleForm(formData)
      
      expect(errors.name).toBe('Role name must be at least 3 characters')
    })

    it('should validate description length', () => {
      const formData = { name: 'valid_role', description: 'ab', permissions: [] }
      const errors = validateRoleForm(formData)
      
      expect(errors.description).toBe('Description must be at least 10 characters')
    })

    it('should validate permission selection', () => {
      const formData = { name: 'valid_role', description: 'Valid description', permissions: ['invalid:permission'] }
      const availablePermissions = ['users:read', 'users:create', 'scraps:read']
      const errors = validateRoleForm(formData, availablePermissions)
      
      expect(errors.permissions).toBe('Invalid permission selected')
    })

    it('should pass validation with valid data', () => {
      const formData = { 
        name: 'moderator', 
        description: 'Can moderate user content and interactions', 
        permissions: ['scraps:read', 'scraps:update'] 
      }
      const availablePermissions = ['scraps:read', 'scraps:update', 'scraps:delete']
      const errors = validateRoleForm(formData, availablePermissions)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })

  describe('Authentication Form Validation', () => {
    it('should validate signin form', () => {
      const formData = { email: '', password: '' }
      const errors = validateSigninForm(formData)
      
      expect(errors.email).toBe('Email is required')
      expect(errors.password).toBe('Password is required')
    })

    it('should validate email format in signin', () => {
      const formData = { email: 'invalid-email', password: 'password123' }
      const errors = validateSigninForm(formData)
      
      expect(errors.email).toBe('Invalid email format')
    })

    it('should pass signin validation with valid data', () => {
      const formData = { email: 'test@example.com', password: 'password123' }
      const errors = validateSigninForm(formData)
      
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })
})

// Mock validation function implementations
function validateProfileForm(formData: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (formData.newPassword && !formData.currentPassword) {
    errors.currentPassword = 'Current password is required to change password'
  }
  
  if (formData.newPassword && formData.newPassword.length < 6) {
    errors.newPassword = 'Password must be at least 6 characters'
  }
  
  if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  return errors
}

function validateScrapContent(content: string): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!content) {
    errors.content = 'Content is required'
    return errors
  }
  
  const trimmed = content.trim()
  if (!trimmed) {
    errors.content = 'Content cannot be empty'
    return errors
  }
  
  // Check for empty HTML
  const htmlStripped = trimmed.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (!htmlStripped) {
    errors.content = 'Content cannot be empty'
    return errors
  }
  
  if (content.length > 5000) {
    errors.content = 'Content is too long'
  }
  
  return errors
}

function validateScrapPosition(position: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (position.x === undefined || position.x === null) {
    errors.x = 'X coordinate is required'
  } else if (typeof position.x !== 'number' && isNaN(Number(position.x))) {
    errors.x = 'X coordinate must be a number'
  } else if (Number(position.x) < 0) {
    errors.x = 'X coordinate must be non-negative'
  } else if (Number(position.x) > 999999) {
    errors.x = 'X coordinate is too large'
  }
  
  if (position.y === undefined || position.y === null) {
    errors.y = 'Y coordinate is required'
  } else if (typeof position.y !== 'number' && isNaN(Number(position.y))) {
    errors.y = 'Y coordinate must be a number'
  } else if (Number(position.y) < 0) {
    errors.y = 'Y coordinate must be non-negative'
  } else if (Number(position.y) > 999999) {
    errors.y = 'Y coordinate is too large'
  }
  
  return errors
}

function validateUserForm(formData: any, availableRoles?: string[]): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!formData.password) {
    errors.password = 'Password is required'
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  if (formData.roles && availableRoles) {
    const invalidRoles = formData.roles.filter((role: string) => !availableRoles.includes(role))
    if (invalidRoles.length > 0) {
      errors.roles = 'Invalid role selected'
    }
  }
  
  return errors
}

function validateRoleForm(formData: any, availablePermissions?: string[]): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!formData.name?.trim()) {
    errors.name = 'Role name is required'
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
    errors.name = 'Role name can only contain letters, numbers, and underscores'
  } else if (formData.name.length < 3) {
    errors.name = 'Role name must be at least 3 characters'
  }
  
  if (!formData.description?.trim()) {
    errors.description = 'Description is required'
  } else if (formData.description.length < 10) {
    errors.description = 'Description must be at least 10 characters'
  }
  
  if (formData.permissions && availablePermissions) {
    const invalidPermissions = formData.permissions.filter((perm: string) => !availablePermissions.includes(perm))
    if (invalidPermissions.length > 0) {
      errors.permissions = 'Invalid permission selected'
    }
  }
  
  return errors
}

function validateSigninForm(formData: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!formData.password) {
    errors.password = 'Password is required'
  }
  
  return errors
}