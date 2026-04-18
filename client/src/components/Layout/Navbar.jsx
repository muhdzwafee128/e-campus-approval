import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { FileText, LogOut, Menu } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Menu 
                    size={24} 
                    className="mobile-menu-btn" 
                    onClick={onMenuClick}
                    style={{ marginRight: 12 }}
                />
                <div className="navbar-brand-icon" style={{
                    width: 36, height: 36, background: 'rgba(255,255,255,0.15)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <FileText size={18} color="white" />
                </div>
                <div>
                    <div className="navbar-brand-name">E-Campus Approval</div>
                    <div className="navbar-brand-sub">College of Engineering, Thalassery</div>
                </div>
            </div>

            <div className="navbar-right">

                <div style={{ textAlign: 'right' }}>
                    <div className="navbar-user-name">{user?.name}</div>
                    <div className="navbar-role">{formatRole(user?.role)}</div>
                </div>
                <div className="avatar">{initials}</div>
                <LogOut
                    size={18}
                    color="rgba(255,255,255,0.7)"
                    style={{ cursor: 'pointer' }}
                    onClick={handleLogout}
                />
            </div>
        </nav>
    );
}

function formatRole(role) {
    const map = {
        student: 'Student',
        tutor: 'Class Tutor',
        nodal_officer: 'Nodal Officer',
        faculty_coordinator: 'Faculty Coordinator',
        hod: 'Head of Department',
        principal: 'Principal',
    };
    return map[role] || role;
}
