import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MaintenanceRequest, RequestFilters, defaultFilters } from '../types';
import { requestService, getFiltered } from '../services/requestService';
import Badge from '../components/Badge';
import { Clock, User, AlertCircle, Plus } from 'lucide-react';
import Button from '../components/Button';
import RequestModal from '../components/RequestModal';
import Spinner from '../components/Spinner';
import FilterBar from '../components/FilterBar';

const STAGES = [
  { 
    id: 'new', 
    title: 'New', 
    color: 'bg-blue-50 border-blue-200 dark:bg-slate-800 dark:border-blue-500/30' 
  },
  { 
    id: 'in-progress', 
    title: 'In Progress', 
    color: 'bg-yellow-50 border-yellow-200 dark:bg-slate-800 dark:border-yellow-500/30' 
  },
  { 
    id: 'repaired', 
    title: 'Repaired', 
    color: 'bg-green-50 border-green-200 dark:bg-slate-800 dark:border-green-500/30' 
  },
  { 
    id: 'scrap', 
    title: 'Scrap', 
    color: 'bg-red-50 border-red-200 dark:bg-slate-800 dark:border-red-500/30' 
  },
];

interface RequestCardProps {
  request: MaintenanceRequest;
  onUpdate: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onUpdate: _onUpdate }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REQUEST',
    item: { id: request.id, stage: request.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Upstream's enhanced overdue check with date normalization
  const isOverdue = (date?: string, stage?: string) => {
    if (!date) return false;

    const today = new Date();
    const due = new Date(date);

    // remove time part
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today && stage !== 'repaired';
  };

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
        className={`kanban-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-none border-2 mb-3 ${
          isOverdue(request.scheduledDate, request.stage)
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      }`}
    >
      {isOverdue(request.scheduledDate, request.stage) && (
        <div className="flex items-center text-red-600 text-xs mb-2">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-ping mr-2"></span>
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{request.subject}</h4>
        <Badge variant={priorityColors[request.priority]} size="sm">
          {request.priority}
        </Badge>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{request.requestNumber}</p>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={typeColors[request.type]} size="sm">
          {request.type}
        </Badge>
        {request.equipment && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{request.equipment.name}</span>
        )}
      </div>

      {request.assignedTo && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mt-2">
          <User className="h-3 w-3 mr-1" />
          {request.assignedTo.name}
        </div>
      )}

      {request.scheduledDate && (
        <div className="flex items-center text-xs  dark:text-gray-300 mt-1">
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
  stage: (typeof STAGES)[0];
  requests: MaintenanceRequest[];
  onDrop: (requestId: string, newStage: string) => void;
  onUpdate: () => void;
}

const Column: React.FC<ColumnProps> = ({ stage, requests, onDrop,}) => {
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
      className={`kanban-column flex-1 min-w-[280px] rounded-lg border p-4 ${stage.color} hover:shadow-xl transition-all duration-300 ${
        isOver ? 'drag-over' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{stage.title}</h3>
        <Badge variant="default" size="sm">
          {requests.length}
        </Badge>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {requests.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-10">
            No requests
          </p>
        )}
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} onUpdate={() => {}}/>
        ))}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<RequestFilters>(defaultFilters);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getFiltered(filters);
        setRequests(data);
        setResultCount(data.length);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      const data = await getFiltered(filters);
      setRequests(data);
      setResultCount(data.length);
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

  const handleDrop = async (requestId: string, newStage: string) => {
    try {
      await requestService.updateStage(requestId, newStage);
      await loadRequests();
    } catch (error) {
      console.error('Failed to update request stage:', error);
    }
  };

  const groupedRequests = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = requests.filter((req) => req.stage === stage.id);
      return acc;
    },
    {} as Record<string, MaintenanceRequest[]>
  );

  if (loading) {
    return <Spinner size="lg" label="Loading requests..." centered />;
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

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          resultCount={resultCount}
        />

        {requests.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">
            No requests match your current filters.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
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
        )}

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
