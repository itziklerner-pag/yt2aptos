// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

// Wrapper to provide the router context required for Link components
const HeaderWithRouter = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

describe('Header Component', () => {
  it('renders the app title', () => {
    render(<HeaderWithRouter />);
    
    // Check if the title is rendered
    const title = screen.getByText('YT2Aptos');
    expect(title).toBeInTheDocument();
  });

  it('renders all navigation links with correct URLs', () => {
    render(<HeaderWithRouter />);
    
    // Get all navigation links
    const homeLink = screen.getByRole('link', { name: /home/i });
    const channelsLink = screen.getByRole('link', { name: /channels/i });
    const downloadsLink = screen.getByRole('link', { name: /downloads/i });
    const aboutLink = screen.getByRole('link', { name: /about/i });
    
    // Check if all links are rendered
    expect(homeLink).toBeInTheDocument();
    expect(channelsLink).toBeInTheDocument();
    expect(downloadsLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    
    // Check if links have correct href attributes
    expect(homeLink).toHaveAttribute('href', '/');
    expect(channelsLink).toHaveAttribute('href', '/channels');
    expect(downloadsLink).toHaveAttribute('href', '/downloads');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders with the appropriate structure and classes', () => {
    const { container } = render(<HeaderWithRouter />);
    
    // Check if the component has the expected structure
    const header = container.querySelector('.app-header');
    expect(header).toBeInTheDocument();
    
    const logo = container.querySelector('.logo');
    expect(logo).toBeInTheDocument();
    
    const nav = container.querySelector('.main-nav');
    expect(nav).toBeInTheDocument();
    
    // Check if nav has a list of items
    const navItems = container.querySelectorAll('.main-nav li');
    expect(navItems.length).toBe(4); // 4 navigation items
  });

  it('has logo link pointing to home page', () => {
    render(<HeaderWithRouter />);
    
    // Find the logo link
    const logoLink = screen.getByRole('heading', { name: /YT2Aptos/i }).closest('a');
    
    // Check if logo link has correct href
    expect(logoLink).toHaveAttribute('href', '/');
  });
});