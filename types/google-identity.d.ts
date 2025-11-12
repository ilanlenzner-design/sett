/**
 * Type definitions for Google Identity Services
 */

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: any) => void;
        requestAccessToken: (options?: { prompt?: string }) => void;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: any) => void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}

// Ensure this is treated as a module
export {};
