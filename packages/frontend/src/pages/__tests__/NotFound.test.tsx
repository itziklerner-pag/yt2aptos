import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound';

// Wrap NotFound with BrowserRouter to provide the Link component context
const NotFoundWithRouter = () => (
  <BrowserRouter>
    <NotFound />
  </BrowserRouter>
);

describe('NotFound Page Component', () => {
  it('renders the not found container', () => {
    const { container } = render(<NotFoundWithRouter />);
    
    // Check if not found container is rendered
    const notFoundPage = container.querySelector('.not-found');
    expect(notFoundPage).toBeInTheDocument();
    expect(notFoundPage).toHaveClass('page');
  });
  
  it('renders the 404 heading', () => {
    render(<NotFoundWithRouter />);
    
    // Check if 404 heading is rendered
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('404');
  });
  
  it('renders the "Page Not Found" subheading', () => {
    render(<NotFoundWithRouter />);
    
    // Check if subheading is rendered
    const subheading = screen.getByRole('heading', { level: 2 });
    expect(subheading).toBeInTheDocument();
    expect(subheading.textContent).toBe('Page Not Found');
  });
  
  it('renders an explanatory message', () => {
    render(<NotFoundWithRouter />);
    
    // Check if explanatory text is rendered
    const message = screen.getByText(/The page you are looking for does not exist or has been moved/i);
    expect(message).toBeInTheDocument();
  });
  
  it('renders a link back to the home page', () => {
    render(<NotFoundWithRouter />);
    
    // Check if link is rendered
    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('back-link');
  });
  
  it('applies proper styling to elements', () => {
    const { container } = render(<NotFoundWithRouter />);
    
    // Check if style tag is present
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    
    // Check if style contains expected CSS
    const styleContent = style?.textContent || '';
    expect(styleContent).toContain('var(--primary-color)');
    expect(styleContent).toContain('var(--secondary-color)');
    
    // Check specific styling elements
    expect(styleContent).toContain('.not-found {');
    expect(styleContent).toContain('.back-link {');
    expect(styleContent).toContain('h1 {');
  });
  
  it('centers content on the page', () => {
    const { container } = render(<NotFoundWithRouter />);
    
    // Check for centering classes/styles
    const notFoundElement = container.querySelector('.not-found');
    
    // Check if the style defines centering
    const style = container.querySelector('style');
    const styleContent = style?.textContent || '';
    
    // Check for centering CSS properties
    expect(styleContent).toContain('display: flex');
    expect(styleContent).toContain('align-items: center');
    expect(styleContent).toContain('justify-content: center');
    expect(styleContent).toContain('text-align: center');
  });
  
  it('defines a max-width for the content', () => {
    const { container } = render(<NotFoundWithRouter />);
    
    // Check if content has max-width defined
    const style = container.querySelector('style');
    const styleContent = style?.textContent || '';
    
    expect(styleContent).toContain('.not-found-content {');
    expect(styleContent).toContain('max-width: 500px');
  });
});