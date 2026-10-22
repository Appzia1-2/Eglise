// ContraListPage.jsx

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
  Select,
  Textarea,
} from "@chakra-ui/react";

import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuPencil,
  LuPlus,
  LuSearch,
  LuFilter,
  LuCalendar,
  LuArrowRightLeft,
  LuX,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { listContra, cancelContra } from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ============================================================
// TOAST HELPER
// ============================================================
const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};

// ============================================================
// CONSTANTS
// ============================================================
const TYPE_LABELS = {
  CASH_TO_BANK: { text: "Cash → Bank", scheme: "green" },
  BANK_TO_CASH: { text: "Bank → Cash", scheme: "blue" },
  BANK_TO_BANK: { text: "Bank → Bank", scheme: "purple" },
};

const CANCEL_REASONS = [
  { value: "INCORRECT_ENTRY", label: "Incorrect contra entry" },
  { value: "DUPLICATE", label: "Duplicate contra" },
  { value: "WRONG_AMOUNT", label: "Wrong amount" },
  { value: "WRONG_ACCOUNT", label: "Wrong bank / cash account" },
  { value: "BANK_REJECTED", label: "Bank rejected" },
  { value: "OTHER", label: "Other" },
];

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

const formatDateTime = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// PAGE
// ============================================================
const ContraListPage = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // cancel overlay state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("INCORRECT_ENTRY");
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // ==========================================================
  // LOAD
  // ==========================================================
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await listContra(params);
      const data = res?.data ?? res;
      const items = Array.isArray(data) ? data : data?.results || [];
      setRows(items);
    } catch (err) {
      console.error("Error loading contra:", err);
      setError("Unable to load contra vouchers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // FILTERS
  // ==========================================================
  const filtered = useMemo(() => {
    let result = [...rows];

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const vn = String(r.voucher_number || "").toLowerCase();
        const nr = String(r.narration || "").toLowerCase();
        const fl = String(r.from_ledger_name || "").toLowerCase();
        const tl = String(r.to_ledger_name || "").toLowerCase();
        return (
          vn.includes(q) ||
          nr.includes(q) ||
          fl.includes(q) ||
          tl.includes(q)
        );
      });
    }

    if (!showCancelled) {
      result = result.filter((r) => !r.is_cancelled);
    }

    return result;
  }, [rows, search, showCancelled]);

  // ==========================================================
  // STATS
  // ==========================================================
  const totals = useMemo(() => {
    const active = filtered.filter((r) => !r.is_cancelled);
    return {
      count: active.length,
      amount: active.reduce((s, r) => s + Number(r.amount || 0), 0),
    };
  }, [filtered]);

  // ==========================================================
  // PAGINATION
  // ==========================================================
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = filtered.slice(
    startIndex,
    startIndex + pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, showCancelled]);

  // ==========================================================
  // CANCEL FLOW
  // ==========================================================
  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelReason("INCORRECT_ENTRY");
    setCancelRemarks("");
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (cancelling) return;
    setCancelOpen(false);
    setCancelTarget(null);
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelRemarks.trim()) {
      showToast({
        title: "Remarks required",
        description: "Please explain why this voucher is being cancelled.",
        type: "warning",
        duration: 5000,
      });
      return;
    }
    setCancelling(true);
    try {
      await cancelContra(cancelTarget.id, {
        cancel_reason: cancelReason,
        cancel_remarks: cancelRemarks.trim(),
        acknowledge: true,
      });
      showToast({
        title: "Contra cancelled",
        description: "The voucher was reversed successfully.",
        type: "success",
      });
      closeCancel();
      await load();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        (data && typeof data === "object" && Object.values(data)[0]) ||
        "Cancel failed.";
      showToast({
        title: "Cancel failed",
        description: Array.isArray(msg) ? msg[0] : String(msg),
        type: "error",
        duration: 7000,
      });
    } finally {
      setCancelling(false);
    }
  };

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
        <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text>Activities</Text>
            <Text>/</Text>
            <Text>Accounts</Text>
            <Text>/</Text>
            <Text color={DARK}>Contra</Text>
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
                ACCOUNTS
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Contra Vouchers
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Transfers between Cash and Bank. Not income, not
                expense.
              </Text>
            </Box>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="38px"
              fontSize="12px"
              borderRadius="6px"
              flexShrink={0}
              onClick={() => navigate("/contra/add")}
              _hover={{ bg: "#650A18" }}
            >
              <Icon as={LuPlus} mr={2} boxSize={4} />
              New Contra
            </Button>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuArrowRightLeft}
              title="Total Contra Entries"
              value={totals.count}
            />
            <StatCard
              icon={LuCalendar}
              title="Total Amount Transferred"
              value={`₹ ${fmtINR(totals.amount)}`}
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
            {/* FILTER BAR */}
            <Flex
              gap={3}
              mb={3}
              direction={{ base: "column", md: "row" }}
              flexWrap="wrap"
            >
              {/* SEARCH */}
              <Box
                position="relative"
                flex="1"
                minW={{ base: "100%", md: "260px" }}
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
                  placeholder="Search voucher / narration / ledger"
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

              {/* DATE FROM */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />

              {/* DATE TO */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                h="38px"
                w={{ base: "100%", md: "160px" }}
                borderColor={BORDER}
                borderRadius="6px"
                fontSize="12px"
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />

              {/* SHOW CANCELLED */}
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                px={3}
                h="38px"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                bg="white"
                cursor="pointer"
                onClick={() => setShowCancelled((v) => !v)}
              >
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <Text fontSize="11px" color={DARK} fontWeight="600">
                  Show cancelled
                </Text>
              </Box>

              {/* APPLY */}
              <Button
                bg={PRIMARY_MAROON}
                color="white"
                h="38px"
                px={5}
                fontSize="12px"
                borderRadius="6px"
                onClick={load}
                _hover={{ bg: "#650A18" }}
              >
                Apply
              </Button>

              {/* RESET */}
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
                  setDateFrom("");
                  setDateTo("");
                  setShowCancelled(false);
                  load();
                }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
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
                minW="1000px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {[
                      "Date",
                      "Voucher",
                      "Type",
                      "From (Leaves)",
                      "To (Arrives)",
                      "Amount",
                      "Narration",
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
                        colSpan={8}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading contra vouchers...
                      </Box>
                    </Box>
                  ) : paginatedRows.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={8}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No contra vouchers found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedRows.map((r) => {
                      const t = TYPE_LABELS[r.contra_type] || {
                        text: r.contra_type,
                        scheme: "gray",
                      };
                      return (
                        <Box
                          as="tr"
                          key={r.id}
                          height="42px"
                          opacity={r.is_cancelled ? 0.55 : 1}
                          _hover={{ bg: "#FFFBFC" }}
                        >
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {r.contra_date}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="11px"
                            fontFamily="mono"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {r.voucher_number}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <Box
                              as="span"
                              display="inline-block"
                              px={2}
                              py="2px"
                              borderRadius="full"
                              fontSize="10px"
                              fontWeight="600"
                              bg={
                                t.scheme === "green"
                                  ? "#E6F7EE"
                                  : t.scheme === "blue"
                                  ? "#E6F1FB"
                                  : t.scheme === "purple"
                                  ? "#F1EAFB"
                                  : "#F4F6F9"
                              }
                              color={
                                t.scheme === "green"
                                  ? "#1A7F4B"
                                  : t.scheme === "blue"
                                  ? "#1E5FB7"
                                  : t.scheme === "purple"
                                  ? "#6B3FB5"
                                  : "#344054"
                              }
                            >
                              {t.text}
                            </Box>
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                          >
                            {r.from_ledger_name}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                          >
                            {r.to_ledger_name}
                          </Box>
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
                            ₹ {fmtINR(r.amount)}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color={MUTED}
                            borderBottom="1px solid #E6EAF0"
                            maxW="220px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={r.narration || ""}
                          >
                            {r.narration || "—"}
                          </Box>
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            {r.is_cancelled ? (
                              <Box
                                as="span"
                                display="inline-block"
                                px={2}
                                py="2px"
                                borderRadius="full"
                                fontSize="10px"
                                fontWeight="600"
                                bg="#FFF5F5"
                                color={RED}
                              >
                                Cancelled
                              </Box>
                            ) : (
                              <HStack gap={2}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  h="30px"
                                  color={RED}
                                  px={2}
                                  fontSize="11px"
                                  onClick={() =>
                                    navigate(`/contra/${r.id}/edit`)
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
                                  onClick={() => openCancel(r)}
                                  _hover={{ bg: "#FFF0F4" }}
                                >
                                  <Icon
                                    as={LuX}
                                    mr={1}
                                    boxSize={3.5}
                                  />
                                  Cancel
                                </Button>
                              </HStack>
                            )}
                          </Box>
                        </Box>
                      );
                    })
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
                {filtered.length === 0
                  ? "Showing 0 contra vouchers"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + paginatedRows.length,
                      filtered.length
                    )} of ${filtered.length} contra vouchers`}
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
                      variant={page === safePage ? "solid" : "outline"}
                      bg={page === safePage ? PRIMARY_MAROON : "white"}
                      color={page === safePage ? "white" : "#344054"}
                      borderColor={
                        page === safePage ? PRIMARY_MAROON : BORDER
                      }
                      onClick={() => setCurrentPage(page)}
                      _hover={{
                        bg:
                          page === safePage ? "#650A18" : "#FFF0F4",
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

      {/* CANCEL CONFIRMATION OVERLAY */}
      {cancelOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(24,35,56,0.45)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={closeCancel}
        >
          <Box
            bg="white"
            borderRadius="9px"
            width="100%"
            maxW="460px"
            boxShadow="0 20px 40px rgba(16,24,40,0.18)"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <Flex
              justify="space-between"
              align="center"
              px={5}
              py={4}
              borderBottom="1px solid"
              borderColor={BORDER}
            >
              <Text fontSize="15px" fontWeight="700" color={DARK}>
                Cancel Contra Voucher
              </Text>
              <Button
                size="xs"
                variant="ghost"
                fontSize="16px"
                color={MUTED}
                _hover={{ bg: "#F4F6F9" }}
                onClick={closeCancel}
                isDisabled={cancelling}
              >
                ✕
              </Button>
            </Flex>

            {/* BODY */}
            <Box px={5} py={4}>
              {cancelTarget && (
                <>
                  <Text fontSize="13px" color={MUTED} mb={4}>
                    Voucher{" "}
                    <Text
                      as="span"
                      fontWeight="700"
                      color={DARK}
                      fontFamily="mono"
                    >
                      {cancelTarget.voucher_number}
                    </Text>{" "}
                    for{" "}
                    <Text as="span" fontWeight="700" color={DARK}>
                      ₹ {fmtINR(cancelTarget.amount)}
                    </Text>{" "}
                    will be reversed. This cannot be undone.
                  </Text>

                  <Box mb={3}>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb="8px"
                    >
                      Reason
                    </Text>
                    <Select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      h="42px"
                      fontSize="13px"
                      borderColor={BORDER}
                      borderRadius="7px"
                      _hover={{ borderColor: "#BFC7D4" }}
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    >
                      {CANCEL_REASONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  <Box>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb="8px"
                    >
                      Remarks
                    </Text>
                    <Textarea
                      rows={3}
                      value={cancelRemarks}
                      onChange={(e) =>
                        setCancelRemarks(e.target.value)
                      }
                      placeholder="Explain why this voucher is being cancelled"
                      fontSize="13px"
                      borderColor={BORDER}
                      borderRadius="7px"
                      _hover={{ borderColor: "#BFC7D4" }}
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>

            {/* FOOTER */}
            <Flex
              justify="flex-end"
              gap={2}
              px={5}
              py={3}
              borderTop="1px solid"
              borderColor={BORDER}
            >
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="38px"
                px={6}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                _hover={{ bg: "#FFF5F7" }}
                onClick={closeCancel}
                isDisabled={cancelling}
              >
                Keep
              </Button>
              <Button
                h="38px"
                px={6}
                bg={RED}
                color="white"
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                _hover={{ bg: "#B5132F" }}
                onClick={submitCancel}
                isLoading={cancelling}
                loadingText="Cancelling..."
                isDisabled={!cancelRemarks.trim() || cancelling}
              >
                Cancel Voucher
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      <Footer />
    </Box>
  );
};

export default ContraListPage;