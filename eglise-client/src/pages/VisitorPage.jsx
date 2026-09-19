// src/pages/VisitorPage.jsx

import React, { useEffect, useMemo, useState } from "react";
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
  LuCalendarDays,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFileText,
  LuFilter,
  LuPencil,
  LuPlus,
  LuPrinter,
  LuSearch,
  LuUsers,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { listVisitors } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ==========================================================
// HELPERS
// ==========================================================

const getArray = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const VisitorPage = () => {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadVisitors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listVisitors();
      setVisitors(getArray(response));
    } catch (err) {
      console.error("Error loading visitors:", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load visitors."
      );
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredVisitors = useMemo(() => {
    let result = [...visitors];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((visitor) =>
        [
          visitor.visitor_name,
          visitor.reason_to_visit,
          visitor.visitor_address,
          visitor.remarks,
          visitor.visitor_date,
        ]
          .filter(Boolean)
          .some((item) =>
            String(item).toLowerCase().includes(searchText)
          )
      );
    }

    if (filter === "TODAY") {
      const today = getTodayString();
      result = result.filter(
        (visitor) => visitor.visitor_date === today
      );
    }

    if (filter === "THIS_MONTH") {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      result = result.filter((visitor) => {
        if (!visitor.visitor_date) return false;
        const date = new Date(`${visitor.visitor_date}T00:00:00`);
        if (Number.isNaN(date.getTime())) return false;
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      });
    }

    if (filter === "RECENTLY_UPDATED") {
      const now = new Date();
      const sevenDaysAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      result = result.filter((visitor) => {
        if (!visitor.updated_at) return false;
        const updated = new Date(visitor.updated_at);
        if (Number.isNaN(updated.getTime())) return false;
        return updated >= sevenDaysAgo && updated <= now;
      });
    }

    return result;
  }, [visitors, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVisitors.length / pageSize)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const paginatedVisitors = filteredVisitors.slice(
    startIndex,
    startIndex + pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalVisits = visitors.length;

  const visitorsToday = useMemo(() => {
    const today = getTodayString();
    return visitors.filter(
      (visitor) => visitor.visitor_date === today
    ).length;
  }, [visitors]);

  const visitorsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return visitors.filter((visitor) => {
      if (!visitor.visitor_date) return false;
      const date = new Date(`${visitor.visitor_date}T00:00:00`);
      if (Number.isNaN(date.getTime())) return false;
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    }).length;
  }, [visitors]);

  // ==========================================================
  // PRINT ALL
  // ==========================================================

  const handlePrintAll = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=800"
    );

    if (!printWindow) {
      alert("Please allow popups for printing.");
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const rows = visitors
      .map(
        (visitor, index) => `
          <tr>
            <td class="td-index">${index + 1}</td>
            <td class="td-date">${escapeHtml(
              formatDate(visitor.visitor_date)
            )}</td>
            <td class="td-name">${escapeHtml(
              visitor.visitor_name || "-"
            )}</td>
            <td>${escapeHtml(
              visitor.visitor_address || "-"
            )}</td>
            <td>${escapeHtml(
              visitor.reason_to_visit || "-"
            )}</td>
            <td>${escapeHtml(
              visitor.remarks || "-"
            )}</td>
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
          <title>Visitor Register Report</title>

          <style>
            @page {
              size: A4 landscape;
              margin: 14mm 12mm;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: "Segoe UI", Arial, sans-serif;
              color: #1a1a1a;
              font-size: 10.5px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* ================= HEADER ================= */

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 14px;
              border-bottom: 2px solid #b8132f;
              margin-bottom: 18px;
            }

            .header-left .org {
              font-size: 9.5px;
              color: #b8132f;
              font-weight: 700;
              letter-spacing: 1.2px;
              text-transform: uppercase;
              margin-bottom: 6px;
            }

            .header-left h1 {
              font-size: 20px;
              font-weight: 700;
              color: #1a1a1a;
              letter-spacing: 0.2px;
              margin-bottom: 3px;
            }

            .header-left .subtitle {
              font-size: 10.5px;
              color: #6b7280;
            }

            .header-right {
              text-align: right;
              font-size: 9.5px;
              color: #6b7280;
              line-height: 1.6;
            }

            .header-right .row {
              display: flex;
              justify-content: flex-end;
              gap: 6px;
            }

            .header-right .label {
              color: #9ca3af;
              font-weight: 500;
            }

            .header-right .value {
              color: #1a1a1a;
              font-weight: 600;
            }

            /* ================= TABLE ================= */

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            thead th {
              background: #b8132f;
              color: #ffffff;
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              padding: 8px 8px;
              text-align: left;
              border: none;
            }

            thead th:first-child {
              border-top-left-radius: 4px;
            }

            thead th:last-child {
              border-top-right-radius: 4px;
            }

            tbody td {
              padding: 8px 8px;
              font-size: 10px;
              color: #333333;
              border-bottom: 1px solid #e8ebf0;
              vertical-align: top;
              word-wrap: break-word;
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            tbody tr:nth-child(even) {
              background: #fafbfc;
            }

            /* Column widths */
            .col-index   { width: 38px; text-align: center; }
            .col-date    { width: 90px; }
            .col-name    { width: 150px; }
            .col-address { width: 200px; }
            .col-purpose { width: 190px; }

            .td-index {
              text-align: center;
              color: #9ca3af;
              font-weight: 600;
            }

            .td-date {
              color: #374151;
              font-weight: 500;
              white-space: nowrap;
            }

            .td-name {
              font-weight: 600;
              color: #1a1a1a;
            }

            .empty {
              text-align: center;
              padding: 40px 20px;
              color: #9ca3af;
              font-size: 11px;
            }

            /* ================= TOTALS ================= */

            .totals {
              margin-top: 14px;
              display: flex;
              justify-content: flex-end;
            }

            .totals .total-box {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 8px 14px;
              background: #f4f5f7;
              border-radius: 4px;
              font-size: 10px;
            }

            .totals .total-box .label {
              color: #6b7280;
              font-weight: 500;
            }

            .totals .total-box .value {
              color: #b8132f;
              font-weight: 700;
              font-size: 12px;
            }

            /* ================= FOOTER ================= */

            .footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #e8ebf0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #9ca3af;
            }

            .footer .signature {
              text-align: center;
              color: #6b7280;
            }

            .footer .signature .line {
              width: 140px;
              border-top: 1px solid #9ca3af;
              margin-bottom: 5px;
            }

            @media print {
              body { padding: 0; }
            }
          </style>
        </head>

        <body>
          <!-- HEADER -->
          <div class="header">
            <div class="header-left">
              <div class="org">Church Management System</div>
              <h1>Visitor Register Report</h1>
              <div class="subtitle">
                Complete list of recorded church visitors
              </div>
            </div>

            <div class="header-right">
              <div class="row">
                <span class="label">Printed:</span>
                <span class="value">${printedOn}</span>
              </div>
              <div class="row">
                <span class="label">Total Records:</span>
                <span class="value">${visitors.length}</span>
              </div>
            </div>
          </div>

          <!-- TABLE -->
          <table>
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th class="col-date">Visit Date</th>
                <th class="col-name">Visitor Name</th>
                <th class="col-address">Address</th>
                <th class="col-purpose">Purpose</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="6" class="empty">No visitor records found.</td></tr>`
              }
            </tbody>
          </table>

          <!-- TOTALS -->
          <div class="totals">
            <div class="total-box">
              <span class="label">Total Records</span>
              <span class="value">${visitors.length}</span>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <div>
              Generated from Church Management System
            </div>

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

  // ==========================================================
  // STAT CARD
  // ==========================================================

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
          <Icon
            as={icon}
            boxSize={8}
            color={RED}
            strokeWidth={1.6}
          />
        </Box>

        <Box pl={4}>
          <Text
            fontSize="12px"
            color={DARK}
            mb={1}
            fontWeight="600"
          >
            {title}
          </Text>

          <Text
            fontSize="24px"
            fontWeight="700"
            color={DARK}
            lineHeight="1"
          >
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );

  // ==========================================================
  // PAGINATION NUMBERS
  // ==========================================================

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (safePage > 3) pages.push("...");

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (safePage < totalPages - 2) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" w="100%">
        <Box
          w="100%"
          px={{ base: 3, md: 4 }}
          py={{ base: 3, md: 4 }}
        >
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Visitor Register</Text>
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
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                VISITOR REGISTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Visitor Register
              </Heading>

              <Text color={MUTED} fontSize="11px">
                Manage and track church visitor records.
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
                onClick={handlePrintAll}
                _hover={{ bg: "#F7F9FC" }}
              >
                <Icon as={LuPrinter} mr={2} boxSize={4} />
                Print All
              </Button>

              <Button
                bg={PRIMARY_MAROON}
                color="white"
                px={5}
                h="38px"
                fontSize="12px"
                borderRadius="6px"
                onClick={() => navigate("/visitors/add")}
                _hover={{ bg: "#650A18" }}
              >
                <Icon as={LuPlus} mr={2} boxSize={4} />
                Add Visitor
              </Button>
            </HStack>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuUsers}
              title="Total Visits"
              value={totalVisits}
            />

            <StatCard
              icon={LuCalendarDays}
              title="Visitors Today"
              value={visitorsToday}
            />

            <StatCard
              icon={LuFileText}
              title="This Month"
              value={visitorsThisMonth}
            />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            p={3}
            bg="white"
            w="100%"
          >
            {/* SEARCH / FILTER */}
            <Flex
              gap={3}
              mb={3}
              direction={{ base: "column", md: "row" }}
            >
              <Box
                position="relative"
                maxW={{ base: "100%", md: "380px" }}
                flex="1"
              >
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search visitors"
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

              <Box
                position="relative"
                width={{ base: "100%", md: "210px" }}
              >
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
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
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="ALL">All Records</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="RECENTLY_UPDATED">
                    Recently Updated
                  </option>
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
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
                Filter
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

                <Button
                  size="xs"
                  variant="outline"
                  onClick={loadVisitors}
                >
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
              <Box
                as="table"
                width="100%"
                minW="1050px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {[
                      "Visit Date",
                      "Visitor Name",
                      "Address",
                      "Purpose",
                      "Remarks",
                      "Actions",
                    ].map((heading) => (
                      <Box
                        as="th"
                        key={heading}
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
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {loading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={6}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading visitors...
                      </Box>
                    </Box>
                  ) : paginatedVisitors.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={6}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No visitors found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedVisitors.map((visitor) => (
                      <Box
                        as="tr"
                        key={visitor.id}
                        height="42px"
                        _hover={{ bg: "#FFFBFC" }}
                      >
                        {/* VISIT DATE */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDate(visitor.visitor_date)}
                        </Box>

                        {/* VISITOR NAME */}
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
                          {visitor.visitor_name || "-"}
                        </Box>

                        {/* ADDRESS */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          minW="180px"
                        >
                          {visitor.visitor_address || "-"}
                        </Box>

                        {/* PURPOSE */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          minW="180px"
                        >
                          {visitor.reason_to_visit || "-"}
                        </Box>

                        {/* REMARKS */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          fontSize="12px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          minW="160px"
                        >
                          {visitor.remarks || "-"}
                        </Box>

                        {/* ACTIONS */}
                        <Box
                          as="td"
                          px={4}
                          py={1}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <HStack gap={2}>
                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color={RED}
                              px={2}
                              fontSize="11px"
                              onClick={() =>
                                navigate(`/visitors/${visitor.id}`)
                              }
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <Icon
                                as={LuEye}
                                mr={1}
                                boxSize={3.5}
                              />
                              View
                            </Button>

                            <Box
                              h="20px"
                              borderLeft="1px solid #DCE2EA"
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              h="30px"
                              color={RED}
                              px={2}
                              fontSize="11px"
                              onClick={() =>
                                navigate(
                                  `/visitors/${visitor.id}/edit`
                                )
                              }
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <Icon
                                as={LuPencil}
                                mr={1}
                                boxSize={3.5}
                              />
                              Edit
                            </Button>
                          </HStack>
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
                {filteredVisitors.length === 0
                  ? "Showing 0 visitors"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + paginatedVisitors.length,
                      filteredVisitors.length
                    )} of ${filteredVisitors.length} visitors`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={safePage === 1}
                  onClick={() =>
                    setCurrentPage(Math.max(1, safePage - 1))
                  }
                >
                  <Icon as={LuChevronLeft} boxSize={3.5} />
                  Previous
                </Button>

                {renderPages().map((page, index) =>
                  page === "..." ? (
                    <Text
                      key={`dots-${index}`}
                      px={1.5}
                      fontSize="11px"
                      color={MUTED}
                    >
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      size="xs"
                      h="30px"
                      minW="30px"
                      variant={
                        page === safePage ? "solid" : "outline"
                      }
                      bg={
                        page === safePage
                          ? PRIMARY_MAROON
                          : "white"
                      }
                      color={
                        page === safePage ? "white" : "#344054"
                      }
                      borderColor={
                        page === safePage
                          ? PRIMARY_MAROON
                          : BORDER
                      }
                      onClick={() => setCurrentPage(page)}
                      _hover={{
                        bg:
                          page === safePage
                            ? "#650A18"
                            : "#FFF0F4",
                      }}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#FF5A7D"
                  color={RED}
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setCurrentPage(
                      Math.min(totalPages, safePage + 1)
                    )
                  }
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

export default VisitorPage;