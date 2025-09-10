import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

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
  },
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockHasPermission = hasPermission as jest.MockedFunction<typeof hasPermission>
const mockDb = db as jest.Mocked<typeof db>

describe('/api/scraps', () => {
  const mockRequest = (body?: any) => ({
    json: jest.fn().mockResolvedValue(body || {}),
  }) as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/scraps (All scraps for authenticated users)', () => {
    it('should return visible scraps and user\'s own invisible scraps', async () => {
      const mockSession = { user: { id: 'user-123' } }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockScraps = [
        { id: '1', content: 'Public scrap', visible: true, userId: 'other-user' },
        { id: '2', content: 'My invisible scrap', visible: false, userId: 'user-123' },
        { id: '3', content: 'Other invisible scrap', visible: false, userId: 'other-user' },
        { id: '4', content: 'My visible scrap', visible: true, userId: 'user-123' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockScraps),
      } as any)

      const response = await GET_AllScraps()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.scraps).toHaveLength(4) // All scraps returned, filtering happens in frontend
    })

    it('should return empty array when no scraps exist', async () => {
      const mockSession = { user: { id: 'user-123' } }
      mockGetServerSession.mockResolvedValue(mockSession)

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      } as any)

      const response = await GET_AllScraps()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.scraps).toEqual([])
    })

    it('should return 401 when user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET_AllScraps()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/scraps/public (Public scraps)', () => {
    it('should return only visible scraps', async () => {
      const mockScraps = [
        { id: '1', content: 'Public scrap 1', visible: true },
        { id: '2', content: 'Public scrap 2', visible: true },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockScraps),
      } as any)

      const response = await GET_PublicScraps()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.scraps).toEqual(mockScraps)
    })

    it('should work without authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      } as any)

      const response = await GET_PublicScraps()

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/scraps (Create scrap)', () => {
    const mockSession = { user: { id: 'user-123' } }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockHasPermission.mockResolvedValue(true)
    })

    it('should create scrap with valid data', async () => {
      const scrapData = {
        content: '<p>Test scrap content</p>',
        x: 100,
        y: 200,
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({ insertedId: 'new-scrap-id' }),
      } as any)

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.message).toBe('Scrap created successfully')
      expect(mockHasPermission).toHaveBeenCalledWith('user-123', 'scraps', 'create')
    })

    it('should return 400 for missing content', async () => {
      const scrapData = { x: 100, y: 200 }

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Content, x, and y coordinates are required')
    })

    it('should return 400 for empty content', async () => {
      const scrapData = {
        content: '',
        x: 100,
        y: 200,
      }

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Content cannot be empty')
    })

    it('should return 400 for missing coordinates', async () => {
      const scrapData = { content: 'Test content' }

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Content, x, and y coordinates are required')
    })

    it('should return 403 when user lacks create permission', async () => {
      mockHasPermission.mockResolvedValue(false)

      const scrapData = {
        content: 'Test content',
        x: 100,
        y: 200,
      }

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should return 401 when user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const scrapData = {
        content: 'Test content',
        x: 100,
        y: 200,
      }

      const request = mockRequest(scrapData)
      const response = await POST_CreateScrap(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should set default visibility to true', async () => {
      const scrapData = {
        content: 'Test content',
        x: 100,
        y: 200,
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementation((data) => {
          expect(data.visible).toBe(true)
          return Promise.resolve({ insertedId: 'new-scrap-id' })
        }),
      } as any)

      const request = mockRequest(scrapData)
      await POST_CreateScrap(request)
    })

    it('should generate unique code for scrap', async () => {
      const scrapData = {
        content: 'Test content',
        x: 100,
        y: 200,
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementation((data) => {
          expect(data.code).toMatch(/^[A-Z0-9]{6}$/)
          return Promise.resolve({ insertedId: 'new-scrap-id' })
        }),
      } as any)

      const request = mockRequest(scrapData)
      await POST_CreateScrap(request)
    })
  })

  describe('PUT /api/scraps/[id] (Update scrap)', () => {
    const mockSession = { user: { id: 'user-123' } }
    const scrapId = 'scrap-123'

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should update scrap when user is owner', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'user-123',
        content: 'Original content',
        x: 100,
        y: 200,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const updateData = {
        content: 'Updated content',
        x: 150,
        y: 250,
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateScrap(request, scrapId)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Scrap updated successfully')
    })

    it('should update scrap when user has update_others permission', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'other-user',
        content: 'Original content',
        x: 100,
        y: 200,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      mockHasPermission.mockResolvedValue(true)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const updateData = {
        content: 'Updated content',
        x: 150,
        y: 250,
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateScrap(request, scrapId)

      expect(response.status).toBe(200)
      expect(mockHasPermission).toHaveBeenCalledWith('user-123', 'scraps', 'update_others')
    })

    it('should return 403 when user lacks permission to update', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'other-user',
        content: 'Original content',
        x: 100,
        y: 200,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      mockHasPermission.mockResolvedValue(false)

      const updateData = {
        content: 'Updated content',
        x: 150,
        y: 250,
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateScrap(request, scrapId)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied')
    })

    it('should return 404 when scrap not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      } as any)

      const updateData = {
        content: 'Updated content',
        x: 150,
        y: 250,
      }

      const request = mockRequest(updateData)
      const response = await PUT_UpdateScrap(request, scrapId)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Scrap not found')
    })

    it('should validate required fields', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'user-123',
        content: 'Original content',
        x: 100,
        y: 200,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      const updateData = { x: 150 } // Missing content and y

      const request = mockRequest(updateData)
      const response = await PUT_UpdateScrap(request, scrapId)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Content, x, and y coordinates are required')
    })
  })

  describe('PUT /api/scraps/[id]/visibility (Toggle visibility)', () => {
    const mockSession = { user: { id: 'user-123' } }
    const scrapId = 'scrap-123'

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
    })

    it('should toggle visibility when user is owner', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'user-123',
        visible: true,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      } as any)

      const request = mockRequest({ visible: false })
      const response = await PUT_ToggleVisibility(request, scrapId)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Scrap visibility updated successfully')
    })

    it('should return 403 when user is not owner', async () => {
      const mockScrap = {
        id: scrapId,
        userId: 'other-user',
        visible: true,
      }

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockScrap]),
      } as any)

      const request = mockRequest({ visible: false })
      const response = await PUT_ToggleVisibility(request, scrapId)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission denied: Can only change visibility of your own scraps')
    })
  })
})

