/**
 * Provides structured logging with different levels and environment-aware output
 */

// Necessary rules for the logger
/* eslint-disable no-console */ // Necessary for logging to the console

/**
 * ANSI color codes for terminal output
 */
const Colors = {
    RESET: '\x1b[0m',
    BRIGHT: '\x1b[1m',
    DIM: '\x1b[2m',

    // Foreground colors
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    GRAY: '\x1b[90m',

    // Background colors
    BG_RED: '\x1b[41m',
    BG_YELLOW: '\x1b[43m',
};

/**
 * Log levels
 */
const LogLevel = {
    /** Detailed information for debugging */
    DEBUG: 0,
    /** General information about system operation */
    INFO: 1,
    /** Warning messages indicating potential issues */
    WARN: 2,
    /** Error messages indicating failures */
    ERROR: 3,
    /** Critical errors that may cause system failure */
    FATAL: 4,
};

/**
 * Color mapping for log levels
 */
const LevelColors = {
    [LogLevel.DEBUG]: Colors.GRAY,
    [LogLevel.INFO]: Colors.CYAN,
    [LogLevel.WARN]: Colors.YELLOW,
    [LogLevel.ERROR]: Colors.RED,
    [LogLevel.FATAL]: `${Colors.BG_RED}${Colors.WHITE}${Colors.BRIGHT}`,
};

/**
 * Logger class
 * Provides structured logging with different levels and environment-aware output
 */
class Logger {
    constructor(config = {}) {
        this.config = {
            level: this.getDefaultLogLevel(),
            enableConsole: true,
            enableFile: false,
            context: 'ToothMatchApi',
            includeStackTrace: true,
            enableColors: true,
            ...config,
        };
    }

    /**
     * Get singleton instance of logger
     */
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }

    /**
     * Create a child logger with specific context
     */
    child(context) {
        return new Logger({
            ...this.config,
            context: `${this.config.context}:${context}`,
        });
    }

    /**
     * Log debug message
     */
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    /**
     * Log info message
     */
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }

    /**
     * Log warning message
     */
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }

    /**
     * Log error message
     */
    error(message, metadata, error) {
        this.log(LogLevel.ERROR, message, metadata, error);
    }

    /**
     * Log fatal error message
     */
    fatal(message, metadata, error) {
        this.log(LogLevel.FATAL, message, metadata, error);
    }

    /**
     * Core logging method
     */
    log(level, message, metadata, error) {
        // Skip if log level is below configured threshold or if we are on client side
        if (level < this.config.level || 'window' in globalThis) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.config.context,
            metadata,
            error,
        };

        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }

        if (this.config.enableFile) {
            this.logToFile(logEntry);
        }
    }

    /**
     * Apply color to text if colors are enabled
     */
    colorize(text, color) {
        if (!this.config.enableColors) {
            return text;
        }
        return `${color}${text}${Colors.RESET}`;
    }

    /**
     * Output log to console with appropriate formatting
     */
    logToConsole(entry) {
        const levelName = Object.keys(LogLevel)[entry.level];
        const timestamp = entry.timestamp;
        const context = entry.context ? `[${entry.context}]` : '';

        const levelColor = LevelColors[entry.level];
        const coloredLevel = this.colorize(levelName, levelColor);
        const coloredTimestamp = this.colorize(timestamp, Colors.DIM);
        const coloredContext = this.colorize(context, Colors.MAGENTA);

        const prefix = `${coloredTimestamp} ${coloredLevel} ${coloredContext}`;

        let output = `${prefix} ${entry.message}`;

        // Add metadata if present
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            const metadataLabel = this.colorize('Metadata:', Colors.BLUE);
            output += `\n${metadataLabel} ${JSON.stringify(entry.metadata, null, 2)}`;
        }

        // Add error details if present
        if (entry.error) {
            const errorLabel = this.colorize('Error:', Colors.RED);
            output += `\n${errorLabel} ${entry.error.message}`;
            if (this.config.includeStackTrace && entry.error.stack) {
                const stackLabel = this.colorize('Stack:', Colors.RED);
                output += `\n${stackLabel} ${this.colorize(entry.error.stack, Colors.DIM)}`;
            }
        }

        // Use appropriate console method based on log level
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(output);
                break;
            case LogLevel.INFO:
                console.info(output);
                break;
            case LogLevel.WARN:
                console.warn(output);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(output);
                break;
            default:
                console.log(output);
        }
    }

    /**
     * Output log to file (placeholder for future implementation)
     */
    logToFile(_entry) {
        // TODO: Implement file logging when needed
        // This could write to a log file or send to external logging service
    }

    /**
     * Get default log level based on environment
     */
    getDefaultLogLevel() {
        const env = process.env.NODE_ENV;

        switch (env) {
            case 'development':
                return LogLevel.DEBUG;
            case 'test':
                return LogLevel.WARN;
            case 'production':
                return LogLevel.INFO;
            default:
                return LogLevel.INFO;
        }
    }

    /**
     * Update logger configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Export singleton instance for convenience
export const logger = Logger.getInstance();

// Export class for custom instances
export const logUtils = {
    /**
         * Log API request
         */
    logApiRequest: (method, path, metadata) => {
        logger.child('API').info(`${method} ${path}`, metadata);
    },

    /**
     * Log authentication event
     */
    logAuthEvent: (event, userId, metadata) => {
        logger.child('Auth').info(event, { userId, ...metadata });
    },

    /**
     * Log performance metric
     */
    logPerformance: (operation, duration, metadata) => {
        logger
            .child('Performance')
            .info(`${operation} completed in ${duration}ms`, metadata);
    },
};
