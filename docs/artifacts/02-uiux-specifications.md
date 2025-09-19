# UI/UX Specifications Document
## Ergoplanner AI Suite - P&ID Management System

Version 1.0 | Date: 2025-09-19

---

## 1. Color Palette

### 1.1 Primary Colors (Brand)
```css
--primary-50:  #E3F2FD;  /* Lightest blue tint */
--primary-100: #BBDEFB;  /* Very light blue */
--primary-200: #90CAF9;  /* Light blue */
--primary-300: #64B5F6;  /* Medium light blue */
--primary-400: #42A5F5;  /* Medium blue */
--primary-500: #2196F3;  /* Base primary blue */
--primary-600: #1E88E5;  /* Dark blue */
--primary-700: #1976D2;  /* Darker blue */
--primary-800: #1565C0;  /* Very dark blue */
--primary-900: #0D47A1;  /* Darkest blue */
```

### 1.2 Secondary Colors (Accent)
```css
--secondary-50:  #F3E5F5;  /* Lightest purple tint */
--secondary-100: #E1BEE7;  /* Very light purple */
--secondary-200: #CE93D8;  /* Light purple */
--secondary-300: #BA68C8;  /* Medium light purple */
--secondary-400: #AB47BC;  /* Medium purple */
--secondary-500: #9C27B0;  /* Base secondary purple */
--secondary-600: #8E24AA;  /* Dark purple */
--secondary-700: #7B1FA2;  /* Darker purple */
--secondary-800: #6A1B9A;  /* Very dark purple */
--secondary-900: #4A148C;  /* Darkest purple */
```

### 1.3 Semantic Colors
```css
/* Success */
--success-light:  #E8F5E9;  /* Background */
--success-main:   #4CAF50;  /* Main color */
--success-dark:   #388E3C;  /* Dark variant */
--success-text:   #1B5E20;  /* Text color */

/* Warning */
--warning-light:  #FFF3E0;  /* Background */
--warning-main:   #FF9800;  /* Main color */
--warning-dark:   #F57C00;  /* Dark variant */
--warning-text:   #E65100;  /* Text color */

/* Error */
--error-light:    #FFEBEE;  /* Background */
--error-main:     #F44336;  /* Main color */
--error-dark:     #D32F2F;  /* Dark variant */
--error-text:     #B71C1C;  /* Text color */

/* Info */
--info-light:     #E3F2FD;  /* Background */
--info-main:      #2196F3;  /* Main color */
--info-dark:      #1976D2;  /* Dark variant */
--info-text:      #0D47A1;  /* Text color */
```

### 1.4 Gray Scale
```css
--gray-50:   #FAFAFA;  /* Near white */
--gray-100:  #F5F5F5;  /* Very light gray */
--gray-200:  #EEEEEE;  /* Light gray */
--gray-300:  #E0E0E0;  /* Medium light gray */
--gray-400:  #BDBDBD;  /* Medium gray */
--gray-500:  #9E9E9E;  /* Base gray */
--gray-600:  #757575;  /* Dark gray */
--gray-700:  #616161;  /* Darker gray */
--gray-800:  #424242;  /* Very dark gray */
--gray-900:  #212121;  /* Near black */
```

### 1.5 Component-Specific Colors
```css
/* Canvas */
--canvas-background:     #FAFAFA;
--canvas-grid:          #E0E0E0;
--canvas-grid-major:    #BDBDBD;
--canvas-selection:     rgba(33, 150, 243, 0.2);
--canvas-hover:         rgba(33, 150, 243, 0.1);

/* Toolbar */
--toolbar-background:    #FFFFFF;
--toolbar-border:       #E0E0E0;
--toolbar-hover:        #F5F5F5;
--toolbar-active:       #E3F2FD;

/* Panels */
--panel-background:      #FFFFFF;
--panel-header:         #F5F5F5;
--panel-border:         #E0E0E0;
--panel-shadow:         rgba(0, 0, 0, 0.08);

/* Inputs */
--input-background:      #FFFFFF;
--input-border:         #BDBDBD;
--input-border-hover:   #9E9E9E;
--input-border-focus:   #2196F3;
--input-disabled:       #F5F5F5;
```

### 1.6 Dark Theme Colors
```css
/* Dark Primary */
--dark-primary:         #90CAF9;
--dark-primary-variant: #64B5F6;

/* Dark Background */
--dark-bg-default:      #121212;
--dark-bg-paper:        #1E1E1E;
--dark-bg-elevated:     #242424;

/* Dark Surface */
--dark-surface-1:       #1E1E1E;  /* 5% elevation */
--dark-surface-2:       #232323;  /* 7% elevation */
--dark-surface-3:       #252525;  /* 8% elevation */
--dark-surface-4:       #272727;  /* 9% elevation */
--dark-surface-5:       #2C2C2C;  /* 12% elevation */

/* Dark Text */
--dark-text-primary:    rgba(255, 255, 255, 0.87);
--dark-text-secondary:  rgba(255, 255, 255, 0.60);
--dark-text-disabled:   rgba(255, 255, 255, 0.38);

/* Dark Divider */
--dark-divider:         rgba(255, 255, 255, 0.12);
```

