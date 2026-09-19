// src/pages/MemberAgeWisePage.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Flex,
  HStack,
  VStack,
  Grid,
  Skeleton,
  Button,
  Table,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuPrinter,
  LuFileDown,
  LuHouse,
  LuArrowUpDown,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listMemberAgeWise } from "../api/registryServices";
import apiClient from "../api/apiClient";

// ============================================================
// HELPERS
// ============================================================

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(
      typeof value === "string" && value.length === 10
        ? `${value}T00:00:00`
        : value
    );
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

// ============================================================
// PRINT STYLES (ornate certificate layout)
// ============================================================

const PRINT_STYLES = `
  * { box-sizing: border-box; }

  .print-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 10mm 10mm 6mm;
    background: #ffffff;
    color: #1A202C;
    font-family: Georgia, "Times New Roman", serif;
    position: relative;
  }

  .print-frame {
    position: relative;
    border: 1.5px solid #8F0000;
    padding: 6mm 6mm 4mm;
    min-height: 277mm;
  }
  .print-frame::before {
    content: "";
    position: absolute;
    top: 3px; left: 3px; right: 3px; bottom: 3px;
    border: 1px solid #D65A4A;
    pointer-events: none;
  }

  .print-corner {
    position: absolute;
    width: 22px; height: 22px;
    color: #C99A38;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
  }
  .print-corner.tl { top: 2px; left: 2px; }
  .print-corner.tr { top: 2px; right: 2px; transform: scaleX(-1); }
  .print-corner.bl { bottom: 2px; left: 2px; transform: scaleY(-1); }
  .print-corner.br { bottom: 2px; right: 2px; transform: scale(-1); }

  .print-header {
    display: grid;
    grid-template-columns: 60px 1fr 60px;
    align-items: center;
    padding: 0 2mm 4mm;
    border-bottom: 1.5px solid #8F0000;
  }
  .print-logo {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 1.5px solid #8F0000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8F0000;
    font-size: 26px;
    background: #FFFDF8;
  }
  .print-church-block { text-align: center; }
  .print-church {
    font-size: 20px;
    font-weight: 700;
    color: #8F0000;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .print-church-sub {
    font-size: 11px;
    color: #4A1111;
    margin-top: 3px;
    font-style: italic;
  }

  .print-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5mm 0 4mm;
    gap: 6px;
  }
  .print-title-flourish {
    color: #C99A38;
    font-size: 16px;
    line-height: 1;
  }
  .print-title-banner {
    background: linear-gradient(to bottom, #B30D0D, #8F0000);
    color: #ffffff;
    padding: 5px 30px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    border: 1.5px solid #C99A38;
    position: relative;
  }
  .print-title-banner::before,
  .print-title-banner::after {
    content: "";
    position: absolute;
    top: 2px;
    width: 14px;
    height: calc(100% - 4px);
    background: linear-gradient(to bottom, #B30D0D, #8F0000);
    border-top: 1.5px solid #C99A38;
    border-bottom: 1.5px solid #C99A38;
  }
  .print-title-banner::before { left: -8px; transform: skewX(-18deg); }
  .print-title-banner::after { right: -8px; transform: skewX(18deg); }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-top: 2mm;
  }
  .print-table th,
  .print-table td {
    border: 1px solid #8F0000;
    padding: 5px 6px;
    vertical-align: middle;
    text-align: center;
    color: #1A202C;
  }
  .print-table thead th {
    background: linear-gradient(to bottom, #A81616, #8F0000);
    color: #ffffff;
    font-weight: 700;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    height: 9mm;
  }
  .print-table tbody tr { height: 8mm; }
  .print-table tbody tr:nth-child(even) { background: #FCF7F7; }

  .print-ward-row td {
    background: #F5E4E4 !important;
    color: #8F0000 !important;
    font-weight: 700;
    font-size: 10.5px;
    text-align: left !important;
    padding-left: 8px !important;
    font-style: italic;
  }

  .print-name { text-align: left !important; padding-left: 8px !important; }
  .print-center { text-align: center; }

  .print-footer {
    position: absolute;
    bottom: 2mm;
    left: 6mm;
    right: 6mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #4A1111;
    padding-top: 3mm;
    border-top: 1px solid #D65A4A;
    font-style: italic;
  }
  .print-footer-center { font-style: italic; }

  @media print {
    html, body { margin: 0; padding: 0; background: white; }
    .print-page { margin: 0; box-shadow: none; padding: 8mm 8mm 4mm; }
    .print-frame { min-height: 281mm; }
    @page { size: A4 portrait; margin: 0; }
  }
`;

