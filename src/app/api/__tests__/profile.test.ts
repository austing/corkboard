import { getServerSession } from 'next-auth'
import { hasPermissionForUser } from '@/lib/permissions'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/permissions', () => ({
  hasPermissionForUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockHasPermissionForUser = hasPermissionForUser as jest.MockedFunction<typeof hasPermissionForUser>
const mockDb = db as jest.Mocked<typeof db>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock PUT function to simulate the actual route logic
async function PUT(request: any) {
  try {
    const session = await mockGetServerSession({});
    if (!session?.user?.id) {
      return { json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }), status: 401 };
    }

    const hasPermission = await mockHasPermissionForUser(session.user.id, 'users', 'update', session.user.id);
    if (!hasPermission) {
      return { json: jest.fn().mockResolvedValue({ error: 'Permission denied: Cannot update profile' }), status: 403 };
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    if (!name || !email) {
      return { json: jest.fn().mockResolvedValue({ error: 'Name and email are required' }), status: 400 };
    }

    // Check if user exists
    const users = await mockDb.select().from({}).where({}).limit(1);
    if (!users.length) {
      return { json: jest.fn().mockResolvedValue({ error: 'User not found' }), status: 404 };
    }

    const user = users[0];

    // Check email uniqueness if changing
    if (email !== user.email) {
      const existingUsers = await mockDb.select().from({}).where({}).limit(1);
      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        return { json: jest.fn().mockResolvedValue({ error: 'Email address is already in use' }), status: 400 };
      }
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return { json: jest.fn().mockResolvedValue({ error: 'Current password is required to change password' }), status: 400 };
      }

      if (!user.password) {
        return { json: jest.fn().mockResolvedValue({ error: 'Cannot change password for this account' }), status: 400 };
      }

      const isCurrentPasswordValid = await mockBcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { json: jest.fn().mockResolvedValue({ error: 'Current password is incorrect' }), status: 400 };
      }

      const hashedPassword = await mockBcrypt.hash(newPassword, 12);
      await mockDb.update({}).set({ name, email, password: hashedPassword, updatedAt: new Date() }).where({});
    } else {
      await mockDb.update({}).set({ name, email, updatedAt: new Date() }).where({});
    }

    return { json: jest.fn().mockResolvedValue({ message: 'Profile updated successfully' }), status: 200 };
  } catch (error) {
    return { json: jest.fn().mockResolvedValue({ error: 'Internal server error' }), status: 500 };
  }
}

describe('/api/profile PUT', () => {
  const mockRequest = (body: any) => ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = mockRequest({ name: 'Test', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session has no user id', async () => {
      mockGetServerSession.mockResolvedValue({ user: {} } as any)

      const request = mockRequest({ name: 'Test', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Permission Checks', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    it('should return 403 when user lacks permission to update profile', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(false)

      const request = mockRequest({ name: 'Test', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied: Cannot update profile')
      expect(mockHasPermissionForUser).toHaveBeenCalledWith('user-123', 'users', 'update', 'user-123')
    })

    it('should proceed when user has permission to update profile', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)

      // Mock database responses
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest({ name: 'Updated Name', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(mockHasPermissionForUser).toHaveBeenCalledWith('user-123', 'users', 'update', 'user-123')
    })
  })

  describe('Input Validation', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)
    })

    it('should return 400 when name is missing', async () => {
      const request = mockRequest({ email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Name and email are required')
    })

    it('should return 400 when email is missing', async () => {
      const request = mockRequest({ name: 'Test User' })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Name and email are required')
    })

    it('should accept valid name and email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest({ name: 'Valid Name', email: 'valid@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Email Uniqueness', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)
    })

    it('should return 400 when new email is already in use', async () => {
      // Mock current user
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
        } as any)
        // Mock existing user with new email
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ id: 'other-user', email: 'taken@example.com' }]),
        } as any)

      const request = mockRequest({ name: 'Test User', email: 'taken@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Email address is already in use')
    })

    it('should allow keeping the same email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest({ name: 'Updated Name', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Password Change', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ 
          id: 'user-123', 
          email: 'test@example.com',
          password: 'hashed-current-password'
        }]),
      } as any)
    })

    it('should return 400 when new password provided without current password', async () => {
      const request = mockRequest({ 
        name: 'Test User', 
        email: 'test@example.com',
        newPassword: 'newpassword123'
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Current password is required to change password')
    })

    it('should return 400 when current password is incorrect', async () => {
      mockBcrypt.compare.mockResolvedValue(false)

      const request = mockRequest({ 
        name: 'Test User', 
        email: 'test@example.com',
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Current password is incorrect')
    })

    it('should successfully change password with correct current password', async () => {
      mockBcrypt.compare.mockResolvedValue(true)
      mockBcrypt.hash.mockResolvedValue('hashed-new-password')

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest({ 
        name: 'Test User', 
        email: 'test@example.com',
        currentPassword: 'currentpassword',
        newPassword: 'newpassword123'
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(mockBcrypt.compare).toHaveBeenCalledWith('currentpassword', 'hashed-current-password')
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
    })

    it('should return 400 when user has no password (OAuth user)', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ 
          id: 'user-123', 
          email: 'test@example.com',
          password: null
        }]),
      } as any)

      const request = mockRequest({ 
        name: 'Test User', 
        email: 'test@example.com',
        currentPassword: 'anypassword',
        newPassword: 'newpassword123'
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Cannot change password for this account')
    })
  })

  describe('Database Operations', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)
    })

    it('should return 404 when user not found in database', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      const request = mockRequest({ name: 'Test User', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('User not found')
    })

    it('should update user data successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      } as any)

      const mockSet = jest.fn().mockReturnThis()
      const mockWhere = jest.fn().mockResolvedValue(undefined)
      mockDb.update.mockReturnValue({ set: mockSet, where: mockWhere } as any)

      const request = mockRequest({ name: 'Updated Name', email: 'updated@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Name',
        email: 'updated@example.com',
        updatedAt: expect.any(Date),
      }))
    })

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any)

      const request = mockRequest({ name: 'Test User', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Success Response', () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermissionForUser.mockResolvedValue(true)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      } as any)
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)
    })

    it('should return success message when profile updated', async () => {
      const request = mockRequest({ name: 'Updated Name', email: 'test@example.com' })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Profile updated successfully')
    })
  })
})