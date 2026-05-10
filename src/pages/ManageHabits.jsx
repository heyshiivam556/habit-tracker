import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { ArrowLeft, Plus, Trash2, BookOpen, Droplet, Dumbbell, Coffee, Heart, Star, Music, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const availableIcons = [
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Droplet', icon: Droplet },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Coffee', icon: Coffee },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Music', icon: Music },
  { name: 'Zap', icon: Zap },
];

const availableColors = [
  'var(--color-accent-peach)',
  'var(--color-accent-blue)',
  'var(--color-accent-rose)',
  'var(--color-accent-soft)',
  '#bde0fe', // light pastel blue
  '#cdb4db', // pastel purple
  '#fcf6bd', // pastel yellow
  '#c1fba4', // pastel light green
];

export default function ManageHabits() {
  const { habits, addHabit, deleteHabit } = useHabits();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    addHabit({
      name: newHabitName,
      iconName: selectedIcon,
      color: selectedColor
    });
    
    setNewHabitName('');
    setIsAdding(false);
  };

  return (
    <div className="pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 bg-[var(--bg-surface)] rounded-full hover:bg-[var(--text-muted)]/10 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <p className="text-[var(--text-muted)]">Back to Dashboard</p>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-3xl p-4 shadow-sm border border-[var(--text-muted)]/10 mb-8">
        <h3 className="font-semibold mb-4 px-2">Current Habits</h3>
        {habits.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] px-2 pb-2">No habits tracked yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.map(habit => {
              const Icon = habit.icon;
              return (
                <div key={habit.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-main)]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#1e1e24]" style={{ backgroundColor: habit.color }}>
                      <Icon size={22} />
                    </div>
                    <span className="font-medium text-sm sm:text-base">{habit.name}</span>
                  </div>
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="p-3 text-red-400 hover:text-red-500 hover:bg-red-400/10 rounded-full transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-5 border-2 border-dashed border-[var(--text-muted)]/30 rounded-3xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]/60 transition-colors font-medium text-lg"
        >
          <Plus size={24} />
          Create New Habit
        </button>
      ) : (
        <form onSubmit={handleSave} className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 shadow-md border border-[var(--text-muted)]/10">
          <h3 className="font-semibold mb-6 text-lg">Create New Habit</h3>
          
          <div className="mb-6">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Habit Name</label>
            <input 
              type="text" 
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Meditate for 10 min"
              className="w-full bg-[var(--bg-main)] px-5 py-4 rounded-2xl outline-none text-base border border-transparent focus:border-[var(--text-muted)]/30 transition-colors"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">Choose Icon</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
              {availableIcons.map(iconObj => {
                const IconComp = iconObj.icon;
                const isSelected = selectedIcon === iconObj.name;
                return (
                  <button
                    key={iconObj.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconObj.name)}
                    className={`flex items-center justify-center aspect-square rounded-2xl transition-all ${isSelected ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-md scale-105' : 'bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--text-muted)]/20'}`}
                  >
                    <IconComp size={24} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">Choose Color</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
              {availableColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`aspect-square rounded-full transition-transform ${selectedColor === color ? 'scale-110 ring-4 ring-offset-2 ring-offset-[var(--bg-surface)] ring-[#1e1e24] dark:ring-white shadow-md' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="flex-1 py-4 rounded-2xl font-medium bg-[var(--bg-main)] hover:bg-[var(--text-muted)]/10 transition-colors text-base"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-4 rounded-2xl font-semibold bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 disabled:opacity-50 transition-opacity text-base flex justify-center items-center gap-2"
            >
              <Plus size={20} /> Add Habit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
