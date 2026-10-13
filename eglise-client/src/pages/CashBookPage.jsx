// src/pages/CashBookPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react";
import { LuArrowLeft, LuPrinter, LuFileText } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";
import CashBookPrintView from "../components/CashBookPrintView";

import { toaster } from "../components/ui/toaster";
import {
  listLedgerEntries,
  getMyChurch,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

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

        // The ledger on the non-cash side (income / expense)
        particulars: "",

        // The cash / bank ledger
        cashBankAccount: "",

        narration: e.narration || "",
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

    // Classify this entry
    const ledgerName = String(e.ledger_name || "").toLowerCase();
    const groupName = String(e.account_group_name || "").toLowerCase();

    const isCashOrBank =
      ledgerName.includes("cash") ||
      ledgerName.includes("bank") ||
      groupName.includes("cash") ||
      groupName.includes("bank");

    if (isCashOrBank) {
      if (!g.cashBankAccount) g.cashBankAccount = e.ledger_name || "";
    } else {
      if (!g.particulars) g.particulars = e.ledger_name || "";
    }

    if (!g.narration && e.narration) g.narration = e.narration;
  });

  // Final fallbacks
  return Array.from(groups.values()).map((g) => {
    if (!g.particulars) {
      const firstLedger = g._entries.find((x) => x.ledger_name);
      g.particulars = firstLedger ? firstLedger.ledger_name : "—";
    }
    if (!g.cashBankAccount) g.cashBankAccount = "—";
    delete g._entries;
    return g;
  });
};

const CashBookPage = () => {
  const navigate = useNavigate();

  const [rawEntries, setRawEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [openingBalance, setOpeningBalance] = useState(0);

  const [church, setChurch] = useState({
    name: "",
    address: "",
  });

  const [showPrint, setShowPrint] = useState(false);

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

  const load = async () => {
    setIsLoading(true);
    try {
      const params = { book: "cash" };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await listLedgerEntries(params);
      const body = res?.data ?? {};
      let data = body.results ?? body ?? [];
      if (!Array.isArray(data)) data = [];

      if (typeof body.opening_balance === "number") {
        setOpeningBalance(body.opening_balance);
      }

      setRawEntries(data);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to load Cash Book",
        description: err?.response?.data?.detail || "Please try again.",
        type: "error",
      });
      setRawEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const rows = useMemo(() => {
    let grouped = groupLedgerEntries(rawEntries);

    if (search) {
      const kw = search.toLowerCase();
      grouped = grouped.filter(
        (r) =>
          String(r.particulars || "").toLowerCase().includes(kw) ||
          String(r.voucherNo || "").toLowerCase().includes(kw) ||
          String(r.cashBankAccount || "").toLowerCase().includes(kw) ||
          String(r.voucherType || "").toLowerCase().includes(kw) ||
          String(r.narration || "").toLowerCase().includes(kw)
      );
    }

    grouped.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });

    return grouped;
  }, [rawEntries, search]);

  const reset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .cashbook-print,
          .cashbook-print * { visibility: visible !important; }
          .cashbook-print {
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
            <Text>Cash Book</Text>
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
                CASH BOOK REPORT
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                mb={1}
              >
                Cash Book
              </Heading>
              <Text color={MUTED} fontSize="11px">
                View all cash transactions for the selected date.
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
              onReset={reset}
            />

            <ReportLedgerTable rows={rows} isLoading={isLoading} />

            <Text fontSize="11px" color={MUTED} mt={2} textAlign="right">
              Showing {rows.length} entries
            </Text>
          </Box>
        </Box>

        <Footer />
      </Box>

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
            className="cashbook-print"
          >
            <CashBookPrintView
              rows={rows}
              date={dateFrom || new Date().toISOString().split("T")[0]}
              churchName={church.name}
              churchAddress={church.address}
              openingBalance={openingBalance}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default CashBookPage;