import { seedDatabase } from '../seed'
import { db } from '../index'
import bcrypt from 'bcryptjs'

// Mock the database module
jest.mock('../index', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}))

// Mock crypto randomUUID
const mockUUID = 'mock-uuid-123'
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => mockUUID),
}))

const mockDb = db as jest.Mocked<typeof db>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('Database Seeding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn() // Mock console.log
  })

  describe('seedDatabase', () => {
    it('should create all default permissions', async () => {
      await seedDatabase()

      // Should have called insert for permissions (19 permissions)
      expect(mockDb.insert).toHaveBeenCalledTimes(29) // 19 permissions + 4 roles + 4 permission assignments + 1 user + 1 user role
    })

    it('should create default roles with correct names', async () => {
      await seedDatabase()

      // Verify roles are created
      const rolesCalls = (mockDb.insert as jest.Mock).mock.calls.find(call => 
        call[0] && Array.isArray(call[0]) && call[0].some((role: any) => role.name === 'admin')
      )
      
      expect(rolesCalls).toBeDefined()
    })

    it('should create scrapper role with correct description', async () => {
      await seedDatabase()

      // The values method should be called with role data including scrapper
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'scrapper',
            description: 'Can create, read, update scraps and view all. Can edit own profile. Cannot delete or manage other users.',
          })
        ])
      )
    })

    it('should hash admin password correctly', async () => {
      await seedDatabase()

      expect(mockBcrypt.hash).toHaveBeenCalledWith('admin123', 12)
    })

    it('should create admin user with correct details', async () => {
      await seedDatabase()

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'hashed-password',
        })
      )
    })

    it('should assign scrapper permissions correctly', async () => {
      await seedDatabase()

      // Should assign 5 permissions to scrapper role:
      // scraps:create, scraps:read, scraps:update, scraps:view_all, users:update_self
      const scrapperPermissionAssignments = (mockDb.values as jest.Mock).mock.calls.filter(call => 
        Array.isArray(call[0]) && call[0].length === 5 // scrapper has 5 permissions
      )

      expect(scrapperPermissionAssignments.length).toBeGreaterThan(0)
    })

    it('should log success message', async () => {
      await seedDatabase()

      expect(console.log).toHaveBeenCalledWith('🌱 Seeding database...')
      expect(console.log).toHaveBeenCalledWith('✅ Database seeded successfully!')
      expect(console.log).toHaveBeenCalledWith('Admin credentials:')
      expect(console.log).toHaveBeenCalledWith('Email: admin@example.com')
      expect(console.log).toHaveBeenCalledWith('Password: admin123')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.values.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(seedDatabase()).rejects.toThrow('Database connection failed')
    })
  })

  describe('Permission Assignments', () => {
    it('should assign all permissions to admin role', async () => {
      await seedDatabase()

      // Admin should get all 19 permissions
      const adminPermissionAssignments = (mockDb.values as jest.Mock).mock.calls.find(call => 
        Array.isArray(call[0]) && call[0].length === 19 // all permissions
      )

      expect(adminPermissionAssignments).toBeDefined()
    })

    it('should assign limited permissions to editor role', async () => {
      await seedDatabase()

      // Editor should get 3 permissions: users:read, users:update, admin:access
      const editorPermissionAssignments = (mockDb.values as jest.Mock).mock.calls.find(call => 
        Array.isArray(call[0]) && call[0].length === 3
      )

      expect(editorPermissionAssignments).toBeDefined()
    })

    it('should assign read permissions to viewer role', async () => {
      await seedDatabase()

      // Viewer should get 4 permissions: users:read, roles:read, permissions:read, admin:access
      const viewerPermissionAssignments = (mockDb.values as jest.Mock).mock.calls.find(call => 
        Array.isArray(call[0]) && call[0].length === 4
      )

      expect(viewerPermissionAssignments).toBeDefined()
    })
  })

  describe('Data Validation', () => {
    it('should create permissions with correct structure', async () => {
      await seedDatabase()

      // Check that permissions are created with correct fields
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/^[a-z_]+:[a-z_]+$/),
          description: expect.any(String),
          resource: expect.any(String),
          action: expect.any(String),
          createdAt: expect.any(Date),
        })
      )
    })

    it('should create roles with required fields', async () => {
      await seedDatabase()

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
            createdAt: expect.any(Date),
          })
        ])
      )
    })

    it('should create user with all required fields', async () => {
      await seedDatabase()

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
          password: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      )
    })
  })
})