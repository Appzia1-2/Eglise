// src/pages/reports/IncomeExpenditurePage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import { getIncomeExpenditureStatutory, getMyChurch } from "../../api/registryServices";

// ============================================================
// THEME
// ============================================================
const PRIMARY_RED = "#D7193F";
const DARK_RED    = "#A50F2E";
const TEXT_COLOR  = "#182338";
const SECONDARY   = "#60708C";
const BORDER      = "#DCE2EA";
const BLUE        = "#315AB5";

const HATCH_CSS =
  "repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 2px, #ffffff 2px, #ffffff 4px)";

// ============================================================
// HELPERS
// ============================================================
const formatAmount = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const today = () => new Date().toISOString().split("T")[0];

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const lastYearMonthStart = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const lastYearToday = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
};

const formatDateDisplay = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

// ============================================================
// SHARED ROW RENDERER (screen + print)
// ============================================================
const StatutoryRow = ({ row, mode = "screen" }) => {
  const { code, name, depth, row_type, current_year, previous_year, section } = row;
  const isPrint = mode === "print";

  const isSection  = row_type === "section";
  const isGroup    = row_type === "group";
  const isSubTotal = row_type === "subtotal";
  const isTotal    = ["total", "grand_total", "grand_total_balanced"].includes(row_type);
  const isAdj      = row_type === "adjustment";

  const weight = isSection || isGroup || isTotal ? 700 : isSubTotal ? 600 : 400;

  const color =
    isSection || isTotal ? DARK_RED :
    isAdj                ? PRIMARY_RED :
    TEXT_COLOR;

  const bg =
    isSection || isGroup ? HATCH_CSS :
    isTotal              ? "#F0F4FA" :
    isSubTotal           ? "#F7F9FB" :
    "white";

  const indentPx = [0, 20, 40, 60][depth] ?? 40;
  const prefix   = isSection && section ? `${section}.  ` : "";

  const cellPad   = isPrint ? "4px 6px" : "6px 8px";
  const fontSize  = isPrint ? "9.5px"  : "11.5px";
  const fontFam   = isPrint ? "Georgia, 'Times New Roman', serif" : "inherit";
  const fontStyle = isSubTotal ? "italic" : "normal";

  // groups and sections are header-only; everything else shows amounts
  const showAmount = (!isSection && !isGroup) || row_type === "grand_total";

  const base = { fontSize, fontWeight: weight, fontFamily: fontFam, fontStyle, background: bg };

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td
        style={{
          ...base,
          color,
          width: 60,
          padding: cellPad,
          textAlign: "center",
          borderRight: `1px solid ${BORDER}`,
        }}
      >
        {code || ""}
      </td>
      <td
        style={{
          ...base,
          color,
          padding: cellPad,
          paddingLeft: `${indentPx + (isPrint ? 4 : 8)}px`,
          textTransform: isSection || isTotal ? "uppercase" : "none",
          letterSpacing: isSection ? "0.4px" : "normal",
        }}
      >
        {prefix}{name}
      </td>
      <td
        style={{
          ...base,
          color,
          width: 130,
          padding: cellPad,
          textAlign: "right",
        }}
      >
        {showAmount ? formatAmount(current_year) : ""}
      </td>
      <td
        style={{
          ...base,
          color: SECONDARY,
          width: 130,
          padding: cellPad,
          textAlign: "right",
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        {showAmount ? formatAmount(previous_year) : ""}
      </td>
    </tr>
  );
};

// ============================================================
// TWO-COLUMN SCREEN VIEW
// ============================================================
const ScreenStatutory = ({
  incomeRows,
  expenditureRows,
  totalIncome,
  totalExp,
  net,
  isSurplus,
}) => {
  const grandTotal = Math.max(totalIncome, totalExp);

  const Header = ({ label }) => (
    <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER}` }}>
      <th style={{ padding: "10px 6px", width: 60, borderRight: `1px solid ${BORDER}`, fontSize: "12px", textAlign: "center" }}>
        Code
      </th>
      <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "12px" }}>{label}</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 130, fontSize: "12px" }}>
        Current (₹)
      </th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 130, borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>
        Previous (₹)
      </th>
    </tr>
  );

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      border={`1px solid ${BORDER}`}
      borderRadius="10px"
      overflow="hidden"
    >
      {/* ---- INCOME COLUMN ---- */}
      <Box flex="1" borderRight={{ base: "none", lg: `1px solid ${BORDER}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><Header label="INCOME" /></thead>
          <tbody>
            {incomeRows.map((r, i) => (
              <StatutoryRow key={`i-${i}`} row={r} mode="screen" />
            ))}

            {!isSurplus && (
              <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}` }}>
                <td style={{ borderRight: `1px solid ${BORDER}` }} />
                <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                  DEFICIT — EXCESS OF EXPENDITURE OVER INCOME
                </td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                  {formatAmount(Math.abs(net))}
                </td>
                <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>
                  {formatAmount(0)}
                </td>
              </tr>
            )}

            <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
              <td style={{ borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                TOTAL
              </td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                {formatAmount(grandTotal)}
              </td>
              <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>
                {formatAmount(0)}
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* ---- EXPENDITURE COLUMN ---- */}
      <Box flex="1">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><Header label="EXPENDITURE" /></thead>
          <tbody>
            {expenditureRows.map((r, i) => (
              <StatutoryRow key={`e-${i}`} row={r} mode="screen" />
            ))}

            {isSurplus && (
              <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}` }}>
                <td style={{ borderRight: `1px solid ${BORDER}` }} />
                <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                  SURPLUS — EXCESS OF INCOME OVER EXPENDITURE
                </td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                  {formatAmount(Math.abs(net))}
                </td>
                <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>
                  {formatAmount(0)}
                </td>
              </tr>
            )}

            <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
              <td style={{ borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                TOTAL
              </td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>
                {formatAmount(grandTotal)}
              </td>
              <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>
                {formatAmount(0)}
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Flex>
  );
};

