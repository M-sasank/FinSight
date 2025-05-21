import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Ensure your App.css is linked

// --- Main App Component ---
function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'chat', 'insights'
  const [currentTheme, setCurrentTheme] = useState('newtimer'); // 'newtimer' or 'veteran'

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // Common header for the application
  const renderHeader = () => (
    <header className={`App-header app-theme-${currentTheme}`}>
      <h1>FinSight</h1>
      {/* Global theme toggle could go here if needed outside chat, or keep it page-specific */}
    </header>
  );

  // Apply theme class to the body for global overrides if necessary
  useEffect(() => {
    document.body.className = `app-theme-${currentTheme}`; // Apply theme to body
    // Add page-specific class to body for more targeted global overrides if needed
    document.body.classList.add(`page-${currentPage}`);
    return () => {
      document.body.className = ''; // Clean up on component unmount
      document.body.classList.remove(`page-${currentPage}`);
    };
  }, [currentTheme, currentPage]);

  return (
    <div className={`App app-theme-${currentTheme}`}> {/* Apply theme to the main App div */}
      {renderHeader()}
      <main className="App-main-content">
        {currentPage === 'landing' && <LandingPage navigateTo={navigateTo} currentTheme={currentTheme} />}
        {currentPage === 'chat' && <ChatPage navigateTo={navigateTo} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />}
        {currentPage === 'insights' && <InsightsPage navigateTo={navigateTo} currentTheme={currentTheme} />}
      </main>
    </div>
  );
}

// --- Landing Page Component ---
function LandingPage({ navigateTo, currentTheme }) {
  return (
    <div className={`landing-page page-theme-${currentTheme}`}> {/* Theme class for page-specific styles */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">FinSight: Your Intelligent Personal Finance Advisor</h2>
          <p className="hero-subtitle">
            Navigate your financial future with clarity. FinSight leverages cutting-edge AI, powered by the Sonar API,
            to provide real-time, reasoning-backed analysis and recommendations. Understand the 'why' behind your finances.
          </p>
          <div className="hero-cta-buttons">
            <button onClick={() => navigateTo('chat')} className="cta-button primary">
              Chat with FinSight
            </button>
            <button onClick={() => navigateTo('insights')} className="cta-button secondary">
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
            <span className="feature-icon">📊</span> {/* Replace with actual icons later */}
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

// --- Chat Page Component ---
function ChatPage({ navigateTo, currentTheme, setCurrentTheme }) {
  const initialChatMessages = () => [ // Function to get initial messages
    {
      id: 'chatmsg-initial-1',
      text: `Welcome to FinSight Chat! You are currently in "${currentTheme}" mode. I'm ready to help with stock analysis, market news, and sentiment. How can I assist you today?`,
      sender: 'bot',
      type: 'greeting'
    }
  ];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialChatMessages());
    setInput('');
  }, [currentTheme]); // Refreshes messages if theme changes AND on initial mount for the current theme

  const suggestionPrompts = [
    { text: "Analyze MSFT stock", query: "Tell me about Microsoft (MSFT) stock" },
    { text: "Today's top financial news", query: "What's today's top financial news?" },
    { text: "Is the market bullish or bearish?", query: "Is the market bullish or bearish currently?" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processAndAddMessage = (text, sender) => {
    const newMessage = {
      id: `chatmsg-${Date.now()}`,
      text: text,
      sender: sender,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    if (sender === 'user') {
      console.log(`Sending to backend: Query: "${text}", Profile: "${currentTheme}"`);
      // --- POINT FOR INTEGRATION ---
      setTimeout(() => {
        let botText = `Okay, processing your request for: "${text}". `;
        if (currentTheme === 'newtimer') {
          botText += "(Providing a simplified explanation, tailored for new investors!)";
        } else { // veteran
          botText += "(Providing a standard, detailed explanation for experienced users.)";
        }
        const botResponse = {
            id: `chatmsg-${Date.now()+1}`,
            sender: 'bot',
            text: botText
        };
        setMessages(prev => [...prev, botResponse]);
      }, 800);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      processAndAddMessage(input, 'user');
      setInput('');
    }
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
    document.querySelector('.chat-input input').focus();
  };

  const renderMessageContent = (message) => {
    if (message.type === 'insight-card') {
      return (
        <div className="insight-card">
          {message.title && <h3>{message.title}</h3>}
          {message.content && message.content.map((item, idx) => (
            <p key={`${message.id}-detail-${idx}`}><strong>{item.label}:</strong> {item.value}</p>
          ))}
          {message.chart && (
            <div className="chart-placeholder">
              Chart/Visualization Area
            </div>
          )}
        </div>
      );
    }
    return message.text;
  };

  return (
    <div className={`chat-page-container page-theme-${currentTheme}`}> {/* Theme class for page-specific styles */}
        <div className="chat-page-header">
            <button onClick={() => navigateTo('landing')} className="chat-nav-button home-button">
                <span role="img" aria-label="Home">🏠</span> Go to Home Page
            </button>
            <div className="profile-selector">
                <span className="selector-label">User Profile:</span>
                <div className="profile-buttons-group">
                    <button
                        onClick={() => setCurrentTheme('newtimer')}
                        className={`profile-button ${currentTheme === 'newtimer' ? 'active' : ''}`}
                    >
                        Newtimer
                    </button>
                    <button
                        onClick={() => setCurrentTheme('veteran')}
                        className={`profile-button ${currentTheme === 'veteran' ? 'active' : ''}`}
                    >
                        Veteran
                    </button>
                </div>
            </div>
        </div>
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                    {renderMessageContent(message)}
                </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
                <div className="suggestion-area">
                <p className="suggestion-area-title">Try asking:</p>
                <div className="suggestion-chips-container">
                    {suggestionPrompts.map((prompt, index) => (
                    <button
                        key={index}
                        className="suggestion-chip"
                        onClick={() => handleSuggestionClick(prompt.query)}
                    >
                        {prompt.text}
                    </button>
                    ))}
                </div>
                </div>
            )}

            <div className="chat-input">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask FinSight..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    </div>
  );
}

// --- Insights Page Component (Placeholder) ---
function InsightsPage({ navigateTo, currentTheme }) {
  return (
    <div className={`insights-page page-theme-${currentTheme}`}> {/* Theme class for page-specific styles */}
      <div className="insights-header">
        <h2>Your Financial Insights Dashboard</h2>
        <button onClick={() => navigateTo('landing')} className="back-to-landing-button small">
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
