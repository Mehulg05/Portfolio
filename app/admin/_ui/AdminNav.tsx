"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Overview" },
  { href: "/messages", label: "Messages" },
  { href: "/pulse", label: "Pulse" },
  { href: "/health", label: "Health" },
] as const;

/*
  On the admin host the browser path is the clean one (/messages). The internal /admin
  prefix is stripped anyway, in case it ever surfaces: the server render of a rewrite, or
  a direct dev visit before the main host redirects it.
*/
export function cleanAdminPath(pathname: string) {
  const path = pathname.replace(/^\/admin(?=\/|$)/, "").replace(/\/+$/, "");
  return path || "/";
}

function isCurrent(href: string, path: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

type Props = {
  /** Null when the count could not be read; the badge is simply left out. */
  unread: number | null;
};

export function AdminNav({ unread }: Props) {
  const path = cleanAdminPath(usePathname());

  return (
    <nav
      aria-label="Admin"
      className="order-last -mx-5 w-[calc(100%+2.5rem)] border-t border-line px-5 sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 lg:order-none lg:mx-0 lg:mr-auto lg:w-auto lg:border-t-0 lg:px-0"
    >
      <ul className="flex sm:-mx-3 sm:gap-1">
        {items.map(({ href, label }) => (
          <li key={href} className="flex-auto sm:flex-none">
            <Link
              href={href}
              aria-current={isCurrent(href, path) ? "page" : undefined}
              className="relative flex h-11 items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-px hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:bg-accent sm:px-3 lg:h-14"
            >
              {label}
              {href === "/messages" && unread ? (
                <span className="text-accent tabular-nums">
                  {unread}
                  <span className="sr-only"> unread</span>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
