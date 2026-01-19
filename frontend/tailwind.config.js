/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 에이전트 색상
        'agent-vibe': '#a855f7',
        'agent-validator': '#3b82f6',
        'agent-optimizer': '#eab308',
        'agent-security': '#ef4444',
        'agent-ux': '#22c55e',
        // 배경 색상
        'bg-primary': '#0d1117',
        'bg-secondary': '#161b22',
        'bg-tertiary': '#21262d',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
