import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Flex, Heading, HStack, Icon, Text, Badge,
} from "@chakra-ui/react";
import { LuPrinter, LuFileText, LuArrowLeft, LuChevronLeft, LuChevronRight } from "react-icons/lu";

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

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const extractMemberName = (entry) => {
  if (!entry) return "";
  return entry.member_name || entry.memberName || entry.member?.name || entry.party_name || entry.partyName || "";
};

// ============================================================
// GROUP LEDGER ENTRIES BY VOUCHER
// ============================================================
const groupLedgerEntries = (entries) => {
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
        amount: 0, direction: "DEBIT", memberName: "", _entries: [],
      });
    }

    const g = groups.get(key);
    g._entries.push(e);

    if (!g.memberName) {
      const name = extractMemberName(e);
      if (name) g.memberName = name;
    }

    const amt = toNumber(e.amount);
    const isCashOrBank = e.ledger_name?.toLowerCase().includes("cash") || e.ledger_name?.toLowerCase().includes("bank") || e.ledger_name?.toLowerCase().includes("savings");

    if (isCashOrBank) {
      if (!g.cashBankAccount) {
        g.cashBankAccount = e.ledger_name || "";
        g.amount = amt;

        // ✅ FIX: Receipts DEBIT the bank. Payments CREDIT the bank.
        if (voucherType === "Receipt") g.direction = "DEBIT";
        else if (voucherType === "Payment") g.direction = "CREDIT";
        else g.direction = e.entry_type === "DEBIT" ? "CREDIT" : "DEBIT";
      } else {
        if (!g.particulars) g.particulars = e.ledger_name || "";
      }
    } else {
      if (!g.particulars) g.particulars = e.ledger_name || "";
    }
  });

  return Array.from(groups.values()).map((g) => {
    if (!g.cashBankAccount) {
      const anyLedger = g._entries.find((x) => x.ledger_name);
      g.cashBankAccount = anyLedger ? anyLedger.ledger_name : "—";
      if (g.amount === 0 && g._entries[0]) {
        g.amount = toNumber(g._entries[0].amount);
        g.direction = g._entries[0].entry_type;
      }
    }

    if (!g.particulars) {
      const otherLedger = g._entries.find((x) => x.ledger_name && !x.ledger_name.toLowerCase().includes("cash") && !x.ledger_name.toLowerCase().includes("bank"));
      g.particulars = otherLedger ? otherLedger.ledger_name : g._entries[0]?.ledger_name || "—";
    }

    delete g._entries;
    return g;
  });
};

