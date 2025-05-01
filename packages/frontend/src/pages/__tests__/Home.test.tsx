// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../Home';

describe('Home Page Component', () => {
  it('renders the home page container', () => {
    const { container } = render(<Home />);
    
    // Check if home page container is rendered
    const homePage = container.querySelector('.home-page');
    expect(homePage).toBeInTheDocument();
    expect(homePage).toHaveClass('page');
  });
  
  it('renders the hero section with title', () => {
    render(<Home />);
    
    // Check if hero section is rendered
    const heroSection = document.querySelector('.hero-section');
    expect(heroSection).toBeInTheDocument();
    
    // Check if title is rendered
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    expect(title.textContent).toBe('YouTube Content Archiving System');
  });
  
  it('renders the subtitle', () => {
    render(<Home />);
    
    // Check if subtitle is rendered
    const subtitle = document.querySelector('.subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle?.textContent).toContain('Preserve your favorite YouTube content');
  });
  
  it('renders action buttons', () => {
    render(<Home />);
    
    // Check if buttons are rendered
    const primaryButton = screen.getByRole('button', { name: /get started/i });
    const secondaryButton = screen.getByRole('button', { name: /learn more/i });
    
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).toHaveClass('btn-primary');
    
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton).toHaveClass('btn-secondary');
  });
  
  it('renders the features section with heading', () => {
    render(<Home />);
    
    // Check if features section is rendered
    const featuresSection = document.querySelector('.features-section');
    expect(featuresSection).toBeInTheDocument();
    
    // Check if heading is rendered
    const heading = screen.getByRole('heading', { name: /key features/i, level: 2 });
    expect(heading).toBeInTheDocument();
  });
  
  it('renders all feature cards', () => {
    render(<Home />);
    
    // Check if all feature cards are rendered
    const featureCards = document.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);
    
    // Check for specific feature titles
    const featureTitles = [
      'Channel & Playlist Support',
      'Multiple Storage Options',
      'Metadata Preservation',
      'Real-time Monitoring'
    ];
    
    // Verify each feature title is present
    featureTitles.forEach(title => {
      const heading = screen.getByRole('heading', { name: title });
      expect(heading).toBeInTheDocument();
    });
  });
  
  it('includes styled JSX for styling', () => {
    const { container } = render(<Home />);
    
    // Check if style tag is present
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    
    // Check if style contains CSS variables
    const styleContent = style?.textContent || '';
    expect(styleContent).toContain('var(--primary-color)');
    expect(styleContent).toContain('var(--secondary-color)');
  });
  
  it('applies styling to elements', () => {
    const { container } = render(<Home />);
    
    // Check if feature cards have styling applied
    const featureCard = container.querySelector('.feature-card');
    
    // Note: getComputedStyle might not work fully in testing environment
    // So we're relying on classes being present and style definitions
    expect(featureCard).toHaveClass('feature-card');
    
    // Check if style definitions exist for these classes
    const style = container.querySelector('style');
    const styleContent = style?.textContent || '';
    
    expect(styleContent).toContain('.feature-card {');
    expect(styleContent).toContain('.btn-primary {');
    expect(styleContent).toContain('.hero-section {');
  });
});