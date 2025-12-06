import { projectService } from '@/services/projectService';
import EACDashboard from '@/components/EACDashboard';

export async function generateStaticParams() {
    const projects = await projectService.getProjects();
    return projects.map((project) => ({
        id: project.id,
    }));
}

export default async function EACAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch data on server
    const projects = await projectService.getProjects();
    const project = projects.find(p => p.id === id);

    if (!project) {
        return <div className="p-8">Proyecto no encontrado</div>;
    }

    const workLogs = await projectService.getWorkLogs(id);

    return <EACDashboard initialProject={project} initialLogs={workLogs} />;
}
