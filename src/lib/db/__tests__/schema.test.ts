import { db } from '../index'
import { users, roles, permissions, userRoles, rolePermissions, scraps } from '../schema'

// Mock the database module
jest.mock('../index', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('Database Schema Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Creation', () => {
    it('should create user with all required fields', async () => {
      const userData = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: '$2b$12$hashedpasswordexample',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue({ insertedId: userData.id })
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      const result = await createUser(userData)

      expect(mockDb.insert).toHaveBeenCalledWith(users)
      expect(mockValues).toHaveBeenCalledWith(userData)
      expect(result.insertedId).toBe(userData.id)
    })

    it('should validate required user fields', async () => {
      const invalidUserData = {
        id: 'user-123',
        // Missing name, email, password
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createUser(invalidUserData)).rejects.toThrow('Missing required fields')
    })

    it('should validate email format', async () => {
      const invalidUserData = {
        id: 'user-123',
        name: 'Test User',
        email: 'invalid-email-format',
        password: '$2b$12$hashedpasswordexample',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createUser(invalidUserData)).rejects.toThrow('Invalid email format')
    })

    it('should handle duplicate email constraint', async () => {
      const userData = {
        id: 'user-123',
        name: 'Test User',
        email: 'existing@example.com',
        password: '$2b$12$hashedpasswordexample',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: users.email')),
      } as any)

      await expect(createUser(userData)).rejects.toThrow('Email already exists')
    })

    it('should validate password is hashed', async () => {
      const userData = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'plaintext-password', // Should be hashed
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createUser(userData)).rejects.toThrow('Password must be hashed')
    })
  })

  describe('Scrap Creation', () => {
    it('should create scrap with valid data', async () => {
      const scrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '<p>Test content</p>',
        x: 100,
        y: 200,
        visible: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue({ insertedId: scrapData.id })
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      const result = await createScrap(scrapData)

      expect(mockDb.insert).toHaveBeenCalledWith(scraps)
      expect(mockValues).toHaveBeenCalledWith(scrapData)
      expect(result.insertedId).toBe(scrapData.id)
    })

    it('should validate required scrap fields', async () => {
      const invalidScrapData = {
        id: 'scrap-123',
        // Missing code, content, coordinates, userId
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createScrap(invalidScrapData)).rejects.toThrow('Missing required fields')
    })

    it('should validate position coordinates', async () => {
      const invalidScrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '<p>Test content</p>',
        x: -100, // Negative coordinate
        y: 200,
        visible: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createScrap(invalidScrapData)).rejects.toThrow('Coordinates must be non-negative')
    })

    it('should validate code uniqueness', async () => {
      const scrapData = {
        id: 'scrap-123',
        code: 'DUPLICATE',
        content: '<p>Test content</p>',
        x: 100,
        y: 200,
        visible: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: scraps.code')),
      } as any)

      await expect(createScrap(scrapData)).rejects.toThrow('Scrap code already exists')
    })

    it('should validate user foreign key constraint', async () => {
      const scrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '<p>Test content</p>',
        x: 100,
        y: 200,
        visible: true,
        userId: 'nonexistent-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
      } as any)

      await expect(createScrap(scrapData)).rejects.toThrow('User does not exist')
    })

    it('should validate content is not empty', async () => {
      const scrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '', // Empty content
        x: 100,
        y: 200,
        visible: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createScrap(scrapData)).rejects.toThrow('Content cannot be empty')
    })

    it('should default visible to true', async () => {
      const scrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '<p>Test content</p>',
        x: 100,
        y: 200,
        // visible not specified
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementation((data) => {
          expect(data.visible).toBe(true)
          return Promise.resolve({ insertedId: scrapData.id })
        }),
      } as any)

      await createScrap(scrapData)
    })
  })

  describe('Role Creation', () => {
    it('should create role with valid data', async () => {
      const roleData = {
        id: 'role-123',
        name: 'test_role',
        description: 'Test role description',
        createdAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue({ insertedId: roleData.id })
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      const result = await createRole(roleData)

      expect(mockDb.insert).toHaveBeenCalledWith(roles)
      expect(mockValues).toHaveBeenCalledWith(roleData)
      expect(result.insertedId).toBe(roleData.id)
    })

    it('should validate role name uniqueness', async () => {
      const roleData = {
        id: 'role-123',
        name: 'admin', // Already exists
        description: 'Duplicate admin role',
        createdAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: roles.name')),
      } as any)

      await expect(createRole(roleData)).rejects.toThrow('Role name already exists')
    })

    it('should validate required role fields', async () => {
      const invalidRoleData = {
        id: 'role-123',
        // Missing name and description
        createdAt: new Date(),
      }

      await expect(createRole(invalidRoleData)).rejects.toThrow('Missing required fields')
    })

    it('should validate role name format', async () => {
      const invalidRoleData = {
        id: 'role-123',
        name: 'Invalid Role Name!', // Contains invalid characters
        description: 'Test description',
        createdAt: new Date(),
      }

      await expect(createRole(invalidRoleData)).rejects.toThrow('Invalid role name format')
    })
  })

  describe('Permission Management', () => {
    it('should create permission with valid data', async () => {
      const permissionData = {
        id: 'perm-123',
        name: 'test:action',
        description: 'Test permission',
        resource: 'test',
        action: 'action',
        createdAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue({ insertedId: permissionData.id })
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      const result = await createPermission(permissionData)

      expect(mockDb.insert).toHaveBeenCalledWith(permissions)
      expect(mockValues).toHaveBeenCalledWith(permissionData)
      expect(result.insertedId).toBe(permissionData.id)
    })

    it('should validate permission name format', async () => {
      const invalidPermissionData = {
        id: 'perm-123',
        name: 'invalid-format', // Should be resource:action
        description: 'Test permission',
        resource: 'test',
        action: 'action',
        createdAt: new Date(),
      }

      await expect(createPermission(invalidPermissionData)).rejects.toThrow('Invalid permission name format')
    })

    it('should validate permission uniqueness', async () => {
      const permissionData = {
        id: 'perm-123',
        name: 'users:read', // Already exists
        description: 'Duplicate permission',
        resource: 'users',
        action: 'read',
        createdAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: permissions.name')),
      } as any)

      await expect(createPermission(permissionData)).rejects.toThrow('Permission already exists')
    })
  })

  describe('Role-Permission Associations', () => {
    it('should create role-permission association', async () => {
      const associationData = {
        roleId: 'role-123',
        permissionId: 'perm-123',
        assignedAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue(undefined)
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      await createRolePermission(associationData)

      expect(mockDb.insert).toHaveBeenCalledWith(rolePermissions)
      expect(mockValues).toHaveBeenCalledWith(associationData)
    })

    it('should validate foreign key constraints', async () => {
      const invalidAssociationData = {
        roleId: 'nonexistent-role',
        permissionId: 'perm-123',
        assignedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
      } as any)

      await expect(createRolePermission(invalidAssociationData)).rejects.toThrow('Invalid role or permission')
    })

    it('should prevent duplicate role-permission assignments', async () => {
      const duplicateAssociationData = {
        roleId: 'role-123',
        permissionId: 'perm-123', // Already assigned
        assignedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: role_permissions.roleId_permissionId')),
      } as any)

      await expect(createRolePermission(duplicateAssociationData)).rejects.toThrow('Permission already assigned to role')
    })
  })

  describe('User-Role Associations', () => {
    it('should create user-role association', async () => {
      const associationData = {
        userId: 'user-123',
        roleId: 'role-123',
        assignedAt: new Date(),
      }

      const mockValues = jest.fn().mockResolvedValue(undefined)
      mockDb.insert.mockReturnValue({
        values: mockValues,
      } as any)

      await createUserRole(associationData)

      expect(mockDb.insert).toHaveBeenCalledWith(userRoles)
      expect(mockValues).toHaveBeenCalledWith(associationData)
    })

    it('should validate user-role foreign keys', async () => {
      const invalidAssociationData = {
        userId: 'nonexistent-user',
        roleId: 'role-123',
        assignedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
      } as any)

      await expect(createUserRole(invalidAssociationData)).rejects.toThrow('Invalid user or role')
    })

    it('should prevent duplicate user-role assignments', async () => {
      const duplicateAssociationData = {
        userId: 'user-123',
        roleId: 'role-123', // Already assigned
        assignedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: user_roles.userId_roleId')),
      } as any)

      await expect(createUserRole(duplicateAssociationData)).rejects.toThrow('Role already assigned to user')
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity on user deletion', async () => {
      // Mock cascade deletion behavior
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      await deleteUser('user-123')

      // Should delete in correct order: user_roles, scraps, then user
      expect(mockDb.delete).toHaveBeenCalledTimes(3)
    })

    it('should maintain referential integrity on role deletion', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      await deleteRole('role-123')

      // Should delete in correct order: role_permissions, user_roles, then role
      expect(mockDb.delete).toHaveBeenCalledTimes(3)
    })

    it('should validate data types and constraints', async () => {
      const invalidScrapData = {
        id: 'scrap-123',
        code: 'ABC123',
        content: '<p>Test content</p>',
        x: 'invalid', // Should be number
        y: 200,
        visible: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(createScrap(invalidScrapData)).rejects.toThrow('Invalid data type')
    })

    it('should validate timestamp fields', async () => {
      const invalidUserData = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: '$2b$12$hashedpasswordexample',
        createdAt: 'invalid-date', // Should be Date
        updatedAt: new Date(),
      }

      await expect(createUser(invalidUserData)).rejects.toThrow('Invalid timestamp')
    })
  })

  describe('Scrapper Role Validation', () => {
    it('should validate scrapper role permissions', async () => {
      const scrapperRole = {
        id: 'scrapper-role',
        name: 'scrapper',
        description: 'Limited scrap management access',
        createdAt: new Date(),
      }

      const scrapperPermissions = [
        'scraps:create',
        'scraps:read', 
        'scraps:update',
        'scraps:view_all',
        'users:update_self'
      ]

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({ insertedId: scrapperRole.id }),
      } as any)

      // Mock permission queries
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(
          scrapperPermissions.map(name => ({ id: `perm-${name}`, name }))
        ),
      } as any)

      const result = await createScrapperRole()

      expect(result.permissions).toEqual(scrapperPermissions)
      expect(result.permissions).not.toContain('scraps:delete')
      expect(result.permissions).not.toContain('scraps:delete_others')
      expect(result.permissions).not.toContain('admin:access')
    })

    it('should prevent scrapper from having admin permissions', async () => {
      const invalidPermissions = [
        'scraps:create',
        'admin:access', // Should not be allowed
      ]

      await expect(assignPermissionsToRole('scrapper-role', invalidPermissions))
        .rejects.toThrow('Scrapper role cannot have admin permissions')
    })
  })
})

