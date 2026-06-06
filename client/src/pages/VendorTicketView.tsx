import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MaintenanceRequest } from '../types';

export default function VendorTicketView() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/vendor/ticket/${token}`);
        setTicket(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load ticket. The link may have expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [token]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      const response = await axios.post(`http://localhost:5001/api/vendor/ticket/${token}/notes`, {
        content: noteContent
      });
      setTicket(prev => prev ? { ...prev, comments: [...(prev.comments || []), response.data] } : prev);
      setNoteContent('');
      toast.success("Note added successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add note");
    }
  };

  const handleMarkRepaired = async () => {
    try {
      await axios.patch(`http://localhost:5001/api/vendor/ticket/${token}/stage`, {
        stage: 'repaired'
      });
      setTicket(prev => prev ? { ...prev, stage: 'repaired' } : prev);
      toast.success("Ticket marked as repaired");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update ticket");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GearGuard Vendor Portal</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Welcome, {ticket.vendorEscalation?.vendorCompany || 'Vendor'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.stage === 'repaired' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {ticket.stage.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 mt-1">Ticket: {ticket.requestNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{ticket.subject}</p>
            </div>
            {ticket.equipment && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Equipment</h3>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">{ticket.equipment.name} ({ticket.equipment.serialNumber})</p>
                <p className="text-sm text-gray-500">{ticket.equipment.location}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
            <div className="mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
              {ticket.description || 'No description provided.'}
            </div>
          </div>
          
          {ticket.vendorEscalation?.message && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-indigo-500">Internal Message to Vendor</h3>
              <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap border border-indigo-100 dark:border-indigo-800">
                {ticket.vendorEscalation.message}
              </div>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Log</h3>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No logs yet.</p>
                )}
              </div>
              
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type a service note..."
                  className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!noteContent.trim() || ticket.stage === 'repaired'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  Post Note
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleMarkRepaired}
                  disabled={ticket.stage === 'repaired'}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Repaired
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Once marked as repaired, you will no longer be able to modify the ticket.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
