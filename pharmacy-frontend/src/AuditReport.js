import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Plugin to handle tables in PDF

const AuditReport = () => {

    const generatePDF = async () => {
        try {
            // 1. Get the security token from local storage
            const token = localStorage.getItem('token'); 

            // 2. Fetch log data from the backend API
            const response = await fetch('http://localhost:5000/api/admin/audit-report', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Pass the admin token
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                alert("Unauthorized! Only admins can download this report.");
                return;
            }

            const data = await response.json();

            // 3. Create a new jsPDF instance
            const doc = new jsPDF();

            // 4. Add Title and Date
            doc.setFontSize(18);
            doc.text("Pharmacy Inventory Audit Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 30);

            // 5. Setup columns and rows for the table
            const columns = ["Date", "User", "Action", "Details"];
            const rows = data.map(log => [
                new Date(log.timestamp).toLocaleString(),
                log.username,
                log.action_type,
                log.details
            ]);

            // 6. Draw table in the PDF
            doc.autoTable({
                head: [columns],
                body: rows,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] } // Dark blue header
            });

            // 7. Download the file
            doc.save(`Audit_Report_${new Date().toLocaleDateString()}.pdf`);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Error: Could not connect to the server.");
        }
    };

    return (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
                onClick={generatePDF}
                style={{
                    backgroundColor: '#e67e22',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                Download User Activity Report (PDF)
            </button>
        </div>
    );
};

export default AuditReport;