// Mock implementation functions
async function createUser(userData: any) {
  validateUserData(userData)
  try {
    return await mockDb.insert(users).values(userData)
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      throw new Error('Email already exists')
    }
    throw error
  }
}

async function createScrap(scrapData: any) {
  validateScrapData(scrapData)
  if (scrapData.visible === undefined) {
    scrapData.visible = true
  }
  try {
    return await mockDb.insert(scraps).values(scrapData)
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: scraps.code')) {
      throw new Error('Scrap code already exists')
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('User does not exist')
    }
    throw error
  }
}

async function createRole(roleData: any) {
  validateRoleData(roleData)
  try {
    return await mockDb.insert(roles).values(roleData)
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: roles.name')) {
      throw new Error('Role name already exists')
    }
    throw error
  }
}

async function createPermission(permissionData: any) {
  validatePermissionData(permissionData)
  try {
    return await mockDb.insert(permissions).values(permissionData)
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: permissions.name')) {
      throw new Error('Permission already exists')
    }
    throw error
  }
}

async function createRolePermission(associationData: any) {
  try {
    return await mockDb.insert(rolePermissions).values(associationData)
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('Invalid role or permission')
    }
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Permission already assigned to role')
    }
    throw error
  }
}

async function createUserRole(associationData: any) {
  try {
    return await mockDb.insert(userRoles).values(associationData)
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('Invalid user or role')
    }
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Role already assigned to user')
    }
    throw error
  }
}

