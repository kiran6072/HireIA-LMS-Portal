import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileQuestion,
  Award,
  Briefcase,
  Bell,
  Settings,
  GraduationCap,
  BarChart3,
  LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/tests', label: 'Tests', icon: FileQuestion },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/placements', label: 'Placements', icon: Briefcase },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const studentNav: NavItem[] = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/tests', label: 'Tests', icon: FileQuestion },
  { to: '/student/certificates', label: 'Certificates', icon: Award },
  { to: '/student/placements', label: 'Placements', icon: Briefcase },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar({ role, isOpen }: { role: Role; isOpen: boolean }) {
  const nav = role === 'admin' ? adminNav : studentNav;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-primary-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-display text-lg font-bold leading-none text-white">HireIA</p>
          <p className="text-[11px] font-medium tracking-wide text-primary-300">LEARNING SYSTEM</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('dashboard')}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-primary-200 hover:bg-primary-700/60 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {role === 'admin' && (
        <div className="mx-3 mb-4 rounded-xl bg-primary-700/50 p-3.5">
          <div className="flex items-center gap-2 text-secondary-300">
            <BarChart3 size={16} />
            <span className="text-xs font-semibold">Placement Rate</span>
          </div>
          <p className="mt-1 text-xs text-primary-200">Check the Placements tab for live metrics.</p>
        </div>
      )}
    </aside>
  );
}