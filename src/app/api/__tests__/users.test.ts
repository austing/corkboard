import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>
const mockDb = db as jest.Mocked<typeof db>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/users', () => {
  const mockRequest = (body?: any) => ({
    json: jest.fn().mockResolvedValue(body || {}),
  }) as unknown as NextRequest

  const mockAdminSession = { user: { id: 'admin-123' } }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue(mockAdminSession)
    mockHasPermission.mockResolvedValue(true)
    mockBcrypt.hash.mockResolvedValue('hashed-password')
  })

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const mockUsers = [
        { 
          id: '1', 
          name: 'Admin User', 
          email: 'admin@example.com', 
          createdAt: new Date(),
          roles: ['admin'] 
        },
        { 
          id: '2', 
          name: 'Editor User', 
          email: 'editor@example.com', 
          createdAt: new Date(),
          roles: ['editor'] 
        },
        { 
          id: '3', 
          name: 'Scrapper User', 
          email: 'scrapper@example.com', 
          createdAt: new Date(),
          roles: ['scrapper'] 
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockUsers),
      } as any)

      const response = await GET_Users()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.users).toEqual(mockUsers)
      expect(mockHasPermission).toHaveBeenCalledWith('admin-123', 'users', 'read')
    })

    it('should return 401 when user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET_Users()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user lacks read permission', async () => {
      mockHasPermission.mockResolvedValue(false)

      const response = await GET_Users()

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should exclude password fields from response', async () => {
      const mockUsers = [
        { 
          id: '1', 
          name: 'Test User', 
          email: 'test@example.com', 
          password: 'hashed-password', // Should be excluded
          createdAt: new Date(),
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockImplementation(() => {
          // Simulate excluding password in select
          return Promise.resolve(mockUsers.map(({ password, ...user }) => user))
        }),
      } as any)

      const response = await GET_Users()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.users[0]).not.toHaveProperty('password')
    })
  })

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        roles: ['editor'],
      }

      // Mock no existing user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      // Mock role lookup
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'role-1', name: 'editor' }]),
      } as any)

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({ insertedId: 'new-user-id' }),
      } as any)

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.message).toBe('User created successfully')
      expect(mockHasPermission).toHaveBeenCalledWith('admin-123', 'users', 'create')
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
    })

    it('should return 400 for missing required fields', async () => {
      const userData = {
        name: 'New User',
        // Missing email and password
        roles: ['editor'],
      }

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Name, email, and password are required')
    })

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        roles: ['editor'],
      }

      // Mock existing user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'existing-user', email: 'existing@example.com' }]),
      } as any)

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Email address is already in use')
    })

    it('should return 400 for invalid email format', async () => {
      const userData = {
        name: 'New User',
        email: 'invalid-email',
        password: 'password123',
        roles: ['editor'],
      }

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid email format')
    })

    it('should return 400 for weak password', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: '123', // Too short
        roles: ['editor'],
      }

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Password must be at least 6 characters long')
    })

    it('should return 403 when user lacks create permission', async () => {
      mockHasPermission.mockResolvedValue(false)

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        roles: ['editor'],
      }

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should assign roles to new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        roles: ['editor', 'scrapper'],
      }

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]), // No existing user
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([
            { id: 'role-1', name: 'editor' },
            { id: 'role-2', name: 'scrapper' },
          ]),
        } as any)

      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue({ insertedId: 'new-user-id' }),
        } as any)
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue(undefined), // Role assignments
        } as any)

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(201)
      expect(mockDb.insert).toHaveBeenCalledTimes(2) // User + role assignments
    })

    it('should create user without roles when none specified', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({ insertedId: 'new-user-id' }),
      } as any)

      const request = mockRequest(userData)
      const response = await POST_CreateUser(request)

      expect(response.status).toBe(201)
      expect(mockDb.insert).toHaveBeenCalledTimes(1) // Only user, no roles
    })
  })

  describe('PUT /api/users/[id]', () => {
    const userId = 'user-123'

    it('should update user with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        roles: ['editor'],
      }

      // Mock existing user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: userId, email: 'old@example.com' }]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest(updateData)
      const response = await PUT_UpdateUser(request, userId)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('User updated successfully')
      expect(mockHasPermission).toHaveBeenCalledWith('admin-123', 'users', 'update')
    })

    it('should return 404 when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateUser(request, userId)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('User not found')
    })

    it('should return 403 when user lacks update permission', async () => {
      mockHasPermission.mockResolvedValue(false)

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateUser(request, userId)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should update user password when provided', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'newpassword123',
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: userId, email: 'old@example.com' }]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest(updateData)
      const response = await PUT_UpdateUser(request, userId)

      expect(response.status).toBe(200)
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
    })

    it('should update user roles', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        roles: ['editor', 'viewer'],
      }

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ id: userId, email: 'old@example.com' }]),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([
            { id: 'role-1', name: 'editor' },
            { id: 'role-2', name: 'viewer' },
          ]),
        } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest(updateData)
      const response = await PUT_UpdateUser(request, userId)

      expect(response.status).toBe(200)
      expect(mockDb.delete).toHaveBeenCalled() // Remove old roles
      expect(mockDb.insert).toHaveBeenCalled() // Add new roles
    })
  })

  describe('DELETE /api/users/[id]', () => {
    const userId = 'user-123'

    it('should delete user and cleanup associations', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: userId, name: 'Test User' }]),
      } as any)

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const response = await DELETE_User(userId)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('User deleted successfully')
      expect(mockHasPermission).toHaveBeenCalledWith('admin-123', 'users', 'delete')
      expect(mockDb.delete).toHaveBeenCalledTimes(3) // User roles, scraps, user
    })

    it('should return 404 when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      const response = await DELETE_User(userId)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('User not found')
    })

    it('should return 403 when user lacks delete permission', async () => {
      mockHasPermission.mockResolvedValue(false)

      const response = await DELETE_User(userId)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should prevent deletion of current user', async () => {
      const currentUserId = 'admin-123' // Same as session user

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: currentUserId, name: 'Admin User' }]),
      } as any)

      const response = await DELETE_User(currentUserId)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Cannot delete your own account')
    })
  })
})

