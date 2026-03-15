"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";
import { BackgroundProvider } from "@/lib/BackgroundContext";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing environment variable `NEXT_PUBLIC_CONVEX_URL`.");
}

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <BackgroundProvider>
        {children}
      </BackgroundProvider>
    </ConvexAuthProvider>
  );
}
