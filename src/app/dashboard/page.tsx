import { Sparkles } from "lucide-react";

import { BRAND } from "@/lib/brand";
import { AbTestDialog } from "@/components/dashboard/ab-test-dialog";
import { DisabledUploadPanel } from "@/components/dashboard/disabled-upload-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProjectCard } from "@/components/dashboard/project-card";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/projects";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const projects = await getProjects(user.id);

  if (projects.length === 0) {
    return <EmptyState />;
  }

  const readyCount = projects.filter((p) => p.status === "ready").length;
  const scored = projects.filter((p) => p.brainResponseScore != null);
  const avgScore =
    scored.reduce((sum, p) => sum + (p.brainResponseScore ?? 0), 0) /
    Math.max(scored.length, 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              {BRAND.name} library
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your TikToks
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1 ? "simulation" : "simulations"} ·{" "}
              {readyCount} analyzed
              {scored.length > 0 && (
                <> · avg brain score {Math.round(avgScore)}</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <UploadDialog />
            <AbTestDialog />
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <DisabledUploadPanel />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
