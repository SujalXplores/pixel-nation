import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const RootLayout = ({ children }) => (
  <html lang="en">
    <body className={inter.className}>{children}</body>
  </html>
);

export const metadata = {
  title: 'Pixel map generator',
  description: 'Generate a pixel map of a country',
};

export default RootLayout;
