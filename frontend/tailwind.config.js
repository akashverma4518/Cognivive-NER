/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elder: {
          bg: '#F7F5FF',         // Very light lavender background (friendly & calm)
          card: '#FFFFFF',       // Clean card background
          navy: '#111827',       // Dark navy text (strong readability)
          purple: '#6C3EDC',     // Primary vibrant purple
          purpleDark: '#5B32C4',
          purpleLight: '#8B5CF6',// Secondary purple
          lavender: '#EDE9FE',   // Light lavender
          softPurple: '#DDD6FE', // Soft purple
          pink: '#F3A6C8',       // Optional friendly pink accent
          amber: '#6C3EDC',      // Replaced orange with vibrant purple
          amberDark: '#5B32C4',
          sage: '#10B981',       // Calming mint green for success/completed
          sageDark: '#047857',
          sky: '#8B5CF6',        // Mapped sky accents to secondary purple
          rose: '#E11D48',       // High-visibility rose for alerts/urgent
          border: '#DDD6FE'      // Subtle tactile lavender border
        }
      },
      fontSize: {
        'elder-sm': '1.125rem',  // 18px minimum small text
        'elder-base': '1.25rem', // 20px comfortable reading text
        'elder-lg': '1.5rem',    // 24px section headings
        'elder-xl': '2rem',      // 32px major headings
        'elder-2xl': '2.5rem'    // 40px hero greetings
      },
      minHeight: {
        'touch': '60px'          // Minimum 60px touch target
      },
      minWidth: {
        'touch': '60px'
      }
    },
  },
  plugins: [],
}
