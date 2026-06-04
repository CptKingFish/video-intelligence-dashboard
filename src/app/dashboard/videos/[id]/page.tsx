import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnalysisView } from "@/components/video/analysis-view";
import { getCurrentUser } from "@/lib/auth";
import { findProjectWithAnalysis } from "@/lib/projects";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await findProjectWithAnalysis(id);

  if (!result || result.project.ownerId !== user.id) {
    notFound();
  }

  const { project, analysis } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard" prefetch={false}>
            <ArrowLeft />
            Back to dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        <p className="font-mono text-xs text-muted-foreground">{project.id}</p>
      </div>

      <AnalysisView project={project} analysis={analysis} />
    </div>
  );
}
