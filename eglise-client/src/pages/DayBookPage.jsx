// src/pages/DayBookPage.jsx

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
import ChurchPrintModal from "../components/ChurchPrintModal";

import { toaster } from "../components/ui/toaster";
import { listLedgerEntries, getMyChurch } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CASH_BANK_EXACT_NAMES = [
  "cash in hand",
  "balance in savings account",
];

const isCashOrBankLedger = (ledgerName) => {
  const n = String(ledgerName || "").trim().toLowerCase();
  if (!n) return false;
  return CASH_BANK_EXACT_NAMES.some((exact) => n === exact);
};

// ------------------------------------------------------------
// Helper: extract member / party name from a ledger entry
// ------------------------------------------------------------
const extractMemberName = (entry) => {
  if (!entry) return "";
  return (
    entry.member_name ||
    entry.memberName ||
    entry.member?.name ||
    entry.member?.full_name ||
    entry.party_name ||
    entry.partyName ||
    entry.party?.name ||
    entry.donor_name ||
    entry.donorName ||
    entry.contact_name ||
    entry.contactName ||
    entry.person_name ||
    entry.personName ||
    entry.name_of_member ||
    entry.nameOfMember ||
    ""
  );
};

// ------------------------------------------------------------
// Group flat LedgerEntry rows into one row per voucher.
// ------------------------------------------------------------
const groupLedgerEntries = (entries) => {
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
        memberName: "",
        _entries: [],
      });
    }

    const g = groups.get(key);
    g._entries.push(e);

    // ✅ Capture member / party name from any entry that has it
    if (!g.memberName) {
      const name = extractMemberName(e);
      if (name) g.memberName = name;
    }

    const amt = toNumber(e.amount);

    if (isCashOrBankLedger(e.ledger_name)) {
      g.cashBankAccount = e.ledger_name || "";
      g.amount = amt;

      if (voucherType === "Receipt") {
        g.direction = "CREDIT";
      } else if (voucherType === "Payment") {
        g.direction = "DEBIT";
      } else {
        g.direction = e.entry_type;
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
        else g.direction = g._entries[0].entry_type;
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

    // ✅ Fallback: if no memberName yet, scan all entries in the voucher
    if (!g.memberName) {
      for (const entry of g._entries) {
        const name = extractMemberName(entry);
        if (name) {
          g.memberName = name;
          break;
        }
      }
    }

    delete g._entries;
    return g;
  });
};

