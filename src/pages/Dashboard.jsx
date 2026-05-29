import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Circle, Calendar, Settings, Trash2, X } from 'lucide-react';
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

  const [timeModalHabit, setTimeModalHabit] = useState(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const calendarDates = useMemo(() => {
    return Array.from({ length: 21 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
  }, []);
  
  const selectedDateStr = selectedDate.toDateString();
  const calendarRef = useRef(null);

  useEffect(() => {
    if (calendarRef.current) {
      const todayElement = calendarRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        const offset = todayElement.offsetLeft + todayElement.offsetWidth - calendarRef.current.clientWidth + 16;
        calendarRef.current.scrollLeft = offset > 0 ? offset : 0;
      }
    }
  }, [calendarDates]);

  const handleHabitClick = (habit) => {
    const isCompleted = (habit.completedDates || []).includes(selectedDateStr);
    if (!isCompleted && habit.requiresTime) {
      setTimeModalHabit(habit);
      setSelectedHour(0);
      setSelectedMinute(0); // Fixed default to 0
    } else {
      toggleHabit(habit.id, null, selectedDateStr);
    }
  };

  const handleTimeConfirm = () => {
    if (timeModalHabit) {
      const timeInMinutes = (selectedHour * 60) + selectedMinute;
      toggleHabit(timeModalHabit.id, timeInMinutes, selectedDateStr);
      setTimeModalHabit(null);
    }
  };

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

        {/* Horizontal Calendar Bar */}
        <div 
          ref={calendarRef}
          className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
        >
          {calendarDates.map((date, i) => {
            const isSelected = date.toDateString() === selectedDateStr;
            const isToday = date.toDateString() === new Date().toDateString();
            
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const thisDate = new Date(date);
            thisDate.setHours(0, 0, 0, 0);
            const isFutureDate = thisDate > todayDate;

            return (
              <button
                key={i}
                data-today={isToday}
                disabled={isFutureDate}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[3rem] p-2 rounded-2xl transition-all relative shrink-0 ${
                  isFutureDate ? 'opacity-40 cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)]' :
                  isSelected ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-sm' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold mb-1">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className={`text-sm font-bold ${isFutureDate ? 'text-[var(--text-muted)]' : isSelected ? '' : 'text-[var(--text-main)]'}`}>{date.getDate()}</span>
                {isToday && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-[var(--bg-main)]' : 'bg-[var(--color-accent-rose)]'}`} />
                )}
              </button>
            );
          })}
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
              const isCompleted = (habit.completedDates || []).includes(selectedDateStr);
              return (
                <motion.div
                  key={habit.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleHabitClick(habit)}
                  className={`habit-tile relative cursor-pointer rounded-[2rem] p-3 sm:p-4 flex flex-col items-center justify-center aspect-square transition-all duration-300 shadow-sm border-2 ${
                    isCompleted 
                      ? 'border-transparent scale-95' 
                      : 'border-transparent hover:shadow-md'
                  }`}
                  style={{ 
                    '--habit-color': habit.color,
                    backgroundColor: habit.color,
                    opacity: isCompleted ? 0.7 : 1,
                    color: '#1e1e24'
                  }}
                >
                  {/* Completed Checkmark top right */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                        isCompleted ? 'bg-green-500 text-white' : 'border-2 border-[var(--text-main)]/10'
                    }`}>
                      <AnimatePresence>
                        {isCompleted && (
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

      {/* Time Input Modal */}
      <AnimatePresence>
        {timeModalHabit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-surface)] p-6 rounded-[2.5rem] w-full max-w-sm shadow-xl relative border border-[var(--text-muted)]/10 flex flex-col items-center"
            >
              <button 
                onClick={() => setTimeModalHabit(null)}
                className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-main)] p-2 rounded-full"
              >
                <X size={20} />
              </button>

              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-[#1e1e24] shadow-sm mt-2"
                style={{ backgroundColor: timeModalHabit.color }}
              >
                {timeModalHabit.icon && <timeModalHabit.icon size={32} />}
              </div>
              <h3 className="text-xl font-bold mb-1 text-center">{timeModalHabit.name}</h3>
              <p className="text-sm text-[var(--text-muted)] mb-8 text-center">Log your time for this habit</p>

              <div className="flex gap-6 mb-8 w-full justify-center">
                {/* Hour Wheel */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-[var(--text-muted)] font-medium uppercase mb-2">Hours</span>
                  <div 
                    onScroll={(e) => {
                      const idx = Math.round(e.target.scrollTop / 40);
                      if (idx >= 0 && idx < 24) setSelectedHour(idx);
                    }}
                    className="h-32 w-20 overflow-y-auto no-scrollbar snap-y snap-mandatory border border-[var(--text-muted)]/20 rounded-3xl bg-[var(--bg-main)]"
                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}
                  >
                    <div className="h-11"></div>
                    {Array.from({length: 24}).map((_, i) => (
                      <div 
                        key={i} 
                        className="h-10 flex items-center justify-center text-2xl font-bold snap-center cursor-pointer transition-colors"
                        style={{ color: selectedHour === i ? 'var(--text-main)' : 'var(--text-muted)' }}
                        onClick={(e) => {
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setSelectedHour(i);
                        }}
                      >
                        {i.toString().padStart(2, '0')}
                      </div>
                    ))}
                    <div className="h-11"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center text-3xl font-bold text-[var(--text-muted)] pb-2">:</div>

                {/* Minute Wheel */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-[var(--text-muted)] font-medium uppercase mb-2">Minutes</span>
                  <div 
                    onScroll={(e) => {
                      const idx = Math.round(e.target.scrollTop / 40);
                      if (idx >= 0 && idx < 60) setSelectedMinute(idx);
                    }}
                    className="h-32 w-20 overflow-y-auto no-scrollbar snap-y snap-mandatory border border-[var(--text-muted)]/20 rounded-3xl bg-[var(--bg-main)]"
                    style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}
                  >
                    <div className="h-11"></div>
                    {Array.from({length: 60}).map((_, i) => (
                      <div 
                        key={i} 
                        className="h-10 flex items-center justify-center text-2xl font-bold snap-center cursor-pointer transition-colors"
                        style={{ color: selectedMinute === i ? 'var(--text-main)' : 'var(--text-muted)' }}
                        onClick={(e) => {
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setSelectedMinute(i);
                        }}
                      >
                        {i.toString().padStart(2, '0')}
                      </div>
                    ))}
                    <div className="h-11"></div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleTimeConfirm}
                className="w-full py-4 rounded-3xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm flex items-center justify-center gap-2 text-lg"
              >
                <Check size={24} strokeWidth={3} />
                Complete Habit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
