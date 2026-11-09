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
// THEME
// ============================================================
const PRIMARY_RED = "#D7193F";
const DARK_RED    = "#A50F2E";
const TEXT_COLOR  = "#182338";
const SECONDARY   = "#60708C";
const BORDER      = "#DCE2EA";
const BLUE        = "#315AB5";

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
// SHARED ROW RENDERER (For Print View)
// ============================================================
const StatutoryRow = ({ row, mode = "screen" }) => {
  const { code, name, depth, row_type, current_year, previous_year, section } = row;
  const isPrint = mode === "print";

  const isSection  = row_type === "section";
  const isSubTotal = row_type === "subtotal";
  const isTotal    = ["total", "grand_total"].includes(row_type);
  const isGroup    = row_type === "group";

  const weight =
    isSection || isTotal || isGroup ? 700 : isSubTotal ? 600 : 400;

  const color =
    isSection || isTotal ? DARK_RED :
    isGroup ? TEXT_COLOR :
    TEXT_COLOR;

  const bg =
    isSection  ? "#F7F9FB" :
    isTotal    ? "#F0F4FA" :
    isSubTotal ? "#F7F9FB" :  
    "white";

  const indentPx = [0, 20, 40, 60, 80, 100][depth] ?? 100;
  const prefix = (isSection && section && !name.startsWith(section)) ? `${section}.  ` : "";

  const cellPad = isPrint ? "4px 6px" : "6px 8px";
  const fontSize = isPrint ? "9.5px" : "11.5px";
  const fontFam = isPrint ? "Georgia, 'Times New Roman', serif" : "inherit";

  const showAmount = !isSection;

  return (
    <tr style={{ background: bg, borderBottom: `1px solid ${BORDER}` }}>
      <td
        style={{
          width: 60,
          padding: cellPad,
          textAlign: "center",
          borderRight: `1px solid ${BORDER}`,
          fontSize,
          fontWeight: weight,
          color,
          fontFamily: fontFam,
        }}
      >
        {code || ""}
      </td>
      <td
        style={{
          padding: cellPad,
          paddingLeft: `${indentPx + (isPrint ? 4 : 8)}px`,
          fontSize,
          fontWeight: weight,
          color,
          fontFamily: fontFam,
          textTransform: isSection || isTotal ? "uppercase" : "none",
          letterSpacing: isSection ? "0.4px" : "normal",
        }}
      >
        {prefix}{name}
      </td>
      <td
        style={{
          width: 130,
          padding: cellPad,
          textAlign: "right",
          fontSize,
          fontWeight: weight,
          color,
          fontFamily: fontFam,
        }}
      >
        {showAmount && row_type !== "group" ? formatAmount(current_year) : ""}
      </td>
      <td
        style={{
          width: 130,
          padding: cellPad,
          textAlign: "right",
          borderLeft: `1px solid ${BORDER}`,
          fontSize,
          color: SECONDARY,
          fontFamily: fontFam,
        }}
      >
        {showAmount && row_type !== "group" ? formatAmount(previous_year) : ""}
      </td>
    </tr>
  );
};

