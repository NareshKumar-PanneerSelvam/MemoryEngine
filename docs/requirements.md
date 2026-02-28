# Requirements Document

## Introduction

MemoryEngine is an AI-powered knowledge management system designed for structured learning and interview preparation in technical subjects (Math, Python, C++, Numerical Methods, Simulation). The system provides hierarchical note organization, rich text editing with Markdown support, AI-powered content enhancement, spaced repetition flashcards, and mobile-first PWA experience for on-the-go learning.

## Glossary

- **MemoryEngine**: The complete AI-powered knowledge management system
- **Page**: A note entity that can contain content and have child pages, forming a hierarchical tree structure
- **Editor**: The rich text and Markdown editing component using Tiptap
- **AI_Service**: The Google Gemini API integration for content enhancement and generation
- **Flashcard**: A spaced repetition learning card associated with a page
- **Spaced_Repetition_Engine**: The algorithm managing flashcard review scheduling
- **PWA**: Progressive Web Application enabling mobile-first flashcard review
- **Frontend**: React + TypeScript + TailwindCSS application
- **Backend**: FastAPI REST API server
- **Database**: PostgreSQL database storing all application data
- **Mastery_Score**: A numeric value tracking user's proficiency with a flashcard
- **Admin**: A user role with full system access and ability to manage users and share pages
- **User**: A user role with access to own pages and shared pages from others
- **Page_Share**: A relationship granting specific users access to specific pages
- **Permission_Level**: The access level for a shared page (view_only or edit)

## Requirements

### Requirement 1: Hierarchical Page Structure

**User Story:** As a learner, I want to organize my notes in a hierarchical tree structure, so that I can maintain logical relationships between topics and subtopics.

#### Acceptance Criteria

1. THE Database SHALL store pages with a parent_id field enabling tree hierarchy
2. WHEN a page is created, THE Backend SHALL allow optional parent_id assignment
3. THE Frontend SHALL display pages in a tree navigation structure
4. WHEN a page is deleted, THE Backend SHALL handle child pages according to cascade rules
5. THE Backend SHALL prevent circular parent-child relationships
6. FOR ALL pages in the hierarchy, traversing from any page to root SHALL terminate in finite steps (acyclic property)

### Requirement 2: Dual-Mode Content Editor

**User Story:** As a learner, I want to edit content in both rich text and Markdown modes, so that I can choose the editing experience that suits my workflow.

#### Acceptance Criteria

1. THE Editor SHALL store all content internally as Markdown format
2. THE Editor SHALL provide a toggle between rich text and Markdown editing modes
3. WHEN rich text mode is active, THE Editor SHALL render Markdown as formatted content
4. WHEN Markdown mode is active, THE Editor SHALL display raw Markdown syntax
5. WHEN switching between modes, THE Editor SHALL preserve content without data loss
6. FOR ALL valid Markdown content, switching from Markdown to rich text and back to Markdown SHALL produce equivalent content (round-trip property)

### Requirement 3: AI Text Enhancement Operations

**User Story:** As a learner, I want AI-powered operations on selected text, so that I can improve my notes and generate study materials efficiently.

#### Acceptance Criteria

1. WHEN text is selected in the Editor, THE Frontend SHALL display AI operation options
2. WHEN "Rephrase" is requested, THE AI_Service SHALL return alternative phrasing maintaining original meaning
3. WHEN "Enhance" is requested, THE AI_Service SHALL return expanded content with additional details
4. WHEN "Simplify" is requested, THE AI_Service SHALL return simplified explanation with reduced complexity
5. WHEN "Generate Interview Questions" is requested, THE AI_Service SHALL return relevant technical interview questions
6. WHEN "Generate Flashcards" is requested, THE AI_Service SHALL return question-answer pairs suitable for spaced repetition
7. THE AI_Service SHALL return all outputs as structured JSON format
8. WHEN AI operation fails, THE Frontend SHALL display descriptive error message to the user

### Requirement 4: Handwritten Image to Markdown Conversion

**User Story:** As a learner, I want to upload handwritten notes and convert them to structured Markdown, so that I can digitize my physical study materials.

#### Acceptance Criteria

1. WHEN a handwritten image is uploaded, THE AI_Service SHALL extract text content using OCR capabilities
2. THE AI_Service SHALL structure extracted content as valid Markdown format
3. THE Backend SHALL accept image uploads in common formats (JPEG, PNG, HEIC)
4. WHEN conversion completes, THE Frontend SHALL display the generated Markdown for user review
5. THE Frontend SHALL allow users to edit the generated Markdown before saving
6. WHEN image quality is insufficient, THE AI_Service SHALL return an error with guidance

### Requirement 5: Spaced Repetition Flashcard System

**User Story:** As a learner, I want flashcards with spaced repetition scheduling, so that I can efficiently memorize and retain technical knowledge.

#### Acceptance Criteria

