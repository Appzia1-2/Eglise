// src/pages/reports/MemberLedgerPage.jsx

import React, { useEffect, useMemo, useState } from "react";
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

const ArrowLeftIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const formatCurrency = (n) =>
  n == null
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

const MemberLedgerPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [church, setChurch] = useState({});
  const [selectedMember, setSelectedMember] = useState("");
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const [opening, setOpening] = useState(0);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ credit: 0, debit: 0, closing: 0 });

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [printOpen, setPrintOpen] = useState(false);

  // -------- load members + church once --------
  useEffect(() => {
    const load = async () => {
      try {
        setOptionsLoading(true);
        const [mRes, cRes] = await Promise.all([
          listMembers(),
          getMyChurch(),
        ]);
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

  // -------- fetch report when filters change --------
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
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotals({
        credit: Number(data?.totals?.credit || 0),
        debit: Number(data?.totals?.debit || 0),
        closing: Number(data?.totals?.closing || 0),
      });
    } catch (err) {
      console.error("Member ledger fetch error:", err);
      setPageError("Unable to load member ledger.");
      setRows([]);
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

  const memberName =
    members.find((m) => String(m.id) === String(selectedMember))?.name || "";

  const periodLabel = `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`;

  // -------- table --------
  const LedgerTable = ({ forPrint = false }) => {
    const headerBg = forPrint ? "#F4D8DE" : "#F7F9FB";
    const headerColor = forPrint ? DARK_RED : TEXT_COLOR;
    const rowBorder = forPrint ? "#E8B4C0" : BORDER_COLOR;
    const stripeBg = forPrint ? "#FCF2F4" : "#FAFBFC";

    return (
      <Box border={`1px solid ${rowBorder}`} overflow="hidden">
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
                "Date",
                "Voucher Number",
                "Account Ledger",
                "Cash / Bank Account",
                "Credit (₹)",
                "Debit (₹)",
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
            {/* OPENING BALANCE */}
            <Box as="tr" bg={forPrint ? "#FBE9ED" : "#F5F7FA"}>
              <Box as="td" colSpan={4} px={3} py={2}>
                <Text fontWeight="600" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Opening Balance
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2}>
                <Text color={SECONDARY_TEXT}>—</Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2} color={forPrint ? DARK_RED : BLUE} fontWeight="700">
                {formatCurrency(opening)}
              </Box>
            </Box>

            {/* ROWS */}
            {rows.map((row, idx) => (
              <Box
                as="tr"
                key={row.id}
                bg={idx % 2 === 1 ? stripeBg : "white"}
                borderBottom={`1px solid ${rowBorder}`}
              >
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>
                  {formatDateShort(row.date)}
                </Box>
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>
                  {row.voucher}
                </Box>
                <Box as="td" px={3} py={2} color={forPrint ? DARK_RED : BLUE}>
                  {row.ledger_name}
                </Box>
                <Box as="td" px={3} py={2} color={TEXT_COLOR}>
                  {row.cash_bank}
                </Box>
                <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>
                  {row.credit ? formatCurrency(row.credit) : "—"}
                </Box>
                <Box as="td" px={3} py={2} textAlign="right" color={TEXT_COLOR}>
                  {row.debit ? formatCurrency(row.debit) : "—"}
                </Box>
              </Box>
            ))}

            {/* TOTAL */}
            <Box
              as="tr"
              bg={forPrint ? "#FBE9ED" : "#F5F7FA"}
              borderTop={`1px solid ${rowBorder}`}
            >
              <Box as="td" colSpan={4} px={3} py={2.5} textAlign="right">
                <Text fontWeight="700" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Total
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {formatCurrency(totals.credit)}
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {formatCurrency(totals.debit)}
              </Box>
            </Box>

            {/* CLOSING */}
            <Box
              as="tr"
              bg={forPrint ? "#F5CED8" : "#EEF1F6"}
              borderTop={`1px solid ${rowBorder}`}
            >
              <Box as="td" colSpan={4} px={3} py={2.5} textAlign="right">
                <Text fontWeight="700" color={forPrint ? DARK_RED : BLUE} fontSize={forPrint ? "11px" : "12px"}>
                  Closing Balance
                </Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5}>
                <Text color={SECONDARY_TEXT}>—</Text>
              </Box>
              <Box as="td" textAlign="right" px={3} py={2.5} fontWeight="700" color={forPrint ? DARK_RED : BLUE}>
                {formatCurrency(totals.closing)}
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
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>MEMBER LEDGER REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>Member Ledger</Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">View transactions for an individual member account.</Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => navigate("/reports")} _hover={{ bg: "#FFF5F7" }} leftIcon={<ArrowLeftIcon />}>Back</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<PrinterIcon />}>Print</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => setPrintOpen(true)} _hover={{ bg: "#FFF5F7" }} leftIcon={<FilePdfIcon />}>Generate PDF</Button>
          </HStack>
        </Flex>

        {/* FILTERS */}
        <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} wrap="wrap">
            <Box flex="1" minW="220px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Member Name</Text>
              <Box position="relative">
                <Box
                  as="select"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
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
                  {optionsLoading ? (
                    <option>Loading…</option>
                  ) : members.length === 0 ? (
                    <option>No members</option>
                  ) : (
                    members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  )}
                </Box>
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><ChevronDownIcon /></Box>
              </Box>
            </Box>

            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date From</Text>
              <Box position="relative">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>

            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date To</Text>
              <Box position="relative">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>

            <Box flexShrink={0}>
              <Button h="40px" px={10} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} fontSize="12px" fontWeight="600" borderRadius="6px" onClick={fetchReport} _hover={{ bg: "#FFF5F7" }}>Filter</Button>
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
          <Text color={SECONDARY_TEXT} fontSize="12px">
            Showing 1–{rows.length} of {rows.length} records
          </Text>
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