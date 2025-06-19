
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'serif': ['Playfair Display', 'serif'],
				'sans': ['Inter', 'sans-serif'],
				'display': ['Lora', 'serif'],
			},
			colors: {
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
				journey: {
					pink: '#E9407A',
					red: '#D62839',
					lightPink: '#F8D8E3',
					darkRed: '#831230',
					blue: '#4A6FA5',
					teal: '#3D8C91',
					purple: '#6B4E71',
					light: '#F5F7FA',
					dark: '#2D3748'
				},
				sidebar: {
					DEFAULT: '#F8D8E3',
					foreground: '#831230',
					primary: '#E9407A',
					'primary-foreground': '#FFF',
					accent: '#4A6FA5',
					'accent-foreground': '#FFF',
					border: '#E5E7EB',
					ring: '#D1D5DB'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-3px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
				'shimmer': 'shimmer 3s linear infinite',
				'spin-slow': 'spin-slow 8s linear infinite',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-journey': 'linear-gradient(135deg, #E9407A 0%, #D62839 100%)',
				'gradient-journey-light': 'linear-gradient(135deg, #F8D8E3 0%, #E9407A 100%)',
				'gradient-journey-teal': 'linear-gradient(135deg, #3D8C91 0%, #4A6FA5 100%)',
				'soft-light': 'linear-gradient(120deg, #fdfbfb 0%, #F8D8E3 100%)',
				'soft-glow': 'radial-gradient(circle at center, rgba(233,64,122,0.2) 0%, rgba(255,255,255,0) 70%)'
			},
			boxShadow: {
				'journey': '0 4px 14px rgba(233, 64, 122, 0.15)',
				'journey-md': '0 6px 20px rgba(233, 64, 122, 0.2)',
				'journey-lg': '0 10px 30px rgba(233, 64, 122, 0.25)'
			},
			transitionProperty: {
				'height': 'height',
				'spacing': 'margin, padding'
			},
			transitionTimingFunction: {
				'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
