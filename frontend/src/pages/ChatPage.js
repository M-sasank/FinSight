import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiPlus, FiClock, FiExternalLink, FiChevronDown } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatPage.css';
import { useAuth } from '../contexts/AuthContext';

const LOADING_MESSAGES = [
  "Perplexity is thinking...",
  "Analyzing your query...",
  "Accessing knowledge base...",
  "Perplexity is searching for information...",
  "Gathering relevant data points...",
  "Compiling insights...",
  "Perplexity is crafting your response...",
  "Formatting the details...",
  "Almost ready..."
];

const newbieSuggestionPrompts = [
  { 
    text: "What is a stock?", 
    query: "Can you explain what a stock is in simple terms?",
    description: "Understand the basics of stock ownership"
  },
  { 
    text: "How to start investing?", 
    query: "What are the first steps to start investing in the stock market?",
    description: "Get a beginner-friendly guide to investing"
  },
  { 
    text: "Explain P/E ratio", 
    query: "What does the P/E ratio mean for a stock?",
    description: "Learn about a common valuation metric"
  },
  { 
    text: "Risks of investing", 
    query: "What are the common risks involved in stock market investing?",
    description: "Understand potential downsides before you start"
  },
  { 
    text: "What is a mutual fund?", 
    query: "Can you explain what a mutual fund is and how it works?",
    description: "Learn about diversified investment options"
  }
];

const veteranSuggestionPrompts = [
  { 
    text: "Technical Analysis", 
    query: "Show me the technical analysis for AAPL including RSI and MACD.",
    description: "Deep dive into technical indicators and patterns"
  },
  { 
    text: "Compare P/E Ratios", 
    query: "Compare the P/E ratios and forward P/E of AAPL, MSFT, and GOOGL.",
    description: "Analyze valuation metrics across tech giants"
  },
  { 
    text: "Market Sentiment Analysis", 
    query: "What is the current market sentiment based on VIX and put/call ratio?",
    description: "Evaluate market mood and momentum with key indicators"
  },
  { 
    text: "Sector Rotation Strategy", 
    query: "Explain sector rotation strategy and its current applicability.",
    description: "Examine advanced portfolio management techniques"
  },
  { 
    text: "Impact of Interest Rates", 
    query: "How do changes in federal interest rates typically impact stock market sectors?",
    description: "Understand macroeconomic influences on stocks"
  }
];

