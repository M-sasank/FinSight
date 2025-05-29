import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from './AuthPromptModal';

function NavBar({ currentTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState('');
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

  const handleProtectedNavigation = (path, featureName, event) => {
    if (!token) {
      event.preventDefault();
      setRequestedFeature(featureName);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setRequestedFeature('');
  };

  return (
    <>
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
            <Link 
              to="/chat" 
              className={`nav-item ${isActive('/chat') ? 'active' : ''}`}
              onClick={(e) => handleProtectedNavigation('/chat', 'Chat', e)}
            >
              <span>Chat</span>
            </Link>
            <Link 
              to="/news" 
              className={`nav-item ${isActive('/news') ? 'active' : ''}`}
              onClick={(e) => handleProtectedNavigation('/news', 'News', e)}
            >
              <span>News</span>
            </Link>
            <Link 
              to="/tracker" 
              className={`nav-item ${isActive('/tracker') ? 'active' : ''}`}
              onClick={(e) => handleProtectedNavigation('/tracker', 'Portfolio Tracker', e)}
            >
              <span>Tracker</span>
            </Link>
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
      
      <AuthPromptModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        featureName={requestedFeature}
      />
    </>
  );
}

export default NavBar;