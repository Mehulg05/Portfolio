import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/animation/SmoothScroll";
import { profile } from "@/lib/content/profile";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-cond",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: profile.name,
  description: profile.supporting,
  openGraph: {
    title: profile.name,
    description: profile.headline,
    url: siteUrl,
    siteName: profile.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: profile.name,
    description: profile.headline,
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  email: profile.email,
  url: siteUrl,
  jobTitle: "Developer Trainee",
  worksFor: { "@type": "Organization", name: "Sahayogi One" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Bennett University" },
  sameAs: [profile.github, profile.linkedin],
  knowsAbout: [
    "Full-stack development",
    "React.js",
    "Machine learning",
    "Hyperspectral remote sensing",
    "Cloud infrastructure",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The head script below adds a class here before hydration — expected, not a bug.
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable} h-full`}
    >
      <head>
        {/* Runs before paint so revealed content never flashes in and back out. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("js-motion")}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <SmoothScroll />
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-[12px] focus:text-ground"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
