import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RealTimeNotifications from './RealTimeNotifications';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
      <RealTimeNotifications />
    </div>
  );
};

export default Layout;