function ChatPage({ currentTheme }) {
  const { authFetch, token } = useAuth();

  const initialChatMessages = useCallback(() => [ 
    {
      id: 'chatmsg-initial-1',
      text: `Welcome to FinSight Chat! I'm ready to help with stock analysis, market news, and sentiment. How can I assist you today?`,
      sender: 'bot',
      type: 'greeting'
    }
  ], []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatMode, setChatMode] = useState('newbie');
  const [currentDisplayedPrompts, setCurrentDisplayedPrompts] = useState(newbieSuggestionPrompts);
  const [currentLoadingText, setCurrentLoadingText] = useState(LOADING_MESSAGES[0]);
  const [expandedCitations, setExpandedCitations] = useState({});
  const loadingMessageIndexRef = useRef(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/history`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
        setSelectedChat(null);
      } else {
        console.error('Failed to fetch chat history:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, [authFetch, token]);

  useEffect(() => {
    fetchChatHistory();
    setMessages(initialChatMessages());
    setCurrentDisplayedPrompts(chatMode === 'newbie' ? newbieSuggestionPrompts : veteranSuggestionPrompts);
  }, [fetchChatHistory, initialChatMessages, chatMode]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let loadingInterval;
    if (isLoading) {
      loadingMessageIndexRef.current = 0; // Reset index when loading starts
      setCurrentLoadingText(LOADING_MESSAGES[loadingMessageIndexRef.current]);
      
      loadingInterval = setInterval(() => {
        if (loadingMessageIndexRef.current < LOADING_MESSAGES.length - 1) {
          loadingMessageIndexRef.current += 1;
          setCurrentLoadingText(LOADING_MESSAGES[loadingMessageIndexRef.current]);
        } else {
          // Optionally, clear interval if you want it to stop on the last message
          // clearInterval(loadingInterval);
          // Or just let it stay on the last message
        }
      }, 1800); // Change message every 1.8 seconds (adjust as needed)
    } else {
      clearInterval(loadingInterval);
    }
    return () => clearInterval(loadingInterval); // Cleanup on unmount or when isLoading changes
  }, [isLoading]);

  useEffect(() => {
    if (chatMode === 'newbie') {
      setCurrentDisplayedPrompts(newbieSuggestionPrompts);
    } else {
      setCurrentDisplayedPrompts(veteranSuggestionPrompts);
    }
  }, [chatMode]);

  const processAndAddMessage = async (text, sender) => {
    const newMessage = {
      id: `chatmsg-${Date.now()}`,
      text: text,
      sender: sender,
      timestamp: new Date().toISOString()
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setShowSuggestions(false);

    if (sender === 'user') {
      setIsLoading(true);
      try {
        const backendType = chatMode === 'newbie' ? 'newbie' : 'chat';
        
        const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: backendType,
            user_query: text,
            conversation_id: conversationId
          })
        });

        if (!response.ok) {
          let errorDetail = 'Failed to get response from server';
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) { /* ignore if response is not json */ }
          throw new Error(errorDetail);
        }

        const data = await response.json();
        
        if (!conversationId) {
          setConversationId(data.conversation_id);
          setChatHistory(prev => [...prev, {
            id: data.conversation_id,
            title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            timestamp: new Date().toISOString(),
            type: backendType
          }]);
        }

        let botResponseText = 'Sorry, I could not generate a response.';
        let citations = [];
        
        if (data.response?.type === 'completion' && 
            data.response?.data?.choices?.[0]?.message) {
          botResponseText = data.response.data.choices[0].message.content;
          
          // Extract citations if available
          if (data.response.citations) {
            citations = data.response.citations;
          }
        }

        const botResponse = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: botResponseText,
          citations: citations,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          id: `chatmsg-error-${Date.now()}`,
          text: 'Sorry, there was an error processing your request. Please try again.',
          sender: 'bot',
          type: 'error',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      processAndAddMessage(input, 'user');
      setInput('');
    }
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleChatSelect = async (chatId) => {
    if (chatId !== selectedChat) {
      try {
        const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
          setConversationId(chatId);
          setSelectedChat(chatId);
          setShowSuggestions(false);
          
          // Set chat mode based on the selected chat's type
          const selectedChatData = chatHistory.find(chat => chat.id === chatId);
          if (selectedChatData) {
            const mode = selectedChatData.type === 'newbie' ? 'newbie' : 'veteran';
            setChatMode(mode);
          }
        } else {
          console.error('Failed to load chat:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    }
  };

  const handleNewChat = () => {
    setMessages(initialChatMessages());
    setConversationId(null);
    setSelectedChat(null);
    setShowSuggestions(true);
    setChatMode('newbie');
    inputRef.current?.focus();
  };

  const handleModeChange = (mode) => {
    setChatMode(mode);
  };

  const toggleCitations = (messageId) => {
    setExpandedCitations(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const renderCitations = (message) => {
    if (!message.citations || message.citations.length === 0) {
      return null;
    }

    const isExpanded = expandedCitations[message.id];
    const citationCount = message.citations.length;

    return (
      <div className="citations-container">
        <button 
          className="citations-toggle"
          onClick={() => toggleCitations(message.id)}
        >
          <span className="citations-count">{citationCount} source{citationCount !== 1 ? 's' : ''}</span>
          <FiChevronDown className={`citations-chevron ${isExpanded ? 'expanded' : ''}`} />
        </button>
        
        {isExpanded && (
          <div className="citations-list">
            {message.citations.map((url, index) => (
              <div key={index} className="citation-item">
                <span className="citation-number">[{index + 1}]</span>
                <div className="citation-content">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="citation-link"
                  >
                    <span className="citation-title">{url}</span>
                    <FiExternalLink className="citation-external-icon" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    return (
      <div className="message-content">
        <div className="message-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        {renderCitations(message)}
      </div>
    );
  };

  return (
    <div className={`chat-page-container page-theme-${currentTheme}`}>
      
      <div className="chat-layout" ref={chatContainerRef}>
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Chat History</h3>
            <button 
              className="new-chat-button"
              onClick={handleNewChat}
            >
              <FiPlus className="button-icon" />
              New Chat
            </button>
          </div>
          <div className={`mode-selector ${chatMode}-active`}>
            <button 
              className={`mode-button ${chatMode === 'newbie' ? 'active' : ''}`}
              onClick={() => handleModeChange('newbie')}
            >
              Newbie
            </button>
            <button 
              className={`mode-button ${chatMode === 'veteran' ? 'active' : ''}`}
              onClick={() => handleModeChange('veteran')}
            >
              Veteran
            </button>
          </div>
          <div className="chat-history-list">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`chat-history-item ${selectedChat === chat.id ? 'selected' : ''}`}
                onClick={() => handleChatSelect(chat.id)}
              >
                <div className="chat-history-title">{chat.title || 'Untitled Chat'}</div>
                <div className="chat-history-meta">
                  <span className="chat-date">
                    <FiClock className="icon-small" />
                    {(() => {
                      if (!chat.timestamp) return 'No date';
                      const date = new Date(chat.timestamp);
                      // Check if the date is valid before attempting to format
                      return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid date';
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender} ${message.type === 'error' ? 'error-message' : ''}`}
              >
                {renderMessageContent(message)}
              </div>
            ))}
            {isLoading && (
              <div className="message bot typing-indicator">
                <div className="message-content">
                  <div className="message-text">
                    <em>{currentLoadingText}</em>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length <= 2 && (
            <div className="suggestion-area">
              <p className="suggestion-area-title">Try asking:</p>
              <div className="suggestion-chips-container">
                {currentDisplayedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(prompt.query)}
                    title={prompt.description}
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-input">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isLoading ? "Processing..." : "Ask FinSight..."}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
            >
              <FiSend className="button-icon" />
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage; 