### 1.7 High Contrast Theme Colors
```css
/* High Contrast */
--hc-background:        #000000;
--hc-foreground:        #FFFFFF;
--hc-primary:           #00FFFF;
--hc-secondary:         #FFFF00;
--hc-border:            #FFFFFF;
--hc-focus:             #00FF00;
--hc-error:             #FF0000;
--hc-warning:           #FFA500;
--hc-success:           #00FF00;
```

---

## 2. Typography Specifications

### 2.1 Font Families
```css
--font-primary:   'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
--font-secondary: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, sans-serif;
--font-mono:      'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
```

### 2.2 Font Size Scale
```css
--font-size-12: 0.75rem;   /* 12px - Caption/Helper text */
--font-size-14: 0.875rem;  /* 14px - Body small */
--font-size-16: 1rem;      /* 16px - Body default */
--font-size-18: 1.125rem;  /* 18px - Body large */
--font-size-20: 1.25rem;   /* 20px - Subtitle */
--font-size-24: 1.5rem;    /* 24px - Title */
--font-size-28: 1.75rem;   /* 28px - Heading 4 */
--font-size-32: 2rem;      /* 32px - Heading 3 */
--font-size-36: 2.25rem;   /* 36px - Heading 2 */
--font-size-40: 2.5rem;    /* 40px - Heading 1 */
--font-size-48: 3rem;      /* 48px - Display */
```

### 2.3 Line Heights
```css
--line-height-dense:   1.2;   /* For headings */
--line-height-normal:  1.5;   /* For body text */
--line-height-relaxed: 1.75;  /* For readable content */
--line-height-loose:   2;     /* For spacious layouts */
```

### 2.4 Letter Spacing
```css
--letter-spacing-tight:   -0.02em;  /* Headings */
--letter-spacing-normal:   0;       /* Body text */
--letter-spacing-wide:     0.02em;  /* Subtitles */
--letter-spacing-wider:    0.04em;  /* Captions */
--letter-spacing-widest:   0.08em;  /* All caps */
```

### 2.5 Font Weights
```css
--font-weight-light:    300;
--font-weight-regular:  400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;
```

### 2.6 Heading Hierarchy
```css
h1 {
  font-size: 40px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

h2 {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 20px;
}

h3 {
  font-size: 32px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: 0;
  margin-bottom: 16px;
}

h4 {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: 0;
  margin-bottom: 12px;
}

h5 {
  font-size: 24px;
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

h6 {
  font-size: 20px;
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}
```

### 2.7 Body Text Styles
```css
/* Body Default */
.body-default {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0;
}

/* Body Small */
.body-small {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0;
}

/* Body Large */
.body-large {
  font-size: 18px;
  line-height: 1.75;
  font-weight: 400;
  letter-spacing: 0;
}

/* Caption */
.caption {
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0.04em;
}

/* Label */
.label {
  font-size: 14px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

---

## 3. Spacing System

### 3.1 Base Unit
```css
--space-unit: 8px; /* Base unit for all spacing calculations */
```

### 3.2 Spacing Scale
```css
--space-0:   0px;     /* No spacing */
--space-1:   4px;     /* 0.5 × base unit */
--space-2:   8px;     /* 1 × base unit */
--space-3:   12px;    /* 1.5 × base unit */
--space-4:   16px;    /* 2 × base unit */
--space-5:   20px;    /* 2.5 × base unit */
--space-6:   24px;    /* 3 × base unit */
--space-7:   28px;    /* 3.5 × base unit */
--space-8:   32px;    /* 4 × base unit */
--space-9:   36px;    /* 4.5 × base unit */
--space-10:  40px;    /* 5 × base unit */
--space-12:  48px;    /* 6 × base unit */
--space-14:  56px;    /* 7 × base unit */
--space-16:  64px;    /* 8 × base unit */
--space-20:  80px;    /* 10 × base unit */
--space-24:  96px;    /* 12 × base unit */
--space-32:  128px;   /* 16 × base unit */
```

### 3.3 Component Padding
```css
/* Button Padding */
--button-padding-sm:  8px 12px;   /* Small button */
--button-padding-md:  12px 20px;  /* Medium button */
--button-padding-lg:  16px 28px;  /* Large button */

/* Input Padding */
--input-padding-sm:   8px 12px;   /* Small input */
--input-padding-md:   12px 16px;  /* Medium input */
--input-padding-lg:   16px 20px;  /* Large input */

/* Card Padding */
--card-padding-sm:    16px;       /* Small card */
--card-padding-md:    24px;       /* Medium card */
--card-padding-lg:    32px;       /* Large card */

/* Panel Padding */
--panel-header-padding: 16px 20px;
--panel-body-padding:   20px;
--panel-footer-padding: 16px 20px;
```

### 3.4 Component Margins
```css
/* Section Margins */
--section-margin-sm:  24px;  /* Between related elements */
--section-margin-md:  40px;  /* Between sections */
--section-margin-lg:  64px;  /* Between major sections */

