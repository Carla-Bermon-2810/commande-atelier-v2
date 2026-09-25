import { ReactNode } from "react";

type ContextBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  meta?: ReactNode;
};

export default function ContextBanner({ eyebrow, title, description, image, meta }: ContextBannerProps) {
  return (
    <section className="relative mb-5 min-h-40 overflow-hidden rounded-2xl border border-slate-800 bg-[#10191e] text-white lg:min-h-[10.5rem] lg:rounded-xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,24,.96)_0%,rgba(10,23,30,.82)_42%,rgba(10,18,24,.18)_100%)]" />
      <div className="relative flex min-h-40 flex-col justify-center px-5 py-5 sm:px-8 lg:min-h-[10.5rem] lg:px-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff9a76]">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-200 sm:text-base">{description}</p>
          </div>
          {meta && <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">{meta}</div>}
        </div>
      </div>
    </section>
  );
}
