/**
 * PMK Child Monitor - Dark Theme Colors
 * Modern dark theme with red/coral accents
 */

export const colors = {
  // Background colors (darker than before)
  background: {
    primary: '#060814',      // Very deep dark - almost black
    secondary: '#0D1019',    // Slightly lighter dark
    tertiary: '#14161F',     // Card/component background
    elevated: '#1C1E29',     // Elevated elements
  },

  // Text colors
  text: {
    primary: '#FFFFFF',      // Pure white for main text
    secondary: '#A0A6C5',    // Muted gray-blue for secondary text
    tertiary: '#6B7199',     // Even more muted for hints
    disabled: '#4A4E66',     // Disabled state
    inverse: '#FFFFFF',      // White text on colored backgrounds
  },

  // Accent colors (changed to red/coral)
  accent: {
    primary: '#E85D4A',      // Professional coral-red accent
    secondary: '#FF6B5B',    // Lighter coral for hover/active
    success: '#52C41A',      // Green for success states
    warning: '#FAAD14',      // Orange for warnings
    danger: '#FF4D4F',       // Red for errors/danger
    info: '#1890FF',         // Info blue
  },

  // Status colors
  status: {
    online: '#52C41A',       // Green
    offline: '#8C8C8C',      // Gray
    warning: '#FAAD14',      // Orange
    error: '#FF4D4F',        // Red
    success: '#52C41A',      // Green (same as online)
  },

  // Border colors
  border: {
    default: '#1F222E',      // Subtle border (darker)
    light: '#2A2D3A',        // Slightly visible border (darker)
    focus: '#E85D4A',        // Focused state (red accent)
  },

  // Overlay colors (with opacity)
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    blur: 'rgba(6, 8, 20, 0.9)',
  },

  // Gradient colors (updated to red/coral) - using tuples for TypeScript
  gradient: {
    primary: ['#E85D4A', '#FF6B5B'] as const,    // Red/coral gradient
    dark: ['#060814', '#0D1019'] as const,       // Darker gradient
    card: ['#14161F', '#1C1E29'] as const,       // Darker card gradient
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 12,
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
};
