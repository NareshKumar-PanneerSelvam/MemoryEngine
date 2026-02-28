# Implementation Plan: MemoryEngine

## Overview

MemoryEngine is an AI-powered knowledge management system with hierarchical note organization, rich text editing, AI-powered content enhancement, spaced repetition flashcards, and PWA support. The implementation is broken into small, reviewable chunks that can be committed individually.

**Tech Stack:**

- Frontend: React + TypeScript + TailwindCSS + Vite
- Backend: FastAPI + Python + SQLAlchemy
- Database: PostgreSQL (Supabase)
- AI: Google Gemini API
- Deployment: Vercel (frontend) + Render (backend)

**Implementation Strategy:**

- Each task is designed as a logical git commit
- Tasks are ordered for incremental functionality
- Start with infrastructure, then authentication, then core features
- Test-related sub-tasks are marked optional with "\*"

## Tasks

### Phase 1: Project Setup

- [x] 1. Initialize backend project structure
  - Create FastAPI project with Poetry for dependency management
  - Set up project structure: `app/`, `app/models/`, `app/routers/`, `app/services/`, `app/core/`
  - Create `pyproject.toml` with dependencies: fastapi, uvicorn, sqlalchemy, psycopg2-binary, python-jose, passlib, bcrypt, python-multipart, google-generativeai
  - Create `.env.example` with required environment variables
  - Create `app/main.py` with basic FastAPI app initialization
  - Create `app/core/config.py` for configuration management
  - Add `.gitignore` for Python projects
  - _Requirements: 9.1, 9.8, 12.2_
  - **Commit message:** `chore: initialize FastAPI backend project structure`

- [x] 2. Initialize frontend project structure
  - Create React + TypeScript project with Vite
  - Set up TailwindCSS configuration
  - Create project structure: `src/components/`, `src/pages/`, `src/services/`, `src/hooks/`, `src/types/`, `src/contexts/`
  - Install dependencies: react-router-dom, @tiptap/react, @tiptap/starter-kit, axios, @tanstack/react-query
  - Create `.env.example` with API URL variable
  - Set up basic routing in `src/App.tsx`
  - Add `.gitignore` for Node projects
  - _Requirements: 9.1, 12.1_
  - **Commit message:** `chore: initialize React + TypeScript frontend with Vite and TailwindCSS`

### Phase 2: Database Setup

- [x] 3. Set up database connection and base models
  - Create `app/core/database.py` with SQLAlchemy async engine and session management
  - Create `app/models/base.py` with declarative base and common fields (id, created_at, updated_at)
  - Set up Alembic for database migrations
  - Create initial migration structure
  - Add database connection string to config
  - _Requirements: 10.1, 10.4, 12.4_
  - **Commit message:** `feat: configure database connection and migration setup`

- [x] 4. Create users table and model
  - Create `app/models/user.py` with User model (id, email, password_hash, role, timestamps)
  - Define user_role enum type ('admin', 'user')
  - Add unique constraint on email
  - Create database migration for users table
  - Add indexes on email and role fields
  - _Requirements: 10.1, 16.1, 16.7_
  - **Commit message:** `feat: create users table with role-based access control`

- [x] 5. Create pages table with hierarchy support
  - Create `app/models/page.py` with Page model (id, user_id, parent_id, title, content, timestamps)
  - Add foreign key constraints (user_id → users, parent_id → pages)
  - Add self-reference check constraint (id != parent_id)
  - Create database migration for pages table
  - Add indexes on user_id, parent_id, and title
  - Add full-text search index on content
  - _Requirements: 1.1, 10.2, 10.5_
  - **Commit message:** `feat: create pages table with hierarchical structure support`

- [ ] 6. Add circular reference prevention trigger
  - Create database function `check_page_hierarchy_cycle()` to detect cycles
  - Add trigger on pages table (INSERT and UPDATE) to prevent circular references
  - Test trigger with sample data to ensure cycle detection works
  - _Requirements: 1.5, 1.6_
  - **Commit message:** `feat: add database trigger to prevent circular page hierarchies`

- [ ] 7. Create flashcards table
  - Create `app/models/flashcard.py` with Flashcard model (id, page_id, user_id, question, answer, review fields, timestamps)
  - Add foreign key constraints (page_id → pages, user_id → users) with CASCADE delete
  - Add check constraints (review_count >= 0, mastery_score between 0 and 100)
  - Create database migration for flashcards table
  - Add indexes on user_id, page_id, next_review_at, and mastery_score
  - _Requirements: 5.1, 6.1, 10.3, 10.5_
  - **Commit message:** `feat: create flashcards table with spaced repetition fields`

- [ ] 8. Create page_shares table for selective sharing
  - Create `app/models/page_share.py` with PageShare model (id, page_id, owner_id, shared_with_user_id, permission_level, created_at)
  - Define permission_level enum type ('view_only', 'edit')
  - Add foreign key constraints with CASCADE delete
  - Add unique constraint on (page_id, shared_with_user_id)
  - Add check constraint (owner_id != shared_with_user_id)
  - Create database migration for page_shares table
  - Add indexes on page_id, shared_with_user_id, and owner_id
  - _Requirements: 17.1, 17.3, 17.9_
  - **Commit message:** `feat: create page_shares table for selective page sharing`

- [ ] 9. Add database triggers for auto-updates
  - Create `update_updated_at_column()` function to auto-update timestamps
  - Add triggers on users, pages, and flashcards tables for updated_at field
  - Create `assign_first_user_admin()` function to make first user admin
  - Add trigger on users table (BEFORE INSERT) for first user admin assignment
  - Create database migration for all triggers
  - _Requirements: 16.2_
  - **Commit message:** `feat: add database triggers for timestamps and first user admin`

### Phase 3: Authentication Backend

- [ ] 10. Implement password hashing service
  - Create `app/services/auth_service.py` with password hashing functions
  - Use bcrypt for password hashing with appropriate salt rounds
  - Implement `hash_password()` and `verify_password()` functions
  - _Requirements: 13.1_
  - **Commit message:** `feat: implement secure password hashing with bcrypt`

- [ ] 11. Implement JWT token service
  - Add JWT token generation and validation functions to `app/services/auth_service.py`
  - Use python-jose for JWT operations
  - Implement `create_access_token()`, `create_refresh_token()`, and `decode_token()` functions
  - Add token expiration configuration (access: 30 min, refresh: 7 days)
  - _Requirements: 13.2, 13.3, 13.6_
  - **Commit message:** `feat: implement JWT token generation and validation`