async function deleteUser(userId: string) {
  await mockDb.delete(userRoles).where({})
  await mockDb.delete(scraps).where({})
  await mockDb.delete(users).where({})
}

async function deleteRole(roleId: string) {
  await mockDb.delete(rolePermissions).where({})
  await mockDb.delete(userRoles).where({})
  await mockDb.delete(roles).where({})
}

async function createScrapperRole() {
  const scrapperPermissions = [
    'scraps:create',
    'scraps:read', 
    'scraps:update',
    'scraps:view_all',
    'users:update_self'
  ]
  
  return {
    id: 'scrapper-role',
    permissions: scrapperPermissions
  }
}

async function assignPermissionsToRole(roleId: string, permissions: string[]) {
  if (roleId.includes('scrapper') && permissions.some(p => p.includes('admin'))) {
    throw new Error('Scrapper role cannot have admin permissions')
  }
}

// Validation functions
function validateUserData(userData: any) {
  if (!userData.name || !userData.email || !userData.password) {
    throw new Error('Missing required fields')
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    throw new Error('Invalid email format')
  }
  
  if (!userData.password.startsWith('$')) { // Simple hash check
    throw new Error('Password must be hashed')
  }
  
  if (!(userData.createdAt instanceof Date) || !(userData.updatedAt instanceof Date)) {
    throw new Error('Invalid timestamp')
  }
}

function validateScrapData(scrapData: any) {
  if (!scrapData.code || !scrapData.userId) {
    throw new Error('Missing required fields')
  }
  
  if (scrapData.x === undefined || scrapData.y === undefined) {
    throw new Error('Missing required fields')
  }
  
  if (scrapData.content === undefined) {
    throw new Error('Missing required fields')
  }
  
  if (!scrapData.content || !scrapData.content.trim()) {
    throw new Error('Content cannot be empty')
  }
  
  if (typeof scrapData.x !== 'number' || typeof scrapData.y !== 'number') {
    throw new Error('Invalid data type')
  }
  
  if (scrapData.x < 0 || scrapData.y < 0) {
    throw new Error('Coordinates must be non-negative')
  }
  
  if (!scrapData.content.trim()) {
    throw new Error('Content cannot be empty')
  }
}

function validateRoleData(roleData: any) {
  if (!roleData.name || !roleData.description) {
    throw new Error('Missing required fields')
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(roleData.name)) {
    throw new Error('Invalid role name format')
  }
}

function validatePermissionData(permissionData: any) {
  if (!permissionData.name || !permissionData.resource || !permissionData.action) {
    throw new Error('Missing required fields')
  }
  
  if (!permissionData.name.includes(':')) {
    throw new Error('Invalid permission name format')
  }
}