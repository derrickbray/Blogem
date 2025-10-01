# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Client)
- `cd client && npm start` - Start React development server on http://localhost:3000
- `cd client && npm run build` - Build production React app
- `cd client && npm test` - Run React tests

### Backend (Server)
- `cd server && npm start` - Start Node.js production server on port 5000
- `cd server && npm run dev` - Start development server with nodemon for auto-restart
- `cd server && npm test` - Run server tests (currently not configured)

### Database Setup
- Start XAMPP and ensure MySQL is running
- Create database: `bray_report`
- Import schema: `database/blog_schema.sql`
- Set up server environment: Create `server/.env` with database credentials and JWT_SECRET

## Architecture Overview

### Blog Platform
This is "Bray Report" - a modern blog platform with content management system featuring:
- **Posts** with rich text editing, categories, and tags
- **Public blog** for readers to browse published content
- **Admin dashboard** for content management
- **SEO optimization** with meta fields and structured data

### Technology Stack
- **Frontend**: React 19 + React Router DOM + React-Quill-New (rich text editor)
- **Backend**: Node.js + Express.js + MySQL
- **Authentication**: JWT tokens with bcryptjs password hashing
- **State Management**: React Context API with forwardRef for cross-component communication
- **API Communication**: Axios with interceptors for auth tokens

### Key Architecture Patterns
- RESTful API design with both admin and public endpoints
- Protected routes using JWT middleware for admin functions
- Component-based React architecture with shared context
- Direct function calls for admin navigation (bypassing React Router same-route limitations)
- CSS organization with separated concerns (base, components, layout, admin, public, theme)

### Directory Structure
```
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Organized by feature (auth, blog, common, legacy)
│   │   │   ├── blog/         # PostEditor, PostList - core blog components
│   │   │   ├── auth/         # LoginForm, RegisterForm
│   │   │   └── common/       # Navigation, RichTextEditor, ProtectedRoute
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # AdminDashboard (posts management)
│   │   │   ├── auth/         # LoginPage, RegisterPage
│   │   │   └── public/       # HomePage, PublicBlog, PublicPost
│   │   ├── context/          # AuthContext for user state
│   │   ├── services/         # API service layer (blogService, authService)
│   │   └── styles/           # Organized CSS (base, components, layout, admin, public, theme)
├── server/                   # Node.js backend
│   ├── routes/              # API endpoints (auth, posts, categories, tags, legacy)
│   ├── middleware/          # Authentication middleware
│   ├── config/              # Database configuration
│   └── app.js               # Express server entry point
└── database/
    ├── blog_schema.sql      # Current blog database structure
    └── migration_plan.sql   # Historical migration from Projects system
```

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

#### Blog Posts (Admin - Authentication Required)
- `GET /api/posts` - Get all posts for current user (admin view with filtering)
- `GET /api/posts/:id` - Get single post for editing
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

#### Blog Posts (Public - No Authentication)
- `GET /api/posts/public` - Get published posts (with pagination, category/tag filtering)
- `GET /api/posts/public/:slug` - Get single published post by slug

#### Categories & Tags (Admin)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag

### Database Schema

#### Core Tables
- **Users**: Authentication and user management with roles (user/admin)
- **Posts**: Blog posts with rich content, SEO fields, and publishing workflow
- **Categories**: Organize posts into topics (many-to-many via Post_Categories)
- **Tags**: Tag posts for filtering (many-to-many via Post_Tags)

#### Key Fields
- **Posts**: title, slug, excerpt, content (HTML), author_id, status (draft/published/archived), published_at, meta_title, meta_description, view_count
- **Relationships**: Posts → Users (author), Posts ↔ Categories, Posts ↔ Tags

#### Legacy Tables (Unused)
- Projects, Stories, Chapters, Files - from original 3-level writing platform (kept for historical reference)

### Environment Configuration
- Client environment: `client/.env` sets `REACT_APP_API_URL=http://localhost:5000/api`
- Server environment: `server/.env` requires database credentials and JWT_SECRET

### Process Management (Important for Claude Code)
- **NEVER use `taskkill //F //IM node.exe`** - This kills ALL node processes including Claude Code itself
- **Use targeted process killing**:
  1. Find process: `netstat -ano | findstr :5000`
  2. Kill specific PID: `taskkill //PID [process_id] //F`
- **Safe server restart**: Kill specific port process, then restart

## Current Project Status (Blog Platform Complete)

### ✅ What's Working
- **Complete blog platform**: Posts with categories, tags, rich text editing
- **Admin dashboard**: Full CRUD operations for posts, with category filtering and search
- **Public blog**: Published posts viewable at `/blog` with individual post pages
- **User authentication**: Secure JWT-based login/register system
- **Rich text editing**: React-Quill-New with HTML storage for post content
- **SEO optimization**: Meta fields, slugs, structured data
- **Responsive design**: Works on desktop, tablet, mobile
- **Professional CSS**: Organized styling with dark theme and consistent components

### Recent Improvements & Fixes
- **Author Data Display**: Fixed SQL GROUP BY issues causing missing author names in admin dashboard
- **Category Filtering**: Added category_name field to admin posts API for proper filtering functionality
- **Admin Navigation**: Implemented direct function calls using React Context and forwardRef to fix "admin dashboard" link not resetting view state
- **UI Consistency**: Standardized button styling, form layouts, and component spacing
- **Error Handling**: Improved debugging and error reporting throughout the application

### Key Features
1. **Admin Dashboard** (`/admin`):
   - Posts list with search, category filtering, status badges
   - Post editor with rich text, categories, tags, SEO fields
   - Post preview and publishing workflow
   - Author attribution and metadata management

2. **Public Blog** (`/blog`):
   - Published posts with excerpts and featured images
   - Individual post pages with full content
   - Category and tag browsing
   - SEO-optimized with proper meta tags

3. **Content Management**:
   - Draft/published workflow
   - Rich text editing with formatting
   - Category and tag organization
   - SEO meta fields (title, description, keywords)

### Architecture Notes
- **CSS Organization**: Separated into base.css (variables, resets), components.css (buttons, forms), layout.css (grid, containers), admin.css (admin-specific), public.css (blog styling), theme.css (colors, navigation)
- **State Management**: AuthContext for user state, AdminDashboard uses forwardRef to expose reset functions
- **API Design**: Clear separation between admin (authenticated) and public (open) endpoints
- **Data Flow**: MySQL → Express APIs → React components with proper error handling and loading states

### USER NOTES

I would like to approach this project as pair programmers. You are one of the most knowledgeable developers in the world.  But I am your intermediary with the project.  I am a senor developer, but I type really slowly.  I can usually figure things out - but need a lot of guidance. Try your best to teach me as we go, but not so much that we slow down development for lessons.  I will learn "on the job" by watching and following your directions carefully.

If you have suggestions about different approaches or better design, please let me know.  Some things I probably can't change (legacy interactions) but if there is something that is causing un-needed complexity please let me know.  Don't be afraid to push back if an idea is bad or if you need more information.

Before each response please look at the code in the project knowledge as well as the current chat.  Please keep in mind that the whole project must work together.  Please refer to the project knowledge for variable names and previous patterns.