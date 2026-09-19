// src/pages/MemberDirectoryPage.jsx

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
  LuSearch,
  LuPrinter,
  LuFileDown,
  LuHouse,
} from "react-icons/lu";
import html2pdf from "html2pdf.js";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listMemberDirectory } from "../api/registryServices";
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
// PRINT STYLES
// ============================================================

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  .print-page {
    width: 210mm; min-height: 297mm;
    margin: 0 auto; padding: 12mm 10mm;
    background: #fff; color: #1A202C;
    font-family: Georgia, "Times New Roman", serif;
  }
  .print-header {
    text-align: center;
    border-bottom: 1.5px solid #8F0000;
    padding-bottom: 8px; margin-bottom: 10px;
  }
  .print-church { font-size: 17px; font-weight: 700; color: #8F0000; }
  .print-subtitle { font-size: 10px; color: #6B0F1A; margin-top: 1px; }
  .print-title {
    font-size: 11px; font-weight: 700; color: #1A202C;
    margin-top: 4px; letter-spacing: 1px; text-transform: uppercase;
  }
  .print-meta { font-size: 8.5px; color: #718096; margin-top: 2px; }
  .print-table {
    width: 100%; border-collapse: collapse; font-size: 9.5px;
  }
  .print-table th, .print-table td {
    border: 1px solid #CBD5E0;
    padding: 4px 5px; vertical-align: middle; text-align: left;
  }
  .print-table thead th {
    background: #F7FAFC; color: #8F0000; font-weight: 700;
    font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px;
  }
  .print-family-row td {
    background: #FBEFEF !important; color: #8F0000 !important;
    font-weight: 700; font-size: 10px;
  }
  .print-head-pill {
    display: inline-block; background: #B40000; color: #fff;
    padding: 1px 4px; border-radius: 3px; font-size: 7.5px;
    font-weight: 700; margin-left: 3px;
  }
  .print-footer {
    margin-top: 10px; padding-top: 6px;
    border-top: 1px solid #E2E8F0; font-size: 8.5px;
    color: #718096; text-align: center;
  }
  @media print {
    html, body { margin: 0; padding: 0; background: white; }
    .print-page { margin: 0; box-shadow: none; }
    @page { size: A4 portrait; margin: 8mm; }
  }
`;

// ============================================================
// SELECT STYLE (shared)
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

const MemberDirectoryPage = () => {
  const [households, setHouseholds] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [churchName, setChurchName] = useState("");

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const printRef = useRef(null);

  // ==========================================================
  // DATA LOAD
  // ==========================================================

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const params = {};

      if (nameFilter) params.name = nameFilter;
      if (ageMin) params.age_min = ageMin;
      if (ageMax) params.age_max = ageMax;

      const res = await listMemberDirectory(params);
      setHouseholds(res.data?.households || []);
      setTotalMembers(res.data?.total_members || 0);
    } catch (err) {
      console.error("Error fetching member directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurch = async () => {
    try {
      const res = await apiClient.get("/api/registry/my-church/");
      setChurchName(res.data?.name || "");
    } catch (err) {
      console.error("Error fetching church name:", err);
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchChurch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // INJECT PRINT STYLES
  // ==========================================================

  useEffect(() => {
    const STYLE_ID = "member-dir-print-styles";
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
    fetchDirectory();
  };

  const handleReset = () => {
    setNameFilter("");
    setWardFilter("");
    setGradeFilter("");
    setAgeMin("");
    setAgeMax("");
    setStatusFilter("");
    setTimeout(() => fetchDirectory(), 0);
  };

  // ==========================================================
  // AVAILABLE WARDS / GRADES (for dropdowns)
  // ==========================================================

  const availableWards = useMemo(() => {
    const s = new Set();
    households.forEach((h) => {
      (h.members || []).forEach((m) => {
        if (m.ward_name) s.add(m.ward_name);
      });
    });
    return Array.from(s).sort();
  }, [households]);

  const availableGrades = useMemo(() => {
    const s = new Set();
    households.forEach((h) => {
      (h.members || []).forEach((m) => {
        if (m.grade) s.add(m.grade);
      });
    });
    return Array.from(s).sort();
  }, [households]);

  // ==========================================================
  // CLIENT-SIDE FILTER + GROUP
  // ==========================================================

  const groupedFamilies = useMemo(() => {
    const filteredHouseholds = households
      .map((h) => {
        const members = (h.members || []).filter((m) => {
          if (wardFilter && m.ward_name !== wardFilter) return false;
          if (gradeFilter && m.grade !== gradeFilter) return false;
          if (statusFilter && m.marital_status !== statusFilter)
            return false;
          return true;
        });
        return { ...h, members };
      })
      .filter((h) => h.members.length > 0);

    return filteredHouseholds.map((h, idx) => {
      const members = h.members;
      const head =
        members.find((m) => m.is_family_head) || members[0] || {};
      const others = members
        .filter((m) => m.id !== head?.id)
        .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));

      return {
        key: `${h.family_name || ""}-${h.house_name || ""}-${idx}`,
        familyName: h.family_name || "—",
        houseName: h.house_name || "",
        head,
        others,
        total: members.length,
      };
    });
  }, [households, wardFilter, gradeFilter, statusFilter]);

  // ==========================================================
  // PRINT
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
          <title>Member List</title>
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

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const fileName = `Member-List-${new Date().toISOString().slice(0, 10)}.pdf`;

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
  // PRINT MARKUP
  // ==========================================================

  const renderPrintView = () => (
    <div className="print-page">
      <div className="print-header">
        <div className="print-church">
          {churchName || "Malankara Orthodox Syrian Church"}
        </div>
        <div className="print-subtitle">Member Directory</div>
        <div className="print-title">Member List</div>
        <div className="print-meta">
          Printed on {new Date().toLocaleString()}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "22%" }}>Member Name</th>
            <th style={{ width: "14%" }}>Baptism Name</th>
            <th style={{ width: "14%" }}>Relationship</th>
            <th style={{ width: "8%" }}>Gender</th>
            <th style={{ width: "13%" }}>Date of Birth</th>
            <th style={{ width: "15%" }}>Mobile Number</th>
            <th style={{ width: "14%" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {groupedFamilies.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 12 }}>
                No members found.
              </td>
            </tr>
          ) : (
            groupedFamilies.map((fam) => (
              <React.Fragment key={fam.key}>
                <tr className="print-family-row">
                  <td colSpan={6}>
                    {fam.familyName} Family
                    {fam.houseName ? ` — ${fam.houseName}` : ""}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {fam.total} Member{fam.total !== 1 ? "s" : ""}
                  </td>
                </tr>

                <tr>
                  <td>
                    {fam.head?.name || "—"}
                    <span className="print-head-pill">HEAD</span>
                  </td>
                  <td>—</td>
                  <td>Family Head</td>
                  <td>{fam.head?.gender || "—"}</td>
                  <td>{formatDate(fam.head?.dob)}</td>
                  <td>{fam.head?.mobile_no || fam.head?.phone_no || "—"}</td>
                  <td>{fam.head?.marital_status || "Active"}</td>
                </tr>

                {fam.others.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name || "—"}</td>
                    <td>—</td>
                    <td>{m.relationship || "—"}</td>
                    <td>{m.gender || "—"}</td>
                    <td>{formatDate(m.dob)}</td>
                    <td>{m.mobile_no || m.phone_no || "—"}</td>
                    <td>{m.marital_status || "Active"}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      <div className="print-footer">
        Total Members: {totalMembers} &nbsp;|&nbsp; Page 1 of 1
        <br />
        Printed from {churchName || "Church"} Member Directory
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
            <Text>Member List</Text>
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
                MEMBERS REPORT
              </Text>
              <Heading
                fontSize={{ base: "22px", md: "26px" }}
                fontWeight="800"
                color="#182338"
                lineHeight="1.15"
                mb={0.5}
              >
                Member List
              </Heading>
              <Text fontSize="12px" color="gray.500">
                View family-wise member records.
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

        {/* FILTER BAR — MATCHES SCREENSHOT */}
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
              md: "2fr 1fr 1fr 1fr 1fr 1fr auto",
            }}
            gap={2.5}
            alignItems="center"
          >
            {/* SEARCH */}
            <Box
              position="relative"
              gridColumn={{ base: "span 2", md: "span 1" }}
            >
              <Box
                position="absolute"
                left="10px"
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
                zIndex={1}
              >
                <LuSearch size={14} />
              </Box>
              <Input
                placeholder="Search member or family"
                size="sm"
                h="36px"
                pl="32px"
                borderRadius="7px"
                borderColor="gray.200"
                fontSize="12.5px"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                _focus={{
                  borderColor: "#D7193F",
                  boxShadow: "0 0 0 1px #D7193F",
                }}
              />
            </Box>

            {/* ALL WARDS */}
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

            {/* ALL GRADES */}
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

            {/* MIN AGE */}
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

            {/* MAX AGE */}
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

            {/* MEMBER STATUS */}
            <select
              style={selectStyle}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Member Status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="WIDOWED">Widowed</option>
              <option value="DIVORCED">Divorced</option>
            </select>

            {/* FILTER */}
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

          {(nameFilter ||
            wardFilter ||
            gradeFilter ||
            ageMin ||
            ageMax ||
            statusFilter) && (
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

        {/* TABLE CARD */}
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
          ) : groupedFamilies.length === 0 ? (
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
                      "Baptism Name",
                      "Relationship",
                      "Gender",
                      "Date of Birth",
                      "Mobile Number",
                      "Status",
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
                  {groupedFamilies.map((fam) => (
                    <React.Fragment key={fam.key}>
                      {/* FAMILY HEADER */}
                      <Table.Row bg="#F7F1F1">
                        <Table.Cell
                          colSpan={6}
                          fontWeight="700"
                          color="#8F0000"
                          fontSize="12.5px"
                          py={2}
                        >
                          <HStack gap={2}>
                            <Box color="#D7193F">
                              <LuHouse size={14} />
                            </Box>
                            <Text>{fam.familyName} Family</Text>
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
                          {fam.total} Member{fam.total !== 1 ? "s" : ""}
                        </Table.Cell>
                      </Table.Row>

                      {/* HEAD ROW */}
                      <Table.Row bg="white">
                        <Table.Cell
                          fontWeight="700"
                          color="#182338"
                          fontSize="12.5px"
                          pl={8}
                          py={2}
                        >
                          {fam.head?.name || "—"}
                        </Table.Cell>
                        <Table.Cell color="gray.700" fontSize="12px" py={2}>
                          {fam.head?.baptismal_name || "—"}
                        </Table.Cell>
                        <Table.Cell py={2}>
                          <Box
                            display="inline-block"
                            px={2}
                            py="2px"
                            border="1px solid #D7193F"
                            color="#D7193F"
                            borderRadius="5px"
                            fontSize="10px"
                            fontWeight="700"
                          >
                            Family Head
                          </Box>
                        </Table.Cell>
                        <Table.Cell color="gray.700" fontSize="12px" py={2}>
                          {fam.head?.gender || "—"}
                        </Table.Cell>
                        <Table.Cell color="gray.700" fontSize="12px" py={2}>
                          {formatDate(fam.head?.dob)}
                        </Table.Cell>
                        <Table.Cell color="gray.700" fontSize="12px" py={2}>
                          {fam.head?.mobile_no || fam.head?.phone_no || "—"}
                        </Table.Cell>
                        <Table.Cell py={2}>
                          <Box
                            display="inline-block"
                            px={2.5}
                            py="2px"
                            bg="#E7F7EE"
                            color="#1E9E4A"
                            border="1px solid #B7E4C7"
                            borderRadius="10px"
                            fontSize="10.5px"
                            fontWeight="700"
                          >
                            Active
                          </Box>
                        </Table.Cell>
                      </Table.Row>

                      {/* OTHER MEMBERS */}
                      {fam.others.map((m) => (
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
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.baptismal_name || "—"}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.relationship || "—"}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.gender || "—"}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {formatDate(m.dob)}
                          </Table.Cell>
                          <Table.Cell color="gray.700" fontSize="12px" py={2}>
                            {m.mobile_no || m.phone_no || "—"}
                          </Table.Cell>
                          <Table.Cell py={2}>
                            <Box
                              display="inline-block"
                              px={2.5}
                              py="2px"
                              bg="#E7F7EE"
                              color="#1E9E4A"
                              border="1px solid #B7E4C7"
                              borderRadius="10px"
                              fontSize="10.5px"
                              fontWeight="700"
                            >
                              Active
                            </Box>
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
          {!isLoading && groupedFamilies.length > 0 && (
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
                Showing 1–
                {groupedFamilies.reduce((s, f) => s + f.total, 0)} of{" "}
                {totalMembers} members
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

export default MemberDirectoryPage;