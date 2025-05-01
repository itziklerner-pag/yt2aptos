import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-page page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>YouTube Content Archiving System</h1>
          <p className="subtitle">Preserve your favorite YouTube content securely and efficiently</p>
          <div className="actions">
            <Link to="/websocket-demo" className="btn btn-primary">WebSocket Demo</Link>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
      </section>
      
      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Channel &amp; Playlist Support</h3>
            <p>Archive complete channels or specific playlists with selective downloading options</p>
          </div>
          <div className="feature-card">
            <h3>Multiple Storage Options</h3>
            <p>Store your content locally or in cloud storage services with flexible organization</p>
          </div>
          <div className="feature-card">
            <h3>Metadata Preservation</h3>
            <p>Preserve video descriptions, comments, tags, and other important metadata</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Monitoring</h3>
            <p>Track download progress and system status with real-time updates</p>
            <Link to="/websocket-demo" className="demo-link">Try WebSocket Demo</Link>
          </div>
        </div>
      </section>
      
      <style>{`
        .hero-section {
          padding: 4rem 0;
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .hero-content h1 {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 2rem;
        }
        
        .actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: var(--secondary-color);
        }
        
        .btn-secondary {
          background-color: white;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
        }
        
        .btn-secondary:hover {
          background-color: #f0f7ff;
        }
        
        .features-section {
          padding: 2rem 0;
        }
        
        .features-section h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: var(--text-color);
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        
        .feature-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
        }
        
        .feature-card h3 {
          color: var(--primary-color);
          margin-bottom: 0.75rem;
        }
        
        .feature-card p {
          color: #666;
          line-height: 1.5;
        }
        
        .demo-link {
          display: inline-block;
          margin-top: 0.75rem;
          color: var(--primary-color);
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .demo-link:hover {
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
};

export default Home;