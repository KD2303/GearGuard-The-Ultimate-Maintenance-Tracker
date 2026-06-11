"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var Button_1 = require("./Button");
var api_1 = require("../services/api");
var react_hot_toast_1 = require("react-hot-toast");
var QuickActionCards = function (_a) {
    var onNewTask = _a.onNewTask;
    var _b = (0, react_1.useState)([]), myTodos = _b[0], setMyTodos = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(false), showAddForm = _e[0], setShowAddForm = _e[1];
    var _f = (0, react_1.useState)(''), newTaskTitle = _f[0], setNewTaskTitle = _f[1];
    var _g = (0, react_1.useState)(''), newTaskDescription = _g[0], setNewTaskDescription = _g[1];
    var _h = (0, react_1.useState)('medium'), newTaskPriority = _h[0], setNewTaskPriority = _h[1];
    var _j = (0, react_1.useState)(null), editingTask = _j[0], setEditingTask = _j[1];
    var _k = (0, react_1.useState)(''), editTitle = _k[0], setEditTitle = _k[1];
    var _l = (0, react_1.useState)(''), editDescription = _l[0], setEditDescription = _l[1];
    // Fetch tasks from API
    (0, react_1.useEffect)(function () {
        fetchTasks();
    }, []);
    var fetchTasks = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    setError(null);
                    return [4 /*yield*/, api_1.default.get('/tasks')];
                case 1:
                    response = _a.sent();
                    setMyTodos(response.data);
                    return [3 /*break*/, 4];
                case 2:
                    err_1 = _a.sent();
                    setError('Failed to load tasks');
                    console.error('Error fetching tasks:', err_1);
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var toggleTodo = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var response_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.default.patch("/tasks/".concat(id, "/toggle"))];
                case 1:
                    response_1 = _a.sent();
                    setMyTodos(function (todos) {
                        return todos.map(function (todo) {
                            return todo._id === id ? response_1.data : todo;
                        });
                    });
                    react_hot_toast_1.default.success('Task updated successfully');
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    react_hot_toast_1.default.error('Failed to update task');
                    console.error('Error toggling task:', err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var deleteTodo = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.default.delete("/tasks/".concat(id))];
                case 1:
                    _a.sent();
                    setMyTodos(function (todos) { return todos.filter(function (todo) { return todo._id !== id; }); });
                    react_hot_toast_1.default.success('Task deleted successfully');
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    react_hot_toast_1.default.error('Failed to delete task');
                    console.error('Error deleting task:', err_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var addTask = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!newTaskTitle.trim()) {
                        react_hot_toast_1.default.error('Task title is required');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.default.post('/tasks', {
                            title: newTaskTitle,
                            description: newTaskDescription,
                            priority: newTaskPriority,
                        })];
                case 2:
                    response = _a.sent();
                    setMyTodos(__spreadArray([response.data], myTodos, true));
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setNewTaskPriority('medium');
                    setShowAddForm(false);
                    react_hot_toast_1.default.success('Task added successfully');
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    react_hot_toast_1.default.error('Failed to add task');
                    console.error('Error adding task:', err_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var startEdit = function (task) {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
    };
    var cancelEdit = function () {
        setEditingTask(null);
        setEditTitle('');
        setEditDescription('');
    };
    var saveEdit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var response_2, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!editingTask || !editTitle.trim()) {
                        react_hot_toast_1.default.error('Task title is required');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.default.put("/tasks/".concat(editingTask._id), {
                            title: editTitle,
                            description: editDescription,
                        })];
                case 2:
                    response_2 = _a.sent();
                    setMyTodos(function (todos) {
                        return todos.map(function (todo) {
                            return todo._id === editingTask._id ? response_2.data : todo;
                        });
                    });
                    cancelEdit();
                    react_hot_toast_1.default.success('Task updated successfully');
                    return [3 /*break*/, 4];
                case 3:
                    err_5 = _a.sent();
                    react_hot_toast_1.default.error('Failed to update task');
                    console.error('Error updating task:', err_5);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* New Task Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold ">New Task/Item</h3>
          <lucide_react_1.Plus className="w-6 h-6"/>
        </div>
        <p className="text-blue-100 mb-6">
          Quickly create a new maintenance request or task
        </p>
        <div className="space-y-3">
          <Button_1.default variant="secondary" className="w-full mt-4 hover:shadow-md" onClick={onNewTask}>
            <lucide_react_1.Plus className="w-4 h-4 relative top-[1px]"/>
            <span className="leading-none tracking-tight">New Maintenance Request</span>
          </Button_1.default>
          <Button_1.default variant="secondary" className="w-full mt-4 hover:shadow-md">
            <lucide_react_1.Calendar className="w-4 h-4 relative top-[1px]"/>
            <span className="leading-none tracking-tight">Schedule Preventive Maintenance</span>
          </Button_1.default>
        </div>
      </div>

      {/* My To-Dos Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">My To-Dos</h3>
          <lucide_react_1.CheckSquare className="w-6 h-6 text-white/80"/>
        </div>

        {loading ? (<div className="text-center py-8 text-white/80">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            <p className="mt-2 text-sm">Loading tasks...</p>
          </div>) : error ? (<div className="text-center py-8 text-white/80">
            <p className="text-sm">{error}</p>
            <button onClick={fetchTasks} className="mt-2 text-sm underline hover:text-white">
              Retry
            </button>
          </div>) : myTodos.length === 0 ? (<div className="text-center py-8 text-white/80">
            <p className="text-sm">No tasks yet. Add one to get started!</p>
          </div>) : (<div className="space-y-2">
            {myTodos.map(function (todo) { return (<div key={todo._id} className="flex items-center p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200">
                {(editingTask === null || editingTask === void 0 ? void 0 : editingTask._id) === todo._id ? (<form onSubmit={saveEdit} className="flex-1 flex items-center gap-2">
                    <input type="text" value={editTitle} onChange={function (e) { return setEditTitle(e.target.value); }} className="flex-1 px-2 py-1 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500" placeholder="Task title" autoFocus/>
                    <button type="submit" className="p-1 hover:bg-white/30 rounded transition-colors" title="Save">
                      <lucide_react_1.CheckSquare className="w-4 h-4"/>
                    </button>
                    <button type="button" onClick={cancelEdit} className="p-1 hover:bg-white/30 rounded transition-colors" title="Cancel">
                      <lucide_react_1.X className="w-4 h-4"/>
                    </button>
                  </form>) : (<>
                    <input type="checkbox" checked={todo.completed} onChange={function () { return toggleTodo(todo._id); }} className="w-4 h-4 accent-white border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 cursor-pointer"/>
                    <div className="flex-1 ml-3">
                      <span className={"text-sm block ".concat(todo.completed
                        ? 'text-white/60 line-through'
                        : 'text-white')}>
                        {todo.title}
                      </span>
                      {todo.description && (<span className="text-xs text-white/70 block mt-0.5">
                          {todo.description}
                        </span>)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={function () { return startEdit(todo); }} className="p-1 hover:bg-white/30 rounded transition-colors" title="Edit">
                        <lucide_react_1.Edit2 className="w-3 h-3"/>
                      </button>
                      <button onClick={function () { return deleteTodo(todo._id); }} className="p-1 hover:bg-red-500/50 rounded transition-colors" title="Delete">
                        <lucide_react_1.Trash2 className="w-3 h-3"/>
                      </button>
                    </div>
                  </>)}
              </div>); })}
          </div>)}

        {showAddForm ? (<form onSubmit={addTask} className="mt-4 space-y-2">
            <input type="text" value={newTaskTitle} onChange={function (e) { return setNewTaskTitle(e.target.value); }} className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500" placeholder="Task title" autoFocus/>
            <textarea value={newTaskDescription} onChange={function (e) { return setNewTaskDescription(e.target.value); }} className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900 placeholder-gray-500 resize-none" placeholder="Description (optional)" rows={2}/>
            <select value={newTaskPriority} onChange={function (e) { return setNewTaskPriority(e.target.value); }} className="w-full px-3 py-2 text-sm rounded bg-white/90 text-gray-900">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="flex gap-2">
              <Button_1.default type="submit" variant="secondary" size="sm" className="flex-1 hover:shadow-md">
                Add Task
              </Button_1.default>
              <Button_1.default type="button" variant="secondary" size="sm" onClick={function () { return setShowAddForm(false); }} className="hover:shadow-md">
                Cancel
              </Button_1.default>
            </div>
          </form>) : (<Button_1.default variant="secondary" size="sm" className="w-full mt-4 hover:shadow-md" onClick={function () { return setShowAddForm(true); }}>
            <lucide_react_1.Plus className="w-4 h-4"/>
            Add New To-Do
          </Button_1.default>)}
      </div>
    </div>);
};
exports.default = QuickActionCards;