1. THE Database SHALL store flashcards with fields: question, answer, page_id, last_reviewed_at, next_review_at, review_count, mastery_score
2. WHEN a flashcard is reviewed with "Easy" rating, THE Spaced_Repetition_Engine SHALL schedule next review 7 days later
3. WHEN a flashcard is reviewed with "Medium" rating, THE Spaced_Repetition_Engine SHALL schedule next review 4 days later
4. WHEN a flashcard is reviewed with "Hard" rating, THE Spaced_Repetition_Engine SHALL schedule next review 2 days later
5. WHEN a flashcard is reviewed, THE Spaced_Repetition_Engine SHALL increment review_count by 1
6. WHEN a flashcard is reviewed, THE Spaced_Repetition_Engine SHALL update mastery_score based on rating history
7. THE Backend SHALL return flashcards due for review where next_review_at is less than or equal to current timestamp
8. FOR ALL flashcards, review_count SHALL be non-negative (invariant property)

### Requirement 6: Page-Flashcard Association

**User Story:** As a learner, I want flashcards to belong to specific pages, so that I can organize study materials by topic.

#### Acceptance Criteria

1. THE Database SHALL enforce foreign key relationship between flashcards and pages
2. WHEN a page is deleted, THE Backend SHALL handle associated flashcards according to cascade rules
3. THE Frontend SHALL display flashcards grouped by their parent page
4. WHEN viewing a page, THE Frontend SHALL show all flashcards associated with that page
5. THE Backend SHALL allow querying flashcards by page_id

### Requirement 7: Mobile-First Flashcard Review Interface

**User Story:** As a learner, I want a mobile-optimized flashcard review experience, so that I can study efficiently on my phone.

#### Acceptance Criteria

1. THE Frontend SHALL provide a mobile-responsive flashcard review interface
2. THE Frontend SHALL support swipe gestures for flashcard navigation on touch devices
3. WHEN a flashcard is displayed, THE Frontend SHALL show the question first
4. WHEN the user taps the flashcard, THE Frontend SHALL reveal the answer
5. THE Frontend SHALL provide Easy, Medium, and Hard rating buttons with touch-friendly sizing
6. THE Frontend SHALL display review progress (cards remaining, cards completed)
7. WHILE reviewing flashcards, THE Frontend SHALL maintain smooth animations and transitions

### Requirement 8: Progressive Web Application Support

**User Story:** As a learner, I want to install MemoryEngine as a PWA on my mobile device, so that I can access it like a native app with offline capabilities.

#### Acceptance Criteria

1. THE Frontend SHALL include a valid PWA manifest file with app metadata
2. THE Frontend SHALL register a service worker for offline functionality
3. THE Frontend SHALL be installable on mobile devices (iOS and Android)
4. WHEN installed, THE PWA SHALL display app icon on device home screen
5. THE PWA SHALL cache essential assets for offline flashcard review
6. WHEN offline, THE PWA SHALL display cached flashcards and queue review updates
7. WHEN connection is restored, THE PWA SHALL sync queued updates to the Backend

### Requirement 9: RESTful API Architecture

**User Story:** As a developer, I want a well-structured REST API, so that the frontend and backend can communicate efficiently and the system is maintainable.

#### Acceptance Criteria

1. THE Backend SHALL implement RESTful endpoints for pages (CRUD operations)
2. THE Backend SHALL implement RESTful endpoints for flashcards (CRUD operations)
3. THE Backend SHALL implement endpoints for AI operations (rephrase, enhance, simplify, generate)
4. THE Backend SHALL implement authentication and authorization endpoints
5. THE Backend SHALL return responses in JSON format
6. WHEN an error occurs, THE Backend SHALL return appropriate HTTP status codes and error messages
7. THE Backend SHALL validate all incoming request data
8. THE Backend SHALL implement CORS configuration for frontend domain

### Requirement 10: Database Schema and Relationships

**User Story:** As a developer, I want a well-designed database schema, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE Database SHALL define a users table with fields: id, email, password_hash, created_at, updated_at
2. THE Database SHALL define a pages table with fields: id, user_id, parent_id, title, content, created_at, updated_at
3. THE Database SHALL define a flashcards table with fields: id, page_id, user_id, question, answer, last_reviewed_at, next_review_at, review_count, mastery_score, created_at, updated_at
4. THE Database SHALL enforce foreign key constraints between tables
5. THE Database SHALL create indexes on frequently queried fields (user_id, parent_id, page_id, next_review_at)
6. THE Database SHALL use CASCADE or SET NULL for foreign key deletion rules as appropriate
7. FOR ALL pages with parent_id, the referenced parent page SHALL exist in the database (referential integrity)

### Requirement 11: Google Gemini API Integration

**User Story:** As a developer, I want to integrate Google Gemini API for AI features, so that the system can provide intelligent content enhancement within free tier limits.

#### Acceptance Criteria

1. THE AI_Service SHALL authenticate with Google Gemini API using API key
2. THE AI_Service SHALL handle rate limiting according to free tier constraints
3. WHEN rate limit is exceeded, THE AI_Service SHALL return appropriate error message
4. THE AI_Service SHALL implement retry logic with exponential backoff for transient failures
5. THE AI_Service SHALL validate API responses before returning to Frontend
6. THE AI_Service SHALL log all API interactions for debugging and monitoring
7. THE Backend SHALL store API key securely in environment variables

