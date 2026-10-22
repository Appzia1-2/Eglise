// src/components/ChurchPrintModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { LuPrinter, LuX, LuDownload } from "react-icons/lu";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ============================================================
// THEME COLORS
// ============================================================
const RED = "#8B1A1A";
const RED_TABLE = "#C25A5A";
const RED_FRAME = "#B01818";
const RED_RIBBON_DARK = "#6B0F0F";
const RED_RIBBON_LIGHT = "#A01818";
const CREAM = "#FFFBF3";
const BROWN = "#4A2A1E";
const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";

// ============================================================
// ORNAMENTS & ICONS
// ============================================================
const ChurchIcon = () => (
  <svg width="100" height="100" viewBox="0 0 120 120" fill="none" style={{ marginTop: "-10px" }}>
    <path d="M60 5 V25 M50 15 H70" stroke={RED} strokeWidth="2" strokeLinecap="round" />
    <path d="M60 25 L75 45 L45 45 Z" stroke={RED} strokeWidth="1.5" fill={CREAM} />
    <path d="M50 45 V35 A3 3 0 0 1 56 35 V45" stroke={RED} strokeWidth="1.5" fill={CREAM} />
    <path d="M64 45 V35 A3 3 0 0 1 70 35 V45" stroke={RED} strokeWidth="1.5" fill={CREAM} />
    <path d="M45 45 V95 M75 45 V95" stroke={RED} strokeWidth="1.5" />
    <path d="M45 55 L25 70 V95 M75 55 L95 70 V95" stroke={RED} strokeWidth="1.5" />
    <path d="M25 95 V70 M95 95 V70" stroke={RED} strokeWidth="1.5" />
    <path d="M32 95 V75 A4 4 0 0 1 38 75 V95 Z" stroke={RED} strokeWidth="1.2" fill={CREAM} />
    <path d="M82 95 V75 A4 4 0 0 1 88 75 V95 Z" stroke={RED} strokeWidth="1.2" fill={CREAM} />
    <path d="M52 95 V70 A8 8 0 0 1 68 70 V95 Z" stroke={RED} strokeWidth="1.5" fill={CREAM} />
    <path d="M60 62 V95" stroke={RED} strokeWidth="1" />
    <path d="M55 70 A5 5 0 0 1 65 70" stroke={RED} strokeWidth="1" fill="none" />
    <path d="M15 95 H105" stroke={RED} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 98 H100" stroke={RED} strokeWidth="1" strokeLinecap="round" />
    <path d="M60 95 V100" stroke={RED} strokeWidth="1.5" />
    <circle cx="60" cy="55" r="4" stroke={RED} strokeWidth="1.2" fill={CREAM} />
    <circle cx="60" cy="55" r="1.5" fill={RED} />
  </svg>
);

const CornerFlourish = ({ flip }) => {
  const transform =
    flip === "xy" ? "scale(-1, -1)" :
    flip === "x" ? "scale(-1, 1)" :
    flip === "y" ? "scale(1, -1)" : "none";
  return (
    <svg width="70" height="70" viewBox="0 0 90 90" style={{ transform, display: "block" }}>
      <g stroke={RED} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M6 40 Q6 18 18 12 Q30 6 40 14 Q48 22 36 30 Q26 34 26 24 Q26 16 34 16" />
        <path d="M14 6 Q38 6 40 26" />
        <path d="M6 20 Q20 20 22 34" />
        <path d="M46 12 Q52 8 54 14 Q50 18 46 16 Z" fill={RED} stroke="none" />
        <path d="M12 46 Q8 52 14 54 Q18 50 16 46 Z" fill={RED} stroke="none" />
        <circle cx="34" cy="10" r="1.8" fill={RED} stroke="none" />
        <circle cx="10" cy="34" r="1.8" fill={RED} stroke="none" />
        <path d="M22 22 Q30 22 30 30 Q30 38 22 38" />
      </g>
    </svg>
  );
};

