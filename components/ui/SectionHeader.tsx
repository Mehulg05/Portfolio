import { Reveal } from "@/components/animation/Reveal";

type Props = {
  index: string;
  label: string;
  title: string;
  caption?: string;
};

export function SectionHeader({ index, label, title, caption }: Props) {
  return (
    <Reveal as="header" className="tick-frame border-t border-line pt-6">
      <div className="flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.16em]">
        <span className="text-ink-faint">{label}</span>
      </div>
      <h2 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {caption ? (
        <p className="mt-3 max-w-[62ch] text-ink-dim">{caption}</p>
      ) : null}
    </Reveal>
  );
}
