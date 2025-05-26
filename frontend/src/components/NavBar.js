import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function NavBar({ currentTheme }) {
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
            <span>Home</span>
          </Link>
          <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
            <span>Chat</span>
          </Link>
          <Link to="/news" className={`nav-item ${isActive('/news') ? 'active' : ''}`}>
            <span>News</span>
          </Link>
          <Link to="/tracker" className={`nav-item ${isActive('/tracker') ? 'active' : ''}`}>
            <span>Tracker</span>
          </Link>
          <Link to="/guide" className={`nav-item ${isActive('/guide') ? 'active' : ''}`}>
            <span>Guide</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;