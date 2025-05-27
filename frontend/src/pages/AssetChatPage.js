import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiSend, FiAlertTriangle, FiLoader, FiArrowLeft } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';

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
  },
  sidebar: {
    width: '300px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    marginBottom: '20px',
    paddingBottom: '10px',
  },
  assetSymbol: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    margin: 0,
  },
  assetName: {
    fontSize: '1em',
    marginBottom: '15px',
  },
  statsContainer: {
    flexGrow: 1,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9em',
    padding: '8px 0',
  },
  statLabel: { color: '#5f6368' },
  statValue: { fontWeight: '500' },
  errorState: {
    textAlign: 'center',
    padding: '20px',
    borderRadius: '8px',
  },
  errorIcon: { fontSize: '2rem', marginBottom: '10px', color: '#d9534f' },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 100px)',
    textAlign: 'center',
  },
  loadingSpinner: { fontSize: '2.5rem', color: '#1a73e8', marginBottom: '15px' },
  loadingText: { fontSize: '1.2rem', color: '#5f6368'},
  chatMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    padding: '15px 20px',
  },
  chatTitle: {
    margin: 0,
    fontSize: '1.2em',
    fontWeight: '500',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageBubble: (isUser) => ({
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '18px',
    lineHeight: '1.4',
    fontSize: '0.95em',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  }),
  errorMessage: {
    backgroundColor: '#fdeaed',
    color: '#b92c3c',
    border: '1px solid #f8c8cd'
  },
  messageTimestamp: {
    fontSize: '0.75em',
    marginTop: '5px',
    textAlign: 'right',
  },
  quickActionsContainer: {
    padding: '10px 20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    minHeight: '50px',
    alignItems: 'center',
    transition: 'visibility 0s, opacity 0.2s linear',
  },
  quickActionButton: {
    padding: '8px 15px',
    fontSize: '0.85em',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    height: '70px',
    boxSizing: 'border-box',
  },
  inputWrapper: { 
    display: 'flex',
    flexGrow: 1,
    borderRadius: '24px',
    overflow: 'hidden',
    height: '48px',
  },
  chatInput: {
    flexGrow: 1,
    border: 'none',
    padding: '0 15px',
    fontSize: '1em',
    outline: 'none',
    backgroundColor: 'transparent',
    height: '100%',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
    padding: '0 15px',
    minWidth: '100px',
    height: '100%',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    marginTop: 'auto',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center',
    transition: 'background-color 0.2s ease',
  }
};


function AssetChatPage({ currentTheme }) {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch, token } = useAuth();
  
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
      welcomeText = `Welcome! You are viewing ${assetDetails.name}. How can I assist you?`;
      prompts = [
        { text: `Analyze ${assetDetails.symbol} performance`, query: `What's driving ${assetDetails.name}'s recent price movement?` },
        { text: `Compare ${assetDetails.symbol} to competitors`, query: `How does ${assetDetails.name} compare to its main competitors?` },
        { text: `Future outlook for ${assetDetails.symbol}`, query: `What's the future outlook for ${assetDetails.name}?` },
      ];
    } else {
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
    if (isChatLoading) return;
    setInput(query);
    const chatInputElement = document.querySelector('.chat-input');
    if (chatInputElement) chatInputElement.focus();
  };

  const handleSendMessage = useCallback(async () => {
    if (input.trim() && !isChatLoading) {
      if (!token) {
        setMessages(prev => [...prev, { id: `chatmsg-error-${Date.now()}`, sender: 'bot', text: "Authentication error. Please log in again.", type: 'error', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setIsChatLoading(false);
        return;
      }

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
        const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/asset-chat/`, {
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
  }, [input, isChatLoading, token, authFetch, symbol, conversationId]);
  
  if (isLoadingAsset && !assetDetails && !assetError) {
    return (
      <div style={styles.loadingContainer}>
        <FiLoader style={styles.loadingSpinner} className="loading-spinner-animation" />
        <p style={styles.loadingText}>Loading details for {symbol}...</p>
      </div>
    );
  }

  const shouldRenderQuickActionsArea = messages.length <= 2 && currentSuggestionPrompts.length > 0;

  return (
    <div 
      style={styles.container} 
      className={`asset-chat-container page-theme-${currentTheme}`}
    >
      <div style={styles.sidebar} className="asset-info-sidebar-component">
        <div style={styles.sidebarHeader} className="sidebar-header">
          <h2 style={styles.assetSymbol}>{(assetDetails?.symbol || symbol).toUpperCase()}</h2>
          <p style={styles.assetName}>{assetDetails?.name || (assetError ? 'Error Loading Data' : 'Loading...')}</p>
        </div>
        
        <div style={styles.statsContainer} className="asset-quick-stats-component">
          {assetDetails && !assetError ? (
            <div>
            </div>
          ) : (
            <div style={styles.errorState} className="error-state">
              <FiAlertTriangle style={styles.errorIcon}/>
              <p>{assetError || `Details for ${symbol} are currently unavailable.`}</p>
            </div>
          )}
        </div>
        <button style={styles.navButton} onClick={() => navigate('/tracker')} className="chat-nav-button home-button">
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
                ...(message.type === 'error' ? styles.errorMessage : {})
              }}
              className={`message-bubble-component ${message.sender}`}
            >
              <div className="message-text-content">
                {message.sender === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                ) : (
                  message.text
                )}
                {message.timestamp && <div style={styles.messageTimestamp}>{message.timestamp}</div>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {shouldRenderQuickActionsArea && (
          <div 
            style={{
              ...styles.quickActionsContainer,
              visibility: isChatLoading ? 'hidden' : 'visible',
              opacity: isChatLoading ? 0 : 1,
            }} 
            className="quick-actions-component"
          >
            {currentSuggestionPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={`quick-${index}`}
                style={styles.quickActionButton}
                className="quick-action-button-component"
                onClick={() => handleSuggestionClick(prompt.query)}
                disabled={isChatLoading}
              >
                {prompt.text}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputContainer} className="chat-input-area-component">
          <div style={styles.inputWrapper}>
            <input
              type="text"
              style={styles.chatInput}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isChatLoading ? "AI is thinking..." : `Ask about ${assetDetails?.name || symbol}...`}
              disabled={isChatLoading || (isLoadingAsset && !assetDetails)}
            />
            <button 
                style={{...styles.sendButton, ...( (isChatLoading || (isLoadingAsset && !assetDetails) || !input.trim()) && {backgroundColor: '#a0c2ed', cursor: 'not-allowed'} )}}
                onClick={handleSendMessage} 
                disabled={isChatLoading || (isLoadingAsset && !assetDetails) || !input.trim()}
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