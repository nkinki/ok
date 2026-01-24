// Session Transfer Service - JSON export/import for offline sessions

export interface SessionData {
  sessionCode: string;
  subject: string;
  createdAt: string;
  exercises: Array<{
    id: string;
    fileName: string;
    imageUrl: string;
    title: string;
    instruction: string;
    type: string;
    content: any;
  }>;
  metadata: {
    version: string;
    exportedBy: string;
    totalExercises: number;
    estimatedTime: number;
  };
}

export class SessionTransferService {
  private static readonly VERSION = '1.0.0';

  // Export session to JSON file
  static exportSession(exercises: any[], sessionCode: string, subject: string = 'general'): SessionData {
    const sessionData: SessionData = {
      sessionCode: sessionCode,
      subject: subject,
      createdAt: new Date().toISOString(),
      exercises: exercises.map(item => ({
        id: item.id,
        fileName: item.fileName,
        imageUrl: item.imageUrl || '',
        title: item.data?.title || item.title,
        instruction: item.data?.instruction || item.instruction,
        type: item.data?.type || item.type,
        content: item.data?.content || item.content
      })),
      metadata: {
        version: this.VERSION,
        exportedBy: 'Okos Gyakorló Tanári Felület',
        totalExercises: exercises.length,
        estimatedTime: exercises.length * 3 // 3 perc per feladat
      }
    };

    return sessionData;
  }

  // Download JSON file
  static downloadSessionFile(sessionData: SessionData, fileName?: string) {
    const jsonString = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `munkamenet-${sessionData.sessionCode}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import session from JSON file
  static async importSessionFile(file: File): Promise<SessionData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const sessionData = JSON.parse(jsonString) as SessionData;
          
          // Validate session data
          if (!this.validateSessionData(sessionData)) {
            throw new Error('Érvénytelen munkamenet fájl formátum');
          }
          
          resolve(sessionData);
        } catch (error) {
          reject(new Error(`Fájl olvasási hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Fájl olvasási hiba'));
      };
      
      reader.readAsText(file);
    });
  }

  // Validate session data structure
  private static validateSessionData(data: any): data is SessionData {
    return (
      data &&
      typeof data.sessionCode === 'string' &&
      typeof data.subject === 'string' &&
      typeof data.createdAt === 'string' &&
      Array.isArray(data.exercises) &&
      data.metadata &&
      typeof data.metadata.version === 'string' &&
      typeof data.metadata.totalExercises === 'number'
    );
  }

  // Convert session data to playlist format for DailyChallenge
  static sessionToPlaylist(sessionData: SessionData): any[] {
    return sessionData.exercises.map(exercise => ({
      id: exercise.id,
      fileName: exercise.fileName,
      imageUrl: exercise.imageUrl,
      data: {
        type: exercise.type,
        title: exercise.title,
        instruction: exercise.instruction,
        content: exercise.content
      }
    }));
  }

  // Store session in localStorage for offline access
  static storeOfflineSession(sessionData: SessionData) {
    const key = `offline_session_${sessionData.sessionCode}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
    
    // Store in offline sessions list
    const offlineSessionsKey = 'offline_sessions_list';
    const existingSessions = JSON.parse(localStorage.getItem(offlineSessionsKey) || '[]');
    
    // Remove existing session with same code
    const filteredSessions = existingSessions.filter((s: any) => s.sessionCode !== sessionData.sessionCode);
    
    // Add new session
    filteredSessions.push({
      sessionCode: sessionData.sessionCode,
      subject: sessionData.subject,
      createdAt: sessionData.createdAt,
      exerciseCount: sessionData.exercises.length,
      estimatedTime: sessionData.metadata.estimatedTime
    });
    
    localStorage.setItem(offlineSessionsKey, JSON.stringify(filteredSessions));
  }

  // Get offline session
  static getOfflineSession(sessionCode: string): SessionData | null {
    const key = `offline_session_${sessionCode}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        return JSON.parse(stored) as SessionData;
      } catch (error) {
        console.error('Error parsing offline session:', error);
      }
    }
    
    return null;
  }

  // List all offline sessions
  static getOfflineSessionsList(): Array<{
    sessionCode: string;
    subject: string;
    createdAt: string;
    exerciseCount: number;
    estimatedTime: number;
  }> {
    const offlineSessionsKey = 'offline_sessions_list';
    const stored = localStorage.getItem(offlineSessionsKey);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing offline sessions list:', error);
      }
    }
    
    return [];
  }
}