// ============================================================
// SELECT STYLE (shared inline)
// ============================================================

const selectStyle = {
  height: "36px",
  width: "100%",
  padding: "0 30px 0 10px",
  border: "1px solid #E2E8F0",
  borderRadius: "7px",
  background: "white",
  color: "#1A202C",
  fontSize: "12.5px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
};

// ============================================================
// PAGE
// ============================================================

const MemberAgeWisePage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [churchName, setChurchName] = useState("");
  const [churchAddress, setChurchAddress] = useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [order, setOrder] = useState("desc");

  const printRef = useRef(null);

  // ==========================================================
  // DATA LOAD
  // ==========================================================

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const params = { order };
      if (nameFilter) params.name = nameFilter;
      if (ageMin) params.age_min = ageMin;
      if (ageMax) params.age_max = ageMax;

      const res = await listMemberAgeWise(params);
      setMembers(res.data?.members || []);
      setTotalMembers(res.data?.total_members || 0);
    } catch (err) {
      console.error("Error fetching age-wise list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurch = async () => {
    try {
      const res = await apiClient.get("/api/registry/my-church/");
      setChurchName(res.data?.name || "");
      setChurchAddress(
        res.data?.city
          ? `${res.data.city}${res.data.state ? ", " + res.data.state : ""}`
          : res.data?.address || "Address of the Parish"
      );
    } catch (err) {
      console.error("Error fetching church name:", err);
    }
  };

  useEffect(() => {
    fetchList();
    fetchChurch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // INJECT PRINT STYLES
  // ==========================================================

  useEffect(() => {
    const STYLE_ID = "age-wise-print-styles";
    if (!document.getElementById(STYLE_ID)) {
      const tag = document.createElement("style");
      tag.id = STYLE_ID;
      tag.innerHTML = PRINT_STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchList();
  };

  const handleReset = () => {
    setNameFilter("");
    setAgeMin("");
    setAgeMax("");
    setWardFilter("");
    setGradeFilter("");
    setOrder("desc");
    setTimeout(() => fetchList(), 0);
  };

  const hasActiveFilters =
    nameFilter || ageMin || ageMax || wardFilter || gradeFilter || order !== "desc";

  // ==========================================================
  // AVAILABLE WARDS / GRADES
  // ==========================================================

  const availableWards = useMemo(() => {
    const s = new Set();
    members.forEach((m) => m.ward_name && s.add(m.ward_name));
    return Array.from(s).sort();
  }, [members]);

  const availableGrades = useMemo(() => {
    const s = new Set();
    members.forEach((m) => m.grade && s.add(m.grade));
    return Array.from(s).sort();
  }, [members]);

  // ==========================================================
  // CLIENT-SIDE FILTER + GROUP BY WARD
  // ==========================================================

  const groupedByWard = useMemo(() => {
    const filtered = members.filter((m) => {
      if (wardFilter && m.ward_name !== wardFilter) return false;
      if (gradeFilter && m.grade !== gradeFilter) return false;
      return true;
    });

    const map = new Map();
    filtered.forEach((m) => {
      const w = m.ward_name || "Unassigned Ward";
      if (!map.has(w)) map.set(w, []);
      map.get(w).push(m);
    });

    return Array.from(map.entries()).map(([ward, list]) => ({
      ward,
      members: list.sort((a, b) =>
        order === "asc" ? (a.age ?? 0) - (b.age ?? 0) : (b.age ?? 0) - (a.age ?? 0)
      ),
    }));
  }, [members, wardFilter, gradeFilter, order]);

  // ==========================================================
  // PRINT / PDF
  // ==========================================================

  const handlePrint = () => {
    const element = printRef.current;
    if (!element) return;

    const printWindow = window.open("", "_blank", "width=1200,height=1000");
    if (!printWindow) {
      alert("Please allow pop-ups to print the member list.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Age-wise Member List</title>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              margin: 0; padding: 0;
              background: white;
              font-family: Georgia, "Times New Roman", serif;
            }
            @page { size: A4 portrait; margin: 0; }
            ${PRINT_STYLES}
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

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const fileName = `Age-Wise-Member-List-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

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
  // PRINT MARKUP (ornate)
  // ==========================================================

  const renderPrintView = () => (
    <div className="print-page">
      <div className="print-frame">
        <div className="print-corner tl">❧</div>
        <div className="print-corner tr">❧</div>
        <div className="print-corner bl">❧</div>
        <div className="print-corner br">❧</div>

        {/* HEADER */}
        <div className="print-header">
          <div className="print-logo">✝</div>
          <div className="print-church-block">
            <div className="print-church">{churchName || "Parish Name"}</div>
            <div className="print-church-sub">
              {churchAddress || "Address of the Parish"}
            </div>
          </div>
          <div />
        </div>

        {/* TITLE */}
        <div className="print-title-row">
          <span className="print-title-flourish">❧</span>
          <div className="print-title-banner">Age-wise Member List</div>
          <span
            className="print-title-flourish"
            style={{ transform: "scaleX(-1)" }}
          >
            ❧
          </span>
        </div>

        {/* TABLE */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Sl. No.</th>
              <th style={{ width: "30%" }}>Member Name</th>
              <th style={{ width: "20%" }}>Family Name</th>
              <th style={{ width: "15%" }}>Date of Birth</th>
              <th style={{ width: "8%" }}>Age</th>
              <th style={{ width: "17%" }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {groupedByWard.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 12 }}>
                  No members found.
                </td>
              </tr>
            ) : (
              groupedByWard.map((group, gi) => (
                <React.Fragment key={group.ward}>
                  {/* WARD HEADER */}
                  <tr className="print-ward-row">
                    <td colSpan={6}>
                      {group.ward} — {group.members.length} Member
                      {group.members.length !== 1 ? "s" : ""}
                    </td>
                  </tr>

                  {/* MEMBERS */}
                  {group.members.map((m, i) => (
                    <tr key={m.id}>
                      <td className="print-center">
                        {gi + 1}.{i + 1}
                      </td>
                      <td className="print-name">
                        {m.name || "—"}
                        {m.is_family_head && (
                          <span className="print-head-pill">HEAD</span>
                        )}
                      </td>
                      <td className="print-center">
                        {m.family_name || "—"}
                      </td>
                      <td className="print-center">{formatDate(m.dob)}</td>
                      <td className="print-center">{m.age ?? "—"}</td>
                      <td className="print-center">{m.grade || "—"}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="print-footer">
          <span>Generated by Egliste</span>
          <span className="print-footer-center">
            Total Members: {totalMembers}
          </span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box bg="white" minH="100vh" display="flex" flexDirection="column">
      <Box className="no-print">
        <Navbar />
      </Box>

      <Container maxW="container.xl" flex="1" py={5} px={{ base: 4, md: 6 }}>
        {/* BREADCRUMB + TITLE */}
        <Box className="no-print" mb={4}>
          <HStack gap={2} color="gray.500" fontSize="12px" mb={2}>
            <Text color="#D7193F" fontWeight="500">
              Reports
            </Text>
            <Text>/</Text>
            <Text>Age-wise Member List</Text>
          </HStack>

          <Flex
            justify="space-between"
            align="flex-start"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="800"
                color="#D7193F"
                letterSpacing="0.4px"
                mb={0.5}
              >
                AGE-WISE MEMBER LIST REPORT
              </Text>
              <Heading
                fontSize={{ base: "22px", md: "26px" }}
                fontWeight="800"
                color="#182338"
                lineHeight="1.15"
                mb={0.5}
              >
                Age-wise Member List
              </Heading>
              <Text fontSize="12px" color="gray.500">
                View members by age range and ward.
              </Text>
            </Box>

            <HStack gap={2}>
              <Button
                variant="outline"
                borderColor="#D7193F"
                color="#D7193F"
                bg="white"
                h="36px"
                px={4}
                fontSize="12.5px"
                fontWeight="600"
                borderRadius="7px"
                onClick={() => navigate("/reports")}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuArrowLeft size={14} style={{ marginRight: 6 }} />
                Back
              </Button>

              <Button
                variant="outline"
                borderColor="#D7193F"
                color="#D7193F"
                bg="white"
                h="36px"
                px={4}
                fontSize="12.5px"
                fontWeight="600"
                borderRadius="7px"
                onClick={handlePrint}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuPrinter size={14} style={{ marginRight: 6 }} />
                Print
              </Button>

              <Button
                variant="outline"
                borderColor="#D7193F"
                color="#D7193F"
                bg="white"
                h="36px"
                px={4}
                fontSize="12.5px"
                fontWeight="600"
                borderRadius="7px"
                onClick={handleDownloadPDF}
                _hover={{ bg: "#FFF5F7" }}
              >
                <LuFileDown size={14} style={{ marginRight: 6 }} />
                Generate PDF
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* FILTER BAR */}
        <Box
          as="form"
          onSubmit={handleSearch}
          mb={4}
          p={3}
          bg="white"
          borderRadius="10px"
          border="1px solid"
          borderColor="gray.200"
          className="no-print"
        >
          <Grid
            templateColumns={{
              base: "repeat(2, 1fr)",
              md: "1.2fr 1.2fr 1.2fr 1.2fr 1.2fr auto",
            }}
            gap={2.5}
            alignItems="center"
          >
            <Input
              placeholder="Min Age"
              type="number"
              size="sm"
              h="36px"
              borderRadius="7px"
              borderColor="gray.200"
              fontSize="12.5px"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              _focus={{
                borderColor: "#D7193F",
                boxShadow: "0 0 0 1px #D7193F",
              }}
            />

            <Input
              placeholder="Max Age"
              type="number"
              size="sm"
              h="36px"
              borderRadius="7px"
              borderColor="gray.200"
              fontSize="12.5px"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              _focus={{
                borderColor: "#D7193F",
                boxShadow: "0 0 0 1px #D7193F",
              }}
            />

            <select
              style={selectStyle}
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
            >
              <option value="">All Wards</option>
              {availableWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              style={selectStyle}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="">All Grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              style={selectStyle}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="desc">Sort By: Oldest first</option>
              <option value="asc">Sort By: Youngest first</option>
            </select>

            <Button
              type="submit"
              bg="white"
              color="#D7193F"
              border="1px solid #D7193F"
              h="36px"
              px={5}
              fontSize="12.5px"
              fontWeight="700"
              borderRadius="7px"
              _hover={{ bg: "#FFF5F7" }}
            >
              Filter
            </Button>
          </Grid>

          {hasActiveFilters && (
            <Box mt={2}>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                color="gray.500"
                fontSize="11.5px"
                onClick={handleReset}
              >
                Clear all filters
              </Button>
            </Box>
          )}
        </Box>

        {/* TABLE CARD (screen) */}
        <Box
          className="no-print"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="10px"
          overflow="hidden"
        >
          {isLoading ? (
            <VStack align="stretch" gap={2.5} p={5}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="34px" borderRadius="md" />
              ))}
            </VStack>
          ) : groupedByWard.length === 0 ? (
            <Box textAlign="center" py={16}>
              <Text color="gray.400" fontSize="13px">
                No members found.
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm" variant="line" interactive>
                <Table.Header>
                  <Table.Row bg="gray.50">
                    {[
                      "Member Name",
                      "Family Name",
                      "Date of Birth",
                      "Age",
                      "Grade",
                    ].map((h) => (
                      <Table.ColumnHeader
                        key={h}
                        fontSize="10.5px"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="0.4px"
                        color="#182338"
                        py={2.5}
                      >
                        {h}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {groupedByWard.map((group) => (
                    <React.Fragment key={group.ward}>
                      {/* WARD HEADER */}
                      <Table.Row bg="#F7F1F1">
                        <Table.Cell
                          colSpan={4}
                          fontWeight="700"
                          color="#8F0000"
                          fontSize="12.5px"
                          py={2}
                        >
                          <HStack gap={2}>
                            <Box color="#D7193F">
                              <LuHouse size={14} />
                            </Box>
                            <Text>{group.ward}</Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell
                          fontWeight="700"
                          color="#8F0000"
                          textAlign="right"
                          whiteSpace="nowrap"
                          fontSize="11.5px"
                          py={2}
                        >
                          {group.members.length} Member
                          {group.members.length !== 1 ? "s" : ""}
                        </Table.Cell>
                      </Table.Row>

                      {/* MEMBERS */}
                      {group.members.map((m) => (
                        <Table.Row
                          key={m.id}
                          _hover={{ bg: "#FFFBFC" }}
                          bg="white"
                        >
                          <Table.Cell
                            pl={8}
                            color="#344054"
                            fontSize="12.5px"
                            py={2}
                          >
                            {m.name || "—"}
                            {m.is_family_head && (
                              <Box
                                as="span"
                                ml={2}
                                px={1.5}
                                py="1px"
                                border="1px solid #D7193F"
                                color="#D7193F"
                                borderRadius="4px"
                                fontSize="9.5px"
                                fontWeight="700"
                              >
                                HEAD
                              </Box>
                            )}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.family_name || "—"}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {formatDate(m.dob)}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.age ?? "—"}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.grade || "—"}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </React.Fragment>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* PAGINATION */}
          {!isLoading && groupedByWard.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              px={5}
              py={3}
              borderTop="1px solid"
              borderColor="gray.100"
              fontSize="12px"
              color="gray.600"
              flexWrap="wrap"
              gap={2}
            >
              <Text>
                Showing 1–{members.length} of {totalMembers} members
              </Text>
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  disabled
                  fontSize="11.5px"
                  _hover={{ bg: "gray.100" }}
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  bg="#D7193F"
                  color="white"
                  _hover={{ bg: "#B5122F" }}
                  borderRadius="5px"
                  minW="28px"
                  fontSize="11.5px"
                >
                  1
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.700"
                  _hover={{ bg: "gray.100" }}
                  borderRadius="5px"
                  minW="28px"
                  fontSize="11.5px"
                >
                  2
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.700"
                  _hover={{ bg: "gray.100" }}
                  borderRadius="5px"
                  minW="28px"
                  fontSize="11.5px"
                >
                  3
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.700"
                  _hover={{ bg: "gray.100" }}
                  fontSize="11.5px"
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>

        {/* HIDDEN PRINT REF */}
        <Box
          ref={printRef}
          position="absolute"
          left="-99999px"
          top="0"
          aria-hidden="true"
        >
          {renderPrintView()}
        </Box>
      </Container>

      <Box className="no-print">
        <Footer />
      </Box>
    </Box>
  );
};

export default MemberAgeWisePage;