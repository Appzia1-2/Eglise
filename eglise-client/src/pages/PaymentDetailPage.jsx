// src/pages/PaymentDetailPage.jsx

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
  LuPencil,
  LuWallet,
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

import { getPayment, getMyChurch } from "../api/registryServices";

import PaymentPrintPreview from "../components/PaymentPrintPreview";

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
   INFO ROW
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

/* =========================================================
   INFO CARD
========================================================= */

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

const PaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [tab, setTab] = useState("overview");

  const [church, setChurch] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  /* -------------------------------------------------------
     LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getPayment(id);
        const data = res?.data ?? res ?? null;
        setPayment(data);
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Error",
          description:
            err?.response?.data?.detail || "Failed to load payment.",
          type: "error",
        });
        setPayment(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  /* -------------------------------------------------------
     LOAD CHURCH INFO (for the print voucher header)
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     NOT FOUND
  ------------------------------------------------------- */

  if (!payment) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={5}>
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            bg="white"
            p={10}
            textAlign="center"
          >
            <Text fontSize="18px" fontWeight="700" color={DARK} mb={2}>
              Payment Not Found
            </Text>
            <Text fontSize="12px" color={MUTED} mb={5}>
              The requested payment could not be loaded.
            </Text>
            <Button
              bg={RED}
              color="white"
              h="38px"
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/payments")}
              _hover={{ bg: "#B0143A" }}
            >
              <Icon as={LuArrowLeft} mr={2} />
              Back to Payments
            </Button>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  /* -------------------------------------------------------
     DERIVED
  ------------------------------------------------------- */

  const isCancelled = payment.is_cancelled;

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%" px={{ base: 3, md: 6 }} py={{ base: 3, md: 5 }}>
        {/* BREADCRUMB */}
        <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() => navigate("/activities")}
          >
            Activities
          </Text>
          <Text>/</Text>
          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() => navigate("/payments")}
          >
            Payments
          </Text>
          <Text>/</Text>
          <Text>{payment.voucher_number}</Text>
        </HStack>

        {/* HEADER */}
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={3}
          mb={4}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Text fontSize="10px" fontWeight="700" color={RED} mb={1}>
              PAYMENT PROFILE
            </Text>
            <Heading
              color={DARK}
              fontSize={{ base: "24px", md: "28px" }}
              lineHeight="1.1"
              mb={1}
            >
              Payment Details
            </Heading>
            <Text color={MUTED} fontSize="12px">
              View complete payment, transaction and ledger information.
            </Text>
          </Box>

          <HStack gap={2} flexWrap="wrap">
            <Button
              variant="outline"
              borderColor="#FF5A7D"
              color={RED}
              bg="white"
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/payments")}
              _hover={{ bg: "#FFF0F4" }}
            >
              <Icon as={LuArrowLeft} mr={2} boxSize={4} />
              Back to Payments
            </Button>

            {/* Generate PDF → opens print preview modal */}
            <Button
              variant="outline"
              borderColor="#FF5A7D"
              color={RED}
              bg="white"
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              _hover={{ bg: "#FFF0F4" }}
              onClick={() => setPrintOpen(true)}
            >
              <Icon as={LuFileText} mr={2} boxSize={4} />
              Generate PDF
            </Button>

            {/* Print → opens print preview modal */}
            <Button
              variant="outline"
              borderColor="#FF5A7D"
              color={RED}
              bg="white"
              h="38px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              _hover={{ bg: "#FFF0F4" }}
              onClick={() => setPrintOpen(true)}
            >
              <Icon as={LuPrinter} mr={2} boxSize={4} />
              Print
            </Button>

            {!isCancelled && (
              <Button
                bg={RED}
                color="white"
                h="38px"
                px={5}
                fontSize="12px"
                borderRadius="6px"
                onClick={() => navigate(`/payments/${id}/edit`)}
                _hover={{ bg: "#B0143A" }}
              >
                <Icon as={LuPencil} mr={2} boxSize={4} />
                Edit Payment
              </Button>
            )}
          </HStack>
        </Flex>

        {/* HERO CARD */}
        <Box
          border={`1px solid ${BORDER}`}
          borderRadius="10px"
          bg="white"
          p={5}
          mb={4}
        >
          <Flex align="center" gap={{ base: 4, md: 8 }} wrap="wrap">
            {/* LEFT */}
            <HStack gap={4} flex="1.4" minW="280px">
              <Circle size="60px" bg="#FFF0F4" color={RED} flexShrink={0}>
                <Icon as={LuWallet} boxSize={7} />
              </Circle>
              <Box minW={0}>
                <Heading
                  fontSize="20px"
                  fontWeight="700"
                  color={DARK}
                  lineClamp={1}
                >
                  {payment.party_name}
                </Heading>
                <HStack gap={3} mt={1} flexWrap="wrap">
                  <Text fontSize="12px" color={MUTED}>
                    {payment.voucher_number}
                  </Text>
                  {payment.ref_no && (
                    <>
                      <Text fontSize="12px" color={MUTED}>
                        •
                      </Text>
                      <Text fontSize="12px" color={MUTED}>
                        {payment.ref_no}
                      </Text>
                    </>
                  )}
                  <Badge
                    bg={isCancelled ? "#FFF1F3" : "#ECFDF3"}
                    color={isCancelled ? "#D7193F" : "#16804A"}
                    fontSize="10px"
                    px={2}
                    py={1}
                    borderRadius="full"
                    fontWeight="600"
                  >
                    {isCancelled ? "Cancelled" : "Paid"}
                  </Badge>
                </HStack>
              </Box>
            </HStack>

            {/* PARTY NAME */}
            <Box
              flex="1"
              minW="180px"
              borderLeft={{ base: "none", md: `1px solid ${BORDER}` }}
              pl={{ base: 0, md: 6 }}
              textAlign={{ base: "left", md: "center" }}
            >
              <Icon as={LuUsers} boxSize={7} color={RED} mb={2} />
              <Text fontSize="14px" fontWeight="600" color={DARK}>
                {payment.party_name}
              </Text>
              <Text fontSize="11px" color={MUTED}>
                Party Name
              </Text>
            </Box>

            {/* DATE */}
            <Box
              flex="1"
              minW="150px"
              borderLeft={{ base: "none", md: `1px solid ${BORDER}` }}
              pl={{ base: 0, md: 6 }}
              textAlign={{ base: "left", md: "center" }}
            >
              <Icon as={LuCalendar} boxSize={7} color={RED} mb={2} />
              <Text fontSize="14px" fontWeight="600" color={DARK}>
                {formatDate(payment.payment_date)}
              </Text>
              <Text fontSize="11px" color={MUTED}>
                Payment Date
              </Text>
            </Box>

            {/* AMOUNT */}
            <Box
              flex="1"
              minW="150px"
              borderLeft={{ base: "none", md: `1px solid ${BORDER}` }}
              pl={{ base: 0, md: 6 }}
              textAlign={{ base: "left", md: "center" }}
            >
              <Icon as={LuIndianRupee} boxSize={7} color={RED} mb={2} />
              <Text fontSize="14px" fontWeight="700" color={DARK}>
                {formatAmount(payment.amount)}
              </Text>
              <Text fontSize="11px" color={MUTED}>
                Amount Paid
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* TABS */}
        <HStack
          gap={0}
          mb={4}
          borderBottom={`1px solid ${BORDER}`}
          overflowX="auto"
        >
          {[
            { key: "overview", label: "Overview" },
            { key: "activity", label: "Record Activity" },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <Box
                key={t.key}
                px={5}
                py={3}
                cursor="pointer"
                borderBottom={
                  active ? `2px solid ${RED}` : "2px solid transparent"
                }
                mb="-1px"
                onClick={() => setTab(t.key)}
                _hover={{ color: RED }}
              >
                <Text
                  fontSize="13px"
                  fontWeight={active ? "700" : "500"}
                  color={active ? RED : MUTED}
                >
                  {t.label}
                </Text>
              </Box>
            );
          })}
        </HStack>

        {/* TAB CONTENT */}
        {tab === "overview" && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            {/* PAYMENT INFORMATION */}
            <InfoCard icon={LuClipboardList} title="Payment Information">
              <Box borderTop="1px solid #F0F2F5" pt={2}>
                <InfoRow
                  label="Date"
                  value={formatDate(payment.payment_date)}
                />
                <InfoRow
                  label="Voucher Number"
                  value={payment.voucher_number}
                />
                <InfoRow
                  label="Ref Number"
                  value={payment.ref_no || "—"}
                />
                <InfoRow
                  label="Status"
                  value={
                    payment.status_label ||
                    (isCancelled ? "Cancelled" : "Paid")
                  }
                  valueColor={isCancelled ? RED : "#16804A"}
                />
              </Box>
            </InfoCard>

            {/* PARTY & LEDGER */}
            <InfoCard
              icon={LuUsers}
              title="Party & Ledger Information"
              rightSlot={
                <Box
                  position="absolute"
                  right={4}
                  bottom={3}
                  opacity={0.15}
                  pointerEvents="none"
                >
                  <Icon as={LuBookOpen} boxSize={16} color={RED} />
                </Box>
              }
            >
              <Box borderTop="1px solid #F0F2F5" pt={2}>
                <InfoRow
                  label="Party Name"
                  value={payment.party_name}
                />
                <InfoRow
                  label="Account Ledger"
                  value={payment.account_ledger_name || "—"}
                />
                <InfoRow
                  label="Amount"
                  value={formatAmount(payment.amount)}
                />
              </Box>
            </InfoCard>

            {/* BANK / TRANSACTION */}
            <InfoCard
              icon={LuBuilding2}
              title="Bank Transaction Information"
            >
              <Box borderTop="1px solid #F0F2F5" pt={2}>
                <InfoRow
                  label="Payment Type"
                  value={
                    payment.payment_type_label ||
                    payment.payment_type ||
                    "—"
                  }
                />
                <InfoRow
                  label="Transaction Type"
                  value={
                    payment.payment_mode_label ||
                    payment.payment_mode ||
                    "—"
                  }
                />
                <InfoRow
                  label="Bank Account"
                  value={payment.bank_account_display || "—"}
                />
              </Box>
            </InfoCard>

            {/* RECORD INFO */}
            <InfoCard icon={LuFileText} title="Record Information">
              <Box borderTop="1px solid #F0F2F5" pt={2}>
                <InfoRow
                  label="Narration"
                  value={payment.narration || "—"}
                />
                <InfoRow
                  label="Created"
                  value={formatDate(payment.created_at)}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(payment.updated_at)}
                />
                {isCancelled && (
                  <>
                    <InfoRow
                      label="Cancel Reason"
                      value={
                        payment.cancel_reason_label ||
                        payment.cancel_reason ||
                        "—"
                      }
                      valueColor={RED}
                    />
                    <InfoRow
                      label="Cancel Remarks"
                      value={payment.cancel_remarks || "—"}
                    />
                    <InfoRow
                      label="Cancelled At"
                      value={formatDateTime(payment.cancelled_at)}
                    />
                  </>
                )}
              </Box>
            </InfoCard>
          </SimpleGrid>
        )}

        {/* ACTIVITY TAB */}
        {tab === "activity" && (
          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="10px"
            bg="white"
            p={5}
          >
            <Text fontSize="15px" fontWeight="700" color={DARK} mb={4}>
              Record Activity
            </Text>

            <VStack align="stretch" spacing={3}>
              <HStack>
                <Box w="10px" h="10px" borderRadius="full" bg="#16804A" />
                <Text fontSize="12px" color={DARK} fontWeight="600">
                  Created
                </Text>
                <Text fontSize="12px" color={MUTED} ml="auto">
                  {formatDateTime(payment.created_at)}
                </Text>
              </HStack>

              <HStack>
                <Box w="10px" h="10px" borderRadius="full" bg="#2563EB" />
                <Text fontSize="12px" color={DARK} fontWeight="600">
                  Last Updated
                </Text>
                <Text fontSize="12px" color={MUTED} ml="auto">
                  {formatDateTime(payment.updated_at)}
                </Text>
              </HStack>

              {isCancelled && (
                <HStack>
                  <Box w="10px" h="10px" borderRadius="full" bg={RED} />
                  <Text fontSize="12px" color={DARK} fontWeight="600">
                    Cancelled
                  </Text>
                  <Text fontSize="12px" color={MUTED} ml="auto">
                    {formatDateTime(payment.cancelled_at)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>
        )}
      </Box>

      <Footer />

      {/* PRINT PREVIEW MODAL */}
      <PaymentPrintPreview
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        payment={payment}
        church={church}
      />
    </Box>
  );
};

export default PaymentDetailPage;