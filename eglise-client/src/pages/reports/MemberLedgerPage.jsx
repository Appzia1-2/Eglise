// src/pages/reports/MemberLedgerPage.jsx

import React, { useEffect, useMemo, useState, useRef } from "react";
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
  getMemberLedgerReport,
  listMembers,
  getMyChurch,
} from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

// ------------------------------------------------------------
// Icons
// ------------------------------------------------------------
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

const CalendarIcon = ({ size = 16, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.7" />
    <path d="M7 3v4M17 3v4M3.5 9.5h17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

// ------------------------------------------------------------
// Formatting helpers
// ------------------------------------------------------------
const formatCurrency = (n) =>
  n == null || n === ""
    ? "—"
    : "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

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

const today = () => new Date().toISOString().split("T")[0];
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

// ------------------------------------------------------------
// Row normalizer
// ------------------------------------------------------------
const normalizeRow = (row) => {
  const hasSplitFields = row.debit !== undefined || row.credit !== undefined;
  if (hasSplitFields) {
    return {
      ...row,
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
    };
  }
  const amt = Number(row.amount || 0);
  const dir = String(row.direction || "").toUpperCase();
  return {
    ...row,
    debit: dir === "DEBIT" ? amt : 0,
    credit: dir === "CREDIT" ? amt : 0,
  };
};

// ------------------------------------------------------------
// Searchable Member Picker
// ------------------------------------------------------------
const SearchableMemberPicker = ({
  members,
  value,
  onChange,
  placeholder = "Select member",
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedMember = members.find((m) => String(m.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = String(m.name || "").toLowerCase();
      const family = String(m.family_name || "").toLowerCase();
      const house = String(m.house_name || "").toLowerCase();
      const phone = String(m.mobile_no || "").toLowerCase();
      return (
        name.includes(q) ||
        family.includes(q) ||
        house.includes(q) ||
        phone.includes(q)
      );
    });
  }, [members, query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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

  const handleSelect = (member) => {
    onChange(String(member.id));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      {isOpen ? (
        <Box position="relative">
          <Box position="absolute" left="11px" top="50%" transform="translateY(-50%)" pointerEvents="none" zIndex={1}>
            <SearchIcon />
          </Box>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member..."
            pl="34px"
            pr="34px"
            h="40px"
            fontSize="12px"
            borderColor={PRIMARY_RED}
            borderRadius="6px"
            bg="white"
            _focus={{ borderColor: PRIMARY_RED, boxShadow: `0 0 0 1px ${PRIMARY_RED}` }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
              } else if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <Box position="absolute" right="11px" top="50%" transform="translateY(-50%)" cursor="pointer" onClick={() => { setIsOpen(false); setQuery(""); }} zIndex={1}>
            <CloseIcon />
          </Box>
        </Box>
      ) : (
        <Flex
          onClick={() => !loading && setIsOpen(true)}
          h="40px"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
          px="11px"
          align="center"
          justify="space-between"
          cursor={loading ? "not-allowed" : "pointer"}
          bg={loading ? "#F7F9FB" : "white"}
          _hover={{ borderColor: loading ? BORDER_COLOR : SECONDARY_TEXT }}
        >
          <Text fontSize="12px" color={selectedMember ? TEXT_COLOR : SECONDARY_TEXT} noOfLines={1}>
            {loading ? "Loading members…" : selectedMember?.name || placeholder}
          </Text>
          <HStack gap={1} flexShrink={0}>
            {selectedMember && !loading && (
              <Box as="span" onClick={handleClear} cursor="pointer" display="inline-flex" alignItems="center" _hover={{ opacity: 0.7 }}>
                <CloseIcon />
              </Box>
            )}
            <ChevronDownIcon color={TEXT_COLOR} />
          </HStack>
        </Flex>
      )}

      {isOpen && (
        <Box position="absolute" top="calc(100% + 4px)" left={0} right={0} bg="white" border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" boxShadow="0 6px 20px rgba(0,0,0,0.12)" maxH="280px" overflowY="auto" zIndex={30}>
          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={SECONDARY_TEXT}>No members found</Text>
            </Box>
          ) : (
            filtered.map((m) => {
              const isSelected = String(m.id) === String(value);
              const meta = [m.family_name, m.house_name].filter(Boolean).join(" • ");
              return (
                <Box key={m.id} px={3} py={2} fontSize="12px" color={TEXT_COLOR} cursor="pointer" bg={isSelected ? "#FDF2F5" : "white"} _hover={{ bg: "#F7F9FB" }} onClick={() => handleSelect(m)}>
                  <Text fontWeight={isSelected ? "600" : "500"}>{m.name}</Text>
                  {meta && <Text fontSize="10px" color={SECONDARY_TEXT}>{meta}</Text>}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
const MemberLedgerPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [church, setChurch] = useState({});
  const [selectedMember, setSelectedMember] = useState("");
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const [opening, setOpening] = useState(0);
  const [rawRows, setRawRows] = useState([]);
  const [totals, setTotals] = useState({ credit: 0, debit: 0, closing: 0 });

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setOptionsLoading(true);
        const [mRes, cRes] = await Promise.all([listMembers(), getMyChurch()]);
        const memberList = mRes?.data?.results ?? mRes?.data ?? [];
        setMembers(Array.isArray(memberList) ? memberList : []);
        setChurch(cRes?.data ?? {});
        if (memberList.length > 0) {
          setSelectedMember(String(memberList[0].id));
        }
      } catch (err) {
        console.error("Load options error:", err);
        setPageError("Unable to load members or church info.");
      } finally {
        setOptionsLoading(false);
      }
    };
    load();
  }, []);

  const fetchReport = async () => {
    if (!selectedMember) return;
    try {
      setLoading(true);
      setPageError("");
      const res = await getMemberLedgerReport({
        member: selectedMember,
        from: dateFrom,
        to: dateTo,
      });
      const data = res?.data ?? {};
      setOpening(Number(data.opening_balance || 0));
      setRawRows(Array.isArray(data.rows) ? data.rows : []);
      setTotals({
        credit: Number(data?.totals?.credit || 0),
        debit: Number(data?.totals?.debit || 0),
        closing: Number(data?.totals?.closing || 0),
      });
    } catch (err) {
      console.error("Member ledger fetch error:", err);
      setPageError("Unable to load member ledger.");
      setRawRows([]);
      setOpening(0);
      setTotals({ credit: 0, debit: 0, closing: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMember, dateFrom, dateTo]);

  const rows = useMemo(() => rawRows.map(normalizeRow), [rawRows]);

  const memberName = members.find((m) => String(m.id) === String(selectedMember))?.name || "";
  const periodLabel = `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`;

  // ✅ Split opening/closing by sign so they land in the correct column
  const openingIsCredit = opening >= 0;
  const openingAmount = Math.abs(opening);

  const closingIsCredit = totals.closing >= 0;
  const closingAmount = Math.abs(totals.closing);

  const LedgerTable = ({ forPrint = false }) => {
    const headerBg = forPrint ? "#F4D8DE" : "#F7F9FB";
    const headerColor = forPrint ? DARK_RED : TEXT_COLOR;
    const rowBorder = forPrint ? "#E8B4C0" : BORDER_COLOR;
    const stripeBg = forPrint ? "#FCF2F4" : "#FAFBFC";

    return (
      <Box border={`1px solid ${rowBorder}`} overflow="hidden">
        <Box as="table" width="100%" borderCollapse="collapse" fontSize={forPrint ? "11px" : "12px"} fontFamily={forPrint ? "Georgia, serif" : "inherit"}>
          <Box as="thead">
            <Box as="tr" bg={headerBg}>
              {[
                "Date",
                "Voucher Number",
                "Account Ledger",
                "Cash / Bank Account",
                "Debit (₹)",     // ✅ Debit first (matches all other reports)
                "Credit (₹)",    // ✅ Credit second
              ].map((label, i) => (
                <Box
                  as="th"
                  key={label}
                  textAlign={i >= 4 ? "right" : "left"}
                  px={3}
                  py={2.5}
                  fontSize="11px"
                  fontWeight="700"
                  color={headerColor}
                  borderBottom={`1px solid ${rowBorder}`}
                >
                  {label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box as="tbody">
            {/* OPENING — placed by sign */}
            <Box as="tr" bg={forPrint ? "#FBE9ED" : "#F5F7FA"}>
              <Box as="td" colSpan={4} px={3} py={2}>
                <Text fontWeight="600" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Opening Cumulative
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2} color={forPrint ? DARK_RED : BLUE} fontWeight="700">
                {openingIsCredit ? "—" : formatCurrency(openingAmount)}
              </Box>
              <Box as="td" textAlign="right" px={3} py={2} color={forPrint ? DARK_RED : BLUE} fontWeight="700">
                {openingIsCredit ? formatCurrency(openingAmount) : "—"}
              </Box>
            </Box>

            {/* ROWS */}
            {rows.map((row, idx) => (
              <Box as="tr" key={row.id ?? idx} bg={idx % 2 === 1 ? stripeBg : "white"} borderBottom={`1px solid ${rowBorder}`}>
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>{formatDateShort(row.date)}</Box>
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>{row.voucher || "—"}</Box>
                <Box as="td" px={3} py={2} color={forPrint ? DARK_RED : BLUE}>{row.ledger_name || "—"}</Box>
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>{row.cash_bank || "—"}</Box>
                <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>{row.debit ? formatCurrency(row.debit) : "—"}</Box>
                <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>{row.credit ? formatCurrency(row.credit) : "—"}</Box>
              </Box>
            ))}

            {/* TOTAL */}
            <Box as="tr" bg={forPrint ? "#FBE9ED" : "#F5F7FA"} borderTop={`1px solid ${rowBorder}`}>
              <Box as="td" colSpan={4} px={3} py={2.5} textAlign="right">
                <Text fontWeight="700" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Total
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {formatCurrency(totals.debit)}
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {formatCurrency(totals.credit)}
              </Box>
            </Box>

            {/* CLOSING — placed by sign */}
            <Box as="tr" bg={forPrint ? "#F5CED8" : "#EEF1F6"} borderTop={`1px solid ${rowBorder}`}>
              <Box as="td" colSpan={4} px={3} py={2.5} textAlign="right">
                <Text fontWeight="700" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Cumulative Total
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {closingIsCredit ? "—" : formatCurrency(closingAmount)}
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {closingIsCredit ? formatCurrency(closingAmount) : "—"}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Member Ledger</Text>
        </HStack>

        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>
              MEMBER LEDGER REPORT
            </Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>
              Member Ledger
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">
              View transactions for an individual member account.
            </Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<PrinterIcon />}>
              Print
            </Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<FilePdfIcon />}>
              Generate PDF
            </Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} wrap="wrap">
            <Box flex="1" minW="220px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Member Name</Text>
              <SearchableMemberPicker members={members} value={selectedMember} onChange={setSelectedMember} placeholder="Select member" loading={optionsLoading} />
            </Box>

            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date From</Text>
              <Box position="relative">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date To</Text>
              <Box position="relative">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
                  <CalendarIcon />
                </Box>
              </Box>
            </Box>

            <Box flexShrink={0}>
              <Button h="40px" px={10} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} fontSize="12px" fontWeight="600" borderRadius="6px" onClick={fetchReport} _hover={{ bg: "#FFF5F7" }}>
                Filter
              </Button>
            </Box>
          </Flex>
        </Box>

        {pageError && (
          <Box mb={4} p={3} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="12px">{pageError}</Text>
          </Box>
        )}

        {loading ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="12px">Loading member ledger…</Text>
          </Box>
        ) : rows.length === 0 ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">No transactions found</Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>This member has no receipts in the selected period.</Text>
          </Box>
        ) : (
          <LedgerTable />
        )}

        <Flex mt={4} justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={2}>
          <Text color={SECONDARY_TEXT} fontSize="12px">Showing 1–{rows.length} of {rows.length} records</Text>
        </Flex>
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="MEMBER LEDGER"
        church={church}
        subtitle={
          <>
            <Text as="span" fontWeight="700">Member Name:</Text> {memberName}
            <Box as="span" mx={3}>•</Box>
            <Text as="span" fontWeight="700">Period:</Text> {periodLabel}
          </>
        }
      >
        <LedgerTable forPrint />
      </ChurchPrintModal>
    </Box>
  );
};

export default MemberLedgerPage;