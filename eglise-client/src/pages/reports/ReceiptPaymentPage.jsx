// src/pages/reports/ReceiptPaymentPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Flex, Heading, HStack, Input, Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import { getReceiptPaymentStatutory, getMyChurch } from "../../api/registryServices";

// ============================================================
// THEME & CONSTANTS
// ============================================================
const PRIMARY_RED = "#D7193F";
const DARK_RED    = "#A50F2E";
const TEXT_COLOR  = "#182338";
const SECONDARY   = "#60708C";
const BORDER      = "#DCE2EA";
const BLUE        = "#315AB5";

const HATCH_CSS = "repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 2px, #ffffff 2px, #ffffff 4px)";

// ============================================================
// HELPERS
// ============================================================
const formatAmount = (n) => {
  // Return empty string if value is null (used for parent bank rows)
  if (n === null || n === undefined) return ""; 
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

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
// PRINT ROW RENDERER
// ============================================================
const StatutoryPrintRow = ({ row }) => {
  const { code, name, depth, row_type, current_year, previous_year, section } = row;

  const isSection  = row_type === "section";
  const isSubTotal = row_type === "subtotal";
  const isTotal    = row_type === "total" || row_type === "grand_total";
  const isGroup    = row_type === "group";

  const weight = (isSection || isGroup || isTotal) ? 700 : isSubTotal ? 600 : 400;
  const fontStyle = isSubTotal ? "italic" : "normal";
  const color = (isSection || isGroup) ? "#000000" : (isTotal ? DARK_RED : TEXT_COLOR);

  const cellBg = (isSection || isGroup) ? HATCH_CSS : (isTotal ? "#F0F4FA" : "white");

  const indentMap = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  const indentPx = indentMap[depth] ?? 80;

  // Add proper spacing for groups with letters like "A  Church Receipts"
  const formattedName = name.replace(/^([A-Z])\s+/, "$1.  ");

  const prefix = (isSection && section && !formattedName.startsWith(section)) ? `${section}.  ` : "";
  
  // Hides the price for groups and the specific 2450 row
  const showAmount = !isSection && !isGroup && code !== "2450";

  return (
    <tr>
      <td style={{ width: 50, padding: "4px 4px", textAlign: "left", border: `1px solid #000`, borderTop: "none", fontSize: "9px", fontWeight: weight, color, fontStyle, background: cellBg }}>
        {code || ""}
      </td>
      <td style={{ padding: "4px 8px", paddingLeft: `${indentPx + 8}px`, fontSize: "9px", fontWeight: weight, color, textTransform: isSection ? "uppercase" : "none", fontStyle, border: `1px solid #000`, borderTop: "none", borderLeft: "none", background: cellBg }}>
        {prefix}{formattedName}
      </td>
      <td style={{ width: 90, padding: "4px 8px", textAlign: "right", fontSize: "9px", fontWeight: weight, fontStyle, border: `1px solid #000`, borderTop: "none", borderLeft: "none", background: cellBg }}>
        {showAmount ? formatAmount(current_year) : ""}
      </td>
      <td style={{ width: 90, padding: "4px 8px", textAlign: "right", fontSize: "9px", color: SECONDARY, fontStyle, border: `1px solid #000`, borderTop: "none", borderLeft: "none", background: cellBg }}>
        {showAmount ? formatAmount(previous_year) : ""}
      </td>
    </tr>
  );
};

// ============================================================
// PRINT STATUTORY CONTENT
// ============================================================
const PrintStatutory = ({
  receiptRows,
  paymentRows,
  totalReceipts,
  totalPayments,
  dateTo,
  church,
}) => {
  const Header = ({ label }) => (
    <tr style={{ background: "#FFFFFF", borderTop: `2px solid #000`, borderBottom: `1px solid #000` }}>
      <th style={{ padding: "6px 4px", width: 50, borderRight: `1px solid #000`, textAlign: "left", fontSize: "10px" }}>Code</th>
      <th style={{ padding: "6px 8px", textAlign: "left", fontSize: "10px" }}>{label}</th>
      <th style={{ padding: "6px 8px", textAlign: "right", borderLeft: `1px solid #000`, fontSize: "10px", width: 90 }}>Current Year<br/><span style={{fontSize: "8px"}}>Rs.</span></th>
      <th style={{ padding: "6px 8px", textAlign: "right", borderLeft: `1px solid #000`, fontSize: "10px", width: 90 }}>Previous Year<br/><span style={{fontSize: "8px"}}>Rs.</span></th>
    </tr>
  );

  const TotalRow = (label, amt) => (
    <tr style={{ background: "#F0F4FA", borderTop: `1px solid #000`, borderBottom: `2px solid #000` }}>
      <td style={{ borderRight: `1px solid #000` }} />
      <td style={{ padding: "6px 8px", fontWeight: 700, color: DARK_RED, fontSize: "10px", textAlign: "right" }}>{label}</td>
      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "10px", borderLeft: `1px solid #000` }}>{formatAmount(amt)}</td>
      <td style={{ padding: "6px 8px", textAlign: "right", borderLeft: `1px solid #000`, fontSize: "10px" }}>{formatAmount(0)}</td>
    </tr>
  );

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", width: "100%", fontSize: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{church.name || "CHURCH NAME"}</div>
        <div style={{ fontSize: 11 }}>{church.address || "Church Address"}</div>
        <div style={{ fontSize: 11 }}>{church.diocese ? `Under Diocese of ${church.diocese}` : ""}</div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, letterSpacing: "0.5px", textDecoration: "underline" }}>
          RECEIPTS AND PAYMENT ACCOUNT FOR THE YEAR ENDED {dateTo?.toUpperCase()}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: `1px solid #000` }}>
        <colgroup><col style={{ width: 50 }} /><col style={{ width: "auto" }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /></colgroup>
        <thead><Header label="RECEIPTS" /></thead>
        <tbody>
          {receiptRows.map((r, i) => <StatutoryPrintRow key={`pr-${i}`} row={r} />)}
          {/* ✅ Removed the extra TotalRow here */}
        </tbody>
      </table>

      <div style={{ height: 20 }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: `1px solid #000` }}>
        <colgroup><col style={{ width: 50 }} /><col style={{ width: "auto" }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /></colgroup>
        <thead><Header label="PAYMENTS" /></thead>
        <tbody>
          {paymentRows.map((r, i) => <StatutoryPrintRow key={`pp-${i}`} row={r} />)}
          {/* ✅ Removed the extra TotalRow here */}
        </tbody>
      </table>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <div><div>Place: ______________________</div><div style={{ marginTop: 10 }}>Date: ______________________</div></div>
        <div style={{ textAlign: "right" }}>
          <div>As per our report of even date attached</div><br /><br />
          <div style={{ fontWeight: 700 }}>Vicar</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Trustee</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SCREEN TWO-COLUMN TABLE (SIDE BY SIDE)
// ============================================================
const ScreenStatutory = ({ receiptRows, paymentRows }) => {

  const getStyle = (row) => {
    if (!row) return { background: "white", fontWeight: 400, color: TEXT_COLOR, fontStyle: "normal" };

    const isSection = row.row_type === "section";
    const isTotal = row.row_type === "total" || row.row_type === "grand_total";
    const isSubTotal = row.row_type === "subtotal";
    const isGroup = row.row_type === "group";
    const isChild = row.row_type === "ledger_child";
    const applyHatch = isSection || isGroup;

    return {
      background: applyHatch ? HATCH_CSS : isTotal ? "#F0F4FA" : isSubTotal ? "#F7F9FB" : "white",
      fontWeight: isSection || isTotal || isGroup ? 700 : isSubTotal ? 600 : 400,
      color: isSection || isTotal ? DARK_RED : isChild ? SECONDARY : TEXT_COLOR,
      fontStyle: isSubTotal ? "italic" : "normal"
    };
  };

  const renderRow = (row, index, isPaymentSide = false) => {
    if (!row) return null;

    const style = getStyle(row);
    const indentMap = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
    const indentPx = indentMap[row.depth] ?? 80;
    
    const formattedName = row.name.replace(/^([A-Z])\s+/, "$1.  "); 
    const prefix = (row.row_type === "section" && row.section && !formattedName.startsWith(row.section)) ? `${row.section}.  ` : "";

    // Hides the price for groups and the specific 2450 row
    const showAmount = row.row_type !== "section" && row.row_type !== "group" && row.code !== "2450";

    return (
      <tr key={`${row.row_type}-${index}`}>
        <td style={{ width: 50, padding: "6px 6px", textAlign: "center", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", ...style }}>{row.code || ""}</td>
        <td style={{ padding: "6px 6px", paddingLeft: `${indentPx + 8}px`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", textTransform: row.row_type === "section" ? "uppercase" : "none", ...style }}>{prefix}{formattedName}</td>
        <td style={{ width: 100, padding: "6px 6px", textAlign: "right", borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", ...style }}>{showAmount ? formatAmount(row.current_year) : ""}</td>
        <td style={{ width: 100, padding: "6px 6px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, borderRight: isPaymentSide ? "none" : `2px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", ...style, color: row.row_type === "ledger" || row.row_type === "subtotal" || row.row_type === "ledger_child" ? SECONDARY : style.color }}>{showAmount ? formatAmount(row.previous_year) : ""}</td>
      </tr>
    );
  };

  return (
    <Box border={`1px solid ${BORDER}`} borderRadius="10px" background="white" mb={4} overflow="hidden">
      <Flex w="100%" minW="1000px">

        {/* LEFT SIDE: RECEIPTS */}
        <Box flex="1" borderRight={`2px solid ${BORDER}`} overflowX="auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F9FB", borderBottom: `2px solid ${BORDER}` }}>
                <th style={{ padding: "10px 6px", width: 50, borderRight: `1px solid ${BORDER}`, fontSize: "12px", textAlign: "center" }}>Code</th>
                <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "12px" }}>RECEIPTS</th>
                <th style={{ padding: "10px 6px", textAlign: "right", width: 100, fontSize: "12px" }}>Current (₹)</th>
                <th style={{ padding: "10px 6px", textAlign: "right", width: 100, borderRight: `1px solid ${BORDER}`, fontSize: "12px" }}>Previous (₹)</th>
              </tr>
            </thead>
            <tbody>
              {receiptRows.map((r, i) => renderRow(r, i, false))}
              {/* ✅ Removed the hardcoded TOTAL row here */}
            </tbody>
          </table>
        </Box>

        {/* RIGHT SIDE: PAYMENTS */}
        <Box flex="1" overflowX="auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F9FB", borderBottom: `2px solid ${BORDER}` }}>
                <th style={{ padding: "10px 6px", width: 50, borderRight: `1px solid ${BORDER}`, fontSize: "12px", textAlign: "center" }}>Code</th>
                <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "12px" }}>PAYMENTS</th>
                <th style={{ padding: "10px 6px", textAlign: "right", width: 100, fontSize: "12px" }}>Current (₹)</th>
                <th style={{ padding: "10px 6px", textAlign: "right", width: 100, fontSize: "12px" }}>Previous (₹)</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((r, i) => renderRow(r, i, true))}
              {/* ✅ Removed the hardcoded TOTAL row here */}
            </tbody>
          </table>
        </Box>

      </Flex>
    </Box>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const ReceiptPaymentPage = () => {
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo]     = useState(today());
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
      const res = await getReceiptPaymentStatutory({
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

  const receiptRows = data?.receipts || [];
  const paymentRows = data?.payments || [];
  const totalReceipts = data?.total_receipts || 0;
  const totalPayments = data?.total_payments || 0;
  const hasData = receiptRows.length > 0 || paymentRows.length > 0;

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY}>Receipts &amp; Payments</Text>
        </HStack>

        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>RECEIPTS &amp; PAYMENTS REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize="24px">Receipts &amp; Payments Account</Heading>
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
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} wrap="wrap">
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Current — From</Text>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Current — To</Text>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Previous — From</Text>
              <Input type="date" value={prevFrom} onChange={(e) => setPrevFrom(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Previous — To</Text>
              <Input type="date" value={prevTo} onChange={(e) => setPrevTo(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Box>
              <Button h="40px" px={8} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} onClick={fetchData}>
                Refresh
              </Button>
            </Box>
          </Flex>
        </Box>

        {loading ? (
          <Text textAlign="center" py={10}>Loading…</Text>
        ) : !hasData ? (
          <Box border={`1px solid ${BORDER}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">No data for this period</Text>
            {pageError && <Text color={PRIMARY_RED} mt={2} fontSize="12px">{pageError}</Text>}
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
                RECEIPTS &amp; PAYMENTS STATEMENT
              </Text>
            </Box>

            <ScreenStatutory
              receiptRows={receiptRows}
              paymentRows={paymentRows}
            />
          </>
        )}
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="RECEIPTS &amp; PAYMENTS"
        subtitle={`Period: ${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}`}
        church={church}
        pdfFileName={`receipts-payments-${dateFrom}-to-${dateTo}.pdf`}
        defaultOrientation="portrait"
      >
        <PrintStatutory
          receiptRows={receiptRows}
          paymentRows={paymentRows}
          totalReceipts={totalReceipts}
          totalPayments={totalPayments}
          dateTo={formatDateDisplay(dateTo)}
          church={church}
        />
      </ChurchPrintModal>
    </Box>
  );
};

export default ReceiptPaymentPage;