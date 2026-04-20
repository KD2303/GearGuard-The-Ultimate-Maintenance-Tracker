import API from './api';
import { GlobalSearchResults } from '../types';

export const globalSearch = async (query: string): Promise<GlobalSearchResults> => {
  if (!query || query.trim() === '') {
    return { equipment: [], requests: [] };
  }
  const response = await API.get(`/search?q=${encodeURIComponent(query.trim())}`);
  return response.data;
};
