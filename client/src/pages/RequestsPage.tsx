import { useState } from 'react';
import { Plus } from 'lucide-react';
import DetailedRequestsTable from '../components/DetailedRequestsTable';
import RequestModal from '../components/RequestModal';
import Button from '../components/Button';

const RequestsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Requests</h2>
          <p className=" dark:text-gray-400 mt-1">Manage all maintenance requests and their status</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
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
