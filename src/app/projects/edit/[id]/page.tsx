import { projectService } from '@/services/projectService';
import EditProjectClient from './EditProjectClient';

export async function generateStaticParams() {
    const projects = await projectService.getProjects();
    return projects.map((project) => ({
        id: project.id,
    }));
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EditProjectClient id={id} />;
}
