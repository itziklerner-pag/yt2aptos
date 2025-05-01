import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} YT2Aptos - YouTube Content Archiving System</p>
        </div>
      </div>
      <style jsx>{`
        .app-footer {
          background-color: white;
          border-top: 1px solid var(--border-color);
          padding: 1rem 0;
          margin-top: auto;
        }
        
        .footer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 0.9rem;
          color: #666;
        }
      `}</style>
    </footer>
  );
};

export default Footer;