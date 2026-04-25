import type { ReactNode } from 'react';

export default function SectionHeader({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em] flex items-center gap-2">
      {icon}
      <span>{title}</span>
    </h3>
  );
}
