# TravelFlow - Travel Agency Management System

## Overview
TravelFlow is a comprehensive travel agency management system designed for super admins and travel agencies, featuring role-based access control. It manages bus operations, traveler data uploads, and agency approval workflows. The system aims to streamline travel agency operations, from bus and route management to efficient communication with travelers via integrated messaging.

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
- **UI/UX**: Airbnb-inspired color scheme, responsive, mobile-first design, role-based sidebar navigation, consistent card-based layouts.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (Replit Auth)
- **Session Management**: Express Session with PostgreSQL store
- **File Upload**: Multer for handling CSV/Excel files

### Key Design Decisions
- **Full-stack TypeScript**: Ensures type safety across client and server.
- **Shared Schema**: Common types and validation schemas in `/shared` directory.
- **Component-based UI**: Reusable shadcn/ui components for consistency.
- **Role-based Access**: Different interfaces for super admins vs agencies.
- **Security**: Multi-tier rate limiting, comprehensive input validation (Zod), secure file upload handling, robust security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), sanitised error responses, secure logging, strict CORS configuration.
- **Authentication**: Replit OpenID Connect provider, PostgreSQL session storage, role-based middleware, HTTP-only cookies, strong password policy, generic error messages for account protection.
- **Data Flow**: Structured processes for agency registration, bus management, and traveler data uploads, including CSV/Excel processing and association with buses.
- **WhatsApp Integration**: Manual and batch messaging capabilities for agencies, dynamic message templates, and status tracking for messages.
- **Deployment Ready**: Compliant with Replit Autoscale requirements - no background intervals, uses process.env.PORT without fallback, API endpoint for message processing.

### Database Schema
- **Users**: Profile information and roles.
- **Agencies**: Registration and approval.
- **Buses**: Vehicle information and routes.
- **Traveler Data**: Passenger information.
- **Upload History**: File processing tracking.
- **Sessions**: Authentication session storage.
- **WhatsApp Config**: API configuration for providers.
- **WhatsApp Templates**: Message templates with dynamic variables.
- **WhatsApp Queue**: Scheduled and sent message tracking.
- **Agency API Providers**: SAAS provider credentials (ITS, Bitla, etc.) with agency-specific SWDL URLs, Company IDs, and VerifyCall tokens stored per agency.
- **Agency API Endpoints**: Individual SOAP/XML API configurations per provider with request/response templates and extraction rules.

## External Dependencies

- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OpenID Connect
- **File Processing**: Multer
- **Validation**: Zod
- **UI Components**: Radix UI primitives
- **WhatsApp API**: BhashSMS API (http://bhashsms.com/api/sendmsg.php, http://bhashsms.com/api/sendmsgutil.php)

## Recent Changes (January 2025)

### Deployment Fixes for Replit Autoscale
- **Removed Background Interval**: Eliminated setInterval for WhatsApp message processing that violated Autoscale requirements
- **Fixed Port Configuration**: Updated server to use `process.env.PORT!` without fallback to ensure proper port binding in production
- **Added API Endpoint**: Created `/api/whatsapp/process-messages` endpoint for manual WhatsApp message processing
- **Updated UI**: Added "Process Messages" button in admin WhatsApp configuration page for manual message processing
- **Compliance**: System now fully complies with Replit Autoscale deployment requirements

### Node-fetch Deployment Resolution (January 2025)
- **Resolved Runtime Dependency Error**: Fixed missing 'node-fetch' package causing deployment failures
- **Updated to Native Fetch**: Converted `whatsapp-delivery-debug.ts` and `whatsapp-delivery-test.ts` to use Node.js native fetch API (available in Node.js 18+)
- **Added Backup Dependency**: Installed node-fetch as production dependency to ensure runtime availability
- **Fixed TypeScript Errors**: Resolved async/await and error handling issues in debugging tools
- **Build Process**: Verified build command works correctly with esbuild external packages configuration
- **Production Ready**: Application now builds and deploys successfully on Replit infrastructure

### Excel Upload Enhancement (January 2025)
- **Multiple Trip Support**: Passengers can now travel multiple times - each upload creates new records instead of updating existing ones
- **Duplicate Prevention Within Upload**: Removes duplicate phone numbers within the same Excel file to prevent multiple WhatsApp messages to same passenger on same day
- **Data Handling**: Filters out duplicate phone numbers and missing phone records within each upload
- **Improved Messaging**: Clear feedback showing total uploaded vs removed duplicates/missing records
- **Business Logic**: Supports real-world travel patterns while respecting WhatsApp messaging limits per day

### WhatsApp Duplicate Prevention Fix (January 2025)
- **Critical Fix**: Added duplicate phone number filtering in WhatsApp batch processing to prevent multiple messages to same passenger
- **Batch Processing**: Both regular and large batch processing now filter duplicate phone numbers before sending messages
- **Console Logging**: Added detailed logging to track duplicate prevention in WhatsApp processing
- **Multiple Message Prevention**: System now ensures each phone number receives only one WhatsApp message per batch, regardless of duplicate database entries
- **Safety Measures**: Prevents accidental multiple messaging that could annoy customers and waste API credits

### Complete WhatsApp Security Audit and Lockdown (January 2025)
- **CRITICAL SECURITY FIX**: Disabled all dangerous endpoints making unauthorized WhatsApp API calls
- **Zero Unauthorized Calls**: Only explicit batch processing through `/api/agency/whatsapp/send-batch/:uploadId` allowed
- **Test Endpoints Disabled**: All test endpoints (test-individual, test-traveler, test-image, debug-test) completely disabled
- **Bulk Send Disabled**: Dangerous send-all and send-large-batch endpoints disabled to prevent unauthorized mass sends
- **API Dashboard Fixed**: Accurate date-based filtering showing selected date vs total usage with proper batch filtering
- **Cost Management**: Precise API call tracking with only legitimate sends counted, no test calls or unwanted operations
- **Production Security**: System now fully secured against unauthorized WhatsApp API usage with comprehensive audit trail

### WhatsApp Duplicate API Call Prevention Fix (January 2025)
- **CRITICAL BUG FIX**: Eliminated duplicate API calls caused by interrupted batch processing and retries
- **Race Condition Fixed**: Immediate status update after API response prevents duplicate processing during interruptions
- **Status Flow Protection**: Enhanced 'processing' status prevents retries from calling same numbers multiple times
- **Smart Cleanup**: Only resets stuck 'processing' records older than 5 minutes to prevent interference with active batches
- **Bulletproof Retry Safety**: System now handles server restarts, network timeouts, and manual stops without duplicate API charges
- **Cost Protection**: Prevents scenarios like phone number 8680081833 being called 3 times due to retry attempts

### SAAS Provider Integration System (October 2025)
- **Two-Tier Architecture**: Separated provider credentials from API endpoint configurations for maximum flexibility
- **Agency-Specific Credentials**: Each agency stores unique SWDL URL, Company ID, and VerifyCall token - all configurable via UI
- **Multi-Provider Support**: Agencies can configure multiple providers (ITS, Bitla, custom providers) simultaneously
- **Direct Storage**: VerifyCall tokens stored directly in database per agency (no global encryption key required)
- **SOAP/XML Configuration**: Individual API endpoint management with request templates, response templates, and extraction rules
- **Super Admin Only**: Provider configuration restricted to super_admin role for security
- **Complete REST API**: Full CRUD operations for providers and endpoints with Zod validation
- **UI Integration**: New "SAAS Providers" tab in agency details page with provider and endpoint management dialogs
- **Database Tables**: `agency_api_providers` for credentials, `agency_api_endpoints` for SOAP/XML configurations
- **Coupon Integration**: GetRoutesWithCouponDetails API integrated with bus search endpoint
  - Automatically fetches and filters expired coupons (DD-MM-YYYY format)
  - Returns valid coupons alongside bus routes in `/api/bus/search` response
  - Non-critical error handling ensures coupon failures don't affect bus search results
  - Coupon data includes: code, description, discountType (Percentage/Fixed), discountValue, expiryDate