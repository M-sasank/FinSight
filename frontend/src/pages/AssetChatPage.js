import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AssetChatPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestionPrompts = [
    { text: "Analyze recent performance", query: `What's driving ${symbol}'s recent price movement?` },
    { text: "Compare to competitors", query: `How does ${symbol} compare to its main competitors?` },
    { text: "Future outlook", query: `What's the future outlook for ${symbol}?` },
    { text: "Key metrics", query: `What are the key financial metrics for ${symbol}?` },
    { text: "Risk factors", query: `What are the main risk factors for ${symbol}?` }
  ];

  useEffect(() => {
    // Add initial greeting message
    setMessages([{
      id: 'chatmsg-initial-1',
      text: `Welcome to the ${symbol} chat! Ask me anything about this asset.`,
      sender: 'bot',
      type: 'greeting'
    }]);
  }, [symbol]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (query) => {
    setInput(query);
    document.querySelector('.chat-input input').focus();
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/asset-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_query: input,
            symbol: symbol,
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
        }

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

  return (
    <div className="chat-page-container">
      <div className="chat-page-header">
        <button 
          className="chat-nav-button home-button"
          onClick={() => navigate('/tracker')}
        >
          ← Back to Tracker
        </button>
        <h2>{symbol} Chat</h2>
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
            placeholder={isLoading ? "Processing..." : `Ask about ${symbol}...`}
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

export default AssetChatPage; 