### Requirement 12: Deployment Architecture

**User Story:** As a developer, I want a clear deployment strategy across multiple platforms, so that the system is reliable and scalable.

#### Acceptance Criteria

1. THE Frontend SHALL be deployable to Vercel with automatic builds from git repository
2. THE Backend SHALL be deployable to Render with automatic builds from git repository
3. THE Database SHALL be hosted on Supabase with connection pooling enabled
4. THE Backend SHALL connect to Database using connection string from environment variables
5. THE Frontend SHALL connect to Backend using API URL from environment variables
6. WHEN deployment fails, THE deployment platform SHALL provide error logs
7. THE deployment configuration SHALL support separate staging and production environments

### Requirement 13: Authentication and Authorization

**User Story:** As a learner, I want secure authentication, so that my notes and progress are private and protected.

#### Acceptance Criteria

1. WHEN a user registers, THE Backend SHALL hash passwords using secure algorithm (bcrypt or argon2)
2. WHEN a user logs in, THE Backend SHALL verify credentials and return JWT token
3. THE Backend SHALL validate JWT tokens on protected endpoints
4. WHEN token is invalid or expired, THE Backend SHALL return 401 Unauthorized status
5. THE Backend SHALL ensure users can only access their own pages and flashcards
6. THE Backend SHALL implement token refresh mechanism for extended sessions
7. THE Frontend SHALL store authentication tokens securely (httpOnly cookies or secure storage)

### Requirement 14: Content Search and Filtering

**User Story:** As a learner, I want to search through my notes and flashcards, so that I can quickly find specific information.

#### Acceptance Criteria

1. WHEN a search query is submitted, THE Backend SHALL search page titles and content
2. THE Backend SHALL return search results ranked by relevance
3. THE Frontend SHALL highlight search terms in results
4. THE Backend SHALL support filtering flashcards by mastery level
5. THE Backend SHALL support filtering pages by creation date
6. THE Backend SHALL implement pagination for search results
7. WHEN search query is empty, THE Backend SHALL return all accessible pages

### Requirement 15: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can debug issues and maintain system reliability.

#### Acceptance Criteria

1. WHEN an exception occurs, THE Backend SHALL log error details with timestamp and context
2. THE Backend SHALL return user-friendly error messages without exposing sensitive information
3. THE Frontend SHALL display error messages in a consistent UI pattern
4. THE Backend SHALL log all API requests with method, path, and response status
5. WHEN database connection fails, THE Backend SHALL retry connection with exponential backoff
6. THE Backend SHALL implement health check endpoint for monitoring
7. THE logging system SHALL support different log levels (DEBUG, INFO, WARNING, ERROR)

### Requirement 16: Role-Based Access Control

**User Story:** As an admin, I want role-based access control, so that I can manage the system and control who has access to what content.

#### Acceptance Criteria

1. THE Database SHALL store user roles (admin or user) in the users table
2. WHEN the first user registers, THE Backend SHALL assign admin role automatically
3. WHEN subsequent users register, THE Backend SHALL assign user role by default
4. THE Backend SHALL allow admins to change user roles
5. THE Backend SHALL restrict admin-only operations to users with admin role
6. WHEN a non-admin attempts admin operations, THE Backend SHALL return 403 Forbidden status
7. FOR ALL users, the role field SHALL be either 'admin' or 'user' (enum constraint)

### Requirement 17: Selective Page Sharing

**User Story:** As an admin or page owner, I want to share specific pages with specific users, so that I can collaborate without exposing all my notes.

#### Acceptance Criteria

1. THE Database SHALL define a page_shares table with fields: id, page_id, owner_id, shared_with_user_id, permission_level, created_at
2. WHEN a page is shared, THE Backend SHALL create a page_share record with specified permission level
3. THE Backend SHALL support two permission levels: view_only and edit
4. WHEN a user queries pages, THE Backend SHALL return owned pages and pages shared with them
5. WHEN a user with view_only permission attempts to edit, THE Backend SHALL return 403 Forbidden status
6. WHEN a user with edit permission modifies a shared page, THE Backend SHALL allow the operation
7. THE Backend SHALL allow page owners to revoke shares by deleting page_share records
8. WHEN a page is deleted, THE Backend SHALL cascade delete all associated page_shares
9. FOR ALL page_shares, the permission_level SHALL be either 'view_only' or 'edit' (enum constraint)

### Requirement 18: Page Title Search

**User Story:** As a learner, I want to search pages by title, so that I can quickly find specific notes by name.

#### Acceptance Criteria

1. WHEN a search query is submitted, THE Backend SHALL search both page titles and content
2. THE Backend SHALL prioritize title matches over content matches in search results
3. THE Backend SHALL support case-insensitive title search
4. THE Backend SHALL return pages where the title contains the search query as a substring
5. THE Frontend SHALL display search results with titles highlighted
6. THE Backend SHALL include shared pages in search results based on user permissions
7. WHEN searching, THE Backend SHALL return pages ordered by: exact title match, title contains query, content contains query
