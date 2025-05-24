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
  const [isPrerequisitesCollapsed, setIsPrerequisitesCollapsed] = useState(false);
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
        <h1>Complete Guide to Start Investing in Stocks in India</h1>
        <p className="guide-intro">This comprehensive guide provides a step-by-step roadmap for beginners to start investing in the Indian stock market. The guide covers all essential requirements, account setup procedures, fundamental concepts, and practical investment strategies specifically tailored for the Indian market. Whether you're a college student or working professional, this guide will help you navigate the complexities of stock market investing while ensuring compliance with regulatory requirements and establishing a solid foundation for your investment journey.</p>

        <section className={`guide-section prerequisites ${isPrerequisitesCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Prerequisites and Requirements</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-prerequisites"
                checked={isPrerequisitesCollapsed}
                onChange={() => setIsPrerequisitesCollapsed(!isPrerequisitesCollapsed)}
              />
              <label htmlFor="collapse-prerequisites">
                <span className="custom-checkbox-visual"></span> 
                <span className="collapse-text">
                  {isPrerequisitesCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>Before diving into stock market investments, you must meet certain basic eligibility criteria and understand the fundamental requirements. The Indian stock market, regulated by the Securities and Exchange Board of India (SEBI), has established clear guidelines for who can participate and what documentation is necessary.</p>

            <div className="checklist-container">
              <h3>Eligibility Criteria Checklist</h3>
              <div className="check-item">
                <span className="checkmark">✓</span>
                <p><strong>Age Requirement</strong></p>
              </div>
              <ul>
                <li>Must be 18 years or older</li>
                <li>Valid proof of age through government-issued documents</li>
              </ul>

              <div className="check-item">
                <span className="checkmark">✓</span>
                <p><strong>Nationality Requirement</strong></p>
              </div>
              <ul>
                <li>Must be an Indian citizen</li>
                <li>Foreign nationals have different procedures (not covered in this guide)</li>
              </ul>

              <div className="check-item">
                <span className="checkmark">✓</span>
                <p><strong>Financial Prerequisites</strong></p>
              </div>
              <ul>
                <li>Active bank account in India</li>
                <li>Sufficient funds to meet minimum investment requirements</li>
                <li>Understanding that there is no strict minimum limit to start trading</li>
              </ul>

              <div className="check-item">
                <span className="checkmark">✓</span>
                <p><strong>Documentation Readiness</strong></p>
              </div>
              <ul>
                <li>PAN Card (mandatory for all financial transactions)</li>
                <li>Aadhaar Card for address verification</li>
                <li>Recent photograph (passport size)</li>
                <li>Bank account proof (cancelled cheque or 3 months bank statements)</li>
                <li>Income proof (required for futures and options trading)</li>
              </ul>
            </div>

            <div className="knowledge-requirements">
              <h3>Essential Knowledge Requirements</h3>
              <p>Before opening accounts, ensure you understand that investing involves risks, stock prices fluctuate based on market conditions, and you should only invest money you can afford to lose. The stock market operates on demand and supply principles, where prices are determined by market forces rather than any central authority.</p>
            </div>

            <div className="progress-tracker">
              <h3>Progress Tracker - Prerequisites:</h3>
              <ul>
                <li><input type="checkbox" id="age-verification" /> <label htmlFor="age-verification">Age verification (18+)</label></li>
                <li><input type="checkbox" id="indian-citizenship" /> <label htmlFor="indian-citizenship">Indian citizenship confirmed</label></li>
                <li><input type="checkbox" id="active-bank-account" /> <label htmlFor="active-bank-account">Active bank account available</label></li>
                <li><input type="checkbox" id="documents-collected" /> <label htmlFor="documents-collected">All required documents collected</label></li>
                <li><input type="checkbox" id="risk-understanding" /> <label htmlFor="risk-understanding">Basic risk understanding completed</label></li>
              </ul>
            </div>
          </div>
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