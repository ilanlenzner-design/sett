/**
 * Google Drive Service
 * Handles fetching folders and files from Google Drive API
 */

import { googleDriveAuth } from './googleDriveAuth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
}

export interface DriveFolder extends DriveFile {
  mimeType: 'application/vnd.google-apps.folder';
}

interface DriveApiResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

class GoogleDriveService {
  /**
   * Fetch files and folders from a specific folder
   * @param folderId - The ID of the folder to fetch from (use 'root' for root folder)
   * @param pageToken - Optional pagination token
   */
  async listFiles(
    folderId: string = 'root',
    pageToken?: string
  ): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    const accessToken = await googleDriveAuth.getAccessToken();

    // Build query parameters
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime,iconLink),nextPageToken',
      orderBy: 'folder,name',
      pageSize: '100',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const data: DriveApiResponse = await response.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Get folders only from a specific folder
   */
  async listFolders(folderId: string = 'root'): Promise<DriveFolder[]> {
    const accessToken = await googleDriveAuth.getAccessToken();

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
      fields: 'files(id,name,mimeType,iconLink,modifiedTime)',
      orderBy: 'name',
      pageSize: '1000',
    });

    const response = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch folders: ${response.statusText}`);
    }

    const data: DriveApiResponse = await response.json();
    return data.files as DriveFolder[];
  }

  /**
   * Search for files and folders by name
   */
  async searchFiles(query: string, folderId?: string): Promise<DriveFile[]> {
    const accessToken = await googleDriveAuth.getAccessToken();

    let searchQuery = `name contains '${query}' and trashed=false`;
    if (folderId) {
      searchQuery += ` and '${folderId}' in parents`;
    }

    const params = new URLSearchParams({
      q: searchQuery,
      fields: 'files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime,iconLink)',
      orderBy: 'folder,name',
      pageSize: '50',
    });

    const response = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search files: ${response.statusText}`);
    }

    const data: DriveApiResponse = await response.json();
    return data.files || [];
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    const accessToken = await googleDriveAuth.getAccessToken();

    const params = new URLSearchParams({
      fields: 'id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime,iconLink',
    });

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file metadata: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download file content as blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const accessToken = await googleDriveAuth.getAccessToken();

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get breadcrumb path for a file/folder
   */
  async getBreadcrumb(fileId: string): Promise<DriveFile[]> {
    const breadcrumb: DriveFile[] = [];
    let currentId = fileId;

    while (currentId !== 'root') {
      const accessToken = await googleDriveAuth.getAccessToken();

      const params = new URLSearchParams({
        fields: 'id,name,mimeType,parents',
      });

      const response = await fetch(`${DRIVE_API_BASE}/files/${currentId}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        break;
      }

      const file: any = await response.json();
      breadcrumb.unshift({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
      });

      if (!file.parents || file.parents.length === 0) {
        break;
      }

      currentId = file.parents[0];
    }

    return breadcrumb;
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: DriveFile): boolean {
    return file.mimeType.startsWith('image/');
  }

  /**
   * Check if file is a folder
   */
  isFolder(file: DriveFile): boolean {
    return file.mimeType === FOLDER_MIME_TYPE;
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
