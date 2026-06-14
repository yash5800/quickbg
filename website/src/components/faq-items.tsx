"use client";

import { motion } from "framer-motion";

const icons = [
  "🎯", "💰", "🖼️", "💼", "🔒", "🧠", "⚡", "📱",
  "🔬", "📷", "📦", "📋", "📊", "💻", "🏆", "🖥️",
  "🔗", "🛡️", "✨", "💡",
];

const gradients = [
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
];

const bgGradients = [
  "from-sky-500/10 via-transparent to-transparent",
  "from-emerald-500/10 via-transparent to-transparent",
  "from-violet-500/10 via-transparent to-transparent",
  "from-amber-500/10 via-transparent to-transparent",
  "from-rose-500/10 via-transparent to-transparent",
];

interface FaqItemData {
  id: string;
  q: string;
  a: string;
}

function StyleAccentLeft({ item, icon, index }: { item: FaqItemData; icon: string; index: number }) {
  const g = gradients[index % gradients.length];
  const bg = bgGradients[index % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-6 pl-8"
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${g}`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">{icon}</span>
        <h2 className="mb-3 text-lg font-semibold">{item.q}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </div>
    </motion.div>
  );
}

function StyleIconCircle({ item, icon, index }: { item: FaqItemData; icon: string; index: number }) {
  const g = gradients[index % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex gap-5 rounded-2xl border border-border/60 bg-card/50 p-6"
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} text-2xl text-white shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="mb-2 text-lg font-semibold">{item.q}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </div>
    </motion.div>
  );
}

function StyleGradientTop({ item, icon, index }: { item: FaqItemData; icon: string; index: number }) {
  const g = gradients[index % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/50"
    >
      <div className={`bg-gradient-to-r ${g} px-6 py-3 flex items-center gap-3`}>
        <span className="text-lg">{icon}</span>
        <h2 className="font-semibold text-white">{item.q}</h2>
      </div>
      <div className="p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </div>
    </motion.div>
  );
}

function StyleNumbered({ item, icon, index }: { item: FaqItemData; icon: string; index: number }) {
  const g = gradients[index % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-border/60 bg-card/50 p-6 pt-14"
    >
      <div className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-lg text-white shadow-md`}>
        {icon}
      </div>
      <div className={`absolute left-0 top-0 text-[7rem] font-black leading-none ${g} bg-clip-text text-transparent opacity-[0.06] select-none pointer-events-none`}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="relative z-10">
        <h2 className="mb-3 text-lg font-semibold">{item.q}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </div>
    </motion.div>
  );
}

function StyleGlassSplit({ item, icon, index }: { item: FaqItemData; icon: string; index: number }) {
  const g = gradients[index % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/30 via-card/10 to-transparent p-0.5 shadow-sm"
    >
      <div className="rounded-2xl bg-background/60 p-6 backdrop-blur-sm sm:flex sm:gap-6">
        <div className="mb-4 flex items-center gap-3 sm:mb-0 sm:w-2/5 sm:flex-col sm:items-start sm:gap-2">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${g} text-xl text-white shadow-md`}>
            {icon}
          </span>
          <h2 className="text-lg font-semibold">{item.q}</h2>
        </div>
        <div className="sm:w-3/5">
          <div className={`mb-3 h-1 w-12 rounded-full bg-gradient-to-r ${g}`} />
          <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </div>
      </div>
    </motion.div>
  );
}

const styleComponents = [
  StyleAccentLeft,
  StyleIconCircle,
  StyleGradientTop,
  StyleNumbered,
  StyleGlassSplit,
];

function FaqItems({ items }: { items: FaqItemData[] }) {
  return (
    <div className="space-y-7">
      {items.map((item, i) => {
        const Comp = styleComponents[i % styleComponents.length];
        const icon = icons[i % icons.length];
        return <Comp key={item.id} item={item} icon={icon} index={i} />;
      })}
    </div>
  );
}

export function FaqPageClient({
  heading,
  subheading,
  items,
}: {
  heading: string;
  subheading: string;
  items: FaqItemData[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-14"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-4 text-muted-foreground">{subheading}</p>
      </motion.div>
      <FaqItems items={items} />
    </div>
  );
}