// ------------------------------------------------------------
// Print Table
// ------------------------------------------------------------
const DayBookPrintTable = ({ rows, totals, openingBalance, closingBalance }) => {
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

  return (
    <Box fontFamily="'Georgia', serif">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher Number</th>
            <th style={thStyle}>Account Ledger</th>
            <th style={thStyle}>Cash / Bank Account</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Credit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Debit (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: "#FFF5F5" }}>
            <td colSpan={4} style={{ ...tdStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              Opening Balance
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(openingBalance)}
            </td>
            <td style={{ ...numStyle, color: "#8B1A1A" }}>—</td>
          </tr>

          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
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
                  <div>{r.particulars}</div>
                  {r.memberName && (
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                      {r.memberName}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{r.cashBankAccount}</td>
                <td style={{ ...numStyle, color: "#8B1A1A" }}>
                  {r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}
                </td>
                <td style={{ ...numStyle, color: "#8B1A1A" }}>
                  {r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}
                </td>
              </tr>
            ))
          )}

          <tr style={{ background: "#FCEAEC", borderTop: "1px solid #F0C2C2" }}>
            <td
              colSpan={4}
              style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B1A1A" }}
            >
              Total
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(totals.credit)}
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(totals.debit)}
            </td>
          </tr>

          <tr style={{ background: "#FFF5F5" }}>
            <td
              colSpan={4}
              style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B1A1A" }}
            >
              Closing Balance
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              ₹{fmt(closingBalance)}
            </td>
            <td style={{ ...numStyle, color: "#8B1A1A" }}>—</td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
};

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
const DayBookPage = () => {
  const navigate = useNavigate();

  const [rawEntries, setRawEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());

  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

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
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await listLedgerEntries(params);

      const body = res?.data ?? {};
      let data = body.results ?? body ?? [];
      if (!Array.isArray(data)) data = [];

      setOpeningBalance(Number(body.opening_balance ?? 0));
      setClosingBalance(Number(body.closing_balance ?? 0));

      setRawEntries(data);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to load Day Book",
        description: err?.response?.data?.detail || "Please try again.",
        type: "error",
      });
      setRawEntries([]);
      setOpeningBalance(0);
      setClosingBalance(0);
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
          String(r.narration || "").toLowerCase().includes(kw) ||
          String(r.memberName || "").toLowerCase().includes(kw)
      );
    }

    grouped.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });

    return grouped;
  }, [rawEntries, search]);

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;

    rows.forEach((r) => {
      if (r.direction === "CREDIT") credit += r.amount;
      else if (r.direction === "DEBIT") debit += r.amount;
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
    setDateFrom(todayISO());
    setDateTo(todayISO());
  };

  return (
    <>
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />

        <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          <HStack gap={2} mb={3} color={MUTED} fontSize="12px">
            <Text
              color={PRIMARY_MAROON}
              cursor="pointer"
              onClick={() => navigate("/reports")}
              fontWeight="500"
            >
              Reports
            </Text>
            <Text>/</Text>
            <Text>Day Book</Text>
          </HStack>

          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={5}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color={RED}
                mb={1}
                letterSpacing="0.4px"
              >
                DAY BOOK REPORT
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "26px", md: "30px" }}
                mb={1}
                fontWeight="700"
              >
                Day Book
              </Heading>
              <Text color={MUTED} fontSize="13px">
                View all cash and bank transactions for the selected date.
              </Text>
            </Box>

            <HStack gap={3} flexWrap="wrap">
              <Button
                variant="outline"
                borderColor="#FF5A7D"
                color={RED}
                bg="white"
                h="40px"
                px={5}
                fontSize="13px"
                fontWeight="600"
                borderRadius="6px"
                onClick={() => setIsPrintOpen(true)}
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
                h="40px"
                px={5}
                fontSize="13px"
                fontWeight="600"
                borderRadius="6px"
                onClick={() => setIsPrintOpen(true)}
                _hover={{ bg: "#FFF0F4" }}
              >
                <Icon as={LuFileText} mr={2} boxSize={4} />
                Generate PDF
              </Button>
            </HStack>
          </Flex>

          <Box border={`1px solid ${BORDER}`} borderRadius="8px" p={4} bg="white">
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

            {/* ✅ CLOSING BALANCE FOOTER (At the bottom of the table) */}
            {!isLoading && rows.length > 0 && (
              <Flex
                justify="flex-end"
                align="center"
                mt={5}
                pt={3}
                borderTop={`2px solid ${BORDER}`}
              >
                <HStack gap={4}>
                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color={MUTED}
                    letterSpacing="0.4px"
                  >
                    CLOSING BALANCE
                  </Text>
                  <Text fontSize="18px" fontWeight="800" color={DARK}>
                    ₹{fmt(closingBalance)}
                  </Text>
                </HStack>
              </Flex>
            )}
          </Box>
        </Box>

        <Footer />
      </Box>

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="DAY BOOK"
        subtitle={
          dateFrom === dateTo
            ? `For the day ${dateFrom}`
            : `From ${dateFrom || "—"} to ${dateTo || "—"}`
        }
        church={church}
        pdfFileName={`DayBook_${dateFrom || "from"}_${dateTo || "to"}.pdf`}
        defaultOrientation="portrait"
      >
        <DayBookPrintTable
          rows={rows}
          totals={totals}
          openingBalance={openingBalance}
          closingBalance={closingBalance}
        />
      </ChurchPrintModal>
    </>
  );
};

export default DayBookPage;