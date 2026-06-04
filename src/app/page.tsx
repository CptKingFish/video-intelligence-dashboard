import Link from "next/link";
import {
  Activity,
  BarChart3,
  Clapperboard,
  Gauge,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButtons } from "@/components/landing/auth-buttons";
import { isClerkEnabled } from "@/lib/env";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Embedding-powered analysis",
    body: "Every upload is encoded into a high-dimensional vector embedding that captures the semantic shape of your footage.",
  },
  {
    icon: Activity,
    title: "Stimulation timeline",
    body: "A per-second salience score pinpoints the exact moments your audience leans in — no scrubbing required.",
  },
  {
    icon: BarChart3,
    title: "Beautiful, useful graphs",
    body: "Engagement curves, energy vs. motion overlays, and an embedding fingerprint, all rendered in real time.",
  },
  {
    icon: Clapperboard,
    title: "Auto thumbnails",
    body: "We capture the video's first frame on the client and generate a unique UUID-keyed project automatically.",
  },
  {
    icon: Gauge,
    title: "Production-ready stack",
    body: "Next.js App Router, Clerk auth, Neon + TimescaleDB, PostHog analytics, and Docker — wired and waiting.",
  },
  {
    icon: Workflow,
    title: "Built to scale",
    body: "Relational metadata in Neon, time-series at home in a Timescale hypertable, decoupled from processing.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          VideoIntel
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthButtons clerkEnabled={isClerkEnabled} />
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6">
        <section className="flex flex-col items-center pt-16 pb-20 text-center sm:pt-24">
          <Badge variant="outline" className="mb-6 gap-1.5 py-1">
            <Sparkles className="size-3.5 text-primary" />
            Video intelligence, instantly
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Find the moments that{" "}
            <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
              make people watch
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            Upload a video and VideoIntel turns it into a vector embedding,
            scores every second for stimulation, and surfaces your highlights
            with graphs that actually mean something.
          </p>
          <div className="mt-9">
            <AuthButtons clerkEnabled={isClerkEnabled} size="lg" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {isClerkEnabled
              ? "Secure auth by Clerk · Projects stored in Neon"
              : "Running without sign-in · Configure Clerk for production"}
          </p>
        </section>

        {/* Features */}
        <section className="grid w-full grid-cols-1 gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl border bg-card/60 p-6 backdrop-blur transition-colors hover:border-primary/40"
            >
              <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-2 border-t pt-6 sm:flex-row">
          <span>© 2026 VideoIntel. Built with Next.js.</span>
          <span>Next.js · Clerk · Neon · TimescaleDB · PostHog</span>
        </div>
      </footer>
    </div>
  );
}
