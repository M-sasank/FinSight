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
  const [isAccountOpeningCollapsed, setIsAccountOpeningCollapsed] = useState(false);
  const [isStockFundamentalsCollapsed, setIsStockFundamentalsCollapsed] = useState(false);
  const [currentSectionName, setCurrentSectionName] = useState('');
  const messagesEndRef = useRef(null);

  const sectionRefs = {
    prerequisites: useRef(null),
    accountOpening: useRef(null),
    stockFundamentals: useRef(null),
  };

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

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Trigger when 50% of the section is visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Determine section name based on the ref
          if (entry.target === sectionRefs.prerequisites.current) {
            setCurrentSectionName('Prerequisites');
          } else if (entry.target === sectionRefs.accountOpening.current) {
            setCurrentSectionName('Account Opening');
          } else if (entry.target === sectionRefs.stockFundamentals.current) {
            setCurrentSectionName('Stock Fundamentals');
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [sectionRefs]);

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

        <section ref={sectionRefs.prerequisites} className={`guide-section prerequisites ${isPrerequisitesCollapsed ? 'collapsed' : ''}`}>
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

        <section ref={sectionRefs.accountOpening} className={`guide-section account-opening ${isAccountOpeningCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Account Opening Process</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-account-opening"
                checked={isAccountOpeningCollapsed}
                onChange={() => setIsAccountOpeningCollapsed(!isAccountOpeningCollapsed)}
              />
              <label htmlFor="collapse-account-opening">
                <span className="custom-checkbox-visual"></span>
                <span className="collapse-text">
                  {isAccountOpeningCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>The foundation of stock market investing in India requires opening two essential accounts: a Demat account to hold your shares electronically and a Trading account to facilitate buying and selling transactions. This process has been significantly simplified with online procedures and digital verification methods.</p>

            <h3>Step 1: Choose Your Broker</h3>
            <p>Selecting the right broker is crucial as it affects your trading costs, platform experience, and available services. India offers both discount brokers with lower fees and full-service brokers with comprehensive advisory services.</p>
            
            <h4>Top Broker Options with Ratings:</h4>
            <ul>
              <li>Zerodha: 9.80/10 rating, ₹0 for delivery, ₹20 per order for intraday</li>
              <li>Groww: 9.61/10 rating, ₹20 per order</li>
              <li>Angel One: 9.60/10 rating, ₹0 for delivery, ₹20 per order for others</li>
              <li>Upstox: 9.50/10 rating, ₹20 per order</li>
            </ul>

            <h4>Broker Selection Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="broker-check-charges" /> <label htmlFor="broker-check-charges">Compare brokerage charges across platforms</label></li>
                <li><input type="checkbox" id="broker-check-ui" /> <label htmlFor="broker-check-ui">Evaluate user interface and mobile app quality</label></li>
                <li><input type="checkbox" id="broker-check-reviews" /> <label htmlFor="broker-check-reviews">Check customer service ratings and reviews</label></li>
                <li><input type="checkbox" id="broker-check-compliance" /> <label htmlFor="broker-check-compliance">Verify regulatory compliance and SEBI registration</label></li>
                <li><input type="checkbox" id="broker-check-resources" /> <label htmlFor="broker-check-resources">Assess research tools and educational resources availability</label></li>
          </ul>
            </div>

            <h3>Step 2: Complete KYC Process</h3>
            <p>Know Your Customer (KYC) is a mandatory regulatory requirement that helps verify your identity and ensures market integrity. This one-time process creates a centralized database managed by CERSAI (Central Registry of Securitisation Asset Reconstruction and Security Interest of India) that all four major financial regulators can access.</p>
            
            <h4>KYC Documentation Process:</h4>
            <ol className="process-list">
              <li><strong>PAN Card Submission:</strong> Ensure signature and photograph are clearly visible</li>
              <li><strong>Address Proof:</strong> Submit Aadhaar card, driving license, or passport</li>
              <li><strong>Photograph Upload:</strong> Recent passport-size photograph</li>
              <li><strong>Signature Verification:</strong> Sign on white paper and upload digitally</li>
              <li><strong>Bank Account Verification:</strong> Provide cancelled cheque or recent bank statements</li>
            </ol>

            <h4>KYC Completion Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="kyc-check-pan" /> <label htmlFor="kyc-check-pan">PAN card scanned and uploaded</label></li>
                <li><input type="checkbox" id="kyc-check-address" /> <label htmlFor="kyc-check-address">Address proof document verified</label></li>
                <li><input type="checkbox" id="kyc-check-photo" /> <label htmlFor="kyc-check-photo">Recent photograph uploaded</label></li>
                <li><input type="checkbox" id="kyc-check-signature" /> <label htmlFor="kyc-check-signature">Digital signature completed</label></li>
                <li><input type="checkbox" id="kyc-check-bank" /> <label htmlFor="kyc-check-bank">Bank account details verified</label></li>
                <li><input type="checkbox" id="kyc-check-mobile-email" /> <label htmlFor="kyc-check-mobile-email">Mobile number and email verification completed</label></li>
              </ul>
            </div>

            <h3>Step 3: Account Activation and Setup</h3>
            <p>Once your KYC is approved, you'll receive login credentials for both your Demat and Trading accounts. The typical account opening process with most brokers follows a standardized four-step procedure.</p>

            <h4>Account Activation Steps:</h4>
            <ol className="process-list">
              <li><strong>Register:</strong> Visit broker website, click "Open Demat Account," enter email and phone number</li>
              <li><strong>Verify:</strong> Complete KYC verification process</li>
              <li><strong>Upload:</strong> Scan and upload Aadhaar and PAN cards</li>
              <li><strong>Finalize:</strong> Complete e-signature through Aadhaar OTP and add nominee details</li>
            </ol>

            <h4>Post-Activation Setup Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="post-activation-login" /> <label htmlFor="post-activation-login">Login credentials received and tested</label></li>
                <li><input type="checkbox" id="post-activation-platform" /> <label htmlFor="post-activation-platform">Trading platform downloaded and installed</label></li>
                <li><input type="checkbox" id="post-activation-bank" /> <label htmlFor="post-activation-bank">Bank account linked for fund transfers</label></li>
                <li><input type="checkbox" id="post-activation-nominee" /> <label htmlFor="post-activation-nominee">Nominee details added to accounts</label></li>
                <li><input type="checkbox" id="post-activation-funding" /> <label htmlFor="post-activation-funding">Initial funding method configured (UPI, net banking, etc.)</label></li>
              </ul>
            </div>

            <h4>Progress Tracker - Account Opening:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="progress-ao-broker" /> <label htmlFor="progress-ao-broker">Broker selected based on requirements</label></li>
                <li><input type="checkbox" id="progress-ao-kyc-docs" /> <label htmlFor="progress-ao-kyc-docs">KYC documentation completed</label></li>
                <li><input type="checkbox" id="progress-ao-app" /> <label htmlFor="progress-ao-app">Account opening application submitted</label></li>
                <li><input type="checkbox" id="progress-ao-verification" /> <label htmlFor="progress-ao-verification">Verification process completed</label></li>
                <li><input type="checkbox" id="progress-ao-credentials" /> <label htmlFor="progress-ao-credentials">Login credentials received and activated</label></li>
          </ul>
            </div>
          </div>
        </section>

        {/* New Stock Market Fundamentals Section */}
        <section ref={sectionRefs.stockFundamentals} className={`guide-section stock-fundamentals ${isStockFundamentalsCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Stock Market Fundamentals</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-stock-fundamentals"
                checked={isStockFundamentalsCollapsed}
                onChange={() => setIsStockFundamentalsCollapsed(!isStockFundamentalsCollapsed)}
              />
              <label htmlFor="collapse-stock-fundamentals">
                <span className="custom-checkbox-visual"></span>
                <span className="collapse-text">
                  {isStockFundamentalsCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>Understanding stock market basics is essential before making your first investment. The stock market represents a platform where buyers and sellers trade publicly listed company shares, with prices determined by market forces of demand and supply.</p>

            <h3>Understanding Stocks and Ownership</h3>
            <p>A stock represents a piece of ownership in a company. When you purchase shares, you become a shareholder with a proportional stake in the company's assets and earnings. For example, if a company has issued 100 shares and you own 1 share, you own 1% stake in that company. This ownership structure provides two primary ways to generate returns: capital appreciation when stock prices increase and dividend payments when companies distribute profits to shareholders.</p>
            <p>The share market, also known as the stock market, serves as a regulated platform where buyers and sellers trade publicly listed company shares. The Securities and Exchange Board of India (SEBI) oversees market functioning and ensures listed companies comply with regulations and disclosure requirements.</p>

            <h3>Market Mechanics and Price Discovery</h3>
            <p>Stock prices fluctuate based on demand and supply dynamics, reflecting investor sentiment about company performance and future prospects. When a company demonstrates strong growth, good profits, or secures new orders, demand for its stock typically increases, driving prices higher. Conversely, negative news or poor performance can decrease demand and lower stock prices.</p>
            
            <h4>Price Movement Example:</h4>
            <p>Consider purchasing 10 shares at ₹5 each (total investment: ₹50). If the company performs well and the stock price rises to ₹10, you could sell for ₹100, earning a ₹50 profit. However, if external or internal factors cause the price to drop to ₹3, your shares would be worth only ₹30, resulting in a ₹20 loss if sold.</p>

            <h3>Types of Market Participants</h3>
            <p>The Indian stock market includes various participants with different investment objectives and time horizons. Understanding these categories helps you identify your own investment style and align strategies accordingly.</p>

            <h4>Investment Approaches:</h4>
            <ul>
              <li>Long-term Investors: Focus on company fundamentals and hold stocks for years</li>
              <li>Short-term Traders: Capitalize on price movements over days, weeks, or months</li>
              <li>Day Traders: Buy and sell within the same trading day</li>
              <li>Swing Traders: Hold positions for several days to capture short-term trends</li>
            </ul>

            <h4>Market Fundamentals Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="fundamentals-check-ownership" /> <label htmlFor="fundamentals-check-ownership">Stock ownership concept understood</label></li>
                <li><input type="checkbox" id="fundamentals-check-market" /> <label htmlFor="fundamentals-check-market">Share market functioning comprehended</label></li>
                <li><input type="checkbox" id="fundamentals-check-price" /> <label htmlFor="fundamentals-check-price">Price discovery mechanism grasped</label></li>
                <li><input type="checkbox" id="fundamentals-check-approaches" /> <label htmlFor="fundamentals-check-approaches">Different investment approaches identified</label></li>
                <li><input type="checkbox" id="fundamentals-check-risk" /> <label htmlFor="fundamentals-check-risk">Risk and return relationship acknowledged</label></li>
              </ul>
            </div>

            <h4>Progress Tracker - Market Fundamentals:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="progress-mf-concepts" /> <label htmlFor="progress-mf-concepts">Basic stock concepts mastered</label></li>
                <li><input type="checkbox" id="progress-mf-mechanics" /> <label htmlFor="progress-mf-mechanics">Market mechanics understood</label></li>
                <li><input type="checkbox" id="progress-mf-factors" /> <label htmlFor="progress-mf-factors">Price movement factors identified</label></li>
                <li><input type="checkbox" id="progress-mf-approaches" /> <label htmlFor="progress-mf-approaches">Investment approaches evaluated</label></li>
                <li><input type="checkbox" id="progress-mf-risk" /> <label htmlFor="progress-mf-risk">Risk awareness established</label></li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="floating-bubble">
        <button className="help-button" onClick={toggleDrawer}>
          {
            currentSectionName &&
            ((
              currentSectionName === 'Prerequisites' && !isPrerequisitesCollapsed) ||
              (currentSectionName === 'Account Opening' && !isAccountOpeningCollapsed) ||
              (currentSectionName === 'Stock Fundamentals' && !isStockFundamentalsCollapsed)
            )
            ? `Stuck in ${currentSectionName}?` 
            : 'Need Help?'
          }
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