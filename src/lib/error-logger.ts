// Structured Error Logger
// Centralized error logging with context and severity levels

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogContext {
  timestamp: string
  level: LogLevel
  message: string
  error?: Error
  metadata?: Record<string, unknown>
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  url?: string
  stack?: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: LogContext[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory
  private isDevelopment = process.env.NODE_ENV === 'development'

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  private createLog(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): LogContext {
    const log: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error,
      metadata,
    }

    // Add stack trace for errors
    if (error) {
      log.stack = error.stack
    }

    // Store log
    this.logs.push(log)
    
    // Trim logs if exceeding limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Output to console in development
    if (this.isDevelopment) {
      if (level === 'error') {
        console.error(`[${level.toUpperCase()}]`, message, error || '', metadata || '')
      } else if (level === 'warn') {
        console.warn(`[${level.toUpperCase()}]`, message, error || '', metadata || '')
      } else {
        // Use warn for info/debug levels to comply with lint rules, but prefix with level
        console.warn(`[${level.toUpperCase()}]`, message, error || '', metadata || '')
      }
    }

    return log
  }

  // Main logging methods
  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    return this.createLog('error', message, error, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    return this.createLog('warn', message, undefined, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>) {
    return this.createLog('info', message, undefined, metadata)
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    return this.createLog('debug', message, undefined, metadata)
  }

  // Contextual logging
  logWithContext(context: {
    userId?: string
    sessionId?: string
    ip?: string
    userAgent?: string
    url?: string
  }, level: LogLevel, message: string, error?: Error, metadata?: Record<string, unknown>) {
    const log = this.createLog(level, message, error, metadata)
    Object.assign(log, context)
    return log
  }

  // Get recent logs (for debugging)
  getRecentLogs(limit = 50, level?: LogLevel): LogContext[] {
    let logs = [...this.logs]
    if (level) {
      logs = logs.filter(log => log.level === level)
    }
    return logs.slice(-limit)
  }

  // Clear logs
  clear() {
    this.logs = []
  }

  // Export logs as JSON for external logging services
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance()

// Export individual logging functions
export const logger = {
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) =>
    errorLogger.error(message, error, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) =>
    errorLogger.warn(message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) =>
    errorLogger.info(message, metadata),
  debug: (message: string, metadata?: Record<string, unknown>) =>
    errorLogger.debug(message, metadata),
  withContext: errorLogger.logWithContext.bind(errorLogger),
}

// Helper function to log API errors
export function logAPIError(
  method: string,
  path: string,
  statusCode: number,
  error: Error,
  requestData?: Record<string, unknown>
) {
  return errorLogger.error(
    `API Error ${method} ${path} - ${statusCode}`,
    error,
    {
      method,
      path,
      statusCode,
      requestData,
    }
  )
}

// Helper function to log auth events
export function logAuthEvent(
  event: 'login' | 'logout' | 'failed_login' | 'password_reset',
  userId?: string,
  ip?: string,
  metadata?: Record<string, unknown>
) {
  return errorLogger.info(
    `Auth event: ${event}`,
    { event, userId, ip, ...metadata }
  )
}