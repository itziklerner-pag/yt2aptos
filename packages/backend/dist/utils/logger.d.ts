import winston from 'winston';
export declare const logger: winston.Logger;
export declare const logInfo: (message: string, meta?: any) => winston.Logger;
export declare const logError: (message: string, error?: Error | unknown) => void;
export declare const logWarning: (message: string, meta?: any) => winston.Logger;
export declare const logDebug: (message: string, meta?: any) => winston.Logger;
export declare const logStream: {
    write: (message: string) => void;
};
