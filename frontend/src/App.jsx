import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { BookStatusProvider } from './contexts/BookStatusContext';
import './index.css';

function App() {
  
  return (
    <div className="App">
      <BookStatusProvider>
        <AppRoutes />
      </BookStatusProvider>
    </div>
  );
}

export default App;