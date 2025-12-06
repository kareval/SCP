import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#BE0036', // Red
                    dark: '#333333',    // Dark Grey
                },
                aux: {
                    red: '#E81B44',
                    grey: '#E1E3EA',
                },
                secondary: {
                    yellow: '#E5D352',
                    salmon: '#EB5E55',
                    teal: '#335A66',
                    purple: '#7F4073',
                },
                tertiary: {
                    cyan: '#CFFBFF',
                    teal: '#29D5E2',
                    blue: '#5586D9',
                    indigo: '#5763B7',
                },
            },
        },
    },
    plugins: [],
};
export default config;
