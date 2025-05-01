import React from 'react';
import { render } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders the spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if spinner element is rendered
    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with the loading container', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if the loading container is rendered
    const loadingContainer = container.querySelector('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('applies the correct CSS animation', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if style element is included
    const styleElement = container.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    
    // Check if the style content includes animation
    const styleContent = styleElement?.textContent || '';
    expect(styleContent).toContain('animation');
    expect(styleContent).toContain('spin');
  });

  it('has the correct dimensions', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if style element contains the correct dimensions
    const styleElement = container.querySelector('style');
    const styleContent = styleElement?.textContent || '';
    
    expect(styleContent).toContain('width: 50px');
    expect(styleContent).toContain('height: 50px');
  });

  it('uses the primary color variable for the spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check if style uses the CSS variable for primary color
    const styleElement = container.querySelector('style');
    const styleContent = styleElement?.textContent || '';
    
    expect(styleContent).toContain('var(--primary-color)');
  });
});