- [ ] 12. Create user registration endpoint
  - Create `app/routers/auth.py` with registration endpoint
  - Implement POST `/api/auth/register` endpoint
  - Validate email format and password strength
  - Hash password before storing
  - Return JWT tokens and user info on successful registration
  - Handle duplicate email errors
  - _Requirements: 13.1, 13.2_
  - **Commit message:** `feat: add user registration endpoint with validation`

- [ ]\* 12.1 Write unit tests for user registration
  - Test successful registration
  - Test duplicate email rejection
  - Test password hashing
  - Test first user gets admin role
  - _Requirements: 13.1, 16.2_

- [ ] 13. Create user login endpoint
  - Add login endpoint to `app/routers/auth.py`
  - Implement POST `/api/auth/login` endpoint
  - Verify email and password
  - Return JWT tokens and user info on successful login
  - Return 401 for invalid credentials
  - _Requirements: 13.2_
  - **Commit message:** `feat: add user login endpoint with credential verification`

- [ ]\* 13.1 Write unit tests for user login
  - Test successful login
  - Test invalid email
  - Test invalid password
  - Test JWT token generation
  - _Requirements: 13.2_

- [ ] 14. Implement authentication middleware
  - Create `app/core/auth.py` with `get_current_user()` dependency
  - Extract and validate JWT token from Authorization header
  - Return 401 for missing or invalid tokens
  - Load user from database and attach to request
  - _Requirements: 13.3, 13.4_
  - **Commit message:** `feat: add JWT authentication middleware for protected routes`

- [ ] 15. Add token refresh endpoint
  - Add refresh endpoint to `app/routers/auth.py`
  - Implement POST `/api/auth/refresh` endpoint
  - Validate refresh token and issue new access token
  - Return 401 for invalid refresh tokens
  - _Requirements: 13.6_
  - **Commit message:** `feat: add token refresh endpoint for extended sessions`

- [ ] 16. Add current user info endpoint
  - Add user info endpoint to `app/routers/auth.py`
  - Implement GET `/api/auth/me` endpoint (protected)
  - Return current user's id, email, and role
  - _Requirements: 13.5_
  - **Commit message:** `feat: add endpoint to retrieve current user information`

### Phase 4: Authentication Frontend

- [ ] 17. Create authentication context and hooks
  - Create `src/contexts/AuthContext.tsx` with authentication state management
  - Implement `useAuth()` hook for accessing auth state
  - Store tokens in localStorage (or httpOnly cookies for production)
  - Provide login, logout, and register functions
  - Handle token refresh logic
  - _Requirements: 13.7_
  - **Commit message:** `feat: create authentication context and hooks`

- [ ] 18. Create API service with authentication
  - Create `src/services/api.ts` with axios instance
  - Configure base URL from environment variables
  - Add request interceptor to attach JWT token to headers
  - Add response interceptor to handle 401 errors and token refresh
  - Export typed API functions for auth endpoints
  - _Requirements: 9.1, 13.3_
  - **Commit message:** `feat: create API service with JWT token management`

- [ ] 19. Create registration page UI
  - Create `src/pages/Register.tsx` with registration form
  - Add form fields: email, password, confirm password
  - Implement client-side validation (email format, password strength, password match)
  - Show loading state during registration
  - Display error messages from API
  - Redirect to dashboard on successful registration
  - Add link to login page
  - Style with TailwindCSS for mobile-first responsive design
  - _Requirements: 13.1_
  - **Commit message:** `feat: create user registration page with validation`

- [ ] 20. Create login page UI
  - Create `src/pages/Login.tsx` with login form
  - Add form fields: email, password
  - Implement client-side validation
  - Show loading state during login
  - Display error messages from API
  - Redirect to dashboard on successful login
  - Add "Remember me" checkbox (optional)
  - Add link to registration page
  - Style with TailwindCSS for mobile-first responsive design
  - _Requirements: 13.2_
  - **Commit message:** `feat: create user login page with form validation`

- [ ] 21. Add protected route wrapper
  - Create `src/components/ProtectedRoute.tsx` component
  - Check authentication status before rendering protected pages
  - Redirect to login page if not authenticated
  - Preserve intended destination for post-login redirect
  - Show loading spinner while checking auth status
  - _Requirements: 13.3_
  - **Commit message:** `feat: add protected route wrapper for authenticated pages`

- [ ] 22. Create navigation header with logout
  - Create `src/components/Header.tsx` with navigation bar
  - Display user email and role
  - Add logout button that clears tokens and redirects to login
  - Show different navigation items based on authentication status
  - Style with TailwindCSS
  - _Requirements: 13.2_
  - **Commit message:** `feat: create navigation header with user info and logout`

- [ ] 23. Checkpoint - Test authentication flow
  - Ensure all tests pass, ask the user if questions arise.
  - Verify registration creates user and returns tokens
  - Verify login with correct credentials works
  - Verify login with incorrect credentials fails
  - Verify protected routes redirect to login when not authenticated
  - Verify logout clears tokens and redirects to login

### Phase 5: Pages Backend API

- [ ] 24. Create pages service with CRUD operations
  - Create `app/services/pages_service.py` with page management functions
  - Implement `create_page()`, `get_page()`, `update_page()`, `delete_page()` functions
  - Ensure user can only access their own pages
  - Handle parent_id validation
  - _Requirements: 9.1, 13.5_
  - **Commit message:** `feat: implement pages service with CRUD operations`

- [ ] 25. Create pages router with basic endpoints
  - Create `app/routers/pages.py` with pages endpoints
  - Implement POST `/api/pages` - create page
  - Implement GET `/api/pages/:id` - get single page
  - Implement PUT `/api/pages/:id` - update page
  - Implement DELETE `/api/pages/:id` - delete page with cascade
  - All endpoints require authentication
  - Validate request data with Pydantic models
  - _Requirements: 9.1, 9.2, 9.6, 9.7_
  - **Commit message:** `feat: add pages CRUD endpoints with authentication`

- [ ]\* 25.1 Write property test for user data isolation
  - **Property 21: User Data Isolation**
  - **Validates: Requirements 13.5**
  - Test that users can only access their own pages
  - Generate random user IDs and page data
  - Verify cross-user access is denied

- [ ] 26. Add list pages endpoint with hierarchy
  - Add GET `/api/pages` endpoint to pages router
  - Return all pages owned by current user
  - Include parent-child relationships in response
  - Support optional `parent_id` query parameter to filter by parent
  - Order by title alphabetically
  - _Requirements: 9.1, 1.3_
  - **Commit message:** `feat: add endpoint to list pages with hierarchy support`

