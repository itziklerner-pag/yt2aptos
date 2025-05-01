import{j as r}from"./index-BeRU3AfM.js";const e=()=>r.jsxs("div",{className:"dashboard-page page",children:[r.jsx("h1",{children:"Dashboard"}),r.jsxs("div",{className:"dashboard-content",children:[r.jsxs("div",{className:"dashboard-card",children:[r.jsx("h2",{children:"My Channels"}),r.jsx("p",{children:"Tracked YouTube channels will appear here"}),r.jsx("button",{className:"btn btn-primary",children:"Add Channel"})]}),r.jsxs("div",{className:"dashboard-card",children:[r.jsx("h2",{children:"Recent Downloads"}),r.jsx("p",{children:"Recent download history will appear here"}),r.jsx("button",{className:"btn btn-secondary",children:"View All"})]}),r.jsxs("div",{className:"dashboard-card",children:[r.jsx("h2",{children:"Storage Usage"}),r.jsx("div",{className:"progress-container",children:r.jsx("div",{className:"progress-bar",style:{width:"35%"}})}),r.jsx("p",{children:"Using 35% of available storage"})]})]}),r.jsx("style",{children:`
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
      `})]});export{e as default};
