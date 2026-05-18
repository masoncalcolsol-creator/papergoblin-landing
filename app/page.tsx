export default function Page() {
  const demo = "https://ori-intake-papergoblin.vercel.app/";
  const portfolio = "https://nullworks-portfolio.vercel.app/";
  const github = "https://github.com/masoncalcolsol-creator";
  const email = "mailto:Masoncalcolsol@gmail.com?subject=PAPERGOBLIN%20Demo%20Follow-up";

  const cards = [
    {
      label: "PROBLEM",
      title: "Real-world OCR fails where reality gets ugly.",
      body: "Receipts, labels, and scanned documents are messy, damaged, inconsistent, folded, cropped, blurry, and context-dependent.",
    },
    {
      label: "SOLUTION",
      title: "PAPERGOBLIN converts chaos into packets.",
      body: "OCR output becomes editable correction bubbles, semantic labels, confidence flags, and structured operational data.",
    },
    {
      label: "CORE INSIGHT",
      title: "The human is not fixing OCR.",
      body: "The human is labeling reality. Every correction becomes training signal for future parsing, routing, and automation.",
    },
  ];

  const stack = ["Next.js", "TypeScript", "Tailwind", "Tesseract.js", "Supabase", "Vercel"];
  const flow = ["scan", "OCR", "correct", "label", "packet", "telemetry", "learn"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f7] text-[#071923]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_5%,rgba(85,240,221,.28),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(157,135,255,.16),transparent_24%),radial-gradient(circle_at_50%_105%,rgba(51,105,255,.10),transparent_36%)]" />

      <section className="relative mx-auto max-w-6xl px-5 py-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-[#dce7e5] bg-white/80 p-4 shadow-sm backdrop-blur">
          <a href={portfolio} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#071923] text-sm font-black text-white shadow-sm">NW</div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#1d6f68]">NULLWORKS</div>
              <div className="text-sm font-bold text-[#52636b]">Mason Perry // Operational Systems Builder</div>
            </div>
          </a>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <a className="rounded-full border border-[#dce7e5] bg-white px-4 py-2 text-[#071923] shadow-sm hover:bg-[#edf7f5]" href={portfolio}>Portfolio</a>
            <a className="rounded-full border border-[#dce7e5] bg-white px-4 py-2 text-[#071923] shadow-sm hover:bg-[#edf7f5]" href={github}>GitHub ↗</a>
            <a className="rounded-full bg-[#071923] px-4 py-2 text-white shadow-sm hover:bg-[#102b38]" href={demo}>Live App ↗</a>
          </nav>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
          <div className="rounded-[38px] border border-[#dce7e5] bg-white/85 p-7 shadow-xl shadow-[#19343f]/10 backdrop-blur">
            <div className="inline-flex rounded-full border border-[#bdece5] bg-[#e6fffb] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#13756d]">
              OCR / Document Intelligence
            </div>
            <h1 className="mt-7 max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.08em] text-[#071923] sm:text-7xl lg:text-8xl">
              Feed messy documents to a system that learns.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#52636b]">
              PAPERGOBLIN is a live OCR/document-intake system that turns receipts, labels, and scanned chaos into editable correction bubbles, structured operational packets, and telemetry the system can learn from.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={demo} className="rounded-2xl bg-[#071923] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#071923]/15 hover:bg-[#102b38]">Try PAPERGOBLIN →</a>
              <a href={portfolio} className="rounded-2xl border border-[#dce7e5] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#071923] shadow-sm hover:bg-[#edf7f5]">Main Portfolio →</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {["OCR recovery", "Editable UI", "Correction telemetry", "Agent-readable packets"].map((item) => (
                <span key={item} className="rounded-full border border-[#dce7e5] bg-[#f7fbfa] px-3 py-2 text-xs font-bold text-[#52636b]">{item}</span>
              ))}
            </div>
          </div>

          <aside className="rounded-[38px] border border-[#0f2530] bg-[#071923] p-6 text-white shadow-xl shadow-[#19343f]/20">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#6ff7e5]">Live Prototype</div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em]">PAPERGOBLIN</h2>
              <p className="mt-3 text-sm leading-6 text-[#b7c8ce]">
                Built in flight. Deployed live. OCR → editable bubbles → structured packets → learning loop.
              </p>
            </div>
            <div className="mt-5 rounded-[30px] border border-white/10 bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-[#7b919a]">System.boot()</div>
              <pre className="mt-4 overflow-hidden text-xs leading-6 text-[#bafff4]">{`> scan.receipt()
> ocr.extract()
> human.correct()
> packet.structure()
> telemetry.store()
> parser.learn()`}</pre>
            </div>
            <a href={demo} className="mt-5 flex items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#071923] hover:bg-[#dffbf7]">Open Live App ↗</a>
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <div className="text-xs font-black uppercase tracking-[0.32em] text-[#1d6f68]">Selected System</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#071923]">
              Live prototype showing OCR recovery, correction workflows, telemetry, and product-system thinking.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <article key={card.label} className="rounded-[30px] border border-[#dce7e5] bg-white/85 p-5 shadow-lg shadow-[#19343f]/8">
                <div className="text-xs font-black uppercase tracking-[0.26em] text-[#1d6f68]">{card.label}</div>
                <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-0.045em] text-[#071923]">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#52636b]">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[38px] border border-[#dce7e5] bg-white/85 p-6 shadow-xl shadow-[#19343f]/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.32em] text-[#1d6f68]">Workflow Route</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#071923]">Chaos becomes structured signal.</h2>
            </div>
            <a href={demo} className="rounded-2xl bg-[#071923] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-[#102b38]">Feed the Goblin →</a>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {flow.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#dce7e5] bg-[#f7fbfa] p-4">
                <div className="text-xs font-black text-[#1d6f68]">0{index + 1}</div>
                <div className="mt-2 text-lg font-black uppercase tracking-[0.06em] text-[#071923]">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[38px] border border-[#dce7e5] bg-white/85 p-6 shadow-xl shadow-[#19343f]/10">
            <div className="text-xs font-black uppercase tracking-[0.32em] text-[#1d6f68]">Built With</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stack.map((item) => (
                <div key={item} className="rounded-2xl border border-[#dce7e5] bg-[#071923] px-4 py-3 text-sm font-black text-white shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[38px] border border-[#0f2530] bg-[#071923] p-6 text-white shadow-xl shadow-[#19343f]/20">
            <div className="text-xs font-black uppercase tracking-[0.32em] text-[#6ff7e5]">Why It Matters</div>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em]">
              I build the operational layer around AI failure.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#b7c8ce]">
              The model is impressive. The real-world workflow around the model is usually the dumpster fire. PAPERGOBLIN proves the missing layer: correction, validation, confidence, persistence, telemetry, and recovery.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[38px] border border-[#dce7e5] bg-white/85 p-6 text-center shadow-xl shadow-[#19343f]/10">
          <div className="text-xs font-black uppercase tracking-[0.32em] text-[#1d6f68]">Outcome</div>
          <h2 className="mx-auto mt-3 max-w-5xl text-4xl font-black leading-tight tracking-[-0.06em] text-[#071923]">
            Built and deployed during commercial airline travel using laptop + phone + in-flight constraints.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[#52636b]">
            Not a mockup. A working field prototype built under imperfect conditions — because operational systems should survive reality.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={demo} className="rounded-2xl bg-[#071923] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-[#102b38]">Try Live Demo →</a>
            <a href={email} className="rounded-2xl border border-[#dce7e5] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#071923] hover:bg-[#edf7f5]">Contact Mason →</a>
            <a href={github} className="rounded-2xl border border-[#dce7e5] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#071923] hover:bg-[#edf7f5]">GitHub ↗</a>
          </div>
        </section>

        <footer className="py-10 text-center text-xs font-black uppercase tracking-[0.28em] text-[#8ba0a8]">
          PAPERGOBLIN • OCR Recovery • Human-in-the-Loop Systems • Operational Telemetry • NULLWORKS
        </footer>
      </section>
    </main>
  );
}
