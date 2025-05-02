# AptosFS Design Guidelines

This document outlines the design system used throughout AptosFS, including design tokens, theme variables, component patterns, and accessibility requirements.

## Table of Contents

- [Design Principles](#design-principles)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Component Patterns](#component-patterns)
- [Responsive Design](#responsive-design)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Animation and Motion](#animation-and-motion)

## Design Principles

AptosFS follows these core design principles:

1. **Clarity**: Interface elements should be intuitive and clear in their purpose
2. **Efficiency**: Minimize steps needed to complete common tasks
3. **Consistency**: Maintain consistent patterns and behaviors throughout
4. **Feedback**: Provide clear feedback for all user actions
5. **Accessibility**: Ensure the interface works for all users regardless of ability

## Color System

AptosFS uses a carefully crafted color system that supports both light and dark modes, with consistent semantic meaning across themes.

### Primary Colors

```css
--color-primary-50: #f0f7ff;
--color-primary-100: #e0f0fe;
--color-primary-200: #bae0fd;
--color-primary-300: #7cc6fb;
--color-primary-400: #37a4f5;
--color-primary-500: #0d8df2;
--color-primary-600: #0070e0;
--color-primary-700: #0059b8;
--color-primary-800: #064b8f;
--color-primary-900: #094076;
--color-primary-950: #062b50;
```

### Neutral Colors

```css
--color-neutral-50: #f9fafb;
--color-neutral-100: #f3f4f6;
--color-neutral-200: #e5e7eb;
--color-neutral-300: #d1d5db;
--color-neutral-400: #9ca3af;
--color-neutral-500: #6b7280;
--color-neutral-600: #4b5563;
--color-neutral-700: #374151;
--color-neutral-800: #1f2937;
--color-neutral-900: #111827;
--color-neutral-950: #0a0c10;
```

### Semantic Colors

```css
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-info: #3b82f6;
--color-info-light: #dbeafe;
```

### Theme Variables

Color variables are applied according to the active theme:

```css
/* Light Theme */
:root[data-theme="light"] {
  --background-primary: var(--color-neutral-50);
  --background-secondary: white;
  --background-tertiary: var(--color-neutral-100);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-700);
  --text-tertiary: var(--color-neutral-500);
  --border-color: var(--color-neutral-200);
  --shadow-color: rgba(0, 0, 0, 0.1);
}

/* Dark Theme */
:root[data-theme="dark"] {
  --background-primary: var(--color-neutral-900);
  --background-secondary: var(--color-neutral-800);
  --background-tertiary: var(--color-neutral-700);
  --text-primary: white;
  --text-secondary: var(--color-neutral-300);
  --text-tertiary: var(--color-neutral-400);
  --border-color: var(--color-neutral-700);
  --shadow-color: rgba(0, 0, 0, 0.3);
}
```

### Color Usage Guidelines

1. **Primary Color**: Use for primary actions, highlighting selected state, and key UI elements
2. **Text Colors**: Follow hierarchical importance (primary, secondary, tertiary)
3. **Semantic Colors**: Use consistently for status, alerts, and feedback
4. **Background Colors**: Create subtle hierarchy with primary, secondary, tertiary backgrounds

## Typography

AptosFS uses a carefully selected typography system designed for readability and hierarchy.

### Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
             Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
--font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, 
             'Liberation Mono', 'Courier New', monospace;
```

### Font Sizes

```css
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem;  /* 36px */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.25;
--line-height-base: 1.5;
--line-height-relaxed: 1.75;
```

### Typography Usage

| Element             | Font Size        | Font Weight      | Line Height      |
|---------------------|------------------|------------------|------------------|
| Page Headings       | --font-size-2xl  | --font-weight-bold | --line-height-tight |
| Section Headings    | --font-size-xl   | --font-weight-semibold | --line-height-tight |
| Subsection Headings | --font-size-lg   | --font-weight-medium | --line-height-tight |
| Body Text           | --font-size-base | --font-weight-normal | --line-height-base |
| UI Labels           | --font-size-sm   | --font-weight-medium | --line-height-tight |
| Helper Text         | --font-size-sm   | --font-weight-normal | --line-height-base |
| Button Text         | --font-size-sm   | --font-weight-medium | --line-height-tight |
| Code                | --font-size-sm   | --font-weight-normal | --line-height-base |

## Spacing

AptosFS uses a consistent spacing system based on a 4px grid.

### Spacing Scale

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Spacing Usage Guidelines

1. **Component Padding**: Use consistent padding within components (typically --space-4)
2. **Content Spacing**: Space between related content elements (--space-2 to --space-4)
3. **Section Spacing**: Space between distinct sections (--space-8 to --space-12)
4. **Layout Spacing**: Space between major layout elements (--space-6 to --space-12)

## Component Patterns

### Buttons

Buttons follow a consistent pattern with clear visual hierarchy:

```html
<!-- Primary Button -->
<button class="btn btn-primary">
  <span class="btn-icon"><!-- Icon SVG --></span>
  <span class="btn-text">Primary Action</span>
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Tertiary Button -->
<button class="btn btn-tertiary">Tertiary Action</button>
```

#### Button Sizes

Buttons come in three sizes:

- **Small**: Compact UI areas, secondary actions `--space-2` padding
- **Medium (Default)**: Most UI actions `--space-3` padding
- **Large**: Call-to-action, prominent elements `--space-4` padding

### Input Fields

Input fields maintain consistent styling:

```html
<div class="input-wrapper">
  <label for="example-input" class="input-label">Field Label</label>
  <div class="input-container">
    <input 
      id="example-input" 
      type="text" 
      class="input-field" 
      placeholder="Placeholder text"
    />
    <div class="input-icon"><!-- Icon if needed --></div>
  </div>
  <p class="input-helper">Helper text or validation message</p>
</div>
```

### Cards

Content cards use consistent styling:

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <div class="card-actions"><!-- Action buttons --></div>
  </div>
  <div class="card-content">
    <!-- Card content -->
  </div>
  <div class="card-footer">
    <!-- Footer actions or information -->
  </div>
</div>
```

## Responsive Design

AptosFS uses a mobile-first responsive approach with consistent breakpoints.

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Small devices like phones */
--breakpoint-md: 768px;   /* Medium devices like tablets */
--breakpoint-lg: 1024px;  /* Large devices like laptops */
--breakpoint-xl: 1280px;  /* Extra large devices like desktops */
--breakpoint-2xl: 1536px; /* Extra extra large devices */
```

### Responsive Patterns

1. **Layout Stacking**: Multi-column layouts stack vertically on small screens
2. **Element Sizing**: Interactive elements sized appropriately for touch (min 44px)
3. **Typography**: Slightly smaller font sizes on mobile screens
4. **Navigation**: Collapsed navigation patterns on small screens

#### Responsive Example

```css
.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: var(--breakpoint-md)) {
  .grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: var(--breakpoint-lg)) {
  .grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: var(--breakpoint-xl)) {
  .grid-layout {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Accessibility Guidelines

AptosFS adheres to WCAG 2.1 AA standards, with the following key requirements:

### Color Contrast

- Text must have sufficient contrast against backgrounds:
  - 4.5:1 for normal text
  - 3:1 for large text (18pt+, or 14pt+ bold)
  - 3:1 for UI components and graphical objects

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus states must be clearly visible
- Focus order must be logical and follow visual layout
- No keyboard traps

### Screen Reader Support

- Semantic HTML elements used appropriately
- ARIA attributes used when needed
- All non-text content has text alternatives
- Dynamic content changes are announced appropriately

### Responsive Design Considerations

- Content is readable without horizontal scrolling at 400% zoom
- Touch targets are at least 44px × 44px
- Content is usable in both portrait and landscape orientations

## Animation and Motion

AptosFS uses purposeful animation to enhance user experience:

### Animation Timing

```css
--transition-fast: 100ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Patterns

1. **Micro-interactions**: Subtle feedback for user actions (--transition-fast)
2. **State Changes**: Smooth transitions between UI states (--transition-base)
3. **Navigation**: Transitions between views or pages (--transition-slow)
4. **Attention Direction**: Guide user focus to important elements

### Reduced Motion

All animations respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}