import React, { useState, useMemo, useEffect } from 'react';
import { useHabits } from '../hooks/useHabits';
import { ChevronLeft, ChevronRight, Activity, TrendingUp, Flame } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export default function Analytics() {
  const { habits } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    // Optional: limit to current real month
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth()) return;
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const { chartData, monthlyScore, currentStreak, totalCompletions, habitProgressData } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    let monthCompletions = 0;
    let totalPossible = 0;

    // For streak calculation, we look backwards from today (or last day of the selected month)
    let streakCount = 0;

    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
    const daysToCount = isCurrentMonth ? now.getDate() : daysInMonth;

    const allCompletedDatesSet = new Set();
    habits.forEach(h => {
      (h.completedDates || []).forEach(d => {
        allCompletedDatesSet.add(`${h.id}-${new Date(d).toDateString()}`);
      });
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toDateString();

      let completedToday = 0;
      habits.forEach(h => {
        if (allCompletedDatesSet.has(`${h.id}-${dateString}`)) {
          completedToday++;
        }
      });

      const totalHabits = habits.length;
      const percentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

      // We only add to chartData up to current day if it's the current month, or maybe all days
      // Let's add all days so the chart x-axis covers the whole month. If future, percentage is null.
      const isFuture = isCurrentMonth && day > now.getDate();

      data.push({
        day,
        date: dateString,
        percentage: isFuture ? null : percentage,
        displayDate: `${day} ${monthNames[currentMonth].substring(0, 3)}`
      });

      if (!isFuture) {
        monthCompletions += completedToday;
        totalPossible += totalHabits;
      }
    }

    // Calculate streak of "majority completion" (>= 50%)
    let currentStreakCalc = 0;
    let datePointer = new Date(); // Start from today
    while (true) {
      const pStr = datePointer.toDateString();
      let comp = 0;
      habits.forEach(h => {
        if (allCompletedDatesSet.has(`${h.id}-${pStr}`)) comp++;
      });
      const perc = habits.length > 0 ? (comp / habits.length) : 0;
      if (perc >= 0.5) {
        currentStreakCalc++;
        datePointer.setDate(datePointer.getDate() - 1);
      } else {
        // If today is not completed yet, we can check yesterday to not break the streak prematurely
        if (datePointer.toDateString() === new Date().toDateString() && currentStreakCalc === 0) {
          datePointer.setDate(datePointer.getDate() - 1);
          const yStr = datePointer.toDateString();
          let yComp = 0;
          habits.forEach(h => {
            if (allCompletedDatesSet.has(`${h.id}-${yStr}`)) yComp++;
          });
          const yPerc = habits.length > 0 ? (yComp / habits.length) : 0;
          if (yPerc >= 0.5) {
            currentStreakCalc++;
            datePointer.setDate(datePointer.getDate() - 1);
            continue; // Continue streak from yesterday
          }
        }
        break;
      }
    }

    const mScore = totalPossible > 0 ? Math.round((monthCompletions / totalPossible) * 100) : 0;

    const habitProgressData = habits.map(h => {
      let compCount = 0;
      for (let day = 1; day <= daysToCount; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (allCompletedDatesSet.has(`${h.id}-${date.toDateString()}`)) {
          compCount++;
        }
      }
      return {
        ...h,
        percentage: daysToCount > 0 ? Math.round((compCount / daysToCount) * 100) : 0
      };
    });

    return {
      chartData: data,
      monthlyScore: mScore,
      currentStreak: currentStreakCalc,
      totalCompletions: allCompletedDatesSet.size,
      habitProgressData
    };
  }, [currentMonth, currentYear, habits]);

  const timeHabits = useMemo(() => {
    return habits.filter(h => h.requiresTime && Object.keys(h.timeRecords || {}).length > 0);
  }, [habits]);

  const [selectedTimeHabitIndex, setSelectedTimeHabitIndex] = useState(0);

  useEffect(() => {
    if (timeHabits.length > 0 && selectedTimeHabitIndex >= timeHabits.length) {
      setSelectedTimeHabitIndex(0);
    }
  }, [timeHabits, selectedTimeHabitIndex]);

  const selectedTimeHabit = timeHabits[selectedTimeHabitIndex] || null;

  const handlePrevTimeHabit = () => {
    setSelectedTimeHabitIndex(prev => prev > 0 ? prev - 1 : timeHabits.length - 1);
  };

  const handleNextTimeHabit = () => {
    setSelectedTimeHabitIndex(prev => prev < timeHabits.length - 1 ? prev + 1 : 0);
  };

  const timeHabitChartData = useMemo(() => {
    if (!selectedTimeHabit) return [];
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toDateString();
      const timeSpent = selectedTimeHabit.timeRecords?.[dateString] || 0;
      
      const isFuture = isCurrentMonth && day > now.getDate();
      
      data.push({
        day,
        date: dateString,
        minutes: isFuture ? null : timeSpent,
        displayDate: `${day} ${monthNames[currentMonth].substring(0, 3)}`
      });
    }
    return data;
  }, [selectedTimeHabit, currentYear, currentMonth]);

  const now = new Date();
  const isNextDisabled = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  // Custom Tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] p-3 rounded-xl shadow-lg border border-[var(--text-muted)]/10 text-sm">
          <p className="font-semibold text-[var(--text-main)] mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-[var(--color-accent-rose)] font-medium">Score: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTimeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const mins = payload[0].value;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      const timeStr = hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;

      return (
        <div className="bg-[var(--bg-surface)] p-3 rounded-xl shadow-lg border border-[var(--text-muted)]/10 text-sm">
          <p className="font-semibold text-[var(--text-main)] mb-1">{payload[0].payload.displayDate}</p>
          <p className="font-medium" style={{ color: selectedTimeHabit?.color || 'var(--color-accent-blue)' }}>
            Time: {timeStr}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-[var(--bg-surface)] rounded-full px-4 py-2 shadow-sm border border-[var(--text-muted)]/10">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-[var(--text-muted)]/10 rounded-full transition-colors text-[var(--text-main)]"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-lg">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-2 rounded-full transition-colors ${isNextDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--text-muted)]/10 text-[var(--text-main)]'}`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Overview Section */}
      <section className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10">
        <h2 className="text-xl font-semibold mb-6 text-[var(--color-accent-rose)]">Overview</h2>

        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
          {/* Circular Progress */}
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-[var(--text-muted)]/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Progress Circle */}
              <path
                className="text-[var(--color-accent-rose)] transition-all duration-1000 ease-out"
                strokeDasharray={`${monthlyScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{monthlyScore}%</span>
            </div>
          </div>

          <div className="flex flex-1 justify-around text-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-rose)] font-semibold text-lg">{monthlyScore}%</span>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider mt-1">Score</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-rose)] font-semibold text-lg flex items-center"><Flame size={16} className="mr-1" />{currentStreak}</span>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider mt-1">Streak</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-rose)] font-semibold text-lg">{totalCompletions}</span>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider mt-1">Total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-accent-rose)]">Score</h2>
          <span className="text-sm text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1 rounded-full">Month</span>
        </div>

        <div className="h-64 w-[calc(100%+1rem)] -ml-4">
          {showChart ? (
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--text-muted)" opacity={0.1} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Only show some ticks to avoid clutter
                    if (value === 1 || value % 7 === 0 || value === chartData.length) return value;
                    return '';
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--color-accent-rose)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-accent-rose)', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--color-accent-rose)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] animate-pulse">
              Loading graph...
            </div>
          )}
        </div>
      </section>

      {/* Visual Representation Section */}
      <section className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10">
        <h2 className="text-xl font-semibold mb-6 text-[var(--color-accent-rose)]">Visual Representation</h2>
        
        {showChart ? (
          <div className="flex flex-col gap-4">
            {habitProgressData.map((habit, index) => {
              const Icon = habit.icon;
              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <div className="relative group">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm z-10 relative transition-transform group-hover:scale-105"
                      style={{ backgroundColor: habit.color, color: '#1e1e24' }}
                    >
                      {Icon && <Icon size={24} />}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -top-10 -translate-x-1/2 bg-[#1e1e24] text-white dark:bg-white dark:text-[#1e1e24] text-xs font-semibold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-md">
                      {habit.name}
                      {/* Triangle pointer */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e1e24] dark:border-t-white"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-[var(--bg-main)] h-5 rounded-full overflow-hidden relative shadow-inner border border-[var(--text-muted)]/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${habit.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-[var(--text-muted)]">
                    {habit.percentage}%
                  </div>
                </div>
              );
            })}
            {habitProgressData.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No habits to show.</p>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)]"></div>
                <div className="flex-1 bg-[var(--bg-main)] h-5 rounded-full"></div>
                <div className="w-12 h-5 bg-[var(--bg-main)] rounded-full"></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Time Spent Section */}
      {timeHabits.length > 0 && (
        <section className="bg-[var(--bg-surface)] rounded-3xl p-5 shadow-sm border border-[var(--text-muted)]/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-accent-rose)]">Time Spent</h2>
            
            <div className="flex items-center gap-3 bg-[var(--bg-main)] rounded-full p-1 border border-[var(--text-muted)]/5">
              <button 
                onClick={handlePrevTimeHabit}
                className="p-1.5 hover:bg-[var(--text-muted)]/10 rounded-full transition-colors text-[var(--text-main)]"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2 px-2 min-w-[100px] justify-center">
                {selectedTimeHabit && selectedTimeHabit.icon && React.createElement(selectedTimeHabit.icon, { size: 16, style: { color: selectedTimeHabit.color } })}
                <span className="text-sm font-medium truncate max-w-[80px]">{selectedTimeHabit?.name}</span>
              </div>

              <button 
                onClick={handleNextTimeHabit}
                className="p-1.5 hover:bg-[var(--text-muted)]/10 rounded-full transition-colors text-[var(--text-main)]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="h-64 w-[calc(100%+1rem)] -ml-4">
            {showChart && selectedTimeHabit ? (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={timeHabitChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--text-muted)" opacity={0.1} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value === 1 || value % 7 === 0 || value === timeHabitChartData.length) return value;
                      return '';
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      return value >= 60 ? `${Math.floor(value/60)}h` : `${value}m`;
                    }}
                  />
                  <Tooltip content={<CustomTimeTooltip />} cursor={{ fill: 'var(--text-muted)', opacity: 0.1 }} />
                  <Bar 
                    dataKey="minutes" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  >
                    {timeHabitChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={selectedTimeHabit.color || 'var(--color-accent-blue)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] animate-pulse">
                Loading graph...
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
