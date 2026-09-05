import { Reveal } from "@/components/animation/Reveal";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { roles } from "@/lib/content/experience";

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        index="05"
        label="Experience"
        title="Products in production"
        caption="Work shipped for a company, where the constraints are somebody else's business, a regulator, and a platform that can shut you off."
      />

      <div className="mt-14 flex flex-col gap-8">
        {roles.map((role) => (
          <Reveal as="article" key={role.id} className="border border-line bg-surface">
            <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="font-display text-2xl tracking-tight text-ink">
                  {role.company}
                </h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                  {role.title}
                </span>
              </div>
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                  role.current ? "text-accent" : "text-ink-faint"
                }`}
              >
                {role.period}
              </span>
            </header>

            <div className="px-5 py-6 sm:px-7">
              <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-dim">
                {role.summary}
              </p>

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
