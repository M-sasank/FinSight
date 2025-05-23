import React, { useState, useEffect } from 'react';
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
  const [assets, setAssets] = useState([]);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/tracker/assets/get');
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (newAsset.symbol && newAsset.name) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/tracker/assets/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAsset),
        });

        if (!response.ok) {
          throw new Error('Failed to create asset');
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
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tracker/assets/delete?asset_id=${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
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
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="asset-card">
            <div className="asset-header">
              <div className="asset-title">
                <h3>{asset.symbol}</h3>
                <span className="asset-name">{asset.name}</span>
              </div>
              <button 
                className="delete-button"
                onClick={() => handleDeleteAsset(asset.id)}
                aria-label={`Delete ${asset.symbol}`}
              >
                <FiTrash2 />
              </button>
            </div>
            
            <div className="asset-price">
              <span className="price">${asset.price.toFixed(2)}</span>
              <span className={`movement ${asset.movement >= 0 ? 'positive' : 'negative'}`}>
                {asset.movement >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {asset.movement >= 0 ? '+' : ''}{asset.movement.toFixed(2)}%
              </span>
            </div>

            <div className="asset-chart">
              <Line 
                data={{
                  labels: ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'],
                  datasets: [{
                    label: 'Price Movement',
                    data: [...asset.price_history, asset.price],
                    borderColor: asset.movement >= 0 ? '#4CAF50' : '#f44336',
                    backgroundColor: asset.movement >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
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
                          return `$${context.parsed.y.toFixed(2)}`;
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
                        font: {
                          size: 10
                        },
                        callback: function(value) {
                          return '$' + value.toFixed(2);
                        }
                      }
                    },
                    x: {
                      display: false
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }} 
              />
            </div>

            <div className="asset-info">
              <div className="info-row">
                <span className="label">Sector:</span>
                <span className="value">{asset.sector}</span>
              </div>
              <div className="info-row">
                <span className="label">Last Updated:</span>
                <span className="value">{new Date(asset.last_updated).toLocaleString()}</span>
              </div>
              <div className="info-row movement-insight">
                <span className="label">Why it Moved:</span>
                <p className="value">{asset.news}</p>
              </div>
            </div>

            <button 
              className="ask-about-button"
              onClick={() => navigate(`/asset-chat/${asset.symbol}`)}
            >
              Ask about {asset.symbol}
            </button>
          </div>
        ))}
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