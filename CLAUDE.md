  # Corkboard Development Guide

  ## Project Structure
  - **Frontend**: Next.js 15 with React 19, Tailwind CSS 4
  - **Database**: SQLite with Drizzle ORM
  - **Auth**: NextAuth.js with credentials provider
  - **Editor**: Froala WYSIWYG editor
  - **Icons**: @heroicons/react (standardized)

  ## Key Commands
  - `npm run dev` - Start development server with turbopack
  - `npm run build` - Build for production
  - `npm run db:seed` - Seed database with default roles and admin user
  - `npm run lint` - Run ESLint
  - `npm run test` - Run unit tests with Jest
  - `npm run test:watch` - Run tests in watch mode
  - `npm run test:coverage` - Run tests with coverage report

  ## Database & Permissions
  - Default admin: admin@example.com / admin123
  - Roles: admin, editor, viewer, scrapper
  - Scrapper role: create/read/update scraps, view_all, update_self (no delete, no admin)
  - Permission system uses resource:action pattern

  ## Code Standards
  - No DraftJS dependencies (removed)
  - Use @heroicons/react for all icons
  - Paragraph styling: margin:0, line-height:1, text-indent:2em
  - Permission checks in all API routes
  - Froala editor for rich text content

  ## Testing
  - Jest configured with Next.js integration
  - 238 unit tests with 100% passing rate (232 passed, 6 skipped)
  - Test files: `src/**/__tests__/**/*.test.ts` and `tests/**/*.test.ts`
  - Mock configurations for Next.js components and NextAuth
  - Run `npm run test` after making changes to verify functionality
  - 6 tests skipped with @TODO comments for mock isolation and structure issues
  
  ## Development Workflow
  - Always run tests after making code changes: `npm run test`
  - Run linting before committing: `npm run lint`
  - For complex changes affecting multiple components, run full test suite
  - Use test watch mode during development: `npm run test:watch`

  ## Architecture Notes
  - Scraps: User-created content with x/y positioning on infinite canvas
  - Shift+click creates scrap at cursor position
  - Move mode for repositioning scraps
  - Public/private scrap visibility system
  - Role-based access control throughout
  
  ## File Editing Guidelines for Claude
  - When editing TypeScript files, avoid using generic strings that match multiple locations
  - Use sufficient context (3-5 lines before/after) to make string replacements unique
  - If encountering "multiple matches" error, add more surrounding code context
  - The Edit tool requires exact whitespace/indentation matching from Read tool output
  - Use MultiEdit tool for multiple changes to the same file
  - Always Read a file before editing to understand current structure
  
  ## Dependencies & Overrides
  - Added punycode.js override to fix deprecation warnings in test suite
  - Project uses package.json overrides to manage dependency conflicts
  - Test environment may show deprecation warnings that are handled via overrides
  
  ## Auto-Commit Reminder
  - Always commit changes with descriptive messages
  - Use `git add -A && git commit -m "Description"` pattern
  - Include testing status in commit messages
  - Follow conventional commit format for consistency
