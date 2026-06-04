import { useState, useEffect } from 'react';
import { Plus, CheckSquare, Calendar, Trash2, Edit2, X } from 'lucide-react';
import Button from './Button';
import api from '../services/api';
import toast from 'react-hot-toast';

interface QuickActionCardsProps {
  onNewTask?: () => void;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

const QuickActionCards = ({ onNewTask }: QuickActionCardsProps) => {
  const [myTodos, setMyTodos] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch tasks from API
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/tasks');
      setMyTodos(response.data);
    } catch (err: any) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const response = await api.patch(`/tasks/${id}/toggle`);
      setMyTodos(todos =>
        todos.map(todo =>
          todo._id === id ? response.data : todo
        )
      );
      toast.success('Task updated successfully');
    } catch (err: any) {
      toast.error('Failed to update task');
      console.error('Error toggling task:', err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setMyTodos(todos => todos.filter(todo => todo._id !== id));
      toast.success('Task deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const response = await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
      });
      setMyTodos([response.data, ...myTodos]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setShowAddForm(false);
      toast.success('Task added successfully');
    } catch (err: any) {
      toast.error('Failed to add task');
      console.error('Error adding task:', err);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const response = await api.put(`/tasks/${editingTask._id}`, {
        title: editTitle,
        description: editDescription,
      });
      setMyTodos(todos =>
        todos.map(todo =>
          todo._id === editingTask._id ? response.data : todo
        )
      );
      cancelEdit();
      toast.success('Task updated successfully');
    } catch (err: any) {
      toast.error('Failed to update task');
      console.error('Error updating task:', err);
    }
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

        {loading ? (
          <div className="text-center py-8 text-white/80">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            <p className="mt-2 text-sm">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-white/80">
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-2 text-sm underline hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : myTodos.length === 0 ? (
          <div className="text-center py-8 text-white/80">
            <p className="text-sm">No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTodos.map(todo => (
              <div
                key={todo._id}
                className="flex items-center p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
              >
                {editingTask?._id === todo._id ? (
                  <form onSubmit={saveEdit} className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500"
                      placeholder="Task title"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1 hover:bg-white/30 rounded transition-colors"
                      title="Save"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1 hover:bg-white/30 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo._id)}
                      className="w-4 h-4 accent-white border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1 ml-3">
                      <span
                        className={`text-sm block ${
                          todo.completed
                            ? 'text-white/60 line-through'
                            : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </span>
                      {todo.description && (
                        <span className="text-xs text-white/70 block mt-0.5">
                          {todo.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(todo)}
                        className="p-1 hover:bg-white/30 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo._id)}
                        className="p-1 hover:bg-red-500/50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <form onSubmit={addTask} className="mt-4 space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500"
              placeholder="Task title"
              autoFocus
            />
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500 resize-none"
              placeholder="Description (optional)"
              rows={2}
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="flex-1 hover:shadow-md"
              >
                Add Task
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="hover:shadow-md"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-4 hover:shadow-md"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" />
            Add New To-Do
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuickActionCards;
