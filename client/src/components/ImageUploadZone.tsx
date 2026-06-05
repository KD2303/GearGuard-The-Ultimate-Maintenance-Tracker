import React, { useCallback } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';

interface ImageUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ 
  files, 
  onChange, 
  maxFiles = 5, 
  maxSizeMB = 5 
}) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [files]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} exceeds ${maxSizeMB}MB limit.`);
        return false;
      }
      return true;
    });

    const totalFiles = [...files, ...validFiles];
    if (totalFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      onChange(totalFiles.slice(0, maxFiles));
    } else {
      onChange(totalFiles);
    }
  };

  const removeFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full">
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          SVG, PNG, JPG, GIF or PDF (MAX. {maxSizeMB}MB)
        </p>
        <input 
          id="file-upload-input"
          type="file" 
          multiple 
          accept=".png,.jpg,.jpeg,.pdf,.svg,.gif"
          className="hidden" 
          onChange={handleFileInput}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-sm">
              <div className="flex items-center space-x-2 truncate flex-1">
                {file.type.includes('image') ? (
                   <img src={URL.createObjectURL(file)} alt="preview" className="w-8 h-8 object-cover rounded" />
                ) : (
                   <FileIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-xs truncate text-gray-700 dark:text-gray-200 max-w-[150px]">{file.name}</span>
              </div>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="p-1 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