- [ ] 27. Add get child pages endpoint
  - Add GET `/api/pages/:id/children` endpoint to pages router
  - Return all direct children of specified page
  - Verify user has access to parent page
  - Return 404 if parent page not found or not accessible
  - _Requirements: 1.3_
  - **Commit message:** `feat: add endpoint to retrieve child pages`

- [ ]\* 27.1 Write property test for page hierarchy acyclicity
  - **Property 1: Page Hierarchy Acyclicity**
  - **Validates: Requirements 1.6**
  - Generate random page hierarchies
  - Verify traversing parent_id always reaches null in finite steps
  - Verify no cycles exist

- [ ] 28. Implement page sharing service
  - Create `app/services/sharing_service.py` with sharing functions
  - Implement `share_page()` - create page share with permission level
  - Implement `revoke_share()` - remove page share
  - Implement `get_page_shares()` - list all shares for a page
  - Implement `check_page_access()` - verify user's access level
  - Validate ownership before allowing share operations
  - Prevent self-sharing
  - _Requirements: 17.2, 17.3, 17.7, 17.8_
  - **Commit message:** `feat: implement page sharing service with permission levels`

- [ ] 29. Add page sharing endpoints
  - Add POST `/api/pages/:id/share` endpoint - share page with user
  - Add DELETE `/api/pages/:id/share/:userId` endpoint - revoke share
  - Add GET `/api/pages/:id/shares` endpoint - list page shares
  - Verify only page owner can manage shares
  - Return 403 for non-owners
  - _Requirements: 17.2, 17.7_
  - **Commit message:** `feat: add endpoints for page sharing management`

- [ ]\* 29.1 Write property test for permission enforcement
  - **Property 31: View-Only Permission Enforcement**
  - **Property 32: Edit Permission Allows Modification**
  - **Validates: Requirements 17.5, 17.6**
  - Generate random page shares with different permission levels
  - Verify view_only users cannot edit
  - Verify edit users can modify pages

- [ ] 30. Update pages list to include shared pages
  - Modify GET `/api/pages` endpoint to include shared pages
  - Add `is_shared`, `permission`, and `owner_email` fields to response
  - Distinguish between owned and shared pages
  - Apply permission-based filtering
  - _Requirements: 17.4_
  - **Commit message:** `feat: include shared pages in pages list endpoint`

- [ ] 31. Add page access control middleware
  - Create `app/core/permissions.py` with access control functions
  - Implement `require_page_access()` function to check permissions
  - Apply to all page endpoints (get, update, delete)
  - Return 404 for pages user cannot access (security through obscurity)
  - Return 403 for insufficient permissions on accessible pages
  - _Requirements: 17.5, 17.6_
  - **Commit message:** `feat: add page access control with permission checking`

### Phase 6: Pages Frontend

- [ ] 32. Create page type definitions
  - Create `src/types/page.ts` with Page, CreatePageRequest, UpdatePageRequest interfaces
  - Match backend schema exactly
  - Export all page-related types
  - _Requirements: 9.5_
  - **Commit message:** `feat: add TypeScript type definitions for pages`

- [ ] 33. Add pages API functions
  - Add page API functions to `src/services/api.ts`
  - Implement `getPages()`, `getPage()`, `createPage()`, `updatePage()`, `deletePage()`
  - Implement `getChildPages()`, `sharePage()`, `revokeShare()`, `getPageShares()`
  - Use proper TypeScript types for requests and responses
  - _Requirements: 9.1_
  - **Commit message:** `feat: add API functions for pages management`

- [ ] 34. Create page tree navigation component
  - Create `src/components/PageTree/PageTree.tsx` component
  - Display pages in hierarchical tree structure
  - Implement expand/collapse functionality for parent pages
  - Highlight selected page
  - Add create and delete buttons for each page
  - Handle loading and error states
  - Style with TailwindCSS for mobile-responsive design
  - _Requirements: 1.3_
  - **Commit message:** `feat: create page tree navigation component`

- [ ] 35. Create page list/dashboard page
  - Create `src/pages/Dashboard.tsx` with page tree and main content area
  - Display PageTree component in sidebar
  - Show selected page content in main area
  - Add "New Page" button to create root-level pages
  - Handle empty state (no pages yet)
  - Make responsive with collapsible sidebar on mobile
  - _Requirements: 1.3_
  - **Commit message:** `feat: create dashboard page with page tree navigation`

- [ ] 36. Add create page modal/form
  - Create `src/components/CreatePageModal.tsx` component
  - Add form fields: title, parent page (optional dropdown)
  - Validate title is not empty
  - Call API to create page
  - Refresh page tree after creation
  - Show success/error messages
  - _Requirements: 1.2_
  - **Commit message:** `feat: add create page modal with parent selection`

- [ ] 37. Add delete page confirmation
  - Create `src/components/DeletePageModal.tsx` component
  - Show warning about cascade deletion of child pages
  - Require confirmation before deletion
  - Call API to delete page
  - Refresh page tree after deletion
  - Handle errors gracefully
  - _Requirements: 1.4_
  - **Commit message:** `feat: add delete page confirmation with cascade warning`

- [ ] 38. Checkpoint - Test pages management
  - Ensure all tests pass, ask the user if questions arise.
  - Verify page creation works
  - Verify page tree displays hierarchy correctly
  - Verify page deletion removes page and children
  - Verify users can only see their own pages

### Phase 7: Rich Text Editor

- [ ] 39. Set up Tiptap editor with Markdown support
  - Create `src/components/Editor/TiptapEditor.tsx` component
  - Configure Tiptap with StarterKit extension
  - Add Markdown extension for syntax support
  - Add Placeholder extension
  - Add CharacterCount extension
  - Set up editor state management
  - _Requirements: 2.1, 2.2_
  - **Commit message:** `feat: set up Tiptap editor with Markdown support`

- [ ] 40. Implement dual-mode toggle (rich text / Markdown)
  - Add mode toggle button to editor toolbar
  - Implement rich text mode with formatted rendering
  - Implement Markdown mode with raw syntax display
  - Preserve content when switching modes
  - Store mode preference in component state
  - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - **Commit message:** `feat: add rich text and Markdown mode toggle to editor`

