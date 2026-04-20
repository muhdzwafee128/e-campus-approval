import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home, FileText, FilePlus, Settings,
    Clock, CheckCircle, History
} from 'lucide-react';

const studentNav = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/requests', icon: FileText, label: 'My Requests' },
    { to: '/new-request', icon: FilePlus, label: 'New Request' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const authorityNav = [
    { to: '/authority/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/authority/queue', icon: Clock, label: 'Pending Queue' },
    { to: '/authority/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();
    const navItems = user?.role === 'student' ? studentNav : authorityNav;

    const deptOrRole = user?.role === 'student'
        ? `${user?.department || ''} · Yr ${user?.yearOfStudy || ''}`
        : user?.role === 'tutor' && user?.department
            ? `${user.department}${user.assignedYear ? ` · Year ${user.assignedYear}` : ''}`
            : formatRole(user?.role);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-user">
                <div className="sidebar-caption">Logged in as</div>
                <div className="sidebar-name">{user?.name}</div>
                <div className="sidebar-dept">{deptOrRole}</div>
                {user?.role === 'faculty_coordinator' && user?.assignedClubs?.length > 0 && (
                    <div className="sidebar-clubs" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {user.assignedClubs.join(', ')}
                    </div>
                )}
            </div>
            <nav className="sidebar-nav">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={16} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

function formatRole(role) {
    const map = {
        tutor: 'Class Tutor',
        faculty_coordinator: 'Faculty Coordinator',
        hod: 'Head of Department',
        principal: 'Principal',
    };
    return map[role] || role;
}
