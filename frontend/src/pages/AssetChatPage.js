import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiSend, FiAlertTriangle, FiLoader, FiArrowLeft } from 'react-icons/fi';

// Simulated API responses for asset details
const SIMULATED_ASSET_DATA = {
  "AWS": {
    symbol: "AWS",
    name: "Amazon.com, Inc.",
    current_price: 185.57,
    price_change_percentage_24h: 1.23,
    market_cap: "1.92T",
    volume_24h: "45M",
    day_high: 186.20,
    day_low: 184.50,
  },
  "MIC": {
    symbol: "MIC",
    name: "Microsoft Corp.",
    current_price: 430.15,
    price_change_percentage_24h: -0.50,
    market_cap: "3.1T",
    volume_24h: "22M",
    day_high: 432.50,
    day_low: 429.80,
  },
  // Add more specific dummy data as needed
};

const DEFAULT_SIMULATED_ASSET = {
    current_price: 0,
    price_change_percentage_24h: 0,
    market_cap: "N/A",
    volume_24h: "N/A",
    day_high: 0,
    day_low: 0,
};

// Basic styles (ideally, these would be in a CSS file)
const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)', // Assuming a 60px navbar or header
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  },
  sidebar: {
    width: '300px',
    borderRight: '1px solid #e0e0e0',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #ddd',
  },
  assetSymbol: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    color: '#1a73e8', // Example primary color
    margin: 0,
  },
  assetName: {
    fontSize: '1em',
    color: '#5f6368',
    marginBottom: '15px',
  },
  statsContainer: {
    flexGrow: 1,
  },
  statItem: { // Re-add if financial details are enabled
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9em',
    padding: '8px 0',
    borderBottom: '1px dashed #eee',
  },
  statLabel: { color: '#5f6368' },
  statValue: { fontWeight: '500' },
  positive: { color: '#34a853' },
  negative: { color: '#ea4335' },
  errorState: {
    textAlign: 'center',
    padding: '20px',
    color: '#757575',
    backgroundColor: '#fff3f3',
    borderRadius: '8px',
    border: '1px solid #ffcdd2',
  },
  errorIcon: { fontSize: '2rem', marginBottom: '10px', color: '#d9534f' },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column', // Changed direction
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 100px)', // Adjusted height
    textAlign: 'center',
  },
  loadingSpinner: { fontSize: '2.5rem', color: '#1a73e8', marginBottom: '15px' }, // Example primary color
  loadingText: { fontSize: '1.2rem', color: '#5f6368'},
  chatMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  chatHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9', // Light background for header
  },
  chatTitle: {
    margin: 0,
    fontSize: '1.2em',
    fontWeight: '500',
    color: '#3c4043',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px', // Space between messages
  },
  messageBubble: (isUser) => ({
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '18px',
    lineHeight: '1.4',
    fontSize: '0.95em',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    backgroundColor: isUser ? '#1a73e8' : '#e9e9eb', // Example: Blue for user, light grey for bot
    color: isUser ? 'white' : '#333',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  }),
  errorMessage: {
    backgroundColor: '#fdeaed',
    color: '#b92c3c',
    border: '1px solid #f8c8cd'
  },
  messageTimestamp: {
    fontSize: '0.75em',
    color: '#777', // Subdued color
    marginTop: '5px',
    textAlign: 'right',
  },
  quickActionsContainer: {
    padding: '10px 20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap', // Allow wrapping
    backgroundColor: '#f9f9f9',
    minHeight: '50px', // Height includes padding, adjust if button sizes change. (Was 40px, button padding 8px*2 + button font size)
    alignItems: 'center', // Vertically align items if they don't fill the minHeight
    transition: 'visibility 0s, opacity 0.2s linear', 
  },
  quickActionButton: {
    padding: '8px 15px',
    fontSize: '0.85em',
    border: '1px solid #1a73e8',
    color: '#1a73e8',
    backgroundColor: 'white',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  // Hover style for quickActionButton would ideally be in CSS: button:hover { background-color: #e8f0fe; }
  inputContainer: {
    display: 'flex',
    alignItems: 'center', // Vertically center inputWrapper
    padding: '10px 20px', // Keep padding minimal to rely on fixed height
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
    height: '70px', // Fixed height for stability
    boxSizing: 'border-box', // Ensure padding is included in height
  },
  inputWrapper: { 
    display: 'flex',
    flexGrow: 1,
    border: '1px solid #ccc',
    borderRadius: '24px',
    backgroundColor: 'white',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    height: '48px', // Fixed height for the wrapper
  },
  chatInput: {
    flexGrow: 1,
    border: 'none',
    padding: '0 15px', // Horizontal padding only
    fontSize: '1em',
    outline: 'none',
    backgroundColor: 'transparent',
    height: '100%', // Fill the fixed height of inputWrapper
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    gap: '8px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
    padding: '0 15px', // Consistent horizontal padding
    minWidth: '100px', // Accommodate "Sending..." text
    height: '100%', // Fill fixed height of inputWrapper
  },
  // Hover style for sendButton would be in CSS: button:hover { background-color: #1558b8; }
  // Disabled style for sendButton would be in CSS: button:disabled { background-color: #a0c2ed; cursor: not-allowed; }
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    marginTop: 'auto', // Pushes to bottom if sidebar content is short
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center',
    transition: 'background-color 0.2s ease',
  }
};


function AssetChatPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  
  const [assetDetails, setAssetDetails] = useState(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(true);
  const [assetError, setAssetError] = useState(null);
  const [currentSuggestionPrompts, setCurrentSuggestionPrompts] = useState([]);

  useEffect(() => {
    const fetchAssetData = async () => {
      const passedCompanyName = location.state?.companyName;

      if (!symbol) {
        setAssetError("No asset symbol provided.");
        setIsLoadingAsset(false);
        return;
      }
      setIsLoadingAsset(true);
      setAssetError(null);
      setAssetDetails(null); 

      await new Promise(resolve => setTimeout(resolve, 750)); 

      const foundAsset = SIMULATED_ASSET_DATA[symbol.toUpperCase()];
      if (foundAsset) {
        setAssetDetails(foundAsset);
      } else {
        if (passedCompanyName) {
          setAssetDetails({
            ...DEFAULT_SIMULATED_ASSET,
            symbol: symbol,
            name: passedCompanyName, 
          });
        } else {
          setAssetDetails({
            ...DEFAULT_SIMULATED_ASSET,
            symbol: symbol,
            name: `${symbol} (Details not fully available)`,
          });
        }
      }
      setIsLoadingAsset(false);
    };

    fetchAssetData();
  }, [symbol, location.state]);

  useEffect(() => {
    if (isLoadingAsset) return;

    let welcomeText;
    let prompts = [];

    if (assetError) {
      welcomeText = assetError;
      prompts = [{ text: "What are common investment strategies?", query: "What are common investment strategies?" }];
    } else if (assetDetails && assetDetails.name) {
      welcomeText = `Welcome! You are viewing ${assetDetails.name}. How can I assist you?`; // Slightly friendlier
      prompts = [
        { text: `Analyze ${assetDetails.symbol} performance`, query: `What's driving ${assetDetails.name}'s recent price movement?` },
        { text: `Compare ${assetDetails.symbol} to competitors`, query: `How does ${assetDetails.name} compare to its main competitors?` },
        { text: `Future outlook for ${assetDetails.symbol}`, query: `What's the future outlook for ${assetDetails.name}?` },
        // { text: `Key metrics for ${assetDetails.symbol}`, query: `What are the key financial metrics for ${assetDetails.name}?` }, // Kept commented if still not primary focus
        // { text: `Risk factors for ${assetDetails.symbol}`, query: `What are the main risk factors for ${assetDetails.name}?` }
      ];
    } else { // Should ideally not be reached if assetDetails is set in the other branch
      welcomeText = `Information for ${symbol} is limited. You can ask general questions.`;
      prompts = [{ text: "Explain stock market basics", query: "Explain stock market basics" }];
    }

    setMessages([{ id: 'chatmsg-initial-1', text: welcomeText, sender: 'bot', type: 'greeting', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setCurrentSuggestionPrompts(prompts);

  }, [assetDetails, symbol, isLoadingAsset, assetError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSuggestionClick = (query) => {
    if (isChatLoading) return; // Prevent clicking suggestions while loading
    setInput(query);
    const chatInputElement = document.querySelector('.chat-input'); // Use class from JSX
    if (chatInputElement) chatInputElement.focus();
  };

  const handleSendMessage = async () => {
    if (input.trim() && !isChatLoading) {
      const userMessage = {
        id: `chatmsg-${Date.now()}`,
        text: input,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input;
      setInput('');
      setIsChatLoading(true);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/asset-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_query: currentInput, symbol: symbol, conversation_id: conversationId })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to get chat response' }));
          throw new Error(errorData.detail || 'Network response was not ok for chat');
        }
        const data = await response.json();
        if (!conversationId && data.conversation_id) setConversationId(data.conversation_id);
        const botContent = data.response?.data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
        const botMessageType = data.response?.type || 'standard';
        setMessages(prev => [...prev, { id: `chatmsg-${Date.now() + 1}`, sender: 'bot', text: botContent, type: botMessageType, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, { id: `chatmsg-${Date.now() + 1}`, sender: 'bot', text: `Chat error: ${error.message}. Please try again.`, type: 'error', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } finally {
        setIsChatLoading(false);
      }
    }
  };
  
  if (isLoadingAsset && !assetDetails && !assetError) { // Added !assetError condition
    return (
      <div style={styles.loadingContainer}>
        <FiLoader style={styles.loadingSpinner} className="loading-spinner-animation" /> {/* Added class for CSS animation if desired */}
        <p style={styles.loadingText}>Loading details for {symbol}...</p>
      </div>
    );
  }

  // Determine if the quick actions area should be rendered in the layout
  const shouldRenderQuickActionsArea = messages.length <= 2 && currentSuggestionPrompts.length > 0;

  return (
    <div style={styles.container} className="asset-chat-container-component"> {/* Added component class */}
      <div style={styles.sidebar} className="asset-info-sidebar-component">
        <div style={styles.sidebarHeader}>
          <h2 style={styles.assetSymbol}>{(assetDetails?.symbol || symbol).toUpperCase()}</h2>
          <p style={styles.assetName}>{assetDetails?.name || (assetError ? 'Error Loading Data' : 'Loading...')}</p>
        </div>
        
        <div style={styles.statsContainer}>
          {assetDetails && !assetError ? (
            <div className="asset-quick-stats-component"> {/* Wrapper for future stats */}
              {/* Financial details were temporarily hidden, now removing the placeholder message too */}
              {/* <div style={styles.statItem}>
                <span style={styles.statLabel}>Price</span>
                <span style={styles.statValue}>${(typeof assetDetails.current_price === 'number' ? assetDetails.current_price.toFixed(2) : 'N/A')}</span>
              </div>
              // ... other stat items
              */}
            </div>
          ) : (
            <div style={styles.errorState}>
              <FiAlertTriangle style={styles.errorIcon}/>
              <p>{assetError || `Details for ${symbol} are currently unavailable.`}</p>
            </div>
          )}
        </div>
        <button style={styles.navButton} onClick={() => navigate('/tracker')}>
            <FiArrowLeft /> Back to Tracker
        </button>
      </div>

      <div style={styles.chatMain} className="asset-chat-main-component">
        <div style={styles.chatHeader}>
          <h3 style={styles.chatTitle}>Chat with AI Assistant for {(assetDetails?.name || symbol)}</h3>
        </div>
        <div style={styles.messagesContainer} className="chat-messages-component">
          {messages.map((message) => (
            <div 
              key={message.id} 
              style={{
                ...styles.messageBubble(message.sender === 'user'),
                ...(message.type === 'error' ? styles.errorMessage : {}) // Apply error style if message type is error
              }}
              className={`message-bubble-component ${message.sender}`}
            >
              <div className="message-text-content">{message.text}</div>
              {message.timestamp && <div style={styles.messageTimestamp}>{message.timestamp}</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* MODIFICATION START: Quick Actions visibility change */}
        {shouldRenderQuickActionsArea && (
          <div 
            style={{
              ...styles.quickActionsContainer,
              visibility: isChatLoading ? 'hidden' : 'visible', // Key change: use visibility
              opacity: isChatLoading ? 0 : 1, // Optional: for a fade effect
            }} 
            className="quick-actions-component"
          >
            {currentSuggestionPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={`quick-${index}`}
                style={styles.quickActionButton}
                className="quick-action-button-component"
                onClick={() => handleSuggestionClick(prompt.query)}
                onMouseEnter={e => { if (!isChatLoading) e.currentTarget.style.backgroundColor = '#e8f0fe'; }} 
                onMouseLeave={e => { if (!isChatLoading) e.currentTarget.style.backgroundColor = 'white'; }}
                disabled={isChatLoading} // Visually disable buttons too
              >
                {prompt.text}
              </button>
            ))}
          </div>
        )}
        {/* MODIFICATION END */}

        <div style={styles.inputContainer} className="chat-input-area-component">
          <div style={styles.inputWrapper}>
            <input
              type="text"
              style={styles.chatInput}
              className="chat-input" // Keep class for potential external styling
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isChatLoading ? "AI is thinking..." : `Ask about ${assetDetails?.name || symbol}...`}
              disabled={isChatLoading || (isLoadingAsset && !assetDetails)} // Refined disabled condition
            />
            <button 
                style={{...styles.sendButton, ...( (isChatLoading || (isLoadingAsset && !assetDetails) || !input.trim()) && {backgroundColor: '#a0c2ed', cursor: 'not-allowed'} )}}
                onClick={handleSendMessage} 
                disabled={isChatLoading || (isLoadingAsset && !assetDetails) || !input.trim()}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1558b8'; }} // Basic hover
                onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1a73e8'; }}
              >
              <FiSend /> 
              <span>{isChatLoading ? "Sending" : "Send"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetChatPage; 