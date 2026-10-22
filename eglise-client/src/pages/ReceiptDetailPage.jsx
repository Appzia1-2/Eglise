// src/pages/ReceiptDetailPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  Badge,
  Circle,
  VStack,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuFileText,
  LuPrinter,
  LuCircleDollarSign,
  LuUsers,
  LuCalendar,
  LuIndianRupee,
  LuBuilding2,
  LuClipboardList,
  LuBookOpen,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";
import { getReceipt, getMyChurch } from "../api/registryServices";
import { amountInWords } from "../utils/amountInWords";

// ✅ Import the Modal and the Voucher
import ChurchPrintModal from "../components/ChurchPrintModal";
import ReceiptVoucher from "../components/ReceiptVoucher";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

/* =========================================================
   HELPERS
========================================================= */
const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (v) => `₹ ${formatMoney(v)}`;

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

const formatDateTime = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   INFO ROW & CARD
========================================================= */
const InfoRow = ({ label, value, valueColor }) => (
  <Flex justify="space-between" align="flex-start" gap={4} py={2}>
    <Text fontSize="12px" color={MUTED} minW="130px">
      {label}
    </Text>
    <Text
      fontSize="12px"
      fontWeight="500"
      color={valueColor || DARK}
      textAlign="right"
      flex="1"
    >
      {value}
    </Text>
  </Flex>
);

const InfoCard = ({ icon, title, children, rightSlot }) => (
  <Box
    border={`1px solid ${BORDER}`}
    borderRadius="10px"
    bg="white"
    p={5}
    h="100%"
    position="relative"
  >
    <HStack gap={3} mb={4}>
      <Circle size="36px" bg="#FFF0F4" color={RED} flexShrink={0}>
        <Icon as={icon} boxSize={4.5} />
      </Circle>
      <Text fontSize="15px" fontWeight="700" color={DARK}>
        {title}
      </Text>
    </HStack>
    <Box>{children}</Box>
    {rightSlot}
  </Box>
);

