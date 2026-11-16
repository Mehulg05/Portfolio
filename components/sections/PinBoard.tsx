import { certifications, courseraVerify } from "@/lib/content/profile";

/* The certifications as a flat two-column list, each with its verify link. */
export function PinBoard() {
  return (
    <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
      {certifications.map((item) => (
        <li key={item.name} className="flex flex-col bg-surface px-5 py-4">
          {item.credentialId ? (
            <a
              href={`${courseraVerify}${item.credentialId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] leading-snug text-ink underline decoration-line-bright underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              {item.name}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only">, verify credential</span>
            </a>
          ) : (
            <p className="text-[14px] leading-snug text-ink">{item.name}</p>
          )}
          <p className="mt-auto pt-2 font-mono text-[11px] text-ink-faint">
            {item.issuer} · {item.date}
          </p>
        </li>
      ))}
    </ul>
  );
}
