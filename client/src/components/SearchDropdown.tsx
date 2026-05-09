import { useNavigate } from 'react-router-dom';
import { GlobalSearchResults } from '../types';

interface SearchDropdownProps {
  results: GlobalSearchResults;
  query: string;
  isLoading: boolean;
  onClose: () => void;
}

const SearchDropdown = ({ results, query, isLoading, onClose }: SearchDropdownProps) => {
  const navigate = useNavigate();
  const hasResults =
    results.equipment.length > 0 || results.requests.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'under-maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'scrapped': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'repaired': return 'bg-green-100 text-green-700';
      case 'scrap': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
        <p className="text-sm text-gray-400 text-center">Searching...</p>
      </div>
    );
  }

  if (!hasResults && query.length > 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
        <p className="text-sm text-gray-400 text-center">
          No results found for "<strong>{query}</strong>"
        </p>
      </div>
    );
  }

  if (!hasResults) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

      {results.equipment.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Equipment ({results.equipment.length})
            </p>
          </div>
          {results.equipment.map((eq) => (
            <div
              key={eq._id}
              onClick={() => {
                navigate('/equipment');
                onClose();
              }}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{eq.name}</p>
                <p className="text-xs text-gray-400">
                  {eq.serialNumber} · {eq.category} · {eq.location}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(eq.status)}`}>
                {eq.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {results.requests.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Maintenance Requests ({results.requests.length})
            </p>
          </div>
          {results.requests.map((req) => (
            <div
              key={req._id}
              onClick={() => {
                navigate('/requests');
                onClose();
              }}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{req.subject}</p>
                <p className="text-xs text-gray-400">
                  {req.requestNumber}
                  {req.equipmentId ? ` · ${req.equipmentId.name}` : ''}
                  {req.assignedToId ? ` · ${req.assignedToId.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStageColor(req.stage)}`}>
                  {req.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Press <kbd className="bg-gray-200 px-1 rounded text-xs">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
};

export default SearchDropdown;
