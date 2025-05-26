import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiPlus, FiClock } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatPage.css';

function ChatPage({ currentTheme }) {
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
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Veteran mode suggestion prompts (since we're using dark theme by default)
  const suggestionPrompts = [
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
  ];

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
        // Always use 'chat' backend type since we're using veteran theme
        const backendType = 'chat';
        
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
          setConversationId(chatId);
          setSelectedChat(chatId);
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
    inputRef.current?.focus();
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
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length <= 2 && (
            <div className="suggestion-area">
              <p className="suggestion-area-title">Try asking:</p>
              <div className="suggestion-chips-container">
                {suggestionPrompts.map((prompt, index) => (
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