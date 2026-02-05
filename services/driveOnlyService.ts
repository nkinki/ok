// Drive-Only Service - Teljes Google Drive mód Supabase nélkül
// Minden adat csak Google Drive-on és localStorage-ban tárolódik

interface DriveOnlySession {
  sessionCode: string;
  subject: string;
  className: string;
  createdAt: string;
  exercises: any[];
  isActive: boolean;
  expiresAt: string;
  participants: DriveOnlyParticipant[];
}

interface DriveOnlyParticipant {
  id: string;
  sessionCode: string;
  studentName: string;
  studentClass: string;
  joinedAt: string;
  isOnline: boolean;
  currentExercise: number;
  completedExercises: number;
  totalScore: number;
  results: any[];
  lastSeen: string;
}

class DriveOnlyService {
  private readonly DRIVE_ONLY_MODE_KEY = 'drive_only_mode';
  private readonly SESSIONS_KEY = 'drive_only_sessions';
  private readonly PARTICIPANTS_KEY = 'drive_only_participants';

  /**
   * Enable Drive-Only mode (disable Supabase completely)
   */
  enableDriveOnlyMode(): void {
    localStorage.setItem(this.DRIVE_ONLY_MODE_KEY, 'true');
    console.log('🚀 Drive-Only mód aktiválva - Supabase kikapcsolva');
    console.log('📁 Minden adat Google Drive-on és localStorage-ban tárolódik');
  }

  /**
   * Disable Drive-Only mode (re-enable Supabase)
   */
  disableDriveOnlyMode(): void {
    localStorage.removeItem(this.DRIVE_ONLY_MODE_KEY);
    console.log('☁️ Supabase mód visszakapcsolva');
  }

  /**
   * Check if Drive-Only mode is enabled
   */
  isDriveOnlyMode(): boolean {
    return localStorage.getItem(this.DRIVE_ONLY_MODE_KEY) === 'true';
  }

  /**
   * Create session in Drive-Only mode
   */
  async createSession(sessionData: {
    code: string;
    exercises: any[];
    subject: string;
    className: string;
    maxScore: number;
  }): Promise<{ success: boolean; session?: DriveOnlySession; error?: string }> {
    try {
      if (!this.isDriveOnlyMode()) {
        return { success: false, error: 'Drive-Only mód nincs aktiválva' };
      }

      console.log('📁 Munkamenet létrehozása Drive-Only módban:', sessionData.code);

      const session: DriveOnlySession = {
        sessionCode: sessionData.code.toUpperCase(),
        subject: sessionData.subject,
        className: sessionData.className,
        createdAt: new Date().toISOString(),
        exercises: sessionData.exercises,
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 óra múlva lejár
        participants: []
      };

      // Store session in localStorage
      const sessions = this.getAllSessions();
      sessions[sessionData.code.toUpperCase()] = session;
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

      console.log('✅ Munkamenet létrehozva Drive-Only módban');
      console.log('📊 Feladatok száma:', session.exercises.length);
      console.log('⏰ Lejárat:', session.expiresAt);

      return { success: true, session };

    } catch (error) {
      console.error('❌ Drive-Only munkamenet létrehozási hiba:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      };
    }
  }

  /**
   * Check if session exists and is active
   */
  async checkSession(sessionCode: string): Promise<{
    exists: boolean;
    session?: DriveOnlySession;
    error?: string;
  }> {
    try {
      if (!this.isDriveOnlyMode()) {
        return { exists: false, error: 'Drive-Only mód nincs aktiválva' };
      }

      const sessions = this.getAllSessions();
      const session = sessions[sessionCode.toUpperCase()];

      if (!session) {
        return { exists: false, error: 'Munkamenet nem található' };
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        session.isActive = false;
        this.updateSession(session);
        return { exists: false, error: 'Munkamenet lejárt (60 perc után)' };
      }

      console.log('✅ Munkamenet ellenőrzés Drive-Only módban:', sessionCode);
      console.log('📊 Aktív:', session.isActive);
      console.log('👥 Résztvevők:', session.participants.length);

      return { exists: true, session };

    } catch (error) {
      console.error('❌ Drive-Only munkamenet ellenőrzési hiba:', error);
      return { 
        exists: false, 
        error: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      };
    }
  }

  /**
   * Join session as student
   */
  async joinSession(sessionCode: string, studentName: string, studentClass: string): Promise<{
    success: boolean;
    student?: DriveOnlyParticipant;
    error?: string;
  }> {
    try {
      if (!this.isDriveOnlyMode()) {
        return { success: false, error: 'Drive-Only mód nincs aktiválva' };
      }

      const sessionCheck = await this.checkSession(sessionCode);
      if (!sessionCheck.exists || !sessionCheck.session) {
        return { success: false, error: sessionCheck.error || 'Munkamenet nem található' };
      }

      const participant: DriveOnlyParticipant = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionCode: sessionCode.toUpperCase(),
        studentName,
        studentClass,
        joinedAt: new Date().toISOString(),
        isOnline: true,
        currentExercise: 0,
        completedExercises: 0,
        totalScore: 0,
        results: [],
        lastSeen: new Date().toISOString()
      };

      // Add participant to session
      const session = sessionCheck.session;
      session.participants.push(participant);
      this.updateSession(session);

      // Store participant separately for easy access
      const participants = this.getAllParticipants();
      participants[participant.id] = participant;
      localStorage.setItem(this.PARTICIPANTS_KEY, JSON.stringify(participants));

      console.log('✅ Diák csatlakozott Drive-Only módban:', studentName);
      console.log('🆔 Diák ID:', participant.id);
      console.log('👥 Összes résztvevő:', session.participants.length);

      return { success: true, student: participant };

    } catch (error) {
      console.error('❌ Drive-Only csatlakozási hiba:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      };
    }
  }

  /**
   * Submit student results
   */
  async submitResults(studentId: string, results: any[], summary: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.isDriveOnlyMode()) {
        return { success: false, error: 'Drive-Only mód nincs aktiválva' };
      }

      const participants = this.getAllParticipants();
      const participant = participants[studentId];

      if (!participant) {
        return { success: false, error: 'Diák nem található' };
      }

      // Update participant results
      participant.results = results;
      participant.totalScore = summary.totalScore || 0;
      participant.completedExercises = summary.completedExercises || 0;
      participant.lastSeen = new Date().toISOString();

      // Save updated participant
      participants[studentId] = participant;
      localStorage.setItem(this.PARTICIPANTS_KEY, JSON.stringify(participants));

      // Update session participant list
      const sessions = this.getAllSessions();
      const session = sessions[participant.sessionCode];
      if (session) {
        const participantIndex = session.participants.findIndex(p => p.id === studentId);
        if (participantIndex >= 0) {
          session.participants[participantIndex] = participant;
          this.updateSession(session);
        }
      }

      console.log('✅ Eredmények mentve Drive-Only módban:', participant.studentName);
      console.log('📊 Pontszám:', participant.totalScore);
      console.log('✅ Befejezett feladatok:', participant.completedExercises);

      return { success: true };

    } catch (error) {
      console.error('❌ Drive-Only eredmény mentési hiba:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      };
    }
  }