// ============================================================
// PRINT STATUTORY CONTENT (single column)
// ============================================================
const PrintStatutory = ({
  incomeRows,
  expenditureRows,
  totalIncome,
  totalExp,
  net,
  isSurplus,
  dateTo,
}) => {
  const grandTotal = Math.max(totalIncome, totalExp);

  const Header = ({ label }) => (
    <tr style={{ background: "#F7F9FB", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <th style={{ padding: "4px 6px", width: 55, borderRight: `1px solid ${BORDER}`, textAlign: "center" }}>Code</th>
      <th style={{ padding: "4px 6px", textAlign: "left" }}>{label}</th>
      <th style={{ padding: "4px 6px", textAlign: "right", borderLeft: `1px solid ${BORDER}` }}>Current (Rs.)</th>
      <th style={{ padding: "4px 6px", textAlign: "right", borderLeft: `1px solid ${BORDER}` }}>Previous (Rs.)</th>
    </tr>
  );

  const TotalRow = (label, amt) => (
    <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
      <td style={{ borderRight: `1px solid ${BORDER}` }} />
      <td style={{ padding: "6px", fontWeight: 700, color: DARK_RED }}>{label}</td>
      <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: DARK_RED }}>{formatAmount(amt)}</td>
      <td style={{ padding: "6px", textAlign: "right", borderLeft: `1px solid ${BORDER}` }}>{formatAmount(0)}</td>
    </tr>
  );

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", width: "100%", fontSize: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK_RED, letterSpacing: "0.5px" }}>
          INCOME AND EXPENDITURE ACCOUNT
        </div>
        <div style={{ fontSize: 11, color: SECONDARY }}>
          FOR THE YEAR ENDED {dateTo?.toUpperCase()}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 55 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead><Header label="INCOME" /></thead>
        <tbody>
          {incomeRows.map((r, i) => (
            <StatutoryRow key={`pi-${i}`} row={r} mode="print" />
          ))}
          {!isSurplus && TotalRow("DEFICIT — EXCESS OF EXPENDITURE OVER INCOME", Math.abs(net))}
          {TotalRow("TOTAL", grandTotal)}
        </tbody>
      </table>

      <div style={{ height: 16 }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 55 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead><Header label="EXPENDITURE" /></thead>
        <tbody>
          {expenditureRows.map((r, i) => (
            <StatutoryRow key={`pe-${i}`} row={r} mode="print" />
          ))}
          {isSurplus && TotalRow("SURPLUS — EXCESS OF INCOME OVER EXPENDITURE", Math.abs(net))}
          {TotalRow("TOTAL", grandTotal)}
        </tbody>
      </table>

      <div
        className="print-footer-block"
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
        }}
      >
        <div>
          <div>Place: ______________________</div>
          <div style={{ marginTop: 8 }}>Date: ______________________</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>As per our report of even date attached</div>
          <br /><br />
          <div style={{ fontWeight: 700 }}>Vicar</div>
          <div style={{ fontWeight: 700, marginTop: 6 }}>Trustee</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const IncomeExpenditurePage = () => {
  const navigate = useNavigate();

  // Current period
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo]     = useState(today());

  // Previous period (defaults to same range last year)
  const [prevFrom, setPrevFrom] = useState(lastYearMonthStart());
  const [prevTo, setPrevTo]     = useState(lastYearToday());

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pageError, setPageError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [church, setChurch]     = useState({ name: "", address: "", diocese: "" });

  useEffect(() => {
    getMyChurch()
      .then((res) => {
        const c = res?.data ?? res ?? {};
        setChurch({
          name: c.name || "Church",
          address: c.full_address || c.address || "",
          diocese: c.diocese_name || "",
        });
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await getIncomeExpenditureStatutory({
        from: dateFrom,
        to: dateTo,
        prev_from: prevFrom || undefined,
        prev_to: prevTo || undefined,
      });
      setData(res?.data ?? null);
    } catch (err) {
      setPageError("Unable to load report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo, prevFrom, prevTo]);

  const incomeRows      = data?.income            || [];
  const expenditureRows = data?.expenditure       || [];
  const totalIncome     = data?.total_income      || 0;
  const totalExp        = data?.total_expenditure || 0;
  const net             = data?.net               || 0;
  const isSurplus       = data?.is_surplus ?? true;

  const hasData = data && (incomeRows.length > 0 || expenditureRows.length > 0);

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY}>Income &amp; Expenditure</Text>
        </HStack>

        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={PRIMARY_RED}
              letterSpacing="0.4px"
              mb={1}
            >
              INCOME &amp; EXPENDITURE REPORT
            </Text>
            <Heading color={TEXT_COLOR} fontSize="24px">
              Income &amp; Expenditure Account
            </Heading>
          </Box>
          <HStack gap={3}>
            <Button
              variant="outline"
              h="40px"
              px={5}
              borderColor={PRIMARY_RED}
              color={PRIMARY_RED}
              onClick={() => setIsPrintOpen(true)}
              disabled={!hasData}
            >
              Print
            </Button>
          </HStack>
        </Flex>

        <Box
          border={`1px solid ${BORDER}`}
          borderRadius="10px"
          px={{ base: 4, md: 5 }}
          py={4}
          mb={4}
          bg="white"
        >
          <Flex
            gap={4}
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "flex-end" }}
            wrap="wrap"
          >
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Current — From</Text>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                h="40px"
                fontSize="12px"
              />
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Current — To</Text>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                h="40px"
                fontSize="12px"
              />
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Previous — From</Text>
              <Input
                type="date"
                value={prevFrom}
                onChange={(e) => setPrevFrom(e.target.value)}
                h="40px"
                fontSize="12px"
              />
            </Box>

            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Previous — To</Text>
              <Input
                type="date"
                value={prevTo}
                onChange={(e) => setPrevTo(e.target.value)}
                h="40px"
                fontSize="12px"
              />
            </Box>

            <Box>
              <Button
                h="40px"
                px={8}
                bg="white"
                border={`1px solid ${PRIMARY_RED}`}
                color={PRIMARY_RED}
                onClick={fetchData}
              >
                Refresh
              </Button>
            </Box>
          </Flex>
        </Box>

        {loading ? (
          <Text textAlign="center" py={10}>Loading…</Text>
        ) : !hasData ? (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            py={14}
            textAlign="center"
          >
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">
              No data for this period
            </Text>
            {pageError && (
              <Text color={PRIMARY_RED} mt={2} fontSize="12px">{pageError}</Text>
            )}
          </Box>
        ) : (
          <>
            <Box
              bg="#F7F9FB"
              borderBottom={`1px solid ${BORDER}`}
              borderTop={`1px solid ${BORDER}`}
              textAlign="center"
              py={3}
              mb={4}
              borderRadius="10px 10px 0 0"
            >
              <Text fontSize="14px" fontWeight="700" color={TEXT_COLOR} letterSpacing="0.6px">
                INCOME &amp; EXPENDITURE STATEMENT
              </Text>
            </Box>

            <ScreenStatutory
              incomeRows={incomeRows}
              expenditureRows={expenditureRows}
              totalIncome={totalIncome}
              totalExp={totalExp}
              net={net}
              isSurplus={isSurplus}
            />

            <Flex
              justify="flex-end"
              align="center"
              mt={4}
              pt={3}
              borderTop={`1px solid ${BORDER}`}
            >
              <HStack gap={3}>
                <Text fontSize="13px" fontWeight="700" color={SECONDARY} letterSpacing="0.4px">
                  NET {isSurplus ? "SURPLUS" : "DEFICIT"}:
                </Text>
                <Text fontSize="18px" fontWeight="800" color={isSurplus ? "#2E7D32" : PRIMARY_RED}>
                  {formatAmount(Math.abs(net))}
                </Text>
              </HStack>
            </Flex>
          </>
        )}
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="INCOME &amp; EXPENDITURE"
        subtitle={`Period: ${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}`}
        church={church}
        pdfFileName={`income-expenditure-${dateFrom}-to-${dateTo}.pdf`}
        defaultOrientation="portrait"
      >
        <PrintStatutory
          incomeRows={incomeRows}
          expenditureRows={expenditureRows}
          totalIncome={totalIncome}
          totalExp={totalExp}
          net={net}
          isSurplus={isSurplus}
          dateTo={formatDateDisplay(dateTo)}
        />
      </ChurchPrintModal>
    </Box>
  );
};

export default IncomeExpenditurePage;