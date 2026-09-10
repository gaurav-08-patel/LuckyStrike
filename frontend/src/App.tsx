function App() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%)]" />

      <section className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-12">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Frontend scaffold ready
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-sky-300/80">
              Vite + React + TypeScript + Tailwind v4
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              A clean frontend starter for your new project.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              This app is set up as{" "}
              <span className="font-medium text-white">frontend</span> so you
              can keep your backend alongside it in the same workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Tailwind v4 enabled
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                TypeScript configured
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Vite dev server ready
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
              <span>Next steps</span>
              <span>frontend</span>
            </div>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Run <span className="font-mono text-cyan-300">npm run dev</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Start building your pages and components in{" "}
                <span className="font-mono">src/</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Add your backend in a separate folder beside this app
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