// ============================================================
// SCREEN TWO-COLUMN VIEW (Single Combined Table)
// ============================================================
const ScreenStatutory = ({
  receiptRows,
  paymentRows,
  totalReceipts,
  totalPayments,
  isBalanced,
}) => {
  // Find the longest array to ensure we render every row
  const maxRows = Math.max(receiptRows.length, paymentRows.length);

  const Header = () => (
    <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER}` }}>
      <th style={{ padding: "10px 6px", width: 60, borderRight: `1px solid ${BORDER}`, fontSize: "12px", textAlign: "center" }}>Code</th>
      <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "12px", width: "35%" }}>RECEIPTS</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, fontSize: "12px" }}>Current (₹)</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, borderRight: `2px solid ${BORDER}`, fontSize: "12px" }}>Previous (₹)</th>
      
      <th style={{ padding: "10px 6px", width: 60, borderRight: `1px solid ${BORDER}`, fontSize: "12px", textAlign: "center" }}>Code</th>
      <th style={{ padding: "10px 6px", textAlign: "left", fontSize: "12px", width: "35%" }}>PAYMENTS</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, fontSize: "12px" }}>Current (₹)</th>
      <th style={{ padding: "10px 6px", textAlign: "right", width: 120, fontSize: "12px" }}>Previous (₹)</th>
    </tr>
  );

  const CombinedRow = ({ receipt, payment }) => {
    const getStyle = (row) => {
      if (!row) return { background: "white" };
      const isSection = row.row_type === "section";
      const isTotal = ["total", "grand_total"].includes(row.row_type);
      const isSubTotal = row.row_type === "subtotal";
      const isGroup = row.row_type === "group";
      
      return {
        background: isSection ? "#F7F9FB" : isTotal ? "#F0F4FA" : isSubTotal ? "#F7F9FB" : "white",
        fontWeight: isSection || isTotal || isGroup ? 700 : isSubTotal ? 600 : 400,
        color: isSection || isTotal ? DARK_RED : TEXT_COLOR,
      };
    };

    const rStyle = getStyle(receipt);
    const pStyle = getStyle(payment);

    const renderSide = (row, style, isPaymentSide = false) => {
      if (!row) {
        // Empty cells for alignment
        return (
          <>
            <td style={{ borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}></td>
            <td style={{ borderBottom: `1px solid ${BORDER}` }}></td>
            <td style={{ borderBottom: `1px solid ${BORDER}` }}></td>
            <td style={{ borderRight: isPaymentSide ? "none" : `2px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}></td>
          </>
        );
      }
      
      const indentPx = [0, 20, 40, 60, 80, 100][row.depth] ?? 100;
      const prefix = (row.row_type === "section" && row.section && !row.name.startsWith(row.section)) ? `${row.section}.  ` : "";
      const showAmount = row.row_type !== "section" && row.row_type !== "group";

      return (
        <>
          <td style={{ width: 60, padding: "6px 8px", textAlign: "center", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", ...style }}>
            {row.code || ""}
          </td>
          <td style={{ padding: "6px 8px", paddingLeft: `${indentPx + 8}px`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", textTransform: row.row_type === "section" || row.row_type === "total" ? "uppercase" : "none", ...style }}>
            {prefix}{row.name}
          </td>
          <td style={{ width: 120, padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", ...style }}>
            {showAmount ? formatAmount(row.current_year) : ""}
          </td>
          <td style={{ width: 120, padding: "6px 8px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, borderRight: isPaymentSide ? "none" : `2px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, fontSize: "11.5px", color: SECONDARY, ...style }}>
            {showAmount ? formatAmount(row.previous_year) : ""}
          </td>
        </>
      );
    };

    return (
      <tr>
        {renderSide(receipt, rStyle, false)}
        {renderSide(payment, pStyle, true)}
      </tr>
    );
  };

  return (
    <Box border={`1px solid ${BORDER}`} borderRadius="10px" overflowX="auto" background="white" mb={4}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
        <thead><Header /></thead>
        <tbody>
          {/* Loop through max rows to render both sides simultaneously */}
          {Array.from({ length: maxRows }).map((_, i) => (
            <CombinedRow key={i} receipt={receiptRows[i]} payment={paymentRows[i]} />
          ))}
          
          {/* Grand Total Row */}
          <tr style={{ background: "#F0F4FA", borderTop: `2px solid ${BORDER}`, borderBottom: `2px solid ${BORDER}` }}>
            <td style={{ borderRight: `1px solid ${BORDER}` }} />
            <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>TOTAL</td>
            <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>{formatAmount(totalReceipts)}</td>
            <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, borderRight: `2px solid ${BORDER}`, fontSize: "12px" }}>{formatAmount(0)}</td>

            <td style={{ borderRight: `1px solid ${BORDER}` }} />
            <td style={{ padding: "10px", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>TOTAL</td>
            <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: DARK_RED, fontSize: "12px" }}>{formatAmount(totalPayments)}</td>
            <td style={{ padding: "10px", textAlign: "right", borderLeft: `1px solid ${BORDER}`, fontSize: "12px" }}>{formatAmount(0)}</td>
          </tr>
        </tbody>
      </table>
    </Box>
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
}) => {
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

  // Calculate the net difference for the print view
  const diff = totalReceipts - totalPayments;

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", width: "100%", fontSize: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK_RED, letterSpacing: "0.5px" }}>
          RECEIPTS AND PAYMENT ACCOUNT
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
        <thead><Header label="RECEIPTS" /></thead>
        <tbody>
          {receiptRows.map((r, i) => (
            <StatutoryRow key={`pr-${i}`} row={r} mode="print" />
          ))}
          {TotalRow("TOTAL RECEIPTS (I+II+III+IV)", totalReceipts)}
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
        <thead><Header label="PAYMENTS" /></thead>
        <tbody>
          {paymentRows.map((r, i) => (
            <StatutoryRow key={`pp-${i}`} row={r} mode="print" />
          ))}
          {TotalRow("TOTAL PAYMENTS (V+VI+VII+VIII)", totalPayments)}
        </tbody>
      </table>

      {/* ✅ ADDED: Net Closing Balance Row for Print */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "8px" }}>
        <colgroup>
          <col style={{ width: 55 }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <tbody>
          <tr style={{ background: "#F0F4FA", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <td style={{ borderRight: `1px solid ${BORDER}` }} />
            <td style={{ padding: "6px", fontWeight: 700, color: DARK_RED }}>
              NET CLOSING BALANCE
            </td>
            <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: DARK_RED }}>
              {formatAmount(Math.abs(diff))} {diff >= 0 ? "(Dr)" : "(Cr)"}
            </td>
            <td style={{ padding: "6px", textAlign: "right", borderLeft: `1px solid ${BORDER}` }}></td>
          </tr>
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
const ReceiptPaymentPage = () => {
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo]     = useState(today());
  const [prevFrom, setPrevFrom] = useState(lastYearMonthStart());
  const [prevTo, setPrevTo]     = useState(lastYearToday());
  const [displayMode, setDisplayMode] = useState("Detailed");
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
  const isBalanced = data?.is_balanced ?? true;

  const hasData = receiptRows.length > 0 || paymentRows.length > 0;

  // Calculate difference for the bottom summary
  const diff = totalReceipts - totalPayments;

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
              isDisabled={!hasData}
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
            <Box flex="1" minW="160px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Display Mode</Text>
              <Box as="select" value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} width="100%" height="40px" fontSize="12px" border={`1px solid ${BORDER}`} borderRadius="6px" px={2}>
                <option value="Summary">Summary</option>
                <option value="Detailed">Detailed</option>
              </Box>
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
              {!isBalanced && (
                <Text fontSize="11px" color={PRIMARY_RED} mt={1}>
                  Note: Total Receipts ({formatAmount(totalReceipts)}) ≠ Total Payments ({formatAmount(totalPayments)})
                </Text>
              )}
            </Box>

            <ScreenStatutory
              receiptRows={receiptRows}
              paymentRows={paymentRows}
              totalReceipts={totalReceipts}
              totalPayments={totalPayments}
              isBalanced={isBalanced}
            />

            {/* ✅ ADDED: Small Closing Balance design at the bottom */}
            <Flex
              justify="flex-end"
              align="center"
              mt={4}
              pt={3}
              borderTop={`1px solid ${BORDER}`}
            >
              <HStack gap={3}>
                <Text fontSize="13px" fontWeight="700" color={SECONDARY} letterSpacing="0.4px">
                  NET CLOSING BALANCE:
                </Text>
                <Text fontSize="18px" fontWeight="800" color={diff >= 0 ? "#2E7D32" : PRIMARY_RED}>
                  {formatAmount(Math.abs(diff))}
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
        />
      </ChurchPrintModal>
    </Box>
  );
};

export default ReceiptPaymentPage;