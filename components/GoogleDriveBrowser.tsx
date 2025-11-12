import React, { useState, useEffect } from 'react';
import { googleDriveService, DriveFile } from '../services/googleDriveService';
import { googleDriveAuth } from '../services/googleDriveAuth';
import { FolderIcon, DocumentIcon, PhotoIcon, XMarkIcon, ChevronRightIcon } from './Icons';

interface GoogleDriveBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: DriveFile) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveBrowser: React.FC<GoogleDriveBrowserProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'My Drive' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      handleAuthentication();
    } else if (isOpen && isAuthenticated) {
      loadFiles(currentFolderId);
    }
  }, [isOpen, isAuthenticated]);

  const handleAuthentication = async () => {
    setLoading(true);
    setError(null);
    try {
      await googleDriveAuth.initialize();
      await googleDriveAuth.getAccessToken();
      setIsAuthenticated(true);
      await loadFiles('root');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { files: fetchedFiles } = await googleDriveService.listFiles(folderId);
      setFiles(fetchedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: DriveFile) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
    loadFiles(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(targetFolder.id);
    loadFiles(targetFolder.id);
  };

  const handleFileClick = (file: DriveFile) => {
    if (googleDriveService.isFolder(file)) {
      handleFolderClick(file);
    } else if (googleDriveService.isImageFile(file)) {
      onSelectFile(file);
    }
  };

  const getFileIcon = (file: DriveFile) => {
    if (googleDriveService.isFolder(file)) {
      return <FolderIcon className="w-6 h-6 text-yellow-500" />;
    } else if (googleDriveService.isImageFile(file)) {
      return <PhotoIcon className="w-6 h-6 text-blue-500" />;
    } else {
      return <DocumentIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes?: string): string => {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Browse Google Drive</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 p-4 bg-gray-750 overflow-x-auto">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <ChevronRightIcon className="w-4 h-4 text-gray-500" />}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                  index === breadcrumb.length - 1 ? 'text-white font-medium' : 'text-gray-400'
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={handleAuthentication}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Retry Authentication
              </button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              This folder is empty
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="grid gap-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    googleDriveService.isFolder(file) || googleDriveService.isImageFile(file)
                      ? 'hover:bg-gray-700 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  disabled={!googleDriveService.isFolder(file) && !googleDriveService.isImageFile(file)}
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{file.name}</p>
                    {file.size && (
                      <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                    )}
                  </div>
                  {googleDriveService.isFolder(file) && (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          Select an image file to use in the AI Image Expander
        </div>
      </div>
    </div>
  );
};
