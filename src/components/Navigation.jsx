import { Home, Activity, User } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  
  const tabs = [
    { id: '/', icon: Home, label: 'Home' },
    { id: '/analytics', icon: Activity, label: 'Analytics' },
    { id: '/profile', icon: User, label: 'You' }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
      <nav className="bg-[var(--bg-surface)] p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--text-muted)]/10 flex gap-2 pointer-events-auto items-center">
        <LayoutGroup>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.id || (tab.id === '/' && location.pathname === '/manage-habits');

            return (
              <Link
                key={tab.id}
                to={tab.id}
                className={`relative flex items-center justify-center w-12 h-10 sm:w-14 sm:h-12 rounded-full transition-colors duration-300 ${
                  isActive ? 'text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-[var(--text-main)] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2.5 : 2} />
                </span>
              </Link>
            );
          })}
        </LayoutGroup>
      </nav>
    </div>
  );
}
