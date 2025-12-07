import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { MOCK_PROJECTS, MOCK_INVOICES, MOCK_CLIENTS, MOCK_CONTRACTS, MOCK_WORK_LOGS } from '@/data/mocks';

export const adminService = {
    async seedDatabase(): Promise<void> {
        const batch = writeBatch(db);

        // Seed Clients
        MOCK_CLIENTS.forEach((client) => {
            const ref = doc(collection(db, 'clients'), client.id);
            batch.set(ref, client);
        });

        // Seed Contracts
        MOCK_CONTRACTS.forEach((contract) => {
            const ref = doc(collection(db, 'contracts'), contract.id);
            batch.set(ref, contract);
        });

        // Seed Projects
        MOCK_PROJECTS.forEach((project) => {
            const ref = doc(collection(db, 'projects'), project.id);
            batch.set(ref, project);
        });

        // Seed Invoices
        MOCK_INVOICES.forEach((invoice) => {
            const ref = doc(collection(db, 'invoices'), invoice.id);
            batch.set(ref, invoice);
        });

        await batch.commit();

        // Seed WorkLogs (Must be done individually or in smaller batches as they are subcollections)
        // We use setDoc for each to simplify, but could batch if many.
        for (const log of MOCK_WORK_LOGS) {
            const logRef = doc(collection(db, 'projects', log.projectId, 'work_logs'), log.id);
            await setDoc(logRef, log);
        }
    },

    async clearDatabase(): Promise<void> {
        const collections = ['projects', 'invoices', 'clients', 'contracts'];

        // Delete Projects and their subcollections (WorkLogs)
        // Note: Client-side recursive delete is expensive. 
        // For 'projects', we first fetch them to delete subcollections.
        const projectsSnap = await getDocs(collection(db, 'projects'));
        for (const docSnap of projectsSnap.docs) {
            // Delete work logs
            const logsSnap = await getDocs(collection(db, 'projects', docSnap.id, 'work_logs'));
            const logDeletes = logsSnap.docs.map(l => deleteDoc(l.ref));
            await Promise.all(logDeletes);

            // Delete project
            await deleteDoc(docSnap.ref);
        }

        // Delete other root collections
        for (const colName of ['invoices', 'clients', 'contracts']) {
            const snapshot = await getDocs(collection(db, colName));
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        }
    }
};
