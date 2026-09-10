function Home() {
  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-slate-900/70 px-8 py-14 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:px-12">
        <div className="max-w-2xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-sky-300/80">
            Frontend starter
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Home page ready for your routes.
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-300 sm:text-lg">
            Build your site inside the{" "}
            <span className="font-medium text-white">pages</span> and{" "}
            <span className="font-medium text-white">components</span> folders
            while React Router handles navigation.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Home;
