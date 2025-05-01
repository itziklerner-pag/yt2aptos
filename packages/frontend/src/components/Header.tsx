import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <h1>YT2Aptos</h1>
            </Link>
          </div>
          <nav className="main-nav">
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/channels">Channels</Link></li>
              <li><Link to="/downloads">Downloads</Link></li>
              <li><Link to="/websocket-demo">WebSocket Demo</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </nav>
        </div>
      </div>
      <style>{`
        .app-header {
          background-color: white;
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 0;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo h1 {
          color: var(--primary-color);
          font-size: 1.5rem;
          margin: 0;
        }
        
        .main-nav ul {
          display: flex;
          list-style: none;
        }
        
        .main-nav li {
          margin-left: 1.5rem;
        }
        
        .main-nav a {
          color: var(--text-color);
          font-weight: 500;
        }
        
        .main-nav a:hover {
          color: var(--primary-color);
        }
      `}</style>
    </header>
  );
};

export default Header;