import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Philly Restaurant Week Map | Center City District",
  description:
    "Explore Philadelphia Restaurant Week with an interactive map. Find the best prix-fixe dining deals across Center City - $45 and $60 dinner menus, January 18-31, 2026.",
  keywords: [
    "Philadelphia Restaurant Week",
    "Philly Restaurant Week",
    "Center City District",
    "Philadelphia dining",
    "prix fixe",
    "restaurant deals",
  ],
  openGraph: {
    title: "Philly Restaurant Week Map",
    description: "Interactive map of all participating restaurants in Philadelphia Restaurant Week 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
