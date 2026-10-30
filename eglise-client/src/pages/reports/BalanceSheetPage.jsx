// src/pages/reports/BalanceSheetPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Flex, Heading, HStack, Input, Text, Spinner,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import { getBalanceSheetReport, getMyChurch } from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED    = "#A50F2E";
const TEXT_COLOR  = "#182338";
const SECONDARY   = "#60708C";
const BORDER      = "#DCE2EA";
const BLUE        = "#315AB5";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split("T")[0];

// ============================================================
// SHARED ROW COMPONENT
// ============================================================
const StatutoryRow = ({ row, mode = "screen" }) => {
  const { code, sch, name, depth, row_type, current_year, previous_year } = row;
  const isPrint = mode === "print";

  const isSection  = row_type === "section";
  const isSubTotal = row_type === "subtotal";
  const isTotal    = ["total", "grand_total"].includes(row_type);
  const isGroup    = row_type === "group";

  const weight = isSection || isTotal || isGroup ? 700 : isSubTotal ? 600 : 400;
  const bg =
    isSection  ? "#F7F9FB" :
    isTotal    ? "#F0F4FA" :
    isSubTotal ? "#F7F9FB" :
    "white";

  const indentPx = [0, 20, 40, 60][depth] ?? 40;
  const prefix = isSection && code ? `${code}   ` : "";

  const cellPad = isPrint ? "4px 6px" : "6px 8px";
  const fontSize = isPrint ? "9.5px" : "11.5px";
  const fontFam = isPrint ? "Georgia, 'Times New Roman', serif" : "inherit";

  return (
    <tr style={{ background: bg, borderBottom: `1px solid ${BORDER}` }}>
      <td style={{ width: 50, padding: cellPad, textAlign: "center", borderRight: `1px solid ${BORDER}`, fontSize, fontWeight: weight, fontFamily: fontFam }}>
        {isSection || isGroup || isSubTotal || isTotal ? "" : code}
      </td>
      <td style={{ padding: cellPad, paddingLeft: `${indentPx + (isPrint ? 4 : 8)}px`, fontSize, fontWeight: weight, color: isTotal || isSection ? DARK_RED : TEXT_COLOR, textTransform: isSection || isTotal ? "uppercase" : "none", fontFamily: fontFam }}>
        {prefix}{name}
      </td>
      <td style={{ width: 40, padding: cellPad, textAlign: "center", borderRight: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}`, fontSize, color: SECONDARY, fontFamily: fontFam }}>
        {sch || ""}
      </td>
      <td style={{ width: 120, padding: cellPad, textAlign: "right", fontSize, fontWeight: weight, color: isTotal ? DARK_RED : TEXT_COLOR, fontFamily: fontFam }}>
        {!isSection && !isGroup && row_type !== "grand_total" ? fmt(current_year) : (isTotal ? fmt(current_year) : "")}
      </td>
      <td style={{ width: 120, padding: cellPad, textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize, color: SECONDARY, fontFamily: fontFam }}>
        {!isSection && !isGroup && row_type !== "grand_total" ? fmt(previous_year) : (isTotal ? fmt(previous_year) : "")}
      </td>
    </tr>
  );
};

// ============================================================
// SCREEN TWO-COLUMN VIEW
// ============================================================
const ScreenStatutory = ({ liabilities, assets, totalLiab, totalAssets }) => {
  const Header = ({ label }) => (
    <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER}` }}>
      <th style={{ padding: "10px 6px", width: 50, borderRight: `1px solid ${BORDER}`, fontSize: "11px", textAlign: "center" }}>Code</th>
      <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "11px" }}>{label}</th>
      <th style={{ padding: "10px 6px", width: 40, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, fontSize: "11px", textAlign: "center" }}>Sch</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, fontSize: "11px" }}>Current (₹)</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, borderLeft: `1px solid ${BORDER}`, fontSize: "11px" }}>Previous (₹)</th>
    </tr>
  );

  return (
    <Flex direction={{ base: "column", lg: "row" }} border={`1px solid ${BORDER}`} borderRadius="10px" overflow="hidden">
      {/* LIABILITIES */}
      <Box flex="1" borderRight={{ base: "none", lg: `1px solid ${BORDER}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><Header label="LIABILITIES" /></thead>
          <tbody>
            {liabilities.map((r, i) => <StatutoryRow key={`l-${i}`} row={r} mode="screen" />)}
            <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
              <td style={{ borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>TOTAL (A+B+C+D+E+F+G+H)</td>
              <td style={{ borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>{fmt(totalLiab)}</td>
              <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>{fmt(0)}</td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* ASSETS */}
      <Box flex="1">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><Header label="ASSETS" /></thead>
          <tbody>
            {assets.map((r, i) => <StatutoryRow key={`a-${i}`} row={r} mode="screen" />)}
            <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
              <td style={{ borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>TOTAL (I+J+K+L+M+N+O+P)</td>
              <td style={{ borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} />
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>{fmt(totalAssets)}</td>
              <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>{fmt(0)}</td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Flex>
  );
};

// ============================================================
// PRINT STATUTORY CONTENT
// ============================================================
const PrintStatutory = ({ liabilities, assets, totalLiab, totalAssets, dateTo }) => {
  const Header = ({ label }) => (
    <tr style={{ background: "#F7F9FB", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <th style={{ padding: "4px 6px", width: 45, borderRight: `1px solid ${BORDER}`, textAlign: "center" }}>Code</th>
      <th style={{ padding: "4px 6px", textAlign: "left" }}>{label}</th>
      <th style={{ padding: "4px 6px", width: 30, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, textAlign: "center" }}>Sch</th>
      <th style={{ padding: "4px 6px", width: 90, borderLeft: `1px solid ${BORDER}`, textAlign: "right" }}>Current</th>
      <th style={{ padding: "4px 6px", width: 90, borderLeft: `1px solid ${BORDER}`, textAlign: "right" }}>Previous</th>
    </tr>
  );

  const TotalRow = (label, amt) => (
    <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
      <td style={{ borderRight: `1px solid ${BORDER}` }} />
      <td style={{ padding: "6px", fontWeight: 700, color: DARK_RED }}>{label}</td>
      <td style={{ borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} />
      <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: DARK_RED }}>{fmt(amt)}</td>
      <td style={{ padding: "6px", textAlign: "right", borderLeft: `1px solid ${BORDER}` }}>{fmt(0)}</td>
    </tr>
  );

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", width: "100%", fontSize: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK_RED }}>BALANCE SHEET</div>
        <div style={{ fontSize: 11, color: SECONDARY }}>AS AT {dateTo?.toUpperCase()}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup><col style={{ width: 45 }} /><col style={{ width: "auto" }} /><col style={{ width: 30 }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /></colgroup>
        <thead><Header label="LIABILITIES" /></thead>
        <tbody>
          {liabilities.map((r, i) => <StatutoryRow key={`pl-${i}`} row={r} mode="print" />)}
          {TotalRow("TOTAL (A+B+C+D+E+F+G+H)", totalLiab)}
        </tbody>
      </table>

      <div style={{ height: 16 }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup><col style={{ width: 45 }} /><col style={{ width: "auto" }} /><col style={{ width: 30 }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /></colgroup>
        <thead><Header label="ASSETS" /></thead>
        <tbody>
          {assets.map((r, i) => <StatutoryRow key={`pa-${i}`} row={r} mode="print" />)}
          {TotalRow("TOTAL (I+J+K+L+M+N+O+P)", totalAssets)}
        </tbody>
      </table>

      <div className="print-footer-block" style={{ marginTop: 30, display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
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
// PAGE
// ============================================================
const BalanceSheetPage = () => {
  const navigate = useNavigate();
  const [dateTo, setDateTo] = useState(today());
  const [prevTo, setPrevTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [church, setChurch] = useState({});

  useEffect(() => {
    getMyChurch().then((res) => setChurch(res?.data ?? {}));
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await getBalanceSheetReport({ to: dateTo, prev_to: prevTo || undefined });
      setData(res?.data);
    } catch (err) {
      console.error(err);
      setPageError("Unable to load balance sheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateTo, prevTo]);

  const liabilities = data?.liabilities || [];
  const assets = data?.assets || [];
  const totalLiab = data?.total_liabilities || 0;
  const totalAssets = data?.total_assets || 0;
  const difference = data?.difference || 0;

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />
      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY}>Balance Sheet</Text>
        </HStack>

        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>BALANCE SHEET REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize="26px" mb={1}>Balance Sheet</Heading>
            <Text color={SECONDARY} fontSize="12px">Statement of Assets, Liabilities, and Equity.</Text>
          </Box>
          <HStack gap={3} flexWrap="wrap">
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} onClick={() => setIsPrintOpen(true)} isDisabled={!data}>
              Print
            </Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} align="flex-end" wrap="wrap">
            <Box flex="1" maxW="200px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Current Year As of Date</Text>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Box flex="1" maxW="200px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Previous Year As of Date (Optional)</Text>
              <Input type="date" value={prevTo} onChange={(e) => setPrevTo(e.target.value)} h="40px" fontSize="12px" />
            </Box>
            <Button h="40px" px={8} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} onClick={fetchData}>
              Filter
            </Button>
          </Flex>
        </Box>

        {loading ? (
          <Flex justify="center" py={20}><Spinner size="xl" color={PRIMARY_RED} /></Flex>
        ) : !data || (liabilities.length === 0 && assets.length === 0) ? (
          <Box border={`1px solid ${BORDER}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={SECONDARY} fontSize="12px">No data for this date.</Text>
          </Box>
        ) : (
          <>
            <Box border={`1px solid ${BORDER}`} borderRadius="10px" overflow="hidden" mb={4}>
              <Box bg="#F7F9FB" borderBottom={`1px solid ${BORDER}`} textAlign="center" py={3}>
                <Text fontSize="14px" fontWeight="700" color={TEXT_COLOR} letterSpacing="0.6px">BALANCE SHEET AS AT {dateTo}</Text>
              </Box>
              <ScreenStatutory
                liabilities={liabilities}
                assets={assets}
                totalLiab={totalLiab}
                totalAssets={totalAssets}
              />
            </Box>

            {/* Difference Warning Bar */}
            <Flex mt={4} px={5} py={3} border={`1px solid ${BORDER}`} borderRadius="8px" bg="#F8FAFC" align="center" justify="center" gap={3} wrap="wrap">
              <Text fontSize="12px" color={TEXT_COLOR} fontWeight="600">Difference:</Text>
              <Text fontSize="13px" color={PRIMARY_RED} fontWeight="700">{fmt(Math.abs(difference))}</Text>
              {Math.abs(difference) < 0.01 && (
                <Text fontSize="12px" color="green.600" fontWeight="600">✅ Assets and Liabilities are balanced</Text>
              )}
            </Flex>
          </>
        )}
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="BALANCE SHEET"
        subtitle={`As at ${dateTo}`}
        church={church}
        pdfFileName={`BalanceSheet_${dateTo}.pdf`}
        defaultOrientation="landscape"
      >
        <PrintStatutory
          liabilities={liabilities}
          assets={assets}
          totalLiab={totalLiab}
          totalAssets={totalAssets}
          dateTo={dateTo}
        />
      </ChurchPrintModal>
    </Box>
  );
};

export default BalanceSheetPage;