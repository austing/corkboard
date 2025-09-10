import { getUserPermissions, hasPermission, hasPermissionForUser, requirePermission, Permission } from '../permissions'
import { db } from '../db'

// Mock the database module
jest.mock('../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  },
}))

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}))

const mockDb = db as jest.Mocked<typeof db>

describe('Permissions System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserPermissions', () => {
    it('should return user permissions from database', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:read', resource: 'users', action: 'read' },
        { permission: 'scraps:create', resource: 'scraps', action: 'create' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      const result = await getUserPermissions('user-123')

      expect(result).toEqual(mockPermissions)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should return empty array when user has no permissions', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await getUserPermissions('user-no-perms')

      expect(result).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has the required permission', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:read', resource: 'users', action: 'read' },
        { permission: 'scraps:create', resource: 'scraps', action: 'create' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      const result = await hasPermission('user-123', 'users', 'read')

      expect(result).toBe(true)
    })

    it('should return false when user does not have the required permission', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:read', resource: 'users', action: 'read' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      const result = await hasPermission('user-123', 'users', 'delete')

      expect(result).toBe(false)
    })

    it('should return false when user has no permissions', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await hasPermission('user-123', 'users', 'read')

      expect(result).toBe(false)
    })
  })

  describe('hasPermissionForUser', () => {
    it('should check self permission first when target user is same as requesting user', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:update_self', resource: 'users', action: 'update_self' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      const result = await hasPermissionForUser('user-123', 'users', 'update', 'user-123')

      expect(result).toBe(true)
    })

    it('should fall back to general permission when self permission not found', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:update', resource: 'users', action: 'update' },
      ]

      // First call returns no self permission, second call returns general permission
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockPermissions),
        } as any)

      const result = await hasPermissionForUser('user-123', 'users', 'update', 'user-123')

      expect(result).toBe(true)
    })

    it('should check general permission when target user is different', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:update', resource: 'users', action: 'update' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      const result = await hasPermissionForUser('user-123', 'users', 'update', 'user-456')

      expect(result).toBe(true)
    })

    it('should return false when no permissions found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      } as any)

      const result = await hasPermissionForUser('user-123', 'users', 'update', 'user-456')

      expect(result).toBe(false)
    })
  })

  describe('requirePermission', () => {
    it('should not throw when user has the required permission', async () => {
      const mockPermissions: Permission[] = [
        { permission: 'users:read', resource: 'users', action: 'read' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockPermissions),
      } as any)

      await expect(requirePermission('user-123', 'users', 'read')).resolves.not.toThrow()
    })

    it('should throw error when user does not have the required permission', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      } as any)

      await expect(requirePermission('user-123', 'users', 'delete'))
        .rejects.toThrow('Access denied: users:delete')
    })

    it('should throw with correct resource and action in error message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      } as any)

      await expect(requirePermission('user-123', 'scraps', 'create'))
        .rejects.toThrow('Access denied: scraps:create')
    })
  })

  describe('Scrapper Role Specific Tests', () => {
    it('should allow scrapper to create scraps', async () => {
      const scrapperPermissions: Permission[] = [
        { permission: 'scraps:create', resource: 'scraps', action: 'create' },
        { permission: 'scraps:read', resource: 'scraps', action: 'read' },
        { permission: 'scraps:update', resource: 'scraps', action: 'update' },
        { permission: 'scraps:view_all', resource: 'scraps', action: 'view_all' },
        { permission: 'users:update_self', resource: 'users', action: 'update_self' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(scrapperPermissions),
      } as any)

      const canCreate = await hasPermission('scrapper-user', 'scraps', 'create')
      const canRead = await hasPermission('scrapper-user', 'scraps', 'read')
      const canUpdate = await hasPermission('scrapper-user', 'scraps', 'update')
      const canViewAll = await hasPermission('scrapper-user', 'scraps', 'view_all')
      const canUpdateSelf = await hasPermission('scrapper-user', 'users', 'update_self')

      expect(canCreate).toBe(true)
      expect(canRead).toBe(true)
      expect(canUpdate).toBe(true)
      expect(canViewAll).toBe(true)
      expect(canUpdateSelf).toBe(true)
    })

    it('should not allow scrapper to delete scraps', async () => {
      const scrapperPermissions: Permission[] = [
        { permission: 'scraps:create', resource: 'scraps', action: 'create' },
        { permission: 'scraps:read', resource: 'scraps', action: 'read' },
        { permission: 'scraps:update', resource: 'scraps', action: 'update' },
        { permission: 'scraps:view_all', resource: 'scraps', action: 'view_all' },
        { permission: 'users:update_self', resource: 'users', action: 'update_self' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(scrapperPermissions),
      } as any)

      const canDelete = await hasPermission('scrapper-user', 'scraps', 'delete')
      const canDeleteOthers = await hasPermission('scrapper-user', 'scraps', 'delete_others')
      const canCreateForOthers = await hasPermission('scrapper-user', 'scraps', 'create_for_others')
      const canUpdateOthers = await hasPermission('scrapper-user', 'scraps', 'update_others')

      expect(canDelete).toBe(false)
      expect(canDeleteOthers).toBe(false)
      expect(canCreateForOthers).toBe(false)
      expect(canUpdateOthers).toBe(false)
    })

    it('should not allow scrapper to access admin functions', async () => {
      const scrapperPermissions: Permission[] = [
        { permission: 'scraps:create', resource: 'scraps', action: 'create' },
        { permission: 'scraps:read', resource: 'scraps', action: 'read' },
        { permission: 'scraps:update', resource: 'scraps', action: 'update' },
        { permission: 'scraps:view_all', resource: 'scraps', action: 'view_all' },
        { permission: 'users:update_self', resource: 'users', action: 'update_self' },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(scrapperPermissions),
      } as any)

      const canAccessAdmin = await hasPermission('scrapper-user', 'admin', 'access')
      const canCreateUsers = await hasPermission('scrapper-user', 'users', 'create')
      const canUpdateUsers = await hasPermission('scrapper-user', 'users', 'update')
      const canDeleteUsers = await hasPermission('scrapper-user', 'users', 'delete')

      expect(canAccessAdmin).toBe(false)
      expect(canCreateUsers).toBe(false)
      expect(canUpdateUsers).toBe(false)
      expect(canDeleteUsers).toBe(false)
    })
  })
})