import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import Badge from '../components/Badge';
import { Clock, User, AlertCircle, Plus } from 'lucide-react';
import Button from '../components/Button';
import RequestModal from '../components/RequestModal';

const STAGES = [
  { id: 'new', title: 'New', color: 'bg-blue-50 border-blue-200' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'repaired', title: 'Repaired', color: 'bg-green-50 border-green-200' },
  { id: 'scrap', title: 'Scrap', color: 'bg-red-50 border-red-200' },
];

interface RequestCardProps {
  request: MaintenanceRequest;
  onUpdate: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onUpdate }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REQUEST',
    item: { id: request.id, stage: request.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const isOverdue = request.scheduledDate && new Date(request.scheduledDate) < new Date() && request.stage !== 'repaired';

  const priorityColors = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
  } as const;

  const typeColors = {
    corrective: 'warning',
    preventive: 'info',
  } as const;

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`kanban-card bg-white p-4 rounded-lg shadow-sm border-2 mb-3 ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}
    >
      {isOverdue && (
        <div className="flex items-center text-red-600 text-xs mb-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-sm break-words">
          {request.subject}
        </h4>
        <Badge variant={priorityColors[request.priority]} size="sm">
          {request.priority}
        </Badge>
      </div>

      <p className="text-xs text-gray-600 mb-2">{request.requestNumber}</p>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={typeColors[request.type]} size="sm">
          {request.type}
        </Badge>
        {request.equipment && (
          <span className="text-xs text-gray-500">{request.equipment.name}</span>
        )}
      </div>

      {request.assignedTo && (
        <div className="flex items-center text-xs text-gray-600 mt-2">
          <User className="h-3 w-3 mr-1" />
          {request.assignedTo.name}
        </div>
      )}

      {request.scheduledDate && (
        <div className="flex items-center text-xs text-gray-600 mt-1">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(request.scheduledDate).toLocaleDateString()}
        </div>
      )}

      {request.duration && (
        <div className="text-xs text-gray-500 mt-2">
          Duration: {request.duration}h
        </div>
      )}
    </div>
  );
};

interface ColumnProps {
  stage: typeof STAGES[0];
  requests: MaintenanceRequest[];
  onDrop: (requestId: string, newStage: string) => void;
  onUpdate: () => void;
}

const Column: React.FC<ColumnProps> = ({ stage, requests, onDrop, onUpdate }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'REQUEST',
    drop: (item: { id: string; stage: string }) => {
      if (item.stage !== stage.id) {
        onDrop(item.id, stage.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`kanban-column w-full rounded-lg border-2 p-4 ${stage.color} ${
        isOver ? 'drag-over' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{stage.title}</h3>
        <Badge variant="default" size="sm">
          {requests.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await requestService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Using fallback data due to API error');

      // 👇 FAKE DATA FOR UI TESTING
      setRequests([
        {
          id: '1',
          subject: 'Fix Engine Issue',
          stage: 'new',
          priority: 'high',
          type: 'corrective',
          requestNumber: 'REQ-001',
        },
        {
          id: '2',
          subject: 'Oil Maintenance',
          stage: 'in-progress',
          priority: 'medium',
          type: 'preventive',
          requestNumber: 'REQ-002',
        },
        {
          id: '3',
          subject: 'Replace Brake Pads',
          stage: 'repaired',
          priority: 'low',
          type: 'corrective',
          requestNumber: 'REQ-003',
        },
        {
          id: '4',
          subject: 'Discard Broken Part',
          stage: 'scrap',
          priority: 'urgent',
          type: 'corrective',
          requestNumber: 'REQ-004',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDrop = async (requestId: string, newStage: string) => {
    try {
      await requestService.updateStage(requestId, newStage);
      await loadRequests();
    } catch (error) {
      console.error('Failed to update request stage:', error);
    }
  };

  const groupedRequests = STAGES.reduce((acc, stage) => {
    acc[stage.id] = requests.filter((req) => req.stage === stage.id);
    return acc;
  }, {} as Record<string, MaintenanceRequest[]>);

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Requests</h2>
          <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STAGES.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              requests={groupedRequests[stage.id] || []}
              onDrop={handleDrop}
              onUpdate={loadRequests}
            />
          ))}
        </div>

        {isModalOpen && (
          <RequestModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              loadRequests();
            }}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default KanbanBoard;
