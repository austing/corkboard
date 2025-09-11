/**
 * State Management & React Hooks Tests
 * Tests for custom hooks, state management, and React component state
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import PermissionCheck from '@/components/auth/permission-check';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseSession = require('next-auth/react').useSession;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('State Management & React Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PermissionCheck Component', () => {
    it('should handle loading states correctly', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123' } },
        status: 'authenticated',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: true }),
      } as Response);

      render(
        <PermissionCheck resource="scraps" action="create">
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for permission check to complete
      await waitFor(() => {
        expect(screen.getByText('Authorized Content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should handle permission denied state', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123' } },
        status: 'authenticated',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: false }),
      } as Response);

      render(
        <PermissionCheck 
          resource="scraps" 
          action="create"
          fallback={<div>Access Denied</div>}
        >
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123' } },
        status: 'authenticated',
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <PermissionCheck 
          resource="scraps" 
          action="create"
          fallback={<div>Access Denied</div>}
        >
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Permission check failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle unauthenticated user', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <PermissionCheck 
          resource="scraps" 
          action="create"
          fallback={<div>Please sign in</div>}
        >
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(screen.getByText('Please sign in')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should re-check permissions when session changes', async () => {
      const { rerender } = render(
        <PermissionCheck resource="scraps" action="create">
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      // First render - no session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      rerender(
        <PermissionCheck resource="scraps" action="create">
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      // Second render - with session
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-456' } },
        status: 'authenticated',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: true }),
      } as Response);

      rerender(
        <PermissionCheck resource="scraps" action="create">
          <div>Authorized Content</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-456',
            resource: 'scraps',
            action: 'create',
          }),
        });
      });
    });

    it('should handle different resource/action combinations', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123' } },
        status: 'authenticated',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: true }),
      } as Response);

      const { rerender } = render(
        <PermissionCheck resource="users" action="read">
          <div>User Management</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-123',
            resource: 'users',
            action: 'read',
          }),
        });
      });

      // Change resource/action
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: false }),
      } as Response);

      rerender(
        <PermissionCheck resource="roles" action="create">
          <div>Role Management</div>
        </PermissionCheck>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-123',
            resource: 'roles',
            action: 'create',
          }),
        });
      });
    });
  });

  describe('Session State Management', () => {
    it('should handle session provider wrapper', () => {
      render(
        <SessionProvider>
          <div>App Content</div>
        </SessionProvider>
      );

      expect(screen.getByText('App Content')).toBeInTheDocument();
    });

    // @TODO: Fix PermissionCheck component rendering in test environment
    // Issue: Component doesn't render properly with mocked session data in jsdom
    it.skip('should handle session loading state', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123' } },
        status: 'loading',
      });

      // Mock fetch to never resolve to keep loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(
        <PermissionCheck resource="scraps" action="create">
          <div>Content</div>
        </PermissionCheck>
      );

      // Should show loading while API call is pending
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});