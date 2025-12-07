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

export const generateInvoicePDF = (invoice: Invoice, project: Project) => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFontSize(26);
    doc.text('FACTURA', 150, 20, { align: 'left' });

    // Company Logo (Placeholder)
    doc.setFontSize(10);
    doc.text('Mi Empresa S.L.', 14, 20);
    doc.text('B-12345678', 14, 25);
    doc.text('Calle Innovación 123', 14, 30);
    doc.text('28000 Madrid, España', 14, 35);
    doc.text('info@miempresa.com', 14, 40);

    // -- Invoice Details --
    doc.setFontSize(10);
    doc.text(`Nº Factura:`, 140, 35); doc.text(invoice.number, 170, 35);
    doc.text(`Fecha Emisión:`, 140, 40); doc.text(new Date(invoice.date).toLocaleDateString('es-ES'), 170, 40);
    doc.text(`Vencimiento:`, 140, 45); doc.text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : '-', 170, 45);

    // -- Client Details --
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 55, 182, 25, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturar a:', 18, 62);
    doc.setFont('helvetica', 'normal');
    // Using project.clientId as a proxy for Client Name since we don't have full client obj here easily
    doc.text(`Cliente ID: ${project.clientId}`, 18, 68);
    doc.text(`Proyecto: ${project.title}`, 18, 74);

    // -- Lines --
    const tableBody: any[] = [];

    // If we have detailed items, list them. Otherwise use concept.
    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            tableBody.push([
                item.description,
                item.quantity,
                item.unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
                item.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
            ]);
        });
    } else {
        // Fallback for invoices created without items (WIP bulk, etc)
        // Check linked work logs or just use concept
        tableBody.push([
            invoice.concept || 'Servicios Profesionales',
            '1',
            invoice.baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
            invoice.baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
        ]);
    }

    autoTable(doc, {
        startY: 90,
        head: [['Concepto', 'Cant.', 'Precio U.', 'Total']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // -- Totals --
    const xPositions = [140, 180]; // Label, Value

    doc.text('Base Imponible:', xPositions[0], finalY);
    doc.text(invoice.baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), xPositions[1], finalY, { align: 'right' });

    finalY += 6;
    doc.text(`IVA (${invoice.taxRate}%):`, xPositions[0], finalY);
    doc.text(invoice.taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), xPositions[1], finalY, { align: 'right' });

    finalY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL FACTURA:', xPositions[0], finalY);
    doc.text(invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), xPositions[1], finalY, { align: 'right' });

    // -- Payment Info --
    finalY += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Forma de Pago: Transferencia Bancaria', 14, finalY);
    doc.text('IBAN: ES91 0000 0000 0000 0000 0000', 14, finalY + 5);

    doc.save(`Factura_${invoice.number}.pdf`);
};
