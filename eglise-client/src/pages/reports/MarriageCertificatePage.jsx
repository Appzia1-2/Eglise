// src/pages/reports/MarriageCertificatePage.jsx

import React, { useEffect, useState } from "react";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { LuFileDown, LuPrinter } from "react-icons/lu";

import CertificateShell from "./CertificateShell";
import { pick } from "./reportConfig";

// ============================================================
// INJECTED STYLES — same as MarriageRegisterPrintModal
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
      #FFFDF8;
    color: #171717;
    font-family: Georgia, "Times New Roman", serif;
    box-sizing: border-box;
  }

  .outer-border {
    position: absolute;
    top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
    border: 1.5px solid #D65A4A;
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
    border: 1px solid #C99A38;
    pointer-events: none;
  }

  .corner {
    position: absolute;
    z-index: 25;
    width: 34px; height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #D65A4A;
    font-size: 24px;
    line-height: 1;
    pointer-events: none;
  }
  .corner.tl { top: 5.5mm; left: 5.5mm; }
  .corner.tr { top: 5.5mm; right: 5.5mm; transform: scaleX(-1); }
  .corner.bl { bottom: 5.5mm; left: 5.5mm; transform: scaleY(-1); }
  .corner.br { bottom: 5.5mm; right: 5.5mm; transform: scale(-1); }

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
    border: 2px solid #C99A38;
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
    border-top: 2px solid #C99A38;
    border-bottom: 2px solid #C99A38;
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
  .side-label-text { font-size: 11px; font-weight: 700; letter-spacing: 0.3px; }
  .side-label-value { margin-top: 6px; font-size: 11.5px; font-weight: 500; }

  .content {
    position: relative;
    z-index: 5;
    margin: 0 8mm;
  }

  .top-table {
    width: 82%;
    margin: 0 auto 3.5mm;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12.5px;
  }
  .top-table td {
    border: 1px solid #D9B8A8;
    padding: 5px 8px;
    vertical-align: middle;
    height: 10mm;
  }
  .top-label { width: 30mm; font-weight: 700; white-space: nowrap; }
  .top-value { font-weight: 500; padding-left: 10px !important; }

  .details-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12.5px;
  }
  .details-table td {
    border: 1px solid #D9B8A8;
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

  .addr-value { vertical-align: middle !important; line-height: 1.4; }

  .age-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .age-strip .age-box { min-width: 20px; text-align: center; font-weight: 500; }
  .age-strip .dash { font-weight: 500; }

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

  .certificate-text {
    position: relative;
    z-index: 5;
    text-align: center;
    margin: 4mm 9mm 0;
    font-size: 11.5px;
    line-height: 1.5;
    color: #171717;
  }

  .stamp-sign-gap {
    height: 20mm;
    position: relative;
    z-index: 5;
  }

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
`;

// ============================================================
// HELPERS
// ============================================================

const isNotEmpty = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined")
      return false;
    return true;
  }
  return true;
};

const safe = (v, fallback = "N/A") => (isNotEmpty(v) ? v : fallback);

const formatLongDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const dobTriplet = (dateString) => {
  if (!dateString) return { dd: "--", mm: "--", yyyy: "----" };
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return { dd: "--", mm: "--", yyyy: "----" };
    return {
      dd: String(d.getDate()).padStart(2, "0"),
      mm: String(d.getMonth() + 1).padStart(2, "0"),
      yyyy: String(d.getFullYear()),
    };
  } catch {
    return { dd: "--", mm: "--", yyyy: "----" };
  }
};

const ageBetween = (dob, refDate) => {
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
// CERTIFICATE BODY
// ============================================================

const CertificateBody = ({ r, printRef }) => {
  // ------------------------------------------------
  // DATA
  // ------------------------------------------------

  const groomName = safe(
    pick(r, ["groom_name", "groom_member_name", "groom"], null)
  );

  const brideName = safe(
    pick(r, ["bride_name", "bride_member_name", "bride"], null)
  );

  const groomFather = safe(
    pick(r, ["groom_father", "groom_father_name"], null)
  );

  const groomMother = safe(
    pick(r, ["groom_mother", "groom_mother_name"], null)
  );

  const brideFather = safe(
    pick(r, ["bride_father", "bride_father_name"], null)
  );

  const brideMother = safe(
    pick(r, ["bride_mother", "bride_mother_name"], null)
  );

  const groomDob = pick(r, ["groom_dob", "groom_date_of_birth"], null);
  const brideDob = pick(r, ["bride_dob", "bride_date_of_birth"], null);

  const groomHouse = safe(
    pick(r, ["groom_house_name", "groom_family_name"], null)
  );

  const brideHouse = safe(
    pick(r, ["bride_house_name", "bride_family_name"], null)
  );

  const groomAddress = safe(pick(r, ["groom_address"], null));
  const brideAddress = safe(pick(r, ["bride_address"], null));

  const groomEmail = safe(pick(r, ["groom_email"], null));
  const brideEmail = safe(pick(r, ["bride_email"], null));

  const groomPhone = safe(pick(r, ["groom_phone", "groom_mobile"], null));
  const bridePhone = safe(pick(r, ["bride_phone", "bride_mobile"], null));

  const marriageDate = pick(
    r,
    ["date", "marriage_date", "date_of_marriage", "married_on"],
    null
  );

  const registerNumber = safe(
    pick(r, ["register_number", "reg_no"], null)
  );

  const slNo = safe(
    pick(r, ["id", "sl_no", "serial_number"], null)
  );

  const chiefCelebrant = safe(
    pick(
      r,
      [
        "minister_of_marriage",
        "priest_name",
        "vicar_name",
        "chief_celebrant",
      ],
      null
    )
  );

  const placeOfMarriage = safe(
    pick(r, ["place_of_marriage", "place", "church_name"], null)
  );

  const churchName = safe(
    pick(r, ["church_name", "parish_name", "parish"], null)
  );

  const churchCity = safe(
    pick(r, ["church_city", "city", "place"], null)
  );

  const dioceseName = safe(
    pick(r, ["diocese_name", "diocese"], null)
  );

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  const groomDobT = dobTriplet(groomDob);
  const brideDobT = dobTriplet(brideDob);

  const groomAge = ageBetween(groomDob, marriageDate);
  const brideAge = ageBetween(brideDob, marriageDate);

  return (
    <Box
      ref={printRef}
      id="marriage-report-certificate"
      bg="#FFFFFF"
      boxShadow="0 3px 15px rgba(0,0,0,0.15)"
      mx="auto"
      my={4}
    >
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

        {/* SL.NO + REG NO */}
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

          {/* MAIN DETAILS */}
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
                <td className="val-col">{groomHouse}</td>
                <td className="lbl-col">Parish</td>
                <td className="val-col">{brideHouse}</td>
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
                  {formatLongDate(marriageDate)}
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
                {formatLongDate(marriageDate)}
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
    </Box>
  );
};

// ============================================================
// PAGE
// ============================================================

const MarriageCertificatePage = () => {
  const [printRef, setPrintRef] = useState(null);

  // Inject the A4 certificate CSS once
  useEffect(() => {
    let tag = document.getElementById("marriage-report-cert-styles");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "marriage-report-cert-styles";
      tag.innerHTML = CERTIFICATE_STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  const handlePrint = () => {
    if (!printRef) return;

    const win = window.open("", "_blank", "width=1200,height=1000");
    if (!win) {
      alert("Please allow pop-ups to print the certificate.");
      return;
    }

    const content = printRef.innerHTML;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Marriage Certificate</title>
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

    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 300);
    }, 700);
  };

  const handleDownloadPDF = async () => {
    if (!printRef) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      await html2pdf()
        .set({
          margin: 0,
          filename: `Marriage-Certificate-Report.pdf`,
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
        })
        .from(printRef)
        .save();
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <CertificateShell type="marriage">
      {(r) => (
        <Box>
          {/* ACTION BAR */}
          <Flex
            justify="flex-end"
            align="center"
            gap={2}
            mb={3}
          >
            <HStack gap={3}>
              <Button
                h="36px"
                px={5}
                variant="outline"
                borderColor="#E32626"
                color="#E32626"
                bg="#FFFFFF"
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                onClick={handleDownloadPDF}
                _hover={{ bg: "#FFF5F5" }}
              >
                <LuFileDown size={15} />
                <Text ml="6px">Download PDF</Text>
              </Button>

              <Button
                h="36px"
                px={6}
                bg="#B40000"
                color="#FFFFFF"
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                onClick={handlePrint}
                _hover={{ bg: "#8F0000" }}
              >
                <LuPrinter size={15} />
                <Text ml="6px">Print</Text>
              </Button>
            </HStack>
          </Flex>

          {/* CERTIFICATE */}
          <CertificateBody r={r} printRef={setPrintRef} />
        </Box>
      )}
    </CertificateShell>
  );
};

export default MarriageCertificatePage;