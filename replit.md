# TravelFlow - Travel Agency Management System

## Overview
TravelFlow is a comprehensive travel agency management system built with React (frontend) and Express.js (backend), featuring role-based access control for super admins and travel agencies. The system handles bus management, traveler data uploads, and agency approval workflows.

## User Preferences
Preferred communication style: Simple, everyday language.
Authentication: Email and password only (no username field required).
Agency login: Unapproved agencies can login but see pending approval page with contact information.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (Replit Auth)
- **Session Management**: Express Session with PostgreSQL store
- **File Upload**: Multer for handling CSV/Excel files

### Key Design Decisions
- **Full-stack TypeScript**: Ensures type safety across client and server
- **Shared Schema**: Common types and validation schemas in `/shared` directory
- **Component-based UI**: Reusable shadcn/ui components for consistency
- **Role-based Access**: Different interfaces for super admins vs agencies

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Authorization**: Role-based middleware (super_admin, agency)
- **Security**: HTTP-only cookies with secure flags
- **Password Policy**: 8+ chars, uppercase, lowercase, numbers, special characters
- **Rate Limiting**: 5 authentication attempts per 15 minutes per IP
- **Session Management**: 24-hour timeout with regeneration on login
- **Account Protection**: Generic error messages to prevent user enumeration

### Security Framework
- **Rate Limiting**: Multi-tier rate limiting (auth, general, API endpoints)
- **Input Validation**: Comprehensive validation for all inputs using Zod schemas
- **File Upload Security**: MIME type validation, extension checking, size limits
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Security Monitoring**: Real-time event logging and suspicious activity tracking
- **Error Handling**: Sanitized error responses to prevent information disclosure
- **Logging Security**: Sensitive data sanitization in all logs
- **CORS Configuration**: Strict origin validation and credential handling

### Database Schema
- **Users**: Profile information and roles
- **Agencies**: Travel agency registration and approval
- **Buses**: Vehicle information and routes
- **Traveler Data**: Passenger information uploads
- **Upload History**: File processing tracking
- **Sessions**: Authentication session storage
- **WhatsApp Config**: API configuration for WhatsApp providers
- **WhatsApp Templates**: Message templates with dynamic variables
- **WhatsApp Queue**: Scheduled and sent message tracking

### User Interface
- **Design System**: Airbnb-inspired color scheme
- **Responsive**: Mobile-first design approach
- **Navigation**: Role-based sidebar navigation
- **Components**: Consistent card-based layouts

## Data Flow

### Agency Registration Flow
1. User authenticates via Replit OAuth
2. Agency submits registration form
3. Super admin reviews and approves/rejects
4. Approved agencies gain access to management features

### Bus Management Flow
1. Agency creates bus entries with routes and schedules
2. Data validated against schema
3. Stored in PostgreSQL with agency association
4. Available for traveler data uploads

### Traveler Data Flow
1. Agency uploads CSV/Excel files
2. Backend processes and validates data
3. Associates travelers with specific buses
4. Stores processed data for management

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OpenID Connect
- **File Processing**: Multer for uploads
- **Validation**: Zod for schema validation
- **UI Components**: Radix UI primitives

### Development Tools
- **TypeScript**: Type safety and development experience
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `/dist/public`
- **Backend**: ESBuild bundles server code to `/dist`
- **Database**: Drizzle migrations for schema changes

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Allowed domains for auth
- **ISSUER_URL**: OpenID Connect issuer

### Production Considerations
- **Static Assets**: Served from `/dist/public`
- **API Routes**: Prefixed with `/api`
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Query optimization and caching

### Development vs Production
- **Development**: Vite dev server with HMR
- **Production**: Static file serving with Express
- **Database**: Drizzle migrations and pooling
- **Authentication**: Secure cookie configuration

## Recent Changes (January 2025)
- Updated authentication system to use email instead of username across all login forms
- Modified backend authentication routes to handle email-based login for all user types  
- Enhanced agency login system to allow unapproved agencies to login and see pending approval page
- Added contact information (+91 9900408888) and 24-hour wait message for pending agencies
- Updated pending approval page with call-to-action for faster approval process
- **CRITICAL: Removed all dummy/static data and hardcoded credentials (July 18, 2025)**
- System now uses only live database data - no seeding, no static responses
- Removed admin credentials and dummy agency data from codebase
- Database cleared of all test data, preserving only real user signups
- **FIXED: Logout functionality now works properly (July 18, 2025)**
- Fixed session destruction to clear all session data and global variables
- Updated frontend logout to properly clear cache and reload
- Corrected logout URL from /api/logout to /api/auth/logout in agency pages
- **FIXED: Agency login API requests - frontend now uses correct apiRequest signature (July 18, 2025)**
- Fixed "Unexpected token '<!DOCTYPE'" error by updating all frontend apiRequest calls
- Updated signup route to handle all form fields (email, password, firstName, lastName, agencyName, phone, city, state, logoUrl)
- Added getUserByEmail method to prevent duplicate email registrations
- Fixed backend/frontend mismatch in signup and login API calls
- All authentication flows now working correctly - signup, login, logout, and admin approval
- **IMPLEMENTED: WhatsApp Business API Integration (July 18, 2025)**
- Added comprehensive WhatsApp configuration page in admin dashboard
- Created database schema for WhatsApp API config, message templates, and message queue
- Implemented message template system with dynamic variables (traveler name, agency name, coupon codes)
- Added automated follow-up scheduling for 30, 60, 90-day intervals after travel data upload
- Built WhatsApp service with message processing and template variable replacement
- Admin can configure API credentials for multiple providers (Business API, Twilio, MessageBird)
- Added message queue management and delivery status tracking
- Integrated test message functionality for API validation
- **FIXED: Application startup and routing issues (July 22, 2025)**
- Resolved react-router-dom conflicts by ensuring consistent use of wouter for routing
- Fixed TypeScript errors in header component with proper type casting for user and notifications
- Added missing /bus-search route to public routing configuration
- **TRANSFORMED: Bus search into travel coupon aggregator (July 22, 2025)**
- Converted bus search page from seat selection to coupon/deal aggregator
- Added real travel platform deals (RedBus, MakeMyTrip, Goibibo, Paytm, etc.)
- Implemented price comparison with original vs discounted prices
- Added external redirect functionality to partner travel websites
- Shows coupon codes, terms, validity, and savings calculations
- **IMPLEMENTED: Comprehensive Security Framework (July 25, 2025)**
- Added centralized security configuration with password validation, email sanitization, and phone validation
- Implemented advanced rate limiting (5 auth attempts, 100 general requests, 20 API calls per IP)
- Enhanced file upload security with MIME type validation, extension checking, and filename sanitization
- Added comprehensive security headers (HSTS, CSP, X-Frame-Options, CSRF protection)
- Implemented security monitoring system with event logging and suspicious IP tracking
- Added security dashboard for admins to monitor authentication failures and security events
- Enhanced error handling to prevent information disclosure and application crashes
- Sanitized logging to prevent sensitive data exposure (passwords, tokens, API keys)
- Fixed session management with secure cookies, session regeneration, and timeout handling
- Added input validation across all endpoints to prevent injection attacks