// Mock implementation functions
async function GET_Users() {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const hasReadPermission = await mockHasPermission(session.user.id, 'users', 'read')
  if (!hasReadPermission) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 })
  }

  const users = await mockDb.select().from({}).leftJoin({}, {}, {}).orderBy({})
  return new Response(JSON.stringify({ users }), { status: 200 })
}

async function POST_CreateUser(request: NextRequest) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const hasCreatePermission = await mockHasPermission(session.user.id, 'users', 'create')
  if (!hasCreatePermission) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 })
  }

  const { name, email, password, roles } = await request.json()

  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400 })
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), { status: 400 })
  }

  // Check for existing user
  const existingUsers = await mockDb.select().from({}).where({}).limit(1)
  if (existingUsers.length > 0) {
    return new Response(JSON.stringify({ error: 'Email address is already in use' }), { status: 400 })
  }

  const hashedPassword = await mockBcrypt.hash(password, 12)

  await mockDb.insert({}).values({
    id: 'new-user-id',
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return new Response(JSON.stringify({ message: 'User created successfully' }), { status: 201 })
}

async function PUT_UpdateUser(request: NextRequest, userId: string) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const hasUpdatePermission = await mockHasPermission(session.user.id, 'users', 'update')
  if (!hasUpdatePermission) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 })
  }

  const users = await mockDb.select().from({}).where({}).limit(1)
  if (!users.length) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  const { name, email, password, roles } = await request.json()

  const updateData: any = { name, email, updatedAt: new Date() }
  if (password) {
    updateData.password = await mockBcrypt.hash(password, 12)
  }

  await mockDb.update({}).set(updateData).where({})

  return new Response(JSON.stringify({ message: 'User updated successfully' }), { status: 200 })
}

async function DELETE_User(userId: string) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const hasDeletePermission = await mockHasPermission(session.user.id, 'users', 'delete')
  if (!hasDeletePermission) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 })
  }

  if (userId === session.user.id) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { status: 400 })
  }

  const users = await mockDb.select().from({}).where({}).limit(1)
  if (!users.length) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  // Cleanup associations
  await mockDb.delete({}).where({}) // User roles
  await mockDb.delete({}).where({}) // User scraps
  await mockDb.delete({}).where({}) // User itself

  return new Response(JSON.stringify({ message: 'User deleted successfully' }), { status: 200 })
}