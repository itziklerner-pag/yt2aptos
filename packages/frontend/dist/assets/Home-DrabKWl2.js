import{j as e,L as r}from"./index-BeRU3AfM.js";const a=()=>e.jsxs("div",{className:"home-page page",children:[e.jsx("section",{className:"hero-section",children:e.jsxs("div",{className:"hero-content",children:[e.jsx("h1",{children:"YouTube Content Archiving System"}),e.jsx("p",{className:"subtitle",children:"Preserve your favorite YouTube content securely and efficiently"}),e.jsxs("div",{className:"actions",children:[e.jsx(r,{to:"/websocket-demo",className:"btn btn-primary",children:"WebSocket Demo"}),e.jsx("button",{className:"btn btn-secondary",children:"Learn More"})]})]})}),e.jsxs("section",{className:"features-section",children:[e.jsx("h2",{children:"Key Features"}),e.jsxs("div",{className:"features-grid",children:[e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:"Channel & Playlist Support"}),e.jsx("p",{children:"Archive complete channels or specific playlists with selective downloading options"})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:"Multiple Storage Options"}),e.jsx("p",{children:"Store your content locally or in cloud storage services with flexible organization"})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:"Metadata Preservation"}),e.jsx("p",{children:"Preserve video descriptions, comments, tags, and other important metadata"})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("h3",{children:"Real-time Monitoring"}),e.jsx("p",{children:"Track download progress and system status with real-time updates"}),e.jsx(r,{to:"/websocket-demo",className:"demo-link",children:"Try WebSocket Demo"})]})]})]}),e.jsx("style",{children:`
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
      `})]});export{a as default};
