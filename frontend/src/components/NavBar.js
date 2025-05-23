import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiBarChart2, FiTrendingUp, FiSun, FiMoon, FiHelpCircle } from 'react-icons/fi';

function NavBar({ currentTheme, setCurrentTheme }) {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'newtimer' ? 'veteran' : 'newtimer');
  };

  return (
    <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-content">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">
            FinSight
          </Link>
        </div>
        
        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <FiHome className="nav-icon" />
            <span>Home</span>
          </Link>
          <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
            <FiMessageSquare className="nav-icon" />
            <span>Chat</span>
          </Link>
          <Link to="/tracker" className={`nav-item ${isActive('/tracker') ? 'active' : ''}`}>
            <FiTrendingUp className="nav-icon" />
            <span>Tracker</span>
          </Link>
          <Link to="/insights" className={`nav-item ${isActive('/insights') ? 'active' : ''}`}>
            <FiBarChart2 className="nav-icon" />
            <span>Insights</span>
          </Link>
          <Link to="/guide" className={`nav-item ${isActive('/guide') ? 'active' : ''}`}>
            <FiHelpCircle className="nav-icon" />
            <span>Guide</span>
          </Link>
        </div>

        <div className="nav-actions">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${currentTheme === 'newtimer' ? 'Veteran' : 'Newtimer'} mode`}
          >
            {currentTheme === 'newtimer' ? <FiMoon /> : <FiSun />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;