
type LogType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
  details?: any;
}

type LogListener = (log: LogMessage) => void;

class LoggerService {
  private listeners: LogListener[] = [];

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  log(type: LogType, message: string, details?: any) {
    const logEntry: LogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
      details
    };

    console.log(`[${type}] ${message}`, details || '');
    this.listeners.forEach(l => l(logEntry));
  }

  info(msg: string, details?: any) { this.log('INFO', msg, details); }
  success(msg: string, details?: any) { this.log('SUCCESS', msg, details); }
  warn(msg: string, details?: any) { this.log('WARNING', msg, details); }
  error(msg: string, details?: any) { this.log('ERROR', msg, details); }
}

export const logger = new LoggerService();
