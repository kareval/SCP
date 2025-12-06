import { contractService } from '@/services/contractService';
import EditContractClient from './EditContractClient';

export async function generateStaticParams() {
    const contracts = await contractService.getContracts();
    return contracts.map((contract) => ({
        id: contract.id,
    }));
}

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EditContractClient id={id} />;
}
