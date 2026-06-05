import React, { useState, useRef } from 'react';
import { Equipment } from '../types';
import { equipmentService } from '../services/equipmentService';
import { FileText, Upload, Trash2, ExternalLink, Download } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import toast from 'react-hot-toast';
import axios from 'axios';

interface EquipmentDocumentsTabProps {
  equipment: Equipment;
  onUpdate: () => void | Promise<void>;
}

const EquipmentDocumentsTab: React.FC<EquipmentDocumentsTabProps> = ({ equipment, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'Manual' | 'Schematic' | 'Safety' | 'Warranty' | 'Other'>('Manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadTitle.trim()) {
      toast.error("Please provide a title for the document first.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('attachments', file);

      // 1. Upload file to backend
      const uploadRes = await axios.post('/api/upload/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedFile = uploadRes.data[0];

      // 2. Add to equipment documents array
      const newDocument = {
        title: uploadTitle,
        fileUrl: uploadedFile.fileUrl,
        fileType: uploadedFile.fileType,
        docCategory: docCategory
      };

      const updatedDocuments = [...(equipment.documents || []), newDocument];
      
      await equipmentService.update(equipment.id || (equipment as any)._id, {
        documents: updatedDocuments
      });

      toast.success('Document uploaded successfully!');
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onUpdate();
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const updatedDocuments = (equipment.documents || []).filter(doc => doc.fileUrl !== docUrl);
      await equipmentService.update(equipment.id || (equipment as any)._id, {
        documents: updatedDocuments
      });
      toast.success('Document deleted!');
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document.');
    }
  };

  const categoryColors: Record<string, string> = {
    Manual: 'info',
    Schematic: 'warning',
    Safety: 'danger',
    Warranty: 'success',
    Other: 'default'
  };

  return (
    <div className="space-y-6">
      {/* Upload Section (Manager/Admin typically) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold mb-3 flex items-center dark:text-white">
          <Upload className="h-4 w-4 mr-2 text-blue-500" />
          Upload New Document
        </h4>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 mb-1">Document Title</label>
            <input 
              type="text" 
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. User Manual v2" 
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select 
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Manual">Manual</option>
              <option value="Schematic">Schematic</option>
              <option value="Safety">Safety Datasheet</option>
              <option value="Warranty">Warranty</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <div className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium cursor-pointer flex items-center justify-center min-w-[120px] transition-colors ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
                {isUploading ? 'Uploading...' : 'Browse File'}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div>
        <h4 className="text-md font-semibold mb-3 flex items-center dark:text-white border-b pb-2 dark:border-gray-700">
          <FileText className="h-5 w-5 mr-2 text-gray-500" />
          Attached Documents ({equipment.documents?.length || 0})
        </h4>
        
        {(!equipment.documents || equipment.documents.length === 0) ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No documents found for this equipment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipment.documents.map((doc, idx) => (
              <div key={idx} className="flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white flex-1 pr-2 truncate" title={doc.title}>
                    {doc.title}
                  </h5>
                  <Badge variant={(categoryColors[doc.docCategory] as any) || 'default'} size="sm">
                    {doc.docCategory}
                  </Badge>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{new Date(doc.uploadedAt || new Date()).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span className="truncate max-w-[120px]">{doc.fileType?.includes('pdf') ? 'PDF Document' : 'Image'}</span>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <a 
                    href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View File
                  </a>
                  <button 
                    onClick={() => handleDelete(doc.fileUrl)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentDocumentsTab;
