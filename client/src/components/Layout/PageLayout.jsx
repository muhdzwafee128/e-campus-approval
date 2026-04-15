import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageLayout({ children }) {
    return (
        <>
            <Navbar />
            <Sidebar />
            <main className="main">
                {children}
            </main>
        </>
    );
}