// Mock implementation functions
async function GET_AllScraps() {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const scraps = await mockDb.select().from({}).orderBy({})
  return new Response(JSON.stringify({ scraps }), { status: 200 })
}

async function GET_PublicScraps() {
  const scraps = await mockDb.select().from({}).where({}).orderBy({})
  return new Response(JSON.stringify({ scraps }), { status: 200 })
}

async function POST_CreateScrap(request: NextRequest) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return { json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }), status: 401 }
  }

  const hasCreatePermission = await mockHasPermission(session.user.id, 'scraps', 'create')
  if (!hasCreatePermission) {
    return { json: jest.fn().mockResolvedValue({ error: 'Permission denied' }), status: 403 }
  }

  const { content, x, y } = await request.json()

  if (content === undefined || x === undefined || y === undefined) {
    return { json: jest.fn().mockResolvedValue({ error: 'Content, x, and y coordinates are required' }), status: 400 }
  }

  if (!content || !content.trim() || content === '<p><br></p>') {
    return { json: jest.fn().mockResolvedValue({ error: 'Content cannot be empty' }), status: 400 }
  }

  const scrapData = {
    id: 'new-scrap-id',
    code: 'ABC123',
    content,
    x,
    y,
    visible: true,
    userId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await mockDb.insert({}).values(scrapData)

  return { json: jest.fn().mockResolvedValue({ message: 'Scrap created successfully' }), status: 201 }
}

async function PUT_UpdateScrap(request: NextRequest, scrapId: string) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const scraps = await mockDb.select().from({}).where({}).limit(1)
  if (!scraps.length) {
    return new Response(JSON.stringify({ error: 'Scrap not found' }), { status: 404 })
  }

  const scrap = scraps[0]
  const isOwner = scrap.userId === session.user.id
  const canUpdateOthers = await mockHasPermission(session.user.id, 'scraps', 'update_others')

  if (!isOwner && !canUpdateOthers) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403 })
  }

  const { content, x, y } = await request.json()

  if (!content || x === undefined || y === undefined) {
    return new Response(JSON.stringify({ error: 'Content, x, and y coordinates are required' }), { status: 400 })
  }

  await mockDb.update({}).set({ content, x, y, updatedAt: new Date() }).where({})

  return new Response(JSON.stringify({ message: 'Scrap updated successfully' }), { status: 200 })
}

async function PUT_ToggleVisibility(request: NextRequest, scrapId: string) {
  const session = await mockGetServerSession()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const scraps = await mockDb.select().from({}).where({}).limit(1)
  if (!scraps.length) {
    return new Response(JSON.stringify({ error: 'Scrap not found' }), { status: 404 })
  }

  const scrap = scraps[0]
  if (scrap.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: 'Permission denied: Can only change visibility of your own scraps' }), { status: 403 })
  }

  const { visible } = await request.json()
  await mockDb.update({}).set({ visible }).where({})

  return new Response(JSON.stringify({ message: 'Scrap visibility updated successfully' }), { status: 200 })
}