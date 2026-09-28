import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/animation/SmoothScroll";
import { InkDefs } from "@/components/ui/Ink";
import { meta, profile } from "@/lib/content/profile";
import { siteUrl } from "@/lib/site";

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


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.ogDescription,
    url: siteUrl,
    siteName: profile.name,
    type: "website",
  },
  twitter: {
    // The image itself comes from app/twitter-image.tsx.
    card: "summary_large_image",
    title: meta.title,
    description: meta.ogDescription,
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
  description: meta.description,
  // A current student, so affiliation rather than alumniOf until graduation.
  affiliation: { "@type": "CollegeOrUniversity", name: "Bennett University" },
  sameAs: [profile.github, profile.linkedin],
  knowsAbout: [
    "Full-stack web development",
    "NestJS",
    "Next.js",
    "PostgreSQL",
    "Machine learning",
    "Hyperspectral remote sensing",
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
        <InkDefs />
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
