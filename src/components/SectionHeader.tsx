import type { ReactNode } from 'react';

export default function SectionHeader({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2">
      {icon}
      <span>{title}</span>
    </h3>
  );
}