/* =========================================================
   MAIN
========================================================= */
const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [tab, setTab] = useState("overview");

  const [church, setChurch] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  /* -------------------------------------------------------
     LOAD RECEIPT & CHURCH
  ------------------------------------------------------- */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getReceipt(id);
        const data = res?.data ?? res ?? null;
        setReceipt(data);
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Error",
          description: err?.response?.data?.detail || "Failed to load receipt.",
          type: "error",
        });
        setReceipt(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    const loadChurch = async () => {
      try {
        const res = await getMyChurch();
        const data = res?.data ?? res ?? null;
        setChurch(data);
      } catch (e) {
        console.warn("Could not load church info:", e);
      }
    };
    loadChurch();
  }, []);

  if (isLoading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1">
          <Flex justify="center" align="center" minH="450px">
            <Box
              width="38px"
              height="38px"
              border="4px solid"
              borderColor="#E5E7EB"
              borderTopColor={RED}
              borderRadius="50%"
              animation="spin 1s linear infinite"
            />
          </Flex>
          <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (!receipt) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={5}>
          <Box border={`1px solid ${BORDER}`} borderRadius="10px" bg="white" p={10} textAlign="center">
            <Text fontSize="18px" fontWeight="700" color={DARK} mb={2}>Receipt Not Found</Text>
            <Text fontSize="12px" color={MUTED} mb={5}>The requested receipt could not be loaded.</Text>
            <Button bg={RED} color="white" h="38px" fontSize="12px" borderRadius="6px" onClick={() => navigate("/receipts")} _hover={{ bg: "#B0143A" }}>
              <Icon as={LuArrowLeft} mr={2} /> Back to Receipts
            </Button>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  const isCancelled = receipt.is_cancelled;
  const lines = receipt.lines || [];

  return (
    <>
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />

        <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={{ base: 3, md: 5 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text color={PRIMARY_MAROON} cursor="pointer" onClick={() => navigate("/activities")}>Activities</Text>
            <Text>/</Text>
            <Text color={PRIMARY_MAROON} cursor="pointer" onClick={() => navigate("/receipts")}>Receipts</Text>
            <Text>/</Text>
            <Text>{receipt.receipt_number}</Text>
          </HStack>

          {/* HEADER */}
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>RECEIPT PROFILE</Text>
              <Heading color={DARK} fontSize={{ base: "24px", md: "28px" }} lineHeight="1.1" mb={1}>Receipt Details</Heading>
              <Text color={MUTED} fontSize="12px">View complete receipt, transaction and ledger information.</Text>
            </Box>

            <HStack gap={2} flexWrap="wrap">
              <Button variant="outline" borderColor="#FF5A7D" color={RED} bg="white" h="38px" px={4} fontSize="12px" borderRadius="6px" onClick={() => navigate("/receipts")} _hover={{ bg: "#FFF0F4" }}>
                <Icon as={LuArrowLeft} mr={2} boxSize={4} /> Back to Receipts
              </Button>

              <Button variant="outline" borderColor="#FF5A7D" color={RED} bg="white" h="38px" px={4} fontSize="12px" borderRadius="6px" _hover={{ bg: "#FFF0F4" }} onClick={() => setPrintOpen(true)}>
                <Icon as={LuFileText} mr={2} boxSize={4} /> Generate PDF
              </Button>

              <Button variant="outline" borderColor="#FF5A7D" color={RED} bg="white" h="38px" px={4} fontSize="12px" borderRadius="6px" _hover={{ bg: "#FFF0F4" }} onClick={() => setPrintOpen(true)}>
                <Icon as={LuPrinter} mr={2} boxSize={4} /> Print
              </Button>
            </HStack>
          </Flex>

          {/* HERO CARD */}
          <Box border={`1px solid ${BORDER}`} borderRadius="10px" bg="white" p={5} mb={4}>
            <Flex align="center" gap={{ base: 4, md: 8 }} wrap="wrap">
              <HStack gap={4} flex="1.4" minW="280px">
                <Circle size="60px" bg="#FFF0F4" color={RED} flexShrink={0}>
                  <Icon as={LuCircleDollarSign} boxSize={7} />
                </Circle>
                <Box minW={0}>
                  <Heading fontSize="20px" fontWeight="700" color={DARK} lineClamp={1}>{receipt.member_name}</Heading>
                  <HStack gap={3} mt={1} flexWrap="wrap">
                    <Text fontSize="12px" color={MUTED}>{receipt.receipt_number}</Text>
                    {receipt.ref_no && (
                      <>
                        <Text fontSize="12px" color={MUTED}>•</Text>
                        <Text fontSize="12px" color={MUTED}>{receipt.ref_no}</Text>
                      </>
                    )}
                    <Badge bg={isCancelled ? "#FFF1F3" : "#ECFDF3"} color={isCancelled ? "#D7193F" : "#16804A"} fontSize="10px" px={2} py={1} borderRadius="full" fontWeight="600">
                      {isCancelled ? "Cancelled" : "Posted"}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>

              <Box flex="1" minW="180px" borderLeft={{ base: "none", md: `1px solid ${BORDER}` }} pl={{ base: 0, md: 6 }} textAlign={{ base: "left", md: "center" }}>
                <Icon as={LuUsers} boxSize={7} color={RED} mb={2} />
                <Text fontSize="14px" fontWeight="600" color={DARK}>{receipt.member_name}</Text>
                <Text fontSize="11px" color={MUTED}>Member Name</Text>
              </Box>

              <Box flex="1" minW="150px" borderLeft={{ base: "none", md: `1px solid ${BORDER}` }} pl={{ base: 0, md: 6 }} textAlign={{ base: "left", md: "center" }}>
                <Icon as={LuCalendar} boxSize={7} color={RED} mb={2} />
                <Text fontSize="14px" fontWeight="600" color={DARK}>{formatDate(receipt.receipt_date)}</Text>
                <Text fontSize="11px" color={MUTED}>Receipt Date</Text>
              </Box>

              <Box flex="1" minW="150px" borderLeft={{ base: "none", md: `1px solid ${BORDER}` }} pl={{ base: 0, md: 6 }} textAlign={{ base: "left", md: "center" }}>
                <Icon as={LuIndianRupee} boxSize={7} color={RED} mb={2} />
                <Text fontSize="14px" fontWeight="700" color={DARK}>{formatAmount(receipt.grand_total)}</Text>
                <Text fontSize="11px" color={MUTED}>Amount Received</Text>
              </Box>
            </Flex>
          </Box>

          {/* TABS */}
          <HStack gap={0} mb={4} borderBottom={`1px solid ${BORDER}`} overflowX="auto">
            {[{ key: "overview", label: "Overview" }, { key: "lines", label: "Receipt Lines" }, { key: "activity", label: "Record Activity" }].map((t) => {
              const active = tab === t.key;
              return (
                <Box key={t.key} px={5} py={3} cursor="pointer" borderBottom={active ? `2px solid ${RED}` : "2px solid transparent"} mb="-1px" onClick={() => setTab(t.key)} _hover={{ color: RED }}>
                  <Text fontSize="13px" fontWeight={active ? "700" : "500"} color={active ? RED : MUTED}>{t.label}</Text>
                </Box>
              );
            })}
          </HStack>

          {/* TAB CONTENT - OVERVIEW */}
          {tab === "overview" && (
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              <InfoCard icon={LuClipboardList} title="Receipt Information">
                <Box borderTop="1px solid #F0F2F5" pt={2}>
                  <InfoRow label="Date" value={formatDate(receipt.receipt_date)} />
                  <InfoRow label="Receipt Number" value={receipt.receipt_number} />
                  <InfoRow label="Ref Number" value={receipt.ref_no || "—"} />
                  <InfoRow label="Status" value={isCancelled ? "Cancelled" : "Posted"} valueColor={isCancelled ? RED : "#16804A"} />
                </Box>
              </InfoCard>

              <InfoCard icon={LuUsers} title="Member & Ledger Information" rightSlot={<Box position="absolute" right={4} bottom={3} opacity={0.15} pointerEvents="none"><Icon as={LuBookOpen} boxSize={16} color={RED} /></Box>}>
                <Box borderTop="1px solid #F0F2F5" pt={2}>
                  <InfoRow label="Member Name" value={receipt.member_name} />
                  <InfoRow label="Particulars" value={lines.length ? lines.map((l) => l.ledger_name).join(", ") : "—"} />
                  <InfoRow label="Amount" value={formatAmount(receipt.grand_total)} />
                </Box>
              </InfoCard>

              <InfoCard icon={LuBuilding2} title="Transaction Information">
                <Box borderTop="1px solid #F0F2F5" pt={2}>
                  <InfoRow label="Payment Type" value={receipt.payment_type === "BANK" ? "Bank" : "Cash"} />
                  <InfoRow label="Transaction Type" value={receipt.transaction_type ? receipt.transaction_type.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "—"} />
                  <InfoRow label="Bank Account" value={receipt.bank_account_display || "—"} />
                </Box>
              </InfoCard>

              <InfoCard icon={LuFileText} title="Record Information">
                <Box borderTop="1px solid #F0F2F5" pt={2}>
                  <InfoRow label="Narration" value={receipt.narration || "—"} />
                  <InfoRow label="Created" value={formatDate(receipt.created_at)} />
                  <InfoRow label="Last Updated" value={formatDate(receipt.updated_at)} />
                  {isCancelled && (
                    <>
                      <InfoRow label="Cancel Reason" value={receipt.cancel_reason || "—"} valueColor={RED} />
                      <InfoRow label="Cancel Remarks" value={receipt.cancel_remarks || "—"} />
                      <InfoRow label="Cancelled At" value={formatDateTime(receipt.cancelled_at)} />
                    </>
                  )}
                </Box>
              </InfoCard>
            </SimpleGrid>
          )}

          {/* TAB CONTENT - LINES */}
          {tab === "lines" && (
            <Box border={`1px solid ${BORDER}`} borderRadius="10px" bg="white" p={5}>
              <Text fontSize="15px" fontWeight="700" color={DARK} mb={4}>Receipt Lines</Text>
              <Box overflowX="auto" border="1px solid #E6EAF0" borderRadius="6px">
                <Box as="table" width="100%" minW="600px" borderCollapse="collapse">
                  <Box as="thead">
                    <Box as="tr" bg="#F7F9FB">
                      {["#", "Particulars (Ledger)", "Amount"].map((h) => (
                        <Box as="th" key={h} textAlign={h === "Amount" ? "right" : "left"} px={4} py={3} fontSize="11px" fontWeight="700" color={DARK} borderBottom="1px solid #E6EAF0" whiteSpace="nowrap">{h}</Box>
                      ))}
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {lines.length === 0 ? (
                      <Box as="tr">
                        <Box as="td" colSpan={3} textAlign="center" py={6} color={MUTED} fontSize="12px">No lines</Box>
                      </Box>
                    ) : (
                      lines.map((l, idx) => (
                        <Box as="tr" key={l.id} borderBottom="1px solid #F1F3F5">
                          <Box as="td" px={4} py={3} fontSize="12px" color={DARK}>{idx + 1}</Box>
                          <Box as="td" px={4} py={3} fontSize="12px" fontWeight="600" color={DARK}>{l.ledger_name}</Box>
                          <Box as="td" px={4} py={3} fontSize="12px" fontWeight="600" color={DARK} textAlign="right" whiteSpace="nowrap">{formatAmount(l.amount)}</Box>
                        </Box>
                      ))
                    )}
                    {lines.length > 0 && (
                      <Box as="tr" bg="#F7F9FB">
                        <Box as="td" colSpan={2} px={4} py={3} fontSize="12px" fontWeight="700" color={DARK}>Grand Total</Box>
                        <Box as="td" px={4} py={3} fontSize="12px" fontWeight="700" color={RED} textAlign="right" whiteSpace="nowrap">{formatAmount(receipt.grand_total)}</Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
              {lines.length > 0 && (
                <Text fontSize="11px" color={MUTED} mt={3} textAlign="right">
                  Amount in words: <Text as="span" fontWeight="600" color={DARK}>{amountInWords(receipt.grand_total)}</Text>
                </Text>
              )}
            </Box>
          )}

          {/* TAB CONTENT - ACTIVITY */}
          {tab === "activity" && (
            <Box border={`1px solid ${BORDER}`} borderRadius="10px" bg="white" p={5}>
              <Text fontSize="15px" fontWeight="700" color={DARK} mb={4}>Record Activity</Text>
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Box w="10px" h="10px" borderRadius="full" bg="#16804A" />
                  <Text fontSize="12px" color={DARK} fontWeight="600">Created</Text>
                  <Text fontSize="12px" color={MUTED} ml="auto">{formatDateTime(receipt.created_at)}</Text>
                </HStack>
                <HStack>
                  <Box w="10px" h="10px" borderRadius="full" bg="#2563EB" />
                  <Text fontSize="12px" color={DARK} fontWeight="600">Last Updated</Text>
                  <Text fontSize="12px" color={MUTED} ml="auto">{formatDateTime(receipt.updated_at)}</Text>
                </HStack>
                {isCancelled && (
                  <HStack>
                    <Box w="10px" h="10px" borderRadius="full" bg={RED} />
                    <Text fontSize="12px" color={DARK} fontWeight="600">Cancelled</Text>
                    <Text fontSize="12px" color={MUTED} ml="auto">{formatDateTime(receipt.cancelled_at)}</Text>
                  </HStack>
                )}
              </VStack>
            </Box>
          )}
        </Box>
        <Footer />
      </Box>

      {/* ✅ CONNECTED TO CHURCH PRINT MODAL WITH VOUCHER VARIANT */}
      <ChurchPrintModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        variant="voucher"
        church={church || {}}
        pdfFileName={`Receipt_${receipt.receipt_number || id}.pdf`}
        defaultOrientation="landscape"
      >
        <ReceiptVoucher receipt={receipt} church={church} />
      </ChurchPrintModal>
    </>
  );
};

export default ReceiptDetailPage;