import React, { useState, useEffect, useRef, useCallback } from 'react';

function ChatPage({ currentTheme, setCurrentTheme }) {
  const initialChatMessages = useCallback(() => [ 
    {
      id: 'chatmsg-initial-1',
      text: `Welcome to FinSight Chat! You are currently in "${currentTheme}" mode. I'm ready to help with stock analysis, market news, and sentiment. How can I assist you today?`,
      sender: 'bot',
      type: 'greeting'
    }
  ], [currentTheme]); // Add currentTheme as dependency since it's used in the function

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/history');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  useEffect(() => {
    setMessages(initialChatMessages());
    setInput('');
    setConversationId(null); 
  }, [currentTheme, initialChatMessages]); 

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

  const processAndAddMessage = async (text, sender) => {
    const newMessage = {
      id: `chatmsg-${Date.now()}`,
      text: text,
      sender: sender,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    if (sender === 'user') {
      setIsLoading(true);
      try {
        // Map frontend theme to backend type
        const backendType = currentTheme === 'newtimer' ? 'newbie' : 'chat';
        
        const response = await fetch('http://localhost:8000/api/v1/chat', {
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
        
        // Update conversation ID if this is a new conversation
        if (!conversationId) {
          setConversationId(data.conversation_id);
          // Add new chat to history
          setChatHistory(prev => [...prev, {
            id: data.conversation_id,
            title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            timestamp: new Date().toISOString(),
            type: backendType
          }]);
        }

        // Add bot response to messages
        let botResponseText = 'Sorry, I could not generate a response.';
        if (data.response && data.response.type === 'completion' && 
            data.response.data && data.response.data.choices && 
            data.response.data.choices[0] && data.response.data.choices[0].message) {
          botResponseText = data.response.data.choices[0].message.content;
        }

        const botResponse = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: botResponseText
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error:', error);
        // Add error message to chat
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

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      processAndAddMessage(input, 'user');
      setInput('');
    }
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
    document.querySelector('.chat-input input').focus();
  };

  const handleThemeChange = (e) => {
    setCurrentTheme(e.target.value);
  };

  const handleChatSelect = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/chat/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setConversationId(chatId);
        setSelectedChat(chatId);
        
        const selectedChatData = chatHistory.find(chat => chat.id === chatId);
        if (selectedChatData) {
          const newTheme = selectedChatData.type === 'newbie' ? 'newtimer' : 'veteran';
          setCurrentTheme(newTheme);
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
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
    return message.text;
  };

  return (
    <div className={`chat-page-container page-theme-${currentTheme}`}>
        <div className="chat-page-header">
            <div className="profile-selector">
                <span className="selector-label">User Profile:</span>
                <select 
                    value={currentTheme} 
                    onChange={handleThemeChange}
                    className="profile-dropdown"
                >
                    <option value="newtimer">Newtimer</option>
                    <option value="veteran">Veteran</option>
                </select>
            </div>
        </div>
        <div className="chat-layout">
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Chat History</h3>
                    <button 
                        className="new-chat-button"
                        onClick={() => {
                            setMessages(initialChatMessages());
                            setConversationId(null);
                            setSelectedChat(null);
                        }}
                    >
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
                            <div className="chat-history-title">{chat.title}</div>
                            <div className="chat-history-meta">
                                <span className="chat-type">{chat.type}</span>
                                <span className="chat-date">
                                    {new Date(chat.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="chat-main">
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
                    placeholder={isLoading ? "Processing..." : "Ask FinSight..."}
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

export default ChatPage; 