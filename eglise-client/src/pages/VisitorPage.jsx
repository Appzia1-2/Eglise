import React from "react";
import { Button, Flex } from "@chakra-ui/react";
import { LuPrinter } from "react-icons/lu";
import RegistryTable from "../components/RegistryTable";
import {
  listVisitors,
  createVisitor,
  updateVisitor,
  deleteVisitor,
} from "../api/registryServices";

const VISITOR_COLUMNS = [
  { header: "Visit Date", key: "visitor_date" },
  { header: "Address", key: "visitor_address" },
  { header: "Remarks", key: "remarks" },
];

const visitorFields = [
  { name: "visitor_name", label: "Visitor Name", required: true },
  {
    name: "visitor_date",
    label: "Visit Date",
    type: "date",
    required: true,
  },
  {
    name: "visitor_address",
    label: "Address",
    type: "textarea",
    fullWidth: true,
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    fullWidth: true,
  },
];

const VisitorPage = () => {
  // Print All Handler
  const handlePrintAll = async () => {
    try {
      const response = await listVisitors();
      const allVisitors = response.data || [];
      
      // Create print window
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        alert("Please allow popups for printing");
        return;
      }

      // Generate HTML for printing
      printWindow.document.write(`
        <html>
          <head>
            <title>All Visitors Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                margin: 0;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #7b0d1e;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .header h1 {
                color: #7b0d1e;
                font-size: 20px;
                margin: 0;
              }
              .header p {
                color: #666;
                font-size: 12px;
                margin: 5px 0 0 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background: #7b0d1e;
                color: white;
                padding: 10px 8px;
                text-align: left;
                font-size: 13px;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #eee;
              }
              tr:nth-child(even) {
                background: #f8f8f8;
              }
              .total-row {
                background: #f0f0f0;
                font-weight: bold;
              }
              .total-row td {
                border-top: 2px solid #7b0d1e;
                padding: 10px 8px;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Visitor Management Report</h1>
              <p>Printed: ${new Date().toLocaleString()}</p>
              <p style="font-size: 11px; color: #666;">Total Visitors: ${allVisitors.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Visitor Name</th>
                  <th>Visit Date</th>
                  <th>Address</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${allVisitors.map((visitor, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${visitor.visitor_name || "—"}</strong></td>
                    <td>${visitor.visitor_date || "—"}</td>
                    <td>${visitor.visitor_address || "—"}</td>
                    <td>${visitor.remarks || "—"}</td>
                  </tr>
                `).join('')}
                ${allVisitors.length > 0 ? `
                  <tr class="total-row">
                    <td colspan="5" style="text-align: right;">
                      Total Visitors: ${allVisitors.length}
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="footer">
              <p>This is a computer-generated report.</p>
              <p>Generated from Church Management System</p>
            </div>

            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error printing all visitors:", error);
      alert("Error printing all visitors: " + error.message);
    }
  };

  // Custom top content with Print All button
  const topContent = (
    <Flex mb={4} className="no-print" alignItems="center" justifyContent="flex-end">
     <Button
  leftIcon={<LuPrinter />}
  variant="outline"
  borderColor="black"
  color="black"
  size="sm"
  _hover={{
    bg: "transparent",
    borderColor: "black",
    color: "black",
  }}
  onClick={handlePrintAll}
>
  Print All Visitors
</Button>
    </Flex>
  );

  return (
    <RegistryTable
      title="Visitor Management"
      addLabel="Add Visitor"
      nameKey="visitor_name"
      columns={VISITOR_COLUMNS}
      columnLabel="Visitor Name"
      emptyMessage="No visitors found."
      listFn={listVisitors}
      createFn={createVisitor}
      updateFn={updateVisitor}
      deleteFn={deleteVisitor}
      fields={visitorFields}
      isMaster={true}
      topContent={topContent}
    />
  );
};

export default VisitorPage;