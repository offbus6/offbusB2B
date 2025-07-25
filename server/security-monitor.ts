import { Request, Response } from "express";

interface SecurityEvent {
  timestamp: Date;
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'INVALID_INPUT' | 'UNAUTHORIZED_ACCESS' | 'FILE_UPLOAD_ERROR';
  ip: string;
  userAgent?: string;
  endpoint: string;
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory
  private suspiciousIPs = new Map<string, number>();
  private readonly maxFailuresPerIP = 10;

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Track suspicious IPs
    if (event.type === 'AUTH_FAILURE' || event.type === 'UNAUTHORIZED_ACCESS') {
      const count = this.suspiciousIPs.get(event.ip) || 0;
      this.suspiciousIPs.set(event.ip, count + 1);
    }

    // Log critical events immediately
    if (event.severity === 'CRITICAL') {
      console.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, {
        ip: event.ip,
        endpoint: event.endpoint,
        details: event.details,
        timestamp: securityEvent.timestamp
      });
    }
  }

  isSuspiciousIP(ip: string): boolean {
    return (this.suspiciousIPs.get(ip) || 0) >= this.maxFailuresPerIP;
  }

  getRecentEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  getSecuritySummary(hours: number = 24): any {
    const recentEvents = this.getRecentEvents(hours);
    
    const summary = {
      totalEvents: recentEvents.length,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      suspiciousIPs: Array.from(this.suspiciousIPs.entries())
        .filter(([_, count]) => count >= 3)
        .map(([ip, count]) => ({ ip, failureCount: count })),
      topEndpoints: {} as Record<string, number>,
      lastUpdated: new Date()
    };

    recentEvents.forEach(event => {
      // Count by type
      summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
      
      // Count by severity
      summary.eventsBySeverity[event.severity] = (summary.eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by endpoint
      summary.topEndpoints[event.endpoint] = (summary.topEndpoints[event.endpoint] || 0) + 1;
    });

    return summary;
  }

  clearOldEvents(days: number = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > cutoff);
    
    // Also clear old suspicious IP records
    this.suspiciousIPs.clear();
  }
}

export const securityMonitor = new SecurityMonitor();

// Middleware to log security events
export function createSecurityMiddleware() {
  return (req: Request, res: Response, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log failed authentication attempts
      if (res.statusCode === 401 && req.path.includes('/auth/')) {
        securityMonitor.logSecurityEvent({
          type: 'AUTH_FAILURE',
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: {
            method: req.method,
            body: req.body ? 'present' : 'absent'
          },
          severity: 'MEDIUM'
        });
      }
      
      // Log unauthorized access attempts
      if (res.statusCode === 403) {
        securityMonitor.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS',
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: {
            method: req.method,
            user: (req.session as any)?.user?.id || 'anonymous'
          },
          severity: 'HIGH'
        });
      }
      
      // Log input validation failures
      if (res.statusCode === 400 && req.path.includes('/api/')) {
        securityMonitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: {
            method: req.method
          },
          severity: 'LOW'
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Clean up old events every hour
setInterval(() => {
  securityMonitor.clearOldEvents();
}, 60 * 60 * 1000);