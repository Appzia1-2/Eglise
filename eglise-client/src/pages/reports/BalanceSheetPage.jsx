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
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";
const CREAM = "#FFFBF3";

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

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split("T")[0];

// ============================================================
// PRINT TABLE
// ============================================================
const PrintContent = ({ data }) => {
  const renderRows = (items, isAsset) => {
    if (!items || items.length === 0) return <tr><td colSpan={2} style={{ padding: "8px", textAlign: "center", fontStyle: "italic", color: "#888" }}>No entries</td></tr>;
    
    return items.map((item, i) => (
      <tr key={i} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <td style={{ padding: "6px 8px", fontSize: "11px", color: TEXT_COLOR, fontFamily: "Georgia, serif" }}>
          <div style={{ fontWeight: "600" }}>{item.name}</div>
          <div style={{ fontSize: "9px", color: SECONDARY_TEXT }}>{item.group}</div>
        </td>
        <td style={{ padding: "6px 8px", textAlign: "right", fontSize: "11px", color: TEXT_COLOR, fontFamily: "Georgia, serif" }}>
          {fmt(item.balance)}
        </td>
      </tr>
    ));
  };

  return (
    <div style={{ fontFamily: "Georgia, serif", backgroundColor: CREAM }}>
      <div style={{ display: "flex", border: `1px solid ${BORDER_COLOR}`, minHeight: "500px" }}>
        
        {/* LIABILITIES (Left) */}
        <div style={{ flex: 1, borderRight: `1px solid ${BORDER_COLOR}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <th style={{ padding: "8px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: DARK_RED }}>Liabilities & Equity</th>
                <th style={{ padding: "8px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: DARK_RED, width: "120px" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>{renderRows(data.liabilities, false)}</tbody>
            <tfoot>
              <tr style={{ background: "#FCEAEC", borderTop: `2px solid ${BORDER_COLOR}` }}>
                <td style={{ padding: "10px 8px", fontWeight: "700", fontSize: "12px", color: DARK_RED }}>TOTAL LIABILITIES</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "700", fontSize: "12px", color: DARK_RED }}>{fmt(data.total_liabilities)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ASSETS (Right) */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F9FB", borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <th style={{ padding: "8px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: DARK_RED }}>Assets</th>
                <th style={{ padding: "8px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: DARK_RED, width: "120px" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>{renderRows(data.assets, true)}</tbody>
            <tfoot>
              <tr style={{ background: "#FCEAEC", borderTop: `2px solid ${BORDER_COLOR}` }}>
                <td style={{ padding: "10px 8px", fontWeight: "700", fontSize: "12px", color: DARK_RED }}>TOTAL ASSETS</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "700", fontSize: "12px", color: DARK_RED }}>{fmt(data.total_assets)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
      
      {/* Difference Warning */}
      {Math.abs(data.difference) > 0.01 && (
        <div style={{ marginTop: "10px", padding: "8px", background: "#FFF5F5", border: "1px solid #FED7D7", textAlign: "center", borderRadius: "6px" }}>
          <span style={{ fontSize: "11px", color: "#B42318", fontWeight: "700" }}>
            Out of Balance by: {fmt(Math.abs(data.difference))}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PAGE
// ============================================================
const BalanceSheetPage = () => {
  const navigate = useNavigate();
  const [dateTo, setDateTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [church, setChurch] = useState({});

  useEffect(() => {
    const fetchChurch = async () => {
      const res = await getMyChurch();
      setChurch(res?.data ?? {});
    };
    fetchChurch();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await getBalanceSheetReport({ to: dateTo });
      setData(res?.data);
    } catch (err) {
      console.error(err);
      setPageError("Unable to load balance sheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTo]);

  const handleOpenPrint = () => { if (data) setIsPrintOpen(true); };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        <HStack gap={2} mb={2} fontSize="12px">
          <Text color={BLUE} cursor="pointer" onClick={() => navigate("/reports")}>Reports</Text>
          <Text color="#A2ACBB">/</Text>
          <Text color={SECONDARY_TEXT}>Balance Sheet</Text>
        </HStack>

        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color={PRIMARY_RED} letterSpacing="0.4px" mb={1}>BALANCE SHEET REPORT</Text>
            <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>Balance Sheet</Heading>
            <Text color={SECONDARY_TEXT} fontSize="12px">Statement of Assets, Liabilities, and Equity.</Text>
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={handleOpenPrint} isDisabled={!data} _hover={{ bg: "#FFF5F7" }} leftIcon={<PrinterIcon />}>Print</Button>
            <Button variant="outline" h="40px" px={5} borderColor={PRIMARY_RED} color={PRIMARY_RED} borderRadius="6px" fontSize="12px" fontWeight="600" onClick={handleOpenPrint} isDisabled={!data} _hover={{ bg: "#FFF5F7" }} leftIcon={<FilePdfIcon />}>Generate PDF</Button>
          </HStack>
        </Flex>

        <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" px={{ base: 4, md: 5 }} py={4} mb={4} bg="white">
          <Flex gap={4} align="flex-end" wrap="wrap">
            <Box flex="1" maxW="250px">
              <Text fontSize="10px" fontWeight="600" color={TEXT_COLOR} mb={1}>As of Date</Text>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} h="40px" fontSize="12px" borderColor={BORDER_COLOR} borderRadius="6px" color={TEXT_COLOR} />
            </Box>
            <Button h="40px" px={10} bg="white" border={`1px solid ${PRIMARY_RED}`} color={PRIMARY_RED} fontSize="12px" fontWeight="600" borderRadius="6px" onClick={fetchData} _hover={{ bg: "#FFF5F7" }}>Filter</Button>
          </Flex>
        </Box>

        {pageError && (
          <Box mb={4} p={3} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="12px">{pageError}</Text>
          </Box>
        )}

        {loading ? (
          <Flex justify="center" py={20}><Spinner size="xl" color={PRIMARY_RED} /></Flex>
        ) : !data ? (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="12px">No data for this date.</Text>
          </Box>
        ) : (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" overflow="hidden">
            <Box bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`} textAlign="center" py={3}>
              <Text fontSize="14px" fontWeight="700" color={TEXT_COLOR} letterSpacing="0.6px">BALANCE SHEET AS AT {dateTo}</Text>
            </Box>

            <Flex direction={{ base: "column", lg: "row" }}>
              {/* LIABILITIES */}
              <Box flex="1" borderRight={{ base: "none", lg: `1px solid ${BORDER_COLOR}` }} borderBottom={{ base: `1px solid ${BORDER_COLOR}`, lg: "none" }}>
                <Box as="table" width="100%" borderCollapse="collapse">
                  <Box as="thead">
                    <Box as="tr" bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="th" px={3} py={3} textAlign="left"><Text fontSize="12px" fontWeight="700" color={DARK_RED}>Liabilities & Equity</Text></Box>
                      <Box as="th" px={3} py={3} textAlign="right" width="180px"><Text fontSize="12px" fontWeight="700" color={DARK_RED}>Amount (₹)</Text></Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {data.liabilities.length === 0 ? (
                      <Box as="tr"><Box as="td" colSpan={2} px={3} py={4} textAlign="center" fontSize="12px" color={SECONDARY_TEXT}>No Liabilities</Box></Box>
                    ) : (
                      data.liabilities.map((item, i) => (
                        <Box as="tr" key={i} borderBottom={`1px solid ${BORDER_COLOR}`} bg={i % 2 === 1 ? "#FAFBFC" : "white"}>
                          <Box as="td" px={3} py={2}>
                            <Text fontSize="12px" fontWeight="600" color={TEXT_COLOR}>{item.name}</Text>
                            <Text fontSize="10px" color={SECONDARY_TEXT}>{item.group}</Text>
                          </Box>
                          <Box as="td" px={3} py={2} textAlign="right">
                            <Text fontSize="12px" fontWeight="600" color={TEXT_COLOR}>{fmt(item.balance)}</Text>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
                <Box borderTop={`1px solid ${BORDER_COLOR}`} p={3} bg="#FCEAEC">
                  <Flex justify="space-between">
                    <Text fontSize="12px" fontWeight="700" color={DARK_RED}>TOTAL LIABILITIES</Text>
                    <Text fontSize="12px" fontWeight="700" color={DARK_RED}>{fmt(data.total_liabilities)}</Text>
                  </Flex>
                </Box>
              </Box>

              {/* ASSETS */}
              <Box flex="1">
                <Box as="table" width="100%" borderCollapse="collapse">
                  <Box as="thead">
                    <Box as="tr" bg="#F7F9FB" borderBottom={`1px solid ${BORDER_COLOR}`}>
                      <Box as="th" px={3} py={3} textAlign="left"><Text fontSize="12px" fontWeight="700" color={DARK_RED}>Assets</Text></Box>
                      <Box as="th" px={3} py={3} textAlign="right" width="180px"><Text fontSize="12px" fontWeight="700" color={DARK_RED}>Amount (₹)</Text></Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {data.assets.length === 0 ? (
                      <Box as="tr"><Box as="td" colSpan={2} px={3} py={4} textAlign="center" fontSize="12px" color={SECONDARY_TEXT}>No Assets</Box></Box>
                    ) : (
                      data.assets.map((item, i) => (
                        <Box as="tr" key={i} borderBottom={`1px solid ${BORDER_COLOR}`} bg={i % 2 === 1 ? "#FAFBFC" : "white"}>
                          <Box as="td" px={3} py={2}>
                            <Text fontSize="12px" fontWeight="600" color={TEXT_COLOR}>{item.name}</Text>
                            <Text fontSize="10px" color={SECONDARY_TEXT}>{item.group}</Text>
                          </Box>
                          <Box as="td" px={3} py={2} textAlign="right">
                            <Text fontSize="12px" fontWeight="600" color={TEXT_COLOR}>{fmt(item.balance)}</Text>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
                <Box borderTop={`1px solid ${BORDER_COLOR}`} p={3} bg="#FCEAEC">
                  <Flex justify="space-between">
                    <Text fontSize="12px" fontWeight="700" color={DARK_RED}>TOTAL ASSETS</Text>
                    <Text fontSize="12px" fontWeight="700" color={DARK_RED}>{fmt(data.total_assets)}</Text>
                  </Flex>
                </Box>
              </Box>
            </Flex>
          </Box>
        )}

        <Flex mt={4} px={5} py={3} border={`1px solid ${BORDER_COLOR}`} borderRadius="8px" bg="#F8FAFC" align="center" justify="center" gap={3} wrap="wrap">
          <Text fontSize="12px" color={TEXT_COLOR} fontWeight="600">Difference:</Text>
          <Text fontSize="13px" color={PRIMARY_RED} fontWeight="700">{fmt(Math.abs(data?.difference || 0))}</Text>
          {Math.abs(data?.difference || 0) < 0.01 && (
            <Text fontSize="12px" color="green.600" fontWeight="600">✅ Assets and Liabilities are balanced</Text>
          )}
        </Flex>
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
        <PrintContent data={data || {}} />
      </ChurchPrintModal>
    </Box>
  );
};

export default BalanceSheetPage;