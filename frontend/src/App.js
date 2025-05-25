import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'; // Ensure your App.css is linked
import ChatPage from './pages/ChatPage';
import NavBar from './components/NavBar';
import TrackerPage from './pages/TrackerPage';
import AssetChatPage from './pages/AssetChatPage';
import NewsPage from './pages/NewsPage';
import GuidePage from './pages/GuidePage';


function App() {
  const [currentTheme, setCurrentTheme] = useState('newtimer'); 


  useEffect(() => {
    document.body.className = `app-theme-${currentTheme}`; 
    return () => {
      document.body.className = ''; 
    };
  }, [currentTheme]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={`App app-theme-${currentTheme}`}>
        <NavBar currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
        <main className="App-main-content">
          <Routes>
            <Route path="/" element={<LandingPage currentTheme={currentTheme} />} />
            <Route path="/chat" element={<ChatPage currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />} />
            <Route path="/news" element={<NewsPage currentTheme={currentTheme} />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/tracker" element={<TrackerPage currentTheme={currentTheme} />} />
            <Route path="/asset-chat/:symbol" element={<AssetChatPage currentTheme={currentTheme} />} />
            <Route path="/guide" element={<GuidePage currentTheme={currentTheme} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}


function LandingPage({ currentTheme }) {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);
  
  const features = [
    {
      title: "Intelligent Chat Assistance",
      subtitle: "Your AI-Powered Financial Guide",
      image: "/images/chat-assistant.svg",
      description: "Get personalized financial guidance with our advanced AI chat assistant. Whether you're new to investing or a seasoned trader, our chat assistant adapts to your needs and provides tailored insights.",
      modes: [
        {
          title: "Newtimer Mode",
          description: "Perfect for beginners. Get clear, simple explanations about stocks, market trends, and investment basics. Learn at your own pace with easy-to-understand insights."
        },
        {
          title: "Veteran Mode",
          description: "For experienced investors. Access in-depth analysis, technical indicators, and sophisticated market insights. Dive deep into complex financial concepts and strategies."
        }
      ],
      cta: "Start Chatting",
      action: () => navigate('/chat')
    },
    {
      title: "Stay Ahead: Market Trends & News",
      subtitle: "Real-Time Market Intelligence",
      image: "/images/market-trends.svg",
      description: "Stay informed with comprehensive market insights and real-time updates. Our platform aggregates the latest market trends, news, and analysis to help you make informed decisions.",
      features: [
        "Real-time market trends and analysis",
        "Latest financial news and updates",
        "Market sentiment indicators",
        "Impact analysis on your portfolio"
      ],
      cta: "Explore Market Trends",
      action: () => navigate('/news')
    },
    {
      title: "Precision Stock Tracking",
      subtitle: "Track, Analyze, and Act",
      image: "/images/stock-tracking.svg",
      description: "Monitor your favorite stocks with precision and get AI-powered insights. Our advanced tracking system provides detailed analytics and real-time updates to help you stay on top of your investments.",
      features: [
        "Real-time stock price tracking",
        "Interactive performance charts",
        "Key metrics and historical data",
        "AI-powered analysis and insights"
      ],
      cta: "Track Stocks Now",
      action: () => navigate('/tracker')
    }
  ];

  const nextCard = useCallback(() => {
    if (isSliding) return;
    setIsSliding(true);
    setActiveCard((prev) => (prev + 1) % features.length);
    setTimeout(() => setIsSliding(false), 600);
  }, [features.length, isSliding]);

  const goToCard = useCallback((index) => {
    if (isSliding || index === activeCard) return;
    setIsSliding(true);
    setActiveCard(index);
    setTimeout(() => setIsSliding(false), 600);
  }, [activeCard, isSliding]);

  // Auto-slide management
  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(nextCard, 3000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextCard, isHovered]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your AI-Powered Financial Companion</h1>
          <p className="hero-subtitle">
            FinSight combines cutting-edge AI with financial expertise to help you make smarter investment decisions. 
            Whether you're new to investing or a seasoned trader, get personalized insights and real-time market analysis.
          </p>
          <div className="hero-cta-buttons">
            <button onClick={() => navigate('/chat')} className="cta-button primary">
              Start Chatting
            </button>
            <button onClick={() => navigate('/tracker')} className="cta-button secondary">
              Track Stocks
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`features-section theme-${currentTheme}`}>
        <h2 className="section-title">Discover FinSight's Power</h2>
        <div className="features-grid"
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}>
          <div className="features-carousel">
            {features.map((feature, index) => {
              const cardClass = [
                'feature-card',
                index === activeCard ? 'active' : '',
                index === (activeCard - 1 + features.length) % features.length ? 'previous' : '',
                index === (activeCard + 1) % features.length ? 'next' : '',
                isSliding ? 'sliding' : ''
              ].filter(Boolean).join(' ');

              return (
                <div key={index} className={cardClass}>
                  <div className="feature-card-image">
                    <img src={feature.image} alt={feature.title} />
                  </div>
                  <div className="feature-card-content">
                    <div className="feature-card-header">
                      <h3 className="feature-card-title">{feature.title}</h3>
                      <p className="feature-card-subtitle">{feature.subtitle}</p>
                    </div>
                    <p className="feature-description">{feature.description}</p>
                    
                    {feature.modes ? (
                      <div className="feature-modes">
                        {feature.modes.map((mode, idx) => (
                          <div key={idx} className="mode-card">
                            <h4 className="mode-title">{mode.title}</h4>
                            <p className="mode-description">{mode.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : feature.features && (
                      <ul className="feature-list">
                        {feature.features.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                    
                    <button onClick={feature.action} className="feature-cta">
                      {feature.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Dots */}
          <div className="carousel-nav">
            {features.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === activeCard ? 'active' : ''}`}
                onClick={() => goToCard(index)}
                disabled={isSliding}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`how-it-works-section theme-${currentTheme}`}>
        <h2 className="section-title">How FinSight Works</h2>
        <div className="steps-grid">
          <div className={`step-card theme-${currentTheme}`}>
            <div className={`step-number theme-${currentTheme}`}>1</div>
            <h3>Choose Your Profile</h3>
            <p>Select between Newtimer or Veteran mode based on your experience level</p>
          </div>
          <div className={`step-card theme-${currentTheme}`}>
            <div className={`step-number theme-${currentTheme}`}>2</div>
            <h3>Ask Questions</h3>
            <p>Chat with our AI assistant about stocks, market trends, or investment strategies</p>
          </div>
          <div className={`step-card theme-${currentTheme}`}>
            <div className={`step-number theme-${currentTheme}`}>3</div>
            <h3>Track & Analyze</h3>
            <p>Monitor your favorite stocks and get AI-powered insights on their performance</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`cta-section theme-${currentTheme}`}>
        <h2>Ready to Transform Your Investment Journey?</h2>
        <p>Join thousands of investors who trust FinSight for smarter financial decisions</p>
        <button onClick={() => navigate('/chat')} className="cta-button primary large">
          Get Started Now
        </button>
      </section>
    </div>
  );
}


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

export default App;
