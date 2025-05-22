import React, { useState } from 'react';
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

// Register ChartJS components
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

  // Sample data for demonstration - in real app, this would come from an API
  const sampleAssetData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Price Movement',
      data: [100, 102, 98, 103, 101, 105, 104],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const handleAddAsset = () => {
    if (newAsset.symbol && newAsset.name) {
      setAssets([...assets, {
        ...newAsset,
        price: Math.random() * 1000, // Sample price
        movement: Math.random() * 10 - 5, // Sample movement
        sector: 'Technology', // Sample sector
        news: 'Recent earnings report shows strong growth in cloud services - TechCrunch' // Sample news
      }]);
      setNewAsset({ symbol: '', name: '' });
      setShowAddAssetModal(false);
    }
  };

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
        {assets.map((asset, index) => (
          <div key={index} className="asset-card">
            <div className="asset-header">
              <h3>{asset.symbol}</h3>
              <span className="asset-name">{asset.name}</span>
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
              <div className="news">
                <span className="label">Latest News:</span>
                <p className="value">{asset.news}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackerPage; 