// src/pages/LegacyDeathPrintModal.jsx

import React, { useEffect, useRef } from "react";

import {
  Box,
  Button,
  HStack,
  Text,
  Dialog,
} from "@chakra-ui/react";

import { LuFileDown, LuPrinter } from "react-icons/lu";

import html2pdf from "html2pdf.js";

// ============================================================
// COLORS
// ============================================================

const PRIMARY_RED = "#B40000";
const DARK_RED = "#8F0000";
const GOLD = "#C99A38";
const BORDER_RED = "#D65A4A";
const LIGHT_BORDER = "#D9B8A8";
const PAPER = "#FFFDF8";

// ============================================================
// CERTIFICATE STYLES (same as DeathRegisterPrintModal)
// ============================================================

const CERTIFICATE_STYLES = `
  * { box-sizing: border-box; }

  .certificate-page {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
    padding: 11mm 13mm;
    background:
      radial-gradient(
        circle at center,
        rgba(190, 145, 70, 0.025),
        transparent 45%
      ),
      ${PAPER};
    color: #171717;
    font-family: Georgia, "Times New Roman", serif;
    box-sizing: border-box;
  }

  .outer-border {
    position: absolute;
    top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
    border: 1.5px solid ${BORDER_RED};
    pointer-events: none;
    z-index: 20;
  }
  .outer-border::before {
    content: "";
    position: absolute;
    top: 4px; left: 4px; right: 4px; bottom: 4px;
    border: 1px solid rgba(214, 90, 74, 0.45);
    pointer-events: none;
  }

  .inner-border {
    position: absolute;
    top: 8mm; left: 8mm; right: 8mm; bottom: 8mm;
    border: 1.8px solid #B92323;
    pointer-events: none;
    z-index: 19;
  }
  .inner-border::before {
    content: "";
    position: absolute;
    top: 4px; left: 4px; right: 4px; bottom: 4px;
    border: 1px solid ${GOLD};
    pointer-events: none;
  }

  .corner {
    position: absolute;
    z-index: 25;
    width: 34px; height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${BORDER_RED};
    font-size: 24px;
    line-height: 1;
    pointer-events: none;
  }
  .corner.tl { top: 5.5mm; left: 5.5mm; }
  .corner.tr { top: 5.5mm; right: 5.5mm; transform: scaleX(-1); }
  .corner.bl { bottom: 5.5mm; left: 5.5mm; transform: scaleY(-1); }
  .corner.br { bottom: 5.5mm; right: 5.5mm; transform: scale(-1); }

  /* HEADER */
  .header {
    position: relative;
    z-index: 10;
    margin-top: 5mm;
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .header-inner {
    width: 100%;
    display: grid;
    grid-template-columns: 75px 1fr 75px;
    align-items: center;
    min-height: 28mm;
  }
  .logo-space { width: 70px; height: 68px; }
  .church-heading { text-align: center; padding: 0 5px; }
  .church-name {
    color: #4A1111;
    font-family: "Old English Text MT", "UnifrakturCook",
      "Lucida Blackletter", Georgia, serif;
    font-size: 27px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: 0.1px;
    white-space: nowrap;
  }
  .church-subtitle {
    color: #4A1111;
    font-family: "Old English Text MT", "UnifrakturCook",
      Georgia, serif;
    font-size: 24px;
    line-height: 1.05;
    font-weight: 700;
    margin-top: 2px;
    white-space: nowrap;
  }
  .header-spacer { width: 70px; height: 68px; }

  /* TITLE */
  .title-area {
    position: relative;
    z-index: 10;
    margin-top: 4mm;
    text-align: center;
  }
  .title-banner {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 107mm;
    height: 15mm;
    padding: 2px 20px;
    background: linear-gradient(to bottom, #B30D0D, #8F0000);
    color: white;
    border: 2px solid ${GOLD};
    box-shadow: inset 0 0 0 1px #650000;
    border-radius: 2px;
  }
  .title-banner::before,
  .title-banner::after {
    content: "";
    position: absolute;
    top: 2px;
    width: 17px;
    height: calc(100% - 4px);
    background: linear-gradient(to bottom, #B30D0D, #8F0000);
    border-top: 2px solid ${GOLD};
    border-bottom: 2px solid ${GOLD};
  }
  .title-banner::before { left: -11px; transform: skewX(-18deg); }
  .title-banner::after { right: -11px; transform: skewX(18deg); }
  .title-text {
    position: relative;
    z-index: 2;
    font-family: "Old English Text MT", "UnifrakturCook",
      "Lucida Blackletter", Georgia, serif;
    font-size: 21px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }

  /* LEGACY TAG */
  .legacy-tag {
    position: relative;
    z-index: 10;
    margin-top: 3mm;
    text-align: center;
  }
  .legacy-tag-inner {
    display: inline-block;
    padding: 3px 14px;
    border: 1px solid #F5CDA0;
    background: #FFF4E5;
    color: #B45309;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    border-radius: 3px;
    font-family: Georgia, serif;
  }

  /* CONTENT */
  .content {
    position: relative;
    z-index: 5;
    margin: 0 8mm;
  }

  /* TOP (DIOCESE / PARISH) */
  .top-table {
    width: 88%;
    margin: 3.5mm auto 3.5mm;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12.5px;
  }
  .top-table td {
    border: 1px solid ${LIGHT_BORDER};
    padding: 5px 8px;
    vertical-align: middle;
    height: 10mm;
  }
  .top-label { width: 32mm; font-weight: 700; white-space: nowrap; }
  .top-value { font-weight: 500; padding-left: 10px !important; }

  /* MAIN DETAILS */
  .details-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12.5px;
  }
  .details-table td {
    border: 1px solid ${LIGHT_BORDER};
    padding: 5px 7px;
    vertical-align: middle;
    color: #171717;
  }

  .details-label {
    width: 42mm;
    font-weight: 700;
    line-height: 1.15;
  }
  .details-value {
    color: #171717;
    font-weight: 500;
    line-height: 1.25;
    padding-left: 10px !important;
  }

  .name-row td { height: 11mm; }
  .age-row td { height: 14mm; }
  .address-row td { height: 26mm; }
  .normal-row td { height: 10mm; }
  .date-row td { height: 9mm; }

  .age-number {
    width: 15mm;
    text-align: center;
    font-size: 12px;
  }
  .dob-number {
    width: 14mm;
    text-align: center;
    font-size: 12px;
  }
  .dob-separator {
    width: 4mm;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
  }
  .sex-cell {
    width: 31mm;
    white-space: nowrap;
    text-align: center;
    font-size: 11.5px;
  }
  .address-value {
    vertical-align: middle !important;
    line-height: 1.45;
  }

  /* WATERMARK */
  .watermark {
    position: absolute;
    left: 50%;
    top: 58%;
    transform: translate(-50%, -50%);
    width: 92mm; height: 92mm;
    border: 1.5px solid rgba(155, 30, 30, 0.045);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    pointer-events: none;
    opacity: 0.75;
  }
  .watermark::before {
    content: "✠";
    font-size: 125px;
    color: rgba(155, 30, 30, 0.035);
  }
  .watermark-text {
    position: absolute;
    bottom: 24px;
    font-size: 7px;
    color: rgba(155, 30, 30, 0.045);
    letter-spacing: 1.3px;
    white-space: nowrap;
  }

  /* CERTIFICATION */
  .certificate-text {
    position: relative;
    z-index: 5;
    text-align: center;
    margin: 4mm 9mm 0;
    font-size: 11.5px;
    line-height: 1.45;
    color: #171717;
  }

  /* SPACE FOR SEAL / SIGNATURE */
  .stamp-sign-gap {
    height: 24mm;
    position: relative;
    z-index: 5;
  }

  /* FOOTER */
  .footer {
    position: relative;
    z-index: 5;
    margin: 0 9mm;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.7fr 1.25fr;
    gap: 8px;
    align-items: end;
  }
  .footer-item { font-size: 10.5px; color: #171717; line-height: 1.3; }
  .footer-center { text-align: center; }
  .footer-right { text-align: center; }
  .footer-label { font-size: 10px; font-weight: 500; line-height: 1.25; }
  .footer-date { margin-top: 6px; font-size: 10.5px; }

  @media print {
    html, body {
      width: 100%; height: 100%;
      margin: 0; padding: 0;
      background: white;
    }
    .certificate-page {
      margin: 0 !important;
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      box-shadow: none !important;
    }
  }
`;

