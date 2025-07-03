// Table utilities for PDF generation

export class TableUtils {
    constructor(doc, margins, iplcBlue, lineHeight, smallLineHeight) {
        this.doc = doc;
        this.margins = margins;
        this.iplcBlue = iplcBlue;
        this.lineHeight = lineHeight;
        this.smallLineHeight = smallLineHeight;
        this.tableCellPadding = 4;
        this.tableHeaderColor = iplcBlue;
        this.tableAlternateColor = [245, 245, 245];
        this.tableBorderColor = [180, 180, 180];
        this.minRowHeight = 8;
    }

    createTable(startX, colWidths, headers, rows, currentY) {
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        let updatedY = currentY;

        // Draw header
        updatedY = this.addTableHeader(startX, colWidths, headers, updatedY);

        // Process rows
        rows.forEach((row, index) => {
            const rowHeight = this.calculateRowHeight(row, colWidths);
            
            // Draw row background
            this.doc.setFillColor(index % 2 === 0 ? this.tableAlternateColor : [255, 255, 255]);
            this.doc.rect(startX, updatedY, totalWidth, rowHeight, 'F');

            // Add row content
            let currentX = startX;
            row.forEach((cell, cellIndex) => {
                if (cell) {
                    const lines = this.doc.splitTextToSize(cell.toString(), colWidths[cellIndex] - this.tableCellPadding * 2);
                    lines.forEach((line, lineIndex) => {
                        this.doc.text(
                            line,
                            currentX + this.tableCellPadding,
                            updatedY + this.lineHeight + (lineIndex * this.smallLineHeight)
                        );
                    });
                }
                currentX += colWidths[cellIndex];

                // Add vertical borders
                if (cellIndex < colWidths.length - 1) {
                    this.doc.setDrawColor(...this.tableBorderColor);
                    this.doc.line(currentX, updatedY, currentX, updatedY + rowHeight);
                }
            });

            // Add horizontal border
            this.doc.setDrawColor(...this.tableBorderColor);
            this.doc.line(startX, updatedY, startX + totalWidth, updatedY);

            updatedY += rowHeight;
        });

        // Draw final border
        this.doc.setDrawColor(...this.tableBorderColor);
        this.doc.line(startX, updatedY, startX + totalWidth, updatedY);
        updatedY += this.lineHeight;

        return updatedY;
    }

    addTableHeader(startX, colWidths, headers, currentY) {
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        
        // Draw header background
        this.doc.setFillColor(...this.tableHeaderColor);
        this.doc.rect(startX, currentY, totalWidth, this.lineHeight + 2, 'F');
        
        // Add header text
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont('helvetica', 'bold');
        let currentX = startX;
        headers.forEach((header, index) => {
            this.doc.text(header, currentX + this.tableCellPadding, currentY + this.lineHeight - 1);
            currentX += colWidths[index];
            
            // Add vertical line between columns
            if (index < colWidths.length - 1) {
                this.doc.setDrawColor(...this.tableBorderColor);
                this.doc.line(currentX, currentY, currentX, currentY + this.lineHeight + 2);
            }
        });
        
        // Reset styles
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'normal');
        
        return currentY + this.lineHeight + 2;
    }

    calculateRowHeight(rowData, colWidths) {
        const maxLines = Math.max(
            ...rowData.map((text, index) => {
                if (!text) return 1;
                const lines = this.doc.splitTextToSize(text.toString(), colWidths[index] - this.tableCellPadding * 2);
                return lines.length;
            })
        );
        return Math.max(this.minRowHeight, maxLines * this.smallLineHeight + this.tableCellPadding * 2);
    }
}