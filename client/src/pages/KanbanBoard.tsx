import React, {
  useState,
  useEffect,
} from "react";

import {
  DndProvider,
  useDrag,
  useDrop,
} from "react-dnd";

import { HTML5Backend } from "react-dnd-html5-backend";

import {
  MaintenanceRequest,
  RequestFilters,
  defaultFilters,
} from "../types";

import {
  requestService,
} from "../services/requestService";

import { getRelativeDateLabel } from "../utils/dateUtils";

import Badge from "../components/Badge";

import {
  Clock,
  User,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowDownUp,
  Wrench
} from "lucide-react";

import toast from "react-hot-toast";

import Button from "../components/Button";

import RequestModal from "../components/RequestModal";

import Spinner from "../components/Spinner";

import FilterBar from "../components/FilterBar";

import ExportButton from "../components/ExportButton";
import ClosureCostModal from "../components/ClosureCostModal";
import LOTOModal from "../components/LOTOModal";
import SlaTimer from "../components/SlaTimer";

import { exportRequestsExcel } from "../services/exportService";

const STAGES = [
  {
    id: "new",
    title: "New",
    color:
      "bg-blue-50 border-blue-200 dark:bg-slate-800 dark:border-blue-500/30",
  },

  {
    id: "awaiting-approval",
    title: "Awaiting Approval",
    color:
      "bg-purple-50 border-purple-200 dark:bg-slate-800 dark:border-purple-500/30",
  },

  {
    id: "in-progress",
    title: "In Progress",
    color:
      "bg-yellow-50 border-yellow-200 dark:bg-slate-800 dark:border-yellow-500/30",
  },

  {
    id: "repaired",
    title: "Repaired",
    color:
      "bg-green-50 border-green-200 dark:bg-slate-800 dark:border-green-500/30",
  },

  {
    id: "scrap",
    title: "Scrap",
    color:
      "bg-red-50 border-red-200 dark:bg-slate-800 dark:border-red-500/30",
  },
];

const LiveTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState<string>('');

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono">{elapsed}</span>;
};

interface RequestCardProps {
  request: MaintenanceRequest;
  onUpdate: () => void;
  onClick: () => void;
}

const RequestCard: React.FC<
  RequestCardProps
