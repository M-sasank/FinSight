import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'; // Ensure your App.css is linked
import ChatPage from './pages/ChatPage';
import NavBar from './components/NavBar';

// --- Main App Component ---
function App() {
  const [currentTheme, setCurrentTheme] = useState('newtimer'); // 'newtimer' or 'veteran'

  // Common header for the application
  const renderHeader = () => (
    <header className={`App-header app-theme-${currentTheme}`}>
      <h1>FinSight</h1>
    </header>
  );

  // Apply theme class to the body for global overrides if necessary
  useEffect(() => {
    document.body.className = `app-theme-${currentTheme}`; // Apply theme to body
    return () => {
      document.body.className = ''; // Clean up on component unmount
    };
  }, [currentTheme]);

  return (
    <Router>
      <div className={`App app-theme-${currentTheme}`}>
        <NavBar />
        <main className="App-main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// --- Landing Page Component ---
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">FinSight: Your Intelligent Personal Finance Advisor</h2>
          <p className="hero-subtitle">
            Navigate your financial future with clarity. FinSight leverages cutting-edge AI, powered by the Sonar API,
            to provide real-time, reasoning-backed analysis and recommendations. Understand the 'why' behind your finances.
          </p>
          <div className="hero-cta-buttons">
            <button onClick={() => navigate('/chat')} className="cta-button primary">
              Chat with FinSight
            </button>
            <button onClick={() => navigate('/insights')} className="cta-button secondary">
              Explore Insights
            </button>
          </div>
        </div>
        <div className="hero-visual">
          {/* Placeholder for a visual element */}
          <div className="visual-placeholder"></div>
        </div>
      </section>

      <section className="features-overview-section">
        <h3 className="section-title">Unlock Your Financial Potential</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <h4>Real-time Stock Analysis</h4>
            <p>In-depth analysis with Sonar Deep Research, understanding key drivers and cited sources.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📰</span>
            <h4>Curated Financial News</h4>
            <p>Understand the "why" behind news with Sonar's reasoning on potential investment impacts.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📈</span>
            <h4>Market Sentiment Analysis</h4>
            <p>Gauge market mood using Sonar's analysis of news, social media, and more.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Insights Page Component ---
function InsightsPage() {
  const navigate = useNavigate();

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h2>Your Financial Insights Dashboard</h2>
        <button onClick={() => navigate('/')} className="back-to-landing-button small">
            ← Back to Home
        </button>
      </div>
      <div className="insights-content">
        <p>This section will provide a visual overview of your portfolio, budget allocations, spending trends, and more.</p>
        <div className="placeholder-grid">
            <div className="placeholder-card">Portfolio Performance Chart</div>
            <div className="placeholder-card">Budget Allocation Donut</div>
            <div className="placeholder-card">Spending Trends Line Graph</div>
            <div className="placeholder-card">Key Metric: Savings Rate</div>
        </div>
      </div>
    </div>
  );
}

// --- News Page Component ---
function NewsPage() {
  return (
    <div className="news-page">
      <div className="news-header">
        <h2>Financial News</h2>
      </div>
      <div className="news-content">
        <p>News content coming soon...</p>
      </div>
    </div>
  );
}

export default App;
