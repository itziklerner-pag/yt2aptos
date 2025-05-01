import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy-loaded components
const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));
const WebSocketDemo = lazy(() => import('./pages/WebSocketDemo'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Import layout components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="websocket-demo" element={<WebSocketDemo />} />
          {/* More routes will be added here as the app grows */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;