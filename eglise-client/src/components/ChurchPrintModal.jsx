// src/components/ChurchPrintModal.jsx
//
// Shared church-headed print preview used by every report.
// Renders an A4-styled printable sheet on screen + triggers
// the browser print dialog when "Print" is clicked.
//
// Usage:
//   <ChurchPrintModal
//     isOpen={isOpen}
//     onClose={() => setOpen(false)}
//     title="MEMBER LEDGER"
//     church={church}          // { name, address, city, state, postal_code }
//     subtitle={<>Member Name: {name} • Period: {from} – {to}</>}
//   >
//     <table>...</table>
//   </ChurchPrintModal>

import React, { useEffect, useRef } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";

// Inline SVG church icon (avoids react-icons version issues)
const ChurchIcon = ({ size = 56, color = DARK_RED }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M32 6 L32 20 M26 12 L38 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M20 20 L32 14 L44 20 L44 28 L20 28 Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="#FFF"
    />
    <path
      d="M16 60 L16 34 L48 34 L48 60 Z"
      stroke={color}
      strokeWidth="2"
      fill="#FFF"
    />
    <path
      d="M28 60 L28 44 L36 44 L36 60"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M10 60 L54 60"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="32" cy="24" r="2" fill={color} />
  </svg>
);

// Decorative corner flourish
const CornerFlourish = ({ rotate = 0, color = DARK_RED }) => (
  <svg
    width="46"
    height="46"
    viewBox="0 0 46 46"
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    <path
      d="M6 6 C 6 22, 22 6, 40 6 M6 6 C 6 22, 6 40, 6 40
         M14 14 C 20 14, 26 20, 26 26 M20 20 C 26 20, 32 26, 32 32"
      stroke={color}
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const ChurchPrintModal = ({
  isOpen,
  onClose,
  title,           // e.g. "MEMBER LEDGER"
  subtitle,        // JSX node — e.g. "Member Name: George • Period: ..."
  church = {},     // { name, address, city, state, postal_code }
  children,        // the <table> or content to render inside
  onDownloadPDF,   // optional callback; if absent, Print is used
}) => {
  const sheetRef = useRef(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const churchName = church.name || "Church Name";
  const churchAddress = [
    church.address,
    church.city,
    church.state,
    church.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={2000}
      bg="rgba(15,23,42,0.55)"
      overflowY="auto"
      className="print-modal-root"
    >
      {/* TOP TOOLBAR (hidden on print) */}
      <Flex
        justify="center"
        align="center"
        gap={3}
        py={4}
        px={4}
        className="no-print"
      >
        <Button
          variant="outline"
          h="40px"
          px={5}
          bg="white"
          borderColor={PRIMARY_RED}
          color={PRIMARY_RED}
          borderRadius="6px"
          fontSize="12px"
          fontWeight="600"
          onClick={onClose}
          _hover={{ bg: "#FFF5F7" }}
        >
          ✕ Close
        </Button>

        <Button
          variant="outline"
          h="40px"
          px={5}
          bg="white"
          borderColor={PRIMARY_RED}
          color={PRIMARY_RED}
          borderRadius="6px"
          fontSize="12px"
          fontWeight="600"
          onClick={onDownloadPDF || handlePrint}
          _hover={{ bg: "#FFF5F7" }}
        >
          📄 Download PDF
        </Button>

        <Button
          h="40px"
          px={6}
          bg={PRIMARY_RED}
          color="white"
          borderRadius="6px"
          fontSize="12px"
          fontWeight="600"
          onClick={handlePrint}
          _hover={{ bg: DARK_RED }}
        >
          🖨 Print
        </Button>
      </Flex>

      {/* A4 SHEET */}
      <Flex justify="center" pb={8} px={3} className="print-scroll-wrap">
        <Box
          ref={sheetRef}
          className="print-sheet"
          bg="white"
          width="210mm"
          minH="280mm"
          px="14mm"
          py="12mm"
          boxShadow="0 10px 40px rgba(0,0,0,0.25)"
          position="relative"
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          {/* Inner double border */}
          <Box
            position="absolute"
            inset="6mm"
            border={`1px solid ${DARK_RED}`}
            pointerEvents="none"
          />
          <Box
            position="absolute"
            inset="7.5mm"
            border={`2px solid ${DARK_RED}`}
            pointerEvents="none"
          />

          {/* Corner flourishes */}
          <Box position="absolute" top="10mm" left="10mm" pointerEvents="none">
            <CornerFlourish rotate={0} />
          </Box>
          <Box position="absolute" top="10mm" right="10mm" pointerEvents="none">
            <CornerFlourish rotate={90} />
          </Box>
          <Box
            position="absolute"
            bottom="10mm"
            left="10mm"
            pointerEvents="none"
          >
            <CornerFlourish rotate={-90} />
          </Box>
          <Box
            position="absolute"
            bottom="10mm"
            right="10mm"
            pointerEvents="none"
          >
            <CornerFlourish rotate={180} />
          </Box>

          {/* INNER CONTENT */}
          <Box position="relative" zIndex={1}>
            {/* CHURCH HEADER */}
            <Flex align="center" gap={5} mb={5}>
              <Box flexShrink={0}>
                <ChurchIcon size={64} color={DARK_RED} />
              </Box>
              <Box flex="1" textAlign="center">
                <Text
                  fontSize="22px"
                  fontWeight="700"
                  color={DARK_RED}
                  lineHeight="1.15"
                  fontFamily="Georgia, serif"
                >
                  {churchName}
                </Text>
                {churchAddress && (
                  <Text
                    fontSize="11px"
                    color={TEXT_COLOR}
                    mt={1}
                    fontFamily="Georgia, serif"
                  >
                    {churchAddress}
                  </Text>
                )}
              </Box>
              <Box width="64px" flexShrink={0} />
            </Flex>

            {/* BANNER TITLE */}
            <Flex justify="center" mb={5}>
              <Box
                borderTop={`2px solid ${DARK_RED}`}
                borderBottom={`2px solid ${DARK_RED}`}
                px={7}
                py={1.5}
                bg="#FFF6F8"
              >
                <Text
                  fontSize="16px"
                  fontWeight="700"
                  color={DARK_RED}
                  letterSpacing="2.5px"
                  fontFamily="Georgia, serif"
                >
                  {title}
                </Text>
              </Box>
            </Flex>

            {/* SUBTITLE (Member / Period etc.) */}
            {subtitle && (
              <Box mb={4} textAlign="center">
                <Text
                  fontSize="12px"
                  color={TEXT_COLOR}
                  fontFamily="Georgia, serif"
                >
                  {subtitle}
                </Text>
              </Box>
            )}

            {/* MAIN CONTENT — the table */}
            <Box className="print-content">{children}</Box>
          </Box>
        </Box>
      </Flex>

      {/* GLOBAL PRINT CSS — only applies when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-modal-root,
          .print-modal-root * { visibility: visible !important; }
          .print-modal-root {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          .print-scroll-wrap { padding: 0 !important; }
          .print-sheet {
            box-shadow: none !important;
            width: 210mm !important;
            min-height: auto !important;
            margin: 0 auto !important;
            padding: 10mm 12mm !important;
          }
          @page { size: A4 portrait; margin: 6mm; }
        }
      `}</style>
    </Box>
  );
};

export default ChurchPrintModal;