// ============================================================
// HELPERS
// ============================================================

const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const v = value.trim();
    if (v === "" || v.toLowerCase() === "null" || v.toLowerCase() === "undefined") {
      return false;
    }
    return true;
  }
  return true;
};

const safe = (value, fallback = "N/A") =>
  isNotEmpty(value) ? value : fallback;

const getDateFormatted = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const getDOBFormatted = (dateString) => {
  if (!dateString) return "--:--:----";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}:${mm}:${yyyy}`;
  } catch {
    return "--:--:----";
  }
};

const getAge = (dob, refDate) => {
  if (!dob || !refDate) return null;

  try {
    const b = new Date(dob);
    const r = new Date(refDate);
    if (Number.isNaN(b.getTime()) || Number.isNaN(r.getTime())) return null;

    let age = r.getFullYear() - b.getFullYear();
    const m = r.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && r.getDate() < b.getDate())) age--;
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
};

// ============================================================
// COMPONENT
// ============================================================

const LegacyDeathPrintModal = ({ isOpen, onClose, record }) => {
  const printRef = useRef(null);

  // ---------------- INJECT STYLES ----------------
  useEffect(() => {
    if (!isOpen) return;

    let styleTag = document.getElementById("legacy-death-cert-styles-ref");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "legacy-death-cert-styles-ref";
      styleTag.innerHTML = CERTIFICATE_STYLES;
      document.head.appendChild(styleTag);
    }

    return () => {
      const existing = document.getElementById("legacy-death-cert-styles-ref");
      if (existing) existing.remove();
    };
  }, [isOpen]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const memberName = safe(record?.name);

  const gender = safe(record?.gender);

  const dateOfBirth = record?.dob || null;
  const diedOn = record?.died_on || null;

  // Prefer stored age_at_death, else compute from dob + died_on
  const computedAge =
    record?.age_at_death != null
      ? record.age_at_death
      : getAge(dateOfBirth, diedOn);

  const ageDisplay = computedAge != null ? computedAge : "N/A";

  const address =
    safe(record?.address, null) ||
    safe(record?.house_name, null) ||
    "N/A";

  const houseRegNo =
    safe(record?.house_reg_no, null) ||
    safe(record?.member_register_number, null) ||
    safe(record?.reg_no, "N/A");

  const chiefCelebrant =
    safe(record?.priest_name, null) ||
    safe(record?.vicar_name, "N/A");

  const placeOfDeath =
    safe(record?.place_of_death, null) ||
    safe(record?.house_name, "N/A");

  const churchName =
    safe(record?.church_name, null) ||
    safe(record?.church?.name, "N/A");

  const churchCity =
    safe(record?.church_city, null) ||
    safe(record?.church?.city, "N/A");

  const dioceseName =
    safe(record?.diocese_name, null) ||
    safe(record?.church?.diocese?.name, "N/A");

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = () => {
    const element = printRef.current;
    if (!element) return;

    const printWindow = window.open("", "_blank", "width=1200,height=1000");
    if (!printWindow) {
      alert("Please allow pop-ups to print the certificate.");
      return;
    }

    const content = element.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Legacy Death / Funeral Certificate</title>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              margin: 0; padding: 0;
              background: white;
              font-family: Georgia, "Times New Roman", serif;
            }
            @page { size: A4 portrait; margin: 0; }
            @media print {
              html, body { width: 100%; height: 100%; }
            }
            ${CERTIFICATE_STYLES}
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 300);
    }, 700);
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const fileName = `Legacy-Death-Funeral-Certificate-${
      record?.id || "Record"
    }.pdf`;

    const options = {
      margin: 0,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        imageTimeout: 5000,
      },
      jsPDF: {
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // ==========================================================
  // CERTIFICATE
  // ==========================================================

  const renderCertificate = () => {
    return (
      <div className="certificate-page">
        <div className="outer-border" />
        <div className="inner-border" />

        <div className="corner tl">❧</div>
        <div className="corner tr">❧</div>
        <div className="corner bl">❧</div>
        <div className="corner br">❧</div>

        {/* HEADER */}
        <div className="header">
          <div className="header-inner">
            <div className="logo-space" />
            <div className="church-heading">
              <div className="church-name">Malankara Orthodox</div>
              <div className="church-subtitle">Syrian Church</div>
            </div>
            <div className="header-spacer" />
          </div>
        </div>

        {/* TITLE */}
        <div className="title-area">
          <div className="title-banner">
            <div className="title-text">Death/Funeral Certificate</div>
          </div>
        </div>

        {/* LEGACY TAG */}
        <div className="legacy-tag">
          <div className="legacy-tag-inner">
            LEGACY · BACK-FILLED RECORD
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {/* DIOCESE / PARISH */}
          <table className="top-table">
            <tbody>
              <tr>
                <td className="top-label">Diocese</td>
                <td className="top-value">{dioceseName}</td>
              </tr>
              <tr>
                <td className="top-label">Parish</td>
                <td className="top-value">{churchName}</td>
              </tr>
            </tbody>
          </table>

          {/* WATERMARK */}
          <div className="watermark">
            <div className="watermark-text">
              MALANKARA ORTHODOX SYRIAN CHURCH
            </div>
          </div>

          {/* MAIN DETAILS */}
          <table className="details-table">
            <tbody>
              <tr className="name-row">
                <td className="details-label">Name</td>
                <td className="details-value" colSpan="6">
                  {memberName}
                </td>
              </tr>

              <tr className="age-row">
                <td className="details-label">Age, Date of Birth</td>
                <td className="age-number">{ageDisplay}</td>
                <td className="details-value" colSpan="3" style={{ textAlign: "center" }}>
                  {getDOBFormatted(dateOfBirth)}
                </td>
                <td className="dob-separator">Sex :</td>
                <td className="sex-cell">{gender}</td>
              </tr>

              <tr className="address-row">
                <td className="details-label">Address</td>
                <td className="details-value address-value" colSpan="6">
                  {address}
                </td>
              </tr>

              <tr className="normal-row">
                <td className="details-label">
                  House No. in the Church Register
                </td>
                <td className="details-value" colSpan="6">
                  {houseRegNo}
                </td>
              </tr>

              <tr className="date-row">
                <td className="details-label">Date of Death</td>
                <td className="details-value" colSpan="6">
                  {getDateFormatted(diedOn)}
                </td>
              </tr>

              <tr className="date-row">
                <td className="details-label">Date of Funeral</td>
                <td className="details-value" colSpan="6">
                  {getDateFormatted(record?.funeral_on)}
                </td>
              </tr>

              {isNotEmpty(record?.place_of_death) && (
                <tr className="date-row">
                  <td className="details-label">Place of Death</td>
                  <td className="details-value" colSpan="6">
                    {placeOfDeath}
                  </td>
                </tr>
              )}

              <tr className="date-row">
                <td className="details-label">Chief Celebrant</td>
                <td className="details-value" colSpan="6">
                  Rev. Fr. {chiefCelebrant}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CERTIFICATION */}
        <div className="certificate-text">
          I do hereby certify that the above is a true copy of an entry in the
          <br />
          Funeral Register maintained at this Parish.
        </div>

        <div className="stamp-sign-gap" />

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-grid">
            <div className="footer-item">
              <strong>Place :</strong>{" "}
              {churchCity !== "N/A" ? churchCity : "N/A"}
              <div className="footer-date">
                <strong>Date :</strong>{" "}
                {getDateFormatted(record?.funeral_on || diedOn)}
              </div>
            </div>

            <div className="footer-item footer-center">
              <div className="footer-label">SEAL</div>
            </div>

            <div className="footer-item footer-right">
              <div className="footer-label">
                <br />
                Name and Signature of Vicar
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // MODAL (Chakra v3)
  // ==========================================================

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="full"
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="100vw"
          maxH="100vh"
          h="100vh"
          m={0}
          borderRadius="0"
          overflow="hidden"
          bg="#F1EFEF"
        >
          {/* TOOLBAR */}
          <Box
            h="58px"
            bg="#FFFFFF"
            borderBottom="1px solid #E5E5E5"
            px={{ base: 4, md: 7 }}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexShrink={0}
          >
            <Text
              fontSize={{ base: "17px", md: "20px" }}
              fontWeight="700"
              color="#182338"
            >
              Print Preview
            </Text>

            <HStack gap={{ base: 2, md: 3 }}>
              <Button
                h="38px"
                minW={{ base: "70px", md: "94px" }}
                variant="outline"
                borderColor="#263B73"
                color="#182A5A"
                bg="#FFFFFF"
                fontSize="13px"
                onClick={onClose}
              >
                Close
              </Button>

              <Button
                h="38px"
                px={5}
                variant="outline"
                borderColor="#E32626"
                color="#E32626"
                bg="#FFFFFF"
                fontSize="13px"
                fontWeight="600"
                onClick={handleDownloadPDF}
              >
                <LuFileDown size={17} />
                <Box ml="7px">Download PDF</Box>
              </Button>

              <Button
                h="38px"
                px={6}
                bg={PRIMARY_RED}
                color="#FFFFFF"
                fontSize="13px"
                fontWeight="600"
                onClick={handlePrint}
                _hover={{ bg: DARK_RED }}
              >
                <LuPrinter size={17} />
                <Box ml="7px">Print</Box>
              </Button>
            </HStack>
          </Box>

          {/* PREVIEW */}
          <Box
            flex="1"
            overflow="auto"
            bg="#F1EFEF"
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
            p={{ base: 3, md: 5 }}
          >
            <Box
              ref={printRef}
              flexShrink={0}
              bg="#FFFFFF"
              boxShadow="0 3px 15px rgba(0,0,0,0.25)"
            >
              {renderCertificate()}
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default LegacyDeathPrintModal;