export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-primary">TDP</h1>
        <p className="text-xl text-muted-foreground">
          Telecom Distribution Platform
        </p>
        <div className="flex gap-4 mt-8">
          <a
            href="/api/health"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Health Check
          </a>
        </div>
      </div>
    </main>
  );
}
