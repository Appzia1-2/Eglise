// src/components/BankBookPrintView.jsx

import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";

// ============================================================
// PALETTE
// ============================================================

const RED = "#8B1A1A";
const RED_TABLE = "#C25A5A";
const RED_FRAME = "#B01818";
const RED_RIBBON_DARK = "#6B0F0F";
const RED_RIBBON_LIGHT = "#A01818";
const PINK_HEADER = "#F5DCDC";
const PINK_HIGHLIGHT = "#F2D5D5";
const CREAM = "#FFFBF3";
const BROWN = "#4A2A1E";

// ============================================================
// HELPERS
// ============================================================

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatAmount = (v) => `₹${formatMoney(v)}`;

const formatDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ============================================================
// CHURCH LINE-ART
// ============================================================

const ChurchIcon = () => (
  <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
    <line x1="60" y1="6" x2="60" y2="20" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="52" y1="12" x2="68" y2="12" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M60 20 L78 36 L78 44 L42 44 L42 36 Z" stroke={RED} strokeWidth="2" fill="white" />
    <circle cx="60" cy="34" r="3.5" stroke={RED} strokeWidth="1.6" fill="white" />
    <rect x="42" y="44" width="36" height="52" stroke={RED} strokeWidth="2" fill="white" />
    <path d="M42 44 L20 58 L20 96 L42 96" stroke={RED} strokeWidth="2" fill="white" />
    <path d="M42 44 L20 58" stroke={RED} strokeWidth="2" fill="none" />
    <path d="M78 44 L100 58 L100 96 L78 96" stroke={RED} strokeWidth="2" fill="white" />
    <path d="M78 44 L100 58" stroke={RED} strokeWidth="2" fill="none" />
    <path d="M27 66 Q27 60 33 60 Q39 60 39 66 L39 78 L27 78 Z"
      stroke={RED} strokeWidth="1.6" fill="white" />
    <line x1="33" y1="60" x2="33" y2="78" stroke={RED} strokeWidth="1.2" />
    <path d="M81 66 Q81 60 87 60 Q93 60 93 66 L93 78 L81 78 Z"
      stroke={RED} strokeWidth="1.6" fill="white" />
    <line x1="87" y1="60" x2="87" y2="78" stroke={RED} strokeWidth="1.2" />
    <path d="M54 96 L54 76 Q54 70 60 70 Q66 70 66 76 L66 96 Z"
      stroke={RED} strokeWidth="1.8" fill="white" />
    <line x1="60" y1="70" x2="60" y2="96" stroke={RED} strokeWidth="1.2" />
    <line x1="14" y1="96" x2="106" y2="96" stroke={RED} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================================
// CORNER FLOURISH
// ============================================================

const CornerFlourish = ({ flip }) => (
  <svg
    width="90"
    height="90"
    viewBox="0 0 90 90"
    style={{
      transform: flip
        ? "scale(-1, -1)"
        : flip === "x"
        ? "scale(-1, 1)"
        : flip === "y"
        ? "scale(1, -1)"
        : "none",
    }}
  >
    <g stroke={RED} strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M6 40 Q6 18 18 12 Q30 6 40 14 Q48 22 36 30 Q26 34 26 24 Q26 16 34 16" />
      <path d="M14 6 Q38 6 40 26" />
      <path d="M6 20 Q20 20 22 34" />
      <path d="M46 12 Q52 8 54 14 Q50 18 46 16 Z" fill={RED} stroke="none" />
      <path d="M12 46 Q8 52 14 54 Q18 50 16 46 Z" fill={RED} stroke="none" />
      <circle cx="34" cy="10" r="1.8" fill={RED} stroke="none" />
      <circle cx="10" cy="34" r="1.8" fill={RED} stroke="none" />
      <path d="M22 22 Q30 22 30 30 Q30 38 22 38" />
    </g>
  </svg>
);

// ============================================================
// RIBBON
// ============================================================

const RibbonTitle = ({ children }) => (
  <Box position="relative" display="inline-block">
    <Box
      position="absolute"
      left="-42px"
      top="50%"
      transform="translateY(-50%)"
      w="46px"
      h="46px"
      zIndex={1}
    >
      <svg viewBox="0 0 50 50" width="46" height="46">
        <path
          d="M48 25 Q38 12 28 14 Q18 16 18 25 Q18 34 28 36 Q38 38 48 25 Z
             M12 14 Q4 19 4 25 Q4 31 12 36 Q7 31 7 25 Q7 19 12 14 Z"
          fill={RED_RIBBON_DARK}
          stroke={RED}
          strokeWidth="1.2"
        />
      </svg>
    </Box>

    <Box
      position="absolute"
      right="-42px"
      top="50%"
      transform="translateY(-50%)"
      w="46px"
      h="46px"
      zIndex={1}
    >
      <svg viewBox="0 0 50 50" width="46" height="46">
        <path
          d="M2 25 Q12 12 22 14 Q32 16 32 25 Q32 34 22 36 Q12 38 2 25 Z
             M38 14 Q46 19 46 25 Q46 31 38 36 Q43 31 43 25 Q43 19 38 14 Z"
          fill={RED_RIBBON_DARK}
          stroke={RED}
          strokeWidth="1.2"
        />
      </svg>
    </Box>

    <Box
      position="relative"
      zIndex={2}
      px={14}
      py="6px"
      bg={`linear-gradient(to bottom, ${RED_RIBBON_LIGHT}, ${RED_RIBBON_DARK})`}
      color="white"
      fontSize="30px"
      fontWeight="700"
      letterSpacing="3px"
      fontFamily="'Georgia', serif"
      style={{
        clipPath:
          "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)",
      }}
    >
      {children}
    </Box>
  </Box>
);

// ============================================================
// COMPONENT
// ============================================================

const BankBookPrintView = ({
  rows = [],
  totals,
  date = "",
  churchName = "Church",
  churchAddress = "",
  openingBalance = 0,
}) => {
  // ----- Totals: prefer the `totals` prop, fall back to summing rows -----
  // Debit column  = money IN  (entry_type DEBIT on cash / bank)
  // Credit column = money OUT (entry_type CREDIT on cash / bank)
  const totalDebit = totals?.moneyIn !== undefined
    ? Number(totals.moneyIn || 0)
    : rows.reduce((s, r) => {
        const amt = Number(r.amount || 0);
        return s + (r.direction === "DEBIT" ? amt : 0);
      }, 0);

  const totalCredit = totals?.moneyOut !== undefined
    ? Number(totals.moneyOut || 0)
    : rows.reduce((s, r) => {
        const amt = Number(r.amount || 0);
        return s + (r.direction === "CREDIT" ? amt : 0);
      }, 0);

  const closingBalance = openingBalance + totalDebit - totalCredit;

  const columns = [
    { key: "date", label: "Date", w: "14%" },
    { key: "voucher", label: "Voucher Number", w: "16%" },
    { key: "type", label: "Voucher Type", w: "14%" },
    { key: "ledger", label: "Bank Account", w: "26%" },
    { key: "credit", label: "Credit (₹)", w: "15%", align: "right" },
    { key: "debit", label: "Debit (₹)", w: "15%", align: "right" },
  ];

  return (
    <Box
      className="bankbook-print"
      bg={CREAM}
      p="6mm"
      fontFamily="'Georgia', 'Times New Roman', serif"
      color={RED}
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
      }}
    >
      <Box
        position="relative"
        border={`1.5px solid ${RED_FRAME}`}
        p="14px"
        minH="285mm"
        bg={CREAM}
      >
        <Box
          position="absolute"
          top="5px"
          left="5px"
          right="5px"
          bottom="5px"
          border={`1px solid ${RED_FRAME}`}
          pointerEvents="none"
        />

        <Box position="absolute" top="-6px" left="-6px" zIndex={5}>
          <CornerFlourish />
        </Box>
        <Box position="absolute" top="-6px" right="-6px" zIndex={5}>
          <CornerFlourish flip="x" />
        </Box>
        <Box position="absolute" bottom="-6px" left="-6px" zIndex={5}>
          <CornerFlourish flip="y" />
        </Box>
        <Box position="absolute" bottom="-6px" right="-6px" zIndex={5}>
          <CornerFlourish flip />
        </Box>

        {/* Header */}
        <Flex align="center" justify="center" gap={5} mt="14px" mb={3}>
          <ChurchIcon />
          <Box>
            <Text
              fontSize="34px"
              fontWeight="700"
              color={RED}
              lineHeight="1.1"
              fontFamily="'Georgia', serif"
            >
              {churchName}
            </Text>
            {churchAddress && (
              <Text
                fontSize="15px"
                color={BROWN}
                fontWeight="500"
                mt={2}
                fontFamily="'Georgia', serif"
                letterSpacing="0.2px"
              >
                {churchAddress}
              </Text>
            )}
          </Box>
        </Flex>

        {/* Ribbon — BANK BOOK */}
        <Box textAlign="center" my="18px" position="relative">
          <RibbonTitle>BANK BOOK</RibbonTitle>
        </Box>

        {/* Date */}
        <Text
          textAlign="center"
          fontSize="17px"
          fontWeight="700"
          color={RED}
          mb={4}
          fontFamily="'Georgia', serif"
        >
          Date: {formatDate(date)}
        </Text>

        {/* Table */}
        <Box
          as="table"
          width="96%"
          mx="auto"
          borderCollapse="collapse"
          fontFamily="'Georgia', serif"
          fontSize="14px"
        >
          <Box as="thead">
            <Box as="tr">
              {columns.map((c) => (
                <Box
                  as="th"
                  key={c.key}
                  width={c.w}
                  textAlign={c.align || "left"}
                  px={3}
                  py="9px"
                  fontSize="14px"
                  fontWeight="700"
                  color={RED}
                  border={`1px solid ${RED_TABLE}`}
                  bg={PINK_HEADER}
                >
                  {c.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box as="tbody">
            {/* Opening Balance */}
            <Box as="tr">
              <Box
                as="td"
                colSpan={4}
                textAlign="center"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                Opening Balance
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                —
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                {formatAmount(openingBalance)}
              </Box>
            </Box>

            {/* Entries */}
            {rows.length === 0 ? (
              <Box as="tr">
                <Box
                  as="td"
                  colSpan={6}
                  textAlign="center"
                  px={3}
                  py="14px"
                  fontSize="13px"
                  color={BROWN}
                  border={`1px solid ${RED_TABLE}`}
                >
                  No entries for this date.
                </Box>
              </Box>
            ) : (
              rows.map((r, i) => {
                const amt = Number(r.amount || 0);
                const isDebit = r.direction === "DEBIT";
                const isCredit = r.direction === "CREDIT";

                return (
                  <Box
                    as="tr"
                    key={r.key || i}
                    bg={i % 2 === 1 ? "#FFF8F2" : CREAM}
                  >
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} border={`1px solid ${RED_TABLE}`}>
                      {formatDate(r.date)}
                    </Box>
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} border={`1px solid ${RED_TABLE}`}>
                      {r.voucherNo || "—"}
                    </Box>
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} border={`1px solid ${RED_TABLE}`}>
                      {r.voucherType || "—"}
                    </Box>
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} border={`1px solid ${RED_TABLE}`}>
                      {r.cashBankAccount || r.account || r.particulars || "—"}
                    </Box>
                    {/* Credit column — money OUT */}
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} textAlign="right" border={`1px solid ${RED_TABLE}`}>
                      {isCredit && amt > 0 ? formatAmount(amt) : "—"}
                    </Box>
                    {/* Debit column — money IN */}
                    <Box as="td" px={3} py="10px" fontSize="14px" color={RED} textAlign="right" border={`1px solid ${RED_TABLE}`}>
                      {isDebit && amt > 0 ? formatAmount(amt) : "—"}
                    </Box>
                  </Box>
                );
              })
            )}

            {/* Total */}
            <Box as="tr">
              <Box
                as="td"
                colSpan={4}
                textAlign="center"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                Total
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                {formatAmount(totalCredit)}
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                {formatAmount(totalDebit)}
              </Box>
            </Box>

            {/* Closing Balance */}
            <Box as="tr">
              <Box
                as="td"
                colSpan={4}
                textAlign="center"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                Closing Balance
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                —
              </Box>
              <Box
                as="td"
                textAlign="right"
                px={3}
                py="10px"
                fontSize="14px"
                fontWeight="700"
                color={RED}
                border={`1px solid ${RED_TABLE}`}
                bg={PINK_HIGHLIGHT}
              >
                {formatAmount(closingBalance)}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BankBookPrintView;