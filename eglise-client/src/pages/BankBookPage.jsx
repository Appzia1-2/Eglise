// src/pages/BankBookPage.jsx

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
import { LuPrinter, LuFileText } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";
import ChurchPrintModal from "../components/ChurchPrintModal";

import { toaster } from "../components/ui/toaster";
import { listLedgerEntries, getMyChurch } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ============================================================
// DATE HELPERS
// ============================================================

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const firstDayOfMonthISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

// ============================================================
// CASH / BANK LEDGER WHITELIST
// ============================================================

const CASH_BANK_EXACT_NAMES = [
  "cash in hand",
  "balance in savings account",
  "balance in deposit account",
  "balance in other accounts",
];

const isCashLedger = (ledgerName) => {
  const n = String(ledgerName || "").trim().toLowerCase();
  return n === "cash in hand";
};

const isBankLedger = (ledgerName) => {
  const n = String(ledgerName || "").trim().toLowerCase();
  return (
    n === "balance in savings account" ||
    n === "balance in deposit account" ||
    n === "balance in other accounts"
  );
};

const isCashOrBankLedger = (ledgerName) => {
  const n = String(ledgerName || "").trim().toLowerCase();
  if (!n) return false;
  return CASH_BANK_EXACT_NAMES.includes(n);
};

// ============================================================
// GROUP LEDGER ENTRIES BY VOUCHER
// ============================================================
//
// Money-in convention: Credit = money in, Debit = money out.
//   - Receipt → Credit
//   - Payment → Debit
//   - Contra  → Debit to cash/bank = money IN, Credit = money OUT
// ============================================================

const groupLedgerEntries = (entries, book = "bank") => {
  const groups = new Map();

  entries.forEach((e) => {
    if (e.is_cancelled) return;

    const voucherNo =
      e.receipt_voucher || e.payment_voucher || e.contra_voucher || null;

    const voucherType = e.receipt_voucher
      ? "Receipt"
      : e.payment_voucher
      ? "Payment"
      : e.contra_voucher
      ? "Contra"
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
        particulars: "",
        cashBankAccount: "",
        narration: e.narration || "",
        amount: 0,
        direction: "DEBIT",
        _entries: [],
      });
    }

    const g = groups.get(key);
    g._entries.push(e);

    const amt = toNumber(e.amount);

    if (isCashOrBankLedger(e.ledger_name)) {
      const matchesBook =
        (book === "bank" && isBankLedger(e.ledger_name)) ||
        (book === "cash" && isCashLedger(e.ledger_name));

      if (matchesBook || !g.cashBankAccount) {
        g.cashBankAccount = e.ledger_name || "";
        g.amount = amt;

        if (voucherType === "Receipt") {
          g.direction = "CREDIT"; // money in
        } else if (voucherType === "Payment") {
          g.direction = "DEBIT"; // money out
        } else {
          // Contra: apply the same money-in/money-out convention.
          // DEBIT to cash/bank ledger = money IN, CREDIT = money OUT.
          g.direction = e.entry_type === "DEBIT" ? "CREDIT" : "DEBIT";
        }
      }
    } else {
      if (!g.particulars) {
        g.particulars = e.ledger_name || "";
      }
    }

    if (!g.narration && e.narration) g.narration = e.narration;
  });

  return Array.from(groups.values()).map((g) => {
    if (!g.cashBankAccount) {
      const anyLedger = g._entries.find((x) => x.ledger_name);
      g.cashBankAccount = anyLedger ? anyLedger.ledger_name : "—";

      if (g.amount === 0 && g._entries[0]) {
        g.amount = toNumber(g._entries[0].amount);
        if (g.voucherType === "Receipt") g.direction = "CREDIT";
        else if (g.voucherType === "Payment") g.direction = "DEBIT";
        else
          g.direction =
            g._entries[0].entry_type === "DEBIT" ? "CREDIT" : "DEBIT";
      }
    }

    if (!g.particulars) {
      const otherLedger = g._entries.find(
        (x) => !isCashOrBankLedger(x.ledger_name) && x.ledger_name
      );
      g.particulars = otherLedger
        ? otherLedger.ledger_name
        : g._entries[0]?.ledger_name || "—";
    }

    delete g._entries;
    return g;
  });
};

// ============================================================
// COMPUTE RUNNING BALANCES
// ============================================================

const computeRunningBalances = (rowsAscending, openingBalance) => {
  let balance = toNumber(openingBalance);
  return rowsAscending.map((r) => {
    const amt = toNumber(r.amount);
    if (r.direction === "CREDIT") {
      balance += amt;
    } else if (r.direction === "DEBIT") {
      balance -= amt;
    }
    return { ...r, running_balance: balance };
  });
};

// ============================================================
// PRINT TABLE
// ============================================================