const RibbonTitle = ({ children }) => (
  <Box position="relative" display="inline-block">
    <Box position="absolute" left="-42px" top="50%" transform="translateY(-50%)" w="46px" h="46px" zIndex={1}>
      <svg viewBox="0 0 50 50" width="46" height="46">
        <path d="M48 25 Q38 12 28 14 Q18 16 18 25 Q18 34 28 36 Q38 38 48 25 Z M12 14 Q4 19 4 25 Q4 31 12 36 Q7 31 7 25 Q7 19 12 14 Z" fill={RED_RIBBON_DARK} stroke={RED} strokeWidth="1.2" />
      </svg>
    </Box>
    <Box position="absolute" right="-42px" top="50%" transform="translateY(-50%)" w="46px" h="46px" zIndex={1}>
      <svg viewBox="0 0 50 50" width="46" height="46">
        <path d="M2 25 Q12 12 22 14 Q32 16 32 25 Q32 34 22 36 Q12 38 2 25 Z M38 14 Q46 19 46 25 Q46 31 38 36 Q43 31 43 25 Q43 19 38 14 Z" fill={RED_RIBBON_DARK} stroke={RED} strokeWidth="1.2" />
      </svg>
    </Box>
    <Box
      position="relative" zIndex={2} px={14} py="6px"
      bg={`linear-gradient(to bottom, ${RED_RIBBON_LIGHT}, ${RED_RIBBON_DARK})`}
      color="white" fontSize={{ base: "20px", md: "26px" }} fontWeight="700" letterSpacing="2px"
      fontFamily="'Georgia', serif"
      style={{ clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)" }}
    >
      {children}
    </Box>
  </Box>
);

const ChurchDivider = () => (
  <Flex align="center" justify="center" w="100%" my={4} px={10}>
    <Box flex="1" h="1px" bg={`linear-gradient(to right, transparent, ${RED_TABLE})`} />
    <Box mx={3} color={RED} fontSize="20px" lineHeight="1">✠</Box>
    <Box flex="1" h="1px" bg={`linear-gradient(to left, transparent, ${RED_TABLE})`} />
  </Flex>
);

// ============================================================
// SHARED SHEET PARTS
// ============================================================
const SheetHeader = ({ church, title, subtitle }) => (
  <Box>
    <Flex align="center" justify="center" gap={5} mt="10px" mb={1}>
      <ChurchIcon />
      <Box textAlign="center">
        <Text fontSize="28px" fontWeight="700" color={RED} lineHeight="1.1" fontFamily="'Georgia', serif">
          {church.name || "Church Name"}
        </Text>
        {church.address && (
          <Text fontSize="13px" color={BROWN} fontWeight="500" mt={1} fontFamily="'Georgia', serif">
            {church.address}
          </Text>
        )}
      </Box>
    </Flex>

    <ChurchDivider />

    <Box textAlign="center" my="10px" position="relative">
      <RibbonTitle>{title}</RibbonTitle>
    </Box>

    {subtitle && (
      <Text textAlign="center" fontSize="15px" fontWeight="700" color={RED} mb={4} fontFamily="'Georgia', serif">
        {subtitle}
      </Text>
    )}
  </Box>
);

const SheetFooter = () => (
  <Box mt={6} mb={2} textAlign="center" fontFamily="'Georgia', serif" style={{ breakInside: "avoid" }}>
    <ChurchDivider />
    <Text fontSize="11px" color={BROWN} fontStyle="italic" letterSpacing="0.5px">
      "For where two or three are gathered in my name, there am I among them." — Matthew 18:20
    </Text>
    <Text fontSize="9px" color={RED_TABLE} mt={2} textTransform="uppercase" letterSpacing="1px" fontWeight="bold">
      Official Document • Malankara Orthodox Syrian Church
    </Text>
  </Box>
);

// ============================================================
// PRINT-ONLY COPY
// ============================================================
const PrintSheet = ({ church, title, subtitle, variant, children }) => {
  const isVoucher = variant === "voucher";

  return createPortal(
    <div id="church-print-root" style={{ background: isVoucher ? "#fff" : CREAM }}>
      {!isVoucher && (
        <div className="print-frame">
          <div className="print-frame-inner" />
          <div className="print-corner" style={{ top: -6, left: -6 }}><CornerFlourish /></div>
          <div className="print-corner" style={{ top: -6, right: -6 }}><CornerFlourish flip="x" /></div>
          <div className="print-corner" style={{ bottom: -6, left: -6 }}><CornerFlourish flip="y" /></div>
          <div className="print-corner" style={{ bottom: -6, right: -6 }}><CornerFlourish flip="xy" /></div>
        </div>
      )}

      <table className="print-table">
        <thead><tr><td><div className="print-spacer" /></td></tr></thead>
        <tfoot><tr><td><div className="print-spacer" /></td></tr></tfoot>
        <tbody>
          <tr>
            <td className="print-body">
              {!isVoucher && <SheetHeader church={church} title={title} subtitle={subtitle} />}
              {children}
              {!isVoucher && <SheetFooter />}
            </td>
          </tr>
        </tbody>
      </table>
    </div>,
    document.body
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ChurchPrintModal = ({
  isOpen,
  onClose,
  title,
  church = {},
  subtitle,
  children,
  pdfFileName = "report.pdf",
  defaultOrientation = "portrait",
  variant = "ornate", // ✅ Added variant prop ("ornate" | "voucher")
}) => {
  const [orientation, setOrientation] = useState(defaultOrientation);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (isOpen) setOrientation(defaultOrientation);
  }, [isOpen, defaultOrientation]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsGeneratingPdf(true);

      const clone = printRef.current.cloneNode(true);
      clone.style.width = orientation === "portrait" ? "210mm" : "297mm";
      clone.style.height = "auto";

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: variant === "voucher" ? "#ffffff" : CREAM,
        logging: false,
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const pdf = new jsPDF(orientation, "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight - pdfHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);

      while (heightLeft > 1) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(pdfFileName);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Please use the Print button and save as PDF instead.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isVoucher = variant === "voucher";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="full">
      <Portal>
        <Dialog.Backdrop bg="rgba(0,0,0,0.8)" />
        <Dialog.Positioner>
          <Dialog.Content bg="transparent" boxShadow="none" maxW="100%" m={0} h="100vh" display="flex" flexDirection="column">

            {/* TOP CONTROLS */}
            <Flex bg="white" p={3} justify="space-between" align="center" boxShadow="md" position="sticky" top={0} zIndex={10} flexShrink={0}>
              <Button variant="outline" size="sm" onClick={onClose}><LuX style={{ marginRight: "6px" }} /> Close</Button>

              <HStack>
                <Button size="sm" variant={orientation === "portrait" ? "solid" : "outline"} bg={orientation === "portrait" ? PRIMARY_RED : "white"} color={orientation === "portrait" ? "white" : PRIMARY_RED} borderColor={PRIMARY_RED} onClick={() => setOrientation("portrait")}>Portrait</Button>
                <Button size="sm" variant={orientation === "landscape" ? "solid" : "outline"} bg={orientation === "landscape" ? PRIMARY_RED : "white"} color={orientation === "landscape" ? "white" : PRIMARY_RED} borderColor={PRIMARY_RED} onClick={() => setOrientation("landscape")}>Landscape</Button>
              </HStack>

              <HStack>
                <Button size="sm" variant="outline" onClick={handleDownloadPdf} loading={isGeneratingPdf}><LuDownload style={{ marginRight: "6px" }} /> Download PDF</Button>
                <Button size="sm" bg={PRIMARY_RED} color="white" onClick={handlePrint} _hover={{ bg: DARK_RED }}><LuPrinter style={{ marginRight: "6px" }} /> Print</Button>
              </HStack>
            </Flex>

            {/* PAPER PREVIEW (screen only) */}
            <Box
              p={{ base: 2, md: 8 }}
              bg="#525659"
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              overflowY="auto"
              flex="1"
              minH="0"
            >
              <Box
                ref={printRef}
                bg={isVoucher ? "#ffffff" : CREAM} // White for voucher, Cream for ornate
                p={isVoucher ? "0" : "4mm"}        // No padding for voucher
                fontFamily="'Georgia', 'Times New Roman', serif"
                color={RED}
                style={{
                  width: orientation === "portrait" ? "210mm" : "297mm",
                  minHeight: orientation === "portrait" ? "297mm" : "210mm",
                  margin: "0 auto",
                  transition: "width 0.3s ease",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {isVoucher ? (
                  // VOUCHER: Render just the child without borders/headers
                  <Box flex="1" display="flex" alignItems="center" justifyContent="center" p={6}>
                    {children}
                  </Box>
                ) : (
                  // ORNATE: Standard decorative layout
                  <Box position="relative" border={`1.5px solid ${RED_FRAME}`} p="14px" bg={CREAM} display="flex" flexDirection="column" flex="1">
                    <Box position="absolute" top="5px" left="5px" right="5px" bottom="5px" border={`1px solid ${RED_FRAME}`} pointerEvents="none" />

                    <Box position="absolute" top="-6px" left="-6px" zIndex={5}><CornerFlourish /></Box>
                    <Box position="absolute" top="-6px" right="-6px" zIndex={5}><CornerFlourish flip="x" /></Box>
                    <Box position="absolute" bottom="-6px" left="-6px" zIndex={5}><CornerFlourish flip="y" /></Box>
                    <Box position="absolute" bottom="-6px" right="-6px" zIndex={5}><CornerFlourish flip="xy" /></Box>

                    <SheetHeader church={church} title={title} subtitle={subtitle} />

                    <Box position="relative" zIndex={2} flex="1">
                      {children}
                    </Box>

                    <SheetFooter />
                  </Box>
                )}
              </Box>
            </Box>

          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>

      {/* Real print output lives outside the dialog */}
      {isOpen && (
        <PrintSheet church={church} title={title} subtitle={subtitle} variant={variant}>
          {children}
        </PrintSheet>
      )}

      <style>{`
        @page { size: A4 ${orientation}; margin: 0; }

        #church-print-root { display: none; }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: ${isVoucher ? "#ffffff" : CREAM} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body > *:not(#church-print-root) { display: none !important; }
          #church-print-root { display: block !important; width: 100%; }

          ${!isVoucher ? `
            .print-frame {
              position: fixed;
              top: 4mm; left: 4mm; right: 4mm; bottom: 4mm;
              border: 1.5px solid ${RED_FRAME};
              pointer-events: none;
            }
            .print-frame-inner {
              position: absolute;
              top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 1px solid ${RED_FRAME};
            }
            .print-corner { position: absolute; line-height: 0; }
            .print-spacer { height: 14mm; }
            .print-body { padding: 0 12mm !important; }
            .print-body tr { break-inside: avoid; page-break-inside: avoid; }
            .print-body thead { display: table-header-group; }
          ` : `
            .print-spacer { height: 10mm; }
            .print-body { padding: 10mm !important; }
            .print-body tr { break-inside: avoid; }
          `}

          .print-table { width: 100%; border-collapse: collapse; }
          .print-table td { padding: 0; }
        }
      `}</style>
    </Dialog.Root>
  );
};

export default ChurchPrintModal;