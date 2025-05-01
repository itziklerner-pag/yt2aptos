import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="not-found page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="back-link">
          Return to Home
        </Link>
      </div>
      <style jsx>{`
        .not-found {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 0;
        }
        
        .not-found-content {
          max-width: 500px;
        }
        
        h1 {
          font-size: 6rem;
          color: var(--primary-color);
          margin: 0;
          line-height: 1;
        }
        
        h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        p {
          color: #666;
          margin-bottom: 2rem;
        }
        
        .back-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: var(--primary-color);
          color: white;
          border-radius: 4px;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.3s ease;
        }
        
        .back-link:hover {
          background-color: var(--secondary-color);
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default NotFound;