> = ({
  request,
  onUpdate: _onUpdate,
  onClick,
}) => {
  const [{ isDragging }, drag] =
    useDrag(() => ({
      type: "REQUEST",

      item: {
        id: request.id,
        stage: request.stage,
      },

      collect: (monitor) => ({
        isDragging:
          monitor.isDragging(),
      }),
    }));

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (request.stage === "repaired" || request.stage === "scrap") return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [request.stage]);

  const isDynamicallyBreached = () => {
    if (request.slaBreached) return true;
    if (request.stage === "repaired" || request.stage === "scrap") return false;
    if (request.slaDeadline && currentTime > new Date(request.slaDeadline).getTime()) return true;
    return false;
  };

  const isOverdue = (
    date?: string,
    stage?: string
  ) => {
    if (!date) return false;

    const today = new Date(currentTime);

    const due = new Date(date);

    today.setHours(0, 0, 0, 0);

    due.setHours(0, 0, 0, 0);

    return (
      due < today &&
      stage !== "repaired"
    );
  };

  const priorityColors = {
    low: "default",
    medium: "info",
    high: "warning",
    urgent: "danger",
  } as const;

  const typeColors = {
    corrective: "warning",
    preventive: "info",
  } as const;

  const handleSmartAssign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await requestService.smartAssign(request.id || request._id || "");
      _onUpdate();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to auto-assign";
      toast.error(errorMsg);
    }
  };

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{
        opacity: isDragging
          ? 0.5
          : 1,
      }}
      className={`kanban-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-none border-2 mb-3 cursor-pointer ${
        isDynamicallyBreached() 
          ? "border-red-500 shadow-red-500/20"
          : (request.slaBreachProbability && request.slaBreachProbability >= 85 && request.stage !== "repaired" && request.stage !== "scrap")
          ? "border-orange-500 shadow-orange-500/20 bg-orange-50 dark:bg-orange-900/10 animate-pulse-border"
          : isOverdue(
          request.scheduledDate,
          request.stage
        )
          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50"
      }`}
    >
      {isOverdue(
        request.scheduledDate,
        request.stage
      ) && (
        <div className="flex items-center text-red-600 text-xs mb-2">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-ping mr-2"></span>

          <AlertCircle className="h-3 w-3 mr-1" />

          Overdue
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
          {request.subject}
        </h4>

        <Badge
          variant={
            priorityColors[
              request.priority
            ]
          }
          size="sm"
        >
          {request.priority}
        </Badge>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        {request.requestNumber}
      </p>

      {request.stage !== "repaired" && request.stage !== "scrap" && request.createdAt && (
        <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded w-fit border border-orange-100 dark:border-orange-800/50 shadow-sm mb-2">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          Downtime: <span className="ml-1"><LiveTimer startTime={request.createdAt} /></span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant={
            typeColors[
              request.type
            ]
          }
          size="sm"
        >
          {request.type}
        </Badge>

        {request.equipment && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {
              request.equipment
                .name
            }
          </span>
        )}
      </div>

      {(request.approvalStatus === 'pending_tier1' || request.approvalStatus === 'pending_tier2') && (
        <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs mt-2 font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded w-fit border border-amber-100 dark:border-amber-800/50 shadow-sm">
          <AlertCircle className="h-3 w-3 mr-1" />
          Awaiting {request.approvalStatus === 'pending_tier1' ? 'Manager' : 'Admin'} Approval
        </div>
      )}

      {request.assignedTo && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mt-2">
          <User className="h-3 w-3 mr-1" />

          {
            request.assignedTo
              .name
          }
        </div>
      )}

      {request.scheduledDate && (
        <div className="flex items-center text-xs dark:text-gray-300 mt-1">
          <Clock className="h-3 w-3 mr-1" />

          {new Date(
            request.scheduledDate
          ).toLocaleDateString()}
          {request.stage !== "repaired" && request.stage !== "scrap" && (
            <span className={`ml-1 font-medium ${getRelativeDateLabel(request.scheduledDate).colorClass}`}>
              {getRelativeDateLabel(request.scheduledDate).label}
            </span>
          )}
        </div>
      )}

      {request.duration && (
        <div className="text-xs text-gray-500 mt-2">
          Duration:{" "}
          {request.duration}h
        </div>
      )}

      <SlaTimer slaDeadline={request.slaDeadline} slaBreached={request.slaBreached} stage={request.stage} />

      {(request.slaBreachProbability && request.slaBreachProbability >= 85 && !request.slaBreached && request.stage !== "repaired" && request.stage !== "scrap") ? (
        <div className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-2 flex items-center bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded w-fit border border-orange-200 dark:border-orange-800/50 shadow-sm">
          ⚠️ High SLA Risk ({request.slaBreachProbability}%)
        </div>
      ) : null}

      {request.checklist && request.checklist.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300 mb-1">
            <span className="font-medium">Checklist Tasks</span>
            <span>{request.checklist.filter(c => c.isCompleted).length}/{request.checklist.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all" 
              style={{ width: `${(request.checklist.filter(c => c.isCompleted).length / request.checklist.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {request.equipment?.hourlyDowntimeCost ? (
        <div className="text-xs text-red-500 font-bold mt-2 flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit border border-red-100 dark:border-red-800/50 shadow-sm">
          💸 Bleed: ${request.equipment.hourlyDowntimeCost}/hr
        </div>
      ) : null}

      {request.isBlockedAwaitingParts && (
        <div className="flex items-center text-rose-600 dark:text-rose-400 text-xs mt-2 font-bold bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded w-fit border border-rose-100 dark:border-rose-800/50 shadow-sm">
          <AlertCircle className="h-3 w-3 mr-1" />
          Blocked: Awaiting Parts
        </div>
      )}

      {request.checkedOutTools && request.checkedOutTools.length > 0 && (
        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-2 flex items-center bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded w-fit border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
          <Wrench className="h-3 w-3 mr-1" />
          Tools Checked Out ({request.checkedOutTools.length})
        </div>
      )}

      {!request.assignedTo && (
        <button
          onClick={handleSmartAssign}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 rounded-lg text-xs font-semibold border border-violet-200/50 dark:border-violet-800/30 transition-all duration-200 shadow-sm shadow-violet-500/5"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Smart Assign
        </button>
      )}

      {request.approvalStatus === 'pending' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await requestService.approveRequest(request.id || request._id || "");
                _onUpdate();
              } catch (err: any) {
                toast.error(err.response?.data?.error || "Failed to approve");
              }
            }}
            className="flex-1 px-2 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400 rounded text-xs font-medium border border-green-200 dark:border-green-800/50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await requestService.rejectRequest(request.id || request._id || "");
                _onUpdate();
              } catch (err: any) {
                toast.error(err.response?.data?.error || "Failed to reject");
              }
            }}
            className="flex-1 px-2 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400 rounded text-xs font-medium border border-red-200 dark:border-red-800/50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

interface ColumnProps {
  stage: (typeof STAGES)[0];

  requests: MaintenanceRequest[];

  onDrop: (
    requestId: string,
    newStage: string
  ) => void;

  onUpdate: () => void;

  onRequestClick: (requestId: string) => void;
  
  sortByCost: boolean;
}

const Column: React.FC<ColumnProps> = ({
  stage,
  requests,
  onDrop,
  onRequestClick,
  sortByCost
}) => {
  const [{ isOver }, drop] =
    useDrop(() => ({
      accept: "REQUEST",

      drop: (item: {
        id: string;
        stage: string;
      }) => {
        if (
          item.stage !== stage.id
        ) {
          onDrop(
            item.id,
            stage.id
          );
        }
      },

      collect: (monitor) => ({
        isOver:
          monitor.isOver(),
      }),
    }));

  return (
    <div
      ref={drop}
      className={`kanban-column flex-1 min-w-[280px] rounded-lg border p-4 ${stage.color} hover:shadow-xl transition-all duration-300 ${
        isOver
          ? "drag-over"
          : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {stage.title}
        </h3>

        <Badge
          variant="default"
          size="sm"
        >
          {requests.length}
        </Badge>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {requests.length ===
          0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-10">
            No requests
          </p>
        )}

        {[...requests].sort((a, b) => {
          if (!sortByCost) return 0;
          const costA = a.equipment?.hourlyDowntimeCost || 0;
          const costB = b.equipment?.hourlyDowntimeCost || 0;
          return costB - costA;
        }).map(
          (request) => (
            <RequestCard
              key={request.id}
              request={
                request
              }
              onUpdate={() => {}}
              onClick={() => onRequestClick(request.id || request._id || '')}
            />
          )
        )}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC =
  () => {
    const [requests, setRequests] =
      useState<
        MaintenanceRequest[]
      >([]);

    const [loading, setLoading] =
      useState(true);

    const [
      isModalOpen,
      setIsModalOpen,
    ] = useState(false);

    const [editRequestId, setEditRequestId] = useState<string | undefined>(undefined);

    const [filters, setFilters] =
      useState<RequestFilters>(
        defaultFilters
      );

    const [
      resultCount,
      setResultCount,
    ] = useState(0);

    const [sortByCost, setSortByCost] = useState(false);
    const [closureModalData, setClosureModalData] = useState<{ requestId: string, newStage: string } | null>(null);
    const [lotoModalData, setLotoModalData] = useState<{ request: MaintenanceRequest } | null>(null);

    useEffect(() => {
      loadRequests();
    }, [filters]);

    const loadRequests =
      async () => {
        try {
          const data =
            await requestService.getFiltered(
              { ...filters, limit: 1000 }
            );

          setRequests(data.items);

          setResultCount(
            data.totalItems
          );
        } catch (error) {
          console.error(
            "Using fallback data due to API error"
          );

          setRequests([
            {
              id: "1",
              subject:
                "Fix Engine Issue",
              stage: "new",
              priority:
                "high",
              type:
                "corrective",
              requestNumber:
                "REQ-001",
            },

            {
              id: "2",
              subject:
                "Oil Maintenance",
              stage:
                "in-progress",
              priority:
                "medium",
              type:
                "preventive",
              requestNumber:
                "REQ-002",
            },

            {
              id: "3",
              subject:
                "Replace Brake Pads",
              stage:
                "repaired",
              priority: "low",
              type:
                "corrective",
              requestNumber:
                "REQ-003",
            },

            {
              id: "4",
              subject:
                "Discard Broken Part",
              stage: "scrap",
              priority:
                "urgent",
              type:
                "corrective",
              requestNumber:
                "REQ-004",
            },
          ]);
        } finally {
          setLoading(false);
        }
      };

    const handleDrop = async (requestId: string, newStage: string) => {
      const draggedReq = requests.find(r => (r.id || r._id) === requestId);
      if (draggedReq?.stage === 'new' && newStage === 'in-progress' && draggedReq.isBlockedAwaitingParts) {
        toast.error("Cannot start ticket: Blocked awaiting parts.");
        return;
      }
      const request = requests.find(r => r.id === requestId || r._id === requestId);
      if (!request) return;

      if (newStage === "in-progress" && request.equipment?.lotoRequired) {
        if (!request.lotoAudit?.isCompleted) {
          setLotoModalData({ request });
          return;
        }
      }

      if (newStage === "repaired" || newStage === "scrap") {
        setClosureModalData({ requestId, newStage });
      } else {
        try {
          await requestService.updateStage(requestId, newStage);
          await loadRequests();
        } catch (error) {
          console.error("Failed to update request stage:", error);
        }
      }
    };

    const handleClosureSubmit = async (partsCost: number, laborCost: number) => {
      if (!closureModalData) return;
      try {
        await requestService.updateStage(closureModalData.requestId, closureModalData.newStage, partsCost, laborCost);
        await loadRequests();
      } catch (error) {
        console.error("Failed to update request stage with costs:", error);
      } finally {
        setClosureModalData(null);
      }
    };

    const groupedRequests =
      STAGES.reduce(
        (acc, stage) => {
          acc[stage.id] =
            requests.filter(
              (req) =>
                req.stage ===
                stage.id
            );

          return acc;
        },
        {} as Record<
          string,
          MaintenanceRequest[]
        >
      );

    if (loading) {
      return (
        <Spinner
          size="lg"
          label="Loading requests..."
          centered
        />
      );
    }

    return (
      <DndProvider
        backend={HTML5Backend}
      >
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Maintenance Requests
            </h2>

            <div className="flex gap-2 w-full sm:w-auto">
              <ExportButton
                label="Export Excel"
                onClick={() => exportRequestsExcel(
                  Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                  ) as Record<string, string>
                )}
                variant="excel"
              />
              <Button
                onClick={() => setSortByCost(!sortByCost)}
                variant={sortByCost ? "primary" : "secondary"}
              >
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Sort by Cost Rate
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditRequestId(undefined);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />

                New Request
              </Button>
            </div>
          </div>

          <FilterBar
            filters={filters}
            setFilters={
              setFilters
            }
            resultCount={
              resultCount
            }
          />

          {requests.length ===
          0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              No requests match
              your current
              filters.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map(
                (stage) => (
                  <Column
                    key={
                      stage.id
                    }
                    stage={
                      stage
                    }
                    requests={
                      groupedRequests[
                        stage
                          .id
                      ] || []
                    }
                    onDrop={
                      handleDrop
                    }
                    onUpdate={
                      loadRequests
                    }
                    onRequestClick={(id) => {
                      setEditRequestId(id);
                      setIsModalOpen(true);
                    }}
                    sortByCost={sortByCost}
                  />
                )
              )}
            </div>
          )}

          {isModalOpen && (
            <RequestModal
              isOpen={
                isModalOpen
              }
              editRequestId={editRequestId}
              onClose={() => {
                setIsModalOpen(
                  false
                );
                setEditRequestId(undefined);
              }}
              onSuccess={() => {
                setIsModalOpen(
                  false
                );
                setEditRequestId(undefined);
                loadRequests();
              }}
            />
          )}

          {closureModalData && (
            <ClosureCostModal
              isOpen={!!closureModalData}
              onClose={() => setClosureModalData(null)}
              onSubmit={handleClosureSubmit}
              title={`Close Request (${closureModalData.newStage === 'scrap' ? 'Scrap' : 'Repaired'})`}
            />
          )}

          {lotoModalData && (
            <LOTOModal
              isOpen={!!lotoModalData}
              onClose={() => setLotoModalData(null)}
              onSuccess={async () => {
                setLotoModalData(null);
                // After successful LOTO, we can automatically transition to in-progress
                try {
                  await requestService.updateStage(lotoModalData.request.id || lotoModalData.request._id || "", "in-progress");
                  await loadRequests();
                } catch (e) {
                  console.error("Failed to move to in-progress after LOTO", e);
                }
              }}
              requestRecord={lotoModalData.request}
            />
          )}
        </div>
      </DndProvider>
    );
  };

export default KanbanBoard;