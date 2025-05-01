import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/auth.service';
import aptosService from '../../services/aptos.service';
import { LoginRequest } from '../../../../shared/src/auth/types';
import LoadingSpinner from '../LoadingSpinner';

interface LocationState {
  from?: string;
}

/**
 * Login component for both traditional and wallet-based authentication
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  // Redirect path after successful login
  const from = state?.from || '/dashboard';
  
  /**
   * Handle traditional login form submission
   */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      
      const loginData: LoginRequest = { username, password };
      await authService.login(loginData);
      
      // Redirect to the page the user was trying to access
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle wallet authentication
   */
  const handleWalletLogin = async () => {
    setError(null);
    
    try {
      setIsLoading(true);
      
      // Wallet authentication process
      await aptosService.authenticateWithWallet();
      
      // Redirect to the page the user was trying to access
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Wallet login error:', error);
      if ((error as Error).message.includes('install')) {
        setError('No Aptos wallet detected. Please install a compatible wallet extension.');
      } else {
        setError('Failed to authenticate with wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" /> : 'Sign In'}
            </button>
            
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <button 
          className="btn btn-wallet"
          onClick={handleWalletLogin}
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : 'Sign In with Aptos Wallet'}
        </button>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;