const BankBookPrintTable = ({ rows, totals, openingBalance }) => {
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const thStyle = {
    border: "1px solid #F0C2C2",
    padding: "10px 8px",
    background: "#FCEAEC",
    color: "#8B1A1A",
    fontWeight: "bold",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    textAlign: "left",
  };

  const tdStyle = {
    border: "1px solid #F0C2C2",
    padding: "10px 8px",
    fontSize: "13px",
    color: "#333",
    fontFamily: "'Georgia', serif",
    verticalAlign: "top",
  };

  const numStyle = { ...tdStyle, textAlign: "right" };

  const closingBalance =
    rows.length > 0 && rows[0].running_balance !== undefined
      ? rows[0].running_balance
      : toNumber(openingBalance) + totals.credit - totals.debit;

  return (
    <Box fontFamily="'Georgia', serif">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher Number</th>
            <th style={thStyle}>Particulars</th>
            <th style={thStyle}>Cash / Bank Account</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Credit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Debit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Balance (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: "#FFF5F5" }}>
            <td
              colSpan={5}
              style={{ ...tdStyle, fontWeight: "bold", color: "#8B1A1A" }}
            >
              Opening Balance
            </td>
            <td style={{ ...numStyle, color: "#8B1A1A" }}>—</td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(openingBalance)}
            </td>
          </tr>

          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "#A05050",
                }}
              >
                No transactions for the selected period.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={r.key}
                style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFF9F9" }}
              >
                <td style={tdStyle}>{r.date}</td>
                <td style={tdStyle}>{r.voucherNo}</td>
                <td style={{ ...tdStyle, color: "#8B1A1A" }}>
                  {r.particulars}
                </td>
                <td style={tdStyle}>{r.cashBankAccount}</td>
                <td style={{ ...numStyle, color: "#2E7D32" }}>
                  {r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}
                </td>
                <td style={{ ...numStyle, color: "#B71C1C" }}>
                  {r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}
                </td>
                <td style={{ ...numStyle, fontWeight: "600" }}>
                  ₹{fmt(r.running_balance)}
                </td>
              </tr>
            ))
          )}

          <tr style={{ background: "#FCEAEC", borderTop: "1px solid #F0C2C2" }}>
            <td
              colSpan={4}
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
                color: "#8B1A1A",
              }}
            >
              Total
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#2E7D32" }}>
              ₹{fmt(totals.credit)}
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#B71C1C" }}>
              ₹{fmt(totals.debit)}
            </td>
            <td style={numStyle}>—</td>
          </tr>

          <tr style={{ background: "#FFF5F5" }}>
            <td
              colSpan={6}
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
                color: "#8B1A1A",
              }}
            >
              Closing Balance
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(closingBalance)}
            </td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
};

// ============================================================
// PAGE
// ============================================================

const BankBookPage = () => {
  const navigate = useNavigate();

  const [rawEntries, setRawEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState(firstDayOfMonthISO());
  const [dateTo, setDateTo] = useState(todayISO());

  const [openingBalance, setOpeningBalance] = useState(undefined);
  const [church, setChurch] = useState({ name: "", address: "" });
  const [isPrintOpen, setIsPrintOpen] = useState(false);

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
      const params = { book: "bank" };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await listLedgerEntries(params);
      const body = res?.data ?? {};
      let data = body.results ?? body ?? [];
      if (!Array.isArray(data)) data = [];

      if (typeof body.opening_balance === "number") {
        setOpeningBalance(body.opening_balance);
      } else {
        setOpeningBalance(undefined);
      }

      setRawEntries(data);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to load Bank Book",
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
    let grouped = groupLedgerEntries(rawEntries, "bank");

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
      if (da !== db) return da - db;
      return String(a.key).localeCompare(String(b.key));
    });

    const withBalance = computeRunningBalances(grouped, openingBalance ?? 0);

    withBalance.reverse();

    return withBalance;
  }, [rawEntries, search, openingBalance]);

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;

    rows.forEach((r) => {
      if (r.direction === "CREDIT") credit += toNumber(r.amount);
      else if (r.direction === "DEBIT") debit += toNumber(r.amount);
    });

    return {
      credit,
      debit,
      moneyIn: credit,
      moneyOut: debit,
      net: credit - debit,
    };
  }, [rows]);

  const reset = () => {
    setSearch("");
    setDateFrom(firstDayOfMonthISO());
    setDateTo(todayISO());
  };

  return (
    <>
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
            <Text>Bank Book</Text>
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
                BANK BOOK REPORT
              </Text>
              <Heading color={DARK} fontSize={{ base: "22px", md: "26px" }} mb={1}>
                Bank Book
              </Heading>
              <Text color={MUTED} fontSize="11px">
                View all bank transactions for the selected date.
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
                onClick={() => setIsPrintOpen(true)}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuPrinter} mr={2} boxSize={4} /> Print
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
                onClick={() => setIsPrintOpen(true)}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuFileText} mr={2} boxSize={4} /> Generate PDF
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
            <ReportLedgerTable
              rows={rows}
              isLoading={isLoading}
              totals={totals}
              showTotals
            />
            <Text fontSize="11px" color={MUTED} mt={2} textAlign="right">
              Showing {rows.length} entries
            </Text>
          </Box>
        </Box>

        <Footer />
      </Box>

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="BANK BOOK"
        subtitle={
          dateFrom === dateTo
            ? `For the day ${dateFrom}`
            : `From ${dateFrom || "—"} to ${dateTo || "—"}`
        }
        church={church}
        pdfFileName={`BankBook_${dateFrom || "from"}_${dateTo || "to"}.pdf`}
        defaultOrientation="portrait"
      >
        <BankBookPrintTable
          rows={rows}
          totals={totals}
          openingBalance={openingBalance}
        />
      </ChurchPrintModal>
    </>
  );
};

export default BankBookPage;