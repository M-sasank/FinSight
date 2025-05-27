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
  const [isInvestmentPlanningCollapsed, setIsInvestmentPlanningCollapsed] = useState(false);
  const [isBrokerSelectionCollapsed, setIsBrokerSelectionCollapsed] = useState(false);
  const [isInvestmentJourneyCollapsed, setIsInvestmentJourneyCollapsed] = useState(false);
  const [currentSectionName, setCurrentSectionName] = useState('');
  const messagesEndRef = useRef(null);

  // State for stock recommendation feature
  const [isRecommendingStock, setIsRecommendingStock] = useState(false);
  const [recommendedStock, setRecommendedStock] = useState(null);
  const [recommendationError, setRecommendationError] = useState(null);

  // Define individual refs for each section for stability
  const prerequisitesRef = useRef(null);
  const accountOpeningRef = useRef(null);
  const stockFundamentalsRef = useRef(null);
  const investmentPlanningRef = useRef(null);
  const brokerSelectionRef = useRef(null);
  const investmentJourneyRef = useRef(null);

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
      threshold: 0.5
    };

    const observerCallback = (entries) => {
      // Filter only intersecting entries
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length === 0) return;

      // Pick the entry with the highest intersectionRatio
      const mostVisible = visibleEntries.reduce((max, entry) =>
        entry.intersectionRatio > max.intersectionRatio ? entry : max,
        visibleEntries[0]
      );

      let newSectionName = '';
      const section = mostVisible.target;
      if (section === prerequisitesRef.current) {
        newSectionName = 'Prerequisites';
      } else if (section === accountOpeningRef.current) {
        newSectionName = 'Account Opening';
      } else if (section === stockFundamentalsRef.current) {
        newSectionName = 'Stock Fundamentals';
      } else if (section === investmentPlanningRef.current) {
        newSectionName = 'Investment Planning';
      } else if (section === brokerSelectionRef.current) {
        newSectionName = 'Broker Selection';
      } else if (section === investmentJourneyRef.current) {
        newSectionName = 'Investment Journey';
      }

      if (newSectionName && newSectionName !== currentSectionName) {
        console.log('Setting new section name:', newSectionName);
        setCurrentSectionName(newSectionName);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = [
      prerequisitesRef,
      accountOpeningRef,
      stockFundamentalsRef,
      investmentPlanningRef,
      brokerSelectionRef,
      investmentJourneyRef
    ];

    setTimeout(() => {
      sections.forEach(ref => {
        if (ref.current) {
          observer.observe(ref.current);
        }
      });
    }, 100);

    return () => {
      sections.forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [currentSectionName]);

  // Add effect to log currentSectionName changes
  useEffect(() => {
    console.log('currentSectionName updated:', currentSectionName);
  }, [currentSectionName]);

  const handleGetStockRecommendation = async () => {
    setIsRecommendingStock(true);
    setRecommendedStock(null);
    setRecommendationError(null);

    // Simulate API call / deep research
    setTimeout(() => {
      const stockData = {
        name: "INFOSYS (INFY)",
        reason: "Strong fundamentals, consistent growth in the IT sector, and positive future outlook based on recent analyst reports."
      };
      setRecommendedStock(stockData);
      setIsRecommendingStock(false);
    }, 3000);
  };

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

        <section ref={prerequisitesRef} className={`guide-section prerequisites ${isPrerequisitesCollapsed ? 'collapsed' : ''}`}>
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

        <section ref={accountOpeningRef} className={`guide-section account-opening ${isAccountOpeningCollapsed ? 'collapsed' : ''}`}>
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
        <section ref={stockFundamentalsRef} className={`guide-section stock-fundamentals ${isStockFundamentalsCollapsed ? 'collapsed' : ''}`}>
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

        {/* New Investment Planning and Amount Determination Section */}
        <section ref={investmentPlanningRef} className={`guide-section investment-planning ${isInvestmentPlanningCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Investment Planning and Amount Determination</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-investment-planning"
                checked={isInvestmentPlanningCollapsed}
                onChange={() => setIsInvestmentPlanningCollapsed(!isInvestmentPlanningCollapsed)}
              />
              <label htmlFor="collapse-investment-planning">
                <span className="custom-checkbox-visual"></span>
                <span className="collapse-text">
                  {isInvestmentPlanningCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>Determining how much money to invest represents a crucial decision that impacts your financial security and investment success. Unlike many misconceptions, there is no strict minimum limit to commence trading or investing in Indian stocks, as your starting point depends on having sufficient funds to purchase stocks based on their current share prices, which can range from ₹1 to ₹10,000 or more on Indian stock exchanges.</p>

            <h3>Investment Amount Strategies</h3>
            <p>Several proven strategies can guide your investment amount decisions, each tailored to different risk tolerances and life stages. The most widely recommended approaches consider your age, financial stability, and long-term goals.</p>
            <ol className="process-list">
              <li>
                <strong>100 Minus Age Strategy:</strong>
                <p>This strategy suggests allocating a percentage of your portfolio to stocks by subtracting your age from 100. For instance, if you're 30 years old, invest 70% of your investment portfolio in stocks. This approach promotes dynamic allocation, reducing equity exposure as you age and adopting a more conservative stance over time.</p>
              </li>
              <li>
                <strong>X/3 Strategy:</strong>
                <p>The X/3 strategy involves systematic investment by dividing your available investment capital into three equal parts and investing them over time. This approach helps average out market volatility and reduces the risk of investing all funds at market peaks.</p>
              </li>
            </ol>

            <h3>Risk Assessment and Capital Allocation</h3>
            <p>Before determining investment amounts, conduct a thorough assessment of your financial situation. Only invest money you can afford to lose without affecting your daily expenses, emergency fund, or essential financial obligations. Consider factors such as your monthly income, existing savings, debt obligations, and future financial goals when deciding investment amounts.</p>
            
            <h4>Financial Health Evaluation:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="ip-fhe-emergency" /> <label htmlFor="ip-fhe-emergency">Emergency fund covering 6-12 months of expenses</label></li>
                <li><input type="checkbox" id="ip-fhe-debt" /> <label htmlFor="ip-fhe-debt">No high-interest debt (credit cards, personal loans)</label></li>
                <li><input type="checkbox" id="ip-fhe-income" /> <label htmlFor="ip-fhe-income">Stable income source</label></li>
                <li><input type="checkbox" id="ip-fhe-surplus" /> <label htmlFor="ip-fhe-surplus">Clear understanding of monthly surplus available for investing</label></li>
                <li><input type="checkbox" id="ip-fhe-goals" /> <label htmlFor="ip-fhe-goals">Long-term financial goals defined</label></li>
              </ul>
            </div>

            <h4>Amount Planning Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="ip-apc-income" /> <label htmlFor="ip-apc-income">Monthly income and expenses calculated</label></li>
                <li><input type="checkbox" id="ip-apc-emergency" /> <label htmlFor="ip-apc-emergency">Emergency fund established</label></li>
                <li><input type="checkbox" id="ip-apc-debt" /> <label htmlFor="ip-apc-debt">High-interest debts cleared</label></li>
                <li><input type="checkbox" id="ip-apc-budget" /> <label htmlFor="ip-apc-budget">Investment budget determined</label></li>
                <li><input type="checkbox" id="ip-apc-risk" /> <label htmlFor="ip-apc-risk">Risk tolerance assessed</label></li>
                <li><input type="checkbox" id="ip-apc-timeline" /> <label htmlFor="ip-apc-timeline">Investment timeline defined</label></li>
              </ul>
            </div>

            <h3>Diversification and Portfolio Construction</h3>
            <p>Effective investment planning extends beyond amount determination to include diversification strategies that spread risk across different stocks, sectors, and market capitalizations. Avoid concentrating all investments in a single stock or sector, regardless of how confident you feel about its prospects.</p>

            <h4>Diversification Guidelines:</h4>
            <ul className="standard-list">
              <li>Invest in 8-15 different stocks across various sectors</li>
              <li>Allocate funds across different market capitalizations (large, mid, small-cap)</li>
              <li>Consider both growth and value stocks</li>
              <li>Maintain sector allocation limits (maximum 20-25% in any single sector)</li>
              <li>Regular portfolio review and rebalancing</li>
            </ul>
            
            <h4>Progress Tracker - Investment Planning:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="ip-pt-strategy" /> <label htmlFor="ip-pt-strategy">Investment amount strategy selected</label></li>
                <li><input type="checkbox" id="ip-pt-eval" /> <label htmlFor="ip-pt-eval">Financial health evaluation completed</label></li>
                <li><input type="checkbox" id="ip-pt-risk" /> <label htmlFor="ip-pt-risk">Risk tolerance determined</label></li>
                <li><input type="checkbox" id="ip-pt-diversification" /> <label htmlFor="ip-pt-diversification">Diversification plan created</label></li>
                <li><input type="checkbox" id="ip-pt-allocation" /> <label htmlFor="ip-pt-allocation">Portfolio allocation decided</label></li>
              </ul>
            </div>
          </div>
        </section>

        {/* New Broker Selection and Platform Setup Section */}
        <section ref={brokerSelectionRef} className={`guide-section broker-selection ${isBrokerSelectionCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Broker Selection and Platform Setup</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-broker-selection"
                checked={isBrokerSelectionCollapsed}
                onChange={() => setIsBrokerSelectionCollapsed(!isBrokerSelectionCollapsed)}
              />
              <label htmlFor="collapse-broker-selection">
                <span className="custom-checkbox-visual"></span>
                <span className="collapse-text">
                  {isBrokerSelectionCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>Choosing the right broker significantly impacts your overall investment experience, affecting everything from trading costs to research availability and customer service quality. The Indian market offers various brokerage options, from discount brokers focusing on low costs to full-service brokers providing comprehensive advisory services.</p>
            
            <h3>Comprehensive Broker Comparison</h3>
            <p>The current landscape includes several highly-rated brokers, each offering distinct advantages depending on your trading frequency, investment style, and service preferences. Understanding the differences between discount and full-service brokers helps align your choice with your specific needs.</p>
            <p>Discount Brokers offer better investing tools and low brokerage fees, making them ideal for self-directed investors who prefer conducting their own research. Full-Service Brokers provide personalized recommendations and advisory services but typically charge higher fees for these additional services.</p>

            <h4>Top Broker Analysis:</h4>
            <ul className="standard-list">
              <li>Zerodha (9.80/10): Market leader with zero delivery charges and ₹20 per order for intraday trading</li>
              <li>Groww (9.61/10): User-friendly platform with ₹20 per order across all segments</li>
              <li>Angel One (9.60/10): Zero delivery charges with comprehensive research tools</li>
              <li>Upstox (9.50/10): Technology-focused platform with competitive pricing</li>
            </ul>

            <h3>Platform Features and Technology</h3>
            <p>Modern trading platforms offer sophisticated tools for research, analysis, and order execution. Evaluate platforms based on user interface design, mobile app functionality, real-time data availability, and advanced charting capabilities.</p>

            <h4>Essential Platform Features:</h4>
            <ul className="standard-list">
              <li>Real-time market data and price quotes</li>
              <li>Advanced charting tools with technical indicators</li>
              <li>Research reports and analyst recommendations</li>
              <li>Mobile trading applications with full functionality</li>
              <li>Order types variety (market, limit, stop-loss, bracket orders)</li>
              <li>Portfolio tracking and performance analysis tools</li>
            </ul>

            <h3>Account Setup and Fund Transfer</h3>
            <p>Once you select a broker, the account setup process involves funding your trading account through various payment methods. Most brokers support multiple funding options including net banking, UPI transfers, and direct bank transfers, providing flexibility in account management.</p>

            <h4>Funding Methods:</h4>
            <ul className="standard-list">
              <li>UPI transfers for instant deposits</li>
              <li>Net banking for larger amounts</li>
              <li>NEFT/RTGS for bank-to-bank transfers</li>
              <li>Cheque deposits (though less common with digital platforms)</li>
            </ul>

            <h4>Broker Selection Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="bs-check-charges" /> <label htmlFor="bs-check-charges">Brokerage charges compared across multiple platforms</label></li>
                <li><input type="checkbox" id="bs-check-features" /> <label htmlFor="bs-check-features">Platform features evaluated for your needs</label></li>
                <li><input type="checkbox" id="bs-check-service" /> <label htmlFor="bs-check-service">Customer service quality researched</label></li>
                <li><input type="checkbox" id="bs-check-compliance" /> <label htmlFor="bs-check-compliance">Regulatory compliance verified</label></li>
                <li><input type="checkbox" id="bs-check-mobile" /> <label htmlFor="bs-check-mobile">Mobile app functionality tested</label></li>
                <li><input type="checkbox" id="bs-check-tools" /> <label htmlFor="bs-check-tools">Research and analysis tools assessed</label></li>
              </ul>
            </div>

            <h4>Progress Tracker - Broker Selection:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="bs-progress-research" /> <label htmlFor="bs-progress-research">Broker research completed</label></li>
                <li><input type="checkbox" id="bs-progress-features" /> <label htmlFor="bs-progress-features">Platform features compared</label></li>
                <li><input type="checkbox" id="bs-progress-account" /> <label htmlFor="bs-progress-account">Account opening initiated</label></li>
                <li><input type="checkbox" id="bs-progress-funding" /> <label htmlFor="bs-progress-funding">Funding method configured</label></li>
                <li><input type="checkbox" id="bs-progress-platform" /> <label htmlFor="bs-progress-platform">Trading platform familiarized</label></li>
              </ul>
            </div>
          </div>
        </section>

        {/* New Starting Your Investment Journey Section */}
        <section ref={investmentJourneyRef} className={`guide-section investment-journey ${isInvestmentJourneyCollapsed ? 'collapsed' : ''}`}>
          <div className="section-header">
            <h2>Starting Your Investment Journey</h2>
            <div className="collapse-control">
              <input
                type="checkbox"
                id="collapse-investment-journey"
                checked={isInvestmentJourneyCollapsed}
                onChange={() => setIsInvestmentJourneyCollapsed(!isInvestmentJourneyCollapsed)}
              />
              <label htmlFor="collapse-investment-journey">
                <span className="custom-checkbox-visual"></span>
                <span className="collapse-text">
                  {isInvestmentJourneyCollapsed ? 'Not Completed?' : 'Completed?'}
                </span>
              </label>
            </div>
          </div>
          <div className="section-content">
            <p>With all prerequisites met, accounts opened, and platforms configured, you're ready to make your first stock investment. The initial steps involve careful stock selection, strategic order placement, and ongoing portfolio monitoring to ensure your investments align with your financial goals.</p>

            <h3>First Stock Selection Process</h3>
            <p>Your first stock purchase should reflect careful research and analysis rather than speculation or emotional decisions. Consider companies with strong fundamentals, consistent earnings growth, and business models you understand. Start with well-established companies in sectors you're familiar with before exploring more complex investment opportunities.</p>

            <h4>Stock Research Framework:</h4>
            <ul className="standard-list">
              <li>Company Fundamentals: Analyze financial statements, revenue growth, and profitability trends</li>
              <li>Market Position: Evaluate competitive advantages and market share</li>
              <li>Management Quality: Research leadership track record and corporate governance</li>
              <li>Valuation Metrics: Compare price-to-earnings ratios with industry peers</li>
              <li>Growth Prospects: Assess future expansion plans and market opportunities</li>
            </ul>

            <h4>Investment Execution Steps:</h4>
            <ol className="process-list">
              <li>Log into your trading account and navigate to the stock selection interface</li>
              <li>Choose the stock based on your research and analysis</li>
              <li>Decide your investment amount considering portfolio allocation and risk management</li>
              <li>Purchase the stock at its listed price using appropriate order types</li>
            </ol>

            <h3>Order Types and Execution</h3>
            <p>Understanding different order types helps optimize your entry and exit points while managing risk effectively. Market orders execute immediately at current prices, while limit orders allow you to specify exact purchase or sale prices.</p>

            <h4>Order Type Selection:</h4>
            <ul className="standard-list">
              <li>Market Orders: Execute immediately at best available price</li>
              <li>Limit Orders: Execute only at specified price or better</li>
              <li>Stop-Loss Orders: Automatically sell if price falls below specified level</li>
              <li>Good Till Cancelled (GTC): Remain active until executed or cancelled</li>
            </ul>

            <h3>Portfolio Monitoring and Management</h3>
            <p>Successful investing requires ongoing portfolio monitoring and periodic rebalancing to maintain desired asset allocation. Regular review helps identify underperforming investments and opportunities for improvement while ensuring your portfolio remains aligned with changing financial goals.</p>

            <h4>Monitoring Framework:</h4>
            <ul className="standard-list">
              <li>Weekly portfolio performance review</li>
              <li>Monthly rebalancing assessment</li>
              <li>Quarterly fundamental analysis update</li>
              <li>Annual investment strategy evaluation</li>
              <li>Continuous market news and company updates tracking</li>
            </ul>
            
            <h4>Investment Journey Checklist:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="ij-check-research" /> <label htmlFor="ij-check-research">First stock research completed</label></li>
                <li><input type="checkbox" id="ij-check-amount" /> <label htmlFor="ij-check-amount">Investment amount allocated</label></li>
                <li><input type="checkbox" id="ij-check-order" /> <label htmlFor="ij-check-order">Order type selected</label></li>
                <li><input type="checkbox" id="ij-check-purchase" /> <label htmlFor="ij-check-purchase">First purchase executed</label></li>
                <li><input type="checkbox" id="ij-check-tracking" /> <label htmlFor="ij-check-tracking">Portfolio tracking system established</label></li>
                <li><input type="checkbox" id="ij-check-schedule" /> <label htmlFor="ij-check-schedule">Regular monitoring schedule created</label></li>
              </ul>
            </div>

            <h4>Final Progress Tracker - Complete Journey:</h4>
            <div className="progress-tracker">
              <ul>
                <li><input type="checkbox" id="fpt-prerequisites" /> <label htmlFor="fpt-prerequisites">All prerequisites met</label></li>
                <li><input type="checkbox" id="fpt-accounts" /> <label htmlFor="fpt-accounts">Accounts successfully opened</label></li>
                <li><input type="checkbox" id="fpt-fundamentals" /> <label htmlFor="fpt-fundamentals">Market fundamentals understood</label></li>
                <li><input type="checkbox" id="fpt-strategy" /> <label htmlFor="fpt-strategy">Investment strategy defined</label></li>
                <li><input type="checkbox" id="fpt-platform" /> <label htmlFor="fpt-platform">Broker platform configured</label></li>
                <li><input type="checkbox" id="fpt-investment" /> <label htmlFor="fpt-investment">First investment completed</label></li>
                <li><input type="checkbox" id="fpt-monitoring" /> <label htmlFor="fpt-monitoring">Monitoring system established</label></li>
              </ul>
            </div>
          </div>
        </section>

        {/* New Feeling Confident Section */}
        <section className="guide-section feeling-confident-section">
          <h2>Feeling confident?</h2>
          <p>Ready to take the next step? Based on current market analysis and our simulated deep research, here's a stock pick to consider for your initial investment research.</p>
          
          <button 
            onClick={handleGetStockRecommendation} 
            disabled={isRecommendingStock}
            className="recommendation-button"
          >
            {isRecommendingStock ? "Researching Your Stock..." : "Get Stock Recommendation"}
          </button>

          {isRecommendingStock && (
            <div className="loading-recommendation">
              <p>Performing sonar deep research... please wait.</p>
              {/* You can add a spinner icon here if you have one */}
            </div>
          )}

          {recommendationError && (
            <div className="recommendation-error">
              <p>Error: {recommendationError}</p>
            </div>
          )}

          {recommendedStock && !isRecommendingStock && (
            <div className="recommendation-result">
              <h3>Recommended Stock:</h3>
              <p className="stock-name">{recommendedStock.name}</p>
              <h4>Reason:</h4>
              <p className="stock-reason">{recommendedStock.reason}</p>
              <p className="disclaimer"><em>Disclaimer: This is a simulated recommendation for educational purposes only. Always conduct your own thorough research before investing.</em></p>
            </div>
          )}
        </section>

      </div>

      <div className="floating-bubble">
        <button className="help-button" onClick={toggleDrawer}>
          {
            currentSectionName
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