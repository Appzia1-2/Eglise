import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuBookOpen,
  LuCalendarDays,
  LuFileDown,
  LuInfo,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPrinter,
  LuUser,
  LuUsers,
  LuMail,
  LuGraduationCap,
  LuBriefcaseBusiness,
  LuArrowLeftRight,
  LuHouse,
  LuMedal,
  LuX,
} from "react-icons/lu";

import {
  getMember,
  listFamilies,
  listGrades,
  listWards,
  listMembersByHead,
  listRelationships,
} from "../api/registryServices";
import logo from "../assets/logo.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   COLORS
============================================================ */

const RED = "#B40000";
const RED_DARK = "#970000";

const NAVY = "#14245B";
const NAVY_LIGHT = "#26396C";

const TEXT = "#26345A";
const MUTED = "#68758F";

const BORDER = "#DDE5F0";
const PAGE_BG = "#FFFFFF";

/* ============================================================
   HELPERS
============================================================ */

const getArrayData = (response) => {
  const data = response?.data ?? response ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getObjectName = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return (
      value.name ||
      value.label ||
      value.title ||
      value.family_name ||
      value.ward_name ||
      ""
    );
  }

  return String(value);
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAge = (dob) => {
  if (!dob) return "—";

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return "—";
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const month =
    today.getMonth() -
    birthDate.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : "—";
};

const getInitials = (name) => {
  if (!name) return "FH";

  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/* ============================================================
   INFO ROW
============================================================ */

const InfoRow = ({
  icon,
  label,
  value,
  width = "170px",
}) => {
  return (
    <Flex
      align="center"
      gap="10px"
      minW="0"
    >
      {icon && (
        <Box
          color={RED}
          flexShrink="0"
        >
          {icon}
        </Box>
      )}

      <Text
        fontSize="11px"
        color={TEXT}
        minW={width}
        flexShrink="0"
      >
        {label}
      </Text>

      <Text
        fontSize="11px"
        color={NAVY}
        fontWeight="500"
        minW="0"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {value || "—"}
      </Text>
    </Flex>
  );
};

/* ============================================================
   SECTION CARD
============================================================ */

const SectionCard = ({
  title,
  icon,
  children,
}) => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="7px"
      px={{ base: "14px", md: "18px" }}
      py="12px"
      width="100%"
    >
      <Flex
        align="center"
        gap="9px"
        mb="8px"
      >
        <Box color={RED}>
          {icon}
        </Box>

        <Text
          color={NAVY}
          fontSize="16px"
          fontWeight="700"
        >
          {title}
        </Text>
      </Flex>

      {children}
    </Box>
  );
};

/* ============================================================
   PRINT PREVIEW
============================================================ */