- [ ]\* 40.1 Write property test for mode switching
  - **Property 3: Editor Mode Switching Preserves Content**
  - **Property 4: Markdown Round-Trip Identity**
  - **Validates: Requirements 2.5, 2.6**
  - Generate random Markdown content
  - Switch modes multiple times
  - Verify content is preserved

- [ ] 41. Add editor toolbar with formatting options
  - Create `src/components/Editor/Toolbar.tsx` component
  - Add buttons for: bold, italic, code, headings, lists, blockquote
  - Add mode toggle button
  - Disable formatting buttons in Markdown mode
  - Style with TailwindCSS
  - _Requirements: 2.3_
  - **Commit message:** `feat: add editor toolbar with formatting controls`

- [ ] 42. Implement auto-save functionality
  - Add debounced auto-save (save after 2 seconds of no typing)
  - Call update page API on auto-save
  - Show "Saving..." and "Saved" indicators
  - Handle save errors gracefully
  - _Requirements: 9.2_
  - **Commit message:** `feat: implement auto-save for page content`

- [ ] 43. Create editor page with page content
  - Create `src/pages/EditorPage.tsx` component
  - Load page content from API based on route parameter
  - Display TiptapEditor with loaded content
  - Handle loading and error states
  - Show page title (editable)
  - Add breadcrumb navigation
  - _Requirements: 2.1_
  - **Commit message:** `feat: create editor page with content loading`

- [ ] 44. Integrate editor into dashboard
  - Update Dashboard to show editor when page is selected
  - Pass selected page to editor component
  - Update page tree when page title changes
  - Handle navigation between pages
  - _Requirements: 1.3, 2.1_
  - **Commit message:** `feat: integrate editor into dashboard page`

### Phase 8: AI Service Backend

- [ ] 45. Set up Google Gemini API client
  - Create `app/services/ai_service.py` with Gemini API integration
  - Configure API key from environment variables
  - Set up API client with free tier model (gemini-1.5-flash)
  - Add configuration for max tokens and temperature
  - _Requirements: 11.1, 11.7_
  - **Commit message:** `feat: set up Google Gemini API client`

- [ ] 46. Implement rate limiting for AI service
  - Add rate limiter to AI service (15 requests/minute, 1500/day)
  - Track request counts in memory or Redis
  - Return appropriate error when rate limit exceeded
  - Add retry-after header to rate limit responses
  - _Requirements: 11.2, 11.3_
  - **Commit message:** `feat: add rate limiting for AI service API calls`

- [ ] 47. Implement AI text operations (rephrase, enhance, simplify)
  - Add `rephrase_text()` function with prompt template
  - Add `enhance_text()` function with prompt template
  - Add `simplify_text()` function with prompt template
  - Implement retry logic with exponential backoff
  - Validate API responses
  - Log all API interactions
  - _Requirements: 3.2, 3.3, 3.4, 11.4, 11.5, 11.6_
  - **Commit message:** `feat: implement AI text operations (rephrase, enhance, simplify)`

- [ ]\* 47.1 Write property test for AI response validation
  - **Property 5: AI Service Returns Valid JSON**
  - **Validates: Requirements 3.7**
  - Test all AI operations return parseable JSON
  - Verify response structure matches expected format

- [ ] 48. Implement AI generation operations (questions, flashcards)
  - Add `generate_questions()` function with prompt template
  - Add `generate_flashcards()` function with prompt template
  - Parse JSON responses into structured data
  - Validate generated content is non-empty
  - Handle parsing errors gracefully
  - _Requirements: 3.5, 3.6_
  - **Commit message:** `feat: implement AI generation for questions and flashcards`

- [ ]\* 48.1 Write property tests for AI generation
  - **Property 6: Generated Questions Are Non-Empty**
  - **Property 7: Generated Flashcards Have Valid Structure**
  - **Validates: Requirements 3.5, 3.6**
  - Verify questions array is non-empty
  - Verify flashcards have question and answer fields

- [ ] 49. Implement image to Markdown conversion
  - Add `image_to_markdown()` function with OCR prompt
  - Handle image upload (JPEG, PNG, HEIC formats)
  - Extract text using Gemini vision capabilities
  - Structure output as valid Markdown
  - Return confidence score
  - Handle low-quality images with error message
  - _Requirements: 4.1, 4.2, 4.3, 4.6_
  - **Commit message:** `feat: implement handwritten image to Markdown conversion`

- [ ]\* 49.1 Write property test for Markdown output
  - **Property 8: Image OCR Produces Valid Markdown**
  - **Validates: Requirements 4.2**
  - Test that output is valid Markdown
  - Verify Markdown can be parsed without errors

- [ ] 50. Create AI operations router
  - Create `app/routers/ai.py` with AI endpoints
  - Implement POST `/api/ai/rephrase` endpoint
  - Implement POST `/api/ai/enhance` endpoint
  - Implement POST `/api/ai/simplify` endpoint
  - Implement POST `/api/ai/generate-questions` endpoint
  - Implement POST `/api/ai/generate-flashcards` endpoint
  - Implement POST `/api/ai/image-to-markdown` endpoint (multipart/form-data)
  - All endpoints require authentication
  - Return appropriate error messages for failures
  - _Requirements: 9.3, 3.8_
  - **Commit message:** `feat: add AI operations API endpoints`

### Phase 9: AI Features Frontend

- [ ] 51. Create AI operations API functions
  - Add AI API functions to `src/services/api.ts`
  - Implement `rephraseText()`, `enhanceText()`, `simplifyText()`
  - Implement `generateQuestions()`, `generateFlashcards()`
  - Implement `imageToMarkdown()` with file upload
  - Handle rate limit errors with user-friendly messages
  - _Requirements: 3.1, 3.8_
  - **Commit message:** `feat: add AI operations API functions`

- [ ] 52. Create AI operations context menu
  - Create `src/components/Editor/AIMenu.tsx` component
  - Show menu when text is selected in editor
  - Position menu near text selection
  - Display AI operation options: Rephrase, Enhance, Simplify, Generate Questions, Generate Flashcards
  - Handle loading states during API calls
  - Show error messages with retry option
  - _Requirements: 3.1_
  - **Commit message:** `feat: create AI operations context menu for text selection`

- [ ] 53. Implement AI text operations in editor
  - Connect AI menu to editor text selection
  - Call appropriate AI API based on selected operation
  - Replace selected text with AI result (for rephrase, enhance, simplify)
  - Show loading indicator during processing
  - Allow user to undo AI operation
  - Handle errors with retry option
  - _Requirements: 3.2, 3.3, 3.4, 3.8_
  - **Commit message:** `feat: integrate AI text operations into editor`

