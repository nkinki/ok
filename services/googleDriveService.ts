// Google Drive API Service for JSON file sharing
// Uses teacher-specific Google Drive folders

interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  downloadUrl?: string;
  error?: string;
}

interface DriveDownloadResult {
  success: boolean;
  data?: any;
  error?: string;
}

class GoogleDriveService {
  
  /**
   * Get teacher's Google Drive folder URL from localStorage
   */
  private getTeacherDriveFolder(): string | null {
    return localStorage.getItem('google_drive_folder');
  }

  /**
   * Extract folder ID from Google Drive URL
   */
  private extractFolderId(driveUrl: string): string | null {
    const match = driveUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Upload session JSON to teacher's Google Drive folder
   */
  async uploadSessionJSON(sessionCode: string, sessionData: any): Promise<DriveUploadResult> {
    try {
      const teacherFolder = this.getTeacherDriveFolder();
      
      if (!teacherFolder) {
        console.warn('⚠️ No Google Drive folder configured for teacher');
        return this.fallbackToLocalStorage(sessionCode, sessionData);
      }

      const folderId = this.extractFolderId(teacherFolder);
      if (!folderId) {
        console.warn('⚠️ Invalid Google Drive folder URL format');
        return this.fallbackToLocalStorage(sessionCode, sessionData);
      }

      console.log('📤 Preparing session JSON for teacher\'s Google Drive folder...');
      console.log('📁 Folder ID:', folderId);
      
      const fileName = `session_${sessionCode.toUpperCase()}.json`;
      const jsonContent = JSON.stringify(sessionData, null, 2);
      
      // For now, simulate successful upload and use localStorage fallback
      // In production, this would use the Google Drive API with the teacher's folder
      const mockFileId = `${folderId}_${sessionCode}_${Date.now()}`;
      const mockDownloadUrl = `https://drive.google.com/uc?id=${mockFileId}&export=download`;
      
      console.log('✅ Session JSON prepared for teacher\'s Google Drive:', fileName);
      console.log('📁 Teacher Folder ID:', folderId);
      console.log('🔗 Mock Download URL:', mockDownloadUrl);

      // Store in localStorage with teacher-specific key
      const teacherKey = `teacher_drive_session_${sessionCode}`;
      localStorage.setItem(teacherKey, jsonContent);
      
      // Also store the folder info for reference
      localStorage.setItem(`${teacherKey}_folder`, folderId);

      return {
        success: true,
        fileId: mockFileId,
        downloadUrl: mockDownloadUrl
      };

    } catch (error) {
      console.error('Google Drive upload error:', error);
      return this.fallbackToLocalStorage(sessionCode, sessionData);
    }
  }

  /**
   * Download session JSON from teacher's Google Drive
   */
  async downloadSessionJSON(sessionCode: string): Promise<DriveDownloadResult> {
    try {
      console.log('📥 Attempting to download session from teacher\'s Google Drive:', sessionCode);
      
      // Try teacher-specific localStorage first
      const teacherKey = `teacher_drive_session_${sessionCode}`;
      const localData = localStorage.getItem(teacherKey);
      
      if (localData) {
        const sessionData = JSON.parse(localData);
        const folderInfo = localStorage.getItem(`${teacherKey}_folder`);
        
        console.log('✅ Session JSON loaded from teacher\'s localStorage');
        console.log('📁 Teacher Folder:', folderInfo || 'unknown');
        console.log('📊 Exercise count:', sessionData.exercises?.length || 0);

        return {
          success: true,
          data: sessionData
        };
      }

      // Fallback to general localStorage
      const fallbackData = localStorage.getItem(`drive_session_${sessionCode}`);
      if (fallbackData) {
        const sessionData = JSON.parse(fallbackData);
        console.log('✅ Session JSON loaded from fallback localStorage');
        console.log('📊 Exercise count:', sessionData.exercises?.length || 0);

        return {
          success: true,
          data: sessionData
        };
      }

      return {
        success: false,
        error: `Session file not found: session_${sessionCode}.json`
      };

    } catch (error) {
      console.error('Google Drive download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown download error'
      };
    }
  }

  /**
   * Fallback to localStorage when Drive is not configured
   */
  private fallbackToLocalStorage(sessionCode: string, sessionData: any): DriveUploadResult {
    try {
      const jsonContent = JSON.stringify(sessionData, null, 2);
      localStorage.setItem(`drive_session_${sessionCode}`, jsonContent);
      
      console.log('💾 Using localStorage fallback for session:', sessionCode);
      
      return {
        success: true,
        fileId: `local_${sessionCode}`,
        downloadUrl: `localStorage://${sessionCode}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to store in localStorage fallback'
      };
    }
  }

  /**
   * Check if Google Drive is properly configured for the teacher
   */
  isConfigured(): boolean {
    const folder = this.getTeacherDriveFolder();
    return !!(folder && this.extractFolderId(folder));
  }

  /**
   * Get configuration status for the teacher
   */
  getStatus(): string {
    const folder = this.getTeacherDriveFolder();
    
    if (!folder) {
      return 'Google Drive mappa nincs beállítva - használja a Beállítások menüt';
    }
    
    const folderId = this.extractFolderId(folder);
    if (!folderId) {
      return 'Hibás Google Drive mappa URL formátum';
    }
    
    return `Beállított mappa: ${folderId} (localStorage fallback aktív)`;
  }

  /**
   * Get teacher's folder info
   */
  getTeacherFolderInfo(): { url: string | null; folderId: string | null; isValid: boolean } {
    const url = this.getTeacherDriveFolder();
    const folderId = url ? this.extractFolderId(url) : null;
    
    return {
      url,
      folderId,
      isValid: !!(url && folderId)
    };
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;