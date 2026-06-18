"use client";

import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { ReactNode, useState } from "react";
import { authClient } from "@/lib/auth-client";

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
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Service unavailable</h1>
              <p className="text-sm text-[#525252]">
                A required platform service is unavailable. Please retry after
                services are restored.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as AuthClient}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