const PrintPreview = ({
  head,
  familyName,
  wardName,
  gradeName,
  memberSince,
  address,
  members,
  getRelationship,
  getMemberPhone,
  getAge,
  getInitials,
  formatDate,
  onClose,
}) => {
  const [paperSize, setPaperSize] =
    useState("A4");

  const [orientation, setOrientation] =
    useState("portrait");

  useEffect(() => {
    document.body.classList.add(
      "print-preview-open"
    );

    return () => {
      document.body.classList.remove(
        "print-preview-open"
      );
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Box
      position="fixed"
      inset="0"
      zIndex="9999"
      bg="#EEF0F3"
      overflow="auto"
    >
      {/* ======================================================
          PREVIEW TOOLBAR
      ====================================================== */}

      <Flex
        className="print-preview-toolbar"
        position="sticky"
        top="0"
        zIndex="100"
        bg="white"
        borderBottom="1px solid #D8DEE8"
        minH="62px"
        px={{
          base: "14px",
          md: "28px",
        }}
        align="center"
        justify="space-between"
        gap="15px"
        flexWrap="wrap"
      >
        <Text
          color={NAVY}
          fontSize="20px"
          fontWeight="800"
        >
          Print Preview
        </Text>

        <HStack
          gap="10px"
          flexWrap="wrap"
        >
          {/* PAPER SIZE */}

          <select
            value={paperSize}
            onChange={(e) =>
              setPaperSize(e.target.value)
            }
            className="print-control"
          >
            <option value="A4">
              A4
            </option>

            <option value="A3">
              A3
            </option>

            <option value="A5">
              A5
            </option>

            <option value="Letter">
              Letter
            </option>

            <option value="Legal">
              Legal
            </option>
          </select>

          {/* ORIENTATION */}

          <select
            value={orientation}
            onChange={(e) =>
              setOrientation(
                e.target.value
              )
            }
            className="print-control"
          >
            <option value="portrait">
              Portrait
            </option>

            <option value="landscape">
              Landscape
            </option>
          </select>

          {/* CLOSE */}

          <Button
            h="38px"
            px="20px"
            bg="white"
            color={NAVY}
            border="1px solid #BFC8D8"
            borderRadius="5px"
            fontSize="12px"
            onClick={onClose}
          >
            <LuX size={16} />

            <Text ml="6px">
              Close
            </Text>
          </Button>

          {/* DOWNLOAD PDF */}

          <Button
            h="38px"
            px="20px"
            bg="white"
            color={RED}
            border="1px solid"
            borderColor={RED}
            borderRadius="5px"
            fontSize="12px"
            onClick={
              handleDownloadPDF
            }
          >
            <LuFileDown size={17} />

            <Text ml="6px">
              Download PDF
            </Text>
          </Button>

          {/* PRINT */}

          <Button
            h="38px"
            px="22px"
            bg={RED}
            color="white"
            borderRadius="5px"
            fontSize="12px"
            fontWeight="600"
            onClick={handlePrint}
            _hover={{
              bg: RED_DARK,
            }}
          >
            <LuPrinter size={17} />

            <Text ml="6px">
              Print
            </Text>
          </Button>
        </HStack>
      </Flex>

      {/* ======================================================
          PAPER AREA
      ====================================================== */}

      <Box
        className="print-preview-background"
        py={{
          base: "20px",
          md: "32px",
        }}
        px="15px"
      >
        <Box
          className={`print-paper print-${paperSize.toLowerCase()} print-${orientation}`}
        >
          {/* ==================================================
              PRINT HEADER
          ================================================== */}

          <Flex
            className="print-header"
            justify="space-between"
            align="flex-start"
          >
            {/* LOGO */}

            <Box
  className="print-logo"
  display="flex"
  alignItems="center"
>
  <img
    src={logo}
    alt="Eglise"
    style={{
      width: "150px",
      height: "auto",
      objectFit: "contain",
      display: "block",
    }}
  />
</Box>

            {/* PROFILE TITLE */}

            <Box
              className="print-profile-title"
              textAlign="right"
            >
              <Text>
                FAMILY HEAD PROFILE
              </Text>
            </Box>
          </Flex>

          {/* ==================================================
              PROFILE
          ================================================== */}

          <Flex
            className="print-profile"
            align="center"
            gap="20px"
          >
            {/* IMAGE */}

            <Box
              className="print-profile-image"
            >
              {(
                head?.family_image ||
                head?.image ||
                head?.photo ||
                head?.image_url
              ) ? (
                <img
                  src={
                    head?.family_image ||
                    head?.image ||
                    head?.photo ||
                    head?.image_url
                  }
                  alt={
                    head?.name ||
                    "Family Head"
                  }
                />
              ) : (
                <Box className="print-avatar">
                  {getInitials(
                    head?.name
                  )}
                </Box>
              )}
            </Box>

            {/* NAME */}

            <Box
              className="print-profile-details"
              flex="1"
            >
              <Text className="print-head-name">
                {head?.name ||
                  "Family Head"}
              </Text>

              <Flex
                className="print-family-house"
                align="center"
                gap="8px"
              >
                <span>
                  {familyName}
                </span>

                <span>
                  •
                </span>

                <span>
                  {head?.house_name ||
                    "—"}
                </span>
              </Flex>

              {/* STATUS */}

              <Box className="print-active">
                <span className="active-dot"></span>

                {head?.is_active
                  ? "Active"
                  : "Inactive"}
              </Box>

              {/* SUMMARY */}

              <Flex
                className="print-summary"
              >
                <Box>
                  <strong>
                    Ward
                  </strong>

                  <span>
                    {wardName}
                  </span>
                </Box>

                <Box>
                  <strong>
                    Grade
                  </strong>

                  <span>
                    {gradeName}
                  </span>
                </Box>

                <Box>
                  <strong>
                    Member Since
                  </strong>

                  <span>
                    {memberSince
                      ? formatDate(
                          memberSince
                        )
                      : "—"}
                  </span>
                </Box>
              </Flex>
            </Box>
          </Flex>

          {/* ==================================================
              SECTION 1
          ================================================== */}

          <div className="print-section">
            <div className="print-section-title">
              1. Personal &amp; Contact Information
            </div>

            <Grid
              className="print-info-grid"
              templateColumns="1fr 1fr"
              gap="0 45px"
            >
              <Box>
                <PrintRow
                  label="Baptism Name"
                  value={
                    head?.baptismal_name ||
                    head?.baptism_name
                  }
                />

                <PrintRow
                  label="Gender"
                  value={head?.gender}
                />

                <PrintRow
                  label="Date of Birth"
                  value={
                    head?.dob
                      ? formatDate(
                          head.dob
                        )
                      : "—"
                  }
                />

                <PrintRow
                  label="Age"
                  value={
                    head?.age ??
                    getAge(head?.dob) !==
                      "—"
                      ? `${
                          head?.age ??
                          getAge(
                            head?.dob
                          )
                        } Years`
                      : "—"
                  }
                />

                <PrintRow
                  label="Blood Group"
                  value={
                    head?.blood_group
                  }
                />

                <PrintRow
                  label="Marital Status"
                  value={
                    head?.marital_status
                  }
                />
              </Box>

              <Box>
                <PrintRow
                  label="Spouse Name"
                  value={
                    head?.spouse_name
                  }
                />

                <PrintRow
                  label="Father Name"
                  value={
                    head?.father_name
                  }
                />

                <PrintRow
                  label="Mother Name"
                  value={
                    head?.mother_name
                  }
                />

                <PrintRow
                  label="Email"
                  value={head?.email}
                />

                <PrintRow
                  label="Mobile Number"
                  value={
                    head?.mobile_no ||
                    head?.phone_number ||
                    head?.mobile
                  }
                />

                <PrintRow
                  label="Phone Number"
                  value={
                    head?.phone_no ||
                    "—"
                  }
                />
              </Box>
            </Grid>
          </div>

          {/* ==================================================
              SECTION 2
          ================================================== */}

          <div className="print-section">
            <div className="print-section-title">
              2. Address
            </div>

            <Text className="print-address">
              {address || "—"}
            </Text>
          </div>

          {/* ==================================================
              SECTION 3
          ================================================== */}

          <div className="print-section">
            <div className="print-section-title">
              3. Sacraments, Education &amp; Parish Membership
            </div>

            <Grid
              className="print-info-grid"
              templateColumns="1fr 1fr"
              gap="0 45px"
            >
              <Box>
                <PrintRow
                  label="Date of Baptism"
                  value={
                    head?.date_of_baptism
                      ? formatDate(
                          head.date_of_baptism
                        )
                      : "—"
                  }
                />

                <PrintRow
                  label="Parish of Baptism"
                  value={
                    head?.parish_of_baptism
                  }
                />

                <PrintRow
                  label="Educational Qualification"
                  value={
                    head?.educational_qualification
                  }
                />

                <PrintRow
                  label="Sunday School Qualification"
                  value={
                    head?.sunday_school_qualification
                  }
                />
              </Box>

              <Box>
                <PrintRow
                  label="Profession"
                  value={
                    head?.profession
                  }
                />

                <PrintRow
                  label="Joining Date"
                  value={
                    head?.joining_date
                      ? formatDate(
                          head.joining_date
                        )
                      : "—"
                  }
                />

                <PrintRow
                  label="Transferred From"
                  value={
                    head?.transferred_from
                  }
                />

                <PrintRow
                  label="Status"
                  value={
                    head?.is_active
                      ? "Active"
                      : "Inactive"
                  }
                />
              </Box>
            </Grid>
          </div>

          {/* ==================================================
              SECTION 4 DEPENDENTS
          ================================================== */}

          <div className="print-section">
            <div className="print-section-title">
              4. Dependents ({members.length})
            </div>

            {members.length === 0 ? (
              <Text
                className="print-empty"
              >
                No dependent records
                found.
              </Text>
            ) : (
              <table className="print-dependent-table">
                <thead>
                  <tr>
                    <th>
                      Name
                    </th>

                    <th>
                      Relationship
                    </th>

                    <th>
                      Age
                    </th>

                    <th>
                      Mobile Number
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {members.map(
                    (
                      member,
                      index
                    ) => {
                      const memberName =
                        member?.name ||
                        "Unnamed";

                      const age =
                        member?.age ??
                        getAge(
                          member?.dob
                        );

                      const phone =
                        getMemberPhone(
                          member
                        );

                      return (
                        <tr
                          key={
                            member?.id ||
                            index
                          }
                        >
                          <td>
                            {memberName}
                          </td>

                          <td>
                            {getRelationship(
                              member
                            )}
                          </td>

                          <td>
                            {age !==
                            "—"
                              ? `${age} Years`
                              : "—"}
                          </td>

                          <td>
                            {phone}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <Flex
            className="print-document-footer"
            justify="space-between"
            align="center"
          >
            <Text>
              Generated on{" "}
              {formatDate(
                new Date()
              )}{" "}
              &nbsp; • &nbsp; Eglise Parish
              Solution for Church
              Management
            </Text>

            <Text>
              Page 1 of 1
            </Text>
          </Flex>
        </Box>
      </Box>

      {/* ======================================================
          PRINT CSS
      ====================================================== */}

      <style>
        {`
          body.print-preview-open {
            overflow: hidden;
          }

          .print-control {
            height: 38px;
            min-width: 110px;
            padding: 0 12px;
            border: 1px solid #BFC8D8;
            border-radius: 5px;
            background: #FFFFFF;
            color: #26345A;
            font-size: 12px;
            outline: none;
          }

          .print-control:focus {
            border-color: #B40000;
          }

          .print-preview-background {
            min-height: calc(100vh - 62px);
          }

          .print-paper {
            background: white;
            margin: 0 auto;
            padding: 24px 32px;
            box-sizing: border-box;
            box-shadow:
              0 2px 12px rgba(0, 0, 0, 0.16);

            color: #26345A;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          /* -----------------------------------------------
             PAPER SIZES
          ------------------------------------------------ */

          .print-a4 {
            width: 794px;
            min-height: 1123px;
          }

          .print-a3 {
            width: 1123px;
            min-height: 1587px;
          }

          .print-a5 {
            width: 559px;
            min-height: 794px;
          }

          .print-letter {
            width: 816px;
            min-height: 1056px;
          }

          .print-legal {
            width: 816px;
            min-height: 1344px;
          }

          /* -----------------------------------------------
             LANDSCAPE PREVIEW
          ------------------------------------------------ */

          .print-a4.print-landscape {
            width: 1123px;
            min-height: 794px;
          }

          .print-a3.print-landscape {
            width: 1587px;
            min-height: 1123px;
          }

          .print-a5.print-landscape {
            width: 794px;
            min-height: 559px;
          }

          .print-letter.print-landscape {
            width: 1056px;
            min-height: 816px;
          }

          .print-legal.print-landscape {
            width: 1344px;
            min-height: 816px;
          }

          /* -----------------------------------------------
             HEADER
          ------------------------------------------------ */

          .print-header {
            padding-bottom: 12px;
            border-bottom: 2px solid #B40000;
          }

          .print-logo img {
            width: 145px;
            height: auto;
            display: block;
          }

          .print-profile-title {
            padding-top: 7px;
          }

          .print-profile-title > p,
          .print-profile-title {
            color: #14245B;
          }

          .print-profile-title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.2px;
          }

          /* -----------------------------------------------
             PROFILE
          ------------------------------------------------ */

          .print-profile {
            padding: 13px 0;
            border-bottom: 1px solid #D7DCE5;
          }

          .print-profile-image img,
          .print-avatar {
            width: 105px;
            height: 105px;
            border-radius: 50%;
            object-fit: cover;
          }

          .print-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #EEF2F7;
            color: #14245B;
            font-size: 25px;
            font-weight: 800;
          }

          .print-head-name {
            margin: 0;
            color: #14245B;
            font-size: 25px;
            line-height: 1.15;
            font-weight: 800;
          }

          .print-family-house {
            margin-top: 4px;
            margin-bottom: 6px;
            color: #26345A;
            font-size: 13px;
            font-weight: 500;
          }

          .print-active {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 9px;
            border: 1px solid #B9E7C4;
            border-radius: 4px;
            background: #E9F8ED;
            color: #25813B;
            font-size: 11px;
            font-weight: 700;
          }

          .active-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16A34A;
            display: inline-block;
          }

          .print-summary {
            margin-top: 9px;
          }

          .print-summary > div {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 18px;
            border-right: 1px solid #D7DCE5;
          }

          .print-summary > div:first-child {
            padding-left: 0;
          }

          .print-summary > div:last-child {
            border-right: none;
          }

          .print-summary strong {
            color: #14245B;
            font-size: 11px;
            font-weight: 800;
          }

          .print-summary span {
            color: #26345A;
            font-size: 11px;
          }

          /* -----------------------------------------------
             SECTIONS
          ------------------------------------------------ */

          .print-section {
            padding-top: 11px;
          }

          .print-section-title {
            margin-bottom: 7px;
            padding-bottom: 5px;
            border-bottom: 1px solid #D7DCE5;

            color: #14245B;
            font-size: 15px;
            line-height: 1.3;
            font-weight: 800;
          }

          .print-info-grid {
            margin-top: 4px;
          }

          .print-row {
            display: grid;
            grid-template-columns: 175px 1fr;
            gap: 8px;
            min-height: 22px;
            align-items: start;
            font-size: 12px;
            line-height: 1.35;
          }

          .print-row-label {
            color: #14245B;
            font-weight: 800;
          }

          .print-row-value {
            color: #26345A;
            font-weight: 500;
          }

          .print-address {
            margin: 0;
            color: #26345A;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
          }

          /* -----------------------------------------------
             DEPENDENTS
          ------------------------------------------------ */

          .print-dependent-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            table-layout: fixed;
          }

          .print-dependent-table th {
            padding: 7px 9px;
            border: 1px solid #BFC7D4;
            background: #FAFAFA;

            color: #14245B;
            text-align: left;
            font-size: 12px;
            font-weight: 800;
          }

          .print-dependent-table td {
            padding: 7px 9px;
            border: 1px solid #BFC7D4;

            color: #26345A;
            font-size: 12px;
            font-weight: 500;
          }

          .print-empty {
            color: #68758F;
            font-size: 12px;
          }

          /* -----------------------------------------------
             FOOTER
          ------------------------------------------------ */

          .print-document-footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #D7DCE5;
          }

          .print-document-footer p {
            margin: 0;
            color: #68758F;
            font-size: 9px;
          }

          /* -----------------------------------------------
             LANDSCAPE
          ------------------------------------------------ */

          .print-landscape .print-info-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .print-landscape .print-row {
            grid-template-columns: 190px 1fr;
          }

          .print-landscape .print-section-title {
            font-size: 16px;
          }

          .print-landscape .print-row,
          .print-landscape .print-address,
          .print-landscape .print-dependent-table td,
          .print-landscape .print-dependent-table th {
            font-size: 13px;
          }

          /* -----------------------------------------------
             A3
          ------------------------------------------------ */

          .print-a3 .print-section-title {
            font-size: 18px;
          }

          .print-a3 .print-row {
            font-size: 14px;
            grid-template-columns: 210px 1fr;
            min-height: 25px;
          }

          .print-a3 .print-address {
            font-size: 14px;
          }

          .print-a3 .print-dependent-table td,
          .print-a3 .print-dependent-table th {
            font-size: 14px;
            padding: 9px 10px;
          }

          /* -----------------------------------------------
             SMALL PAPER
          ------------------------------------------------ */

          .print-a5 {
            padding: 18px 22px;
          }

          .print-a5 .print-logo img {
            width: 115px;
          }

          .print-a5 .print-profile-image img,
          .print-a5 .print-avatar {
            width: 75px;
            height: 75px;
          }

          .print-a5 .print-head-name {
            font-size: 19px;
          }

          .print-a5 .print-section-title {
            font-size: 12px;
          }

          .print-a5 .print-row {
            grid-template-columns: 120px 1fr;
            font-size: 9px;
            min-height: 18px;
          }

          .print-a5 .print-address {
            font-size: 9px;
          }

          .print-a5 .print-dependent-table td,
          .print-a5 .print-dependent-table th {
            font-size: 9px;
            padding: 5px;
          }

          /* -----------------------------------------------
             PRINT MEDIA
          ------------------------------------------------ */

          @media print {
            @page {
              margin: 10mm;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            .print-paper,
            .print-paper * {
              visibility: visible;
            }

            .print-paper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }

            .print-preview-toolbar,
            .print-preview-background {
              background: white !important;
            }

            .print-preview-toolbar {
              display: none !important;
            }

            .print-preview-background {
              padding: 0 !important;
              min-height: 0 !important;
            }

            .print-section {
              break-inside: avoid;
            }

            .print-dependent-table {
              break-inside: auto;
            }

            .print-dependent-table tr {
              break-inside: avoid;
              break-after: auto;
            }
          }
        `}
      </style>
    </Box>
  );
};

/* ============================================================
   PRINT ROW
============================================================ */

const PrintRow = ({
  label,
  value,
}) => {
  return (
    <div className="print-row">
      <span className="print-row-label">
        {label}
      </span>

      <span className="print-row-value">
        {value || "—"}
      </span>
    </div>
  );
};

/* ============================================================
   MAIN PAGE
============================================================ */

const FamilyHeadDetailsPage = () => {
  const { headId } = useParams();
  const navigate = useNavigate();

  const [head, setHead] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [
    relationships,
    setRelationships,
  ] = useState([]);

  const [wards, setWards] =
    useState([]);

  const [grades, setGrades] =
    useState([]);

  const [families, setFamilies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    showPrintPreview,
    setShowPrintPreview,
  ] = useState(false);

  /* ==========================================================
     FETCH
  ========================================================== */

  useEffect(() => {
    fetchData();
  }, [headId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        headResponse,
        membersResponse,
        relationshipsResponse,
        wardsResponse,
        gradesResponse,
        familiesResponse,
      ] = await Promise.all([
        getMember(headId),
        listMembersByHead(headId),
        listRelationships(),
        listWards(),
        listGrades(),
        listFamilies(),
      ]);

      setHead(
        headResponse?.data ||
          headResponse ||
          null
      );

      setMembers(
        getArrayData(
          membersResponse
        )
      );

      setRelationships(
        getArrayData(
          relationshipsResponse
        )
      );

      setWards(
        getArrayData(wardsResponse)
      );

      setGrades(
        getArrayData(gradesResponse)
      );

      setFamilies(
        getArrayData(
          familiesResponse
        )
      );
    } catch (error) {
      console.error(
        "Error fetching family head:",
        error
      );

      window.alert(
        "Failed to load family head details."
      );

      navigate("/family-heads");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RELATED DATA
  ========================================================== */

  const family = useMemo(() => {
    if (!head) return null;

    const familyId =
      typeof head.family === "object"
        ? head.family?.id
        : head.family;

    return (
      families.find(
        (item) =>
          String(item.id) ===
          String(familyId)
      ) || null
    );
  }, [head, families]);

  const ward = useMemo(() => {
    if (!head) return null;

    const wardId =
      typeof head.ward === "object"
        ? head.ward?.id
        : head.ward;

    return (
      wards.find(
        (item) =>
          String(item.id) ===
          String(wardId)
      ) || null
    );
  }, [head, wards]);

  const grade = useMemo(() => {
    if (!head) return null;

    const gradeId =
      typeof head.grade === "object"
        ? head.grade?.id
        : head.grade;

    return (
      grades.find(
        (item) =>
          String(item.id) ===
          String(gradeId)
      ) || null
    );
  }, [head, grades]);

  /* ==========================================================
     RELATIONSHIP
  ========================================================== */

  const getRelationship = (
    member
  ) => {
    const relationship =
      member?.relationship;

    if (!relationship) {
      return "—";
    }

    if (
      typeof relationship ===
      "object"
    ) {
      return getObjectName(
        relationship
      );
    }

    const found =
      relationships.find(
        (item) =>
          String(item?.id) ===
          String(relationship)
      );

    return (
      found?.name ||
      found?.label ||
      found?.title ||
      "—"
    );
  };

  /* ==========================================================
     MEMBER PHONE
  ========================================================== */

  const getMemberPhone = (
    member
  ) => {
    return (
      member?.mobile_no ||
      member?.mobile ||
      member?.phone_number ||
      member?.phone ||
      "—"
    );
  };

  /* ==========================================================
     HEADER DATA
  ========================================================== */

  const familyName =
    family?.family_name ||
    head?.family_name ||
    getObjectName(
      head?.family
    ) ||
    "—";

  const wardName =
    ward?.ward_name ||
    ward?.name ||
    head?.ward_name ||
    getObjectName(
      head?.ward
    ) ||
    "—";

  const gradeName =
    grade?.name ||
    head?.grade_name ||
    getObjectName(
      head?.grade
    ) ||
    "—";

  const headAge =
    head?.age ??
    getAge(head?.dob);

  const memberSince =
    head?.joining_date ||
    head?.member_since ||
    head?.membership_date;

  const address =
    head?.address ||
    [
      head?.address_line1,
      head?.address_line2,
      head?.city,
      head?.state,
      head?.postal_code,
    ]
      .filter(Boolean)
      .join(", ");

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Center flex="1">
          <Spinner
            size="lg"
            color={RED}
          />
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!head) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Center flex="1">
          <Text color={TEXT}>
            Family head not found.
          </Text>
        </Center>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     PRINT PREVIEW
  ========================================================== */

  if (showPrintPreview) {
    return (
      <PrintPreview
        head={head}
        familyName={familyName}
        wardName={wardName}
        gradeName={gradeName}
        memberSince={
          memberSince
        }
        address={address}
        members={members}
        getRelationship={
          getRelationship
        }
        getMemberPhone={
          getMemberPhone
        }
        getAge={getAge}
        getInitials={getInitials}
        formatDate={formatDate}
        onClose={() =>
          setShowPrintPreview(
            false
          )
        }
      />
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg={PAGE_BG}
    >
      <Navbar />

      <Box
        flex="1"
        px={{
          base: "18px",
          sm: "24px",
          md: "30px",
          lg: "42px",
          xl: "48px",
        }}
        pt={{
          base: "18px",
          md: "20px",
        }}
        pb="20px"
      >
        <Box
          maxW="1580px"
          mx="auto"
          width="100%"
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex
            align="center"
            gap="8px"
            mb="10px"
            fontSize="11px"
          >
            <Text
              color="#667085"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Masters
            </Text>

            <Text color="#A3ADBE">
              /
            </Text>

            <Text
              color="#667085"
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/family-heads"
                )
              }
            >
              Family Head Master
            </Text>

            <Text color="#A3ADBE">
              /
            </Text>

            <Text color="#667085">
              Family Head Details
            </Text>
          </Flex>

          {/* ==================================================
              HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap="15px"
            mb="12px"
            flexDirection={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Heading
                color={NAVY}
                fontSize={{
                  base: "25px",
                  md: "29px",
                  lg: "31px",
                }}
                lineHeight="1.15"
                fontWeight="700"
              >
                Family Head Details
              </Heading>

              <Text
                color="#667085"
                fontSize="11px"
                mt="5px"
              >
                View family head profile,
                parish membership and
                dependent information.
              </Text>
            </Box>

            <HStack
              gap="10px"
              flexWrap="wrap"
            >
              {/* BACK */}

              <Button
                h="40px"
                px="18px"
                bg="white"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  navigate(
                    "/family-heads"
                  )
                }
              >
                <LuArrowLeft
                  size={17}
                />

                <Text ml="6px">
                  Back
                </Text>
              </Button>

              {/* PRINT */}

              <Button
                h="40px"
                px="18px"
                bg="white"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  setShowPrintPreview(
                    true
                  )
                }
              >
                <LuPrinter
                  size={17}
                />

                <Text ml="6px">
                  Print
                </Text>
              </Button>

              {/* PDF */}

              <Button
                h="40px"
                px="18px"
                bg="white"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  setShowPrintPreview(
                    true
                  )
                }
              >
                <LuFileDown
                  size={17}
                />

                <Text ml="6px">
                  Generate PDF
                </Text>
              </Button>

              {/* EDIT */}

              <Button
                h="40px"
                px="18px"
                bg={RED}
                color="white"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() =>
                  navigate(
                    `/family-heads/${headId}/edit`
                  )
                }
                _hover={{
                  bg: RED_DARK,
                }}
              >
                <LuPencil
                  size={17}
                />

                <Text ml="6px">
                  Edit Family Head
                </Text>
              </Button>
            </HStack>
          </Flex>

          {/* ==================================================
              TWO COLUMN
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "410px 1fr",
            }}
            gap={{
              base: "14px",
              lg: "26px",
            }}
            alignItems="start"
          >
            {/* =================================================
                LEFT CARD
            ================================================= */}

            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="8px"
              px="28px"
              py="16px"
            >
              <VStack
                gap="7px"
                align="center"
              >
                <Avatar.Root
                  size="2xl"
                >
                  {(
                    head?.family_image ||
                    head?.image ||
                    head?.photo ||
                    head?.image_url
                  ) ? (
                    <Avatar.Image
                      src={
                        head?.family_image ||
                        head?.image ||
                        head?.photo ||
                        head?.image_url
                      }
                      alt={
                        head?.name ||
                        "Family Head"
                      }
                    />
                  ) : null}

                  <Avatar.Fallback>
                    {getInitials(
                      head?.name
                    )}
                  </Avatar.Fallback>
                </Avatar.Root>

                <Heading
                  color={NAVY}
                  fontSize="28px"
                  lineHeight="1.1"
                  fontWeight="700"
                  textAlign="center"
                >
                  {head?.name ||
                    "Family Head"}
                </Heading>

                <Flex
                  align="center"
                  justify="center"
                  gap="8px"
                  color="#62708B"
                  fontSize="13px"
                  flexWrap="wrap"
                  textAlign="center"
                >
                  <Text>
                    {familyName}
                  </Text>

                  <Text>
                    •
                  </Text>

                  <Text>
                    {head?.house_name ||
                      "—"}
                  </Text>
                </Flex>

                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap="7px"
                  px="12px"
                  py="6px"
                  bg={
                    head?.is_active
                      ? "#E9F8ED"
                      : "#EEEEEE"
                  }
                  border="1px solid"
                  borderColor={
                    head?.is_active
                      ? "#B9E7C4"
                      : "#D8D8D8"
                  }
                  color={
                    head?.is_active
                      ? "#25813B"
                      : "#666666"
                  }
                  borderRadius="5px"
                  fontSize="11px"
                  fontWeight="500"
                  mt="2px"
                >
                  <Box
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg={
                      head?.is_active
                        ? "#16A34A"
                        : "#777777"
                    }
                  />

                  {head?.is_active
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </VStack>

              <Box
                h="1px"
                bg="#E4E9F1"
                my="14px"
              />

              <VStack
                align="stretch"
                gap="13px"
              >
                <InfoRow
                  icon={
                    <LuMapPin
                      size={22}
                    />
                  }
                  label="Ward"
                  value={wardName}
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuMedal
                      size={22}
                    />
                  }
                  label="Grade"
                  value={gradeName}
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuCalendarDays
                      size={22}
                    />
                  }
                  label="Member Since"
                  value={
                    memberSince
                      ? formatDate(
                          memberSince
                        )
                      : "—"
                  }
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuMail
                      size={22}
                    />
                  }
                  label="Email"
                  value={
                    head?.email
                  }
                  width="92px"
                />

                <InfoRow
                  icon={
                    <LuPhone
                      size={22}
                    />
                  }
                  label="Mobile Number"
                  value={
                    head?.mobile_no ||
                    head?.phone_no ||
                    head?.phone_number
                  }
                  width="92px"
                />
              </VStack>
            </Box>

            {/* =================================================
                RIGHT
            ================================================= */}

            <VStack
              align="stretch"
              gap="8px"
            >
              {/* PERSONAL */}

              <SectionCard
                title="Personal & Family"
                icon={
                  <LuUser
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(3, 1fr)",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{
                      md: "22px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Baptism Name"
                        value={
                          head?.baptismal_name ||
                          head?.baptism_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Gender"
                        value={
                          head?.gender
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Date of Birth"
                        value={
                          head?.dob
                            ? formatDate(
                                head.dob
                              )
                            : "—"
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    px={{
                      md: "22px",
                    }}
                    py={{
                      base: "10px",
                      md: "0",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Age"
                        value={
                          headAge !==
                          "—"
                            ? `${headAge} Years`
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Blood Group"
                        value={
                          head?.blood_group
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Marital Status"
                        value={
                          head?.marital_status
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    pl={{
                      md: "22px",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="Spouse Name"
                        value={
                          head?.spouse_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Father Name"
                        value={
                          head?.father_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Mother Name"
                        value={
                          head?.mother_name
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* CONTACT */}

              <SectionCard
                title="Contact & Address"
                icon={
                  <LuMapPin
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1.3fr",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{
                      md: "25px",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        label="House Name"
                        value={
                          head?.house_name
                        }
                        width="92px"
                      />

                      <InfoRow
                        label="Ward"
                        value={
                          wardName
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    pl={{
                      md: "25px",
                    }}
                  >
                    <Flex
                      align="flex-start"
                      gap="10px"
                    >
                      <Box
                        color={RED}
                      >
                        <LuMapPin
                          size={21}
                        />
                      </Box>

                      <Box>
                        <Text
                          fontSize="11px"
                          color={TEXT}
                          mb="3px"
                        >
                          Address
                        </Text>

                        <Text
                          fontSize="11px"
                          color={NAVY}
                          fontWeight="500"
                          lineHeight="1.5"
                        >
                          {address ||
                            "—"}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Grid>
              </SectionCard>

              {/* SACRAMENTS */}

              <SectionCard
                title="Sacraments, Education & Parish"
                icon={
                  <LuBookOpen
                    size={21}
                  />
                }
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(4, 1fr)",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{
                      md: "18px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuCalendarDays
                            size={18}
                          />
                        }
                        label="Date of Baptism"
                        value={
                          head?.date_of_baptism
                            ? formatDate(
                                head.date_of_baptism
                              )
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuHouse
                            size={18}
                          />
                        }
                        label="Parish of Baptism"
                        value={
                          head?.parish_of_baptism
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    px={{
                      md: "18px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuCalendarDays
                            size={18}
                          />
                        }
                        label="Joining Date"
                        value={
                          head?.joining_date
                            ? formatDate(
                                head.joining_date
                              )
                            : "—"
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuArrowLeftRight
                            size={18}
                          />
                        }
                        label="Transferred From"
                        value={
                          head?.transferred_from
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    px={{
                      md: "18px",
                    }}
                    borderRight={{
                      md: "1px solid #E0E6EF",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuGraduationCap
                            size={18}
                          />
                        }
                        label="Educational Qualification"
                        value={
                          head?.educational_qualification
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuBookOpen
                            size={18}
                          />
                        }
                        label="Sunday School Qualification"
                        value={
                          head?.sunday_school_qualification
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    pl={{
                      md: "18px",
                    }}
                  >
                    <VStack
                      align="stretch"
                      gap="7px"
                    >
                      <InfoRow
                        icon={
                          <LuBriefcaseBusiness
                            size={18}
                          />
                        }
                        label="Profession"
                        value={
                          head?.profession
                        }
                        width="92px"
                      />

                      <InfoRow
                        icon={
                          <LuUser
                            size={18}
                          />
                        }
                        label="Status"
                        value={
                          head?.is_active
                            ? "Active"
                            : "Inactive"
                        }
                        width="92px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  DEPENDENTS
              ================================================= */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="10px"
                py="8px"
              >
                <Flex
                  align="center"
                  gap="8px"
                  mb="7px"
                  px="2px"
                >
                  <Text
                    color={NAVY}
                    fontSize="16px"
                    fontWeight="700"
                  >
                    Dependents
                  </Text>

                  <Text
                    color="#6C7890"
                    fontSize="10px"
                  >
                    {members.length}{" "}
                    family members
                    linked to this family
                    head
                  </Text>
                </Flex>

                {members.length === 0 ? (
                  <Box
                    py="18px"
                    textAlign="center"
                  >
                    <Text
                      fontSize="11px"
                      color={MUTED}
                    >
                      No dependent records
                      found.
                    </Text>
                  </Box>
                ) : (
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(2, 1fr)",
                    }}
                    gap="8px"
                  >
                    {members.map(
                      (
                        member,
                        index
                      ) => {
                        const memberName =
                          member?.name ||
                          "Unnamed";

                        const relation =
                          getRelationship(
                            member
                          );

                        const age =
                          member?.age ??
                          getAge(
                            member?.dob
                          );

                        const phone =
                          getMemberPhone(
                            member
                          );

                        return (
                          <Box
                            key={
                              member?.id ||
                              index
                            }
                            border="1px solid"
                            borderColor="#DCE4EF"
                            borderRadius="7px"
                            px="12px"
                            py="7px"
                            bg="white"
                          >
                            <Flex
                              align="center"
                              gap="10px"
                            >
                              <Avatar.Root
                                size="md"
                                flexShrink="0"
                              >
                                <Avatar.Fallback
                                  bg="#EEF2FF"
                                  color={
                                    NAVY
                                  }
                                  fontSize="13px"
                                  fontWeight="600"
                                >
                                  {getInitials(
                                    memberName
                                  )}
                                </Avatar.Fallback>

                                {(
                                  member?.image_url ||
                                  member?.image ||
                                  member?.photo
                                ) ? (
                                  <Avatar.Image
                                    src={
                                      member?.image_url ||
                                      member?.image ||
                                      member?.photo
                                    }
                                  />
                                ) : null}
                              </Avatar.Root>

                              <Box
                                flex="1"
                                minW="0"
                              >
                                <Text
                                  color={
                                    NAVY
                                  }
                                  fontSize="11px"
                                  fontWeight="700"
                                >
                                  {
                                    memberName
                                  }
                                </Text>

                                <Badge
                                  mt="2px"
                                  bg="#EEF5FF"
                                  border="1px solid #D5E4FF"
                                  color="#2864C7"
                                  borderRadius="4px"
                                  px="6px"
                                  py="2px"
                                  fontSize="9px"
                                  fontWeight="500"
                                >
                                  {
                                    relation
                                  }
                                </Badge>
                              </Box>

                              <Box
                                minW="110px"
                                borderLeft="1px solid #E1E6EE"
                                pl="12px"
                              >
                                <Flex
                                  align="center"
                                  gap="6px"
                                  mb="5px"
                                >
                                  <LuUser
                                    size={15}
                                    color={
                                      NAVY
                                    }
                                  />

                                  <Text
                                    fontSize="10px"
                                    color={
                                      TEXT
                                    }
                                  >
                                    {age !==
                                    "—"
                                      ? `${age} Years`
                                      : "—"}
                                  </Text>
                                </Flex>

                                <Flex
                                  align="center"
                                  gap="6px"
                                >
                                  <LuPhone
                                    size={15}
                                    color={
                                      NAVY
                                    }
                                  />

                                  <Text
                                    fontSize="10px"
                                    color={
                                      TEXT
                                    }
                                  >
                                    {phone}
                                  </Text>
                                </Flex>
                              </Box>
                            </Flex>
                          </Box>
                        );
                      }
                    )}
                  </Grid>
                )}
              </Box>

              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="14px"
                py="9px"
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr 1fr",
                  }}
                  alignItems="center"
                  gap="10px"
                >
                  <Flex
                    align="center"
                    gap="10px"
                  >
                    <Box color="#175CD3">
                      <LuInfo
                        size={22}
                      />
                    </Box>

                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={NAVY}
                    >
                      Record Information
                    </Text>
                  </Flex>

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuCalendarDays
                        size={20}
                      />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Created on
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        {head?.created_at
                          ? formatDate(
                              head.created_at
                            )
                          : "—"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuUser
                        size={20}
                      />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Last updated
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        {head?.updated_at
                          ? formatDate(
                              head.updated_at
                            )
                          : "Never"}
                      </Text>
                    </Box>
                  </Flex>
                </Grid>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default FamilyHeadDetailsPage;