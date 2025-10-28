import React from 'react';
import HeaderLayout from './HeaderLayout';
import FooterLayout from './FooterLayout';
import ChatWidget from '../components/ChatWidget';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLayout />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      <FooterLayout />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
