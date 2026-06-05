import React, { useState } from 'react';
import { X, FileText, Download, Trash2 } from 'lucide-react';

interface Attachment {
  _id?: string;
  filename: string;
  fileUrl: string;
  fileType: string;
}

interface ImageGalleryProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ attachments, onDelete }) => {
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return <p className="text-sm text-gray-500 italic">No attachments provided.</p>;
  }

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {attachments.map((attachment, index) => {
          const isImage = attachment.fileType?.includes('image') || attachment.filename?.match(/\.(jpg|jpeg|png|gif)$/i);
          
          return (
            <div 
              key={index} 
              className="group relative flex flex-col items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => isImage ? setSelectedImage(attachment) : window.open(getFullUrl(attachment.fileUrl), '_blank')}
            >
              {isImage ? (
                <img 
                  src={getFullUrl(attachment.fileUrl)} 
                  alt={attachment.filename} 
                  className="w-full h-24 object-cover rounded-md mb-2 group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md mb-2">
                  <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <span className="text-xs truncate w-full text-center text-gray-700 dark:text-gray-300 font-medium px-1 mt-1">
                {attachment.filename}
              </span>
              
              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isImage && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(getFullUrl(attachment.fileUrl), '_blank'); }}
                    className="p-1.5 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                     <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </button>
                )}
                
                {onDelete && attachment._id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(attachment._id!); }}
                    className="p-1.5 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/del"
                  >
                     <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover/del:text-red-600" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={getFullUrl(selectedImage.fileUrl)} 
              alt={selectedImage.filename} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-white text-center mt-4 text-sm font-medium">{selectedImage.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
