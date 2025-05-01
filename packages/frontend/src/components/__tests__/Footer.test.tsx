import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  it('renders the copyright text', () => {
    render(<Footer />);
    
    // Check if copyright text is rendered
    const copyright = screen.getByText(/copyright/i);
    expect(copyright).toBeInTheDocument();
  });

  it('renders the current year in the copyright text', () => {
    render(<Footer />);
    
    // Get the current year
    const currentYear = new Date().getFullYear().toString();
    
    // Check if current year is displayed in the footer
    expect(screen.getByText(new RegExp(currentYear, 'i'))).toBeInTheDocument();
  });

  it('renders with the appropriate structure and classes', () => {
    const { container } = render(<Footer />);
    
    // Check if the component has the expected structure
    const footer = container.querySelector('.app-footer');
    expect(footer).toBeInTheDocument();
    
    // Check if footer has the appropriate structure
    expect(footer?.tagName).toBe('FOOTER');
    expect(footer?.classList.contains('app-footer')).toBe(true);
  });

  it('contains appropriate links', () => {
    render(<Footer />);
    
    // Check for common footer links like "About", "Privacy", "Terms"
    const links = screen.getAllByRole('link');
    
    // Assuming footer has links
    expect(links.length).toBeGreaterThan(0);
    
    // Check if common link text exists (adjust based on actual footer content)
    const linkTexts = links.map(link => link.textContent?.toLowerCase());
    const hasExpectedLinks = linkTexts.some(text => 
      text?.includes('about') || 
      text?.includes('privacy') || 
      text?.includes('terms') ||
      text?.includes('contact')
    );
    
    expect(hasExpectedLinks).toBe(true);
  });
});