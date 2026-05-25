import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Equipment } from '../types';
import { toast } from 'react-hot-toast';
import { 
  MapPin, AlertTriangle, Settings, CheckCircle2,
  Maximize2, ZoomIn, ZoomOut, GripHorizontal, Box
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '../components/Badge';

const FloorPlan: React.FC = () => {
  const { t } = useTranslation();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [draggedEqId, setDraggedEqId] = useState<string | null>(null);

  // Fetch equipment on mount
  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.get('/equipment');
      setEquipmentList(res.data.equipment || res.data);
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const placedEquipment = equipmentList.filter(eq => eq.mapCoordinates?.x != null && eq.mapCoordinates?.y != null);
  const unplacedEquipment = equipmentList.filter(eq => eq.mapCoordinates?.x == null || eq.mapCoordinates?.y == null);

  const getStatusColor = (status: string, health: number = 100) => {
    if (status === 'under-maintenance') return 'text-amber-500';
    if (status === 'scrapped') return 'text-slate-500';
    if (status === 'inactive') return 'text-rose-500';
    
    if (health < 40) return 'text-red-500';
    if (health < 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEqId(id);
    e.dataTransfer.setData('text/plain', id);
    // Setting a custom drag image makes it look nicer
    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost';
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedEqId(null);
    const ghost = document.getElementById('drag-ghost');
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnMap = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEqId) return;

    // Calculate relative percentages
    const mapElement = e.currentTarget as HTMLDivElement;
    const rect = mapElement.getBoundingClientRect();
    
    // Account for zoom if map uses transform: scale
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to bounds 0-100
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    await updateCoordinates(draggedEqId, x, y);
    setDraggedEqId(null);
  };

  const updateCoordinates = async (id: string, x: number, y: number) => {
    // Optimistic update
    setEquipmentList(prev => prev.map(eq => 
      eq._id === id || eq.id === id ? { ...eq, mapCoordinates: { x, y } } : eq
    ));

    try {
      await api.put(`/equipment/${id}`, { mapCoordinates: { x, y } });
      toast.success('Location updated');
    } catch (error) {
      toast.error('Failed to save location');
      fetchEquipment(); // Revert on failure
    }
  };

  const handleRemoveFromMap = async (id: string) => {
    setEquipmentList(prev => prev.map(eq => 
      eq._id === id || eq.id === id ? { ...eq, mapCoordinates: undefined } : eq
    ));
    try {
      await api.put(`/equipment/${id}`, { mapCoordinates: null });
      toast.success('Removed from map');
    } catch (error) {
      fetchEquipment();
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      
      {/* LEFT SIDEBAR: UNPLACED EQUIPMENT (Also acts as a Remove drop zone) */}
      <div 
        className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedEqId && placedEquipment.find(eq => eq._id === draggedEqId || eq.id === draggedEqId)) {
            handleRemoveFromMap(draggedEqId);
          }
        }}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-500" />
            Unplaced Equipment ({unplacedEquipment.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Drag items onto the floor plan to assign their physical location.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {unplacedEquipment.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-500">All equipment placed!</p>
            </div>
          ) : (
            unplacedEquipment.map((eq) => (
              <div 
                key={eq._id}
                draggable
                onDragStart={(e) => handleDragStart(e, eq._id!)}
                onDragEnd={handleDragEnd}
                className="group relative bg-white dark:bg-slate-750 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {eq.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                      {eq.serialNumber}
                    </p>
                  </div>
                  <GripHorizontal className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="default" size="sm">{eq.category}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT MAIN: FLOOR PLAN MAP */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-hidden relative flex flex-col transition-colors">
        
        {/* Map Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <button 
            onClick={() => setZoom(1)}
            className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container - Handles drag and drop */}
        <div 
          className="flex-1 overflow-auto custom-scrollbar relative bg-slate-900 p-8"
        >
          <div className="w-full h-full min-w-max min-h-max flex items-start justify-start">
            <div 
              className="relative transition-transform duration-300 origin-top-left shadow-2xl rounded-lg mx-auto my-auto"
            style={{ 
              transform: `scale(${zoom})`,
              width: '1200px', // Base dimensions of the map image
              height: '800px',
              backgroundImage: 'url(/floor-plan.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDropOnMap}
          >
            {/* Render Placed Pins */}
            {placedEquipment.map((eq) => (
              <div
                key={eq._id}
                draggable
                onDragStart={(e) => handleDragStart(e, eq._id!)}
                onDragEnd={handleDragEnd}
                className={`absolute w-8 h-8 -ml-4 -mt-8 flex flex-col items-center justify-end cursor-grab active:cursor-grabbing group z-10 transition-transform ${draggedEqId === eq._id ? 'opacity-50' : 'opacity-100 hover:scale-110 hover:z-50'}`}
                style={{
                  left: `${eq.mapCoordinates!.x}%`,
                  top: `${eq.mapCoordinates!.y}%`,
                }}
              >
                {/* Tooltip Popover (Shows on Hover) */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 pointer-events-none origin-bottom animate-slide-up">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{eq.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{eq.serialNumber}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={eq.status === 'under-maintenance' ? 'warning' : 'success'} size="sm">
                      {eq.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2">
                    <span>Drop outside to remove</span>
                  </div>
                </div>

                {/* The Pin Icon */}
                <div className="relative">
                  <div className={`absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity`}></div>
                  <MapPin 
                    className={`relative w-8 h-8 filter drop-shadow-md transition-colors ${getStatusColor(eq.status)} fill-slate-900/50`} 
                  />
                  {eq.status === 'under-maintenance' && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
        
        {/* Remove Zone - Bottom Bar */}
        <div 
          className="h-16 bg-slate-800/90 border-t border-slate-700 flex items-center justify-center backdrop-blur-md transition-colors"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedEqId) {
              handleRemoveFromMap(draggedEqId);
            }
          }}
        >
          <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Drag equipment here to remove it from the map
          </p>
        </div>

      </div>
    </div>
  );
};

export default FloorPlan;