  /**
   * Get session participants for monitoring
   */
  async getSessionParticipants(sessionCode: string): Promise<DriveOnlyParticipant[]> {
    try {
      if (!this.isDriveOnlyMode()) {
        return [];
      }

      const sessions = this.getAllSessions();
      const session = sessions[sessionCode.toUpperCase()];

      if (!session) {
        return [];
      }

      // Update last seen for online participants
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      session.participants.forEach(participant => {
        const lastSeen = new Date(participant.lastSeen);
        participant.isOnline = lastSeen > fiveMinutesAgo;
      });

      this.updateSession(session);

      console.log('📊 Résztvevők lekérése Drive-Only módban:', sessionCode);
      console.log('👥 Összes résztvevő:', session.participants.length);
      console.log('🟢 Online résztvevők:', session.participants.filter(p => p.isOnline).length);

      return session.participants;

    } catch (error) {
      console.error('❌ Drive-Only résztvevők lekérési hiba:', error);
      return [];
    }
  }

  /**
   * Update student heartbeat
   */
  async updateHeartbeat(studentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isDriveOnlyMode()) {
        return { success: false, error: 'Drive-Only mód nincs aktiválva' };
      }

      const participants = this.getAllParticipants();
      const participant = participants[studentId];

      if (!participant) {
        return { success: false, error: 'Diák nem található' };
      }

      participant.lastSeen = new Date().toISOString();
      participant.isOnline = true;

      participants[studentId] = participant;
      localStorage.setItem(this.PARTICIPANTS_KEY, JSON.stringify(participants));

      return { success: true };

    } catch (error) {
      console.error('❌ Drive-Only heartbeat hiba:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      };
    }
  }

  /**
   * Get all sessions from localStorage
   */
  private getAllSessions(): Record<string, DriveOnlySession> {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Sessions betöltési hiba:', error);
      return {};
    }
  }

  /**
   * Get all participants from localStorage
   */
  private getAllParticipants(): Record<string, DriveOnlyParticipant> {
    try {
      const data = localStorage.getItem(this.PARTICIPANTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Participants betöltési hiba:', error);
      return {};
    }
  }

  /**
   * Update session in localStorage
   */
  private updateSession(session: DriveOnlySession): void {
    const sessions = this.getAllSessions();
    sessions[session.sessionCode] = session;
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  /**
   * Get Drive-Only mode statistics
   */
  getStatistics(): {
    isDriveOnlyMode: boolean;
    activeSessions: number;
    totalParticipants: number;
    onlineParticipants: number;
  } {
    const isDriveOnly = this.isDriveOnlyMode();
    
    if (!isDriveOnly) {
      return {
        isDriveOnlyMode: false,
        activeSessions: 0,
        totalParticipants: 0,
        onlineParticipants: 0
      };
    }

    const sessions = this.getAllSessions();
    const participants = this.getAllParticipants();

    const activeSessions = Object.values(sessions).filter(s => 
      s.isActive && new Date() < new Date(s.expiresAt)
    ).length;

    const totalParticipants = Object.keys(participants).length;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineParticipants = Object.values(participants).filter(p => 
      new Date(p.lastSeen) > fiveMinutesAgo
    ).length;

    return {
      isDriveOnlyMode: true,
      activeSessions,
      totalParticipants,
      onlineParticipants
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    try {
      const sessions = this.getAllSessions();
      const now = new Date();
      let cleanedCount = 0;

      Object.keys(sessions).forEach(sessionCode => {
        const session = sessions[sessionCode];
        if (new Date(session.expiresAt) < now) {
          delete sessions[sessionCode];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
        console.log(`🧹 ${cleanedCount} lejárt munkamenet törölve Drive-Only módban`);
      }

    } catch (error) {
      console.error('❌ Drive-Only cleanup hiba:', error);
    }
  }
}

// Export singleton instance
export const driveOnlyService = new DriveOnlyService();
export default driveOnlyService;