- [ ] 54. Implement AI question generation
  - Add "Generate Questions" button to AI menu
  - Display generated questions in a modal or side panel
  - Allow user to copy questions to clipboard
  - Option to insert questions into page content
  - _Requirements: 3.5_
  - **Commit message:** `feat: add AI-powered interview question generation`

- [ ] 55. Implement AI flashcard generation
  - Add "Generate Flashcards" button to AI menu
  - Display generated flashcards in a modal
  - Allow user to review and edit flashcards before saving
  - Bulk create flashcards associated with current page
  - Show success message after creation
  - _Requirements: 3.6, 6.4_
  - **Commit message:** `feat: add AI-powered flashcard generation`

- [ ] 56. Add image upload for OCR conversion
  - Create `src/components/ImageUpload.tsx` component
  - Add image upload button to editor toolbar
  - Support drag-and-drop for images
  - Accept JPEG, PNG, HEIC formats
  - Show preview before conversion
  - Call image-to-markdown API
  - Display generated Markdown for review
  - Allow user to edit before inserting into page
  - _Requirements: 4.1, 4.3, 4.4, 4.5_
  - **Commit message:** `feat: add image upload with OCR to Markdown conversion`

- [ ] 57. Checkpoint - Test AI features
  - Ensure all tests pass, ask the user if questions arise.
  - Verify text selection shows AI menu
  - Verify AI operations work (rephrase, enhance, simplify)
  - Verify question generation produces valid questions
  - Verify flashcard generation creates flashcards
  - Verify image upload converts to Markdown

### Phase 10: Flashcards Backend

- [ ] 58. Implement spaced repetition algorithm
  - Create `app/services/spaced_repetition.py` with SR algorithm
  - Implement `calculate_next_review()` function
  - Define interval constants (easy: 7 days, medium: 4 days, hard: 2 days)
  - Define mastery score adjustments (easy: +10, medium: +5, hard: -15)
  - Apply mastery multiplier for high-mastery cards (>= 80)
  - Enforce mastery score bounds [0, 100]
  - _Requirements: 5.2, 5.3, 5.4, 5.6_
  - **Commit message:** `feat: implement spaced repetition algorithm`

- [ ]\* 58.1 Write property test for review interval calculation
  - **Property 9: Review Interval Calculation**
  - **Validates: Requirements 5.2, 5.3, 5.4**
  - Generate random ratings and mastery scores
  - Verify interval calculation matches expected formula
  - Verify mastery multiplier applied correctly

- [ ]\* 58.2 Write property test for mastery score updates
  - **Property 11: Mastery Score Direction**
  - **Validates: Requirements 5.6**
  - Verify mastery increases for easy/medium
  - Verify mastery decreases for hard
  - Verify bounds [0, 100] are enforced

- [ ] 59. Create flashcards service
  - Create `app/services/flashcards_service.py` with flashcard management
  - Implement `create_flashcard()`, `get_flashcard()`, `update_flashcard()`, `delete_flashcard()`
  - Implement `get_flashcards_by_page()` function
  - Implement `get_due_flashcards()` function with priority ordering
  - Implement `review_flashcard()` function using SR algorithm
  - Ensure user can only access their own flashcards
  - _Requirements: 5.1, 5.5, 5.7, 6.5, 13.5_
  - **Commit message:** `feat: implement flashcards service with spaced repetition`

- [ ]\* 59.1 Write property test for review count increment
  - **Property 10: Review Count Increment**
  - **Validates: Requirements 5.5**
  - Verify review_count increases by exactly 1 after review
  - Test with different ratings

- [ ]\* 59.2 Write property test for due flashcards filter
  - **Property 12: Due Flashcards Filter**
  - **Validates: Requirements 5.7**
  - Generate flashcards with various next_review_at dates
  - Verify only cards with next_review_at <= current time are returned

- [ ] 60. Create flashcards router
  - Create `app/routers/flashcards.py` with flashcard endpoints
  - Implement POST `/api/flashcards` - create flashcard
  - Implement GET `/api/flashcards/:id` - get flashcard
  - Implement PUT `/api/flashcards/:id` - update flashcard
  - Implement DELETE `/api/flashcards/:id` - delete flashcard
  - Implement GET `/api/flashcards` - list all user's flashcards
  - Implement GET `/api/flashcards/due` - get due flashcards
  - Implement POST `/api/flashcards/:id/review` - submit review
  - Implement GET `/api/pages/:id/flashcards` - get flashcards for page
  - All endpoints require authentication
  - _Requirements: 9.2, 5.1, 5.7, 6.5_
  - **Commit message:** `feat: add flashcards API endpoints with review system`

- [ ]\* 60.1 Write property test for flashcard query by page
  - **Property 14: Flashcard Query By Page**
  - **Validates: Requirements 6.5**
  - Query flashcards by page_id
  - Verify all returned flashcards have correct page_id

### Phase 11: Flashcards Frontend

- [ ] 61. Create flashcard type definitions
  - Create `src/types/flashcard.ts` with Flashcard, CreateFlashcardRequest, ReviewFlashcardRequest interfaces
  - Match backend schema exactly
  - Export all flashcard-related types
  - _Requirements: 9.5_
  - **Commit message:** `feat: add TypeScript type definitions for flashcards`

- [ ] 62. Add flashcards API functions
  - Add flashcard API functions to `src/services/api.ts`
  - Implement `getFlashcards()`, `getFlashcard()`, `createFlashcard()`, `updateFlashcard()`, `deleteFlashcard()`
  - Implement `getDueFlashcards()`, `reviewFlashcard()`, `getPageFlashcards()`
  - Use proper TypeScript types
  - _Requirements: 9.2_
  - **Commit message:** `feat: add API functions for flashcards management`

- [ ] 63. Create flashcard panel in editor
  - Create `src/components/Editor/FlashcardPanel.tsx` component
  - Display flashcards associated with current page
  - Show question, answer, and review stats for each flashcard
  - Add "New Flashcard" button
  - Add edit and delete buttons for each flashcard
  - Style with TailwindCSS
  - _Requirements: 6.4_
  - **Commit message:** `feat: create flashcard panel for page editor`

- [ ] 64. Add create/edit flashcard modal
  - Create `src/components/FlashcardModal.tsx` component
  - Add form fields: question (textarea), answer (textarea)
  - Support both create and edit modes
  - Validate fields are not empty
  - Call API to create/update flashcard
  - Refresh flashcard list after save
  - _Requirements: 5.1_
  - **Commit message:** `feat: add create and edit flashcard modal`

