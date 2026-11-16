import { profile } from "@/lib/content/profile";
import { now } from "@/lib/content/roadmap";
import { sourceUrl } from "@/lib/site";

const links = [
  { label: "Source", href: sourceUrl, context: "the code for this site on GitHub" },
  { label: "Resume", href: profile.resume, context: "PDF" },
];

/*
  Kept quiet on purpose: the sheet's title block, not another call to action. Both links
  open a new tab (one leaves the site, the other is a PDF), and say so to screen readers.
*/
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 label-mono text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {/* On phones it breaks between name and date, never inside the date. */}
        <p className="flex flex-col gap-1 sm:flex-row sm:gap-0">
          <span>© 2026 {profile.name}</span>
          <span>
            <span aria-hidden="true" className="hidden sm:inline">
              {" · "}
            </span>
            Updated {now.asOf}
          </span>
        </p>
        <ul className="flex items-center gap-6">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-ink-faint hover:text-accent sm:min-h-0"
              >
                {link.label}
                <span className="sr-only">, {link.context}, opens in a new tab</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
