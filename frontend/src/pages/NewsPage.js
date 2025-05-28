import React, { useEffect, useState } from 'react';
import './NewsPage.css';
import { useAuth } from '../contexts/AuthContext';
// import NewsPageLoader from '../components/NewsPageLoader'; // No longer using this
import MarketTrendsAnimation from '../components/MarketTrendsAnimation'; // Use this instead

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';

// Define loading phrases
const newsLoadingPhrases = [
  "Fetching the latest headlines...",
  "Scanning top financial news sources...",
  "Analyzing market-moving stories...",
  "Compiling your news digest...",
  "Getting real-time updates..."
];

const NewsPage = () => {
  const { authFetch } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [activeArticleIndex, setActiveArticleIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTopics, setActiveSearchTopics] = useState('');

  // State for dynamic loading text
  const [currentLoadingPhraseIndex, setCurrentLoadingPhraseIndex] = useState(0);

  // Effect for cycling through loading phrases
  useEffect(() => {
    let phraseInterval;
    if (loading) {
      setCurrentLoadingPhraseIndex(0); // Start from the first phrase each time loading starts
      phraseInterval = setInterval(() => {
        setCurrentLoadingPhraseIndex(prevIndex => 
          (prevIndex + 1) % newsLoadingPhrases.length
        );
      }, 2500); // Change phrase every 2.5 seconds
    } else {
      clearInterval(phraseInterval);
    }
    return () => clearInterval(phraseInterval); // Cleanup on unmount or when loading changes
  }, [loading]);

  const handleEffectClick = (index) => {
    setActiveArticleIndex(index);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    setActiveArticleIndex(null);
  };

  const fetchNews = async ({ topics = '', forceReload = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (forceReload) {
        params.append('force_reload', 'true');
      }
      if (topics) {
        params.append('topics', topics);
      }
      
      let apiUrl = '/api/v1/news/';
      const paramString = params.toString();
      if (paramString) {
        apiUrl += `?${paramString}`;
      }

      const response = await authFetch(apiUrl, { method: 'POST' });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response Text:", errorText);
        throw new Error(`Failed to fetch news. Status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Fetched raw responseData type:', typeof responseData);
      console.log('Fetched raw responseData content:', responseData);

      if (responseData && responseData.news_data) {
        const actualNewsPayload = responseData.news_data;
        console.log('Actual news payload type:', typeof actualNewsPayload);
        console.log('Actual news payload content:', actualNewsPayload);

        let parsedDataForArticles;
        if (typeof actualNewsPayload === 'string') {
          try {
            parsedDataForArticles = JSON.parse(actualNewsPayload);
          } catch (e) {
            console.error('Failed to parse JSON string from actualNewsPayload:', e);
            throw new Error('Received malformed news data string within news_data.');
          }
        } else {
          parsedDataForArticles = actualNewsPayload;
        }
        
        console.log('Data used for setting articles (from parsedDataForArticles):', parsedDataForArticles);

        if (parsedDataForArticles && parsedDataForArticles.news_items) {
          setArticles(parsedDataForArticles.news_items);
        } else {
          setArticles([]);
          console.warn('news_items not found in parsed data or parsed data is null.');
        }

        if (responseData.retrieved_from_cache) {
          console.log("Fetched news from cache.");
        } else {
          console.log("Fetched fresh news from API.");
        }

      } else {
        console.error('Unexpected responseData structure:', responseData);
        setArticles([]);
        throw new Error('Received unexpected news data structure from server.');
      }

    } catch (err) {
      console.error("Error in fetchNews process:", err);
      setError(err.message || 'Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [authFetch]);

  const handleReload = () => {
    fetchNews({ topics: activeSearchTopics, forceReload: true });
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const formattedTopics = searchQuery.trim().split(/\s+/).filter(Boolean).join(',');
    setActiveSearchTopics(formattedTopics);
    fetchNews({ topics: formattedTopics, forceReload: true });
  };

  if (loading) {
    return (
      <div className="news-page-container news-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', paddingTop: '0' }}>
        {/* <NewsPageLoader />  -- No longer using this */}
        <MarketTrendsAnimation /> {/* Using this for loading state */}
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
          {newsLoadingPhrases[currentLoadingPhraseIndex]}<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-page-container" style={{ maxWidth: 900, margin: '0 auto', paddingTop: 40 }}>
        <div style={{ textAlign: 'center', color: 'red', padding: 40, fontSize: 20 }}>{error}</div>
        <button onClick={handleClosePopup}>Close</button>
      </div>
    );
  }

  return (
    <div className="news-page-container" style={{ maxWidth: 900, margin: '0 auto', paddingTop: 40, position: 'relative' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexGrow: 1, marginRight: 10 }}>
          <input
            type="text"
            placeholder="Search news topics (e.g., tech earnings, market trends)"
            value={searchQuery}
            onChange={handleSearchInputChange}
            style={{ 
              padding: '10px 15px', 
              fontSize: '16px', 
              border: '1px solid #ccc', 
              borderRadius: '4px 0 0 4px', 
              flexGrow: 1 
            }}
          />
          <button 
            type="submit" 
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: '1px solid #007bff', 
              borderRadius: '0 4px 4px 0', 
              cursor: 'pointer' 
            }}
          >
            Search
          </button>
        </form>
        <button 
          onClick={handleReload} 
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '20px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '50%',
            lineHeight: '1',
          }}
          title="Reload News"
        >
          &#x21BB;
        </button>
      </div>
      {articles.length > 0 ? (
        articles.map((article, idx) => (
          <div key={idx} className="medium-article-card" style={{ display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid #eee', padding: '32px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                {/* <img src={DEFAULT_IMAGE} alt="source icon" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }} /> */}
                <span style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>{article.source || 'Unknown Source'}</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>
                {article.title || 'Untitled Article'}
              </h2>
              <div style={{ fontSize: 18, color: '#555', marginBottom: 18 }}>{article.summary || 'No summary available.'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 15, color: '#888' }}>
                <span>{article.published_date || 'Unknown Date'}</span>
                <button 
                  onClick={() => handleEffectClick(idx)}
                  className="effect-on-you-button"
                >
                  How does this affect me?
                </button>
              </div>
            </div>
            <div style={{ minWidth: 180, maxWidth: 220, height: 150, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <img 
                src={article.image_url || DEFAULT_IMAGE} 
                alt={article.title || 'Article image'} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { e.target.onerror = null; e.target.src=DEFAULT_IMAGE; }} // Fallback to default if image_url fails
              />
            </div>
          </div>
        ))
      ) : (
        !loading && !error && <div style={{ textAlign: 'center', padding: '50px 20px', fontSize: 18, color: '#777' }}>No news articles found.</div>
      )}

      {popupVisible && activeArticleIndex !== null && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={handleClosePopup}
        >
          <div 
            style={{
              backgroundColor: '#fff',
              padding: 40,
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              width: '80%',
              maxWidth: 700,
              maxHeight: '80vh',
              overflowY: 'auto',
              cursor: 'default'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleClosePopup} 
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#555'
              }}
            >
              &times;
            </button>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>How does this news affect you?</h3>
            <p style={{ color: '#555', marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>{articles[activeArticleIndex].effect_on_you || 'No specific effect information available.'}</p>
            
            {articles[activeArticleIndex].affected_asset_symbol && articles[activeArticleIndex].impact_on_asset ? (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
                <h4 style={{ color: '#2c3e50', marginBottom: 8 }}>Impact on Tracked Asset</h4>
                <p style={{ color: '#34495e', fontSize: 16, lineHeight: 1.6 }}>
                  <strong>Asset:</strong> {articles[activeArticleIndex].affected_asset_symbol}<br />
                  <strong>Impact:</strong> {articles[activeArticleIndex].impact_on_asset}
                </p>
              </div>
            ) : (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
                <p style={{ color: '#7f8c8d', fontSize: 15, fontStyle: 'italic' }}>None of your tracked assets are effected by this news item.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage; 