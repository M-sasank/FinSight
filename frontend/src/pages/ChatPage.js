import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiPlus, FiClock, FiMessageSquare } from 'react-icons/fi';
import './ChatPage.css';

function ChatPage({ currentTheme, setCurrentTheme }) {
  const initialChatMessages = useCallback(() => [ 
    {
      id: 'chatmsg-initial-1',
      text: `Welcome to FinSight Chat! You are currently in "${currentTheme}" mode. I'm ready to help with stock analysis, market news, and sentiment. How can I assist you today?`,
      sender: 'bot',
      type: 'greeting'
    }
  ], [currentTheme]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Mode-specific suggestion prompts with enhanced descriptions
  const suggestionPrompts = {
    newtimer: [
      { 
        text: "What is a stock?", 
        query: "Can you explain what a stock is in simple terms?",
        description: "Learn the basics of stocks and how they work"
      },
      { 
        text: "How do I start investing?", 
        query: "What are the first steps I should take to start investing?",
        description: "Begin your investment journey with confidence"
      },
      { 
        text: "Explain market terms", 
        query: "Can you explain some basic market terms I should know?",
        description: "Understand essential financial terminology"
      },
      { 
        text: "Track a stock", 
        query: "How do I track a stock I'm interested in?",
        description: "Learn to monitor stock performance"
      },
      { 
        text: "Market basics", 
        query: "What are the basics I should know about the stock market?",
        description: "Get started with market fundamentals"
      }
    ],
    veteran: [
      { 
        text: "Technical Analysis", 
        query: "Show me the technical analysis for AAPL",
        description: "Deep dive into technical indicators and patterns"
      },
      { 
        text: "Compare P/E Ratios", 
        query: "Compare the P/E ratios of AAPL, MSFT, and GOOGL",
        description: "Analyze valuation metrics across tech giants"
      },
      { 
        text: "Market Sentiment", 
        query: "What's the current market sentiment and key indicators?",
        description: "Evaluate market mood and momentum"
      },
      { 
        text: "Sector Analysis", 
        query: "Analyze the tech sector's performance and outlook",
        description: "Examine sector trends and opportunities"
      },
      { 
        text: "Options Strategy", 
        query: "What are some effective options strategies for the current market?",
        description: "Explore advanced trading strategies"
      }
    ]
  };

  useEffect(() => {
    fetchChatHistory();
    // Initialize with a new chat on first load
    setMessages(initialChatMessages());
  }, [initialChatMessages]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/history`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  useEffect(() => {
    const handleThemeTransition = async () => {
      setIsTransitioning(true);
      setShowSuggestions(false);
      
      // Add a transition message with enhanced animation
      const transitionMessage = {
        id: `chatmsg-transition-${Date.now()}`,
        text: `Switching to ${currentTheme} mode...`,
        sender: 'bot',
        type: 'transition'
      };
      setMessages(prev => [...prev, transitionMessage]);
      
      // Enhanced transition animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear messages and set new initial message
      setMessages(initialChatMessages());
      setInput('');
      setConversationId(null);
      
      // Reset states with delay for smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
        setShowSuggestions(true);
      }, 300);
    };

    handleThemeTransition();
  }, [currentTheme, initialChatMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
        const backendType = currentTheme === 'newtimer' ? 'newbie' : 'chat';
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/send`, {
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
          throw new Error('Failed to get response from server');
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
        if (data.response?.type === 'completion' && 
            data.response?.data?.choices?.[0]?.message) {
          botResponseText = data.response.data.choices[0].message.content;
        }

        const botResponse = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: botResponseText,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: 'Sorry, I encountered an error while processing your request. Please try again.',
          type: 'error',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setShowSuggestions(true);
      }
    }
  };

  const handleSendMessage = () => {
    if (input.trim() && !isLoading && !isTransitioning) {
      processAndAddMessage(input, 'user');
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (query) => {
    if (!isTransitioning) {
      setInput(query);
      inputRef.current?.focus();
    }
  };

  const handleThemeChange = (theme) => {
    if (!isTransitioning && theme !== currentTheme) {
      setCurrentTheme(theme);
    }
  };

  const handleChatSelect = async (chatId) => {
    if (!isTransitioning && chatId !== selectedChat) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
          setConversationId(chatId);
          setSelectedChat(chatId);
          
          const selectedChatData = chatHistory.find(chat => chat.id === chatId);
          if (selectedChatData) {
            const newTheme = selectedChatData.type === 'newbie' ? 'newtimer' : 'veteran';
            if (newTheme !== currentTheme) {
              setCurrentTheme(newTheme);
            }
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    }
  };

  const handleNewChat = () => {
    if (!isTransitioning) {
      setMessages(initialChatMessages());
      setConversationId(null);
      setSelectedChat(null);
      setShowSuggestions(true);
      inputRef.current?.focus();
    }
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
        <div className="message-text">{message.text}</div>
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`chat-page-container page-theme-${currentTheme} ${isTransitioning ? 'theme-transitioning' : ''}`}>
      <div className="chat-page-header">
      </div>
      
      <div className="chat-layout" ref={chatContainerRef}>
        <div className="chat-sidebar">
          <div className="profile-selector" style={{ marginBottom: '16px' }}>
            <span className="selector-label">Experience Level</span>
            <div className="profile-buttons-group">
              <button
                className={`profile-button ${currentTheme === 'newtimer' ? 'active' : ''}`}
                onClick={() => handleThemeChange('newtimer')}
                disabled={isTransitioning}
              >
                <FiMessageSquare className="button-icon" />
                Newtimer
              </button>
              <button
                className={`profile-button ${currentTheme === 'veteran' ? 'active' : ''}`}
                onClick={() => handleThemeChange('veteran')}
                disabled={isTransitioning}
              >
                <FiMessageSquare className="button-icon" />
                Veteran
              </button>
            </div>
          </div>
          <div className="sidebar-header">
            <h3>Chat History</h3>
            <button 
              className="new-chat-button"
              onClick={handleNewChat}
              disabled={isTransitioning}
            >
              <FiPlus className="button-icon" />
              New Chat
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
                  <span className="chat-type">
                    {chat.type === 'newbie' ? 'Newtimer' : 'Veteran'}
                  </span>
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
                className={`message ${message.sender} ${message.type === 'transition' ? 'transition-message' : ''} ${message.type === 'error' ? 'error-message' : ''}`}
              >
                {renderMessageContent(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length <= 2 && !isTransitioning && (
            <div className="suggestion-area">
              <p className="suggestion-area-title">Try asking:</p>
              <div className="suggestion-chips-container">
                {suggestionPrompts[currentTheme].map((prompt, index) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(prompt.query)}
                    disabled={isTransitioning}
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
              placeholder={isLoading ? "Processing..." : isTransitioning ? "Switching modes..." : "Ask FinSight..."}
              disabled={isLoading || isTransitioning}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isLoading || isTransitioning || !input.trim()}
            >
              <FiSend className="button-icon" />
              {isLoading ? "Sending..." : isTransitioning ? "Switching..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage; 