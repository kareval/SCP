export const it = {
    common: {
        loading: 'Caricamento...',
        save: 'Salva',
        cancel: 'Annulla',
        delete: 'Elimina',
        edit: 'Modifica',
        back: 'Indietro',
        confirmDelete: 'Sei sicuro di voler eliminare questo elemento?',
        active: 'Attivo',
        closed: 'Chiuso',
        language: 'Lingua',
        user: 'Utente',
        demoUser: 'Utente Demo',
        activeSession: 'Sessione Attiva',
        saving: 'Salvataggio...',
        select: 'Seleziona...',
        title: 'Titolo'
    },
    nav: {
        dashboard: 'Dashboard',
        projects: 'Progetti',
        contracts: 'Contratti',
        billing: 'Fatturazione',
        settings: 'Impostazioni'
    },
    dashboard: {
        financialTab: 'Visione Finanziaria',
        strategicTab: 'Visione Strategica',
        billingTrend: 'Trend di Fatturazione (6 mesi)',
        efficiency: 'Efficienza Operativa (Giustificato vs. Budget)',
        clientConcentration: 'Concentrazione Clienti (TCV)',
        strategicRadar: 'Radar Punteggio Strategico',
        kpi: {
            budgetActive: 'Budget Attivo',
            justified: 'Giustificato',
            billed: 'Fatturato',
            wip: 'WIP (In Corso)',
            tcv: 'Valore Totale Contratti',
            backlog: 'Backlog Globale',
            revenueYear: 'Revenue Annuale'
        }
    },
    projects: {
        title: 'Progetti',
        newProject: 'Nuovo Progetto',
        tabs: {
            strategic: 'Portafoglio Strategico',
            execution: 'Controllo dell\'Esecuzione',
            operational: 'Gestione Operativa'
        },
        card: {
            client: 'Cliente',
            budget: 'Budget',
            revenue: 'Revenue',
            billed: 'Fatturato',
            wip: 'WIP',
            deferred: 'Differito'
        },
        portfolioMatrix: {
            title: 'Matrice Prioritizzazione Portafoglio',
            description: 'Visualizzazione Valore (Asse Y) vs. Sforzo/Costo (Asse X). La dimensione della bolla rappresenta il volume del progetto (Revenue).',
            xAxis: 'Costo / Sforzo (Budget)',
            yAxis: 'Valore Strategico (0-100)',
            bubble: 'Volume (Revenue)',
            highStrategy: 'Alta Strategia'
        },
        form: {
            tabs: {
                operational: 'Gestione Operativa',
                strategic: 'Gestione Strategica'
            },
            generalInfo: 'Informazioni Generali',
            financialInfo: 'Informazioni Finanziarie',
            strategicInfo: 'Valutazione Strategica',
            budget: 'Budget',
            strategicScore: 'Punteggio Strategico',
            roi: 'ROI Atteso',
            type: 'Tipo di Progetto',
            revenueMethod: 'Metodo Riconoscimento Revenue',
            criteria: {
                alignment: 'Allineamento Strategico (OKRs)',
                innovation: 'Innovazione e Mercato',
                customerImpact: 'Impatto Cliente (Tier 1)',
                viability: 'Fattibilità e Rischio'
            }
        }
    },
    contracts: {
        title: 'Contratti Quadro',
        newContract: 'Nuovo Contratto',
        form: {
            tabs: {
                general: 'Dati Generali',
                strategic: 'Efficienza Commerciale'
            },
            tcv: 'Valore Totale (TCV)',
            cac: 'Costo Acquisizione (CAC)',
            ratio: 'Rapporto Efficienza',
            client: 'Cliente',
            startDate: 'Data Inizio',
            endDate: 'Data Fine',
            status: 'Stato'
        }
    },
    billing: {
        title: 'Fatturazione',
        newInvoice: 'Nuova Fattura Manuale',
        tabs: {
            pending: 'Da Fatturare',
            history: 'Storico Fatture',
            reconciliation: 'Conciliazione'
        },
        kpi: {
            invoicedYtd: 'Fatturato Anno Corrente',
            outstanding: 'In Sospeso',
            overdue: 'Scaduto',
            forecast: 'Stima da Fatturare',
            wip: 'WIP (Lavoro non fatturato)'
        },
        table: {
            number: 'N. Fattura',
            date: 'Data',
            project: 'Progetto',
            concept: 'Concetto',
            amount: 'Importo',
            status: 'Stato',
            dueDate: 'Scadenza',
            pdf: 'PDF'
        },
        status: {
            paid: 'Pagata',
            sent: 'Inviata',
            draft: 'Bozza'
        },
        actions: {
            billWip: 'Fattura WIP',
            downloadPdf: 'Scarica PDF'
        }
    },
    eac: {
        title: 'Analisi EAC',
        bac: 'BAC',
        simulation: 'Simulazione',
        saveSimulation: 'Salva Simulazione',
        simulationSaved: 'Simulazione salvata correttamente.',
        errorSaving: 'Errore durante il salvataggio.',
        inputData: 'Dati di Input',
        adjustProgress: 'Regola l\'avanzamento reale per ricalcolare.',
        totalBudget: 'Budget Totale (BAC)',
        totalBudgetDesc: 'Budget at Completion. Budget totale approvato per il progetto.',
        actualCost: 'Costo Reale Attuale (AC)',
        actualCostDesc: 'Actual Cost. Costo reale sostenuto fino ad oggi.',
        sumCosts: 'Somma di tutti i costi registrati.',
        physicalProgress: 'Avanzamento Fisico Reale (%)',
        physicalProgressTooltip: 'Percentuale di completamento reale dell\'ambito, indipendente dal costo.',
        physicalProgressDesc: 'Indica la percentuale di lavoro effettivamente completato, indipendentemente dal costo.',
        financialProjection: 'Proiezione Finanziaria',
        ev: 'Valore Guadagnato (EV)',
        evTooltip: 'Valore a budget del lavoro svolto (BAC * % Avanzamento)',
        eac: 'Stima a Finire (EAC)',
        eacTooltip: 'Costo totale stimato alla fine (BAC / CPI).',
        variation: 'Variazione (VAC)',
        variationTooltip: 'Deviazione prevista dal budget (BAC - EAC). Positivo è buono.',
        cpi: 'Indice Rendimento (CPI)',
        cpiTooltip: 'Efficienza dei costi (EV / AC). > 1.0 è efficiente.',
        tcpi: 'Efficienza Richiesta (TCPI)',
        tcpiTooltip: 'Efficienza necessaria nel resto per rispettare il budget.',
        performanceCurve: 'Curva di Rendimento',
        planned: 'Pianificato (PV)',
        projection: 'Proiezione'
    }
};
