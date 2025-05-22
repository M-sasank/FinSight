import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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

function TrackerPage() {
  const [assets, setAssets] = useState([]);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/tracker/assets/get');
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
        const response = await fetch('http://localhost:8000/tracker/assets/create', {
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
      const response = await fetch(`http://localhost:8000/tracker/assets/delete?asset_id=${assetId}`, {
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

  // Sample chart data - you might want to replace this with real data
  const sampleAssetData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Price Movement',
      data: [100, 102, 98, 103, 101, 105, 104],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  if (loading) {
    return <div className="loading">Loading assets...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="tracker-page">
      <div className="tracker-header">
        <h2>Asset Tracker</h2>
        <button 
          className="add-asset-button"
          onClick={() => setShowAddAssetModal(true)}
        >
          + Add Asset
        </button>
      </div>

      {showAddAssetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Asset</h3>
            <input
              type="text"
              placeholder="Symbol (e.g., AAPL)"
              value={newAsset.symbol}
              onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value})}
            />
            <input
              type="text"
              placeholder="Name (e.g., Apple Inc.)"
              value={newAsset.name}
              onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
            />
            <div className="modal-buttons">
              <button onClick={handleAddAsset}>Add</button>
              <button onClick={() => setShowAddAssetModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="assets-grid">
        {assets.map((asset) => (
          <div key={asset.id} className="asset-card">
            <div className="asset-header">
              <h3>{asset.symbol}</h3>
              <span className="asset-name">{asset.name}</span>
              <button 
                className="delete-button"
                onClick={() => handleDeleteAsset(asset.id)}
              >
                ×
              </button>
            </div>
            <div className="asset-price">
              <span className="price">${asset.price.toFixed(2)}</span>
              <span className={`movement ${asset.movement >= 0 ? 'positive' : 'negative'}`}>
                {asset.movement >= 0 ? '+' : ''}{asset.movement.toFixed(2)}%
              </span>
            </div>
            <div className="asset-chart">
              <Line data={sampleAssetData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    display: false
                  },
                  x: {
                    display: false
                  }
                }
              }} />
            </div>
            <div className="asset-info">
              <div className="sector">
                <span className="label">Sector:</span>
                <span className="value">{asset.sector}</span>
              </div>
              <div className="movement-insight">
                <span className="label">Why it Moved:</span>
                <p className="value">{asset.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackerPage; 