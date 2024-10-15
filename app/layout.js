import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const RootLayout = ({ children }) => (
  <html lang="en">
    <body className={inter.className}>{children}</body>
  </html>
);

export const metadata = {
  title: 'Pixel Nation Generator',
  description: 'Generate pixel-art style maps of countries using dot patterns',
};

export default RootLayout;
