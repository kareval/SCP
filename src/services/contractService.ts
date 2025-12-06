import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Contract } from '@/types';

export const contractService = {
    async createContract(contract: Contract): Promise<void> {
        const ref = doc(collection(db, 'contracts'), contract.id);
        await setDoc(ref, contract);
    },

    async updateContract(contract: Contract): Promise<void> {
        const ref = doc(collection(db, 'contracts'), contract.id);
        await setDoc(ref, contract, { merge: true });
    },

    async deleteContract(contractId: string): Promise<void> {
        const ref = doc(collection(db, 'contracts'), contractId);
        await deleteDoc(ref);
    },

    async getContracts(): Promise<Contract[]> {
        const snapshot = await getDocs(collection(db, 'contracts'));
        return snapshot.docs.map(doc => doc.data() as Contract);
    }
};
