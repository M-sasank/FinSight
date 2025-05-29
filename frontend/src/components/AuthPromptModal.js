import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPromptModal.css';

function AuthPromptModal({ isOpen, onClose, featureName }) {
  if (!isOpen) return null;

  return (
    <div className="auth-prompt-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-prompt-header">
          <h2>Login Required</h2>
          <button className="auth-prompt-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="auth-prompt-content">
          <div className="auth-prompt-icon">
            🔒
          </div>
          <p>
            You need to be logged in to access <strong>{featureName}</strong>.
          </p>
          <p className="auth-prompt-subtitle">
            Sign in to unlock all features and start your financial journey with FinSight.
          </p>
        </div>
        
        <div className="auth-prompt-actions">
          <Link to="/login" className="auth-prompt-login-btn" onClick={onClose}>
            Login
          </Link>
          <Link to="/register" className="auth-prompt-register-btn" onClick={onClose}>
            Create Account
          </Link>
          <button className="auth-prompt-cancel-btn" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPromptModal; 