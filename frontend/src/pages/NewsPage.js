import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FiExternalLink, 
  FiClock, 
  FiFileText, 
  FiRefreshCw, 
  FiTrendingUp,
  FiBarChart2,
  FiDollarSign,
  FiGlobe,
  FiZap,
  FiArrowUpRight
} from 'react-icons/fi';
import './NewsPage.css';

const NewsPage = ({ currentTheme }) => {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [featuredStory, setFeaturedStory] = useState(null);

  const categories = [
    { id: 'all', label: 'All News', icon: <FiGlobe /> },
    { id: 'markets', label: 'Markets', icon: <FiBarChart2 /> },
    { id: 'economy', label: 'Economy', icon: <FiDollarSign /> },
    { id: 'tech', label: 'Technology', icon: <FiZap /> },
    { id: 'trending', label: 'Trending', icon: <FiTrendingUp /> }
  ];

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      const mockData = {
        news_items: [
          {
            id: 1,
            title: "Moody's Downgrades U.S. Sovereign Credit Rating, Bond Yields Spike",
            summary: "Moody's Investor Services downgraded the U.S. sovereign credit rating by one notch to Aa1 from Aaa, citing the federal government's large and growing deficit and rising interest costs. This follows earlier downgrades from S&P and Fitch. The downgrade drove the 30-year U.S. Treasury yield above 5%, and the 10-year to 4.5%.",
            source: "Nasdaq",
            url: "https://www.nasdaq.com/articles/stock-market-news-may-21-2025",
            published_date: "2025-05-21",
            category: "markets",
            importance: "high",
            sentiment: "negative",
            image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 2,
            title: "Tech Giants Announce Major AI Investment Plans",
            summary: "Leading technology companies have unveiled ambitious AI investment strategies, with combined commitments exceeding $100 billion over the next five years. The investments aim to accelerate AI research and development, focusing on generative AI, machine learning infrastructure, and ethical AI frameworks.",
            source: "Bloomberg",
            url: "https://www.bloomberg.com/tech-news",
            published_date: "2025-05-20",
            category: "tech",
            importance: "high",
            sentiment: "positive",
            image_url: "https://images.unsplash.com/photo-1676299081847-3a8f2d1b5e5d?auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 3,
            title: "Federal Reserve Signals Potential Rate Cut in Q3",
            summary: "The Federal Reserve has indicated a possible interest rate reduction in the third quarter, citing improved inflation metrics and economic stability. Market analysts predict a 25-basis-point cut, which could impact mortgage rates and consumer borrowing costs.",
            source: "Financial Times",
            url: "https://www.ft.com/markets",
            published_date: "2025-05-19",
            category: "economy",
            importance: "high",
            sentiment: "positive",
            image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 4,
            title: "Global Markets React to Emerging Market Currency Volatility",
            summary: "Major emerging market currencies experienced significant volatility following the U.S. credit rating downgrade. The Brazilian Real, Indian Rupee, and South African Rand showed notable movements, prompting central bank interventions in several countries.",
            source: "Reuters",
            url: "https://www.reuters.com/markets",
            published_date: "2025-05-18",
            category: "markets",
            importance: "medium",
            sentiment: "neutral",
            image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 5,
            title: "Renewable Energy Stocks Surge on New Climate Policy",
            summary: "Shares of renewable energy companies jumped following the announcement of new climate policies and increased government subsidies. Solar and wind energy stocks led the gains, with several companies hitting new 52-week highs.",
            source: "CNBC",
            url: "https://www.cnbc.com/markets",
            published_date: "2025-05-17",
            category: "trending",
            importance: "medium",
            sentiment: "positive",
            image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 6,
            title: "Major Bank Announces Blockchain Integration for Cross-Border Payments",
            summary: "A leading global bank has revealed plans to integrate blockchain technology into its cross-border payment systems, promising faster transactions and reduced costs. The move is expected to revolutionize international money transfers and could save billions in transaction fees.",
            source: "Wall Street Journal",
            url: "https://www.wsj.com/finance",
            published_date: "2025-05-16",
            category: "tech",
            importance: "medium",
            sentiment: "positive",
            image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=1200&q=80"
          }
        ],
        total_items: 6,
        last_updated: new Date().toISOString()
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNewsData(mockData);
      setLastUpdated(new Date(mockData.last_updated));
      // Set the first high-importance story as featured
      const featured = mockData.news_items.find(item => item.importance === 'high');
      setFeaturedStory(featured || mockData.news_items[0]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch news data. Please try again later.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };

  const formatTimeAgo = (date) => {
    try {
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }
      
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting time ago:', err);
      return formatDate(date);
    }
  };

  const handleRefresh = () => {
    fetchNewsData();
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'var(--finsight-success)';
      case 'negative': return 'var(--finsight-error)';
      default: return 'var(--finsight-text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className={`news-page-container page-theme-${currentTheme}`}>
        <div className="news-page-header">
          <div className="news-header-content">
            <h1>Trending Financial News</h1>
          </div>
        </div>
        <div className="news-loading-container">
          <div className="news-loading-spinner">
            <FiRefreshCw className="spinning" />
          </div>
          <p>Loading latest market insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`news-page-container page-theme-${currentTheme}`}>
        <div className="news-page-header">
          <div className="news-header-content">
            <h1>Trending Financial News</h1>
          </div>
        </div>
        <div className="news-error-container">
          <p className="news-error-message">{error}</p>
          <button className="news-retry-button" onClick={handleRefresh}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredNews = activeCategory === 'all' 
    ? newsData.news_items 
    : newsData.news_items.filter(item => item.category === activeCategory);

  const renderNewsCard = (item, isFeatured = false) => {
    const CardComponent = isFeatured ? 'article' : 'article';
    const cardClassName = isFeatured ? 'news-featured-card' : 'news-card';
    const contentClassName = isFeatured ? 'news-featured-content' : 'news-card-content';
    const titleClassName = isFeatured ? 'news-featured-title' : 'news-title';
    const summaryClassName = isFeatured ? 'news-featured-summary' : 'news-summary';
    const metaClassName = isFeatured ? 'news-featured-meta' : 'news-meta';

    return (
      <CardComponent 
        key={item.id} 
        className={`${cardClassName} ${item.importance === 'high' ? 'highlight' : ''} ${item.image_url ? 'has-image' : ''}`}
      >
        {item.image_url && (
          <div className="news-card-image">
            <img 
              src={item.image_url} 
              alt={item.title}
              loading={isFeatured ? "eager" : "lazy"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://source.unsplash.com/1200x800/?${item.category},finance&auto=format&fit=crop&q=80`;
              }}
            />
            <div className="news-card-image-overlay">
              <span className="news-category-badge">
                {categories.find(cat => cat.id === item.category)?.label || item.category}
              </span>
            </div>
          </div>
        )}
        <div className={contentClassName}>
          <div className={isFeatured ? 'news-featured-header' : 'news-card-header'}>
            {isFeatured && <span className="news-featured-badge">Featured Story</span>}
            <span 
              className="news-sentiment-badge"
              style={{ backgroundColor: getSentimentColor(item.sentiment) }}
            >
              {item.sentiment}
            </span>
            {item.importance === 'high' && (
              <span className="news-importance-badge">Important</span>
            )}
          </div>
          <h2 className={titleClassName}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
              <FiArrowUpRight className="external-link-icon" />
            </a>
          </h2>
          <p className={summaryClassName}>{item.summary}</p>
          <div className={metaClassName}>
            <span className="news-source">
              <FiFileText />
              {item.source}
            </span>
            <span className="news-date">
              <FiClock />
              {formatDate(item.published_date)}
            </span>
          </div>
        </div>
      </CardComponent>
    );
  };

  return (
    <div className={`news-page-container page-theme-${currentTheme}`}>
      <div className="news-page-header">
        <div className="news-header-content">
          <div className="news-header-main">
            <h1>Trending Financial News</h1>
            <p className="news-header-subtitle">
              Stay ahead with real-time market insights and breaking financial news
            </p>
          </div>
          {lastUpdated && (
            <div className="news-last-updated">
              <FiClock />
              <span>Last updated {formatTimeAgo(lastUpdated)}</span>
              <button 
                className="news-refresh-button" 
                onClick={handleRefresh} 
                title="Refresh news"
                aria-label="Refresh news"
              >
                <FiRefreshCw />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="news-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`news-category-button ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="news-content">
        {featuredStory && activeCategory === 'all' && renderNewsCard(featuredStory, true)}

        {filteredNews.length === 0 ? (
          <div className="news-empty-state">
            <p>No news available in this category.</p>
            <p>Please check back later or try another category.</p>
          </div>
        ) : (
          <div className="news-grid">
            {filteredNews.map(item => renderNewsCard(item))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage; 