- [ ] 65. Create flashcard review page
  - Create `src/pages/FlashcardReview.tsx` component
  - Load due flashcards from API
  - Display one flashcard at a time
  - Show question first, hide answer
  - Add "Show Answer" button to reveal answer
  - Add rating buttons: Easy, Medium, Hard
  - Show progress indicator (X of Y cards)
  - Navigate to next card after rating
  - Show completion message when done
  - _Requirements: 7.3, 7.4, 7.5, 7.6_
  - **Commit message:** `feat: create flashcard review page with spaced repetition`

- [ ] 66. Add mobile-optimized review interface
  - Make flashcard review page mobile-responsive
  - Add swipe gesture support for navigation (left/right)
  - Optimize button sizes for touch (minimum 44x44px)
  - Add flip animation for answer reveal
  - Ensure smooth transitions between cards
  - Test on mobile viewport sizes
  - _Requirements: 7.1, 7.2, 7.7_
  - **Commit message:** `feat: optimize flashcard review for mobile with gestures`

- [ ] 67. Add flashcard statistics dashboard
  - Create `src/components/FlashcardStats.tsx` component
  - Display total flashcards, due today, mastery distribution
  - Show review streak and total reviews
  - Add charts/graphs for visual representation (optional)
  - Link to review page
  - _Requirements: 5.1, 5.6_
  - **Commit message:** `feat: add flashcard statistics dashboard`

### Phase 12: Search and Filtering

- [ ] 68. Implement backend search functionality
  - Create `app/services/search_service.py` with search functions
  - Implement `search_pages()` function with title and content search
  - Support case-insensitive search
  - Prioritize title matches over content matches
  - Include shared pages in search results based on permissions
  - Order results by relevance (exact title match, title contains, content contains)
  - Support pagination (limit, offset)
  - _Requirements: 14.1, 14.2, 14.3, 14.6, 18.2, 18.3, 18.6, 18.7_
  - **Commit message:** `feat: implement page search with title prioritization`

- [ ]\* 68.1 Write property tests for search
  - **Property 22: Search Results Contain Query Term**
  - **Property 35: Title Search Prioritization**
  - **Property 36: Case-Insensitive Title Search**
  - **Property 37: Shared Pages In Search Results**
  - **Validates: Requirements 14.1, 18.2, 18.3, 18.6, 18.7**
  - Verify all results contain query term
  - Verify title matches appear first
  - Verify case-insensitive matching

- [ ] 69. Add search endpoint
  - Add GET `/api/pages/search?q=query` endpoint to pages router
  - Support query parameter for search term
  - Support limit and offset parameters for pagination
  - Return empty array for empty query
  - Highlight search terms in results (optional)
  - _Requirements: 14.1, 14.6, 14.7_
  - **Commit message:** `feat: add search endpoint for pages`

- [ ] 70. Implement flashcard filtering
  - Add filtering to `get_flashcards()` in flashcards service
  - Support mastery level filter (low: 0-33, medium: 34-66, high: 67-100)
  - Support date range filter on created_at
  - Support page_id filter
  - Combine filters with AND logic
  - _Requirements: 14.4, 14.5_
  - **Commit message:** `feat: add filtering for flashcards by mastery and date`

- [ ]\* 70.1 Write property tests for filtering
  - **Property 23: Mastery Level Filter**
  - **Property 24: Date Range Filter**
  - **Validates: Requirements 14.4, 14.5**
  - Generate flashcards with various mastery scores
  - Verify filter returns only matching cards

- [ ] 71. Create search bar component
  - Create `src/components/SearchBar.tsx` component
  - Add search input with debounced API calls
  - Display search results in dropdown
  - Highlight matching terms in results
  - Navigate to page on result click
  - Show loading state during search
  - Handle empty results
  - _Requirements: 14.1, 14.3_
  - **Commit message:** `feat: create search bar with live results`

- [ ] 72. Add search to dashboard
  - Integrate SearchBar into Dashboard header
  - Make search accessible from all pages
  - Add keyboard shortcut (Ctrl+K or Cmd+K) to focus search
  - _Requirements: 14.1_
  - **Commit message:** `feat: integrate search into dashboard with keyboard shortcut`

- [ ] 73. Add flashcard filters to review page
  - Add filter controls to flashcard review page
  - Support filtering by mastery level
  - Support filtering by page
  - Update due flashcards query with filters
  - Persist filter preferences in localStorage
  - _Requirements: 14.4_
  - **Commit message:** `feat: add mastery and page filters to flashcard review`

### Phase 13: Admin Features

- [ ] 74. Create admin service
  - Create `app/services/admin_service.py` with admin functions
  - Implement `get_all_users()` function
  - Implement `update_user_role()` function
  - Implement `delete_user()` function
  - Add role validation (only 'admin' or 'user')
  - _Requirements: 16.4, 16.5, 16.7_
  - **Commit message:** `feat: implement admin service for user management`

- [ ] 75. Add role-based authorization decorator
  - Create `app/core/permissions.py` with `require_role()` decorator
  - Check user role before allowing access to endpoint
  - Return 403 Forbidden for insufficient permissions
  - Apply to admin endpoints
  - _Requirements: 16.5, 16.6_
  - **Commit message:** `feat: add role-based authorization decorator`

- [ ]\* 75.1 Write property tests for authorization
  - **Property 28: Admin-Only Operations Require Admin Role**
  - **Property 29: User Role Constraint**
  - **Validates: Requirements 16.5, 16.6, 16.7**
  - Verify non-admin users get 403 on admin endpoints
  - Verify role field is always 'admin' or 'user'

- [ ] 76. Create admin router
  - Create `app/routers/admin.py` with admin endpoints
  - Implement GET `/api/admin/users` - list all users (admin only)
  - Implement PUT `/api/admin/users/:id/role` - update user role (admin only)
  - Implement DELETE `/api/admin/users/:id` - delete user (admin only)
  - Apply `require_role('admin')` to all endpoints
  - _Requirements: 16.4, 16.5_
  - **Commit message:** `feat: add admin endpoints for user management`

- [ ] 77. Create admin dashboard page
  - Create `src/pages/AdminDashboard.tsx` component
  - Display list of all users with email and role
  - Add role change dropdown for each user
  - Add delete user button with confirmation
  - Show admin badge for admin users
  - Only accessible to admin users
  - _Requirements: 16.4, 16.5_
  - **Commit message:** `feat: create admin dashboard for user management`

