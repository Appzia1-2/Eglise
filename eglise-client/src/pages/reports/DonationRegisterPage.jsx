// src/pages/reports/DonationRegisterPage.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import {
  getDonationRegisterReport,
  listFamilyHeads,
  getMyChurch,
} from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";
const LINK_BLUE = "#2B5CE6";

// ============================================================
// ICONS
// ============================================================
const PrinterIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth="1.8" fill="none" />
  </svg>
);
const FilePdfIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <text x="12" y="17" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>PDF</text>
  </svg>
);
const ChevronDownIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CalendarIcon = ({ size = 16, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.7" />
    <path d="M7 3v4M17 3v4M3.5 9.5h17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const SearchIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.3-4.3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CloseIcon = ({ size = 12, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const fmt = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const today = () => new Date().toISOString().split("T")[0];
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const formatDateShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// SEARCHABLE SELECT (generic)
// ============================================================
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  getLabel = (o) => o.label || o.name || "",
  getMeta = (o) => "",
  getValue = (o) => o.id,
  allLabel = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(
    (o) => String(getValue(o)) === String(value)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const label = String(getLabel(o) || "").toLowerCase();
      const meta = String(getMeta(o) || "").toLowerCase();
      return label.includes(q) || meta.includes(q);
    });
  }, [options, query, getLabel, getMeta]);

  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(String(getValue(option)));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handlePickAll = () => {
    onChange("");
    setIsOpen(false);
    setQuery("");
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      {isOpen ? (
        <Box position="relative">
          <Box
            position="absolute"
            left="11px"
            top="50%"
            transform="translateY(-50%)"
            pointerEvents="none"
            zIndex={1}
          >
            <SearchIcon />
          </Box>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            pl="34px"
            pr="34px"
            h="40px"
            fontSize="12px"
            borderColor={PRIMARY_RED}
            borderRadius="6px"
            bg="white"
            _focus={{
              borderColor: PRIMARY_RED,
              boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
              } else if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <Box
            position="absolute"
            right="11px"
            top="50%"
            transform="translateY(-50%)"
            cursor="pointer"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            zIndex={1}
          >
            <CloseIcon />
          </Box>
        </Box>
      ) : (
        <Flex
          onClick={() => setIsOpen(true)}
          h="40px"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
          px="11px"
          align="center"
          justify="space-between"
          cursor="pointer"
          bg="white"
          _hover={{ borderColor: SECONDARY_TEXT }}
        >
          <Text
            fontSize="12px"
            color={selected ? TEXT_COLOR : SECONDARY_TEXT}
            noOfLines={1}
          >
            {selected ? getLabel(selected) : placeholder}
          </Text>
          <HStack gap={1} flexShrink={0}>
            {selected && (
              <Box
                as="span"
                onClick={handleClear}
                cursor="pointer"
                display="inline-flex"
                alignItems="center"
                _hover={{ opacity: 0.7 }}
              >
                <CloseIcon />
              </Box>
            )}
            <ChevronDownIcon color={TEXT_COLOR} />
          </HStack>
        </Flex>
      )}

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
          boxShadow="0 6px 20px rgba(0,0,0,0.12)"
          maxH="280px"
          overflowY="auto"
          zIndex={30}
        >
          {allLabel && !query && (
            <Box
              px={3}
              py={2}
              fontSize="12px"
              fontWeight={!value ? "600" : "500"}
              color={TEXT_COLOR}
              cursor="pointer"
              bg={!value ? "#FDF2F5" : "white"}
              _hover={{ bg: "#F7F9FB" }}
              onClick={handlePickAll}
            >
              {allLabel}
            </Box>
          )}

          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={SECONDARY_TEXT}>
                No matches
              </Text>
            </Box>
          ) : (
            filtered.map((o) => {
              const isSelected = String(getValue(o)) === String(value);
              const meta = getMeta(o);
              return (
                <Box
                  key={getValue(o)}
                  px={3}
                  py={2}
                  fontSize="12px"
                  color={TEXT_COLOR}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(o)}
                >
                  <Text fontWeight={isSelected ? "600" : "500"}>
                    {getLabel(o)}
                  </Text>
                  {meta && (
                    <Text fontSize="10px" color={SECONDARY_TEXT}>
                      {meta}
                    </Text>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

// ============================================================
// DONATION TABLE
// ============================================================
const DonationTable = ({ rows, forPrint = false }) => {
  const headerBg = forPrint ? "#F4D8DE" : "#F7F9FB";
  const headerColor = forPrint ? DARK_RED : TEXT_COLOR;
  const stripeBg = forPrint ? "#FCF2F4" : "#FAFBFC";
  const rowBorder = forPrint ? "#E8B4C0" : BORDER_COLOR;
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <Box
      border={`1px solid ${rowBorder}`}
      borderRadius={forPrint ? "0" : "10px"}
      overflow="hidden"
    >
      <Box
        as="table"
        width="100%"
        borderCollapse="collapse"
        fontSize={forPrint ? "11px" : "12px"}
        fontFamily={forPrint ? "Georgia, serif" : "inherit"}
      >
        <Box as="thead">
          <Box as="tr" bg={headerBg}>
            {[
              { label: "Date", align: "left" },
              { label: "Receipt Number", align: "left" },
              {
                label: forPrint
                  ? "Family Name / Member Name"
                  : "Donor / Member",
                align: "left",
              },
              { label: "Donation Type", align: "left" },
              { label: "Payment Mode", align: "left" },
              { label: "Reference Number", align: "left" },
              { label: "Amount (₹)", align: "right" },
            ].map((col) => (
              <Box
                as="th"
                key={col.label}
                textAlign={col.align}
                px={3}
                py={3}
                fontSize="11px"
                fontWeight="700"
                color={headerColor}
                borderBottom={`1px solid ${rowBorder}`}
                letterSpacing="0.3px"
              >
                {col.label}
              </Box>
            ))}
          </Box>
        </Box>
        <Box as="tbody">
          {rows.map((r, idx) => (
            <Box
              as="tr"
              key={r.id ?? idx}
              bg={idx % 2 === 1 ? stripeBg : "white"}
              borderBottom={`1px solid ${rowBorder}`}
            >
              <Box
                as="td"
                px={3}
                py={2.5}
                color={TEXT_COLOR}
                whiteSpace="nowrap"
              >
                {formatDateShort(r.date)}
              </Box>
              <Box
                as="td"
                px={3}
                py={2.5}
                color={TEXT_COLOR}
                whiteSpace="nowrap"
              >
                {r.receipt_number}
              </Box>
              <Box as="td" px={3} py={2.5}>
                {forPrint ? (
                  <Box>
                    <Text fontSize="11px" color={TEXT_COLOR} fontWeight="600">
                      {r.family_name}
                    </Text>
                    <Text fontSize="11px" color={TEXT_COLOR}>
                      {r.donor_name}
                    </Text>
                  </Box>
                ) : (
                  <Text fontSize="12px" color={LINK_BLUE} fontWeight="500">
                    {r.donor_name}
                  </Text>
                )}
              </Box>
              <Box as="td" px={3} py={2.5}>
                <Text fontSize={forPrint ? "11px" : "12px"} color={LINK_BLUE}>
                  {r.donation_type}
                </Text>
              </Box>
              <Box as="td" px={3} py={2.5}>
                <Text
                  fontSize={forPrint ? "11px" : "12px"}
                  color={forPrint ? TEXT_COLOR : LINK_BLUE}
                >
                  {r.payment_mode}
                </Text>
              </Box>
              <Box as="td" px={3} py={2.5}>
                <Text fontSize={forPrint ? "11px" : "12px"} color={LINK_BLUE}>
                  {r.reference_number || "—"}
                </Text>
              </Box>
              <Box
                as="td"
                px={3}
                py={2.5}
                textAlign="right"
                fontWeight="600"
                color={TEXT_COLOR}
                whiteSpace="nowrap"
              >
                {fmt(r.amount)}
              </Box>
            </Box>
          ))}
          <Box
            as="tr"
            bg={forPrint ? "#F5CED8" : "#F5F7FA"}
            borderTop={`2px solid ${rowBorder}`}
          >
            <Box as="td" colSpan={6} px={3} py={3} textAlign="right">
              <Text
                fontSize="12px"
                fontWeight="700"
                color={forPrint ? DARK_RED : BLUE}
                letterSpacing="0.3px"
              >
                Total Donation
              </Text>
            </Box>
            <Box
              as="td"
              px={3}
              py={3}
              textAlign="right"
              fontWeight="700"
              color={forPrint ? DARK_RED : BLUE}
              fontSize="12px"
              whiteSpace="nowrap"
            >
              {fmt(total)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================
// FILTER CONSTANTS
// ============================================================
const SORT_OPTIONS = [
  "Newest First",
  "Oldest First",
  "Amount (High to Low)",
  "Amount (Low to High)",
];
const PAYMENT_MODES = [
  "All Modes",
  "Cash",
  "UPI",
  "Card",
  "Cheque",
  "Bank Transfer",
];
const MODE_TO_VALUE = {
  Cash: "CASH",
  UPI: "UPI",
  Card: "CARD",
  Cheque: "CHEQUE",
  "Bank Transfer": "BANK_TRANSFER",
};

// ============================================================
// PAGE
// ============================================================
const DonationRegisterPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [church, setChurch] = useState({});

  const [donorId, setDonorId] = useState("");
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, cRes] = await Promise.all([
          listFamilyHeads(),
          getMyChurch(),
        ]);
        const memberList = mRes?.data?.results ?? mRes?.data ?? [];
        setMembers(Array.isArray(memberList) ? memberList : []);
        setChurch(cRes?.data ?? {});
      } catch (err) {
        console.error("Donation register options load error:", err);
      }
    };
    load();
  }, []);

  const fetchData = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setPageError("Date From cannot be later than Date To.");
      setRows([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const params = {
        from: dateFrom,
        to: dateTo,
        sort: sortBy,
      };
      if (donorId) params.member_id = donorId;
      if (paymentMode !== PAYMENT_MODES[0])
        params.mode = MODE_TO_VALUE[paymentMode];
      const res = await getDonationRegisterReport(params);
      const data = res?.data ?? {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotal(Number(data.total || 0));
    } catch (err) {
      console.error("Donation register fetch error:", err);
      setPageError("Unable to load donation register.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only fetch on mount. The Filter button triggers subsequent fetches.
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodLabel = `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`;

  // Member picker options
  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        name: m.name,
        family_name: m.family_name || "",
        house_name: m.house_name || "",
      })),
    [members]
  );

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text
            color={BLUE}
            cursor="pointer"
            onClick={() => navigate("/reports")}
          >
            Reports
          </Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Donation Register</Text>
        </HStack>

        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={4}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={PRIMARY_RED}
              letterSpacing="0.4px"
              mb={1}
            >
              DONATION REGISTER REPORT
            </Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>
              Donation Register
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">
              View and track all donations received by the parish.
            </Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={() => setPrintOpen(true)}
              _hover={{ bg: "#FFF5F7" }}
              leftIcon={<PrinterIcon />}
            >
              Print
            </Button>
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={() => setPrintOpen(true)}
              _hover={{ bg: "#FFF5F7" }}
              leftIcon={<FilePdfIcon />}
            >
              Generate PDF
            </Button>
          </HStack>
        </Flex>

        {/* FILTERS */}
        <Box
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="10px"
          px={{ base: 4, md: 5 }}
          py={4}
          mb={4}
          bg="white"
        >
          <Flex
            gap={4}
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "flex-end" }}
            wrap="wrap"
          >
            {/* DONOR — searchable */}
            <Box flex="1.2" minW="240px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Family Name / Member Name
              </Text>
              <SearchableSelect
                options={memberOptions}
                value={donorId}
                onChange={setDonorId}
                placeholder="All Families / Members"
                searchPlaceholder="Search donor..."
                getLabel={(o) => o.name}
                getMeta={(o) =>
                  [o.family_name, o.house_name].filter(Boolean).join(" • ")
                }
                getValue={(o) => o.id}
                allLabel="All Families / Members"
              />
            </Box>

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date From
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  h="40px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  color={TEXT_COLOR}
                />
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="150px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Date To
              </Text>
              <Box position="relative">
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={today()}
                  onChange={(e) => setDateTo(e.target.value)}
                  h="40px"
                  fontSize="12px"
                  borderColor={BORDER_COLOR}
                  borderRadius="6px"
                  color={TEXT_COLOR}
                />
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Payment Mode
              </Text>
              <Box position="relative">
                <Box
                  as="select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  width="100%"
                  height="40px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  border={`1px solid ${BORDER_COLOR}`}
                  borderRadius="6px"
                  bg="white"
                  appearance="none"
                  px="11px"
                  outline="none"
                  cursor="pointer"
                >
                  {PAYMENT_MODES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Box>
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <ChevronDownIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>
                Sort By
              </Text>
              <Box position="relative">
                <Box
                  as="select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  width="100%"
                  height="40px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  border={`1px solid ${BORDER_COLOR}`}
                  borderRadius="6px"
                  bg="white"
                  appearance="none"
                  px="11px"
                  outline="none"
                  cursor="pointer"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Box>
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <ChevronDownIcon />
                </Box>
              </Box>
            </Box>

            <Box flexShrink={0}>
              <Button
                h="40px"
                px={10}
                bg="white"
                border={`1px solid ${PRIMARY_RED}`}
                color={PRIMARY_RED}
                fontSize="12px"
                fontWeight="600"
                borderRadius="6px"
                onClick={fetchData}
                _hover={{ bg: "#FFF5F7" }}
              >
                Filter
              </Button>
            </Box>
          </Flex>
        </Box>

        {pageError && (
          <Box
            mb={4}
            p={3}
            borderRadius="6px"
            bg="#FFF5F5"
            border="1px solid #FED7D7"
          >
            <Text color="red.600" fontSize="12px">
              {pageError}
            </Text>
          </Box>
        )}

        {loading ? (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text color={SECONDARY_TEXT} fontSize="12px">
              Loading donation register…
            </Text>
          </Box>
        ) : rows.length === 0 ? (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">
              No donations found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>
              Try changing filters or the date range.
            </Text>
          </Box>
        ) : (
          <DonationTable rows={rows} />
        )}

        <Flex
          mt={4}
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={2}
        >
          <Text color={SECONDARY_TEXT} fontSize="12px">
            Showing 1–{rows.length} of {rows.length} records
          </Text>
        </Flex>
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="DONATION REGISTER"
        church={church}
        subtitle={
          <>
            <Text as="span" fontWeight="700">
              Period:
            </Text>{" "}
            {periodLabel}
          </>
        }
      >
        <DonationTable rows={rows} forPrint />
      </ChurchPrintModal>
    </Box>
  );
};

export default DonationRegisterPage;