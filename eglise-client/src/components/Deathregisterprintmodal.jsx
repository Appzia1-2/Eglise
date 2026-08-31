import React, {
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  HStack,
  Select,
  Text,
  Dialog,
  Icon,
} from "@chakra-ui/react";

import {
  LuFileDown,
  LuPrinter,
  LuX,
} from "react-icons/lu";

import html2pdf from "html2pdf.js";

// ==========================================================
// LOGO
// ==========================================================

import logoImage from "../assets/priest2.png";

// ==========================================================
// COLORS
// ==========================================================

const PRIMARY_RED = "#B40000";
const DARK_RED = "#8F0000";

const GOLD = "#C99A3D";

const TEXT_COLOR = "#171717";

// ==========================================================
// COMPONENT
// ==========================================================

const DeathRegisterPrintModal = ({
  isOpen,
  onClose,
  death,
}) => {
  const printRef =
    useRef(null);

  const [pageSize, setPageSize] =
    useState("A4");

  const [orientation, setOrientation] =
    useState("Portrait");

  // ========================================================
  // MEMBER DATA
  // ========================================================

  const member =
    death?.member || {};

  const memberName =
    death?.member_name ||
    member?.name ||
    "N/A";

  const familyName =
    death?.family_name ||
    member?.family_name ||
    "N/A";

  const houseName =
    death?.house_name ||
    member?.house_name ||
    member?.house_no ||
    "N/A";

  const address =
    death?.address ||
    death?.address_line1 ||
    member?.address ||
    member?.address_line1 ||
    [
      member?.address_line1,
      member?.address_line2,
      member?.city,
      member?.state,
      member?.country,
      member?.postal_code,
    ]
      .filter(Boolean)
      .join(", ") ||
    "N/A";

  const gender =
    death?.gender ||
    member?.gender ||
    "N/A";

  const dateOfBirth =
    death?.date_of_birth ||
    member?.date_of_birth ||
    null;

  // ========================================================
  // DATE FORMAT
  // ========================================================

  const getDateFormatted = (
    dateString
  ) => {
    if (!dateString) {
      return "N/A";
    }

    try {
      const date =
        new Date(dateString);

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return dateString;
    }
  };

  // ========================================================
  // DATE PARTS
  // ========================================================

  const getDateParts = (
    dateString
  ) => {
    if (!dateString) {
      return {
        day: "--",
        month: "--",
        year: "----",
      };
    }

    try {
      const date =
        new Date(dateString);

      return {
        day: String(
          date.getDate()
        ).padStart(2, "0"),

        month: String(
          date.getMonth() + 1
        ).padStart(2, "0"),

        year: date.getFullYear(),
      };
    } catch {
      return {
        day: "--",
        month: "--",
        year: "----",
      };
    }
  };

  const deathParts =
    getDateParts(
      death?.died_on
    );

  const dobParts =
    getDateParts(
      dateOfBirth
    );

  // ========================================================
  // AGE
  // ========================================================

  const getMemberAge = () => {
    if (
      !dateOfBirth ||
      !death?.died_on
    ) {
      return "N/A";
    }

    try {
      const birthDate =
        new Date(
          dateOfBirth
        );

      const deathDate =
        new Date(
          death.died_on
        );

      let age =
        deathDate.getFullYear() -
        birthDate.getFullYear();

      const monthDifference =
        deathDate.getMonth() -
        birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (
          monthDifference === 0 &&
          deathDate.getDate() <
            birthDate.getDate()
        )
      ) {
        age--;
      }

      return age >= 0
        ? age
        : "N/A";
    } catch {
      return "N/A";
    }
  };

  // ========================================================
  // PRINT
  // ========================================================

  const handlePrint = () => {
    const element =
      printRef.current;

    if (!element) {
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=1000"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the certificate."
      );

      return;
    }

    const content =
      element.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Death/Funeral Certificate -
            ${death?.reg_no || ""}
          </title>

          <style>

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            body {
              font-family:
                Georgia,
                "Times New Roman",
                serif;
            }

            @page {
              size:
                ${pageSize}
                ${
                  orientation ===
                  "Portrait"
                    ? "portrait"
                    : "landscape"
                };

              margin: 0;
            }

            @media print {

              html,
              body {
                width: 100%;
                height: 100%;
              }

              body {
                padding: 0;
              }

              .certificate-page {
                margin: 0 !important;
                box-shadow: none !important;
              }

            }

            .certificate-page {
              width: 210mm;
              height: 297mm;
              min-height: 297mm;

              margin: 0 auto;

              position: relative;

              overflow: hidden;

              background:
                linear-gradient(
                  rgba(255,253,247,0.97),
                  rgba(255,253,247,0.97)
                );

              padding:
                12mm
                13mm;

              font-family:
                Georgia,
                "Times New Roman",
                serif;
            }

            /* ========================================
               BORDERS
            ======================================== */

            .outer-border {
              position: absolute;

              top: 5mm;
              left: 5mm;
              right: 5mm;
              bottom: 5mm;

              border:
                1.5px solid
                #d66b6b;

              pointer-events: none;
            }

            .outer-border::before {
              content: "";

              position: absolute;

              top: 4px;
              left: 4px;
              right: 4px;
              bottom: 4px;

              border:
                1px solid
                #e5aaaa;
            }

            .inner-border {
              position: absolute;

              top: 8mm;
              left: 8mm;
              right: 8mm;
              bottom: 8mm;

              border:
                2px solid
                #a81414;

              pointer-events: none;
            }

            .inner-border::before {
              content: "";

              position: absolute;

              top: 4px;
              left: 4px;
              right: 4px;
              bottom: 4px;

              border:
                1px solid
                #dca248;
            }

            /* ========================================
               CORNER ORNAMENTS
            ======================================== */

            .corner {
              position: absolute;

              z-index: 10;

              color: #c53d3d;

              font-size: 23px;

              line-height: 1;

              width: 30px;
              height: 30px;

              text-align: center;
            }

            .corner.tl {
              top: 6mm;
              left: 6mm;
            }

            .corner.tr {
              top: 6mm;
              right: 6mm;
              transform: scaleX(-1);
            }

            .corner.bl {
              bottom: 6mm;
              left: 6mm;
              transform: scaleY(-1);
            }

            .corner.br {
              bottom: 6mm;
              right: 6mm;
              transform: scale(-1);
            }

            /* ========================================
               TOP HEADER
            ======================================== */

            .header {
              position: relative;

              z-index: 5;

              margin-top: 7mm;

              text-align: center;
            }

            .header-row {
              display: flex;

              align-items: center;

              justify-content: center;

              gap: 14px;
            }

            .logo-box {
              width: 66px;
              height: 66px;

              flex-shrink: 0;

              display: flex;

              align-items: center;

              justify-content: center;
            }

            .logo-image {
              width: 62px;
              height: 62px;

              object-fit: contain;
            }

            .fallback-cross {
              width: 58px;
              height: 58px;

              border:
                2px solid
                #d79a36;

              border-radius: 50%;

              display: flex;

              align-items: center;

              justify-content: center;

              color:
                #a50000;

              font-size: 38px;
            }

            .church-heading {
              text-align: center;
            }

            .church-name {
              color:
                #4a1111;

              font-size:
                29px;

              line-height:
                1.05;

              font-weight:
                700;

              letter-spacing:
                0.2px;
            }

            .church-subtitle {
              color:
                #4a1111;

              font-size:
                21px;

              line-height:
                1.1;

              font-weight:
                700;

              margin-top:
                3px;
            }

            /* ========================================
               TITLE
            ======================================== */

            .title-area {
              position: relative;

              z-index: 5;

              margin-top:
                6mm;

              text-align:
                center;
            }

            .title-banner {
              display:
                inline-block;

              position:
                relative;

              background:
                #a40000;

              color:
                #ffffff;

              border:
                2px solid
                #d6a03d;

              padding:
                6px 38px 7px;

              min-width:
                390px;

              box-shadow:
                inset 0 0 0 1px
                #710000;
            }

            .title-banner::before,
            .title-banner::after {
              content:
                "";

              position:
                absolute;

              top:
                4px;

              width:
                18px;

              height:
                calc(100% - 8px);

              background:
                #a40000;

              border-top:
                2px solid
                #d6a03d;

              border-bottom:
                2px solid
                #d6a03d;
            }

            .title-banner::before {
              left:
                -12px;

              transform:
                skewX(-18deg);
            }

            .title-banner::after {
              right:
                -12px;

              transform:
                skewX(18deg);
            }

            .title-text {
              position:
                relative;

              z-index:
                2;

              font-size:
                24px;

              line-height:
                1.1;

              font-weight:
                700;

              letter-spacing:
                0.3px;
            }

            /* ========================================
               SERIAL NUMBERS
            ======================================== */

            .serial {
              position:
                absolute;

              top:
                46mm;

              z-index:
                8;

              color:
                #171717;

              font-size:
                10px;

              font-weight:
                600;

              writing-mode:
                vertical-rl;

              transform:
                rotate(180deg);

              letter-spacing:
                0.5px;
            }

            .serial.left {
              left:
                10mm;
            }

            .serial.right {
              right:
                10mm;
            }

            .serial-value {
              margin-top:
                4px;

              font-size:
                12px;

              font-weight:
                700;
            }

            /* ========================================
               CONTENT
            ======================================== */

            .content {
              position:
                relative;

              z-index:
                4;

              margin:
                7mm 10mm 0;
            }

            /* ========================================
               DIOCESE/PARISH
            ======================================== */

            .top-table {
              width:
                88%;

              margin:
                0 auto 4mm;

              border-collapse:
                collapse;

              font-size:
                13px;
            }

            .top-table td {
              border:
                1px solid
                #cbb9a8;

              padding:
                6px 9px;
            }

            .top-label {
              width:
                95px;

              font-weight:
                700;
            }

            .top-value {
              font-weight:
                500;
            }

            /* ========================================
               MAIN DETAILS TABLE
            ======================================== */

            .details-table {
              width:
                100%;

              border-collapse:
                collapse;

              font-size:
                13px;
            }

            .details-table td {
              border:
                1px solid
                #c7b8aa;

              padding:
                7px 8px;

              vertical-align:
                middle;
            }

            .details-label {
              width:
                160px;

              font-weight:
                700;

              color:
                #171717;
            }

            .details-value {
              color:
                #171717;

              font-weight:
                500;
            }

            .name-row td {
              height:
                38px;
            }

            .age-row td {
              height:
                38px;
            }

            .address-row td {
              height:
                78px;
            }

            .date-row td {
              height:
                37px;
            }

            .age-number {
              width:
                55px;

              text-align:
                center;
            }

            .sex-cell {
              width:
                115px;
            }

            /* ========================================
               WATERMARK
            ======================================== */

            .watermark {
              position:
                absolute;

              left:
                50%;

              top:
                57%;

              transform:
                translate(
                  -50%,
                  -50%
                );

              width:
                220px;

              height:
                220px;

              border:
                2px solid
                rgba(
                  155,
                  30,
                  30,
                  0.055
                );

              border-radius:
                50%;

              display:
                flex;

              align-items:
                center;

              justify-content:
                center;

              z-index:
                1;

              pointer-events:
                none;
            }

            .watermark::before {
              content:
                "✠";

              font-size:
                155px;

              color:
                rgba(
                  155,
                  30,
                  30,
                  0.045
                );
            }

            .watermark-text {
              position:
                absolute;

              bottom:
                31px;

              font-size:
                9px;

              color:
                rgba(
                  155,
                  30,
                  30,
                  0.055
                );

              letter-spacing:
                1.5px;
            }

            /* ========================================
               CERTIFICATION
            ======================================== */

            .certificate-text {
              position:
                relative;

              z-index:
                4;

              text-align:
                center;

              margin:
                4mm 12mm 5mm;

              font-size:
                13px;

              line-height:
                1.5;

              color:
                #171717;
            }

            /* ========================================
               FOOTER
            ======================================== */

            .footer {
              position:
                relative;

              z-index:
                5;

              margin:
                0 10mm;
            }

            .footer-grid {
              display:
                grid;

              grid-template-columns:
                1fr 1fr 1fr;

              gap:
                16px;

              align-items:
                end;
            }

            .footer-item {
              font-size:
                12px;

              color:
                #171717;
            }

            .footer-center {
              text-align:
                center;
            }

            .footer-right {
              text-align:
                right;
            }

            .signature-line {
              width:
                90%;

              margin:
                0 auto 7px;

              border-top:
                1px solid
                #222222;

              height:
                18px;
            }

            .footer-label {
              font-size:
                11px;

              font-weight:
                600;
            }

            .footer-date {
              margin-top:
                7px;

              font-size:
                12px;
            }

            .bottom-decoration {
              margin-top:
                3mm;

              text-align:
                center;

              color:
                #b72d2d;

              font-size:
                15px;

              letter-spacing:
                5px;
            }

          </style>

        </head>

        <body>

          ${content}

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();

      setTimeout(() => {
        printWindow.close();
      }, 300);
    }, 700);
  };

  // ========================================================
  // DOWNLOAD PDF
  // ========================================================

  const handleDownloadPDF =
    async () => {
      const element =
        printRef.current;

      if (!element) {
        return;
      }

      const fileName =
        `Death-Funeral-Certificate-${
          death?.reg_no ||
          death?.id ||
          "Record"
        }.pdf`;

      const options = {
        margin: 0,

        filename:
          fileName,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 3,

          useCORS: true,

          backgroundColor:
            "#ffffff",

          logging: false,

          allowTaint: true,
        },

        jsPDF: {
          orientation:
            orientation ===
            "Portrait"
              ? "p"
              : "l",

          unit: "mm",

          format:
            pageSize,

          compress: true,
        },

        pagebreak: {
          mode: [
            "avoid-all",
            "css",
            "legacy",
          ],
        },
      };

      try {
        await html2pdf()
          .set(options)
          .from(element)
          .save();
      } catch (error) {
        console.error(
          "PDF generation error:",
          error
        );

        alert(
          "Failed to generate PDF. Please try again."
        );
      }
    };

  // ========================================================
  // CERTIFICATE
  // ========================================================

  const renderCertificate =
    () => {
      return (
        <div className="certificate-page">

          {/* ==========================================
              BORDERS
          ========================================== */}

          <div className="outer-border" />

          <div className="inner-border" />

          {/* ==========================================
              CORNERS
          ========================================== */}

          <div className="corner tl">
            ❧
          </div>

          <div className="corner tr">
            ❧
          </div>

          <div className="corner bl">
            ❧
          </div>

          <div className="corner br">
            ❧
          </div>

          {/* ==========================================
              SERIAL NUMBERS
          ========================================== */}

          <div className="serial left">

            <span>
              Sl. No.
            </span>

            <span className="serial-value">
              {death?.serial_no ||
                death?.sl_no ||
                death?.id ||
                "N/A"}
            </span>

          </div>

          <div className="serial right">

            <span>
              Reg. No.
            </span>

            <span className="serial-value">
              {death?.reg_no ||
                "N/A"}
            </span>

          </div>

          {/* ==========================================
              HEADER
          ========================================== */}

          <div className="header">

            <div className="header-row">

              <div className="logo-box">

                {logoImage ? (
                  <img
                    src={logoImage}
                    alt="Church"
                    className="logo-image"
                  />
                ) : (
                  <div className="fallback-cross">
                    ✠
                  </div>
                )}

              </div>

              <div className="church-heading">

                <div className="church-name">
                  Malankara Orthodox
                </div>

                <div className="church-subtitle">
                  Syrian Church
                </div>

              </div>

            </div>

          </div>

          {/* ==========================================
              TITLE
          ========================================== */}

          <div className="title-area">

            <div className="title-banner">

              <div className="title-text">
                Death/Funeral Certificate
              </div>

            </div>

          </div>

          {/* ==========================================
              CONTENT
          ========================================== */}

          <div className="content">

            {/* DIOCESE / PARISH */}

            <table className="top-table">

              <tbody>

                <tr>

                  <td className="top-label">
                    Diocese
                  </td>

                  <td className="top-value">
                    {death?.diocese ||
                      "Diocese of Sulthan Bathery"}
                  </td>

                </tr>

                <tr>

                  <td className="top-label">
                    Parish
                  </td>

                  <td className="top-value">
                    {death?.parish ||
                      "St. George Orthodox Church, Bathery"}
                  </td>

                </tr>

              </tbody>

            </table>

            {/* ========================================
                WATERMARK
            ======================================== */}

            <div className="watermark">

              <div className="watermark-text">
                MALANKARA ORTHODOX SYRIAN CHURCH
              </div>

            </div>

            {/* ========================================
                DETAILS TABLE
            ======================================== */}

            <table className="details-table">

              <tbody>

                {/* NAME */}

                <tr className="name-row">

                  <td className="details-label">
                    Name
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {memberName}
                  </td>

                </tr>

                {/* AGE / DOB / SEX */}

                <tr className="age-row">

                  <td className="details-label">
                    Age, Date of Birth
                  </td>

                  <td className="age-number">
                    {getMemberAge()}
                  </td>

                  <td className="age-number">
                    {dobParts.day}
                  </td>

                  <td className="age-number">
                    {dobParts.month}
                  </td>

                  <td className="sex-cell">

                    <strong>
                      Sex :
                    </strong>

                    {" "}

                    {gender}

                  </td>

                </tr>

                {/* ADDRESS */}

                <tr className="address-row">

                  <td className="details-label">
                    Address
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {address}
                  </td>

                </tr>

                {/* HOUSE */}

                <tr>

                  <td className="details-label">
                    House No. in the Church Register
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {houseName}
                  </td>

                </tr>

                {/* DATE OF DEATH */}

                <tr className="date-row">

                  <td className="details-label">
                    Date of Death
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {getDateFormatted(
                      death?.died_on
                    )}
                  </td>

                </tr>

                {/* DATE OF FUNERAL */}

                <tr className="date-row">

                  <td className="details-label">
                    Date of Funeral
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {getDateFormatted(
                      death?.funeral_on
                    )}
                  </td>

                </tr>

                {/* CHIEF CELEBRANT */}

                <tr className="date-row">

                  <td className="details-label">
                    Chief Celebrant
                  </td>

                  <td
                    className="details-value"
                    colSpan="4"
                  >
                    {death?.chief_celebrant ||
                      "Rev. Fr. Thomas Mathew"}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          {/* ==========================================
              CERTIFICATION
          ========================================== */}

          <div className="certificate-text">

            I do hereby certify that the
            above is a true copy of an
            entry in the

            <br />

            Funeral Register maintained
            at this Parish.

          </div>

          {/* ==========================================
              FOOTER
          ========================================== */}

          <div className="footer">

            <div className="footer-grid">

              {/* PLACE / DATE */}

              <div className="footer-item">

                <strong>
                  Place :
                </strong>

                {" "}

                {death?.place ||
                  "Sulthan Bathery"}

                <div className="footer-date">

                  <strong>
                    Date :
                  </strong>

                  {" "}

                  {getDateFormatted(
                    death?.funeral_on ||
                    death?.died_on
                  )}

                </div>

              </div>

              {/* SEAL */}

              <div className="footer-item footer-center">

                <div className="signature-line" />

                <div className="footer-label">
                  SEAL
                </div>

              </div>

              {/* VICAR */}

              <div className="footer-item footer-right">

                <div className="signature-line" />

                <div className="footer-label">
                  Name and Signature of Vicar
                </div>

              </div>

            </div>

            <div className="bottom-decoration">
              ❧ ❧ ❧ ❧ ❧
            </div>

          </div>

        </div>
      );
    };

  // ========================================================
  // MODAL
  // ========================================================

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      size="full"
      placement="center"
    >

      <Dialog.Backdrop />

      <Dialog.Content
        maxW="100vw"
        maxH="100vh"
        h="100vh"
        m={0}
        borderRadius="0"
        overflow="hidden"
        bg="#F1EFEF"
      >

        {/* ==========================================
            TOP TOOLBAR
        ========================================== */}

        <Box
          h="58px"
          bg="#FFFFFF"
          borderBottom="1px solid #E5E5E5"
          px={{
            base: 4,
            md: 7,
          }}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >

          {/* TITLE */}

          <Text
            fontSize={{
              base: "17px",
              md: "20px",
            }}
            fontWeight="700"
            color="#182338"
          >
            Print Preview
          </Text>

          {/* CONTROLS */}

          <HStack
            gap={{
              base: 2,
              md: 3,
            }}
          >

            {/* A4 */}

            <Select
              value={pageSize}
              onChange={(event) =>
                setPageSize(
                  event.target.value
                )
              }
              size="sm"
              w={{
                base: "82px",
                md: "108px",
              }}
              h="38px"
              border="1px solid #CAD5E2"
              borderRadius="5px"
              bg="#FFFFFF"
              fontSize="13px"
            >
              <option value="A4">
                A4
              </option>

              <option value="A3">
                A3
              </option>

              <option value="Letter">
                Letter
              </option>
            </Select>

            {/* ORIENTATION */}

            <Select
              value={orientation}
              onChange={(event) =>
                setOrientation(
                  event.target.value
                )
              }
              size="sm"
              w={{
                base: "100px",
                md: "128px",
              }}
              h="38px"
              border="1px solid #CAD5E2"
              borderRadius="5px"
              bg="#FFFFFF"
              fontSize="13px"
            >
              <option value="Portrait">
                Portrait
              </option>

              <option value="Landscape">
                Landscape
              </option>
            </Select>

            {/* CLOSE */}

            <Button
              h="38px"
              minW={{
                base: "70px",
                md: "94px",
              }}
              variant="outline"
              borderColor="#263B73"
              color="#182A5A"
              bg="#FFFFFF"
              fontSize="13px"
              onClick={onClose}
            >
              Close
            </Button>

            {/* DOWNLOAD PDF */}

            <Button
              h="38px"
              px={5}
              variant="outline"
              borderColor="#E32626"
              color="#E32626"
              bg="#FFFFFF"
              fontSize="13px"
              fontWeight="600"
              onClick={
                handleDownloadPDF
              }
            >
              <Icon
                as={LuFileDown}
                mr="7px"
              />

              Download PDF
            </Button>

            {/* PRINT */}

            <Button
              h="38px"
              px={6}
              bg={PRIMARY_RED}
              color="#FFFFFF"
              fontSize="13px"
              fontWeight="600"
              onClick={handlePrint}
              _hover={{
                bg: DARK_RED,
              }}
            >
              <Icon
                as={LuPrinter}
                mr="7px"
              />

              Print
            </Button>

          </HStack>

        </Box>

        {/* ==========================================
            PREVIEW AREA
        ========================================== */}

        <Box
          flex="1"
          overflow="auto"
          bg="#F1EFEF"
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          p={{
            base: 3,
            md: 5,
          }}
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

    </Dialog.Root>
  );
};

export default DeathRegisterPrintModal;