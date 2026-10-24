// src/pages/GeneralLedgerPage.jsx

import React, { useEffect, useState, useMemo, useRef } from "react";
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
  Input,
} from "@chakra-ui/react";
import {
  LuPrinter,
  LuFileText,
  LuChevronDown,
  LuSearch,
  LuX,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportLedgerTable from "../components/ReportLedgerTable";
import ChurchPrintModal from "../components/ChurchPrintModal";

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

// ============================================================
// FORMAT HELPERS
// ============================================================

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

// ✅ Dr / Cr label based on nature + sign
//   ASSET / EXPENSE  → +ve = Dr, -ve = Cr
//   LIABILITY / INCOME / EQUITY → +ve = Cr, -ve = Dr
const isDebitNature = (nature) =>
  nature === "ASSET" || nature === "EXPENSE";

const balanceOnDebitSide = (amount, nature) => {
  const dn = isDebitNature(nature);
  const positive = amount >= 0;
  return (dn && positive) || (!dn && !positive);
};

const formatBalanceWithSide = (amount, nature) => {
  const onDebit = balanceOnDebitSide(amount, nature);
  const abs = Math.abs(amount || 0);
  const side = onDebit ? "Dr" : "Cr";
  return `₹ ${formatMoney(abs)} ${side}`;
};

// ============================================================
// BUILD ROWS WITH COUNTER-LEDGER PARTICULARS
// ============================================================

const buildRowsWithParticulars = (entries) => {
  const byVoucher = new Map();
  entries.forEach((e) => {
    const voucherNo =
      e.receipt_voucher || e.payment_voucher || e.contra_voucher || null;
    const key = voucherNo
      ? `${
          e.receipt_voucher
            ? "R"
            : e.payment_voucher
            ? "P"
            : e.contra_voucher
            ? "C"
            : "J"
        }|${voucherNo}|${e.entry_date}`
      : `ORPHAN|${e.id}`;
    if (!byVoucher.has(key)) byVoucher.set(key, []);
    byVoucher.get(key).push(e);
  });

  return entries
    .filter((e) => !e.is_cancelled)
    .map((e) => {
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
        ? `${
            e.receipt_voucher
              ? "R"
              : e.payment_voucher
              ? "P"
              : e.contra_voucher
              ? "C"
              : "J"
          }|${voucherNo}|${e.entry_date}`
        : `ORPHAN|${e.id}`;
      const siblings = byVoucher.get(key) || [];

      const counterLeg = siblings.find(
        (s) =>
          String(s.ledger) !== String(e.ledger) &&
          s.ledger_name &&
          !s.is_cancelled
      );

      return {
        key: e.id,
        date: e.entry_date,
        voucherNo: voucherNo || "—",
        voucherType,
        particulars:
          counterLeg?.ledger_name || e.narration || e.ledger_name || "—",
        account: e.ledger_name,
        amount: toNumber(e.amount),
        direction: e.entry_type === "DEBIT" ? "DEBIT" : "CREDIT",
      };
    });
};

// ============================================================
// SEARCHABLE LEDGER PICKER
// ============================================================

const SearchableLedgerPicker = ({
  ledgers,
  value,
  onChange,
  placeholder = "Select ledger",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLedger = ledgers.find((l) => String(l.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ledgers;
    return ledgers.filter((l) => {
      const name = String(l.ledger_name || "").toLowerCase();
      const group = String(l.account_group_name || "").toLowerCase();
      return name.includes(q) || group.includes(q);
    });
  }, [ledgers, query]);

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
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const handleSelect = (ledger) => {
    onChange(String(ledger.id));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <Box ref={containerRef} position="relative" w="100%" minW="240px">
      {isOpen ? (
        <Box position="relative">
          <Icon
            as={LuSearch}
            position="absolute"
            left="11px"
            top="50%"
            transform="translateY(-50%)"
            color={MUTED}
            boxSize={4}
            pointerEvents="none"
            zIndex={1}
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ledger..."
            pl="34px"
            pr="34px"
            h="38px"
            fontSize="12px"
            borderColor={RED}
            borderRadius="6px"
            bg="white"
            _focus={{ borderColor: RED, boxShadow: `0 0 0 1px ${RED}` }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
              } else if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <Icon
            as={LuX}
            position="absolute"
            right="11px"
            top="50%"
            transform="translateY(-50%)"
            color={MUTED}
            boxSize={4}
            cursor="pointer"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            zIndex={1}
          />
        </Box>
      ) : (
        <Flex
          onClick={() => setIsOpen(true)}
          h="38px"
          border={`1px solid ${BORDER}`}
          borderRadius="6px"
          px="11px"
          align="center"
          justify="space-between"
          cursor="pointer"
          bg="white"
          _hover={{ borderColor: MUTED }}
        >
          <Text
            fontSize="12px"
            color={selectedLedger ? DARK : MUTED}
            noOfLines={1}
          >
            {selectedLedger?.ledger_name || placeholder}
          </Text>
          <HStack gap={1} flexShrink={0}>
            {selectedLedger && (
              <Icon
                as={LuX}
                boxSize={3.5}
                color={MUTED}
                onClick={handleClear}
                _hover={{ color: RED }}
              />
            )}
            <Icon as={LuChevronDown} boxSize={4} color={DARK} />
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
          border={`1px solid ${BORDER}`}
          borderRadius="6px"
          boxShadow="0 6px 20px rgba(0,0,0,0.12)"
          maxH="260px"
          overflowY="auto"
          zIndex={30}
        >
          {filtered.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="12px" color={MUTED}>
                No ledgers found
              </Text>
            </Box>
          ) : (
            filtered.map((l) => {
              const isSelected = String(l.id) === String(value);
              return (
                <Box
                  key={l.id}
                  px={3}
                  py={2}
                  fontSize="12px"
                  color={DARK}
                  cursor="pointer"
                  bg={isSelected ? "#FDF2F5" : "white"}
                  _hover={{ bg: "#F7F9FB" }}
                  onClick={() => handleSelect(l)}
                >
                  <Text fontWeight={isSelected ? "600" : "500"}>
                    {l.ledger_name}
                  </Text>
                  {l.account_group_name && (
                    <Text fontSize="10px" color={MUTED}>
                      {l.account_group_name}
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
// SUMMARY CELL
// ============================================================

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

// ============================================================
// PRINT TABLE
// ============================================================

const GeneralLedgerPrintTable = ({
  rows,
  ledgerName,
  ledgerNature,
  openingBalance,
  totals,
  closingBalance,
}) => {
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

  const openingOnDebit = balanceOnDebitSide(openingBalance, ledgerNature);
  const openingAmount = Math.abs(openingBalance || 0);

  const closingOnDebit = balanceOnDebitSide(closingBalance, ledgerNature);
  const closingAmount = Math.abs(closingBalance || 0);

  return (
    <Box fontFamily="'Georgia', serif">
      {ledgerName && (
        <Box mb={4} textAlign="center">
          <Text fontSize="16px" fontWeight="bold" color="#8B1A1A">
            Ledger: {ledgerName}
          </Text>
          {ledgerNature && (
            <Text fontSize="11px" color="#777" mt={1}>
              Nature: {ledgerNature}
            </Text>
          )}
        </Box>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher</th>
            <th style={thStyle}>Particulars</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Debit (₹)</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Credit (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: "#FFF5F5" }}>
            <td
              colSpan={3}
              style={{ ...tdStyle, fontWeight: "bold", color: "#8B1A1A" }}
            >
              Opening Balance
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              {openingOnDebit ? `₹${formatMoney(openingAmount)}` : "—"}
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              {openingOnDebit ? "—" : `₹${formatMoney(openingAmount)}`}
            </td>
          </tr>

          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
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
                style={{
                  background: i % 2 === 0 ? "#FFFFFF" : "#FFF9F9",
                }}
              >
                <td style={tdStyle}>{r.date}</td>
                <td style={tdStyle}>
                  <div>{r.voucherNo}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>
                    {r.voucherType}
                  </div>
                </td>
                <td style={{ ...tdStyle, color: "#8B1A1A" }}>
                  {r.particulars}
                </td>
                <td style={{ ...numStyle, color: "#B71C1C" }}>
                  {r.direction === "DEBIT"
                    ? `₹${formatMoney(r.amount)}`
                    : "—"}
                </td>
                <td style={{ ...numStyle, color: "#2E7D32" }}>
                  {r.direction === "CREDIT"
                    ? `₹${formatMoney(r.amount)}`
                    : "—"}
                </td>
              </tr>
            ))
          )}

          <tr
            style={{
              background: "#FCEAEC",
              borderTop: "1px solid #F0C2C2",
            }}
          >
            <td
              colSpan={3}
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
                color: "#8B1A1A",
              }}
            >
              Total
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#B71C1C" }}>
              ₹{formatMoney(totals.debit)}
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#2E7D32" }}>
              ₹{formatMoney(totals.credit)}
            </td>
          </tr>

          <tr style={{ background: "#FFF5F5" }}>
            <td
              colSpan={3}
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
              {closingOnDebit ? `₹${formatMoney(closingAmount)}` : "—"}
            </td>
            <td style={{ ...numStyle, fontWeight: "bold", color: "#8B1A1A" }}>
              {closingOnDebit ? "—" : `₹${formatMoney(closingAmount)}`}
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

  const rows = useMemo(() => {
    let grouped = buildRowsWithParticulars(rawEntries);

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

  const totals = useMemo(
    () => ({
      credit: toNumber(totCredit),
      debit: toNumber(totDebit),
      moneyIn: toNumber(totCredit),
      moneyOut: toNumber(totDebit),
    }),
    [totDebit, totCredit]
  );

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
    <SearchableLedgerPicker
      ledgers={ledgers}
      value={ledgerId}
      onChange={setLedgerId}
      placeholder="Select ledger"
    />
  );

  const nature = selectedLedger?.ledger_nature || "ASSET";

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

          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="8px"
            p={3}
            bg="white"
          >
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

            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 4 }}
              gap={3}
              mb={3}
            >
              <SummaryCell
                label="Opening Balance"
                value={formatBalanceWithSide(opening, nature)}
              />
              <SummaryCell
                label="Total Debit"
                value={formatAmount(totDebit)}
                color="#B71C1C"
              />
              <SummaryCell
                label="Total Credit"
                value={formatAmount(totCredit)}
                color="#2E7D32"
              />
              <SummaryCell
                label="Closing Balance"
                value={formatBalanceWithSide(closing, nature)}
                color={closing < 0 ? RED : DARK}
              />
            </SimpleGrid>

            <ReportLedgerTable
              rows={rows}
              isLoading={isLoading}
              openingBalance={opening}
              ledgerNature={nature}
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
        title="GENERAL LEDGER"
        subtitle={
          dateFrom && dateTo
            ? `From ${dateFrom} to ${dateTo}`
            : dateTo
            ? `Up to ${dateTo}`
            : ""
        }
        church={church}
        pdfFileName={`GeneralLedger_${selectedLedger?.ledger_name || "Report"}.pdf`}
        defaultOrientation="portrait"
      >
        <GeneralLedgerPrintTable
          rows={rows}
          ledgerName={selectedLedger?.ledger_name || ""}
          ledgerNature={nature}
          openingBalance={opening}
          totals={totals}
          closingBalance={closing}
        />
      </ChurchPrintModal>
    </>
  );
};

export default GeneralLedgerPage;