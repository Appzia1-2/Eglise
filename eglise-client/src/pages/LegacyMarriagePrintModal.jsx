// src/pages/LegacyMarriagePrintModal.jsx

import React, { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  HStack,
  Text,
  Dialog,
} from "@chakra-ui/react";

import { LuFileDown, LuPrinter } from "react-icons/lu";

import html2pdf from "html2pdf.js";
import { getMyChurch } from "../api/registryServices"; // ✅ Import API

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
// CERTIFICATE STYLES (same as MarriageRegisterPrintModal)
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

  /* OUTER BORDER */
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

  /* INNER BORDER */
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

  /* CORNERS */
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

  /* SL.NO + REG NO SIDE LABELS */
  .side-labels {
    position: relative;
    z-index: 10;
    margin-top: 3mm;
    display: flex;
    justify-content: space-between;
    padding: 0 8mm;
    font-size: 11.5px;
    color: #171717;
  }
  .side-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 700;
    line-height: 1.1;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }
  .side-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 700;
    line-height: 1.1;
    writing-mode: vertical-rl;
  }
  .side-label-text {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .side-label-value {
    margin-top: 6px;
    font-size: 11.5px;
    font-weight: 500;
  }

  /* CONTENT */
  .content {
    position: relative;
    z-index: 5;
    margin: 0 8mm;
  }

  /* TOP TABLE (Diocese / Parish) */
  .top-table {
    width: 82%;
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
  .top-label { width: 30mm; font-weight: 700; white-space: nowrap; }
  .top-value { font-weight: 500; padding-left: 10px !important; }

  /* MAIN DETAILS (2-column with header) */
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

  .section-header td {
    text-align: center;
    font-weight: 700;
    letter-spacing: 0.5px;
    font-size: 12px;
    color: #171717;
    height: 8mm;
    background: rgba(201, 154, 56, 0.06);
  }

  .lbl-col { width: 30mm; font-weight: 500; }
  .val-col { font-weight: 500; padding-left: 10px !important; }

  .name-row td { height: 10mm; }
  .age-row td { height: 10mm; }
  .addr-row td { height: 18mm; }
  .full-row td { height: 10mm; }
  .full-row .lbl-full { width: 40mm; font-weight: 500; }

  .addr-value {
    vertical-align: middle !important;
    line-height: 1.4;
  }

  .age-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .age-strip .age-box {
    min-width: 20px;
    text-align: center;
    font-weight: 500;
  }
  .age-strip .dash {
    font-weight: 500;
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
    line-height: 1.5;
    color: #171717;
  }

  /* SPACE FOR SEAL / SIGNATURE */
  .stamp-sign-gap {
    height: 20mm;
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

const getDobTriplet = (dateString) => {
  if (!dateString) return { dd: "--", mm: "--", yyyy: "----" };
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return { dd: "--", mm: "--", yyyy: "----" };
    }
    return {
      dd: String(date.getDate()).padStart(2, "0"),
      mm: String(date.getMonth() + 1).padStart(2, "0"),
      yyyy: String(date.getFullYear()),
    };
  } catch {
    return { dd: "--", mm: "--", yyyy: "----" };
  }
};

const getAge = (dob, refDate) => {
  if (!dob || !refDate) return "N/A";
  try {
    const b = new Date(dob);
    const r = new Date(refDate);
    if (Number.isNaN(b.getTime()) || Number.isNaN(r.getTime())) return "N/A";
    let age = r.getFullYear() - b.getFullYear();
    const m = r.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && r.getDate() < b.getDate())) age--;
    return age >= 0 ? age : "N/A";
  } catch {
    return "N/A";
  }
};

// ============================================================
// COMPONENT
// ============================================================

