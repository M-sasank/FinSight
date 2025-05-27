import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';
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
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/get`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data);
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
        const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/create`, {
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
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/v1/tracker/assets/delete?asset_id=${assetId}`, {
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

          return (
            <div key={asset.id} className="asset-card">
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="no-assets">
          <p>No assets found. Try adding some assets to track!</p>
        </div>
      )}
    </div>
  );
}

export default TrackerPage; 