import type { Metadata, Viewport } from "next";
import "./globals.css";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: {
    default: "Klar Concierge | Personalised Holiday Planning by Klar Travels",
    template: "%s | Klar Concierge",
  },
  description:
    "Describe your ideal holiday and receive personalised destination ideas, itineraries and expert support from Klar Travels.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Klar Concierge | Personalised Holiday Planning by Klar Travels",
    description:
      "Describe your ideal holiday and receive personalised destination ideas, itineraries and expert support from Klar Travels.",
    url: config.appUrl,
    siteName: "Klar Concierge",
    images: [{ url: "/brand/klar-logo.png", width: 1320, height: 624, alt: "Klar Travels" }],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Klar Travels",
  brand: "Klar Travels",
  description:
    "Klar Concierge is an AI-assisted holiday planning service by Klar Travels. A Klar travel expert finalises every plan.",
  url: config.appUrl,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
