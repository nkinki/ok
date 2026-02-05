// Google Drive API Service for JSON file sharing
// Uses teacher-specific Google Drive folders
// Updated to work with fullGoogleDriveService

import { fullGoogleDriveService } from './fullGoogleDriveService'

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
   * Upload session JSON to teacher's Google Drive folder
   * Now uses the full Google Drive service for better integration
   */
  async uploadSessionJSON(sessionCode: string, sessionData: any): Promise<DriveUploadResult> {
    try {
      console.log('📤 Uploading session JSON via full Google Drive service...');
      
      // Use the full Google Drive service for upload
      const result = await fullGoogleDriveService.uploadSessionJSON(sessionCode, sessionData);
      
      if (result.success) {
        console.log('✅ Session uploaded via full Google Drive service');
        return {
          success: true,
          fileId: result.fileId,
          downloadUrl: result.downloadUrl
        };
      } else {
        console.warn('⚠️ Full service failed, using fallback...');
        return this.fallbackToLocalStorage(sessionCode, sessionData);
      }

    } catch (error) {
      console.error('Google Drive upload error:', error);
      return this.fallbackToLocalStorage(sessionCode, sessionData);
    }
  }

  /**
   * Download session JSON from teacher's Google Drive
   * Now uses the full Google Drive service for better integration
   */
  async downloadSessionJSON(sessionCode: string): Promise<DriveDownloadResult> {
    try {
      console.log('📥 Downloading session via full Google Drive service...');
      
      // Use the full Google Drive service for download
      const sessionData = await fullGoogleDriveService.downloadSessionJSON(sessionCode);
      
      if (sessionData) {
        console.log('✅ Session downloaded via full Google Drive service');
        console.log('📊 Exercise count:', sessionData.exercises?.length || 0);

        return {
          success: true,
          data: sessionData
        };
      } else {
        return {
          success: false,
          error: `Session file not found: session_${sessionCode}.json`
        };
      }

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
    return fullGoogleDriveService.isConfigured();
  }

  /**
   * Get configuration status for the teacher
   */
  getStatus(): string {
    return fullGoogleDriveService.getStatus();
  }

  /**
   * Get teacher's folder info
   */
  getTeacherFolderInfo(): { url: string | null; folderId: string | null; isValid: boolean } {
    const folder = localStorage.getItem('google_drive_folder');
    const folderId = folder ? this.extractFolderId(folder) : null;
    
    return {
      url: folder,
      folderId,
      isValid: !!(folder && folderId)
    };
  }

  /**
   * Extract folder ID from Google Drive URL
   */
  private extractFolderId(driveUrl: string): string | null {
    const match = driveUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return fullGoogleDriveService.getStorageStats();
  }

  /**
   * Migrate existing images to Google Drive
   */
  async migrateExistingImages() {
    return fullGoogleDriveService.migrateExistingImages();
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;