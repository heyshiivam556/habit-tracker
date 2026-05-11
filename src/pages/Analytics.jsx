import React, { useState, useMemo, useEffect } from 'react';
import { useHabits } from '../hooks/useHabits';
import { ChevronLeft, ChevronRight, Activity, TrendingUp, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

  const { chartData, monthlyScore, currentStreak, totalCompletions } = useMemo(() => {
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

    return {
      chartData: data,
      monthlyScore: mScore,
      currentStreak: currentStreakCalc,
      totalCompletions: allCompletedDatesSet.size // total over all time based on what's available
    };
  }, [currentMonth, currentYear, habits]);

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
    </div>
  );
}
