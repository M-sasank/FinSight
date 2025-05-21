import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function NavBar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav-bar">
      <div className="nav-content">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <span role="img" aria-label="Home">🏠</span> Home
        </Link>
        <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
          <span role="img" aria-label="Chat">💬</span> Chat
        </Link>
        <Link to="/news" className={`nav-item ${isActive('/news') ? 'active' : ''}`}>
          <span role="img" aria-label="News">📰</span> News
        </Link>
      </div>
    </nav>
  );
}

export default NavBar; 