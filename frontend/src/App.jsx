import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { BookStatusProvider } from './contexts/BookStatusContext';
import './index.css';

function App() {
  
  return (
    <div className="App">
      <AuthProvider>
        <BookStatusProvider>
          <AppRoutes />
        </BookStatusProvider>
      </AuthProvider>
    </div>
  );
}

export default App;