// src/components/ReportLedgerTable.jsx

import React, { useMemo, useState } from "react";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";

const DARK = "#182338";
const BLUE = "#1355C4";
const MUTED = "#60708C";
const RED = "#D7193F";
const BORDER = "#E6EAF0";
const HEADER_BG = "#F7F9FB";

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

const formatMoney = (v) =>
  toNumber(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (v) => `₹${formatMoney(v)}`;

const formatDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ReportLedgerTable = ({ rows, isLoading }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalDebit = useMemo(
    () => rows.reduce((s, r) => s + toNumber(r.debit), 0),
    [rows]
  );
  const totalCredit = useMemo(
    () => rows.reduce((s, r) => s + toNumber(r.credit), 0),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pageRows = rows.slice(startIdx, startIdx + pageSize);

  const columns = [
    { key: "date", label: "Date", align: "left" },
    { key: "voucherNo", label: "Voucher No.", align: "left" },
    { key: "voucherType", label: "Voucher Type", align: "left" },
    { key: "particulars", label: "Particulars", align: "left" },
    { key: "account", label: "Cash / Bank Account", align: "left" },
    { key: "debit", label: "Debit (₹)", align: "right" },
    { key: "credit", label: "Credit (₹)", align: "right" },
  ];

  return (
    <Box>
      <Box
        overflowX="auto"
        border={`1px solid ${BORDER}`}
        borderRadius="6px"
        width="100%"
        bg="white"
      >
        <Box as="table" width="100%" minW="1050px" borderCollapse="collapse">
          <Box as="thead">
            <Box as="tr" height="46px" bg={HEADER_BG}>
              {columns.map((c) => (
                <Box
                  as="th"
                  key={c.key}
                  textAlign={c.align}
                  px={4}
                  py={2}
                  fontSize="12px"
                  fontWeight="700"
                  color={DARK}
                  borderBottom={`1px solid ${BORDER}`}
                  whiteSpace="nowrap"
                >
                  {c.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box as="tbody">
            {isLoading ? (
              <Box as="tr">
                <Box as="td" colSpan={7} textAlign="center" height="80px" color={MUTED} fontSize="13px">
                  Loading entries...
                </Box>
              </Box>
            ) : pageRows.length === 0 ? (
              <Box as="tr">
                <Box as="td" colSpan={7} textAlign="center" height="80px" color={MUTED} fontSize="13px">
                  No entries found for the selected filters.
                </Box>
              </Box>
            ) : (
              pageRows.map((r, idx) => (
                <Box as="tr" key={r.key || idx} height="48px" _hover={{ bg: "#FAFBFD" }}>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {formatDate(r.date)}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {r.voucherNo || "—"}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {r.voucherType || "—"}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" borderBottom={`1px solid ${BORDER}`}>
                    {r.particulars || "—"}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {r.account || "—"}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" textAlign="right" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {r.debit ? formatAmount(r.debit) : "—"}
                  </Box>
                  <Box as="td" px={4} py={2} fontSize="13px" color={BLUE} fontWeight="500" textAlign="right" borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                    {r.credit ? formatAmount(r.credit) : "—"}
                  </Box>
                </Box>
              ))
            )}

            {!isLoading && rows.length > 0 && (
              <Box as="tr" height="50px" bg="white">
                <Box as="td" colSpan={5} px={4} py={2} textAlign="right" fontSize="13px" fontWeight="700" color={DARK} borderBottom={`1px solid ${BORDER}`}>
                  Total
                </Box>
                <Box as="td" px={4} py={2} textAlign="right" fontSize="13px" fontWeight="700" color={DARK} borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                  {formatAmount(totalDebit)}
                </Box>
                <Box as="td" px={4} py={2} textAlign="right" fontSize="13px" fontWeight="700" color={DARK} borderBottom={`1px solid ${BORDER}`} whiteSpace="nowrap">
                  {formatAmount(totalCredit)}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Flex
        justify="space-between"
        align="center"
        mt={3}
        fontSize="12px"
        color={MUTED}
        direction={{ base: "column", sm: "row" }}
        gap={3}
      >
        <Text>
          Showing {rows.length === 0 ? "0" : startIdx + 1}–
          {Math.min(startIdx + pageSize, rows.length)} of {rows.length} records
        </Text>

        <HStack gap={2}>
          <Button
            variant="ghost"
            size="sm"
            fontSize="12px"
            color={page === 1 ? "#B8C0CE" : RED}
            fontWeight="600"
            isDisabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            _hover={{ bg: "transparent", color: RED }}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const active = n === page;
            return (
              <Button
                key={n}
                size="sm"
                minW="32px"
                h="32px"
                px={2}
                fontSize="12px"
                fontWeight="700"
                borderRadius="6px"
                bg={active ? RED : "transparent"}
                color={active ? "white" : DARK}
                border={active ? "none" : `1px solid ${BORDER}`}
                onClick={() => setPage(n)}
                _hover={{ bg: active ? RED : "#F7F9FB" }}
              >
                {n}
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            fontSize="12px"
            color={page === totalPages ? "#B8C0CE" : RED}
            fontWeight="600"
            isDisabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            _hover={{ bg: "transparent", color: RED }}
          >
            Next
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default ReportLedgerTable;