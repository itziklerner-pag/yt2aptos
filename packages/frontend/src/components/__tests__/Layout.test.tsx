// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../Layout';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Header from '../Header';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Footer from '../Footer';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet-content">Router Outlet Content</div>
}));

jest.mock('../Header', () => ({
  __esModule: true,
  default: () => <header data-testid="mock-header">Header Content</header>
}));

jest.mock('../Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="mock-footer">Footer Content</footer>
}));

describe('Layout Component', () => {
  it('renders the app container', () => {
    const { container } = render(<Layout />);
    
    // Check if app container is rendered
    const appContainer = container.querySelector('.app-container');
    expect(appContainer).toBeInTheDocument();
  });
  
  it('renders the Header component', () => {
    render(<Layout />);
    
    // Check if Header is rendered
    const header = screen.getByTestId('mock-header');
    expect(header).toBeInTheDocument();
    expect(header.textContent).toContain('Header Content');
  });
  
  it('renders the main content area', () => {
    const { container } = render(<Layout />);
    
    // Check if main content area is rendered
    const mainContent = container.querySelector('.main-content');
    expect(mainContent).toBeInTheDocument();
    
    // Check if main content has a container
    const innerContainer = mainContent?.querySelector('.container');
    expect(innerContainer).toBeInTheDocument();
  });
  
  it('renders the router Outlet component', () => {
    render(<Layout />);
    
    // Check if Outlet content is rendered
    const outlet = screen.getByTestId('outlet-content');
    expect(outlet).toBeInTheDocument();
    expect(outlet.textContent).toContain('Router Outlet Content');
  });
  
  it('renders the Footer component', () => {
    render(<Layout />);
    
    // Check if Footer is rendered
    const footer = screen.getByTestId('mock-footer');
    expect(footer).toBeInTheDocument();
    expect(footer.textContent).toContain('Footer Content');
  });
  
  it('renders components in the correct order', () => {
    const { container } = render(<Layout />);
    
    // Get all main elements in order
    const elements = container.firstChild?.childNodes;
    
    // Should have 3 elements: Header, main content, Footer
    expect(elements?.length).toBe(3);
    
    // First element should be Header
    expect(elements?.[0]).toHaveAttribute('data-testid', 'mock-header');
    
    // Second element should be main content
    expect(elements?.[1]).toHaveClass('main-content');
    
    // Third element should be Footer
    expect(elements?.[2]).toHaveAttribute('data-testid', 'mock-footer');
  });
});