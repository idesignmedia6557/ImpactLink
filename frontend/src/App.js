import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Hero from './components/Hero/Hero';
import ProjectGrid from './components/ProjectGrid/ProjectGrid';
import HowItWorks from './components/HowItWorks/HowItWorks';
import Home from './pages/Home';
import Discover from './pages/Discover';
import CharityProfile from './pages/CharityProfile';
import Donate from './pages/Donate';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/charity/:id" element={<CharityProfile />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
