import React, { useState, useEffect, useRef } from 'react';

function ChatPage({ navigateTo, currentTheme, setCurrentTheme }) {
  const initialChatMessages = () => [ // Function to get initial messages
    {
      id: 'chatmsg-initial-1',
      text: `Welcome to FinSight Chat! You are currently in "${currentTheme}" mode. I'm ready to help with stock analysis, market news, and sentiment. How can I assist you today?`,
      sender: 'bot',
      type: 'greeting'
    }
  ];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialChatMessages());
    setInput('');
    setConversationId(null); // Reset conversation ID when theme changes
  }, [currentTheme]); // Refreshes messages if theme changes AND on initial mount for the current theme

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
        
        const response = await fetch(`http://localhost:8000/chat?type=${backendType}&user_query=${encodeURIComponent(text)}${conversationId ? `&conversation_id=${conversationId}` : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        
        // Update conversation ID if this is a new conversation
        if (!conversationId) {
          setConversationId(data.conversation_id);
        }

        // Add bot response to messages
        const botResponse = {
          id: `chatmsg-${Date.now() + 1}`,
          sender: 'bot',
          text: data.response.data.choices[0].message.content
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
            <button onClick={() => navigateTo('landing')} className="chat-nav-button home-button">
                <span role="img" aria-label="Home">🏠</span> Go to Home Page
            </button>
            <div className="profile-selector">
                <span className="selector-label">User Profile:</span>
                <div className="profile-buttons-group">
                    <button
                        onClick={() => setCurrentTheme('newtimer')}
                        className={`profile-button ${currentTheme === 'newtimer' ? 'active' : ''}`}
                    >
                        Newtimer
                    </button>
                    <button
                        onClick={() => setCurrentTheme('veteran')}
                        className={`profile-button ${currentTheme === 'veteran' ? 'active' : ''}`}
                    >
                        Veteran
                    </button>
                </div>
            </div>
        </div>
        <div className="chat-container">
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
  );
}

export default ChatPage; 