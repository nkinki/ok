// Google Drive Session Service - Diákok JSON betöltése Google Drive-ról
// Mappa: https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

const GOOGLE_DRIVE_FOLDER_ID = '1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6';
const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

interface SessionFile {
  id: string;
  name: string;
  downloadUrl: string;
  sessionCode: string;
  createdAt: string;
}

class GoogleDriveSessionService {
  /**
   * Get the Google Drive folder URL for students
   */
  getFolderUrl(): string {
    return GOOGLE_DRIVE_FOLDER_URL;
  }

  /**
   * Get the folder ID
   */
  getFolderId(): string {
    return GOOGLE_DRIVE_FOLDER_ID;
  }

  /**
   * Open the Google Drive folder in a new tab
   */
  openFolder(): void {
    window.open(GOOGLE_DRIVE_FOLDER_URL, '_blank');
  }

  /**
   * Generate direct download URL for a file
   * Note: This requires the file to be publicly accessible
   */
  getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get file view URL
   */
  getFileViewUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Parse session code from filename
   * Expected format: munkamenet_ABC123_2026-02-09.json or session_ABC123.json
   */
  parseSessionCode(filename: string): string | null {
    // Try pattern: munkamenet_CODE_date.json
    let match = filename.match(/munkamenet_([A-Z0-9]{6})_/i);
    if (match) return match[1].toUpperCase();

    // Try pattern: session_CODE.json
    match = filename.match(/session_([A-Z0-9]{6})/i);
    if (match) return match[1].toUpperCase();

    return null;
  }

  /**
   * Load session JSON from Google Drive file
   * This requires the file to be publicly accessible or the user to have access
   */
  async loadSessionFromDrive(fileId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📥 Betöltés Google Drive-ról:', fileId);

      const downloadUrl = this.getDirectDownloadUrl(fileId);
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ JSON betöltve Google Drive-ról');

      return { success: true, data };

    } catch (error) {
      console.error('❌ Google Drive betöltési hiba:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ismeretlen hiba'
      };
    }
  }

  /**
   * Validate session JSON structure
   */
  validateSessionData(data: any): {
    valid: boolean;
    error?: string;
  } {
    if (!data) {
      return { valid: false, error: 'Üres adat' };
    }

    if (!data.sessionCode && !data.code) {
      return { valid: false, error: 'Hiányzó munkamenet kód' };
    }

    if (!data.exercises || !Array.isArray(data.exercises)) {
      return { valid: false, error: 'Hiányzó vagy hibás feladatok' };
    }

    if (data.exercises.length === 0) {
      return { valid: false, error: 'Nincsenek feladatok' };
    }

    // Check if exercises have required fields
    for (const exercise of data.exercises) {
      if (!exercise.id) {
        return { valid: false, error: 'Feladat ID hiányzik' };
      }
      if (!exercise.title) {
        return { valid: false, error: 'Feladat cím hiányzik' };
      }
      if (!exercise.type) {
        return { valid: false, error: 'Feladat típus hiányzik' };
      }
    }

    return { valid: true };
  }

  /**
   * Get instructions for students
   */
  getStudentInstructions(): string[] {
    return [
      '1. Nyisd meg a Google Drive mappát (kattints a "📁 Drive mappa megnyitása" gombra)',
      '2. Keresd meg a munkamenet JSON fájlt (pl. munkamenet_ABC123_2026-02-09.json)',
      '3. Töltsd le a fájlt a gépedre',
      '4. Kattints a "JSON fájl betöltése" gombra',
      '5. Válaszd ki a letöltött JSON fájlt',
      '6. Add meg a neved és osztályodat',
      '7. Kezdd el a feladatokat!'
    ];
  }

  /**
   * Get instructions for teachers
   */
  getTeacherInstructions(): string[] {
    return [
      '1. Hozz létre egy munkamenetet a Tanári felületen',
      '2. Töltsd le a JSON fájlt (automatikusan letöltődik)',
      '3. Töltsd fel a JSON fájlt a Google Drive mappába',
      '4. Oszd meg a mappa linkjét a diákokkal',
      '5. Diákok letölthetik és betölthetik a JSON-t'
    ];
  }

  /**
   * Check if running in network mode (multiple computers)
   */
  isNetworkMode(): boolean {
    // Check if we're accessing from a network IP (not localhost)
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  }

  /**
   * Get network instructions
   */
  getNetworkInstructions(): string[] {
    return [
      '🌐 HÁLÓZATI MÓD AKTÍV',
      '',
      'Tanár:',
      '1. Hozz létre munkamenetet',
      '2. Töltsd fel a JSON-t a Google Drive mappába',
      '3. Oszd meg a mappa linkjét a diákokkal',
      '',
      'Diákok:',
      '1. Nyisd meg a Google Drive mappát',
      '2. Töltsd le a JSON fájlt',
      '3. Töltsd be a JSON-t a diák felületen',
      '4. Kezdd el a feladatokat!'
    ];
  }
}

// Export singleton instance
export const googleDriveSessionService = new GoogleDriveSessionService();
export default googleDriveSessionService;
