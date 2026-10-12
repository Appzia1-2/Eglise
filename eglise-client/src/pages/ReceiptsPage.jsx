// src/admin/pages/ReceiptsPage.jsx

import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  Badge,
} from "@chakra-ui/react";

import {
  LuSearch,
  LuDownload,
  LuPrinter,
  LuPlus,
  LuRotateCw,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuCircleX,
  LuReceipt,
  LuCircleCheck,
  LuIndianRupee,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toaster } from "../components/ui/toaster";

// ✅ NEW: import the cancel modal
import CancelReceiptModal from "../components/CancelReceiptModal";

import { listReceipts, cancelReceipt } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const PAGE_SIZE = 7;

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (v) => `₹ ${formatMoney(v)}`;

const formatDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ icon, title, value }) => (
  <Box
    border={`1px solid ${BORDER}`}
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
        borderRight={`1px solid ${BORDER}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={7} color={RED} strokeWidth={1.6} />
      </Box>

      <Box pl={4}>
        <Text fontSize="12px" color={DARK} mb={1} fontWeight="600">
          {title}
        </Text>
        <Text
          fontSize={
            typeof value === "string" && value.length > 15 ? "18px" : "24px"
          }
          fontWeight="700"
          color={DARK}
          lineHeight="1"
          whiteSpace="nowrap"
        >
          {value}
        </Text>
      </Box>
    </Flex>
  </Box>
);

/* =========================================================
   MAIN
========================================================= */

const ReceiptsPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [status, setStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // ✅ NEW: cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);

  /* -------------------------------------------------------
     LOAD
  ------------------------------------------------------- */

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (paymentType) params.payment_type = paymentType;
      if (status) params.status = status;

      const res = await listReceipts(params);
      const data = res?.data?.results ?? res?.data ?? [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load receipts.");
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, paymentType, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, paymentType, status]);

  /* -------------------------------------------------------
     STATS
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = receipts.length;
    const posted = receipts.filter((r) => !r.is_cancelled).length;
    const cancelled = receipts.filter((r) => r.is_cancelled).length;
    const totalAmount = receipts
      .filter((r) => !r.is_cancelled)
      .reduce((sum, r) => sum + Number(r.grand_total || 0), 0);
    return { total, posted, cancelled, totalAmount };
  }, [receipts]);

  /* -------------------------------------------------------
     PAGINATION
  ------------------------------------------------------- */

  const total = receipts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = receipts.slice(startIndex, startIndex + PAGE_SIZE);

  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + paginated.length, total);

  /* -------------------------------------------------------
     PAGE NUMBERS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CANCEL — now uses modal (replaces window.prompt)
  ------------------------------------------------------- */

  const openCancel = (receipt) => {
    setCancelTarget(receipt);
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (cancelSaving) return;
    setCancelOpen(false);
    setCancelTarget(null);
  };

  const confirmCancel = async (payload) => {
    if (!cancelTarget) return;
    try {
      setCancelSaving(true);
      await cancelReceipt(cancelTarget.id, payload);
      toaster.create({
        title: "Receipt cancelled",
        description: `${cancelTarget.receipt_number} cancelled.`,
        type: "success",
      });
      setCancelOpen(false);
      setCancelTarget(null);
      await load();
    } catch (err) {
      console.error("Cancel error:", err);
      toaster.create({
        title: "Cancel failed",
        description:
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Unable to cancel receipt.",
        type: "error",
      });
    } finally {
      setCancelSaving(false);
    }
  };

  /* -------------------------------------------------------
     RESET FILTERS
  ------------------------------------------------------- */

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPaymentType("");
    setStatus("");
  };

  /* -------------------------------------------------------
     COLUMNS
  ------------------------------------------------------- */

  const columns = [
    "Receipt No.",
    "Date",
    "Member Name",
    "Ref No.",
    "Payment Details",
    "Particulars",
    "Grand Total",
    "Status",
    "Actions",
  ];

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text
              color={PRIMARY_MAROON}
              cursor="pointer"
              onClick={() => navigate("/activities")}
            >
              Activities
            </Text>
            <Text>/</Text>
            <Text>Receipts</Text>
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
                RECEIPT MANAGEMENT
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Receipts
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Manage and track parish receipts.
              </Text>
            </Box>

            <HStack gap={2} flexShrink={0}>
              <Button
                variant="outline"
                borderColor="#FF5A7D"
                color={RED}
                bg="white"
                h="38px"
                px={4}
                fontSize="12px"
                borderRadius="6px"
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuDownload} mr={2} boxSize={4} />
                Export
              </Button>

              <Button
                variant="outline"
                borderColor="#FF5A7D"
                color={RED}
                bg="white"
                h="38px"
                px={4}
                fontSize="12px"
                borderRadius="6px"
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuPrinter} mr={2} boxSize={4} />
                Print
              </Button>

              <Button
                bg={RED}
                color="white"
                h="38px"
                px={5}
                fontSize="12px"
                borderRadius="6px"
                onClick={() => navigate("/receipts/add")}
                _hover={{ bg: "#B0143A" }}
              >
                <Icon as={LuPlus} mr={2} boxSize={4} />
                Add Receipt
              </Button>
            </HStack>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={3} mb={3}>
            <StatCard
              icon={LuReceipt}
              title="Total Receipts"
              value={stats.total}
            />
            <StatCard
              icon={LuCircleCheck}
              title="Posted"
              value={stats.posted}
            />
            <StatCard
              icon={LuCircleX}
              title="Cancelled"
              value={stats.cancelled}
            />
            <StatCard
              icon={LuIndianRupee}
              title="Total Received"
              value={formatAmount(stats.totalAmount)}
            />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box
            border={`1px solid ${BORDER}`}
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
              wrap="wrap"
            >
              <Box
                position="relative"
                maxW={{ base: "100%", md: "320px" }}
                flex="1"
                minW="240px"
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
                  placeholder="Search receipt number or member"
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

              <Box position="relative" minW="150px">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                />
              </Box>

              <Box position="relative" minW="150px">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                />
              </Box>

              <Box position="relative" minW="160px">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: `1px solid ${BORDER}`,
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
                  <option value="">All Types</option>
                  <option value="BANK">Bank</option>
                  <option value="CASH">Cash</option>
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

              <Box position="relative" minW="150px">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: `1px solid ${BORDER}`,
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
                  <option value="">All Status</option>
                  <option value="POSTED">Posted</option>
                  <option value="CANCELLED">Cancelled</option>
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
                onClick={resetFilters}
              >
                <Icon as={LuRotateCw} mr={2} boxSize={4} />
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
              >
                <Text color="red.600" fontSize="12px">
                  {error}
                </Text>
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
                minW="1180px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px" bg="#F7F9FB">
                    {columns.map((heading) => (
                      <Box
                        as="th"
                        key={heading}
                        textAlign={
                          heading === "Grand Total" || heading === "Actions"
                            ? "right"
                            : "left"
                        }
                        px={4}
                        py={2}
                        fontSize="11px"
                        fontWeight="700"
                        color={DARK}
                        borderBottom="1px solid #E6EAF0"
                        whiteSpace="nowrap"
                        bg="#F7F9FB"
                      >
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {isLoading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={columns.length}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading receipts...
                      </Box>
                    </Box>
                  ) : paginated.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={columns.length}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No receipts found.
                      </Box>
                    </Box>
                  ) : (
                    paginated.map((r) => (
                      <Box
                        as="tr"
                        key={r.id}
                        height="52px"
                        _hover={{ bg: "#FFFBFC" }}
                      >
                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          fontWeight="600"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {r.receipt_number}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDate(r.receipt_date)}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {r.member_name}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {r.ref_no || "—"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {r.payment_details}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                        >
                          {r.particulars}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          fontSize="12px"
                          fontWeight="700"
                          color={DARK}
                          textAlign="right"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatAmount(r.grand_total)}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={2}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <Badge
                            bg={r.is_cancelled ? "#FFF1F3" : "#ECFDF3"}
                            color={r.is_cancelled ? "#D7193F" : "#16804A"}
                            fontSize="10px"
                            px={2}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                          >
                            {r.is_cancelled ? "Cancelled" : "Posted"}
                          </Badge>
                        </Box>

                        {/* ACTIONS */}
                        <Box
                          as="td"
                          px={4}
                          py={2}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <HStack gap={1} justify="flex-end">
                            <IconButton
                              aria-label="View"
                              size="sm"
                              h="30px"
                              w="30px"
                              minW="30px"
                              variant="ghost"
                              color={RED}
                              _hover={{ bg: "#FFF0F4" }}
                              onClick={() => navigate(`/receipts/${r.id}`)}
                            >
                              <LuEye />
                            </IconButton>

                            {!r.is_cancelled && (
                              <IconButton
                                aria-label="Cancel"
                                size="sm"
                                h="30px"
                                w="30px"
                                minW="30px"
                                variant="ghost"
                                color={RED}
                                _hover={{ bg: "#FFF0F4" }}
                                onClick={() => openCancel(r)}   // ✅ changed
                              >
                                <LuCircleX />
                              </IconButton>
                            )}
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
                {total === 0
                  ? "Showing 0 receipts"
                  : `Showing ${rangeStart}–${rangeEnd} of ${total} receipts`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
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
                      variant={page === safePage ? "solid" : "outline"}
                      bg={page === safePage ? PRIMARY_MAROON : "white"}
                      color={page === safePage ? "white" : "#344054"}
                      borderColor={page === safePage ? PRIMARY_MAROON : BORDER}
                      onClick={() => setCurrentPage(page)}
                      _hover={{
                        bg: page === safePage ? "#650A18" : "#FFF0F4",
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
                    setCurrentPage(Math.min(totalPages, safePage + 1))
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

      {/* ✅ NEW: Cancel modal */}
      <CancelReceiptModal
        isOpen={cancelOpen}
        onClose={closeCancel}
        receipt={cancelTarget}
        onConfirm={confirmCancel}
        saving={cancelSaving}
      />
    </Box>
  );
};

export default ReceiptsPage;