// ============================================================
// PRINT TABLE
// ============================================================
const DayBookPrintTable = ({ rows, totals, closingBalance, dateFrom, dateTo }) => {
  const thStyle = { border: "1px solid #F0C2C2", padding: "10px 8px", background: "#FCEAEC", color: "#8B1A1A", fontWeight: "bold", fontSize: "13px" };
  const tdStyle = { border: "1px solid #F0C2C2", padding: "10px 8px", fontSize: "13px", color: "#333" };

  return (
    <Box fontFamily="'Georgia', serif">
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher No.</th>
            <th style={thStyle}>Voucher Type</th>
            <th style={thStyle}>Particulars</th>
            <th style={thStyle}>Cash / Bank Account</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Debit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Credit (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFF9F9" }}>
              <td style={tdStyle}>{formatDateDisplay(r.date)}</td>
              <td style={tdStyle}>{r.voucherNo}</td>
              <td style={tdStyle}>{r.voucherType}</td>
              <td style={tdStyle}>{r.particulars}</td>
              <td style={tdStyle}>{r.cashBankAccount}</td>
              <td style={{ ...tdStyle, textAlign: "right", color: "#B71C1C" }}>{r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}</td>
              <td style={{ ...tdStyle, textAlign: "right", color: "#2E7D32" }}>{r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}</td>
            </tr>
          ))}
          <tr style={{ background: "#FCEAEC" }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>Total</td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#B71C1C" }}>₹{fmt(totals.debit)}</td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#2E7D32" }}>₹{fmt(totals.credit)}</td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const DayBookPage = () => {
  const navigate = useNavigate();
  const [rawEntries, setRawEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [closingBalance, setClosingBalance] = useState(0);
  const [church, setChurch] = useState({ name: "", address: "" });
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchChurch = async () => {
      try {
        const res = await getMyChurch();
        const c = res?.data ?? res ?? {};
        setChurch({ name: c.name || "Church", address: c.full_address || c.address || "" });
      } catch (err) { console.error(err); }
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

      setClosingBalance(Number(body.closing_balance ?? 0));
      setRawEntries(data);
    } catch (err) {
      toaster.create({ title: "Failed to load", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const rows = useMemo(() => {
    let grouped = groupLedgerEntries(rawEntries);
    if (search) {
      const kw = search.toLowerCase();
      grouped = grouped.filter((r) => 
        String(r.particulars || "").toLowerCase().includes(kw) ||
        String(r.voucherNo || "").toLowerCase().includes(kw) ||
        String(r.cashBankAccount || "").toLowerCase().includes(kw)
      );
    }
    grouped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return grouped;
  }, [rawEntries, search]);

  const totals = useMemo(() => {
    let credit = 0, debit = 0;
    rows.forEach((r) => {
      if (r.direction === "CREDIT") credit += r.amount;
      else if (r.direction === "DEBIT") debit += r.amount;
    });
    return { credit, debit };
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <Box minH="100vh" bg="#F8F9FA" display="flex" flexDirection="column">
        <Navbar />

        <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
          
          <HStack gap={2} mb={4} color={MUTED} fontSize="12px">
            <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
            <Text>/</Text>
            <Text>Day Book</Text>
          </HStack>

          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={6} direction={{ base: "column", md: "row" }}>
            <Box>
              <Text fontSize="12px" fontWeight="700" color={RED} mb={1}>DAY BOOK REPORT</Text>
              <Heading color={DARK} fontSize="28px" mb={1}>Day Book</Heading>
              <Text color={MUTED} fontSize="13px">View all cash and bank transactions for the selected date.</Text>
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
              onReset={() => { setSearch(""); setDateFrom(todayISO()); setDateTo(todayISO()); }}
            />

            <Box overflowX="auto" mt={4} border="1px solid" borderColor={BORDER} borderRadius="6px">
              <Box as="table" width="100%" borderCollapse="collapse">
                <Box as="thead" bg="#F8F9FA">
                  <Box as="tr">
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Date</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Voucher No.</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Voucher Type</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Particulars</Box>
                    <Box as="th" textAlign="left" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Cash / Bank Account</Box>
                    <Box as="th" textAlign="right" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Debit (₹)</Box>
                    <Box as="th" textAlign="right" px={4} py={3} fontSize="12px" color={DARK} borderBottom="1px solid" borderColor={BORDER}>Credit (₹)</Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {isLoading ? (
                    <Box as="tr"><Box as="td" colSpan={7} textAlign="center" py={6} fontSize="13px">Loading...</Box></Box>
                  ) : paginatedRows.length === 0 ? (
                    <Box as="tr"><Box as="td" colSpan={7} textAlign="center" py={6} fontSize="13px" color={MUTED}>No records found for this period.</Box></Box>
                  ) : (
                    paginatedRows.map((r) => (
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
                          {r.memberName && <Text fontSize="11px" color={MUTED}>{r.memberName}</Text>}
                        </Box>
                        <Box as="td" px={4} py={3} fontSize="13px">{r.cashBankAccount}</Box>
                        <Box as="td" px={4} py={3} fontSize="13px" textAlign="right" color={r.direction === "DEBIT" ? "#B71C1C" : "transparent"} fontWeight={r.direction === "DEBIT" ? "700" : "400"}>
                          {r.direction === "DEBIT" ? `₹${fmt(r.amount)}` : "—"}
                        </Box>
                        <Box as="td" px={4} py={3} fontSize="13px" textAlign="right" color={r.direction === "CREDIT" ? "#2E7D32" : "transparent"} fontWeight={r.direction === "CREDIT" ? "700" : "400"}>
                          {r.direction === "CREDIT" ? `₹${fmt(r.amount)}` : "—"}
                        </Box>
                      </Box>
                    ))
                  )}
                  
                  {!isLoading && paginatedRows.length > 0 && (
                    <Box as="tr" bg="#F8F9FA" fontWeight="bold">
                      <Box as="td" colSpan={5} textAlign="right" px={4} py={3} fontSize="13px" color={DARK}>Total</Box>
                      <Box as="td" textAlign="right" px={4} py={3} fontSize="13px" color="#B71C1C">₹{fmt(totals.debit)}</Box>
                      <Box as="td" textAlign="right" px={4} py={3} fontSize="13px" color="#2E7D32">₹{fmt(totals.credit)}</Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Flex justify="space-between" align="center" mt={4}>
              <Text fontSize="12px" color={MUTED}>
                Showing {rows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length} records
              </Text>
              
              <HStack gap={1}>
                <Button size="xs" variant="ghost" color={BLUE} disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
                  <Icon as={LuChevronLeft} /> Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i} size="xs" minW="24px" h="24px" p={0} 
                    bg={currentPage === i + 1 ? RED : "transparent"} 
                    color={currentPage === i + 1 ? "white" : DARK}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button size="xs" variant="ghost" color={BLUE} disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}>
                  Next <Icon as={LuChevronRight} />
                </Button>
              </HStack>
            </Flex>
          </Box>

          <Box mt={6} bg="white" border="1px solid" borderColor={BORDER} borderRadius="8px" p={4}>
            <Flex justify="flex-end" align="center" gap={4}>
              <Text fontSize="13px" fontWeight="700" color={MUTED} letterSpacing="0.5px">
                CLOSING BALANCE AS OF {formatDateDisplay(dateTo)}
              </Text>
              <Text fontSize="24px" fontWeight="800" color={DARK}>
                ₹{fmt(closingBalance)}
              </Text>
            </Flex>
          </Box>

        </Box>

        <Footer />
      </Box>

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="DAY BOOK"
        subtitle={`From ${dateFrom} to ${dateTo}`}
        church={church}
        pdfFileName={`DayBook_${dateFrom}.pdf`}
        defaultOrientation="portrait"
      >
        <DayBookPrintTable rows={rows} totals={totals} closingBalance={closingBalance} dateFrom={dateFrom} dateTo={dateTo} />
      </ChurchPrintModal>
    </>
  );
};

export default DayBookPage;