- [ ] 78. Add admin navigation link
  - Update Header component to show "Admin" link for admin users
  - Hide link for regular users
  - Link to admin dashboard
  - _Requirements: 16.5_
  - **Commit message:** `feat: add admin navigation link for admin users`

- [ ] 79. Create page sharing UI
  - Create `src/components/SharePageModal.tsx` component
  - Add user email input to share with
  - Add permission level selector (view_only, edit)
  - Display list of current shares with revoke buttons
  - Call share/revoke APIs
  - Show success/error messages
  - _Requirements: 17.2, 17.7_
  - **Commit message:** `feat: create page sharing UI with permission levels`

- [ ] 80. Add share button to editor
  - Add "Share" button to editor toolbar
  - Open SharePageModal on click
  - Only show for page owners
  - Refresh page data after sharing changes
  - _Requirements: 17.2_
  - **Commit message:** `feat: add share button to page editor`

- [ ]\* 80.1 Write property tests for sharing
  - **Property 30: Shared Page Access**
  - **Property 33: Permission Level Constraint**
  - **Property 34: No Self-Sharing**
  - **Validates: Requirements 17.4, 17.9**
  - Verify shared users can access pages
  - Verify permission_level is always valid enum value
  - Verify self-sharing is rejected

### Phase 14: Error Handling and Logging

- [ ] 81. Implement custom exception classes
  - Create `app/core/exceptions.py` with custom exception classes
  - Define AppException, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, RateLimitError
  - Include status codes and error messages
  - _Requirements: 15.2_
  - **Commit message:** `feat: create custom exception classes for error handling`

- [ ] 82. Add global exception handlers
  - Create exception handlers in `app/main.py`
  - Handle AppException with appropriate status codes
  - Handle unexpected exceptions with generic message
  - Log error details without exposing to client
  - Return consistent error response format
  - _Requirements: 15.1, 15.2, 15.3_
  - **Commit message:** `feat: add global exception handlers with secure error messages`

- [ ]\* 82.1 Write property tests for error handling
  - **Property 15: API Responses Are Valid JSON**
  - **Property 16: Error Responses Have Appropriate Status Codes**
  - **Property 17: Invalid Request Data Rejection**
  - **Property 25: Error Messages Exclude Sensitive Data**
  - **Validates: Requirements 9.5, 9.6, 9.7, 15.2**
  - Verify all responses are valid JSON
  - Verify error status codes are 4xx or 5xx
  - Verify no sensitive data in error messages

- [ ] 83. Set up structured logging
  - Configure structlog in `app/core/logging.py`
  - Set up log levels (DEBUG, INFO, WARNING, ERROR)
  - Add request ID to all logs
  - Configure log output format (JSON for production)
  - _Requirements: 15.7_
  - **Commit message:** `feat: configure structured logging with log levels`

- [ ] 84. Add request logging middleware
  - Create middleware in `app/core/middleware.py`
  - Log all incoming requests with method, path, client IP
  - Log response status and duration
  - Add request ID to response headers
  - _Requirements: 15.4_
  - **Commit message:** `feat: add request logging middleware`

- [ ] 85. Implement database retry logic
  - Create `app/core/database.py` helper for retries
  - Implement `execute_with_retry()` function
  - Use exponential backoff (2^attempt seconds)
  - Retry up to 3 times for transient errors
  - Log retry attempts
  - _Requirements: 15.5_
  - **Commit message:** `feat: add database retry logic with exponential backoff`

- [ ] 86. Add health check endpoint
  - Add GET `/api/health` endpoint to main app
  - Check database connectivity
  - Return status: healthy/unhealthy
  - Include version and timestamp
  - _Requirements: 15.6_
  - **Commit message:** `feat: add health check endpoint for monitoring`

- [ ] 87. Create error display component
  - Create `src/components/ErrorDisplay.tsx` component
  - Display error messages with appropriate styling
  - Support different error types (network, validation, auth, server)
  - Add retry button for retryable errors
  - Add dismiss button
  - _Requirements: 15.3_
  - **Commit message:** `feat: create error display component with retry support`

- [ ] 88. Add error boundary to app
  - Create `src/components/ErrorBoundary.tsx` component
  - Catch React errors and display fallback UI
  - Log errors to console (or error tracking service)
  - Provide "Reload" button
  - _Requirements: 15.3_
  - **Commit message:** `feat: add error boundary for React error handling`

- [ ] 89. Implement frontend error handling
  - Add error handling to all API calls
  - Display user-friendly error messages
  - Handle network errors (offline indicator)
  - Handle authentication errors (redirect to login)
  - Handle validation errors (inline field errors)
  - Handle rate limit errors (show retry timing)
  - _Requirements: 3.8, 15.3_
  - **Commit message:** `feat: implement comprehensive frontend error handling`

### Phase 15: Progressive Web App

- [ ] 90. Create PWA manifest file
  - Create `public/manifest.json` with app metadata
  - Define app name, short name, description
  - Set display mode to "standalone"
  - Configure theme and background colors
  - Add icon definitions for all sizes (72px to 512px)
  - _Requirements: 8.1, 8.4_
  - **Commit message:** `feat: create PWA manifest file`

- [ ] 91. Generate PWA icons
  - Create app icon in multiple sizes (72, 96, 128, 144, 152, 192, 384, 512)
  - Save icons to `public/icons/` directory
  - Use appropriate format (PNG with transparency)
  - Reference icons in manifest.json
  - _Requirements: 8.4_
  - **Commit message:** `feat: add PWA icons in multiple sizes`

- [ ] 92. Implement service worker
  - Create `public/sw.js` with service worker logic
  - Implement install event to cache essential assets
  - Implement activate event to clean old caches
  - Implement fetch event with network-first strategy for API
  - Implement cache-first strategy for static assets
  - Cache offline fallback page
  - _Requirements: 8.2, 8.5_
  - **Commit message:** `feat: implement service worker for offline support`

- [ ] 93. Register service worker in app
  - Add service worker registration to `src/main.tsx`
  - Register on app load
  - Handle registration success and errors
  - Show update notification when new version available
  - _Requirements: 8.2, 8.3_
  - **Commit message:** `feat: register service worker in application`

- [ ] 94. Implement offline flashcard caching
  - Create IndexedDB schema for offline storage
  - Cache flashcards when loaded online
  - Serve cached flashcards when offline
  - Store pending reviews in IndexedDB
  - _Requirements: 8.5, 8.6_
  - **Commit message:** `feat: implement offline flashcard caching with IndexedDB`

