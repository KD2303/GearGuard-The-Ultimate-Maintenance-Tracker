import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { MaintenanceRequest } from '../types';
import { requestService } from '../services/requestService';
import RequestModal from '../components/RequestModal';
import Button from '../components/Button';
import { Plus } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<MaintenanceRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadEvents = async () => {
    try {
      const data = await requestService.getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: `${event.subject} - ${event.equipment?.name || 'N/A'}`,
    start: new Date(event.scheduledDate!),
    end: new Date(event.scheduledDate!),
    resource: event,
  }));

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preventive Maintenance Calendar</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
        />
      </div>

      {isModalOpen && (
        <RequestModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
            loadEvents();
          }}
          initialDate={selectedDate || undefined}
          initialType="preventive"
        />
      )}
    </div>
  );
};

export default CalendarView;
