// src/pages/CommitteePrintPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuFileDown, LuPrinter } from "react-icons/lu";
import html2pdf from "html2pdf.js";

import {
  getCommittee,
  listMembers,
  listDesignations,
} from "../api/registryServices";

// ============================================================
// COLORS (same palette as Death Certificate)
// ============================================================

const PRIMARY_RED = "#B40000";
const DARK_RED = "#8F0000";
const GOLD = "#C99A38";
const BORDER_RED = "#D65A4A";
const LIGHT_BORDER = "#D9B8A8";
const PAPER = "#FFFDF8";

// ============================================================
// HELPERS
// ============================================================

const getArrayData = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const v = value.trim();
    if (v === "") return false;
    if (v.toLowerCase() === "null" || v.toLowerCase() === "undefined")
      return false;
    return true;
  }
  return true;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(
      typeof value === "string" && value.length === 10
        ? `${value}T00:00:00`
        : value
    );
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

// ============================================================
// STYLES (adapted from DeathRegisterPrintModal)
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

  /* ---------- OUTER BORDER ---------- */
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

  /* ---------- INNER BORDER ---------- */
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

  /* ---------- CORNERS ---------- */
  .corner {
    position: absolute;
    z-index: 25;
    width: 34px; height: 34px;
    display: flex; justify-content: center; align-items: center;
    color: ${BORDER_RED};
    font-size: 24px; line-height: 1;
    pointer-events: none;
  }
  .corner.tl { top: 5.5mm; left: 5.5mm; }
  .corner.tr { top: 5.5mm; right: 5.5mm; transform: scaleX(-1); }
  .corner.bl { bottom: 5.5mm; left: 5.5mm; transform: scaleY(-1); }
  .corner.br { bottom: 5.5mm; right: 5.5mm; transform: scale(-1); }

  /* ---------- HEADER ---------- */
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

  /* ---------- TITLE ---------- */
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

  /* ---------- CONTENT ---------- */
  .content {
    position: relative;
    z-index: 5;
    margin: 5mm 8mm 0;
  }

  /* ---------- META TABLE ---------- */
  .top-table {
    width: 100%;
    margin: 0 auto 3.5mm;
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
  .top-label {
    width: 42mm;
    font-weight: 700;
    white-space: nowrap;
    background: rgba(214, 90, 74, 0.06);
  }
  .top-value {
    font-weight: 500;
    padding-left: 10px !important;
  }

  /* ---------- MEMBERS TABLE ---------- */
  .details-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12.5px;
  }
  .details-table th,
  .details-table td {
    border: 1px solid ${LIGHT_BORDER};
    padding: 6px 8px;
    vertical-align: middle;
    color: #171717;
  }
  .details-table thead th {
    background: linear-gradient(to bottom, #F5E6E6, #EBD4D4);
    color: #8F0000;
    font-weight: 700;
    text-align: left;
    font-size: 12.5px;
    height: 10mm;
  }
  .details-table tbody tr {
    height: 10mm;
  }
  .details-table tbody tr:nth-child(even) {
    background: rgba(214, 90, 74, 0.03);
  }

  .col-sl { width: 16mm; text-align: center; }
  .col-name { width: 60mm; }
  .col-designation { width: 55mm; }
  .col-phone { width: 45mm; }

  /* ---------- WATERMARK ---------- */
  .watermark {
    position: absolute;
    left: 50%; top: 58%;
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

  /* ---------- CERTIFICATION ---------- */
  .certificate-text {
    position: relative;
    z-index: 5;
    text-align: center;
    margin: 6mm 9mm 0;
    font-size: 11.5px;
    line-height: 1.45;
    color: #171717;
    font-style: italic;
  }

  /* ---------- STAMP / SIGNATURE GAP ---------- */
  .stamp-sign-gap {
    height: 24mm;
    position: relative;
    z-index: 5;
  }

  /* ---------- FOOTER ---------- */
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
  .signature-line {
    width: 88%;
    margin: 0 auto 4px;
    border-top: 1px solid #222;
    height: 13px;
  }
  .footer-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1.25;
  }
  .footer-date { margin-top: 6px; font-size: 10.5px; }
  .bottom-decoration {
    margin-top: 3mm;
    text-align: center;
    color: ${BORDER_RED};
    font-size: 12px;
    letter-spacing: 4px;
  }

  /* ---------- PRINT ---------- */
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
// PAGE
// ============================================================

const CommitteePrintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [committee, setCommittee] = useState(null);
  const [members, setMembers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // INJECT STYLES
  // ==========================================================
  useEffect(() => {
    const STYLE_ID = "committee-cert-styles";
    let styleTag = document.getElementById(STYLE_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = STYLE_ID;
      styleTag.innerHTML = CERTIFICATE_STYLES;
      document.head.appendChild(styleTag);
    }
    return () => {
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();
    };
  }, []);

  // ==========================================================
  // LOAD DATA
  // ==========================================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, mRes, dRes] = await Promise.all([
          getCommittee(id),
          listMembers(),
          listDesignations(),
        ]);
        setCommittee(cRes?.data ?? cRes);
        setMembers(getArrayData(mRes));
        setDesignations(getArrayData(dRes));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // ==========================================================
  // LOOKUPS
  // ==========================================================
  const getMemberName = (memberId) => {
    const m = members.find((x) => Number(x.id) === Number(memberId));
    if (!m) return `Member #${memberId}`;
    return (
      m.name ||
      m.member_name ||
      m.full_name ||
      `${m.first_name || ""} ${m.last_name || ""}`.trim() ||
      `Member #${memberId}`
    );
  };

  const getDesignationName = (designationId) => {
    const d = designations.find(
      (x) => Number(x.id) === Number(designationId)
    );
    if (!d) return `Designation #${designationId}`;
    return d.designation_name || d.name || `Designation #${designationId}`;
  };

  // ==========================================================
  // PRINT
  // ==========================================================
  const handlePrint = () => {
    const element = printRef.current;
    if (!element) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=1000"
    );
    if (!printWindow) {
      alert("Please allow pop-ups to print the register.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Committee Register</title>
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
        <body>${element.innerHTML}</body>
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

    const fileName = `Committee-Register-${
      committee?.id || "Record"
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
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading || !committee) {
    return (
      <Box p={8}>
        <Text>Loading…</Text>
      </Box>
    );
  }

  const committeeCode =
    committee.committee_code ||
    `COM-${String(committee.id).padStart(3, "0")}`;

  const memberList = Array.isArray(committee.members)
    ? committee.members
    : [];

  // ==========================================================
  // CERTIFICATE MARKUP
  // ==========================================================
  const renderCertificate = () => (
    <div className="certificate-page">
      {/* OUTER BORDER */}
      <div className="outer-border" />

      {/* INNER BORDER */}
      <div className="inner-border" />

      {/* CORNERS */}
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
          <div className="title-text">Committee Register</div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        {/* META */}
        <table className="top-table">
          <tbody>
            <tr>
              <td className="top-label">Committee #</td>
              <td className="top-value">{committeeCode}</td>
            </tr>
            <tr>
              <td className="top-label">Committee Name</td>
              <td className="top-value">
                {committee.committee_name || "N/A"}
              </td>
            </tr>
            <tr>
              <td className="top-label">Date From</td>
              <td className="top-value">
                {formatDate(committee.committee_from_date)}
              </td>
            </tr>
            <tr>
              <td className="top-label">Date To</td>
              <td className="top-value">
                {formatDate(committee.committee_to_date)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* WATERMARK */}
        <div className="watermark">
          <div className="watermark-text">
            MALANKARA ORTHODOX SYRIAN CHURCH
          </div>
        </div>

        {/* MEMBERS TABLE */}
        <table className="details-table">
          <thead>
            <tr>
              <th className="col-sl">Sl. No.</th>
              <th className="col-name">Committee Member</th>
              <th className="col-designation">Designation</th>
              <th className="col-phone">Phone</th>
            </tr>
          </thead>
          <tbody>
            {memberList.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "10px",
                    color: "#666",
                  }}
                >
                  No members added.
                </td>
              </tr>
            ) : (
              memberList.map((m, i) => (
                <tr key={i}>
                  <td className="col-sl">{i + 1}</td>
                  <td>{getMemberName(m.member)}</td>
                  <td>{getDesignationName(m.designation)}</td>
                  <td>{m.phone || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CERTIFICATION */}
      <div className="certificate-text">
        This is a computer-generated committee register.
      </div>

      {/* STAMP / SIGN GAP */}
      <div className="stamp-sign-gap" />

      {/* FOOTER */}
      <div className="footer">
        <div className="footer-grid">
          <div className="footer-item">
            <strong>Committee Secretary</strong>
          </div>

          <div className="footer-item footer-center">
            <div className="footer-label">SEAL</div>
          </div>

          <div className="footer-item footer-right">
            <div className="footer-label">
              Vicar / Authorized Signatory
            </div>
          </div>
        </div>

        <div className="bottom-decoration">✦ ✦ ✦</div>
      </div>
    </div>
  );

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <Box
      minH="100vh"
      bg="#F1EFEF"
      display="flex"
      flexDirection="column"
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
            onClick={() => navigate(`/committees/${id}`)}
          >
            <LuArrowLeft size={15} />
            <Box ml="7px">Back</Box>
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

      {/* PREVIEW AREA */}
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
    </Box>
  );
};

export default CommitteePrintPage;