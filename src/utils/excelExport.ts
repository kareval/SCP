import * as XLSX from 'xlsx';

export interface RevenueColumn {
    label: string;
    start: Date;
    end: Date;
}

export interface ExportRevenueMatrixParams {
    contracts: any[];
    projects: any[];
    columns: RevenueColumn[];
    getContractRevenueForPeriod: (contractId: string, start: Date, end: Date) => number;
    getRevenueForPeriod: (projectId: string, start: Date, end: Date) => number;
    getTotalRevenueForPeriod: (start: Date, end: Date) => number;
    projectsByContract: Record<string, any[]>;
    viewMode: 'Monthly' | 'Quarterly' | 'Yearly';
}

export function exportRevenueMatrixToExcel(params: ExportRevenueMatrixParams) {
    const {
        contracts,
        columns,
        getContractRevenueForPeriod,
        getRevenueForPeriod,
        getTotalRevenueForPeriod,
        projectsByContract,
        viewMode
    } = params;

    const data: any[] = [];

    // Header row
    const headerRow = ['Contrato / Proyecto', ...columns.map(col => col.label), 'Total'];
    data.push(headerRow);

    // Data rows for each contract and its projects
    contracts.forEach((contract) => {
        const contractProjects = projectsByContract[contract.id] || [];

        // Contract row
        let contractRowTotal = 0;
        const contractRow: (string | number)[] = [contract.code || contract.title];
        columns.forEach((col) => {
            const val = getContractRevenueForPeriod(contract.id, col.start, col.end);
            contractRowTotal += val;
            contractRow.push(val);
        });
        contractRow.push(contractRowTotal);
        data.push(contractRow);

        // Project rows under this contract
        contractProjects.forEach(project => {
            let projectRowTotal = 0;
            const projectRow: (string | number)[] = [`  ${project.title}`];
            columns.forEach((col) => {
                const rev = getRevenueForPeriod(project.id, col.start, col.end);
                projectRowTotal += rev;
                projectRow.push(rev);
            });
            projectRow.push(projectRowTotal);
            data.push(projectRow);
        });
    });

    // Totals row
    const totalRow: (string | number)[] = ['TOTAL'];
    columns.forEach((col) => {
        totalRow.push(getTotalRevenueForPeriod(col.start, col.end));
    });
    totalRow.push(columns.reduce((acc, col) => acc + getTotalRevenueForPeriod(col.start, col.end), 0));
    data.push(totalRow);

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = [{ wch: 40 }, ...columns.map(() => ({ wch: 15 })), { wch: 15 }];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz Revenue');

    // Generate filename with current view mode and date
    const viewModeText = viewMode === 'Monthly' ? 'Mensual' : viewMode === 'Quarterly' ? 'Trimestral' : 'Anual';
    const filename = `Matriz_Revenue_${viewModeText}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
}
