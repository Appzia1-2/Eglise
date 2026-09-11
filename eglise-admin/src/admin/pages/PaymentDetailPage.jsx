// src/admin/pages/PaymentDetailPage.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  Grid,
  GridItem,
  Icon,
  Circle,
  Badge,
  Image,
} from "@chakra-ui/react";

import {
  LuDownload,
  LuChevronDown,
  LuFileSearch,
  LuChurch,
  LuCalculator,
  LuImage,
  LuHistory,
  LuClipboardList,
  LuEye,
  LuCheck,
  LuPencil,
  LuMail,
  LuTrash2,
  LuReceipt,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";
const deepMaroon = "#7d1538";

/* =========================================================
   HELPERS
========================================================= */

const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};

const statusColors = {
  PAID: { bg: "green.50", color: "green.600", dot: "#38a169" },
  UNPAID: { bg: "red.50", color: "red.600", dot: "#e53e3e" },
  CANCELLED: { bg: "gray.100", color: "gray.600", dot: "#a0aec0" },
};

/* =========================================================
   REUSABLE PIECES
========================================================= */

const InfoRow = ({
  label,
  value,
  valueColor = "#1a1a2e",
  bold,
  extra,
}) => (
  <Flex justify="space-between" align="center" py={1.5}>
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
    <HStack spacing={2}>
      {extra}
      <Text
        fontSize="sm"
        fontWeight={bold ? "700" : "600"}
        color={valueColor}
      >
        {value}
      </Text>
    </HStack>
  </Flex>
);

const SectionCard = ({ icon, title, children }) => (
  <Box
    bg="white"
    borderRadius="xl"
    border="1px solid"
    borderColor="gray.200"
    p={5}
    boxShadow="sm"
  >
    <HStack spacing={3} mb={3}>
      <Circle
        size="36px"
        bg="rgba(174,32,80,0.08)"
        color={primaryMaroon}
      >
        <Icon as={icon} boxSize={4} />
      </Circle>
      <Heading fontSize="md" fontWeight="700" color="#1a1a2e">
        {title}
      </Heading>
    </HStack>
    {children}
  </Box>
);

/* =========================================================
   MORE ACTIONS DROPDOWN
========================================================= */

