
import React, { useState } from 'react';
import { User } from '../../types';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface LayoutProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, currentPage, setCurrentPage, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar 
                user={user} 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 pb-20 lg:pb-6">
                    {children}
                </main>
                <BottomNav user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </div>
    );
};

export default Layout;