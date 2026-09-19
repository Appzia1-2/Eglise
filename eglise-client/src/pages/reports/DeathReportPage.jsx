// src/pages/reports/DeathReportPage.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import {
  LuBookOpen,
  LuCalendarDays,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFileText,
  LuFilter,
  LuPrinter,
  LuSearch,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getDeathReport, getReportFamilies } from "../../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";
const PAGE_SIZE = 7;

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ icon, title, value }) => (
  <Box
    border="1px solid #DCE2EA"
    borderRadius="8px"
    h="78px"
    px={4}
    bg="white"
    display="flex"
    alignItems="center"
  >
    <Flex align="center" width="100%" height="100%">
      <Box
        width="65px"
        height="100%"
        borderRight="1px solid #DCE2EA"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={8} color={RED} strokeWidth={1.6} />
      </Box>
      <Box pl={4}>
        <Text fontSize="12px" color={DARK} mb={1} fontWeight="600">
          {title}
        </Text>
        <Text fontSize="24px" fontWeight="700" color={DARK} lineHeight="1">
          {value}
        </Text>
      </Box>
    </Flex>
  </Box>
);

const DeathReportPage = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [diedFrom, setDiedFrom] = useState("");
  const [diedTo, setDiedTo] = useState("");
  const [funeralFrom, setFuneralFrom] = useState("");
  const [funeralTo, setFuneralTo] = useState("");
  const [sortBy, setSortBy] = useState("-died_on");

  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    total: 0,
    this_year: 0,
    this_month: 0,
  });

  useEffect(() => {
    getReportFamilies()
      .then((d) => setFamilies(Array.isArray(d) ? d : d?.results || []))
      .catch(() => setFamilies([]));
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE, sort_by: sortBy };
      if (name) params.name = name;
      if (familyId) params.family = familyId;
      if (diedFrom) params.died_on_from = diedFrom;
      if (diedTo) params.died_on_to = diedTo;
      if (funeralFrom) params.funeral_on_from = funeralFrom;
      if (funeralTo) params.funeral_on_to = funeralTo;

      const data = await getDeathReport(params);
      setRows(data.results || []);
      setCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setSummary(data.summary || { total: 0, this_year: 0, this_month: 0 });
    } catch (err) {
      console.error("Error loading death report:", err);
      setError("Unable to load death report.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy]);

  const handleFilter = () => {
    setPage(1);
    loadReport();
  };

  const handleReset = () => {
    setName("");
    setFamilyId("");
    setDiedFrom("");
    setDiedTo("");
    setFuneralFrom("");
    setFuneralTo("");
    setSortBy("-died_on");
    setPage(1);
    setTimeout(loadReport, 0);
  };

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      alert("Please allow popups for printing.");
      return;
    }

    const escapeHtml = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const rowsHtml = rows
      .map(
        (r, i) => `
          <tr>
            <td class="td-index">${i + 1}</td>
            <td class="td-reg">${escapeHtml(r.reg_no || "-")}</td>
            <td class="td-name">${escapeHtml(r.member_name || "-")}</td>
            <td>${escapeHtml(r.family_name || "-")}</td>
            <td class="td-date">${escapeHtml(formatDate(r.died_on))}</td>
            <td class="td-date">${escapeHtml(formatDate(r.funeral_on))}</td>
            <td>${escapeHtml(r.tomb_type_name || "-")}</td>
          </tr>
        `
      )
      .join("");

    const printedOn = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Death Report</title>
          <style>
            @page { size: A4 landscape; margin: 14mm 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: "Segoe UI", Arial, sans-serif;
              color: #1a1a1a; font-size: 10.5px; line-height: 1.5;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .header {
              display: flex; justify-content: space-between; align-items: flex-start;
              padding-bottom: 14px; border-bottom: 2px solid #b8132f; margin-bottom: 18px;
            }
            .header-left .org {
              font-size: 9.5px; color: #b8132f; font-weight: 700;
              letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 6px;
            }
            .header-left h1 { font-size: 20px; font-weight: 700; margin-bottom: 3px; }
            .header-left .subtitle { font-size: 10.5px; color: #6b7280; }
            .header-right { text-align: right; font-size: 9.5px; color: #6b7280; line-height: 1.6; }
            .header-right .row { display: flex; justify-content: flex-end; gap: 6px; }
            .header-right .label { color: #9ca3af; font-weight: 500; }
            .header-right .value { color: #1a1a1a; font-weight: 600; }

            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead th {
              background: #b8132f; color: #ffffff; font-size: 9.5px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.4px; padding: 8px;
              text-align: left; border: none;
            }
            tbody td {
              padding: 8px; font-size: 10px; color: #333333;
              border-bottom: 1px solid #e8ebf0; vertical-align: top;
              word-wrap: break-word;
            }
            tbody tr:nth-child(even) { background: #fafbfc; }
            tbody tr:last-child td { border-bottom: none; }

            .col-index { width: 38px; text-align: center; }
            .col-reg   { width: 120px; }
            .col-date  { width: 110px; }

            .td-index { text-align: center; color: #9ca3af; font-weight: 600; }
            .td-reg { color: #1a1a1a; font-weight: 600; }
            .td-name { font-weight: 600; color: #1a1a1a; }
            .td-date { color: #374151; font-weight: 500; white-space: nowrap; }

            .empty { text-align: center; padding: 40px 20px; color: #9ca3af; font-size: 11px; }

            .totals { margin-top: 14px; display: flex; justify-content: flex-end; }
            .totals .total-box {
              display: flex; align-items: center; gap: 10px; padding: 8px 14px;
              background: #f4f5f7; border-radius: 4px; font-size: 10px;
            }
            .totals .total-box .label { color: #6b7280; font-weight: 500; }
            .totals .total-box .value { color: #b8132f; font-weight: 700; font-size: 12px; }

            .footer {
              margin-top: 24px; padding-top: 12px; border-top: 1px solid #e8ebf0;
              display: flex; justify-content: space-between; align-items: center;
              font-size: 9px; color: #9ca3af;
            }
            .footer .signature { text-align: center; color: #6b7280; }
            .footer .signature .line { width: 140px; border-top: 1px solid #9ca3af; margin-bottom: 5px; }

            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <div class="org">Church Management System</div>
              <h1>Death Report</h1>
              <div class="subtitle">Complete list of parish death register entries</div>
            </div>
            <div class="header-right">
              <div class="row">
                <span class="label">Printed:</span>
                <span class="value">${escapeHtml(printedOn)}</span>
              </div>
              <div class="row">
                <span class="label">Total Records:</span>
                <span class="value">${rows.length}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th class="col-reg">Reg No.</th>
                <th>Member</th>
                <th>Family</th>
                <th class="col-date">Died On</th>
                <th class="col-date">Funeral On</th>
                <th>Tomb Type</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="7" class="empty">No death records found.</td></tr>`}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-box">
              <span class="label">Total Records</span>
              <span class="value">${rows.length}</span>
            </div>
          </div>

          <div class="footer">
            <div>Generated from Church Management System</div>
            <div class="signature">
              <div class="line"></div>
              Authorised Signature
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const startIndex = (page - 1) * PAGE_SIZE;
  const showingFrom = count === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rows.length, count);

  const renderPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text
              cursor="pointer"
              _hover={{ color: PRIMARY_MAROON }}
              onClick={() => navigate("/reports")}
            >
              Reports
            </Text>
            <Text>/</Text>
            <Text>Death Report</Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={3}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
                DEATH REPORT
              </Text>
              <Heading color={DARK} fontSize={{ base: "22px", md: "26px" }} lineHeight="1.1" mb={1}>
                Death Report
              </Heading>
              <Text color={MUTED} fontSize="11px">
                View and filter parish death register entries.
              </Text>
            </Box>

            <HStack gap={2} flexShrink={0}>
              <Button
                variant="outline"
                h="38px"
                borderColor={BORDER}
                color={DARK}
                fontSize="12px"
                borderRadius="6px"
                px={4}
                onClick={() => navigate(-1)}
                _hover={{ bg: "#F7F9FC" }}
              >
                Back
              </Button>
              <Button
                variant="outline"
                h="38px"
                borderColor={BORDER}
                color={DARK}
                fontSize="12px"
                borderRadius="6px"
                px={4}
                onClick={handlePrintAll}
                _hover={{ bg: "#F7F9FC" }}
              >
                <Icon as={LuPrinter} mr={2} boxSize={4} />
                Print
              </Button>
              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                fontSize="12px"
                borderRadius="6px"
                px={4}
                onClick={handlePrintAll}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuFileText} mr={2} boxSize={4} />
                Generate PDF
              </Button>
            </HStack>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mb={3}>
            <StatCard icon={LuBookOpen} title="Total Deaths" value={summary.total} />
            <StatCard icon={LuCalendarDays} title="This Year" value={summary.this_year} />
            <StatCard icon={LuFileText} title="This Month" value={summary.this_month} />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box border="1px solid #DCE2EA" borderRadius="8px" p={3} bg="white" w="100%">
            {/* FILTERS */}
            <Flex gap={3} mb={3} direction={{ base: "column", md: "row" }} flexWrap="wrap">
              <Box position="relative" maxW={{ base: "100%", md: "240px" }} flex="1">
                <Icon
                  as={LuSearch}
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={MUTED}
                  zIndex={1}
                  boxSize={4}
                />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  placeholder="Name or Reg No."
                  pl="38px"
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              <Box position="relative" width={{ base: "100%", md: "180px" }}>
                <select
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid #DCE2EA",
                    borderRadius: "6px",
                    padding: "0 35px 0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All Families</option>
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.family_name}
                    </option>
                  ))}
                </select>
                <Icon
                  as={LuChevronDown}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              <Input
                type="date"
                value={diedFrom}
                onChange={(e) => setDiedFrom(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
              />

              <Input
                type="date"
                value={diedTo}
                onChange={(e) => setDiedTo(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
              />

              <Input
                type="date"
                value={funeralFrom}
                onChange={(e) => setFuneralFrom(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
              />

              <Input
                type="date"
                value={funeralTo}
                onChange={(e) => setFuneralTo(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
              />

              <Box position="relative" width={{ base: "100%", md: "180px" }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid #DCE2EA",
                    borderRadius: "6px",
                    padding: "0 35px 0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="-died_on">Newest First</option>
                  <option value="died_on">Oldest First</option>
                  <option value="member__name">Name (A–Z)</option>
                </select>
                <Icon
                  as={LuChevronDown}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={handleFilter}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
                Filter
              </Button>

              <Button
                variant="ghost"
                h="38px"
                color={MUTED}
                fontSize="12px"
                onClick={handleReset}
              >
                Reset
              </Button>
            </Flex>

            {/* ERROR */}
            {error && (
              <Box
                mb={3}
                p={2}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text color="red.600" fontSize="12px">
                  {error}
                </Text>
                <Button size="xs" variant="outline" onClick={loadReport}>
                  Retry
                </Button>
              </Box>
            )}

            {/* TABLE */}
            <Box
              overflowX="auto"
              overflowY="hidden"
              border="1px solid #E6EAF0"
              borderRadius="6px"
              width="100%"
            >
              <Box as="table" width="100%" minW="1150px" borderCollapse="collapse">
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {[
                      "Reg No.",
                      "Member",
                      "Family",
                      "Died On",
                      "Funeral On",
                      "Tomb Type",
                      "Actions",
                    ].map((h) => (
                      <Box
                        as="th"
                        key={h}
                        textAlign="left"
                        px={4}
                        py={2}
                        fontSize="11px"
                        fontWeight="700"
                        color={DARK}
                        borderBottom="1px solid #E6EAF0"
                        whiteSpace="nowrap"
                        bg="white"
                      >
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {loading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading death records...
                      </Box>
                    </Box>
                  ) : rows.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No death records found.
                      </Box>
                    </Box>
                  ) : (
                    rows.map((row) => (
                      <Box
                        as="tr"
                        key={row.id}
                        height="42px"
                        _hover={{ bg: "#FFFBFC" }}
                      >
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          fontWeight="600"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {row.reg_no}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                        >
                          {row.member_name}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                        >
                          {row.family_name || "—"}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDate(row.died_on)}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDate(row.funeral_on)}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                        >
                          {row.tomb_type_name || "—"}
                        </Box>
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            h="30px"
                            color={RED}
                            px={2}
                            fontSize="11px"
                            onClick={() => navigate(`/death/${row.id}`)}
                            _hover={{ bg: "#FFF0F4" }}
                          >
                            <Icon as={LuEye} mr={1} boxSize={3.5} />
                            View
                          </Button>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>

            {/* PAGINATION */}
            <Flex
              justify="space-between"
              align="center"
              mt={3}
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <Text fontSize="11px" color={MUTED}>
                {count === 0
                  ? "Showing 0 records"
                  : `Showing ${showingFrom}–${showingTo} of ${count} death records`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={page === 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  <Icon as={LuChevronLeft} boxSize={3.5} />
                  Previous
                </Button>

                {renderPages().map((p, idx) =>
                  p === "..." ? (
                    <Text key={`dots-${idx}`} px={1.5} fontSize="11px" color={MUTED}>
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={p}
                      size="xs"
                      h="30px"
                      minW="30px"
                      variant={p === page ? "solid" : "outline"}
                      bg={p === page ? PRIMARY_MAROON : "white"}
                      color={p === page ? "white" : "#344054"}
                      borderColor={p === page ? PRIMARY_MAROON : BORDER}
                      onClick={() => setPage(p)}
                      _hover={{
                        bg: p === page ? "#650A18" : "#FFF0F4",
                      }}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#FF5A7D"
                  color={RED}
                  disabled={page === totalPages}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                >
                  Next
                  <Icon as={LuChevronRight} ml={1} boxSize={3.5} />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default DeathReportPage;