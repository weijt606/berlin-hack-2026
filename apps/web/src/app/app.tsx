import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { HealthCheckResponse } from '@procurement-ai/shared-types';

function Home() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHealth(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Procurement AI</h2>
      <p className="text-muted-foreground">
        Nx monorepo · NestJS · MikroORM · React · Tailwind · shadcn
      </p>
      <div className="rounded-md border p-4">
        <div className="mb-2 text-sm font-medium">API health</div>
        {health && (
          <pre className="text-xs">{JSON.stringify(health, null, 2)}</pre>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={checkHealth} className="mt-3" size="sm">
          Re-check
        </Button>
      </div>
    </div>
  );
}

function Page2() {
  return (
    <div>
      <Link to="/" className="underline">
        ← back
      </Link>
    </div>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <nav className="mb-6 flex gap-4 text-sm">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/page-2" className="hover:underline">
          Page 2
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page-2" element={<Page2 />} />
      </Routes>
    </div>
  );
}

export default App;
