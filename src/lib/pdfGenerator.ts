import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Invoice } from '@/types';

export const generateMonthlyBreakdownPDF = (project: Project, _invoices: Invoice[]) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Desglose Mensual de Actividad', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Proyecto: ${project.title}`, 14, 32);
    doc.text(`Cliente: ${project.clientId}`, 14, 38);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 44);

    // Table Data Preparation
    // In a real scenario, we would filter budgetLines or work logs by month.
    // For this prototype, we list the budget lines as "Activity".

    const tableData = project.budgetLines.map(line => [
        new Date().toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }), // Month (Simulated)
        line.concept,
        line.type,
        line.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
        'PENDIENTE', // Bill ID (Simulated)
        'N/A' // Notes
    ]);

    // Add Total Row
    const total = project.budgetLines.reduce((acc, line) => acc + line.amount, 0);
    tableData.push(['', 'TOTAL', '', total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), '', '']);

    autoTable(doc, {
        head: [['Mes', 'Concepto', 'Tipo', 'Importe', 'Pedidos/Bill', 'Notas']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [241, 196, 15] }, // Yellowish for total like in the excel image
    });

    // Footer / Revenue Summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY || 50;

    doc.setFontSize(10);
    doc.text('Confirmación del Cliente:', 14, finalY + 20);
    doc.line(14, finalY + 35, 80, finalY + 35); // Signature line

    doc.save(`Desglose_${project.id}_${new Date().toISOString().split('T')[0]}.pdf`);
};
