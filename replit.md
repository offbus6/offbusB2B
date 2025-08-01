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

## External Dependencies

- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OpenID Connect
- **File Processing**: Multer
- **Validation**: Zod
- **UI Components**: Radix UI primitives
- **WhatsApp API**: BhashSMS API (http://bhashsms.com/api/sendmsg.php, http://bhashsms.com/api/sendmsgutil.php)