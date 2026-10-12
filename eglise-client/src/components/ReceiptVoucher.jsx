// src/components/ReceiptPrintPreview.jsx

import React, { useEffect } from "react";
import { Box, Button, Flex, HStack, Select, Text } from "@chakra-ui/react";
import { LuPrinter, LuFileDown, LuX } from "react-icons/lu";

import ReceiptVoucher from "./ReceiptVoucher";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const ReceiptPrintPreview = ({ isOpen, onClose, receipt, church }) => {
  /* -------------------------------------------------------
     ESC to close
  ------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* -------------------------------------------------------
     PRINT
  ------------------------------------------------------- */
  const handlePrint = () => {
    const voucher = document.getElementById("receipt-voucher-print");
    if (!voucher) return;

    const win = window.open("", "_blank", "width=1100,height=700");
    if (!win) {
      alert("Please allow popups to print.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receipt?.receipt_number || ""}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              font-family: Georgia, 'Times New Roman', serif;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-root { padding: 0; }
            ${/* inline all styles by cloning the voucher HTML */ ""}
          </style>
        </head>
        <body>
          <div class="print-root">${voucher.outerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                // window.close();
              }, 200);
            };
          </script>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  /* -------------------------------------------------------
     DOWNLOAD PDF (uses browser Print → Save as PDF)
  ------------------------------------------------------- */
  const handleDownloadPDF = () => {
    // Simplest cross-browser approach: open print dialog with a hint.
    handlePrint();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(24,35,56,0.45)"
      zIndex={1000}
      display="flex"
      flexDirection="column"
    >
      {/* TOP BAR */}
      <Flex
        align="center"
        justify="space-between"
        bg="white"
        px={6}
        py={3}
        borderBottom={`1px solid ${BORDER}`}
        boxShadow="0 1px 6px rgba(0,0,0,0.06)"
      >
        <Text
          fontSize="20px"
          fontWeight="700"
          color={DARK}
          letterSpacing="0.3px"
        >
          Print Preview
        </Text>

        <HStack gap={3}>
          <Select
            size="sm"
            w="110px"
            fontSize="12px"
            h="36px"
            borderColor={BORDER}
            borderRadius="6px"
          >
            <option>1/3 A4</option>
            <option>A4</option>
            <option>A5</option>
          </Select>

          <Select
            size="sm"
            w="130px"
            fontSize="12px"
            h="36px"
            borderColor={BORDER}
            borderRadius="6px"
          >
            <option>Landscape</option>
            <option>Portrait</option>
          </Select>

          <Button
            variant="outline"
            h="36px"
            fontSize="12px"
            borderColor={BORDER}
            color={DARK}
            borderRadius="6px"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            variant="outline"
            h="36px"
            fontSize="12px"
            borderColor={RED}
            color={RED}
            borderRadius="6px"
            bg="white"
            _hover={{ bg: "#FFF0F4" }}
            onClick={handleDownloadPDF}
          >
            <LuFileDown size={15} style={{ marginRight: 6 }} />
            Download PDF
          </Button>

          <Button
            bg={RED}
            color="white"
            h="36px"
            fontSize="12px"
            borderRadius="6px"
            onClick={handlePrint}
            _hover={{ bg: "#B0143A" }}
          >
            <LuPrinter size={15} style={{ marginRight: 6 }} />
            Print
          </Button>
        </HStack>
      </Flex>

      {/* BODY (scrollable) */}
      <Box
        flex="1"
        overflow="auto"
        bg="#EFEFF3"
        px={6}
        py={8}
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
      >
        <Box
          id="receipt-voucher-print"
          bg="white"
          boxShadow="0 6px 24px rgba(0,0,0,0.12)"
          p={0}
        >
          <ReceiptVoucher receipt={receipt} church={church} />
        </Box>
      </Box>
    </Box>
  );
};

export default ReceiptPrintPreview;