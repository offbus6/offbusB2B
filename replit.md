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
- **FIXED: Application startup, agency deletion, and signup issues (July 26, 2025)**
- Resolved port conflict that prevented application startup by killing duplicate server processes
- Added missing `/api/admin/agencies/:id` DELETE endpoint for proper agency deletion
- Fixed agency signup flow by adding `/api/auth/signup` route with proper field mapping
- Enhanced bus deletion permissions to allow both agencies and super admins
- All CRUD operations now working correctly for agencies and buses
- **COMPLETED: WhatsApp Testing System with BhashSMS API Integration (July 26, 2025)**
- Implemented comprehensive WhatsApp testing functionality using BhashSMS API (http://bhashsms.com/api/sendmsgutil.php)
- Added WhatsApp Testing page with single message and bulk testing capabilities
- Integrated with existing WhatsApp templates and user data from Intercity Travels
- Tested with user data: Shubin (9900408817) and Sukan (8088635590) with coupon code Save10
- API requires approved WhatsApp Business templates - system ready for activation once templates approved
- Added comprehensive status tracking (sent, failed, pending, template_approval_pending)
- System handles BhashSMS credential management (user=BhashWapAi, pass=bwap@123$, sender=BUZWAP)
- Ready for production use once BhashSMS templates are approved by provider
- **IMPLEMENTED: Manual WhatsApp Messaging System (July 28, 2025)**
- Added manual WhatsApp send buttons for agencies (no automatic sending)
- Created "Send WhatsApp to All" button that only sends to users without successful WhatsApp status
- Individual send buttons for each traveler with status icons (send, sent, failed, retry)
- Approved template system with dynamic variable replacement from database
- Template: "Hi {{1}}, thanks for Traveling with us at {{2}}! Get 20% off on your next trip – use Coupon Code {{3}} 🚀 Valid for Next 90 days at: {{4}} ✨ Hurry Up."
- Agencies can manually send messages after uploading data, with status tracking
- System uses BhashSMS API with utility templates for approved messaging
- Individual retry functionality for failed messages
- WhatsApp status tracking (pending, sent, failed) with visual indicators
- **PERMANENT FIX: Port conflict and backend restart issues (July 26, 2025)**
- Fixed recurring EADDRINUSE port 5000 conflicts that occurred after code updates
- Added graceful shutdown handlers for SIGTERM, SIGINT, and SIGUSR2 signals
- Implemented process cleanup to prevent hanging Node processes
- Added comprehensive error handling for server startup failures
- Created cleanup.sh script to kill existing processes before server restart
- Added uncaught exception and unhandled rejection handlers to prevent zombie processes
- Server now exits cleanly on port conflicts allowing workflow restart to succeed
- System automatically cleans up old processes when code changes are detected
- **FIXED: Agency authentication and signup system (July 28, 2025)**
- Fixed application startup issues by resolving TypeScript errors and port conflicts
- Fixed agency login system - now working with proper API endpoints
- Created comprehensive agency signup page with form validation
- Added test agency account for development testing
- Fixed frontend data handling for empty objects and arrays in uploaded-data component
- Enhanced error handling and user feedback throughout authentication flow
- **IMPLEMENTED: BhashSMS WhatsApp API Integration (July 29, 2025)**
- Successfully integrated final BhashSMS API with working credentials (eddygoo1/123456/BUZWAP)
- Implemented WhatsApp text and image messaging functionality (fully tested and working)
- Created comprehensive test endpoints for message sending and validation
- Text messages working: S.496827, S.349640, S.624726 (confirmed successful delivery)
- Image messages working: S.155793, S.137269, S.686036 (confirmed successful delivery) 
- Added WhatsApp Scheduler page for agencies to send batch messages to uploaded data
- One-click batch messaging system with status tracking (pending/sent/partial)
- Real-time WhatsApp status updates and comprehensive batch management
- **FIXED: WhatsApp batch messaging and upload linking system (July 29, 2025)**
- Fixed critical issue where WhatsApp messages were sent to all uploaded data instead of specific batches
- Added uploadId column to travelerData table to properly link travelers to their upload batches
- Updated upload process to create upload history first, then link travelers with uploadId
- Fixed all WhatsApp API endpoints to use working credentials (eddygoo1/123456) instead of failing ones
- Now WhatsApp Scheduler sends messages only to the specific upload batch selected, not all data from that date
- API test confirmation: S.388703 - all endpoints working correctly with proper batch isolation
- **IMPLEMENTED: Fully Dynamic WhatsApp Message System (July 29, 2025)**
- All WhatsApp messages now pull dynamic data from database for each user:
  * Traveler Name: From uploaded traveler data (td.traveler_name)
  * Agency Name: From agency database (a.name)  
  * Route Information: From bus data (b.from_location to b.to_location)
  * Bus Name: From bus data (b.name)
  * Travel Date: From traveler data (td.travel_date)
  * Coupon Code: From traveler's specific coupon (td.coupon_code)
  * Booking Website: From agency's website URL (a.website or a.booking_website)
- Template format: "Hi [Name], thanks for traveling with us at [Agency]! Your [Route] journey on [Bus] ([Date]) was amazing! Get 20% off - use Coupon Code [Coupon] at [Website]"
- API test confirmation: S.213166 - dynamic personalization working correctly
- **SYSTEM STATUS: FULLY FUNCTIONAL (July 29, 2025)**
- TravelFlow WhatsApp system working perfectly: API connection ✅, credentials valid ✅, dynamic data ✅, database updates ✅
- Recent successful sends: S.835969 (Hari batch), S.238923 (Hari test), S.814148, S.669098, S.165772
- All technical components verified and working correctly
- WhatsApp configuration added to database, batch messaging operational
- **IMPLEMENTED: Complete Dynamic WhatsApp System with Real Data (July 29, 2025)**
- Updated entire system to use exact working BhashSMS API format with dynamic personalization
- All messages now pull real data from database: traveler names, agency names, routes, travel dates, coupon codes, booking URLs
- API format: sendmsg.php with Params=54,877,966,52&htype=image&url=... (confirmed working)
- Recent successful tests: S.622742 (Shubin real data), S.401764 (direct API), S.966279 (test user)
- Sample JPG image included with every message for enhanced user engagement
- System fully functional for production use with all dynamic data integration complete

## BhashSMS API Configuration (UPDATED & ACTIVE)
- **API URL:** http://bhashsms.com/api/sendmsg.php
- **User:** eddygoo1
- **Password:** 123456
- **Sender:** BUZWAP
- **Parameters:** 54,877,966,52
- **Status:** FULLY WORKING ✅
- **Text Messaging:** Fully functional (S.496827 confirmed)
- **Image Messaging:** Fully functional (S.155793 confirmed)
- **Template Support:** Both text and image messages working

## Test Agency Credentials
For testing the agency login and features:
- **Email:** test@testtravelagency.com
- **Password:** TestPass123!
- **Agency Name:** TestTravel Agency
- **Status:** Approved (can access all features)
- **Contact:** John Smith (+91 9876543210)
- **Location:** Mumbai, Maharashtra
- **Sample Data:** 3 buses with 5 travelers for testing WhatsApp and data management features
- **WhatsApp Testing:** 9900408817 (Shubin), 8088635590 (Sukan) - both confirmed working