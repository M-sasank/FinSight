import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function NavBar({ currentTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { token, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
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
          {token && (
            <>
              <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
                <span>Chat</span>
              </Link>
              <Link to="/news" className={`nav-item ${isActive('/news') ? 'active' : ''}`}>
                <span>News</span>
              </Link>
              <Link to="/tracker" className={`nav-item ${isActive('/tracker') ? 'active' : ''}`}>
                <span>Tracker</span>
              </Link>
            </>
          )}
          <Link to="/guide" className={`nav-item ${isActive('/guide') ? 'active' : ''}`}>
            <span>Guide</span>
          </Link>
        </div>

        <div className="nav-auth-actions">
          {token ? (
            <button onClick={handleLogout} className="nav-item auth-button logout-button">
              <span>Logout</span>
            </button>
          ) : (
            <>
              <Link to="/login" className={`nav-item auth-button login-button ${isActive('/login') ? 'active' : ''}`}>
                <span>Login</span>
              </Link>
              {/* <Link to="/register" className={`nav-item auth-button register-button ${isActive('/register') ? 'active' : ''}`}>
                <span>Register</span>
              </Link> */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;