import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Circle, Calendar, Settings, Trash2 } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { useTasks } from '../hooks/useTasks';
import { useCalendar } from '../hooks/useCalendar';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { habits, toggleHabit } = useHabits();
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const { events, loading: eventsLoading } = useCalendar();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const firstEventDate = events.length > 0 ? events[0].start.toDateString() : null;
  const displayEvents = events.filter(e => e.start.toDateString() === firstEventDate);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Habit Tiles Section */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-semibold">Your Habits</h2>
          <Link to="/manage-habits" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 flex items-center gap-1 text-sm">
            <Settings size={16} />
            <span>Manage</span>
          </Link>
        </div>
        
        {habits.length === 0 ? (
          <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--text-muted)]/10 text-center">
            <p className="text-[var(--text-muted)] mb-3">No habits yet.</p>
            <Link to="/manage-habits" className="bg-[var(--text-main)] text-[var(--bg-main)] px-4 py-2 rounded-full text-sm font-medium">
              Create your first habit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {habits.map((habit) => {
              const Icon = habit.icon;
              return (
                <motion.div
                  key={habit.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleHabit(habit.id)}
                  className={`relative cursor-pointer rounded-[2rem] p-3 sm:p-4 flex flex-col items-center justify-center aspect-square transition-all duration-300 shadow-sm border-2 ${
                    habit.isCompleted 
                      ? 'border-transparent scale-95' 
                      : 'border-transparent hover:shadow-md'
                  }`}
                  style={{ 
                    backgroundColor: habit.color,
                    opacity: habit.isCompleted ? 0.7 : 1,
                    color: '#1e1e24'
                  }}
                >
                  {/* Completed Checkmark top right */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                        habit.isCompleted ? 'bg-green-500 text-white' : 'border-2 border-[var(--text-main)]/10'
                    }`}>
                      <AnimatePresence>
                        {habit.isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Centered Icon with tinted background */}
                  <div className="p-3 sm:p-4 rounded-full bg-white/40 mb-2 mt-1 sm:mt-2 transition-transform">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  {/* Label */}
                  <span className="font-semibold text-center text-xs sm:text-sm leading-tight px-1">{habit.name}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tasks Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tasks for Today</h2>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-3xl p-2 shadow-sm border border-[var(--text-muted)]/10">
          {/* Add Task Input */}
          <form onSubmit={handleAddTask} className="flex items-center gap-2 p-2 mb-2">
            <button type="submit" className="text-[var(--text-main)] p-1 bg-[var(--text-muted)]/10 rounded-full hover:bg-[var(--text-muted)]/20 transition-colors">
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Add a new task..." 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="bg-transparent flex-1 outline-none text-sm placeholder-[var(--text-muted)]"
            />
          </form>

          {tasks.length === 0 ? (
            <div className="text-center p-4 text-sm text-[var(--text-muted)]">
              All caught up! No tasks.
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div 
                key={task.id} 
                className={`group flex items-center justify-between p-3 rounded-2xl transition-colors ${
                  idx !== tasks.length - 1 ? 'border-b border-[var(--text-muted)]/10' : ''
                } hover:bg-[var(--bg-main)]/50 cursor-pointer`}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden" onClick={() => toggleTask(task.id)}>
                  {task.isCompleted ? (
                    <Check size={20} className="text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <Circle size={20} className="text-[var(--text-muted)] shrink-0" />
                  )}
                  <div className="flex flex-col flex-1 truncate">
                    <span className={`text-sm truncate ${task.isCompleted ? 'text-[var(--text-muted)] line-through' : ''}`}>
                      {task.title}
                    </span>
                    {task.due && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {task.due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Mini Calendar Widget */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
        {eventsLoading ? (
          <div className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10 text-center text-sm text-[var(--text-muted)] animate-pulse">
            Loading events...
          </div>
        ) : displayEvents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {displayEvents.map((event) => (
              <div key={event.id} className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10 flex items-center justify-between">
                <div className="flex flex-col flex-1 truncate pr-4">
                  <span className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider mb-1">
                    {event.start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-medium truncate">{event.title}</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {event.isAllDay 
                      ? 'All Day' 
                      : `${event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[#1e1e24] shrink-0">
                  <Calendar size={20} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium">No upcoming events</span>
              <span className="text-sm text-[var(--text-muted)] mt-1">Connect Google in the 'You' tab</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] opacity-50">
              <Calendar size={20} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
