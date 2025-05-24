import React, { useState, useRef, useEffect } from 'react';
import '../styles/GuidePage.css';

function GuidePage({ currentTheme }) {
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'chatmsg-initial-1',
      text: "Welcome to the Guide Chat! I'm here to help you understand investing basics. What would you like to know?",
      sender: 'bot',
      type: 'greeting'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionPrompts = [
    { text: "What is a stock?", query: "Can you explain what a stock is?" },
    { text: "How to start investing?", query: "How can I start investing as a beginner?" },
    { text: "Investment strategies", query: "What are some basic investment strategies?" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleSendMessage = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = {
        id: `chatmsg-${Date.now()}`,
        text: input,
        sender: 'user',
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:8000/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'guide',
            user_query: input,
            country: selectedCountry
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        
        const botResponse = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: data.response.data.choices[0].message.content
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: 'Sorry, I encountered an error while processing your request. Please try again.'
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
    document.querySelector('.chat-input input').focus();
  };

  return (
    <div className={`guide-page theme-${currentTheme}`}>
      <div className="country-selector-container">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="country-dropdown"
        >
          <option value="IN">India</option>
        </select>
        <span className="tooltip-icon-container">
          <span className="tooltip-icon">?</span>
          <span className="tooltip-text">Support for more countries coming soon</span>
        </span>
      </div>

      <div className="guide-content">
        <h1>Guide to the Curious: Investing Basics</h1>
        
        <section className="guide-section">
          <h2>Understanding the Stock Market</h2>
          <p>The stock market is a marketplace where shares of publicly traded companies are bought and sold. It's one of the most popular ways to invest and grow your wealth over time.</p>
        </section>

        <section className="guide-section">
          <h2>Key Investment Concepts</h2>
          <ul>
            <li>Stocks: Ownership shares in a company</li>
            <li>Bonds: Debt securities issued by governments or corporations</li>
            <li>Mutual Funds: Pooled investment funds managed by professionals</li>
            <li>ETFs: Exchange-traded funds that track specific indexes</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>Investment Strategies</h2>
          <p>Different strategies work for different investors. Some common approaches include:</p>
          <ul>
            <li>Value Investing: Finding undervalued stocks</li>
            <li>Growth Investing: Investing in companies with high growth potential</li>
            <li>Index Investing: Following market indexes</li>
          </ul>
        </section>
      </div>

      <div className="floating-bubble">
        <button className="help-button" onClick={toggleDrawer}>
          Need Help?
        </button>
      </div>

      <div className={`sliding-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Guide Chat</h3>
          <button className="close-button" onClick={toggleDrawer}>×</button>
        </div>
        
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                {message.text}
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
              placeholder={isLoading ? "Processing..." : "Ask about investing..."}
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidePage; 