# Project Ideas: KrunosPad Revamp

## Core Concept (Revised)

KrunosPad is being revamped into a secure, personal note-taking web application for a single admin user, with controlled public sharing capabilities.

1.  **Admin Authentication:** Only a pre-defined admin user can log in to create and manage notes.
2.  **Private by Default:** Navigating to a URL path (e.g., `/my-private-thoughts`) as the logged-in admin creates a new note associated with that path, which is *private* (admin-only access) initially.
3.  **Explicit Publishing:** The admin can explicitly mark specific notes as public. Public notes are viewable and editable by anyone visiting their specific URL (only that note).
4.  **Admin Dashboard:** A private dashboard for the admin to view, search, edit, publish/unpublish, and manage all their notes.

## Technology Stack (Proposed)

*   **Runtime:** [Bun](https://bun.sh)
*   **Language:** TypeScript
*   **Web Framework:** Hono
*   **Database:** SQLite (using `better-sqlite3`)
*   **Authentication:** Hono middleware for secure sessions/JWT, bcrypt for password hashing.
*   **Templating Engine:** Hono middleware for EJS (or potentially JSX if preferred with Hono).
*   **Input Validation:** Hono middleware for Zod / Joi.
*   **Security Middleware:** Hono middleware (e.g., for Helmet features, rate limiting, CSRF).
*   **(Optional) ORM/Query Builder:** Prisma, TypeORM, or Knex.js could be considered.

## Key Features (Revised & New)

*   **Secure Admin Login:** Dedicated login mechanism for the admin user.
*   **Private Note Creation:** Notes are private to the admin by default.
*   **Public Note Publishing:** Explicit action to toggle note visibility (public/private).
*   **Admin Dashboard:** Centralized note management for the admin.
*   **Note Search:** Admin can search their own notes from the dashboard.
*   **Robust Security:** (XSS, CSRF, SQLi, etc.).
*   **Structured Codebase:** Improved organization (modules, services, repositories).

## Data Persistence

*   Notes (path/slug, content, title, public status, timestamps) will be stored in an SQLite database. Admin credentials stored securely (e.g., hashed in config/env vars).
*   Database schema migrations will be managed.

## Deployment

*   **Docker:** Containerized deployment remains a primary option.
*   **Direct Execution:** Running via Bun will still be possible.

## Configuration

*   Environment variables for database paths, session secrets, admin credentials, ports, etc. 