const MoreActionsMenu = ({
  onEdit,
  onResendReceipt,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    { label: "Edit Payment", icon: LuPencil, onClick: onEdit },
    {
      label: "Resend Receipt Email",
      icon: LuMail,
      onClick: onResendReceipt,
    },
    {
      label: "Delete Payment",
      icon: LuTrash2,
      onClick: onDelete,
      danger: true,
    },
  ];

  return (
    <Box ref={containerRef} position="relative">
      <Button
        variant="outline"
        borderColor="gray.200"
        color={primaryMaroon}
        bg="white"
        _hover={{ bg: "gray.50" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        More Actions
        <Icon
          as={LuChevronDown}
          boxSize={4}
          ml={2}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          right="0"
          top="calc(100% + 6px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          minW="220px"
          overflow="hidden"
        >
          {actions.map((action) => (
            <Flex
              key={action.label}
              align="center"
              gap={2}
              px={3}
              py={2.5}
              cursor="pointer"
              _hover={{
                bg: action.danger ? "red.50" : "gray.50",
              }}
              onClick={() => {
                setIsOpen(false);
                action.onClick?.();
              }}
            >
              <Icon
                as={action.icon}
                boxSize={4}
                color={action.danger ? "red.500" : "gray.500"}
              />
              <Text
                fontSize="sm"
                fontWeight="500"
                color={action.danger ? "red.500" : "gray.700"}
              >
                {action.label}
              </Text>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const PaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [bill, setBill] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBill = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBillDetail(id);
      setBill(res.data || null);
    } catch (error) {
      console.error("Error fetching payment:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load payment details.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     DERIVED FIELDS
  ========================================================= */

  const receiptNumber = pick(
    bill,
    ["bill_number", "receipt_number", "receipt_code"],
    `#${id}`
  );
  const status = pick(bill, ["status", "payment_status"], "PAID");
  const statusStyle = statusColors[status] || statusColors.PAID;

  const totalPaid = Number(pick(bill, ["total_amount"], 0));
  const amountPaid = totalPaid || Number(pick(bill, ["amount"], 0));

  const paymentDate = pick(bill, ["paid_at", "created_at"], null);
  const paymentMethod = pick(
    bill,
    ["payment_method_display", "payment_method"],
    "—"
  );
  const transactionRef = pick(
    bill,
    ["transaction_id", "reference_number"],
    "—"
  );
  const currency = pick(bill, ["currency"], "INR (₹)");

  // ---------- Church ----------
  const churchName = pick(bill, ["church_name", "church.name"]);
  const churchCode = pick(bill, ["church_code", "church.code"]);

  // ---------- Subscription / Package ----------
  const subscriptionCode = pick(bill, ["subscription_code"]);
  const packageName = pick(bill, [
    "package_name",
    "subscription.package_name",
  ]);
  const packageCode = pick(bill, ["package_code"], "");

  // ---------- Billing cycle ----------
  const billingCycleRaw = pick(bill, ["billing_cycle"], "");
  const billingCycleDisplay = pick(
    bill,
    ["billing_cycle_display"],
    billingCycleRaw === "YEARLY"
      ? "Yearly"
      : billingCycleRaw === "MONTHLY"
      ? "Monthly"
      : billingCycleRaw
  );

  // ---------- Billing period ----------
  const billingStart = pick(bill, ["billing_start"], null);
  const billingEnd = pick(bill, ["billing_end"], null);
  const billingPeriod =
    billingStart && billingStart !== "—"
      ? `${formatDate(billingStart)} – ${formatDate(billingEnd)}`
      : "—";

  // ---------- Capacity & rate ----------
  const memberLimit = pick(bill, ["member_limit", "capacity"], 0);
  const rateUsed = pick(bill, ["rate_used"], 0);
  const rateYearly = pick(bill, ["rate_per_member_yearly"], 0);
  const rateMonthly = pick(bill, ["rate_per_member_monthly"], 0);

  // The effective rate applied to this bill is rate_used (snapshot).
  // Fallback to live package rate based on cycle if rate_used is 0.
  const effectiveRate =
    Number(rateUsed) ||
    (billingCycleRaw === "YEARLY"
      ? Number(rateYearly)
      : Number(rateMonthly));

  const rateLabel =
    billingCycleRaw === "YEARLY"
      ? "Rate per Member (Yearly)"
      : billingCycleRaw === "MONTHLY"
      ? "Rate per Member (Monthly)"
      : "Rate per Member";

  // ---------- Amounts ----------
  const taxableAmount = Number(
    pick(bill, ["taxable_amount", "amount"], amountPaid)
  );
  const taxAmount = Number(pick(bill, ["tax_amount"], 0));

  // ---------- Tax ----------
  const taxTypeName = pick(
    bill,
    ["tax_type.tax_type_name"],
    "No Tax"
  );
  const taxTypeCode = pick(bill, ["tax_type.tax_type_code"], "");
  const taxRatePercentage = pick(
    bill,
    ["tax_percentage", "tax_rate.rate_percentage"],
    0
  );

  // ---------- Screenshot ----------
  const receiptImageUrl = pick(
    bill,
    ["payment_receipt_url", "payment_receipt"],
    ""
  );
  const hasReceipt = Boolean(
    pick(bill, ["has_payment_receipt"], false)
  );
  const receiptFileName = pick(
    bill,
    ["payment_receipt_name"],
    "payment-proof"
  );
  const receiptFileSize = pick(bill, ["payment_receipt_size"], "");

  // ---------- Notes ----------
  const notes = pick(bill, ["note", "notes"], "");

  // ---------- Timestamps ----------
  const recordedOn = pick(bill, ["created_at"], null);
  const paidAt = pick(bill, ["paid_at"], null);

  // ---------- Activity timeline ----------
  const activityTimeline = [
    { label: "Payment recorded", time: recordedOn },
    {
      label: "Payment verified & receipt generated",
      time: paidAt,
    },
  ].filter((step) => step.time && step.time !== "—");

  /* =========================================================
     ACTIONS
  ========================================================= */

  // Preview Invoice — navigate to the Tally-style HTML preview page
  const handlePreviewInvoice = () => {
    navigate(`/admin/payments/${id}/invoice`);
  };

  // Download Receipt — fetch the server-generated PDF directly
  const handleDownloadReceipt = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await adminApi.downloadInvoicePdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toaster.create({
        title: "Error",
        description: "Failed to download receipt.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => navigate(`/admin/payments/${id}/edit`);

  const handleResendReceipt = async () => {
    try {
      await adminApi.resendBillReceipt(id);
      toaster.create({
        title: "Sent",
        description: "Receipt email has been resent.",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error resending receipt:", error);
      toaster.create({
        title: "Error",
        description: "Failed to resend receipt email.",
        type: "error",
        duration: 4000,
      });
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this payment?"
      )
    )
      return;
    try {
      await adminApi.deleteBill(id);
      toaster.create({
        title: "Deleted",
        description: "Payment has been deleted.",
        type: "success",
        duration: 3000,
      });
      navigate("/admin/payments");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toaster.create({
        title: "Error",
        description: "Failed to delete payment.",
        type: "error",
        duration: 4000,
      });
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <Box
              width="40px"
              height="40px"
              border="4px solid"
              borderColor="gray.200"
              borderTopColor={primaryMaroon}
              borderRadius="50%"
              animation="spin 1s linear infinite"
            />
          </Flex>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Container>
      </AdminLayout>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        <Text fontSize="xs" color="gray.400" fontWeight="600" mb={2}>
          Payments / {receiptNumber}
        </Text>

        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          mb={4}
        >
          <VStack align="start" spacing={1}>
            <Text
              fontSize="xs"
              fontWeight="700"
              color={primaryMaroon}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Payment Profile
            </Text>
            <Heading
              fontSize="2xl"
              fontWeight="800"
              color="#1a1a2e"
            >
              Payment Details
            </Heading>
            <Text color="gray.500" fontSize="sm">
              View payment, subscription and verification
              information.
            </Text>
          </VStack>

          <HStack spacing={3}>
            {/* Preview button */}
            <Button
              variant="outline"
              borderColor={primaryMaroon}
              color={primaryMaroon}
              bg="white"
              _hover={{ bg: "rgba(174,32,80,0.05)" }}
              onClick={handlePreviewInvoice}
            >
              <Icon as={LuFileSearch} boxSize={4} mr={2} />
              Preview Invoice
            </Button>

            {/* Download button */}
            <Button
              bg={primaryMaroon}
              color="white"
              _hover={{ bg: "#8a1a3e" }}
              onClick={handleDownloadReceipt}
              isLoading={isDownloading}
              loadingText="Downloading"
            >
              <Icon as={LuDownload} boxSize={4} mr={2} />
              Download Receipt
            </Button>

            <MoreActionsMenu
              onEdit={handleEdit}
              onResendReceipt={handleResendReceipt}
              onDelete={handleDelete}
            />
          </HStack>
        </Flex>

        {/* =====================================================
            HERO CARD
        ===================================================== */}
        <Box
          bg="rgba(174,32,80,0.05)"
          border="1px solid"
          borderColor="rgba(174,32,80,0.15)"
          borderRadius="xl"
          p={5}
          mb={5}
        >
          <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={4}
          >
            <HStack spacing={4}>
              <Circle
                size="56px"
                bg="rgba(174,32,80,0.1)"
                color={primaryMaroon}
              >
                <Icon as={LuReceipt} boxSize={6} />
              </Circle>

              <Box>
                <Heading
                  fontSize="2xl"
                  fontWeight="800"
                  color="#1a1a2e"
                >
                  {receiptNumber}
                </Heading>

                <HStack spacing={2} mt={1}>
                  <Badge
                    bg="gray.100"
                    color="gray.600"
                    fontSize="11px"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    Manual Payment
                  </Badge>
                  <Badge
                    bg={statusStyle.bg}
                    color={statusStyle.color}
                    fontSize="11px"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {status.charAt(0) +
                      status.slice(1).toLowerCase()}
                  </Badge>
                </HStack>
              </Box>
            </HStack>

            <Box textAlign="right">
              <Text
                fontSize="3xl"
                fontWeight="800"
                color={primaryMaroon}
              >
                {formatCurrency(amountPaid)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Amount Paid
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* =====================================================
            THREE INFO CARDS
        ===================================================== */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }}
          gap={5}
          mb={5}
          alignItems="start"
        >
          <SectionCard
            icon={LuFileSearch}
            title="Payment Information"
          >
            <VStack
              spacing={0}
              align="stretch"
              divider={
                <Box
                  borderBottom="1px solid"
                  borderColor="gray.100"
                />
              }
            >
              <InfoRow
                label="Payment Date"
                value={formatDate(paymentDate)}
              />
              <InfoRow
                label="Payment Method"
                value={paymentMethod}
              />
              <InfoRow
                label="Transaction / Reference"
                value={transactionRef}
              />
              <InfoRow
                label="Payment Status"
                value={
                  status.charAt(0) +
                  status.slice(1).toLowerCase()
                }
                extra={
                  <Circle size="8px" bg={statusStyle.dot} />
                }
              />
              <InfoRow label="Currency" value={currency} />
            </VStack>
          </SectionCard>

          <SectionCard
            icon={LuChurch}
            title="Church & Subscription"
          >
            <VStack
              spacing={0}
              align="stretch"
              divider={
                <Box
                  borderBottom="1px solid"
                  borderColor="gray.100"
                />
              }
            >
              <InfoRow label="Church" value={churchName} />
              <InfoRow label="Church Code" value={churchCode} />
              <InfoRow
                label="Subscription"
                value={subscriptionCode}
              />
              <InfoRow
                label="Package"
                value={
                  packageCode
                    ? `${packageName} (${packageCode})`
                    : packageName
                }
              />
              <InfoRow
                label="Billing Cycle"
                value={billingCycleDisplay}
              />
              <InfoRow
                label="Billing Period"
                value={billingPeriod}
              />
            </VStack>
          </SectionCard>

          <SectionCard
            icon={LuCalculator}
            title="Tax & Payment Summary"
          >
            <VStack
              spacing={0}
              align="stretch"
              divider={
                <Box
                  borderBottom="1px solid"
                  borderColor="gray.100"
                />
              }
            >
              <InfoRow
                label="Member Limit"
                value={Number(memberLimit).toLocaleString(
                  "en-IN"
                )}
              />
              <InfoRow
                label={rateLabel}
                value={formatCurrency(effectiveRate)}
              />
              <InfoRow
                label="Taxable Amount"
                value={formatCurrency(taxableAmount)}
              />
              <InfoRow label="Tax Type" value={taxTypeName} />
              <InfoRow
                label="Tax Rate"
                value={
                  Number(taxRatePercentage) > 0
                    ? `${taxTypeCode || "Tax"} @ ${taxRatePercentage}%`
                    : "No tax applied"
                }
              />
              <InfoRow
                label="Tax Amount"
                value={formatCurrency(taxAmount)}
              />
              <InfoRow
                label="Total Paid"
                value={formatCurrency(totalPaid)}
                valueColor={primaryMaroon}
                bold
              />
            </VStack>
          </SectionCard>
        </Grid>

        {/* =====================================================
            SCREENSHOT + ACTIVITY
        ===================================================== */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={5}
          mb={5}
          alignItems="start"
        >
          {/* PAYMENT SCREENSHOT */}
          <SectionCard
            icon={LuImage}
            title="Payment Screenshot"
          >
            {hasReceipt && receiptImageUrl ? (
              <Flex gap={4} align="start" wrap="wrap">
                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  overflow="hidden"
                  bg="gray.50"
                  flexShrink={0}
                  w={{ base: "100%", sm: "220px" }}
                >
                  <Image
                    src={receiptImageUrl}
                    alt="Payment screenshot"
                    w="100%"
                    objectFit="cover"
                  />
                </Box>

                <VStack
                  align="start"
                  spacing={2}
                  flex="1"
                  minW="140px"
                >
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#1a1a2e"
                    noOfLines={1}
                  >
                    {receiptFileName}
                  </Text>
                  {receiptFileSize && (
                    <Text fontSize="xs" color="gray.500">
                      {receiptFileSize}
                    </Text>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    color={primaryMaroon}
                    onClick={() =>
                      window.open(receiptImageUrl, "_blank")
                    }
                  >
                    <Icon as={LuEye} boxSize={4} mr={2} />
                    View Full Size
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    color="gray.600"
                    onClick={() =>
                      window.open(receiptImageUrl, "_blank")
                    }
                    aria-label="Download screenshot"
                  >
                    <Icon as={LuDownload} boxSize={4} />
                  </Button>
                </VStack>
              </Flex>
            ) : (
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.500">
                  No payment screenshot was uploaded for this
                  payment.
                </Text>
                <Badge
                  bg="orange.50"
                  color="orange.600"
                  fontSize="11px"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  Screenshot Missing
                </Badge>
              </VStack>
            )}
          </SectionCard>

          {/* ACTIVITY */}
          <SectionCard icon={LuHistory} title="Activity">
            <VStack
              align="stretch"
              spacing={0}
              position="relative"
              pl={2}
            >
              {activityTimeline.length === 0 ? (
                <Text fontSize="sm" color="gray.400">
                  No activity recorded yet.
                </Text>
              ) : (
                activityTimeline.map((step, idx) => (
                  <Flex
                    key={step.label}
                    gap={3}
                    position="relative"
                    pb={
                      idx === activityTimeline.length - 1
                        ? 0
                        : 5
                    }
                  >
                    {idx !== activityTimeline.length - 1 && (
                      <Box
                        position="absolute"
                        left="9px"
                        top="20px"
                        bottom="-6px"
                        width="2px"
                        bg="gray.200"
                      />
                    )}

                    <Circle
                      size="20px"
                      bg={primaryMaroon}
                      color="white"
                      flexShrink={0}
                      zIndex={1}
                    >
                      <Icon as={LuCheck} boxSize={3} />
                    </Circle>

                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="#1a1a2e"
                      >
                        {step.label}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDateTime(step.time)}
                      </Text>
                    </Box>
                  </Flex>
                ))
              )}
            </VStack>
          </SectionCard>
        </Grid>

        {/* =====================================================
            NOTES
        ===================================================== */}
        <Box
          bg="rgba(174,32,80,0.03)"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
        >
          <Flex align="center" gap={3}>
            <Circle
              size="32px"
              bg="rgba(174,32,80,0.08)"
              color={primaryMaroon}
              flexShrink={0}
            >
              <Icon as={LuClipboardList} boxSize={4} />
            </Circle>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="#1a1a2e"
              mr={2}
            >
              Notes
            </Text>
            <Text fontSize="sm" color="gray.600">
              {notes || "No notes were added for this payment."}
            </Text>
          </Flex>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default PaymentDetailPage;