"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Database, Terminal } from "lucide-react";
import { ReactNode, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [convex] = useState(() =>
    convexUrl ? new ConvexReactClient(convexUrl) : null,
  );

  if (!convex) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-6 text-[#111111]">
        <section className="w-full max-w-2xl rounded-lg border border-[#d4d4d4] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#171717] text-white">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Convex is not running yet</h1>
              <p className="text-sm text-[#525252]">
                Start the local backend and Next.js together from this repo.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border border-[#d4d4d4] bg-[#f5f5f5] p-3 font-mono text-sm">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-[#171717]" />
            <span>npm run dev:local</span>
          </div>
        </section>
      </main>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
