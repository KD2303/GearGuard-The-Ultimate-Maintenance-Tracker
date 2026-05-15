import TaskActivityPanel from '../components/TaskActivityPanel';

const ActivityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">View all system activities and team actions</p>
      </div>

      <TaskActivityPanel />
    </div>
  );
};

export default ActivityPage;
