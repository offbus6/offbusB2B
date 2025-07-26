import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { whatsappService } from "./whatsapp-service";
import { getSession } from "./replitAuth";
import helmet from "helmet";
import cors from "cors";

const app = express();

// Graceful shutdown handler to prevent port conflicts
function gracefulShutdown(signal: string) {
  console.log(`\n${new Date().toLocaleTimeString()} [express] Received ${signal}, shutting down gracefully...`);
  process.exit(0);
}

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions to prevent hanging processes
process.on('uncaughtException', (error) => {
  console.error(`${new Date().toLocaleTimeString()} [express] Uncaught Exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${new Date().toLocaleTimeString()} [express] Unhandled Rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

// Security configurations
app.set('trust proxy', 1); // Trust first proxy
app.disable('x-powered-by'); // Hide Express.js signature

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add session middleware with secure configuration
app.use(getSession());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response data for non-sensitive endpoints and non-success responses for debugging
      if (capturedJsonResponse && !path.includes('/auth/') && res.statusCode >= 400) {
        // Sanitize sensitive data from logs
        const sanitizedResponse = { ...capturedJsonResponse };
        delete sanitizedResponse.password;
        delete sanitizedResponse.token;
        delete sanitizedResponse.access_token;
        delete sanitizedResponse.refresh_token;
        delete sanitizedResponse.apiKey;
        delete sanitizedResponse.apiSecret;
        
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register routes first (this mutates the app and returns it)
  await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log error details for debugging (server-side only)
    console.error(`Error ${status} on ${req.method} ${req.path}:`, {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Send generic error message to client to prevent information disclosure
    const message = status < 500 ? err.message : "Internal Server Error";
    
    // Don't throw the error again to prevent application crashes
    res.status(status).json({ message });
  });

  // Create HTTP server from Express app with error handling
  const PORT = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen({
    port: PORT,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${PORT}`);
  });

  // Handle server errors to prevent hanging processes
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`${new Date().toLocaleTimeString()} [express] Port ${PORT} is already in use. Process will exit for clean restart.`);
      process.exit(1);
    } else {
      console.error(`${new Date().toLocaleTimeString()} [express] Server error:`, error);
      process.exit(1);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
})();

// Process WhatsApp messages every 5 minutes
setInterval(async () => {
  try {
    await whatsappService.processPendingMessages();
  } catch (error) {
    console.error("Error processing WhatsApp messages:", error);
  }
}, 5 * 60 * 1000); // 5 minutes