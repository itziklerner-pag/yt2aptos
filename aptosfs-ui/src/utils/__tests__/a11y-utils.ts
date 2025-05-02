import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers to Jest
expect.extend(toHaveNoViolations);

/**
 * Wrapper function for testing accessibility
 * @param ui - React component to test
 * @param options - Additional render options
 * @returns Result of render plus axe accessibility test function
 */
export async function checkA11y(
  ui: ReactElement,
  options?: RenderOptions
) {
  const renderResult = render(ui, options);
  const axeResults = await axe(renderResult.container);
  
  // Check for accessibility violations
  expect(axeResults).toHaveNoViolations();
  
  return {
    ...renderResult,
    axeResults
  };
}

/**
 * Utility to test specific WCAG conformance rules
 * @param ui - React component to test 
 * @param rules - Array of WCAG rules to test
 * @param options - Additional render options
 */
export async function checkWcagCompliance(
  ui: ReactElement,
  rules: string[],
  options?: RenderOptions
) {
  const renderResult = render(ui, options);
  
  const axeResults = await axe(renderResult.container, {
    rules: rules.reduce((acc, rule) => {
      acc[rule] = { enabled: true };
      return acc;
    }, {} as Record<string, { enabled: boolean }>)
  });
  
  // Check for accessibility violations based on specified rules
  expect(axeResults).toHaveNoViolations();
  
  return {
    ...renderResult,
    axeResults
  };
}