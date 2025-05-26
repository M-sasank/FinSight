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
      setError(null); // Clear previous errors

      const apiTopics = activeCategory === 'all' ? '' : activeCategory;
      const response = await fetch('/api/v1/news/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topics: apiTopics }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      setNewsData(data);
      if (data.last_updated) {
        setLastUpdated(new Date(data.last_updated));
      } else {
        setLastUpdated(new Date()); // Fallback if last_updated is not in response
      }
      
      // Set the first story as featured, as 'importance' is not available in the new data structure
      setFeaturedStory(data.news_items && data.news_items.length > 0 ? data.news_items[0] : null);
      
    } catch (err) {
      setError(`Failed to fetch news data: ${err.message}. Please ensure the backend is running and the endpoint is correct.`);
      console.error('Error fetching news:', err);
      setNewsData(null); 
      setFeaturedStory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
  }, [activeCategory]); // Refetch when activeCategory changes

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date not available";
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString; // Return original string if formatting fails
    }
  };

  const formatTimeAgo = (date) => {
    try {
      if (!date) return 'a while ago';
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
      return date ? formatDate(date.toISOString()) : "recently";
    }
  };

  const handleRefresh = () => {
    fetchNewsData();
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'var(--finsight-success)';
      case 'negative': return 'var(--finsight-error)';
      default: return 'var(--finsight-text-secondary)'; // For neutral or undefined
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

  const filteredNews = newsData && newsData.news_items ? (
    activeCategory === 'all'
      ? newsData.news_items
      // Filtering will likely not work as expected if 'item.category' is missing from backend response
      : newsData.news_items.filter(item => item.category === activeCategory) 
  ) : [];

  const renderNewsCard = (item, isFeatured = false, keyVal) => {
    const CardComponent = 'article'; // No need to switch component type based on isFeatured
    const cardClassName = isFeatured ? 'news-featured-card news-card' : 'news-card'; // Combine classes
    const contentClassName = isFeatured ? 'news-featured-content' : 'news-card-content';
    const titleClassName = isFeatured ? 'news-featured-title' : 'news-title';
    const summaryClassName = isFeatured ? 'news-featured-summary' : 'news-summary';
    const metaClassName = isFeatured ? 'news-featured-meta' : 'news-meta';

    const imageQueryCategory = item.category || (item.title && item.title.includes(" ") ? item.title.split(" ")[0].toLowerCase() : (item.title ? item.title.toLowerCase() : 'finance'));
    const imageUrl = item.image_url || `https://source.unsplash.com/1200x800/?${imageQueryCategory},news&auto=format&fit=crop&q=80`;
    const displayImage = true; // Always attempt to display an image (original or fallback)

    return (
      <CardComponent
        key={keyVal} // Key is passed from the map function
        className={`${cardClassName} ${item.importance === 'high' ? 'highlight' : ''} ${displayImage ? 'has-image' : ''}`}
      >
        {displayImage && (
          <div className="news-card-image">
            <img 
              src={imageUrl} 
              alt={item.title || 'News image'}
              loading={isFeatured ? "eager" : "lazy"}
              onError={(e) => {
                e.target.onerror = null; // prevent loop
                e.target.src = `https://source.unsplash.com/1200x800/?abstract,${imageQueryCategory}&auto=format&fit=crop&q=80`; // More generic fallback
              }}
            />
            {/* Display category badge only if item.category exists */}
            {item.category && (
              <div className="news-card-image-overlay">
                <span className="news-category-badge">
                  {categories.find(cat => cat.id === item.category)?.label || item.category}
                </span>
              </div>
            )}
          </div>
        )}
        <div className={contentClassName}>
          <div className={isFeatured ? 'news-featured-header' : 'news-card-header'}>
            {isFeatured && <span className="news-featured-badge">Featured Story</span>}
            {/* Display sentiment badge only if item.sentiment exists */}
            {item.sentiment && (
              <span 
                className="news-sentiment-badge"
                style={{ backgroundColor: getSentimentColor(item.sentiment) }}
              >
                {item.sentiment}
              </span>
            )}
            {/* Display importance badge only if item.importance is 'high' */}
            {item.importance === 'high' && (
              <span className="news-importance-badge">Important</span>
            )}
          </div>
          <h2 className={titleClassName}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title || "Untitled News"}
              <FiArrowUpRight className="external-link-icon" />
            </a>
          </h2>
          <p className={summaryClassName}>{item.summary || "No summary available for this article."}</p>
          <div className={metaClassName}>
            <span className="news-source">
              <FiFileText />
              {item.source || "Unknown Source"}
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
        {/* Pass key for featured story */}
        {featuredStory && activeCategory === 'all' && newsData && newsData.news_items && 
          renderNewsCard(featuredStory, true, featuredStory.url || 'featured-story')
        }

        {filteredNews.length === 0 && newsData ? ( // Ensure newsData is checked to avoid premature empty state during load
          <div className="news-empty-state">
            <p>No news available in this category at the moment.</p>
            <p>Please check back later or try selecting "All News".</p>
          </div>
        ) : (
          <div className="news-grid">
            {/* Ensure key is passed for each card in the grid */}
            {filteredNews.map((item, index) => 
              renderNewsCard(item, false, item.url || `news-item-${index}`)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage; 