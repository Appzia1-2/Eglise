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
  Badge,
} from "@chakra-ui/react";
import { LuPrinter, LuFileText, LuArrowLeft } from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ChurchPrintModal from "../components/ChurchPrintModal";

import { toaster } from "../components/ui/toaster";
import { listLedgerEntries, getMyChurch } from "../api/registryServices";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";
const BLUE = "#1A73E8";

const todayISO = () => new Date().toISOString().slice(0, 10);
const firstDayOfMonthISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
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

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const isCashLedger = (name) => String(name || "").trim().toLowerCase() === "cash in hand";
const isBankLedger = (name) => {
  const n = String(name || "").trim().toLowerCase();
  return n === "balance in savings account" || n === "balance in deposit account" || n === "balance in other accounts" || n.startsWith("bank - ");
};
const isCashOrBankLedger = (name) => isCashLedger(name) || isBankLedger(name);

const groupLedgerEntries = (entries, book = "cash") => {
  const groups = new Map();

  entries.forEach((e) => {
    if (e.is_cancelled) return;
    const voucherNo = e.receipt_voucher || e.payment_voucher || e.contra_voucher || null;
    const voucherType = e.receipt_voucher ? "Receipt" : e.payment_voucher ? "Payment" : e.contra_voucher ? "Contra" : "Journal";
    const key = voucherNo ? `${voucherType}|${voucherNo}|${e.entry_date}` : `ORPHAN|${e.id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key, date: e.entry_date, voucherNo: voucherNo || "—", voucherType,
        particulars: "", cashBankAccount: "", narration: e.narration || "",
        amount: 0, direction: "DEBIT", _entries: [],
      });
    }

    const g = groups.get(key);
    g._entries.push(e);
    const amt = toNumber(e.amount);

    if (isCashOrBankLedger(e.ledger_name)) {
      const matchesBook = (book === "bank" && isBankLedger(e.ledger_name)) || (book === "cash" && isCashLedger(e.ledger_name));
      
      if (matchesBook || !g.cashBankAccount) {
        if (!g.cashBankAccount) {
          g.cashBankAccount = e.ledger_name || "";
          g.amount = amt;
          g.direction = e.entry_type === "DEBIT" ? "CREDIT" : "DEBIT"; 
        } else if (matchesBook) {
          g.cashBankAccount = e.ledger_name || "";
          g.amount = amt;
          g.direction = e.entry_type === "DEBIT" ? "CREDIT" : "DEBIT";
        } else {
          if (!g.particulars) {
            g.particulars = e.ledger_name || "";
          }
        }
      } else {
        if (!g.particulars) g.particulars = e.ledger_name || "";
      }
    } else {
      if (!g.particulars) g.particulars = e.ledger_name || "";
    }
    if (!g.narration && e.narration) g.narration = e.narration;
  });

  return Array.from(groups.values()).map((g) => {
    if (!g.cashBankAccount) {
      const anyLedger = g._entries.find((x) => x.ledger_name);
      g.cashBankAccount = anyLedger ? anyLedger.ledger_name : "—";
      if (g.amount === 0 && g._entries[0]) {
        g.amount = toNumber(g._entries[0].amount);
        g.direction = g._entries[0].entry_type === "DEBIT" ? "CREDIT" : "DEBIT";
      }
    }
    if (!g.particulars) {
      const other = g._entries.find((x) => !isCashOrBankLedger(x.ledger_name) && x.ledger_name);
      g.particulars = other ? other.ledger_name : g._entries[0]?.ledger_name || "—";
    }
    delete g._entries;
    return g;
  });
};

const computeRunningBalances = (rowsAscending, openingBalance) => {
  let balance = toNumber(openingBalance);
  return rowsAscending.map((r) => {
    const amt = toNumber(r.amount);
    if (r.direction === "CREDIT") balance += amt; // Money In
    else if (r.direction === "DEBIT") balance -= amt; // Money Out
    return { ...r, running_balance: balance };
  });
};

// ============================================================
// PRINT TABLE
// ============================================================
const CashBookPrintTable = ({ rows, totals, openingBalance }) => {
  const thStyle = { border: "1px solid #F0C2C2", padding: "10px 8px", background: "#FCEAEC", color: "#8B1A1A", fontWeight: "bold", fontSize: "13px", fontFamily: "'Georgia', serif", textAlign: "left" };
  const tdStyle = { border: "1px solid #F0C2C2", padding: "10px 8px", fontSize: "13px", color: "#333", fontFamily: "'Georgia', serif", verticalAlign: "top" };
  const numStyle = { ...tdStyle, textAlign: "right" };

  const closingBalance = rows.length > 0 && rows[0].running_balance !== undefined ? rows[0].running_balance : toNumber(openingBalance) + totals.credit - totals.debit;

  return (
    <Box fontFamily="'Georgia', serif">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher Number</th>
            <th style={thStyle}>Voucher Type</th>
            <th style={thStyle}>Ledger Account</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Credit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Debit (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: "#FFF5F5" }}>
            <td colSpan={5} style={{ ...tdStyle, fontWeight: "bold", color: "#8B1A1A" }}>Opening Balance</td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>₹{fmt(openingBalance)}</td>
          </tr>
          {rows.map((r, i) => (
            <tr key={r.key} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFF9F9" }}>
              <td style={tdStyle}>{formatDateDisplay(r.date)}</td>
              <td style={tdStyle}>{r.voucherNo}</td>
              <td style={tdStyle}>{r.voucherType}</td>
              <td style={{ ...tdStyle, color: "#8B1A1A" }}>{r.particulars}</td>
              <td style={{ ...numStyle, color: "#2E7D32" }}>{r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}</td>
              <td style={{ ...numStyle, color: "#B71C1C" }}>{r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}</td>
            </tr>
          ))}
          <tr style={{ background: "#FCEAEC", borderTop: "1px solid #F0C2C2" }}>
            <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B1A1A" }}>Total</td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#2E7D32" }}>₹{fmt(totals.credit)}</td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#B71C1C" }}>₹{fmt(totals.debit)}</td>
          </tr>
          <tr style={{ background: "#FFF5F5" }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B1A1A" }}>Closing Balance</td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>₹{fmt(closingBalance)}</td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const CashBookPage = () => {
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
    getMyChurch().then((res) => {
      const c = res?.data ?? res ?? {};
      setChurch({ name: c.name || "Church", address: c.full_address || c.address || "" });
    });
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = { book: "cash" };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const res = await listLedgerEntries(params);
      const body = res?.data ?? {};
      
      setOpeningBalance(typeof body.opening_balance === "number" ? body.opening_balance : 0);
      setRawEntries(Array.isArray(body.results) ? body.results : []);
    } catch (err) {
      toaster.create({ title: "Failed to load Cash Book", description: "Please try again.", type: "error" });
      setRawEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const rows = useMemo(() => {
    let grouped = groupLedgerEntries(rawEntries, "cash");
    if (search) {
      const kw = search.toLowerCase();
      grouped = grouped.filter((r) => String(r.particulars).toLowerCase().includes(kw) || String(r.voucherNo).toLowerCase().includes(kw));
    }
    grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return computeRunningBalances(grouped, openingBalance ?? 0).reverse();
  }, [rawEntries, search, openingBalance]);

  const totals = useMemo(() => {
    let credit = 0, debit = 0;
    rows.forEach((r) => {
      if (r.direction === "CREDIT") credit += toNumber(r.amount);
      else if (r.direction === "DEBIT") debit += toNumber(r.amount);
    });
    return { credit, debit };
  }, [rows]);

  const screenClosingBalance = rows.length > 0 && rows[0].running_balance !== undefined ? rows[0].running_balance : (openingBalance ?? 0) + totals.credit - totals.debit;

  return (
    <>
      <Box minH="100vh" bg="#F8F9FA" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
          
          <HStack gap={2} mb={4} color={MUTED} fontSize="12px">
            <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
            <Text>/</Text>
            <Text>Cash Book</Text>
          </HStack>

          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={6} direction={{ base: "column", md: "row" }}>
            <Box>
              <Text fontSize="12px" fontWeight="700" color={RED} mb={1}>CASH BOOK REPORT</Text>
              <Heading color={DARK} fontSize="28px" mb={1}>Cash Book</Heading>
              <Text color={MUTED} fontSize="13px">View all cash transactions for the selected date.</Text>
            </Box>

            <HStack gap={3}>
              <Button variant="outline" borderColor={RED} color={RED} bg="white" h="40px" px={5} borderRadius="6px" onClick={() => navigate("/reports")}>
                <Icon as={LuArrowLeft} mr={2} /> Back
              </Button>
              <Button variant="outline" borderColor={RED} color={RED} bg="white" h="40px" px={5} borderRadius="6px" onClick={() => setIsPrintOpen(true)}>
                <Icon as={LuPrinter} mr={2} /> Print
              </Button>
              <Button variant="outline" borderColor={RED} color={RED} bg="white" h="40px" px={5} borderRadius="6px" onClick={() => setIsPrintOpen(true)}>
                <Icon as={LuFileText} mr={2} /> Generate PDF
              </Button>
            </HStack>
          </Flex>

          <Box bg="white" borderRadius="8px" border="1px solid" borderColor={BORDER} p={4}>
            
            <ReportFilterBar 
              search={search} setSearch={setSearch} 
              dateFrom={dateFrom} setDateFrom={setDateFrom} 
              dateTo={dateTo} setDateTo={setDateTo} 
              onReset={() => { setSearch(""); setDateFrom(firstDayOfMonthISO()); setDateTo(todayISO()); }} 
            />

            <Box overflowX="auto" mt={4} border="1px solid" borderColor={BORDER} borderRadius="6px">
              <Box as="table" width="100%" borderCollapse="collapse">
                <Box as="thead" bg="#F8F9FA">
                  <Box as="tr">
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Date</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Voucher No.</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Voucher Type</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Particulars</Box>
                    <Box as="th" textAlign="right" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Credit (₹)</Box>
                    <Box as="th" textAlign="right" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Debit (₹)</Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  
                  {/* Opening Balance Row */}
                  <Box as="tr" bg="#FFF5F5" borderBottom="1px solid" borderColor="#E6EAF0">
                    <Box as="td" colSpan={5} textAlign="right" px={4} py={3} fontSize="13px" color={DARK} fontWeight="700">Opening Balance</Box>
                    <Box as="td" textAlign="right" px={4} py={3} fontSize="13px" color={DARK} fontWeight="700">₹{fmt(openingBalance)}</Box>
                  </Box>

                  {isLoading ? (
                    <Box as="tr"><Box as="td" colSpan={6} textAlign="center" py={6} fontSize="13px">Loading...</Box></Box>
                  ) : rows.length === 0 ? (
                    <Box as="tr"><Box as="td" colSpan={6} textAlign="center" py={6} fontSize="13px" color={MUTED}>No records found.</Box></Box>
                  ) : (
                    rows.map((r) => (
                      <Box as="tr" key={r.key} _hover={{ bg: "#F8F9FA" }} borderBottom="1px solid" borderColor="#E6EAF0">
                        <Box as="td" px={4} py={3} fontSize="13px" color={DARK} fontWeight="500">{formatDateDisplay(r.date)}</Box>
                        <Box as="td" px={4} py={3} fontSize="13px" color={BLUE}>{r.voucherNo}</Box>
                        <Box as="td" px={4} py={3} fontSize="13px">
                          <Badge colorScheme={r.voucherType === "Receipt" ? "green" : r.voucherType === "Payment" ? "red" : "blue"} variant="subtle">
                            {r.voucherType}
                          </Badge>
                        </Box>
                        <Box as="td" px={4} py={3} fontSize="13px">
                          <Text>{r.particulars}</Text>
                        </Box>
                        <Box as="td" px={4} py={3} fontSize="13px" textAlign="right" color={r.direction === "CREDIT" ? "#2E7D32" : "transparent"} fontWeight={r.direction === "CREDIT" ? "700" : "400"}>
                          {r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}
                        </Box>
                        <Box as="td" px={4} py={3} fontSize="13px" textAlign="right" color={r.direction === "DEBIT" ? "#B71C1C" : "transparent"} fontWeight={r.direction === "DEBIT" ? "700" : "400"}>
                          {r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}
                        </Box>
                      </Box>
                    ))
                  )}
                  
                  {/* Totals Row */}
                  {!isLoading && rows.length > 0 && (
                    <Box as="tr" bg="#F8F9FA" fontWeight="bold" borderBottom="1px solid" borderColor="#E6EAF0">
                      <Box as="td" colSpan={4} textAlign="right" px={4} py={3} fontSize="13px" color={DARK}>Total</Box>
                      <Box as="td" textAlign="right" px={4} py={3} fontSize="13px" color="#2E7D32">₹{fmt(totals.credit)}</Box>
                      <Box as="td" textAlign="right" px={4} py={3} fontSize="13px" color="#B71C1C">₹{fmt(totals.debit)}</Box>
                    </Box>
                  )}

                  {/* Closing Balance Row */}
                  {!isLoading && (
                    <Box as="tr" bg="#FFF5F5" borderTop="1px solid" borderColor={BORDER}>
                      <Box as="td" colSpan={5} textAlign="right" px={4} py={4} fontSize="14px" color={DARK} fontWeight="800">Closing Balance</Box>
                      <Box as="td" textAlign="right" px={4} py={4} fontSize="14px" color={DARK} fontWeight="800">₹{fmt(screenClosingBalance)}</Box>
                    </Box>
                  )}

                </Box>
              </Box>
            </Box>

            <Text fontSize="12px" color={MUTED} mt={4}>
              Showing {rows.length} records
            </Text>

          </Box>
        </Box>
        <Footer />
      </Box>

      <ChurchPrintModal isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} title="CASH BOOK" subtitle={`From ${dateFrom} to ${dateTo}`} church={church} pdfFileName={`CashBook_${dateFrom}_${dateTo}.pdf`}>
        <CashBookPrintTable rows={rows} totals={totals} openingBalance={openingBalance} />
      </ChurchPrintModal>
    </>
  );
};

export default CashBookPage;