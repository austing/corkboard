import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock dynamic imports
jest.mock('next/dynamic', () => (fn) => {
  const Component = fn()
  Component.displayName = 'DynamicComponent'
  return Component
})

// Setup fetch mock
global.fetch = jest.fn()

// Mock crypto for Node.js compatibility
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock Next.js Request and Response
global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: options?.method || 'GET',
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockResolvedValue(options?.body ? JSON.parse(options.body) : {}),
}))

global.Response = jest.fn().mockImplementation((body, options) => ({
  status: options?.status || 200,
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 200,
    })),
  },
}))