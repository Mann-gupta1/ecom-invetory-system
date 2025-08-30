import React from 'react';
import Inventory from './components/inventory';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Inventory Management System</h1>
      <Inventory />
    </div>
  );
}

export default App;