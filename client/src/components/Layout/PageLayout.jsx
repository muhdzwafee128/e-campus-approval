import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
            <div 
                className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
            <main className="main">
                {children}
            </main>
        </>
    );
}
