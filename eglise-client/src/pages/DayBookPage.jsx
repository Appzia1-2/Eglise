
import React, { useEffect, useMemo, useState } from "react";
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
import {
  LuPrinter,
  LuFileText,
  LuArrowLeft,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportFilterBar from "../components/ReportFilterBar";
import ChurchPrintModal from "../components/ChurchPrintModal";
import { toaster } from "../components/ui/toaster";
import {
  listLedgerEntries,
  getMyChurch,
} from "../api/registryServices";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";
const BLUE = "#1A73E8";

const todayISO = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(number) ? number : 0;
};

const fmt = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const extractMemberName = (entry) => {
  if (!entry) return "";

  return (
    entry.member_name ||
    entry.memberName ||
    entry.member?.name ||
    entry.party_name ||
    entry.partyName ||
    ""
  );
};

const getVoucherType = (entry) => {
  if (entry.receipt_voucher) return "Receipt";
  if (entry.payment_voucher) return "Payment";
  if (entry.contra_voucher) return "Contra";

  return "Journal";
};

// ============================================================
// ONE ROW PER VOUCHER
//
// Receipt: show the income ledger CREDIT side.
// Payment: show the expense ledger DEBIT side.
// Contra: show both sides in one row.
// Journal: show the voucher's debit and credit totals in one row.
// ============================================================
const groupLedgerEntries = (entries) => {
  const groups = new Map();

  entries.forEach((entry) => {
    if (entry.is_cancelled || entry.is_reversal) return;

    const voucherNo =
      entry.receipt_voucher ||
      entry.payment_voucher ||
      entry.contra_voucher ||
      null;

    const voucherType = getVoucherType(entry);

    const key = voucherNo
      ? `${voucherType}|${voucherNo}|${entry.entry_date}`
      : `ORPHAN|${entry.id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: entry.entry_date,
        voucherNo: voucherNo || "—",
        voucherType,
        narration: entry.narration || "",
        entries: [],
      });
    }

    groups.get(key).entries.push(entry);
  });

  const rows = [];

  groups.forEach((group) => {
    const debitEntries = group.entries.filter(
      (entry) => String(entry.entry_type || "").toUpperCase() === "DEBIT"
    );

    const creditEntries = group.entries.filter(
      (entry) => String(entry.entry_type || "").toUpperCase() === "CREDIT"
    );

    let selectedEntries = [];
    let debitAmount = 0;
    let creditAmount = 0;
    let particulars = group.narration || "—";
    let ledgerAccount = "—";
    let memberName = "";

    if (group.voucherType === "Receipt") {
      // Receipt: select only the income CREDIT ledger.
      const selected =
        creditEntries[0] || group.entries[0];

      selectedEntries = selected ? [selected] : [];

      if (selected) {
        creditAmount = toNumber(selected.amount);
        ledgerAccount = selected.ledger_name || "—";

        const counterpart = group.entries.find(
          (entry) => entry.id !== selected.id
        );

        particulars =
          counterpart?.ledger_name ||
          selected.narration ||
          group.narration ||
          "—";

        memberName = extractMemberName(selected);
      }
    } else if (group.voucherType === "Payment") {
      // Payment: select only the expense DEBIT ledger.
      const selected =
        debitEntries[0] || group.entries[0];

      selectedEntries = selected ? [selected] : [];

      if (selected) {
        debitAmount = toNumber(selected.amount);
        ledgerAccount = selected.ledger_name || "—";

        const counterpart = group.entries.find(
          (entry) => entry.id !== selected.id
        );

        particulars =
          counterpart?.ledger_name ||
          selected.narration ||
          group.narration ||
          "—";

        memberName = extractMemberName(selected);
      }
    } else if (group.voucherType === "Contra") {
      // Contra: one row, showing both sides of the transfer.
      debitAmount = debitEntries.reduce(
        (sum, entry) => sum + toNumber(entry.amount),
        0
      );

      creditAmount = creditEntries.reduce(
        (sum, entry) => sum + toNumber(entry.amount),
        0
      );

      const debitNames = debitEntries
        .map((entry) => entry.ledger_name)
        .filter(Boolean);

      const creditNames = creditEntries
        .map((entry) => entry.ledger_name)
        .filter(Boolean);

      particulars =
        creditNames.length && debitNames.length
          ? `Transfer from ${creditNames.join(", ")} to ${debitNames.join(", ")}`
          : group.narration || "Contra transfer";

      ledgerAccount = [
        ...new Set([...debitNames, ...creditNames]),
      ].join(" / ") || "—";

      selectedEntries = group.entries;
    } else {
      // Journal: combine all postings into one voucher row.
      debitAmount = debitEntries.reduce(
        (sum, entry) => sum + toNumber(entry.amount),
        0
      );

      creditAmount = creditEntries.reduce(
        (sum, entry) => sum + toNumber(entry.amount),
        0
      );

      const accountNames = [
        ...new Set(
          group.entries
            .map((entry) => entry.ledger_name)
            .filter(Boolean)
        ),
      ];

      ledgerAccount = accountNames.join(" / ") || "—";
      particulars = group.narration || "Journal entry";
      selectedEntries = group.entries;
    }

    rows.push({
      key: group.key,
      date: group.date,
      voucherNo: group.voucherNo,
      voucherType: group.voucherType,
      particulars,
      ledgerAccount,
      debitAmount,
      creditAmount,
      memberName:
        memberName ||
        selectedEntries.map(extractMemberName).find(Boolean) ||
        "",
      narration: group.narration,
    });
  });

  return rows;
};

// ============================================================
// PRINT TABLE
// ============================================================
const DayBookPrintTable = ({
  rows,
  totals,
  closingBalance,
  dateFrom,
  dateTo,
}) => {
  const thStyle = {
    border: "1px solid #DCE2EA",
    padding: "9px 7px",
    background: "#FCEAEC",
    color: "#8B1A1A",
    fontWeight: "bold",
    fontSize: "12px",
  };

  const tdStyle = {
    border: "1px solid #DCE2EA",
    padding: "8px 7px",
    fontSize: "12px",
    color: "#333",
  };

  return (
    <Box fontFamily="'Georgia', serif">
      <Box mb={3}>
        <Text fontSize="15px" fontWeight="bold">
          DAY BOOK
        </Text>

        <Text fontSize="12px">
          Period: {formatDateDisplay(dateFrom)} to{" "}
          {formatDateDisplay(dateTo)}
        </Text>
      </Box>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "15px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Voucher No.</th>
            <th style={thStyle}>Voucher Type</th>
            <th style={thStyle}>Particulars</th>
            <th style={thStyle}>Ledger Account</th>
            <th style={{ ...thStyle, textAlign: "right" }}>
              Debit (₹)
            </th>
            <th style={{ ...thStyle, textAlign: "right" }}>
              Credit (₹)
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key}
              style={{
                background: index % 2 === 0 ? "#FFFFFF" : "#FFF9F9",
              }}
            >
              <td style={tdStyle}>
                {formatDateDisplay(row.date)}
              </td>
              <td style={tdStyle}>{row.voucherNo}</td>
              <td style={tdStyle}>{row.voucherType}</td>
              <td style={tdStyle}>{row.particulars}</td>
              <td style={tdStyle}>{row.ledgerAccount}</td>

              <td
                style={{
                  ...tdStyle,
                  textAlign: "right",
                  color: "#B71C1C",
                }}
              >
                {row.debitAmount
                  ? `₹${fmt(row.debitAmount)}`
                  : "—"}
              </td>

              <td
                style={{
                  ...tdStyle,
                  textAlign: "right",
                  color: "#2E7D32",
                }}
              >
                {row.creditAmount
                  ? `₹${fmt(row.creditAmount)}`
                  : "—"}
              </td>
            </tr>
          ))}

          <tr style={{ background: "#FCEAEC" }}>
            <td
              colSpan={5}
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              Total
            </td>

            <td
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
                color: "#B71C1C",
              }}
            >
              ₹{fmt(totals.debit)}
            </td>

            <td
              style={{
                ...tdStyle,
                textAlign: "right",
                fontWeight: "bold",
                color: "#2E7D32",
              }}
            >
              ₹{fmt(totals.credit)}
            </td>
          </tr>
        </tbody>
      </table>

      <Box mt={4} textAlign="right">
        <Text fontSize="12px" fontWeight="bold">
          Closing Cash / Bank Balance as of{" "}
          {formatDateDisplay(dateTo)}
        </Text>

        <Text fontSize="16px" fontWeight="bold">
          ₹{fmt(closingBalance)}
        </Text>
      </Box>
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

  const [church, setChurch] = useState({
    name: "",
    address: "",
  });

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  // LOAD CHURCH DETAILS
  useEffect(() => {
    let active = true;

    const fetchChurch = async () => {
      try {
        const res = await getMyChurch();
        const data = res?.data ?? res ?? {};

        if (!active) return;

        setChurch({
          name: data.name || "Church",
          address: data.full_address || data.address || "",
        });
      } catch (error) {
        console.error("Church loading error:", error);
      }
    };

    fetchChurch();

    return () => {
      active = false;
    };
  }, []);

  // LOAD LEDGER ENTRIES
  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const params = {};

        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;

        const response = await listLedgerEntries(params);
        const body = response?.data ?? {};

        let data = body.results ?? body ?? [];

        if (!Array.isArray(data)) {
          data = [];
        }

        if (!active) return;

        setRawEntries(data);
        setClosingBalance(Number(body.closing_balance ?? 0));
      } catch (error) {
        console.error("Day Book loading error:", error);

        if (active) {
          setRawEntries([]);

          toaster.create({
            title: "Failed to load Day Book",
            description:
              error?.response?.data?.detail || "Please try again.",
            type: "error",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [dateFrom, dateTo]);

  // GROUP AND FILTER ROWS
  const rows = useMemo(() => {
    let result = groupLedgerEntries(rawEntries);

    if (search.trim()) {
      const keyword = search.toLowerCase().trim();

      result = result.filter((row) =>
        [
          row.particulars,
          row.voucherNo,
          row.voucherType,
          row.ledgerAccount,
          row.memberName,
          row.narration,
        ].some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        )
      );
    }

    result.sort((a, b) => {
      const dateCompare =
        new Date(b.date).getTime() - new Date(a.date).getTime();

      if (dateCompare !== 0) return dateCompare;

      return String(b.voucherNo).localeCompare(String(a.voucherNo));
    });

    return result;
  }, [rawEntries, search]);

  // TOTALS OF THE DISPLAYED VOUCHER ROWS
  const totals = useMemo(() => {
    return rows.reduce(
      (result, row) => {
        result.debit += row.debitAmount;
        result.credit += row.creditAmount;
        return result;
      },
      { debit: 0, credit: 0 }
    );
  }, [rows]);

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / pageSize)
  );

  const paginatedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, search]);

  return (
    <>
      <Box
        minH="100vh"
        bg="#F8F9FA"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box
          flex="1"
          w="100%"
          px={{ base: 3, md: 6 }}
          py={{ base: 4, md: 6 }}
        >
          {/* BREADCRUMB */}
          <HStack gap={2} mb={4} color={MUTED} fontSize="12px">
            <Text
              color={BLUE}
              cursor="pointer"
              onClick={() => navigate("/reports")}
            >
              Reports
            </Text>

            <Text>/</Text>
            <Text>Day Book</Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={6}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="12px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                DAY BOOK REPORT
              </Text>

              <Heading color={DARK} fontSize="28px" mb={1}>
                Day Book
              </Heading>

              <Text color={MUTED} fontSize="13px">
                Voucher-wise receipt, payment and contra transactions.
              </Text>
            </Box>

            <HStack gap={3} flexWrap="wrap">
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                bg="white"
                h="40px"
                px={5}
                borderRadius="6px"
                onClick={() => navigate("/reports")}
              >
                <Icon as={LuArrowLeft} mr={2} />
                Back
              </Button>

              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                bg="white"
                h="40px"
                px={5}
                borderRadius="6px"
                onClick={() => setIsPrintOpen(true)}
              >
                <Icon as={LuPrinter} mr={2} />
                Print
              </Button>

              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                bg="white"
                h="40px"
                px={5}
                borderRadius="6px"
                onClick={() => setIsPrintOpen(true)}
              >
                <Icon as={LuFileText} mr={2} />
                Generate PDF
              </Button>
            </HStack>
          </Flex>

          {/* REPORT */}
          <Box
            bg="white"
            borderRadius="8px"
            border="1px solid"
            borderColor={BORDER}
            p={4}
          >
            <ReportFilterBar
              search={search}
              setSearch={setSearch}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              onReset={() => {
                setSearch("");
                setDateFrom(todayISO());
                setDateTo(todayISO());
              }}
            />

            {/* TABLE */}
            <Box
              overflowX="auto"
              mt={4}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="6px"
            >
              <Box
                as="table"
                width="100%"
                borderCollapse="collapse"
                minW="900px"
              >
                <Box as="thead" bg="#F8F9FA">
                  <Box as="tr">
                    {[
                      ["Date", "left"],
                      ["Voucher No.", "left"],
                      ["Voucher Type", "left"],
                      ["Particulars", "left"],
                      ["Ledger Account", "left"],
                      ["Debit (₹)", "right"],
                      ["Credit (₹)", "right"],
                    ].map(([label, align]) => (
                      <Box
                        as="th"
                        key={label}
                        textAlign={align}
                        px={4}
                        py={3}
                        fontSize="12px"
                        color={DARK}
                        borderBottom="1px solid"
                        borderColor={BORDER}
                        whiteSpace="nowrap"
                      >
                        {label}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {isLoading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        py={6}
                        fontSize="13px"
                      >
                        Loading...
                      </Box>
                    </Box>
                  ) : paginatedRows.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        py={6}
                        fontSize="13px"
                        color={MUTED}
                      >
                        No records found for this period.
                      </Box>
                    </Box>
                  ) : (
                    paginatedRows.map((row) => (
                      <Box
                        as="tr"
                        key={row.key}
                        _hover={{ bg: "#F8F9FA" }}
                        borderBottom="1px solid"
                        borderColor="#E6EAF0"
                      >
                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="13px"
                          color={DARK}
                          whiteSpace="nowrap"
                        >
                          {formatDateDisplay(row.date)}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="13px"
                          color={BLUE}
                          whiteSpace="nowrap"
                        >
                          {row.voucherNo}
                        </Box>

                        <Box as="td" px={4} py={3} fontSize="13px">
                          <Badge
                            colorScheme={
                              row.voucherType === "Receipt"
                                ? "green"
                                : row.voucherType === "Payment"
                                ? "red"
                                : row.voucherType === "Contra"
                                ? "blue"
                                : "purple"
                            }
                            variant="subtle"
                          >
                            {row.voucherType}
                          </Badge>
                        </Box>

                        <Box as="td" px={4} py={3} fontSize="13px">
                          <Text>{row.particulars}</Text>

                          {row.memberName && (
                            <Text fontSize="11px" color={MUTED}>
                              {row.memberName}
                            </Text>
                          )}
                        </Box>

                        <Box as="td" px={4} py={3} fontSize="13px">
                          {row.ledgerAccount}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="13px"
                          textAlign="right"
                          color={row.debitAmount ? "#B71C1C" : MUTED}
                          fontWeight={row.debitAmount ? "700" : "400"}
                          whiteSpace="nowrap"
                        >
                          {row.debitAmount
                            ? `₹${fmt(row.debitAmount)}`
                            : "—"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="13px"
                          textAlign="right"
                          color={row.creditAmount ? "#2E7D32" : MUTED}
                          fontWeight={row.creditAmount ? "700" : "400"}
                          whiteSpace="nowrap"
                        >
                          {row.creditAmount
                            ? `₹${fmt(row.creditAmount)}`
                            : "—"}
                        </Box>
                      </Box>
                    ))
                  )}

                  {!isLoading && paginatedRows.length > 0 && (
                    <Box as="tr" bg="#F8F9FA" fontWeight="bold">
                      <Box
                        as="td"
                        colSpan={5}
                        textAlign="right"
                        px={4}
                        py={3}
                        fontSize="13px"
                        color={DARK}
                      >
                        Total
                      </Box>

                      <Box
                        as="td"
                        textAlign="right"
                        px={4}
                        py={3}
                        fontSize="13px"
                        color="#B71C1C"
                        whiteSpace="nowrap"
                      >
                        ₹{fmt(totals.debit)}
                      </Box>

                      <Box
                        as="td"
                        textAlign="right"
                        px={4}
                        py={3}
                        fontSize="13px"
                        color="#2E7D32"
                        whiteSpace="nowrap"
                      >
                        ₹{fmt(totals.credit)}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* PAGINATION */}
            <Flex
              justify="space-between"
              align="center"
              mt={4}
              gap={3}
              flexWrap="wrap"
            >
              <Text fontSize="12px" color={MUTED}>
                Showing{" "}
                {rows.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0}
                –
                {Math.min(currentPage * pageSize, rows.length)}{" "}
                of {rows.length} entries
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  color={BLUE}
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => page - 1)
                  }
                >
                  <Icon as={LuChevronLeft} />
                  Previous
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    size="xs"
                    minW="24px"
                    h="24px"
                    p={0}
                    bg={currentPage === i + 1 ? RED : "transparent"}
                    color={currentPage === i + 1 ? "white" : DARK}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  size="xs"
                  variant="ghost"
                  color={BLUE}
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                >
                  Next
                  <Icon as={LuChevronRight} />
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* CLOSING CASH / BANK BALANCE */}
          <Box
            mt={4}
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="8px"
            p={4}
          >
            <Flex
              justify="flex-end"
              align="center"
              gap={4}
              flexWrap="wrap"
            >
              <Text
                fontSize="13px"
                fontWeight="700"
                color={MUTED}
                letterSpacing="0.5px"
              >
                CLOSING CASH / BANK BALANCE AS OF{" "}
                {formatDateDisplay(dateTo)}
              </Text>

              <Text fontSize="24px" fontWeight="800" color={DARK}>
                ₹{fmt(closingBalance)}
              </Text>
            </Flex>
          </Box>
        </Box>

        <Footer />
      </Box>

      {/* PRINT / PDF */}
      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="DAY BOOK"
        subtitle={`From ${dateFrom} to ${dateTo}`}
        church={church}
        pdfFileName={`DayBook_${dateFrom}.pdf`}
        defaultOrientation="landscape"
      >
        <DayBookPrintTable
          rows={rows}
          totals={totals}
          closingBalance={closingBalance}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </ChurchPrintModal>
    </>
  );
};

export default DayBookPage;
