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

  ## Architecture Notes
  - Scraps: User-created content with x/y positioning on infinite canvas
  - Shift+click creates scrap at cursor position
  - Move mode for repositioning scraps
  - Public/private scrap visibility system
  - Role-based access control throughout
