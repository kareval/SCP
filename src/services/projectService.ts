import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Project, Invoice, WorkLog } from '@/types';

export const projectService = {
    async createProject(project: Project): Promise<void> {
        const ref = doc(collection(db, 'projects'), project.id);
        await setDoc(ref, project);
    },

    async updateProject(project: Project): Promise<void> {
        const ref = doc(collection(db, 'projects'), project.id);
        await setDoc(ref, project, { merge: true });
    },

    async deleteProject(projectId: string): Promise<void> {
        const ref = doc(collection(db, 'projects'), projectId);
        await deleteDoc(ref);
    },

    async createInvoice(invoice: Invoice): Promise<void> {
        const ref = doc(collection(db, 'invoices'), invoice.id);
        // Firestore does not accept undefined values. We use stringify/parse to remove them.
        const sanitizedInvoice = JSON.parse(JSON.stringify(invoice));
        await setDoc(ref, sanitizedInvoice);
    },

    async addWorkLog(projectId: string, workLog: WorkLog): Promise<void> {
        const logRef = doc(collection(db, 'projects', projectId, 'work_logs'), workLog.id);
        await setDoc(logRef, workLog);
    },

    async deleteWorkLog(projectId: string, logId: string): Promise<void> {
        const logRef = doc(collection(db, 'projects', projectId, 'work_logs'), logId);
        await deleteDoc(logRef);
    },

    async getWorkLogs(projectId: string): Promise<WorkLog[]> {
        const snapshot = await getDocs(collection(db, 'projects', projectId, 'work_logs'));
        return snapshot.docs.map(doc => doc.data() as WorkLog);
    },

    async getProjects(): Promise<Project[]> {
        const snapshot = await getDocs(collection(db, 'projects'));
        return snapshot.docs.map(doc => doc.data() as Project);
    },

    async getInvoices(): Promise<Invoice[]> {
        const snapshot = await getDocs(collection(db, 'invoices'));
        return snapshot.docs.map(doc => doc.data() as Invoice);
    },

    async getProjectInvoices(projectId: string): Promise<Invoice[]> {
        const q = query(collection(db, 'invoices'), where('projectId', '==', projectId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Invoice);
    }
};
