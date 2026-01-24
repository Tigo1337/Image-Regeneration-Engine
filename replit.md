# RoomReimagine AI

## Overview

RoomReimagine AI is a full-stack interior design application that leverages Google's Gemini Vision API to intelligently redesign room interiors while preserving specific user-selected objects. The application allows users to upload room images, specify elements to keep unchanged, and apply various design styles with configurable creativity levels. Built with React, Express, and TypeScript, it features a professional dark-mode interface optimized for design professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, configured with custom plugins for Replit integration
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and API request handling

**UI Component System:**
- **Shadcn UI** component library with Radix UI primitives for accessible, composable components
- **TailwindCSS** for utility-first styling with custom design tokens
- **Dark mode** as the primary theme using CSS custom properties
- Component library follows the "New York" style variant with customized color system

**Form Management:**
- **React Hook Form** with Zod schema validation for type-safe form handling
- **@hookform/resolvers** for integrating Zod schemas with form validation

**File Upload:**
- **react-dropzone** for drag-and-drop image upload functionality
- Support for both local file uploads and Cloudinary URL inputs via dual-tab interface

**Design System:**
- Two-column layout: fixed-width sidebar (controls) + flexible main canvas (image display)
- Consistent spacing scale using Tailwind units (2, 4, 6, 8, 12, 16)
- Typography hierarchy with Inter/DM Sans primary font and JetBrains Mono for technical labels
- Professional color palette with HSL-based theming system supporting opacity modifiers

### Backend Architecture

**Server Framework:**
- **Express.js** on Node.js with TypeScript
- Separate development (`index-dev.ts`) and production (`index-prod.ts`) entry points
- Custom middleware for request logging, JSON body parsing (50MB limit for base64 images), and error handling

**API Design:**
- RESTful endpoint structure
- Primary endpoint `/api/generate` for room redesign generation
- Dedicated `/api/modify-generated` endpoint for modifying previously generated images
  - Uses `modifyGeneratedRequestSchema` for zod validation
  - Logs to `prompt_logs` table with job type "modify-generated"
  - Supports creativity levels 1-4 for controlled modification intensity
- Request/response validation using Zod schemas shared between client and server

**Image Processing:**
- **Sharp** library for server-side image optimization and resizing
- Automatic image compression to meet Gemini API constraints:
  - Maximum 8MB file size
  - Maximum 2048px dimensions
  - Dynamic quality adjustment (80-30%) to meet size limits
- Converts images to JPEG format for consistent processing

**AI Integration:**
- **Google Gemini API** (`@google/genai`) using the `gemini-2.5-flash-image` model
- Replit AI Integrations for managed API key handling
- Dynamic prompt construction based on user preferences:
  - Preserved elements specification
  - Target style selection
  - Quality/resolution settings
  - Creativity level (0-100%)
- System instruction emphasizes photorealistic output with pixel-level preservation of specified objects

**Development Environment:**
- **tsx** for TypeScript execution in development
- **esbuild** for production bundling
- Hot module replacement (HMR) via Vite middleware in development
- Replit-specific plugins for error overlays and dev tooling

### Data Layer

**Database Configuration:**
- **Drizzle ORM** configured for PostgreSQL via `@neondatabase/serverless`
- Schema defined in TypeScript (`shared/schema.ts`)
- Migrations managed in `./migrations` directory
- Currently includes user storage interface with in-memory implementation (`MemStorage`)

**State Management:**
- Client-side: TanStack Query for server state caching and synchronization
- Local state: React hooks for UI state (image preview, form inputs)
- No persistent client-side storage currently implemented

**Validation Layer:**
- **Zod** schemas for runtime type validation
- Shared schema definitions between client and server ensure type consistency
- Request schema validates:
  - Preserved elements (required string)
  - Target style (enum: Modern, Contemporary, Boho, Industrial, Scandinavian, Mid-Century Modern)
  - Quality preset (enum: Standard, High Fidelity 2K, Ultra 4K)
  - Aspect ratio (enum: Original, 16:9, 1:1, 4:3)
  - Creativity level (number 0-100)

### Key Architectural Decisions

**Monorepo Structure:**
- Unified codebase with `/client`, `/server`, and `/shared` directories
- Path aliases configured (`@/`, `@shared/`, `@assets/`) for clean imports
- Shared TypeScript configuration ensures consistency

**Image Handling Strategy:**
- Base64 encoding for image transmission (client → server → Gemini)
- Server-side preprocessing ensures API compatibility without client complexity
- Automatic fallback quality reduction prevents request failures

**API Communication:**
- Custom `apiRequest` wrapper for consistent error handling
- JSON-based request/response format
- Toast notifications for user feedback on success/error states

**Development vs Production:**
- Development: Vite dev server with middleware mode for unified development experience
- Production: Static file serving with Express after Vite build step
- Environment-specific code paths prevent dev dependencies in production builds

## External Dependencies

### AI Services
- **Google Gemini API** (via Replit AI Integrations): Primary AI service for image generation and redesign
  - Model: `gemini-2.5-flash-image`
  - Authentication: API key via environment variables (`AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`)
  - Purpose: Vision-based interior design transformation

### Image Services
- **Cloudinary**: Supported as an optional image input source (URL-based)
  - Purpose: Alternative to direct file upload for accessing existing images

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
  - Connection: Via `@neondatabase/serverless` driver
  - Configuration: `DATABASE_URL` environment variable
  - ORM: Drizzle for type-safe database operations

### UI Component Libraries
- **Radix UI**: Comprehensive collection of unstyled, accessible UI primitives
  - 20+ component primitives (Dialog, Dropdown, Select, Tabs, etc.)
  - Purpose: Accessible, composable foundation for custom components

### Development Tools
- **Replit Platform Services**:
  - Vite plugin for runtime error modal
  - Cartographer plugin for development insights
  - Dev banner plugin
  - Managed hosting and environment configuration

### Build & Development Dependencies
- **TypeScript**: Type system and compiler
- **Vite**: Build tool and dev server
- **esbuild**: Production JavaScript bundler
- **PostCSS** with **Autoprefixer**: CSS processing
- **tsx**: TypeScript execution for development
- **Storybook**: Component development and documentation
  - Run with: `CI=true npx storybook dev -p 6007 --host 0.0.0.0`
  - Port: 6007 (separate from main app on 5000)
  - Stories located in `stories/` and `client/src/**/*.stories.tsx`