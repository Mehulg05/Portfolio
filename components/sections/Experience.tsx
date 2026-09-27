import { Reveal } from "@/components/animation/Reveal";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { roles } from "@/lib/content/experience";

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader
        index="02"
        label="Experience"
        title="Experience"
        caption="Newest first. Work code is private to my employers."
      />

      {/*
        Side by side from lg up, so the heading and every role fit on one screen when the
        nav lands here. Each card is a column: header, summary, bullets, then the stack
        pinned to the bottom so the two cards' tags line up.
      */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {roles.map((role) => (
          <Reveal as="article" key={role.id} className="flex flex-col border border-line bg-surface">
            <header className="border-b border-line px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-display text-xl tracking-tight text-ink sm:text-2xl">
                  {role.company}
                </h3>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                    role.current ? "text-accent" : "text-ink-faint"
                  }`}
                >
                  {role.period}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                {role.title}
              </p>
            </header>

            <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
              <p className="text-[14px] leading-relaxed text-ink-dim">{role.summary}</p>

              {role.highlights ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {role.highlights.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden="true" className="mt-[8px] h-1 w-1 shrink-0 bg-accent" />
                      <p className="text-[14px] leading-relaxed text-ink-dim">{line}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {role.stack ? (
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {role.stack.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              ) : null}

              {role.products ? (
                <div className="mt-7 flex flex-col gap-6">
                  {role.products.map((product) => (
                    <div
                      key={product.name}
                      className="border-l border-line-bright pl-5 sm:pl-6"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                        <h4 className="font-display text-xl tracking-tight text-ink">
                          {product.name}
                        </h4>
                        {product.period ? (
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                            {product.period}
                          </span>
                        ) : null}
                        {product.status ? (
                          <span className="border border-line-bright px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                            {product.status}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2.5 max-w-[68ch] text-[15px] leading-relaxed text-ink-dim">
                        {product.what}
                      </p>

                      <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink">
                        {product.ownership}
                      </p>

                      {product.details ? (
                        <ul className="mt-3 flex flex-col gap-2">
                          {product.details.map((line) => (
                            <li key={line} className="flex gap-3">
                              <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 bg-accent" />
                              <p className="max-w-[66ch] text-[14px] leading-relaxed text-ink-dim">{line}</p>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {product.stack.map((item) => (
                          <Tag key={item}>{item}</Tag>
                        ))}
                      </div>

                      <div className="mt-5">
                        <LinkButton href={product.href} context={product.name}>
                          Product site
                        </LinkButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