- [ ] 95. Implement background sync for reviews
  - Add background sync event listener to service worker
  - Queue flashcard reviews when offline
  - Sync reviews to backend when connection restored
  - Remove synced reviews from queue
  - Show sync status to user
  - _Requirements: 8.6, 8.7_
  - **Commit message:** `feat: add background sync for offline flashcard reviews`

- [ ] 96. Create offline indicator
  - Create `src/components/OfflineIndicator.tsx` component
  - Show banner when app is offline
  - Update when connection restored
  - Indicate pending sync operations
  - _Requirements: 8.6_
  - **Commit message:** `feat: create offline indicator component`

- [ ] 97. Add install prompt
  - Detect PWA install availability
  - Show install prompt to users
  - Handle install acceptance/rejection
  - Hide prompt after installation
  - _Requirements: 8.3_
  - **Commit message:** `feat: add PWA install prompt`

- [ ] 98. Test PWA on mobile devices
  - Test installation on iOS Safari
  - Test installation on Android Chrome
  - Verify offline functionality works
  - Verify background sync works
  - Test app icon and splash screen
  - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_
  - **Commit message:** `test: verify PWA functionality on mobile devices`

### Phase 16: Deployment and Production

- [ ] 99. Configure CORS for production
  - Update CORS configuration in `app/main.py`
  - Allow frontend domain (Vercel URL)
  - Configure allowed methods and headers
  - Set credentials support
  - _Requirements: 9.8_
  - **Commit message:** `feat: configure CORS for production frontend`

- [ ] 100. Set up environment variables for backend
  - Document all required environment variables in README
  - Create `.env.example` with all variables
  - Configure for Render deployment
  - Include: DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, CORS_ORIGINS
  - _Requirements: 11.7, 12.4, 12.5_
  - **Commit message:** `docs: document environment variables for deployment`

- [ ] 101. Set up environment variables for frontend
  - Document frontend environment variables
  - Create `.env.example` with VITE_API_URL
  - Configure for Vercel deployment
  - _Requirements: 12.5_
  - **Commit message:** `docs: document frontend environment variables`

- [ ] 102. Create Supabase database
  - Sign up for Supabase account
  - Create new project
  - Run all database migrations
  - Configure connection pooling
  - Get connection string for backend
  - _Requirements: 12.3, 12.4_
  - **Commit message:** `chore: set up Supabase PostgreSQL database`

- [ ] 103. Deploy backend to Render
  - Create Render account
  - Create new Web Service
  - Connect to GitHub repository
  - Configure build command: `poetry install && poetry run alembic upgrade head`
  - Configure start command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set environment variables
  - Enable auto-deploy from main branch
  - _Requirements: 12.2, 12.6_
  - **Commit message:** `chore: deploy backend to Render`

- [ ] 104. Deploy frontend to Vercel
  - Create Vercel account
  - Import GitHub repository
  - Configure build settings (Vite)
  - Set VITE_API_URL to Render backend URL
  - Enable auto-deploy from main branch
  - Configure custom domain (optional)
  - _Requirements: 12.1, 12.5, 12.6_
  - **Commit message:** `chore: deploy frontend to Vercel`

- [ ] 105. Set up staging environment
  - Create staging branch in git
  - Deploy staging backend to Render
  - Deploy staging frontend to Vercel
  - Use separate database for staging
  - Configure environment variables for staging
  - _Requirements: 12.7_
  - **Commit message:** `chore: set up staging environment`

- [ ] 106. Create deployment documentation
  - Document deployment process in README
  - Include setup instructions for all services
  - Document environment variables
  - Add troubleshooting section
  - Include monitoring and logging setup
  - _Requirements: 12.1, 12.2, 12.3_
  - **Commit message:** `docs: add deployment documentation`

- [ ] 107. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete user flow: register → login → create page → add content → generate flashcards → review flashcards
  - Test on desktop and mobile browsers
  - Test offline functionality
  - Test PWA installation
  - Verify all API endpoints work in production
  - Check error handling and logging
  - Verify admin features work
  - Test page sharing functionality

## Notes

### Task Organization

Tasks are organized into 16 phases for incremental development:

1. **Phase 1-2**: Project setup and database schema
2. **Phase 3-4**: Authentication (backend and frontend)
3. **Phase 5-6**: Pages management (backend and frontend)
4. **Phase 7**: Rich text editor with Markdown
5. **Phase 8-9**: AI features (backend and frontend)
6. **Phase 10-11**: Flashcards and spaced repetition
7. **Phase 12**: Search and filtering
8. **Phase 13**: Admin features and page sharing
9. **Phase 14**: Error handling and logging
10. **Phase 15**: Progressive Web App
11. **Phase 16**: Deployment and production

### Commit Strategy

Each task is designed as a logical git commit with a clear commit message. The user will commit manually during initial phases, so tasks are self-contained and reviewable.

### Optional Tasks

Tasks marked with `*` are optional and focus on testing:

- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- These can be skipped for faster MVP development

### Testing Approach

The project uses dual testing:

- **Unit Tests**: Specific examples, edge cases, integration points
- **Property Tests**: Universal properties across all inputs (minimum 100 iterations)

Property tests reference design document properties with format:

```
# Feature: memory-engine, Property {number}: {property_text}
```

### Requirements Traceability

Each task references specific requirements from the requirements document for full traceability. This ensures all acceptance criteria are covered by implementation tasks.

### Checkpoints

Checkpoints are included at logical breaks to:

- Verify all tests pass
- Allow user review and questions
- Ensure incremental validation

### Technology Stack Summary

**Backend:**

- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Alembic (migrations)
- python-jose (JWT)
- bcrypt (password hashing)
- google-generativeai (AI)

**Frontend:**

- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- TailwindCSS (styling)
- Tiptap (rich text editor)
- React Router (routing)
- Axios (HTTP client)
- React Query (data fetching)

**Infrastructure:**

- Supabase (PostgreSQL hosting)
- Render (backend hosting)
- Vercel (frontend hosting)
- Google Gemini API (AI features)

### Development Workflow

1. Start with backend infrastructure and database
2. Build authentication system (backend → frontend)
3. Implement core features incrementally
4. Add AI enhancements
5. Implement flashcard system
6. Add search and admin features
7. Implement PWA functionality
8. Deploy to production

Each phase builds on previous phases, ensuring the application remains functional at each step.
