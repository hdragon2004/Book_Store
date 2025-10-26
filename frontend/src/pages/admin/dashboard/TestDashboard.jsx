import React from 'react';

const TestDashboard = () => {
  console.log('🔍 TestDashboard: Component is rendering');
  
  return (
    <div className="p-6 bg-red-100 border-4 border-red-500">
      <h1 className="text-3xl font-bold text-red-600">TEST DASHBOARD - Component này hoạt động!</h1>
      <p className="text-xl text-red-800">Nếu thấy text này thì admin routing hoạt động đúng</p>
      <div className="mt-4 p-4 bg-yellow-100 rounded border-2 border-yellow-500">
        <p className="text-sm text-yellow-800">Đây là test component cho admin dashboard</p>
        <p className="text-xs text-yellow-600">Timestamp: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default TestDashboard;
