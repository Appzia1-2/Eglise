// src/pages/reports/ReceiptPaymentPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Flex, Heading, HStack, Input, Text,
} from "@chakra-ui/react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChurchPrintModal from "../../components/ChurchPrintModal";
import { getReceiptPaymentReport, getMyChurch } from "../../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";
const LINK_BLUE = "#2B5CE6";

// ============================================================
// CUSTOM ICONS
// ============================================================
const ArrowLeftIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PrinterIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth="1.8" fill="none" />
  </svg>
);
const FilePdfIcon = ({ size = 15, color = PRIMARY_RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <text x="12" y="17" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>PDF</text>
  </svg>
);
const ChevronDownIcon = ({ size = 14, color = SECONDARY_TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CalendarIcon = ({ size = 16, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.7" />
    <path d="M7 3v4M17 3v4M3.5 9.5h17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const TriangleIcon = ({ open = true, color = LINK_BLUE, size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s ease", display: "inline-block" }}>
    <polygon points="0,0 10,0 5,8" fill={color} />
  </svg>
);

// ============================================================
// HELPERS
// ============================================================
const formatAmount = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split("T")[0];
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
const formatDateDisplay = (dateStr) => { if (!dateStr) return ""; const [y, m, d] = dateStr.split("-"); return `${d}/${m}/${y}`; };

// ============================================================
// SCREEN ROW COMPONENT
// ============================================================
const RowGroup = ({ item, side, depth = 0, openMap, toggle, isDetailed }) => {
  const isOpen = openMap[`${side}-${item.name}`] !== false;
  const hasSubGroups = item.sub_groups && item.sub_groups.length > 0;
  const hasLedgers = item.ledgers && item.ledgers.length > 0;
  
  const showLedgers = hasLedgers && (isDetailed || !hasSubGroups);
  const isExpandable = hasSubGroups || showLedgers;

  return (
    <>
      <Box as="tr" bg="white" borderBottom={`1px solid ${BORDER_COLOR}`}>
        <Box as="td" px={3} py={2.5} pl={`${12 + depth * 20}px`}>
          <HStack gap={2} align="center">
            {isExpandable ? (
              <Box as="span" role="button" tabIndex={0} onClick={() => toggle(`${side}-${item.name}`)} cursor="pointer" display="inline-flex" w="14px" h="14px">
                <TriangleIcon open={isOpen} color={LINK_BLUE} />
              </Box>
            ) : <Box w="14px" />}
            <Text fontSize="12px" fontWeight={depth === 0 ? "800" : "700"} color={depth === 0 ? LINK_BLUE : TEXT_COLOR} textTransform="uppercase">
              {item.name}
            </Text>
          </HStack>
        </Box>
        <Box as="td" px={3} py={2.5} textAlign="right">
          <Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>{formatAmount(item.amount)}</Text>
        </Box>
      </Box>

      {isOpen && (
        <>
          {hasSubGroups && item.sub_groups.map((sg, i) => (
            <RowGroup key={i} item={sg} side={side} depth={depth + 1} openMap={openMap} toggle={toggle} isDetailed={isDetailed} />
          ))}
          {showLedgers && item.ledgers.map((led, i) => (
            <Box as="tr" key={i} bg="#FAFBFC" borderBottom={`1px solid ${BORDER_COLOR}`}>
              <Box as="td" px={3} py={2} pl={`${32 + depth * 20}px`}>
                <Text fontSize="11px" color={SECONDARY_TEXT}>{led.name}</Text>
              </Box>
              <Box as="td" px={3} py={2} textAlign="right">
                <Text fontSize="11px" color={SECONDARY_TEXT}>{formatAmount(led.amount)}</Text>
              </Box>
            </Box>
          ))}
        </>
      )}
    </>
  );
};

// ============================================================
// PRINT COMPONENTS
// ============================================================
const PrintRows = ({ item, depth = 0, isDetailed }) => {
  const hasSubGroups = item.sub_groups && item.sub_groups.length > 0;
  const hasLedgers = item.ledgers && item.ledgers.length > 0;
  const showLedgers = hasLedgers && (isDetailed || !hasSubGroups);
  
  const indent = 8 + depth * 16;
  const fontSize = depth === 0 ? "10.5px" : "10px";
  const color = depth === 0 ? DARK_RED : TEXT_COLOR;

  return (
    <>
      <tr style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <td style={{ padding: "6px 8px", paddingLeft: `${indent}px` }}>
          <span style={{ fontSize, fontWeight: "700", color, fontFamily: "Georgia, serif" }}>{item.name.toUpperCase()}</span>
        </td>
        <td style={{ padding: "6px 8px", textAlign: "right" }}>
          <span style={{ fontSize, fontWeight: "700", color: TEXT_COLOR, fontFamily: "Georgia, serif" }}>{formatAmount(item.amount)}</span>
        </td>
      </tr>
      {hasSubGroups && item.sub_groups.map((sg, i) => <PrintRows key={i} item={sg} depth={depth + 1} isDetailed={isDetailed} />)}
      {showLedgers && item.ledgers.map((led, i) => (
        <tr key={`led-${i}`} style={{ borderBottom: `1px solid ${BORDER_COLOR}`, background: "#FAFBFC" }}>
          <td style={{ padding: "4px 8px", paddingLeft: `${indent + 16}px` }}>
            <span style={{ fontSize: "9.5px", color: SECONDARY_TEXT, fontFamily: "Georgia, serif" }}>{led.name}</span>
          </td>
          <td style={{ padding: "4px 8px", textAlign: "right" }}>
            <span style={{ fontSize: "9.5px", color: SECONDARY_TEXT, fontFamily: "Georgia, serif" }}>{formatAmount(led.amount)}</span>
          </td>
        </tr>
      ))}
    </>
  );
};

const PrintGrandRow = ({ label, amount, bold = false }) => (
  <tr style={{ background: bold ? "#F5CED8" : "#F0F4FA", borderTop: bold ? `2px solid ${BORDER_COLOR}` : "none", borderBottom: `1px solid ${BORDER_COLOR}` }}>
    <td style={{ padding: "8px" }}><span style={{ fontSize: "11px", fontWeight: "700", color: bold ? DARK_RED : LINK_BLUE, fontFamily: "Georgia, serif" }}>{label}</span></td>
    <td style={{ padding: "8px", textAlign: "right" }}><span style={{ fontSize: "11px", fontWeight: "700", color: bold ? DARK_RED : TEXT_COLOR, fontFamily: "Georgia, serif" }}>{formatAmount(amount)}</span></td>
  </tr>
);

const PrintContent = ({ receipts, payments, summary, isDetailed }) => (
  <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <div style={{ display: "flex", gap: "0", border: `1px solid ${BORDER_COLOR}` }}>
      {/* LEFT: RECEIPTS */}
      <div style={{ flex: 1, borderRight: `1px solid ${BORDER_COLOR}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER_COLOR}` }}>
              <th style={{ padding: "8px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: TEXT_COLOR }}>Receipts</th>
              <th style={{ padding: "8px", textAlign: "right", width: "120px", fontSize: "11px", fontWeight: "700", color: TEXT_COLOR }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {/* ✅ OPENING BALANCE ADDED */}
            <tr style={{ borderBottom: `1px solid ${BORDER_COLOR}`, background: "#F8FAFC" }}>
              <td style={{ padding: "6px 8px" }}><span style={{ fontSize: "10.5px", fontWeight: "700", color: DARK_RED }}>I. OPENING BALANCES (CASH & BANK)</span></td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}><span style={{ fontSize: "10.5px", fontWeight: "700", color: TEXT_COLOR }}>{formatAmount(summary.opening_balance)}</span></td>
            </tr>
            
            {receipts.map((g, i) => <PrintRows key={i} item={g} depth={0} isDetailed={isDetailed} />)}
          </tbody>
          <tfoot>
            <PrintGrandRow label="TOTAL RECEIPTS" amount={summary.total_receipts} bold />
          </tfoot>
        </table>
      </div>
      
      {/* RIGHT: PAYMENTS */}
      <div style={{ flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER_COLOR}` }}>
              <th style={{ padding: "8px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: TEXT_COLOR }}>Payments</th>
              <th style={{ padding: "8px", textAlign: "right", width: "120px", fontSize: "11px", fontWeight: "700", color: TEXT_COLOR }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((g, i) => <PrintRows key={i} item={g} depth={0} isDetailed={isDetailed} />)}
            
            {/* ✅ CLOSING BALANCE ADDED */}
            <tr style={{ borderBottom: `1px solid ${BORDER_COLOR}`, background: "#F8FAFC" }}>
              <td style={{ padding: "6px 8px" }}><span style={{ fontSize: "10.5px", fontWeight: "700", color: DARK_RED }}>VIII. CLOSING BALANCES (CASH & BANK)</span></td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}><span style={{ fontSize: "10.5px", fontWeight: "700", color: TEXT_COLOR }}>{formatAmount(summary.closing_balance)}</span></td>
            </tr>
          </tbody>
          <tfoot>
            <PrintGrandRow label="TOTAL PAYMENTS" amount={summary.total_payments} bold />
          </tfoot>
        </table>
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================
const ReceiptPaymentPage = () => {
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [displayMode, setDisplayMode] = useState("Summary");
  
  const [openMap, setOpenMap] = useState({});
  const [data, setData] = useState({ receipts: [], payments: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  
  const [church, setChurch] = useState({ name: "", address: "" });

  useEffect(() => {
    const fetchChurch = async () => {
      try {
        const res = await getMyChurch();
        const c = res?.data ?? res ?? {};
        setChurch({
          name: c.name || "Church",
          address: c.full_address || c.address || [c.city, c.state, c.country].filter(Boolean).join(", ") || "",
        });
      } catch (err) {
        console.error("Failed to fetch church info", err);
      }
    };
    fetchChurch();
  }, []);

  const toggle = (key) => setOpenMap((p) => ({ ...p, [key]: p[key] === false ? true : false }));

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await getReceiptPaymentReport({ from: dateFrom, to: dateTo });
      setData(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setPageError("Unable to load report.");
      setData({ receipts: [], payments: [], summary: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const receipts = data?.receipts || [];
  const payments = data?.payments || [];
  const summary = data?.summary || { opening_balance: 0, total_income: 0, total_receipts: 0, total_expense: 0, closing_balance: 0, total_payments: 0 };
  const hasData = receipts.length > 0 || payments.length > 0;
  const isDetailed = displayMode === "Detailed";

  const handleOpenPrint = () => { if (hasData) setIsPrintOpen(true); };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Receipts &amp; Payments {isDetailed ? "" : "Summary"}</Text>
        </HStack>

        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>RECEIPTS &amp; PAYMENTS {isDetailed ? "" : "SUMMARY"} REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>Receipts &amp; Payments {isDetailed ? "" : "Summary"}</Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">View cash receipts and payments grouped by ledger group.</Text>
          </Box>
          <HStack gap={3} flexWrap="wrap">
            {/* <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={() => navigate(-1)} _hover={{ bg: "#FFF5F7" }} leftIcon={<ArrowLeftIcon />}>Back</Button> */}
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={handleOpenPrint} isDisabled={!hasData} _hover={{ bg: "#FFF5F7" }} leftIcon={<PrinterIcon />}>Print</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={handleOpenPrint} isDisabled={!hasData} _hover={{ bg: "#FFF5F7" }} leftIcon={<FilePdfIcon />}>Generate PDF</Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} wrap="wrap">
            <Box flex="1" minW="170px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date From</Text>
              <Box position="relative">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>
            <Box flex="1" minW="170px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Date To</Text>
              <Box position="relative">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><CalendarIcon /></Box>
              </Box>
            </Box>
            <Box flex="1" minW="180px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>Display Mode</Text>
              <Box position="relative">
                <Box as="select" value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} width="100%" height="40px" fontSize="12px" color={TEXT_COLOR} border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" bg="white" appearance="none" px="11px" outline="none" cursor="pointer">
                  <option value="Summary">Summary</option>
                  <option value="Detailed">Detailed</option>
                </Box>
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" pointerEvents="none"><ChevronDownIcon /></Box>
              </Box>
            </Box>
            <Box flexShrink={0}>
              <Button h="40px" px={10} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} fontSize="12px" fontWeight="600" borderRadius="6px" onClick={fetchData} _hover={{ bg: "#FFF5F7" }}>Filter</Button>
            </Box>
          </Flex>
        </Box>

        {loading ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center"><Text color={SECONDARY_TEXT} fontSize="12px">Loading…</Text></Box>
        ) : !hasData ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">No data for this period</Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>Adjust the date range or post entries.</Text>
          </Box>
        ) : (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" overflow="hidden">
            <Box bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`} textAlign="center" py={3}>
              <Text fontSize="14px" fontWeight="700" color={TEXT_COLOR} letterSpacing="0.6px">
                RECEIPTS &amp; PAYMENTS {isDetailed ? "STATEMENT" : "SUMMARY"}
              </Text>
            </Box>

            <Flex direction={{ base: "column", lg: "row" }}>
              {/* LEFT: RECEIPTS */}
              <Box flex="1" borderRight={{ base: "none", lg: `1px solid ${BORDER_COLOR}` }} borderBottom={{ base: `1px solid ${BORDER_COLOR}`, lg: "none" }}>
                <Box as="table" width="100%" borderCollapse="collapse">
                  <Box as="thead">
                    <Box as="tr" bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="th" px={3} py={3} textAlign="left"><Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>Receipts</Text></Box>
                      <Box as="th" px={3} py={3} textAlign="right" width="180px"><Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>Amount (₹)</Text></Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {/* ✅ OPENING BALANCE ADDED */}
                    <Box as="tr" bg="#F8FAFC" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="td" px={3} py={2.5}>
                        <Text fontSize="12px" fontWeight="700" color={DARK_RED} textTransform="uppercase">I. Opening Balances (Cash & Bank)</Text>
                      </Box>
                      <Box as="td" px={3} py={2.5} textAlign="right">
                        <Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>{formatAmount(summary.opening_balance)}</Text>
                      </Box>
                    </Box>

                    {receipts.map((item, i) => <RowGroup key={i} item={item} side="rec" depth={0} openMap={openMap} toggle={toggle} isDetailed={isDetailed} />)}
                  </Box>
                </Box>
                <Box borderTop={`1px solid ${BORDER_COLOR}`}>
                  <Box as="table" width="100%" borderCollapse="collapse"><Box as="tbody">
                    <tr bg="#F0F4FA"><td style={{ padding: '12px', fontWeight: '700', color: LINK_BLUE, fontSize: '12px' }}>TOTAL RECEIPTS</td><td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: TEXT_COLOR, fontSize: '12px' }}>{formatAmount(summary.total_receipts)}</td></tr>
                  </Box></Box>
                </Box>
              </Box>

              {/* RIGHT: PAYMENTS */}
              <Box flex="1">
                <Box as="table" width="100%" borderCollapse="collapse">
                  <Box as="thead">
                    <Box as="tr" bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="th" px={3} py={3} textAlign="left"><Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>Payments</Text></Box>
                      <Box as="th" px={3} py={3} textAlign="right" width="180px"><Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>Amount (₹)</Text></Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {payments.map((item, i) => <RowGroup key={i} item={item} side="pay" depth={0} openMap={openMap} toggle={toggle} isDetailed={isDetailed} />)}
                    
                    {/* ✅ CLOSING BALANCE ADDED */}
                    <Box as="tr" bg="#F8FAFC" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="td" px={3} py={2.5}>
                        <Text fontSize="12px" fontWeight="700" color={DARK_RED} textTransform="uppercase">VIII. Closing Balances (Cash & Bank)</Text>
                      </Box>
                      <Box as="td" px={3} py={2.5} textAlign="right">
                        <Text fontSize="12px" fontWeight="700" color={TEXT_COLOR}>{formatAmount(summary.closing_balance)}</Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box borderTop={`1px solid ${BORDER_COLOR}`}>
                  <Box as="table" width="100%" borderCollapse="collapse"><Box as="tbody">
                    <tr bg="#F0F4FA"><td style={{ padding: '12px', fontWeight: '700', color: LINK_BLUE, fontSize: '12px' }}>TOTAL PAYMENTS</td><td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: TEXT_COLOR, fontSize: '12px' }}>{formatAmount(summary.total_payments)}</td></tr>
                  </Box></Box>
                </Box>
              </Box>
            </Flex>
          </Box>
        )}

        <Flex mt={4} px={5} py={3} border={`1px solid ${BORDER_COLOR}`} borderRadius="8px" bg="#F8FAFC" align="center" justify="center" gap={3} wrap="wrap">
          <Text fontSize="12px" color={TEXT_COLOR} fontWeight="600">Difference:</Text>
          <Text fontSize="13px" color={PRIMARY_RED} fontWeight="700">{formatAmount(Math.abs(summary.total_receipts - summary.total_payments))}</Text>
          {summary.is_balanced && (
            <>
              <Box width="5px" height="5px" borderRadius="50%" bg={SECONDARY_TEXT} />
              <Text fontSize="12px" color={SECONDARY_TEXT}>Receipts and Payments are balanced</Text>
            </>
          )}
        </Flex>
      </Container>

      <Footer />

      <ChurchPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`RECEIPTS & PAYMENTS`}
        subtitle={`Period: ${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}`}
        church={church}
        pdfFileName={`receipts-payments-${dateFrom}-to-${dateTo}.pdf`}
        orientation="portrait"
      >
        <PrintContent receipts={receipts} payments={payments} summary={summary} isDetailed={isDetailed} />
      </ChurchPrintModal>
    </Box>
  );
};

export default ReceiptPaymentPage;