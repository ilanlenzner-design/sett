/**
 * Google Drive Authentication Service
 * Handles OAuth 2.0 authentication for Google Drive API access
 */

export interface GoogleAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

class GoogleDriveAuthService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;

  /**
   * Initialize the Google Identity Services token client
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.CLIENT_ID) {
        reject(new Error('Google Client ID is not configured'));
        return;
      }

      // Wait for Google Identity Services to load
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: (response: GoogleAuthResponse) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }
            this.accessToken = response.access_token;
            this.tokenExpiry = Date.now() + response.expires_in * 1000;
          },
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Request access token from user
   * Opens OAuth consent screen
   */
  async requestAccessToken(): Promise<string> {
    if (!this.tokenClient) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      // Set up callback for this specific request
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        this.accessToken = response.access_token;
        this.tokenExpiry = Date.now() + response.expires_in * 1000;
        resolve(this.accessToken);
      };

      // Request token - this will show the OAuth consent screen
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Get the current access token
   * Automatically requests a new token if expired
   */
  async getAccessToken(): Promise<string> {
    // Check if token exists and is not expired
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Token expired or doesn't exist, request new one
    return this.requestAccessToken();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry);
  }

  /**
   * Sign out - clear the access token
   */
  signOut(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}

// Export singleton instance
export const googleDriveAuth = new GoogleDriveAuthService();
