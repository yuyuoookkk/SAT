import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormWizard from './pages/FormWizard';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tracer-form" element={<FormWizard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
