import { useState } from 'react';
import { Plus, CheckSquare, Calendar } from 'lucide-react';
import Button from './Button';

interface QuickActionCardsProps {
  onNewTask?: () => void;
}

const QuickActionCards = ({ onNewTask }: QuickActionCardsProps) => {
  const [myTodos, setMyTodos] = useState([
    { id: 1, text: 'Review maintenance schedules', completed: false },
    { id: 2, text: 'Update equipment inventory', completed: false },
    { id: 3, text: 'Assign technicians to new requests', completed: true },
  ]);

  const toggleTodo = (id: number) => {
    setMyTodos(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* New Task Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold ">New Task/Item</h3>
          <Plus className="w-6 h-6" />
        </div>
        <p className="text-blue-100 mb-6">
          Quickly create a new maintenance request or task
        </p>
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full mt-4 hover:shadow-md"
            onClick={onNewTask}
          >
            <Plus className="w-4 h-4 relative top-[1px]" />
            <span className="leading-none tracking-tight">New Maintenance Request</span>
          </Button>
          <Button
            variant="secondary"
            className="w-full mt-4 hover:shadow-md"
          >
            <Calendar className="w-4 h-4 relative top-[1px]" />
            <span className="leading-none tracking-tight">Schedule Preventive Maintenance</span>
          </Button>
        </div>
      </div>

      {/* My To-Dos Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">My To-Dos</h3>
          <CheckSquare className="w-6 h-6 text-white/80" />
        </div>
        <div className="space-y-3">
          {myTodos.map(todo => (
            <label
              key={todo.id}
              className="flex items-center p-3 rounded-lg 
              bg-white/20 hover:bg-white/30
              transition-all duration-200 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-4 h-4 accent-white border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
              />
              <span
                className={`ml-3 text-sm ${
                  todo.completed
                    ? 'text-white/60 line-through'
                    : 'text-white'
                }`}
              >
                {todo.text}
              </span>
            </label>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4 hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New To-Do
        </Button>
      </div>
    </div>
  );
};

export default QuickActionCards;
