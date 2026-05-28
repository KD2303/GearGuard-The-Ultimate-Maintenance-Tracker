import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DetailedRequestsTable from '../components/DetailedRequestsTable';
import RequestModal from '../components/RequestModal';
import Button from '../components/Button';

const RequestsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialEquipmentId, setInitialEquipmentId] = useState<string | undefined>();

  useEffect(() => {
    if (searchParams.get('action') === 'newRequest') {
      const equipmentId = searchParams.get('equipmentId');
      if (equipmentId) {
        setInitialEquipmentId(equipmentId);
      }
      setIsModalOpen(true);
      
      // Clean up the URL to prevent reopening on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      newParams.delete('equipmentId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setInitialEquipmentId(undefined);
  };

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
        onClose={handleCloseModal}
        initialEquipmentId={initialEquipmentId}
        onSuccess={() => {
          handleCloseModal();
          // Reload requests
          window.location.reload();
        }}
      />
    </div>
  );
};

export default RequestsPage;
