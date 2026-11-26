import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Semua rute langsung mengarah ke Dashboard, tanpa cek login */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
