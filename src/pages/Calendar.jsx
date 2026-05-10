export default function Calendar() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mb-4 shadow-sm border border-[var(--text-muted)]/10">
        <span className="text-2xl opacity-50">📅</span>
      </div>
      <h2 className="text-xl font-medium mb-2">Calendar View</h2>
      <p className="text-[var(--text-muted)] text-sm max-w-xs">
        Your upcoming events and past habit streaks will appear here.
      </p>
    </div>
  );
}
