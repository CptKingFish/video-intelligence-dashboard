import { ProjectCard } from "@/components/dashboard/project-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AbTestDialog } from "@/components/dashboard/ab-test-dialog";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/projects";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const projects = await getProjects(user.id);

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your videos</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"} ·
            analyzed and ready to explore
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <UploadDialog />
          <AbTestDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
