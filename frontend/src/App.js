import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import ChatPage from './pages/ChatPage';
import NavBar from './components/NavBar';
import TrackerPage from './pages/TrackerPage';
import AssetChatPage from './pages/AssetChatPage';
import NewsPage from './pages/NewsPage';
import GuidePage from './pages/GuidePage';
import HeroAnimation from './components/HeroAnimation';

// Import ALL animation components
import ChatAssistAnimation from './components/ChatAssistAnimation';
import MarketTrendsAnimation from './components/MarketTrendsAnimation'; // New
import StockTrackingAnimation from './components/StockTrackingAnimation'; // New

function App() {
  const currentTheme = 'veteran';

  useEffect(() => {
    document.body.className = `app-theme-${currentTheme}`;
    return () => {
      document.body.className = '';
    };
  }, [currentTheme]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={`App app-theme-${currentTheme}`}>
        <NavBar currentTheme={currentTheme} />
        <main className="App-main-content">
          <Routes>
            <Route path="/" element={<LandingPage currentTheme={currentTheme} />} />
            <Route path="/chat" element={<ChatPage currentTheme={currentTheme} />} />
            <Route path="/news" element={<NewsPage currentTheme={currentTheme} />} />
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
      id: "chat-assist",
      title: "Intelligent Chat Assistance",
      subtitle: "Your AI-Powered Financial Guide",
      animationKey: "chatAssist", // Identifier for animation
      description: "Get personalized financial guidance with our advanced AI chat assistant. Whether you're new to investing or a seasoned trader, our chat assistant adapts to your needs and provides tailored insights.",
      modes: [
        { title: "Newtimer Mode", description: "Perfect for beginners. Get clear, simple explanations about stocks, market trends, and investment basics. Learn at your own pace with easy-to-understand insights." },
        { title: "Veteran Mode", description: "For experienced investors. Access in-depth analysis, technical indicators, and sophisticated market insights. Dive deep into complex financial concepts and strategies." }
      ],
      cta: "Start Chatting",
      action: () => navigate('/chat')
    },
    {
      id: "market-trends",
      title: "Stay Ahead: Market Trends & News",
      subtitle: "Real-Time Market Intelligence",
      animationKey: "marketTrends", // Identifier for animation
      description: "Stay informed with comprehensive market insights and real-time updates. Our platform aggregates the latest market trends, news, and analysis to help you make informed decisions.",
      features: [ "Real-time market trends and analysis", "Latest financial news and updates", "Market sentiment indicators", "Impact analysis on your portfolio" ],
      cta: "Explore Market Trends",
      action: () => navigate('/news')
    },
    {
      id: "stock-tracking",
      title: "Precision Stock Tracking",
      subtitle: "Track, Analyze, and Act",
      animationKey: "stockTracking", // Identifier for animation
      description: "Monitor your favorite stocks with precision and get AI-powered insights. Our advanced tracking system provides detailed analytics and real-time updates to help you stay on top of your investments.",
      features: [ "Real-time stock price tracking", "Interactive performance charts", "Key metrics and historical data", "AI-powered analysis and insights" ],
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

  const renderFeatureAnimation = (animationKey) => {
    switch (animationKey) {
      case "chatAssist":
        return <ChatAssistAnimation />;
      case "marketTrends":
        return <MarketTrendsAnimation />;
      case "stockTracking":
        return <StockTrackingAnimation />;
      default:
        return null; // Or a placeholder image/icon
    }
  };

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Your AI-Powered Financial Companion</h1>
            <p className="hero-subtitle">
              FinSight combines cutting-edge AI with financial expertise to help you make smarter investment decisions.
              Whether you're new to investing or a seasoned trader, get personalized insights and real-time market analysis.
            </p>
            <div className="hero-cta-buttons">
              <button onClick={() => navigate('/chat')} className="cta-button primary">Start Chatting</button>
              <button onClick={() => navigate('/tracker')} className="cta-button secondary">Track Stocks</button>
            </div>
          </div>
          <div className="hero-visual">
            <HeroAnimation />
          </div>
        </div>
      </section>

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
                <div key={feature.id || index} className={cardClass}>
                  <div className="feature-card-image">
                    {/* MODIFIED TO RENDER ANIMATION */}
                    {renderFeatureAnimation(feature.animationKey)}
                    {/* If you had feature.image and wanted it as a fallback, you could do:
                        {feature.animationKey ? renderFeatureAnimation(feature.animationKey) : <img src={feature.image} alt={feature.title} />}
                    */}
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
                    <button onClick={feature.action} className="feature-cta">{feature.cta}</button>
                  </div>
                </div>
              );
            })}
          </div>
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

      <section className={`how-it-works-section theme-${currentTheme}`}>
        <h2 className="section-title">How FinSight Works</h2>
        <div className="steps-grid">
          <div className={`step-card theme-${currentTheme}`}><div className={`step-number theme-${currentTheme}`}>1</div><h3>Choose Your Profile</h3><p>Select between Newtimer or Veteran mode based on your experience level</p></div>
          <div className={`step-card theme-${currentTheme}`}><div className={`step-number theme-${currentTheme}`}>2</div><h3>Ask Questions</h3><p>Chat with our AI assistant about stocks, market trends, or investment strategies</p></div>
          <div className={`step-card theme-${currentTheme}`}><div className={`step-number theme-${currentTheme}`}>3</div><h3>Track & Analyze</h3><p>Monitor your favorite stocks and get AI-powered insights on their performance</p></div>
        </div>
      </section>

      <section className={`cta-section theme-${currentTheme}`}>
        <h2>Ready to Transform Your Investment Journey?</h2>
        <p>Join thousands of investors who trust FinSight for smarter financial decisions</p>
        <button onClick={() => navigate('/chat')} className="cta-button primary large">Get Started Now</button>
      </section>
    </div>
  );
}

export default App;