/* Element Margins */
--element-margin-xs:  4px;   /* Inline elements */
--element-margin-sm:  8px;   /* Related elements */
--element-margin-md:  16px;  /* Standard elements */
--element-margin-lg:  24px;  /* Separated elements */
```

### 3.5 Grid System
```css
/* Grid Configuration */
--grid-columns:       12;
--grid-gutter:        24px;    /* Space between columns */
--grid-margin:        24px;    /* Outer margins */

/* Column Widths */
--col-1:  8.333%;   /* 1/12 */
--col-2:  16.667%;  /* 2/12 */
--col-3:  25%;      /* 3/12 */
--col-4:  33.333%;  /* 4/12 */
--col-5:  41.667%;  /* 5/12 */
--col-6:  50%;      /* 6/12 */
--col-7:  58.333%;  /* 7/12 */
--col-8:  66.667%;  /* 8/12 */
--col-9:  75%;      /* 9/12 */
--col-10: 83.333%;  /* 10/12 */
--col-11: 91.667%;  /* 11/12 */
--col-12: 100%;     /* 12/12 */
```

### 3.6 Container Widths
```css
--container-xs:  100%;    /* Mobile */
--container-sm:  540px;   /* Small screens */
--container-md:  720px;   /* Medium screens */
--container-lg:  960px;   /* Large screens */
--container-xl:  1140px;  /* Extra large screens */
--container-xxl: 1320px;  /* Ultra wide screens */
--container-max: 1440px;  /* Maximum width */
```

---

## 4. Component Specifications

### 4.1 Buttons
```css
/* Button Heights */
--button-height-sm:  32px;
--button-height-md:  40px;
--button-height-lg:  48px;

/* Button Specifications */
.button-small {
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 4px;
  min-width: 64px;
}

.button-medium {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
  border-radius: 4px;
  min-width: 80px;
}

.button-large {
  height: 48px;
  padding: 0 28px;
  font-size: 18px;
  border-radius: 4px;
  min-width: 96px;
}

/* Icon Buttons */
.icon-button-sm {
  width: 32px;
  height: 32px;
  padding: 6px;
}

.icon-button-md {
  width: 40px;
  height: 40px;
  padding: 8px;
}

.icon-button-lg {
  width: 48px;
  height: 48px;
  padding: 12px;
}
```

### 4.2 Input Fields
```css
/* Input Heights */
--input-height-sm:  32px;
--input-height-md:  40px;
--input-height-lg:  48px;

/* Input Specifications */
.input-small {
  height: 32px;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 4px;
  border-width: 1px;
}

.input-medium {
  height: 40px;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 4px;
  border-width: 1px;
}

.input-large {
  height: 48px;
  padding: 16px 20px;
  font-size: 18px;
  border-radius: 4px;
  border-width: 1px;
}

/* Textarea */
.textarea {
  min-height: 80px;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 4px;
  border-width: 1px;
  line-height: 1.5;
}
```

### 4.3 Cards and Panels
```css
/* Card Specifications */
.card {
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  background: #FFFFFF;
}

