// src/pages/GeneralLedgerPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { LuArrowLeft, LuPrinter, LuFileText, LuChevronDown } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";
import GeneralLedgerPrintView from "../components/GeneralLedgerPrintView";

import { toaster } from "../components/ui/toaster";
import {
  listLedgerEntries,
  listAccountLedgers,
  getMyChurch,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (v) => `₹ ${formatMoney(v)}`;

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

// ------------------------------------------------------------
// Group flat LedgerEntry rows into one row per voucher
// ------------------------------------------------------------
const groupLedgerEntries = (entries) => {
  const groups = new Map();

  entries.forEach((e) => {
    if (e.is_cancelled) return;

    const voucherNo = e.receipt_voucher || e.payment_voucher || null;
    const voucherType = e.receipt_voucher
      ? "Receipt"
      : e.payment_voucher
      ? "Payment"
      : "Journal";

    const key = voucherNo
      ? `${voucherType}|${voucherNo}|${e.entry_date}`
      : `ORPHAN|${e.id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: e.entry_date,
        voucherNo: voucherNo || "—",
        voucherType,
        particulars: e.narration || "",
        account: e.ledger_name || "",
        debit: 0,
        credit: 0,
        _entries: [],
      });
    }

    const g = groups.get(key);
    g._entries.push(e);

    const amt = toNumber(e.amount);
    if (e.entry_type === "DEBIT") g.debit += amt;
    else if (e.entry_type === "CREDIT") g.credit += amt;

    if (!g.particulars && e.narration) g.particulars = e.narration;
  });

  return Array.from(groups.values()).map((g) => {
    delete g._entries;
    return g;
  });
};

const SummaryCell = ({ label, value, color }) => (
  <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={3} bg="white">
    <Text fontSize="10px" color={MUTED} mb={1}>
      {label}
    </Text>
    <Text fontSize="16px" fontWeight="700" color={color || DARK}>
      {value}
    </Text>
  </Box>
);

const GeneralLedgerPage = () => {
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState([]);
  const [ledgerId, setLedgerId] = useState("");

  const [rawEntries, setRawEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [opening, setOpening] = useState(0);
  const [totDebit, setTotDebit] = useState(0);
  const [totCredit, setTotCredit] = useState(0);
  const [closing, setClosing] = useState(0);

  const [church, setChurch] = useState({ name: "", address: "" });
  const [showPrint, setShowPrint] = useState(false);

  /* Load church info once */
  useEffect(() => {
    const fetchChurch = async () => {
      try {
        const res = await getMyChurch();
        const c = res?.data ?? res ?? {};
        setChurch({
          name: c.name || "Church",
          address:
            c.full_address ||
            c.address ||
            [c.city, c.state, c.country].filter(Boolean).join(", ") ||
            "",
        });
      } catch (err) {
        console.error("Failed to fetch church info", err);
      }
    };
    fetchChurch();
  }, []);

  /* Load ledger list */
  useEffect(() => {
    const loadLedgers = async () => {
      try {
        const res = await listAccountLedgers();
        const data = res?.data?.results ?? res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setLedgers(list);
        if (list.length && !ledgerId) setLedgerId(String(list[0].id));
      } catch (err) {
        console.error("Failed to load ledgers:", err);
      }
    };
    loadLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Load entries when ledger or filters change */
  useEffect(() => {
    if (!ledgerId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const params = { ledger: ledgerId };
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;

        const res = await listLedgerEntries(params);
        const body = res?.data ?? {};
        let data = body.results ?? body ?? [];
        if (!Array.isArray(data)) data = [];

        setOpening(Number(body.opening_balance || 0));
        setTotDebit(Number(body.total_debit || 0));
        setTotCredit(Number(body.total_credit || 0));
        setClosing(Number(body.closing_balance || 0));

        setRawEntries(data);
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Failed to load General Ledger",
          description: err?.response?.data?.detail || "Please try again.",
          type: "error",
        });
        setRawEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId, dateFrom, dateTo]);

  /* Rows (grouped + search-filtered) */
  const rows = useMemo(() => {
    let grouped = groupLedgerEntries(rawEntries);

    if (search) {
      const kw = search.toLowerCase();
      grouped = grouped.filter(
        (r) =>
          String(r.particulars || "").toLowerCase().includes(kw) ||
          String(r.voucherNo || "").toLowerCase().includes(kw) ||
          String(r.account || "").toLowerCase().includes(kw) ||
          String(r.voucherType || "").toLowerCase().includes(kw)
      );
    }

    grouped.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });

    return grouped;
  }, [rawEntries, search]);

  const selectedLedger = useMemo(
    () => ledgers.find((l) => String(l.id) === String(ledgerId)),
    [ledgers, ledgerId]
  );

  const reset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const ledgerPicker = (
    <Box position="relative" minW="220px">
      <select
        value={ledgerId}
        onChange={(e) => setLedgerId(e.target.value)}
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
        <option value="">Select ledger</option>
        {ledgers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.ledger_name}
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
  );

  return (
    <>
      {/* Print styles for General Ledger */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .generalledger-print,
          .generalledger-print * { visibility: visible !important; }
          .generalledger-print {
            position: absolute !important;
            left: 0; top: 0;
            width: 210mm;
            min-height: 297mm;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />

        <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text
              color={PRIMARY_MAROON}
              cursor="pointer"
              onClick={() => navigate("/reports")}
            >
              Reports
            </Text>
            <Text>/</Text>
            <Text>General Ledger</Text>
          </HStack>

          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={3}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
                GENERAL LEDGER REPORT
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                mb={1}
              >
                General Ledger
              </Heading>
              <Text color={MUTED} fontSize="11px">
                Statement of transactions for a single ledger.
              </Text>
            </Box>

            <HStack gap={2}>
              <Button
                variant="outline"
                borderColor="#FF5A7D"
                color={RED}
                bg="white"
                h="38px"
                px={4}
                fontSize="12px"
                borderRadius="6px"
                onClick={() => navigate("/reports")}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuArrowLeft} mr={2} boxSize={4} />
                Back
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
                onClick={() => setShowPrint(true)}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuPrinter} mr={2} boxSize={4} />
                Print
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
                onClick={() => setShowPrint(true)}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuFileText} mr={2} boxSize={4} />
                Generate PDF
              </Button>
            </HStack>
          </Flex>

          <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={3} bg="white">
            <ReportFilterBar
              search={search}
              setSearch={setSearch}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              extraFilter={ledgerPicker}
              onReset={reset}
            />

            {/* Summary strip */}
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 4 }}
              gap={3}
              mb={3}
            >
              <SummaryCell label="Opening Balance" value={formatAmount(opening)} />
              <SummaryCell
                label="Total Debit"
                value={formatAmount(totDebit)}
                color="#16804A"
              />
              <SummaryCell
                label="Total Credit"
                value={formatAmount(totCredit)}
                color={RED}
              />
              <SummaryCell
                label="Closing Balance"
                value={formatAmount(closing)}
                color={closing < 0 ? RED : DARK}
              />
            </SimpleGrid>

            <ReportLedgerTable
  rows={rows}
  isLoading={isLoading}
  openingBalance={opening}
  totalDebit={totDebit}
  totalCredit={totCredit}
  closingBalance={closing}
  showTotals={true}
/>

            <Text fontSize="11px" color={MUTED} mt={2} textAlign="right">
              Showing {rows.length} entries
            </Text>
          </Box>
        </Box>

        <Footer />
      </Box>

      {/* Print preview */}
      {showPrint && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(0,0,0,0.5)"
          zIndex="9999"
          overflowY="auto"
          p={{ base: 2, md: 6 }}
        >
          <Flex justify="flex-end" gap={3} mb={3} maxW="820px" mx="auto">
            <Button
              size="sm"
              variant="outline"
              borderColor="white"
              color="white"
              bg="transparent"
              onClick={() => setShowPrint(false)}
              _hover={{ bg: "rgba(255,255,255,0.1)" }}
            >
              Close
            </Button>
            <Button
              size="sm"
              bg="white"
              color={RED}
              fontWeight="600"
              onClick={() => window.print()}
              _hover={{ bg: "#FFF0F4" }}
            >
              Print
            </Button>
          </Flex>

          <Box
            maxW="820px"
            mx="auto"
            bg="white"
            boxShadow="0 4px 24px rgba(0,0,0,0.3)"
            className="generalledger-print"
          >
            <GeneralLedgerPrintView
              rows={rows}
              date={dateTo || new Date().toISOString().split("T")[0]}
              ledgerName={selectedLedger?.ledger_name || ""}
              churchName={church.name}
              churchAddress={church.address}
              openingBalance={opening}
              totalDebit={totDebit}
              totalCredit={totCredit}
              closingBalance={closing}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default GeneralLedgerPage;