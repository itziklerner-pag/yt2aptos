import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page page">
      <h1>Dashboard</h1>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>My Channels</h2>
          <p>Tracked YouTube channels will appear here</p>
          <button className="btn btn-primary">Add Channel</button>
        </div>
        
        <div className="dashboard-card">
          <h2>Recent Downloads</h2>
          <p>Recent download history will appear here</p>
          <button className="btn btn-secondary">View All</button>
        </div>
        
        <div className="dashboard-card">
          <h2>Storage Usage</h2>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: '35%' }}></div>
          </div>
          <p>Using 35% of available storage</p>
        </div>
      </div>
      
      <style>{`
        .dashboard-content {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .dashboard-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .dashboard-card h2 {
          color: var(--primary-color);
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        
        .progress-container {
          height: 8px;
          background-color: #eee;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .progress-bar {
          height: 100%;
          background-color: var(--primary-color);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;