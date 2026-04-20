import { useState, useEffect } from 'react';
import { RequestFilters, defaultFilters } from '../types';
import API from '../services/api';

interface FilterBarProps {
  filters: RequestFilters;
  setFilters: (filters: RequestFilters) => void;
  resultCount: number;
}

const FilterBar = ({ filters, setFilters, resultCount }: FilterBarProps) => {
  const [members, setMembers] = useState<{ _id: string; name: string }[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await API.get('/members');
        setMembers(res.data);
      } catch (err) {
        console.error('Failed to load members', err);
      }
    };
    fetchMembers();
  }, []);

  // 300ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleChange = (key: keyof RequestFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    setSearchInput('');
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{resultCount} results</span>
          {activeFilterCount > 0 && (
            <button
              id="filter-clear-all"
              onClick={handleClear}
              className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <input
          id="filter-search"
          type="text"
          placeholder="Search by no., equipment, subject..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="col-span-2 md:col-span-4 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <select
          id="filter-priority"
          value={filters.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          id="filter-stage"
          value={filters.stage}
          onChange={(e) => handleChange('stage', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="repaired">Repaired</option>
          <option value="scrap">Scrap</option>
        </select>

        <select
          id="filter-type"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Types</option>
          <option value="corrective">Corrective</option>
          <option value="preventive">Preventive</option>
        </select>

        <select
          id="filter-technician"
          value={filters.assignedToId}
          onChange={(e) => handleChange('assignedToId', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Technicians</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-start-date" className="text-xs text-gray-400">Start date</label>
          <input
            id="filter-start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-end-date" className="text-xs text-gray-400">End date</label>
          <input
            id="filter-end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

      </div>
    </div>
  );
};

export default FilterBar;
