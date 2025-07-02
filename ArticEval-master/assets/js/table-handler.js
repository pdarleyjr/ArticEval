/**
 * Table Handler for PDF Generation
 * 
 * This module enhances tables to ensure they render correctly in PDFs.
 * It wraps tables in containers, applies proper styling, and ensures
 * they don't break across pages when converted to PDF.
 */

class TableHandler {
    constructor() {
        // Setup complete flag
        this.initialized = false;
    }

    /**
     * Initialize the table handler
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('Table Handler: Initializing...');
        
        // Process all tables immediately
        this.processAllTables();
        
        // Set up mutation observer to handle dynamically added tables
        this.setupMutationObserver();
        
        this.initialized = true;
        console.log('Table Handler: Initialization complete');
    }

    /**
     * Process all tables in the document
     */
    processAllTables() {
        // Find all tables
        const tables = document.querySelectorAll('table');
        
        console.log(`Table Handler: Found ${tables.length} tables to process`);
        
        tables.forEach((table, index) => {
            this.processTable(table, index);
        });
    }

    /**
     * Process a single table
     * @param {HTMLTableElement} table - The table to process
     * @param {number} index - Index for unique ID
     */
    processTable(table, index) {
        // Skip if already processed
        if (table.getAttribute('data-processed') === 'true') return;
        
        // Skip if already in a table container
        if (table.closest('.table-container')) return;
        
        // Add unique ID if not present
        if (!table.id) {
            table.id = `table-${index}`;
        }
        
        // Set table properties
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = 'collapse';
        table.style.pageBreakInside = 'avoid';
        table.style.breakInside = 'avoid';
        
        // Create wrapper container
        const container = document.createElement('div');
        container.className = 'table-container avoid-break';
        container.style.pageBreakInside = 'avoid';
        container.style.breakInside = 'avoid';
        container.style.marginBottom = '0.2in';
        
        // Replace table with container + table
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
        
        // Process table cells for consistent styling
        const cells = table.querySelectorAll('th, td');
        cells.forEach(cell => {
            // Ensure cells have borders
            cell.style.border = '1px solid #000';
            cell.style.padding = '0.1in';
            cell.style.wordWrap = 'break-word';
            
            // Handle empty cells
            if (!cell.textContent.trim()) {
                cell.innerHTML = '&nbsp;';
            }
        });
        
        // Mark as processed
        table.setAttribute('data-processed', 'true');
    }

    /**
     * Set up mutation observer to watch for new tables
     */
    setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // Check if node is an element
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if node is a table
                            if (node.tagName === 'TABLE') {
                                shouldProcess = true;
                            }
                            // Check if node contains tables
                            else if (node.querySelectorAll) {
                                const tables = node.querySelectorAll('table');
                                if (tables.length > 0) {
                                    shouldProcess = true;
                                }
                            }
                        }
                    });
                }
            });
            
            if (shouldProcess) {
                this.processAllTables();
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Special handling for articulation tables
     */
    processArticulationTables() {
        // Find all tables with specific class or in specific sections
        const articulationTables = document.querySelectorAll('.articulation-table, #speechSoundSection table');
        
        articulationTables.forEach(table => {
            // Add specific class if not present
            if (!table.classList.contains('articulation-table')) {
                table.classList.add('articulation-table');
            }
            
            // Set specific styles for articulation tables
            table.style.fontSize = '10pt';
            
            // Process cells
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.style.padding = '0.05in';
                cell.style.textAlign = 'center';
            });
        });
    }

    /**
     * Handle tables with specific content needs
     */
    enhanceTablesForPdf() {
        // Process specific types of tables
        this.processArticulationTables();
        
        // Find all tables in clinical impressions and recommendations
        const summaryTables = document.querySelectorAll('#clinicalImpressionsSection table, #recommendationsSection table');
        
        summaryTables.forEach(table => {
            // Ensure these tables have adequate spacing
            table.style.marginTop = '0.15in';
            table.style.marginBottom = '0.15in';
        });
    }
}

// Create singleton instance
const tableHandler = new TableHandler();

// Auto-initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    tableHandler.initialize();
});

// Export the table handler
export { tableHandler };

// Default export for module import
export default TableHandler;