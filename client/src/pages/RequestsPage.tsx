import { useState } from 'react';
import { FileDown, FileText, Plus } from 'lucide-react';
import DetailedRequestsTable from '../components/DetailedRequestsTable';
import RequestModal from '../components/RequestModal';
import Button from '../components/Button';

const RequestsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const triggerExport = (format: 'csv' | 'pdf') => {
    window.dispatchEvent(new CustomEvent('gg:requests-export', { detail: { format } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Requests</h2>
          <p className=" dark:text-gray-400 mt-1">Manage all maintenance requests and their status</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => triggerExport('csv')}>
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => triggerExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <DetailedRequestsTable />

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          // Reload requests
          window.location.reload();
        }}
      />
    </div>
  );
};

export default RequestsPage;
