import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StarMap3D from './components/StarMap';
import StarTable from './components/StarTable';

const App = () => {
  return (
    <Router>
      <div style={{ padding: '10px', backgroundColor: '#1e3a8a', color: 'white' }}>
        {/* Navigation */}
        <nav>
          <Link to="/" style={{ marginRight: '20px', color: 'white' }}>Visualisation 3D</Link>
          <Link to="/table" style={{ color: 'white' }}>Tableau des Étoiles</Link>
        </nav>
      </div>

      {/* Définir les Routes */}
      <Routes>
        <Route path="/" element={<StarMap3D />} />
        <Route path="/table" element={<StarTable />} />
      </Routes>
    </Router>
  );
};

export default App;
