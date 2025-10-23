import React from 'react';

const PageLayout = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-8">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