const LegacyMarriagePrintModal = ({ isOpen, onClose, record }) => {
  const printRef = useRef(null);

  // ✅ NEW: State to hold fetched church data
  const [churchData, setChurchData] = useState({
    name: "",
    city: "",
    diocese: "",
  });

  // ✅ NEW: Fetch Church & Diocese details on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchChurchInfo = async () => {
      try {
        const res = await getMyChurch();
        const c = res?.data ?? res ?? {};
        setChurchData({
          name: c.name || "",
          city: c.city || "",
          diocese: c.diocese?.name || c.diocese_name || "",
        });
      } catch (err) {
        console.error("Failed to fetch church info for print:", err);
      }
    };

    fetchChurchInfo();
  }, [isOpen]);

  // ---------------- INJECT STYLES ----------------
  useEffect(() => {
    if (!isOpen) return;

    let styleTag = document.getElementById("legacy-marriage-cert-styles-ref");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "legacy-marriage-cert-styles-ref";
      styleTag.innerHTML = CERTIFICATE_STYLES;
      document.head.appendChild(styleTag);
    }

    return () => {
      const existing = document.getElementById("legacy-marriage-cert-styles-ref");
      if (existing) existing.remove();
    };
  }, [isOpen]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const groomName = safe(record?.groom_name);
  const brideName = safe(record?.bride_name);

  const groomFather = safe(record?.groom_father);
  const groomMother = safe(record?.groom_mother);
  const brideFather = safe(record?.bride_father);
  const brideMother = safe(record?.bride_mother);

  const groomDob = record?.groom_dob || null;
  const brideDob = record?.bride_dob || null;

  const groomParish =
    safe(record?.groom_parish, null) ||
    safe(record?.groom_house_name, null) ||
    "N/A";

  const brideParish =
    safe(record?.bride_parish, null) ||
    safe(record?.bride_house_name, null) ||
    "N/A";

  const groomAddress = safe(record?.groom_address, "N/A");
  const brideAddress = safe(record?.bride_address, "N/A");

  const groomEmail = safe(record?.groom_email, "N/A");
  const brideEmail = safe(record?.bride_email, "N/A");

  const groomPhone = safe(record?.groom_phone, "N/A");
  const bridePhone = safe(record?.bride_phone, "N/A");

  const marriageDate = record?.date || null;

  const placeOfMarriage =
    safe(record?.place_of_marriage, null) ||
    safe(record?.church_name, null) ||
    safe(record?.church?.name, null) ||
    "N/A";

  const chiefCelebrant =
    safe(record?.minister_of_marriage, null) ||
    "N/A";

  const registerNumber = safe(record?.register_number);
  const slNo = safe(record?.id, "N/A");

  // ✅ ROBUST FALLBACKS FOR PARISH & DIOCESE
  const churchCity =
    safe(record?.church_city, null) ||
    safe(record?.church?.city, null) ||
    safe(churchData.city, "N/A");

  const churchName =
    safe(record?.church_name, null) ||
    safe(record?.church?.name, null) ||
    safe(churchData.name, "N/A");

  const dioceseName =
    safe(record?.diocese_name, null) ||
    safe(record?.church?.diocese?.name, null) ||
    safe(churchData.diocese, "N/A");

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
          <title>Legacy Marriage Certificate</title>
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

    const fileName = `Legacy-Marriage-Certificate-${
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
    const groomDobT = getDobTriplet(groomDob);
    const brideDobT = getDobTriplet(brideDob);

    const groomAge = getAge(groomDob, marriageDate);
    const brideAge = getAge(brideDob, marriageDate);

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
            <div className="title-text">Marriage Certificate</div>
          </div>
        </div>

        {/* LEGACY TAG */}
        <div className="legacy-tag">
          <div className="legacy-tag-inner">
            LEGACY · BACK-FILLED RECORD
          </div>
        </div>

        {/* SIDE LABELS: Sl. No (left) and Reg. No (right) */}
        <div className="side-labels">
          <div className="side-left">
            <span className="side-label-text">Sl. No.</span>
            <span className="side-label-value">{slNo}</span>
          </div>
          <div className="side-right">
            <span className="side-label-text">Reg. No.</span>
            <span className="side-label-value">{registerNumber}</span>
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

          {/* MAIN DETAILS: 2-column Bridegroom / Bride */}
          <table className="details-table">
            <tbody>
              {/* SECTION HEADER */}
              <tr className="section-header">
                <td colSpan="2">BRIDEGROOM</td>
                <td colSpan="2">BRIDE</td>
              </tr>

              {/* NAME */}
              <tr className="name-row">
                <td className="lbl-col">Name</td>
                <td className="val-col">{groomName}</td>
                <td className="lbl-col">Name</td>
                <td className="val-col">{brideName}</td>
              </tr>

              {/* AGE / DOB */}
              <tr className="age-row">
                <td className="lbl-col">Age, Date of Birth</td>
                <td className="val-col">
                  <div className="age-strip">
                    <span className="age-box">{groomAge}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{groomDobT.dd}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{groomDobT.mm}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{groomDobT.yyyy}</span>
                  </div>
                </td>
                <td className="lbl-col">Age, Date of Birth</td>
                <td className="val-col">
                  <div className="age-strip">
                    <span className="age-box">{brideAge}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{brideDobT.dd}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{brideDobT.mm}</span>
                    <span className="dash">:</span>
                    <span className="age-box">{brideDobT.yyyy}</span>
                  </div>
                </td>
              </tr>

              {/* PARISH / HOUSE */}
              <tr className="full-row">
                <td className="lbl-col">Parish</td>
                <td className="val-col">{groomParish}</td>
                <td className="lbl-col">Parish</td>
                <td className="val-col">{brideParish}</td>
              </tr>

              {/* FATHER */}
              <tr className="full-row">
                <td className="lbl-col">Name of Father</td>
                <td className="val-col">{groomFather}</td>
                <td className="lbl-col">Name of Father</td>
                <td className="val-col">{brideFather}</td>
              </tr>

              {/* MOTHER */}
              <tr className="full-row">
                <td className="lbl-col">Name of Mother</td>
                <td className="val-col">{groomMother}</td>
                <td className="lbl-col">Name of Mother</td>
                <td className="val-col">{brideMother}</td>
              </tr>

              {/* ADDRESS */}
              <tr className="addr-row">
                <td className="lbl-col">Address</td>
                <td className="val-col addr-value">{groomAddress}</td>
                <td className="lbl-col">Address</td>
                <td className="val-col addr-value">{brideAddress}</td>
              </tr>

              {/* EMAIL */}
              <tr className="full-row">
                <td className="lbl-col">E-mail</td>
                <td className="val-col">{groomEmail}</td>
                <td className="lbl-col">E-mail</td>
                <td className="val-col">{brideEmail}</td>
              </tr>

              {/* PHONE */}
              <tr className="full-row">
                <td className="lbl-col">Phone</td>
                <td className="val-col">{groomPhone}</td>
                <td className="lbl-col">Phone</td>
                <td className="val-col">{bridePhone}</td>
              </tr>

              {/* MARRIAGE DATE */}
              <tr className="full-row">
                <td className="lbl-full">Date of Marriage</td>
                <td className="val-col" colSpan="3">
                  {getDateFormatted(marriageDate)}
                </td>
              </tr>

              {/* PLACE OF MARRIAGE */}
              <tr className="full-row">
                <td className="lbl-full">Place of Marriage</td>
                <td className="val-col" colSpan="3">
                  {placeOfMarriage}
                </td>
              </tr>

              {/* CHIEF CELEBRANT */}
              <tr className="full-row">
                <td className="lbl-full">Chief Celebrant</td>
                <td className="val-col" colSpan="3">
                  {chiefCelebrant}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CERTIFICATION */}
        <div className="certificate-text">
          I do hereby certify that the above is a true and faithful extract of
          <br />
          English Translation from the Register of Marriages maintained at this Parish.
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
                {getDateFormatted(marriageDate)}
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

export default LegacyMarriagePrintModal;