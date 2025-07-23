/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // New theme colors (Blue-Grey / Teal & Off-White)
        'theme-dark-bg': '#2F4F4F', // Dark Slate Gray / Deep Teal
        'theme-light-bg': '#4682B4', // Steel Blue - for active states/elements
        'theme-content-bg': '#F8F8F8', // Off-white (Putih Tulang) for content areas
        'theme-border-light': '#D3D3D3', // Light Gray - subtle border

        // Accent colors (adjusted to complement new theme)
        'accent-blue': '#1E90FF', // Dodger Blue - primary action, strong accent
        'accent-green': '#3CB371', // Medium Sea Green - positive, success
        'accent-orange': '#FF8C00', // Dark Orange - warning, neutral
        'accent-red': '#DC143C', // Crimson - negative, danger
        
        // Icon background colors (adjusted to new accents)
        'icon-blue-bg': '#E0FFFF', // Light Cyan
        'icon-green-bg': '#F0FFF0', // Honeydew
        'icon-orange-bg': '#FFFACD', // Lemon Chiffon
        'icon-red-bg': '#FFDAB9', // Peach Puff

        // Shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};