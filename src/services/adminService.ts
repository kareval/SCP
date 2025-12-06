import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { MOCK_PROJECTS, MOCK_INVOICES, MOCK_CLIENTS } from '@/data/mocks';

export const adminService = {
    async seedDatabase(): Promise<void> {
        const batch = writeBatch(db);

        // Seed Clients
        MOCK_CLIENTS.forEach((client) => {
            const ref = doc(collection(db, 'clients'), client.id);
            batch.set(ref, client);
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
    },

    async clearDatabase(): Promise<void> {
        const collections = ['projects', 'invoices', 'clients', 'contracts'];

        for (const colName of collections) {
            const snapshot = await getDocs(collection(db, colName));
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        }

        // Note: Subcollections like 'work_logs' are harder to delete in client-side Firestore 
        // without knowing the parent IDs. We should iterate projects to delete their logs.
        // For now, this simple clear is a good start. 
        // Ideally, we would use a Cloud Function for recursive delete.
    }
};
