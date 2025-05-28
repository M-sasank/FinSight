import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiInfo, FiChevronDown, FiChevronUp, FiX, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import './TrackerPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function TrackerPage({ currentTheme }) {
  const navigate = useNavigate();
  const { authFetch, token } = useAuth();
  const [assets, setAssets] = useState([]);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRiskAnalysis, setExpandedRiskAnalysis] = useState({});
  const [riskAnalysisData, setRiskAnalysisData] = useState({});
  const [selectedRiskAsset, setSelectedRiskAsset] = useState(null);
  const [activeRiskTab, setActiveRiskTab] = useState('overview');

  const fetchAssets = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Please log in to view tracked assets.");
      setAssets([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/get/`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data);

      // Fetch risk analysis for all assets
      const riskAnalysisPromises = data.map(asset => 
        authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/analyze-risk/${asset.symbol}/`)
          .then(response => {
            if (!response.ok) {
              console.error(`Failed to fetch risk analysis for ${asset.symbol}`);
              return null;
            }
            return response.json();
          })
          .catch(err => {
            console.error(`Error fetching risk analysis for ${asset.symbol}:`, err);
            return null;
          })
      );

      const riskAnalysisResults = await Promise.all(riskAnalysisPromises);
      
      // Update risk analysis data for each asset
      const newRiskAnalysisData = {};
      data.forEach((asset, index) => {
        if (riskAnalysisResults[index]) {
          newRiskAnalysisData[asset.symbol] = riskAnalysisResults[index];
        }
      });
      
      setRiskAnalysisData(prev => ({
        ...prev,
        ...newRiskAnalysisData
      }));

    } catch (err) {
      setError(err.message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, token]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAddAsset = async () => {
    if (newAsset.symbol && newAsset.name) {
      if (!token) {
        setError("Authentication required to add assets.");
        return;
      }
      try {
        setError(null);
        const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAsset),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to create asset');
        }

        const createdAsset = await response.json();
        setAssets([...assets, createdAsset]);
        setNewAsset({ symbol: '', name: '' });
        setShowAddAssetModal(false);

        // Fetch risk analysis for the new asset
        try {
          const riskResponse = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/analyze-risk/${createdAsset.symbol}/`);
          if (riskResponse.ok) {
            const riskData = await riskResponse.json();
            setRiskAnalysisData(prev => ({
              ...prev,
              [createdAsset.symbol]: riskData
            }));
          }
        } catch (err) {
          console.error(`Error fetching risk analysis for ${createdAsset.symbol}:`, err);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!token) {
        setError("Authentication required to delete assets.");
        return;
    }
    try {
      setError(null);
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/delete/?asset_id=${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete asset');
      }

      setAssets(assets.filter(asset => asset.id !== assetId));
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchRiskAnalysis = async (symbol) => {
    if (!token) return;
    try {
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/analyze-risk/${symbol}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk analysis');
      }
      const data = await response.json();
      setRiskAnalysisData(prev => ({
        ...prev,
        [symbol]: data
      }));
    } catch (err) {
      console.error(`Error fetching risk analysis for ${symbol}:`, err);
    }
  };

  const toggleRiskAnalysis = (symbol) => {
    setExpandedRiskAnalysis(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
    if (!riskAnalysisData[symbol]) {
      fetchRiskAnalysis(symbol);
    }
  };

  const openRiskModal = (asset) => {
    setSelectedRiskAsset(asset);
    setActiveRiskTab('overview');
  };

  const closeRiskModal = () => {
    setSelectedRiskAsset(null);
  };

  const renderRiskModal = () => {
    if (!selectedRiskAsset) return null;
    const riskData = riskAnalysisData[selectedRiskAsset.symbol];

    return (
      <div className="risk-modal-overlay" onClick={closeRiskModal}>
        <div className="risk-modal" onClick={e => e.stopPropagation()}>
          <div className="risk-modal-header">
            <div className="risk-modal-title">
              <span className="symbol-name">{selectedRiskAsset.symbol}</span>
              {riskData && (
                <span className={`risk-level ${riskData.risk_level.toLowerCase()}`}>
                  {riskData.risk_level}
                </span>
              )}
            </div>
            <button className="risk-modal-close" onClick={closeRiskModal}>
              <FiX />
            </button>
          </div>
          
          <div className="risk-modal-content">
            <div className="risk-tabs">
              <div 
                className={`risk-tab ${activeRiskTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveRiskTab('overview')}
              >
                Overview
              </div>
              <div 
                className={`risk-tab ${activeRiskTab === 'breakdown' ? 'active' : ''}`}
                onClick={() => setActiveRiskTab('breakdown')}
              >
                Risk Breakdown
              </div>
              <div 
                className={`risk-tab ${activeRiskTab === 'recommendation' ? 'active' : ''}`}
                onClick={() => setActiveRiskTab('recommendation')}
              >
                Recommendation
              </div>
            </div>

            {riskData && (
              <>
                <div className={`risk-tab-content ${activeRiskTab === 'overview' ? 'active' : ''}`}>
                  <div className="risk-metrics-grid">
                    <div className="risk-metric">
                      <div className="risk-metric-label">Volatility Score</div>
                      <div className="risk-metric-value">
                        {riskData.factors.volatility_score}
                      </div>
                    </div>
                    <div className="risk-metric">
                      <div className="risk-metric-label">Sector Trend</div>
                      <div className="risk-metric-value">
                        {riskData.factors.sector_trend_score}
                      </div>
                    </div>
                    <div className="risk-metric">
                      <div className="risk-metric-label">Sentiment</div>
                      <div className="risk-metric-value">
                        {riskData.factors.sentiment_class}
                      </div>
                    </div>
                    <div className="risk-metric">
                      <div className="risk-metric-label">Confidence</div>
                      <div className="risk-metric-value">
                        {(riskData.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`risk-tab-content ${activeRiskTab === 'breakdown' ? 'active' : ''}`}>
                  <div className="risk-breakdown-section">
                    <div className="risk-breakdown-title">
                      <FiActivity className="icon" /> Volatility Analysis
                    </div>
                    <div className="risk-breakdown-content">
                      {riskData.risk_breakdown.volatility}
                    </div>
                  </div>
                  <div className="risk-breakdown-section">
                    <div className="risk-breakdown-title">
                      <FiTrendingUp className="icon" /> Sector Analysis
                    </div>
                    <div className="risk-breakdown-content">
                      {riskData.risk_breakdown.sector}
                    </div>
                  </div>
                  <div className="risk-breakdown-section">
                    <div className="risk-breakdown-title">
                      <FiAlertTriangle className="icon" /> Sentiment Analysis
                    </div>
                    <div className="risk-breakdown-content">
                      {riskData.risk_breakdown.sentiment}
                    </div>
                  </div>
                </div>

                <div className={`risk-tab-content ${activeRiskTab === 'recommendation' ? 'active' : ''}`}>
                  <div className="risk-breakdown-section">
                    <div className="risk-breakdown-title">AI Recommendation</div>
                    <div className="risk-breakdown-content">
                      {riskData.recommendation}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tracker-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracker-page">
        <div className="error-container">
          <FiInfo className="error-icon" />
          <p>Error: {error}</p>
          <button onClick={fetchAssets} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tracker-page">
      <div className="tracker-header">
        <div className="tracker-header-content">
          <h2>Asset Tracker</h2>
          <div className="tracker-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button 
              className="add-asset-button"
              onClick={() => setShowAddAssetModal(true)}
            >
              <FiPlus className="button-icon" />
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {showAddAssetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Asset</h3>
            <div className="input-group">
              <label htmlFor="symbol">Symbol</label>
              <input
                id="symbol"
                type="text"
                placeholder="e.g., AAPL"
                value={newAsset.symbol}
                onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="input-group">
              <label htmlFor="name">Company Name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g., Apple Inc."
                value={newAsset.name}
                onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleAddAsset} className="primary-button">
                Add Asset
              </button>
              <button onClick={() => setShowAddAssetModal(false)} className="secondary-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="assets-grid">
        {filteredAssets.map((asset) => {
          const price = typeof asset.price === 'number' ? asset.price : 0;
          const movement = typeof asset.movement === 'number' ? asset.movement : 0;
          const priceHistory = Array.isArray(asset.price_history) ? asset.price_history : [];
          const sector = typeof asset.sector === 'string' ? asset.sector : 'N/A';
          const newsSnippet = typeof asset.news === 'string' ? asset.news.substring(0, 100) + (asset.news.length > 100 ? '...' : '') : 'N/A';
          const riskData = riskAnalysisData[asset.symbol];

          // Determine risk class for border color
          let riskClass = '';
          if (riskData && riskData.risk_level) {
            if (riskData.risk_level.toLowerCase() === 'low') riskClass = 'risk-low';
            else if (riskData.risk_level.toLowerCase() === 'moderate') riskClass = 'risk-moderate';
            else if (riskData.risk_level.toLowerCase() === 'high') riskClass = 'risk-high';
          }

          return (
            <div key={asset.id} className={`asset-card ${riskClass}`}>
              <div className="asset-card-inner-content">
                <div className="asset-header">
                  <div className="asset-title">
                    <h3>{asset.symbol || 'N/A'}</h3>
                    <span className="asset-name">{asset.name || 'Unknown Asset'}</span>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteAsset(asset.id)}
                    aria-label={`Delete ${asset.symbol || 'asset'}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
                
                <div className="asset-price">
                  <span className="price">${price.toFixed(2)}</span>
                  <span className={`movement ${movement >= 0 ? 'positive' : 'negative'}`}>
                    {movement >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    {movement >= 0 ? '+' : ''}{movement.toFixed(2)}%
                  </span>
                </div>

                <div className="asset-chart">
                  <Line 
                    data={{
                      labels: ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'],
                      datasets: [{
                        label: 'Price Movement',
                        data: [...priceHistory, price], // Use defaulted price
                        borderColor: movement >= 0 ? '#4CAF50' : '#f44336',
                        backgroundColor: movement >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4,
                        fill: true
                      }]
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          callbacks: {
                            label: function(context) {
                              const yValue = context?.parsed?.y;
                              return typeof yValue === 'number' ? `$${yValue.toFixed(2)}` : 'N/A';
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          display: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          },
                          ticks: {
                            callback: function(value) {
                              return typeof value === 'number' ? '$' + value.toFixed(0) : 'N/A';
                            }
                          }
                        },
                        x: {
                          display: true,
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>

                <button 
                  className="ask-about-button" 
                  onClick={() => navigate(`/asset-chat/${asset.symbol}`, { state: { companyName: asset.name } })}
                  disabled={!asset.symbol} // Disable if no symbol
                >
                  Ask about {asset.symbol || 'Asset'}
                </button>

                <div className="asset-info">
                  <div className="info-row">
                    <span className="label">Sector</span>
                    <span className="value">{sector}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Recent News</span>
                    <span className="value">{newsSnippet}</span>
                  </div>
                  
                  {/* Risk Analysis Section */}
                  <div className="risk-analysis-section">
                    <div className="info-row risk-header" onClick={() => openRiskModal(asset)}>
                      <span className="label">Risk Insights</span>
                      <span className="value">
                        {riskData ? (
                          <span className={`risk-level ${riskData.risk_level.toLowerCase()}`}>
                            {riskData.risk_level}
                          </span>
                        ) : (
                          <span className="loading-risk">Calculating Risk...</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRiskAsset && renderRiskModal()}

      {filteredAssets.length === 0 && (
        <div className="no-assets">
          <p>No assets found. Try adding some assets to track!</p>
        </div>
      )}
    </div>
  );
}

export default TrackerPage; 