.card-compact {
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.card-elevated {
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Panel Specifications */
.panel {
  border-radius: 8px;
  border: 1px solid #E0E0E0;
  background: #FFFFFF;
}

.panel-header {
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  align-items: center;
}

.panel-body {
  padding: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.panel-footer {
  height: 64px;
  padding: 0 20px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  align-items: center;
}
```

### 4.4 Modals and Dialogs
```css
/* Modal Sizes */
.modal-small {
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
}

.modal-medium {
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
}

.modal-large {
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
}

.modal-fullscreen {
  width: calc(100vw - 64px);
  height: calc(100vh - 64px);
  margin: 32px;
  border-radius: 8px;
}

/* Modal Structure */
.modal-header {
  height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  padding: 24px;
  max-height: calc(90vh - 128px);
  overflow-y: auto;
}

.modal-footer {
  height: 72px;
  padding: 0 24px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* Overlay */
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}
```

### 4.5 Navigation Elements
```css
/* Top Navigation Bar */
.navbar {
  height: 64px;
  padding: 0 24px;
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
}

/* Side Navigation */
.sidenav {
  width: 280px;
  background: #FAFAFA;
  border-right: 1px solid #E0E0E0;
}

.sidenav-collapsed {
  width: 64px;
}

.sidenav-item {
  height: 48px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* Breadcrumb */
.breadcrumb {
  height: 40px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Tabs */
.tab-header {
  height: 48px;
  border-bottom: 1px solid #E0E0E0;
}

.tab-item {
  height: 48px;
  padding: 0 24px;
  display: inline-flex;
  align-items: center;
  border-bottom: 2px solid transparent;
}

.tab-item-active {
  border-bottom-color: #2196F3;
}
```

### 4.6 Drawing Canvas Toolbar
```css
/* Main Toolbar */
.canvas-toolbar {
  height: 48px;
  width: 100%;
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Tool Groups */
.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-right: 1px solid #E0E0E0;
}

.tool-group:last-child {
  border-right: none;
}

/* Tool Buttons */
.tool-button {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tool-button:hover {
  background: #F5F5F5;
}

.tool-button-active {
  background: #E3F2FD;
  color: #2196F3;
}
```

### 4.7 Symbol Palette
```css
/* Symbol Palette Container */
.symbol-palette {
  width: 280px;
  height: 100%;
  background: #FFFFFF;
  border-left: 1px solid #E0E0E0;
  display: flex;
  flex-direction: column;
}

/* Palette Header */
.palette-header {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  align-items: center;
}

/* Search Box */
.palette-search {
  height: 40px;
  margin: 12px;
  padding: 0 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

/* Category Section */
.symbol-category {
  padding: 12px;
}

.category-header {
  height: 32px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* Symbol Grid */
.symbol-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.symbol-item {
  width: 56px;
  height: 56px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.symbol-item:hover {
  background: #F5F5F5;
  border-color: #BDBDBD;
}
```

### 4.8 Property Panel
```css
/* Property Panel Container */
.property-panel {
  width: 320px;
  height: 100%;
  background: #FFFFFF;
  border-left: 1px solid #E0E0E0;
  display: flex;
  flex-direction: column;
}

/* Panel Sections */
.property-section {
  border-bottom: 1px solid #E0E0E0;
  padding: 16px;
}

.property-section-header {
  height: 32px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Property Row */
.property-row {
  display: flex;
  align-items: center;
  height: 36px;
  margin-bottom: 8px;
}

.property-label {
  width: 120px;
  font-size: 14px;
  color: #616161;
}

.property-value {
  flex: 1;
  height: 32px;
}

/* Property Input Types */
.property-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-size: 14px;
}

.property-select {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.property-color {
  width: 32px;
  height: 32px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
}
```

---

## 5. Animation Specifications

### 5.1 Transition Durations
```css
--duration-instant:  0ms;     /* No animation */
--duration-fastest:  100ms;   /* Micro interactions */
--duration-faster:   150ms;   /* Small state changes */
--duration-fast:     250ms;   /* Default transitions */
--duration-normal:   350ms;   /* Complex transitions */
--duration-slow:     500ms;   /* Entrance animations */
--duration-slower:   750ms;   /* Large transformations */
--duration-slowest:  1000ms;  /* Special effects */
```

### 5.2 Easing Functions
```css
/* Standard Easings */
--ease-linear:      cubic-bezier(0, 0, 1, 1);
--ease-in:          cubic-bezier(0.4, 0, 1, 1);
--ease-out:         cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);

/* Material Design Easings */
--ease-standard:    cubic-bezier(0.4, 0, 0.2, 1);     /* Most transitions */
--ease-decelerate:  cubic-bezier(0, 0, 0.2, 1);       /* Enter screen */
--ease-accelerate:  cubic-bezier(0.4, 0, 1, 1);       /* Exit screen */
--ease-sharp:       cubic-bezier(0.4, 0, 0.6, 1);     /* Quick response */

/* Custom Easings */
--ease-bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 5.3 Hover States
```css
/* Button Hover */
.button-hover {
  transition: all 150ms ease-out;
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Link Hover */
.link {
  transition: color 150ms ease-out;
  position: relative;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 250ms ease-out;
}

.link:hover::after {
  width: 100%;
}

/* Card Hover */
.card-hover {
  transition: all 250ms ease-out;
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

### 5.4 Loading Animations
```css
/* Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1000ms linear infinite;
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 1500ms ease-in-out infinite;
}

/* Progress Bar */
@keyframes progress {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.progress-indeterminate {
  animation: progress 1500ms ease-in-out infinite;
}

/* Skeleton Screen */
@keyframes shimmer {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    #F5F5F5 25%,
    #EEEEEE 50%,
    #F5F5F5 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1500ms ease-in-out infinite;
}
```

### 5.5 Page Transitions
```css
/* Fade Transition */
.page-fade-enter {
  opacity: 0;
}

.page-fade-enter-active {
  opacity: 1;
  transition: opacity 350ms ease-out;
}

.page-fade-exit {
  opacity: 1;
}

.page-fade-exit-active {
  opacity: 0;
  transition: opacity 250ms ease-in;
}

/* Slide Transition */
.page-slide-enter {
  transform: translateX(100%);
}

.page-slide-enter-active {
  transform: translateX(0);
  transition: transform 350ms ease-out;
}

.page-slide-exit {
  transform: translateX(0);
}

.page-slide-exit-active {
  transform: translateX(-100%);
  transition: transform 250ms ease-in;
}
```

### 5.6 Canvas Zoom/Pan Animations
```css
/* Zoom Controls */
.canvas-zoom {
  transition: transform 250ms ease-out;
}

/* Pan */
.canvas-pan {
  transition: none; /* Real-time panning */
  cursor: grab;
}

.canvas-pan:active {
  cursor: grabbing;
}

/* Zoom to Fit */
.zoom-to-fit {
  animation: zoomFit 350ms ease-in-out;
}

@keyframes zoomFit {
  0% {
    transform: scale(var(--from-scale))
               translate(var(--from-x), var(--from-y));
  }
  100% {
    transform: scale(var(--to-scale))
               translate(var(--to-x), var(--to-y));
  }
}

/* Selection Box */
.selection-box {
  transition: none; /* Real-time feedback */
  stroke-dasharray: 5 5;
  animation: marchingAnts 500ms linear infinite;
}

@keyframes marchingAnts {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 10; }
}
```

---

## 6. Responsive Breakpoints

### 6.1 Breakpoint Definitions
```css
/* Mobile First Breakpoints */
--breakpoint-xs:  320px;   /* Extra small devices */
--breakpoint-sm:  576px;   /* Small devices */
--breakpoint-md:  768px;   /* Medium devices (tablets) */
--breakpoint-lg:  1024px;  /* Large devices (desktops) */
--breakpoint-xl:  1440px;  /* Extra large devices */
--breakpoint-xxl: 1920px;  /* Ultra wide screens */

/* Media Queries */
@media (min-width: 320px) and (max-width: 575px) {
  /* Mobile Portrait */
}

@media (min-width: 576px) and (max-width: 767px) {
  /* Mobile Landscape */
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet */
}

@media (min-width: 1024px) and (max-width: 1439px) {
  /* Desktop */
}

@media (min-width: 1440px) {
  /* Wide Desktop */
}
```

### 6.2 Mobile Layout (320px - 768px)
```css
/* Mobile Navigation */
.mobile-nav {
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  height: 100vh;
  transition: left 250ms ease-out;
}

.mobile-nav-open {
  left: 0;
}

/* Mobile Toolbar */
.mobile-toolbar {
  height: 56px;
  position: fixed;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
}

/* Mobile Canvas */
.mobile-canvas {
  width: 100vw;
  height: calc(100vh - 56px - 56px); /* Minus header and toolbar */
  touch-action: none;
}

/* Mobile Property Panel */
.mobile-property-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50vh;
  transform: translateY(100%);
  transition: transform 350ms ease-out;
}

.mobile-property-panel-open {
  transform: translateY(0);
}
```

### 6.3 Tablet Layout (769px - 1024px)
```css
/* Tablet Grid */
.tablet-container {
  padding: 0 24px;
  max-width: 1024px;
}

/* Tablet Sidebar */
.tablet-sidebar {
  width: 240px;
  position: fixed;
  left: 0;
  height: calc(100vh - 64px);
}

/* Tablet Main Content */
.tablet-main {
  margin-left: 240px;
  padding: 24px;
}

/* Tablet Canvas Toolbar */
.tablet-toolbar {
  height: 56px;
  display: flex;
  flex-wrap: wrap;
}

/* Tablet Property Panel */
.tablet-property-panel {
  width: 280px;
  position: absolute;
  right: 0;
  height: 100%;
}
```

### 6.4 Desktop Layout (1025px - 1440px)
```css
/* Desktop Container */
.desktop-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Desktop Layout Grid */
.desktop-layout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 0;
  height: calc(100vh - 64px);
}

/* Desktop Sidebar */
.desktop-sidebar {
  width: 280px;
  border-right: 1px solid #E0E0E0;
}

/* Desktop Canvas Area */
.desktop-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Desktop Property Panel */
.desktop-property-panel {
  width: 320px;
  border-left: 1px solid #E0E0E0;
}
```

### 6.5 Wide Desktop (1441px+)
```css
/* Wide Container */
.wide-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 48px;
}

/* Wide Layout */
.wide-layout {
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 0;
  height: calc(100vh - 64px);
}

/* Wide Sidebar */
.wide-sidebar {
  width: 320px;
}

/* Wide Property Panel */
.wide-property-panel {
  width: 380px;
}

/* Wide Canvas Toolbar */
.wide-toolbar {
  height: 64px;
  padding: 0 24px;
}
```

### 6.6 Component Behavior at Breakpoints

#### Navigation Behavior
```css
/* Mobile: Hamburger Menu */
@media (max-width: 768px) {
  .nav-menu { display: none; }
  .nav-hamburger { display: block; }
}

/* Tablet: Collapsed Sidebar */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-sidebar { width: 64px; }
  .nav-sidebar-expanded { width: 240px; }
}

/* Desktop: Full Sidebar */
@media (min-width: 1025px) {
  .nav-sidebar { width: 280px; }
  .nav-hamburger { display: none; }
}
```

#### Grid System Behavior
```css
/* Mobile: Single Column */
@media (max-width: 768px) {
  .grid-col { width: 100%; }
}

/* Tablet: Two Columns */
@media (min-width: 769px) and (max-width: 1024px) {
  .grid-col-half { width: 50%; }
  .grid-col-third { width: 50%; }
}

/* Desktop: Full Grid */
@media (min-width: 1025px) {
  .grid-col-quarter { width: 25%; }
  .grid-col-third { width: 33.333%; }
  .grid-col-half { width: 50%; }
}
```

---

## 7. Touch Gesture Specifications

### 7.1 Tap Zones
```css
/* Minimum Touch Target */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  position: relative;
}

/* Extended Touch Area */
.touch-target::before {
  content: '';
  position: absolute;
  top: -8px;
  right: -8px;
  bottom: -8px;
  left: -8px;
}

/* Touch Target Sizes */
.touch-sm {
  width: 44px;
  height: 44px;
}

.touch-md {
  width: 48px;
  height: 48px;
}

.touch-lg {
  width: 56px;
  height: 56px;
}
```

### 7.2 Swipe Thresholds
```javascript
const swipeConfig = {
  threshold: 50,          // Minimum distance in pixels
  velocity: 0.3,         // Minimum velocity in px/ms
  direction: {
    horizontal: 30,      // Max vertical deviation in degrees
    vertical: 30         // Max horizontal deviation in degrees
  },
  restraint: 100,        // Maximum perpendicular distance
  allowedTime: 300       // Maximum time in ms
};
```

### 7.3 Pinch Zoom
```javascript
const pinchConfig = {
  minScale: 0.5,         // Minimum zoom level
  maxScale: 3.0,         // Maximum zoom level
  sensitivity: 0.01,     // Scale change per pixel
  threshold: 10,         // Minimum pinch distance
  smoothing: 0.3         // Smoothing factor
};
```

### 7.4 Long Press
```javascript
const longPressConfig = {
  duration: 500,         // Time in milliseconds
  tolerance: 10,         // Movement tolerance in pixels
  feedback: {
    haptic: true,        // Haptic feedback
    visual: true         // Visual feedback
  }
};
```

### 7.5 Double Tap
```javascript
const doubleTapConfig = {
  interval: 300,         // Max time between taps
  tolerance: 30,         // Position tolerance in pixels
  preventDefault: true   // Prevent zoom on double tap
};
```

### 7.6 Drag and Drop
```javascript
const dragConfig = {
  threshold: 5,          // Movement threshold to start drag
  cursor: 'grabbing',    // Cursor during drag
  ghostOpacity: 0.5,     // Ghost element opacity
  snapGrid: 8,           // Grid snapping in pixels
  autoScroll: {
    enabled: true,
    threshold: 50,       // Distance from edge
    speed: 10            // Scroll speed
  }
};
```

---

## 8. Icon Specifications

### 8.1 Icon Sizes
```css
--icon-xs:  16px;  /* Extra small icons */
--icon-sm:  20px;  /* Small icons */
--icon-md:  24px;  /* Medium icons (default) */
--icon-lg:  32px;  /* Large icons */
--icon-xl:  40px;  /* Extra large icons */
--icon-xxl: 48px;  /* Display icons */
```

### 8.2 Icon Stroke Width
```css
--icon-stroke-thin:    1.5px;  /* Thin stroke */
--icon-stroke-regular: 2px;    /* Regular stroke (default) */
--icon-stroke-medium:  2.5px;  /* Medium stroke */
--icon-stroke-bold:    3px;    /* Bold stroke */
```

### 8.3 Icon Grid System
```css
/* 24x24 Base Grid */
.icon-grid {
  width: 24px;
  height: 24px;
  padding: 2px;        /* 2px padding on all sides */
  viewBox: "0 0 24 24";
}

/* Safe Zone */
.icon-safe-zone {
  width: 20px;         /* 24px - 4px padding */
  height: 20px;
  margin: 2px;
}

/* Key Lines */
.icon-key-lines {
  /* Horizontal and vertical center lines at 12px */
  /* Diagonal lines from corners */
  /* Circle guides at 2px, 12px, 22px */
}
```

### 8.4 Icon Categories
```css
/* System Icons */
.icon-system {
  stroke: currentColor;
  fill: none;
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* P&ID Symbols */
.icon-pid {
  stroke: #212121;
  fill: none;
  stroke-width: 1.5px;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

/* Status Icons */
.icon-status-success { color: #4CAF50; }
.icon-status-warning { color: #FF9800; }
.icon-status-error { color: #F44336; }
.icon-status-info { color: #2196F3; }
```

### 8.5 Icon File Format
```svg
<!-- SVG Template -->
<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="..."
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
```

### 8.6 Icon Animation
```css
/* Rotation Animation */
.icon-rotate {
  transition: transform 250ms ease-out;
}

.icon-rotate-active {
  transform: rotate(180deg);
}

/* Scale Animation */
.icon-scale {
  transition: transform 150ms ease-out;
}

.icon-scale:hover {
  transform: scale(1.1);
}

/* Color Animation */
.icon-color {
  transition: color 150ms ease-out;
}

.icon-color:hover {
  color: #2196F3;
}
```

---

## 9. Accessibility Specifications

### 9.1 Color Contrast Ratios
```css
/* WCAG 2.1 AA Compliance */

/* Normal Text (< 18px or < 14px bold) */
.text-normal {
  /* Minimum contrast ratio: 4.5:1 */
  color: #212121;       /* on #FFFFFF = 16.1:1 ✓ */
  background: #FFFFFF;
}

/* Large Text (≥ 18px or ≥ 14px bold) */
.text-large {
  /* Minimum contrast ratio: 3:1 */
  color: #424242;       /* on #FFFFFF = 10.3:1 ✓ */
  background: #FFFFFF;
}

/* UI Components */
.ui-component {
  /* Minimum contrast ratio: 3:1 */
  border-color: #9E9E9E;  /* on #FFFFFF = 3.7:1 ✓ */
  color: #616161;         /* on #FFFFFF = 6.3:1 ✓ */
}

/* Disabled States */
.disabled {
  /* No minimum requirement but should be distinguishable */
  color: #BDBDBD;       /* on #FFFFFF = 2.3:1 */
  opacity: 0.6;
}
```

### 9.2 Focus Indicators
```css
/* Default Focus Style */
:focus-visible {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
  border-radius: 4px;
}

/* High Contrast Focus */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid #FFFFFF;
    outline-offset: 0;
    box-shadow: 0 0 0 5px #000000;
  }
}

/* Custom Focus Styles */
.focus-ring {
  position: relative;
}

.focus-ring:focus-visible::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -4px;
  bottom: -4px;
  left: -4px;
  border: 2px solid #2196F3;
  border-radius: 6px;
  pointer-events: none;
}
```

### 9.3 Touch Target Sizes
```css
/* Minimum Touch Target */
.touch-target-min {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Recommended Touch Target */
.touch-target-recommended {
  min-width: 48px;
  min-height: 48px;
}

/* Touch Target Spacing */
.touch-spacing {
  margin: 8px;  /* Minimum 8px between targets */
}

/* Small Target with Extended Hit Area */
.small-target {
  position: relative;
  width: 24px;
  height: 24px;
}

.small-target::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}
```

### 9.4 Font Size Minimums
```css
/* Minimum Font Sizes */
.text-body-min {
  font-size: 14px;      /* Minimum for body text */
  line-height: 1.5;     /* 21px line height */
}

.text-caption-min {
  font-size: 12px;      /* Minimum for captions */
  line-height: 1.5;     /* 18px line height */
  letter-spacing: 0.02em; /* Improve readability */
}

/* Mobile Font Sizes */
@media (max-width: 768px) {
  .text-body-mobile {
    font-size: 16px;    /* Prevent zoom on iOS */
    line-height: 1.5;
  }
}
```

### 9.5 Screen Reader Support
```css
/* Visually Hidden (Screen Reader Only) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000000;
  color: #FFFFFF;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}

/* ARIA Live Regions */
.announcement {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

[aria-live="polite"] {
  /* Announces when idle */
}

[aria-live="assertive"] {
  /* Interrupts current announcement */
}
```

### 9.6 Keyboard Navigation
```css
/* Tab Order Indicators */
[tabindex="0"] {
  /* Focusable in normal tab order */
}

[tabindex="-1"] {
  /* Focusable programmatically only */
}

/* Keyboard Shortcuts Display */
.keyboard-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #F5F5F5;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}
```

---

## 10. Theme Specifications

### 10.1 Light Theme Values
```css
.theme-light {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F5F5F5;
  --bg-canvas: #FAFAFA;
  --bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text */
  --text-primary: #212121;
  --text-secondary: #616161;
  --text-tertiary: #9E9E9E;
  --text-disabled: #BDBDBD;
  --text-inverse: #FFFFFF;

  /* Borders */
  --border-light: #EEEEEE;
  --border-default: #E0E0E0;
  --border-dark: #BDBDBD;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.16);

  /* Interactive */
  --hover-bg: #F5F5F5;
  --active-bg: #EEEEEE;
  --selected-bg: #E3F2FD;
  --focus-ring: #2196F3;
}
```

### 10.2 Dark Theme Values
```css
.theme-dark {
  /* Backgrounds */
  --bg-primary: #121212;
  --bg-secondary: #1E1E1E;
  --bg-tertiary: #242424;
  --bg-canvas: #0A0A0A;
  --bg-overlay: rgba(0, 0, 0, 0.7);

  /* Text */
  --text-primary: rgba(255, 255, 255, 0.87);
  --text-secondary: rgba(255, 255, 255, 0.60);
  --text-tertiary: rgba(255, 255, 255, 0.38);
  --text-disabled: rgba(255, 255, 255, 0.25);
  --text-inverse: #121212;

  /* Borders */
  --border-light: rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.12);
  --border-dark: rgba(255, 255, 255, 0.20);

  /* Shadows (elevated surfaces) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.45);
  --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.55);

  /* Interactive */
  --hover-bg: rgba(255, 255, 255, 0.05);
  --active-bg: rgba(255, 255, 255, 0.10);
  --selected-bg: rgba(33, 150, 243, 0.20);
  --focus-ring: #90CAF9;
}
```

### 10.3 High Contrast Theme
```css
.theme-high-contrast {
  /* Backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #000000;
  --bg-tertiary: #000000;
  --bg-canvas: #000000;
  --bg-overlay: #000000;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #FFFFFF;
  --text-tertiary: #FFFFFF;
  --text-disabled: #808080;
  --text-inverse: #000000;

  /* Borders */
  --border-light: #FFFFFF;
  --border-default: #FFFFFF;
  --border-dark: #FFFFFF;

  /* No shadows in high contrast */
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;

  /* Interactive */
  --hover-bg: #FFFFFF;
  --hover-text: #000000;
  --active-bg: #00FFFF;
  --selected-bg: #FFFF00;
  --focus-ring: #00FF00;

  /* Semantic colors */
  --error: #FF0000;
  --warning: #FFFF00;
  --success: #00FF00;
  --info: #00FFFF;
}
```

### 10.4 Theme Switching Behavior
```javascript
// Theme Detection
const themeConfig = {
  default: 'light',
  storage: 'localStorage',
  key: 'user-theme',
  systemPreference: true,
  transitions: {
    duration: 350,
    properties: ['background-color', 'color', 'border-color']
  }
};

// CSS Transition for Theme Switch
.theme-transition * {
  transition:
    background-color 350ms ease-out,
    color 350ms ease-out,
    border-color 350ms ease-out,
    fill 350ms ease-out,
    stroke 350ms ease-out !important;
}

// Prevent Flash of Incorrect Theme
html {
  background: var(--bg-primary);
  color: var(--text-primary);
}

// Media Query Support
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Apply dark theme */
  }
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    /* Apply light theme */
  }
}

@media (prefers-contrast: high) {
  :root {
    /* Apply high contrast overrides */
  }
}
```

### 10.5 Component Theme Variations
```css
/* Button Theme Variants */
.button-primary {
  /* Light Theme */
  background: #2196F3;
  color: #FFFFFF;
}

.theme-dark .button-primary {
  background: #90CAF9;
  color: #121212;
}

.theme-high-contrast .button-primary {
  background: #FFFFFF;
  color: #000000;
  border: 2px solid #FFFFFF;
}

/* Input Theme Variants */
.input {
  /* Light Theme */
  background: #FFFFFF;
  border: 1px solid #BDBDBD;
  color: #212121;
}

.theme-dark .input {
  background: #1E1E1E;
  border: 1px solid rgba(255, 255, 255, 0.20);
  color: rgba(255, 255, 255, 0.87);
}

.theme-high-contrast .input {
  background: #000000;
  border: 2px solid #FFFFFF;
  color: #FFFFFF;
}
```

---

## Appendix A: Visual Examples

### Component States
```
Button States:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Default │ │  Hover  │ │ Active  │ │ Focus   │ │Disabled │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
  #2196F3     #1E88E5     #1976D2    +outline    #BDBDBD
```

### Layout Grid
```
Desktop Layout (1440px):
┌────────────────────────────────────────────────┐
│                   Header (64px)                 │
├────────┬────────────────────────┬──────────────┤
│Sidebar │      Canvas Area        │Property Panel│
│ 280px  │     Flexible Width      │    320px     │
│        │                         │              │
│        │    ┌──────────────┐     │              │
│        │    │              │     │              │
│        │    │   Drawing    │     │              │
│        │    │    Canvas    │     │              │
│        │    │              │     │              │
│        │    └──────────────┘     │              │
│        │                         │              │
└────────┴────────────────────────┴──────────────┘
```

### Touch Gesture Zones
```
Touch Target Areas:
     44px minimum
  ┌─────────────┐
  │             │ 44px
  │   Target    │ minimum
  │             │
  └─────────────┘

  8px minimum spacing between targets
```

---

## Appendix B: Implementation Notes

### CSS Custom Properties Setup
```css
:root {
  /* Include all variables defined in this document */
}

/* Automatic theme switching */
[data-theme="light"] {
  /* Light theme overrides */
}

[data-theme="dark"] {
  /* Dark theme overrides */
}

[data-theme="high-contrast"] {
  /* High contrast overrides */
}
```

### JavaScript Theme Manager
```javascript
class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'high-contrast'];
    this.currentTheme = this.detectTheme();
  }

  detectTheme() {
    // Check localStorage
    // Check system preference
    // Return default
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('user-theme', theme);
  }

  toggleTheme() {
    // Cycle through themes
  }
}
```

### Responsive Utilities
```css
/* Hide/Show utilities */
.mobile-only { display: none; }
.tablet-only { display: none; }
.desktop-only { display: none; }

@media (max-width: 768px) {
  .mobile-only { display: block; }
  .mobile-hide { display: none; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .tablet-only { display: block; }
  .tablet-hide { display: none; }
}

@media (min-width: 1025px) {
  .desktop-only { display: block; }
  .desktop-hide { display: none; }
}
```

---

## Version History

| Version | Date       | Author           | Changes                                |
|---------|------------|------------------|----------------------------------------|
| 1.0     | 2025-09-19 | UX/UI Team      | Initial comprehensive specifications   |

---

## Contact Information

For questions or clarifications regarding these specifications, please contact the UX/UI Design Team.

**Design System Repository**: [Internal Link]
**Component Library**: [Internal Link]
**Design Tokens**: [Internal Link]

---

*End of UI/UX Specifications Document*