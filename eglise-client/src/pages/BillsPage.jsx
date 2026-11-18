import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Circle,
  Flex,
  Skeleton,
  Button,
  SimpleGrid,
  Link,
} from "@chakra-ui/react";
import {
  LuReceipt,
  LuRefreshCw,
  LuArrowLeft,
  LuFileText,
  LuTriangleAlert,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listChurchBills } from "../api/registryServices";

// Route of the church info page. Change this if your route is different.
const CHURCH_INFO_ROUTE = "/church-info";

const BRAND = "#ae2050";
const BRAND_SOFT = "#fdf2f6";
const BORDER = "#e8e4e6";

// Column layout shared by the header row and every bill row (desktop)
const ROW_COLUMNS = "1.4fr 1.3fr 1fr 1fr 1fr 0.9fr";

// =========================================================
// HELPERS
// =========================================================
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const BILL_TYPE_LABEL = {
  NEW: "Initial subscription",
  UPGRADE: "Package upgrade",
  EXTENSION: "Extension",
  RENEW: "Renewal",
};

const STATUS_STYLE = {
  PAID: { label: "Paid", color: "#15803d", bg: "#f0fdf4" },
  UNPAID: { label: "Unpaid", color: "#b45309", bg: "#fffbeb" },
  CANCELLED: { label: "Cancelled", color: "#b91c1c", bg: "#fef2f2" },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "UNPAID", label: "Unpaid" },
];

// =========================================================
// SMALL PIECES
// =========================================================
const StatusPill = ({ status }) => {
  const s = STATUS_STYLE[status] || {
    label: status || "Unknown",
    color: "#475569",
    bg: "#f1f5f9",
  };
  return (
    <HStack
      gap={1.5}
      display="inline-flex"
      bg={s.bg}
      color={s.color}
      px={2.5}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="600"
      w="fit-content"
    >
      <Box w="6px" h="6px" borderRadius="full" bg={s.color} />
      <Text>{s.label}</Text>
    </HStack>
  );
};

const Stat = ({ label, value, hint, accent }) => (
  <Box px={{ base: 4, md: 6 }} py={4}>
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
    <Text
      fontSize={{ base: "xl", md: "2xl" }}
      fontWeight="700"
      color={accent || "gray.800"}
      lineHeight="1.3"
      mt={0.5}
    >
      {value}
    </Text>
    {hint && (
      <Text fontSize="xs" color="gray.400" mt={0.5}>
        {hint}
      </Text>
    )}
  </Box>
);

// Label shown only on mobile, where the column header row is hidden
const MobileLabel = ({ children }) => (
  <Text fontSize="xs" color="gray.400" display={{ base: "block", md: "none" }}>
    {children}
  </Text>
);

// =========================================================
// MAIN PAGE
// =========================================================
const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  const loadBills = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await listChurchBills();
      const rows = res?.data?.results || res?.data?.data || [];
      setBills(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError(
        err?.response?.data?.detail || "Failed to load bills. Please try again."
      );
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  // ---------- Summary numbers ----------
  const summary = useMemo(() => {
    const live = bills.filter((b) => b.status !== "CANCELLED");
    const sum = (list) =>
      list.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
    const paid = live.filter((b) => b.status === "PAID");
    const unpaid = live.filter((b) => b.status === "UNPAID");
    return {
      totalBilled: sum(live),
      paidTotal: sum(paid),
      unpaidTotal: sum(unpaid),
      count: bills.length,
      unpaidCount: unpaid.length,
    };
  }, [bills]);

  const visibleBills = useMemo(
    () => (filter === "ALL" ? bills : bills.filter((b) => b.status === filter)),
    [bills, filter]
  );

  const countFor = (key) =>
    key === "ALL" ? bills.length : bills.filter((b) => b.status === key).length;

  return (
    <Box minH="100vh" bg="#fafafa" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" py={{ base: 5, md: 8 }}>
        <Container maxW="7xl">
          {/* ---------- HEADER ---------- */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
            mb={6}
          >
            <HStack gap={4} align="center">
              <Circle size="46px" bg="white" border={`1px solid ${BORDER}`} color={BRAND}>
                <Icon as={LuReceipt} boxSize={5} />
              </Circle>
              <Box>
                <Heading size="lg" color={BRAND} fontWeight="700">
                  Bills & payments
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Your subscription billing history and payment status
                </Text>
              </Box>
            </HStack>

            <HStack gap={3}>
              <Button
                variant="outline"
                color={BRAND}
                borderColor={BRAND}
                size="sm"
                onClick={() => navigate(CHURCH_INFO_ROUTE)}
              >
                <Icon as={LuArrowLeft} mr={2} />
                Back to church info
              </Button>
              <Button
                variant="ghost"
                color="gray.600"
                size="sm"
                onClick={loadBills}
                disabled={isLoading}
              >
                <Icon as={LuRefreshCw} mr={2} />
                Refresh
              </Button>
            </HStack>
          </Flex>

          {/* ---------- ERROR ---------- */}
          {error && (
            <Flex
              align="center"
              gap={3}
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              color="red.700"
              px={4}
              py={3}
              mb={6}
              borderRadius="lg"
              fontSize="sm"
            >
              <Icon as={LuTriangleAlert} boxSize={4} />
              <Text flex="1">{error}</Text>
              <Button size="xs" variant="outline" colorPalette="red" onClick={loadBills}>
                Try again
              </Button>
            </Flex>
          )}

          {/* ---------- SUMMARY STRIP ---------- */}
          {!error && (
            <Box
              bg="white"
              border={`1px solid ${BORDER}`}
              borderRadius="xl"
              mb={6}
              overflow="hidden"
            >
              {isLoading ? (
                <Skeleton height="96px" />
              ) : (
                <SimpleGrid
                  columns={{ base: 2, md: 4 }}
                  gap={0}
                  css={{
                    "& > *:not(:first-of-type)": {
                      borderLeft: `1px solid ${BORDER}`,
                    },
                    "@media (max-width: 47.99em)": {
                      "& > *:nth-of-type(3)": { borderLeft: "none" },
                      "& > *:nth-of-type(n+3)": {
                        borderTop: `1px solid ${BORDER}`,
                      },
                    },
                  }}
                >
                  <Stat
                    label="Total billed"
                    value={formatCurrency(summary.totalBilled)}
                    hint={`${summary.count} ${summary.count === 1 ? "bill" : "bills"}`}
                  />
                  <Stat
                    label="Paid"
                    value={formatCurrency(summary.paidTotal)}
                    accent="#15803d"
                  />
                  <Stat
                    label="Outstanding"
                    value={formatCurrency(summary.unpaidTotal)}
                    accent={summary.unpaidTotal > 0 ? "#b45309" : undefined}
                    hint={
                      summary.unpaidCount > 0
                        ? `${summary.unpaidCount} awaiting payment`
                        : "Nothing due"
                    }
                  />
                  <Stat
                    label="Latest bill"
                    value={bills[0] ? formatDate(bills[0].created_at) : "—"}
                    hint={bills[0]?.bill_number || undefined}
                  />
                </SimpleGrid>
              )}
            </Box>
          )}

          {/* ---------- FILTERS ---------- */}
          {!isLoading && bills.length > 0 && (
            <HStack gap={2} mb={4} wrap="wrap">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    borderRadius="full"
                    variant={active ? "solid" : "outline"}
                    bg={active ? BRAND : "white"}
                    color={active ? "white" : "gray.600"}
                    borderColor={active ? BRAND : BORDER}
                    _hover={{ bg: active ? BRAND : BRAND_SOFT }}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label} ({countFor(f.key)})
                  </Button>
                );
              })}
            </HStack>
          )}

          {/* ---------- CONTENT ---------- */}
          {isLoading ? (
            <VStack align="stretch" gap={3}>
              <Skeleton height="64px" borderRadius="lg" />
              <Skeleton height="64px" borderRadius="lg" />
              <Skeleton height="64px" borderRadius="lg" />
            </VStack>
          ) : bills.length === 0 && !error ? (
            <Box
              border={`1px dashed ${BORDER}`}
              borderRadius="xl"
              py={16}
              px={6}
              textAlign="center"
              bg="white"
            >
              <Circle size="60px" bg={BRAND_SOFT} color={BRAND} mx="auto" mb={4}>
                <Icon as={LuReceipt} boxSize={7} />
              </Circle>
              <Heading size="md" color="gray.800" mb={2}>
                No bills yet
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={6} maxW="360px" mx="auto">
                Bills appear here when you subscribe to a plan or upgrade your
                package.
              </Text>
              <Button
                bg={BRAND}
                color="white"
                size="sm"
                onClick={() => navigate("/upgrade")}
              >
                View subscription plans
              </Button>
            </Box>
          ) : visibleBills.length === 0 ? (
            <Box
              border={`1px dashed ${BORDER}`}
              borderRadius="xl"
              py={12}
              textAlign="center"
              bg="white"
            >
              <Text fontSize="sm" color="gray.500">
                No {filter.toLowerCase()} bills.
              </Text>
            </Box>
          ) : (
            <Box
              bg="white"
              border={`1px solid ${BORDER}`}
              borderRadius="xl"
              overflow="hidden"
            >
              {/* Column header (desktop only) */}
              <Box
                display={{ base: "none", md: "grid" }}
                gridTemplateColumns={ROW_COLUMNS}
                gap={4}
                px={6}
                py={3}
                bg="#faf7f8"
                borderBottom={`1px solid ${BORDER}`}
                fontSize="xs"
                fontWeight="600"
                color="gray.500"
              >
                <Text>Bill</Text>
                <Text>Plan</Text>
                <Text>Issued</Text>
                <Text>Paid on</Text>
                <Text textAlign="right">Amount</Text>
                <Text>Status</Text>
              </Box>

              {/* Rows */}
              {visibleBills.map((bill, idx) => {
                const breakdown = bill.breakdown || {};
                const packageName =
                  breakdown.package_name ||
                  breakdown.apply?.package_name ||
                  bill.package_name;
                const paidDate =
                  bill.paid_at ||
                  (bill.status === "PAID" ? bill.created_at : null);

                return (
                  <Box
                    key={bill.id}
                    display="grid"
                    gridTemplateColumns={{ base: "1fr 1fr", md: ROW_COLUMNS }}
                    gap={{ base: 3, md: 4 }}
                    alignItems="center"
                    px={{ base: 4, md: 6 }}
                    py={4}
                    borderTop={idx === 0 ? "none" : `1px solid ${BORDER}`}
                    transition="background 0.15s"
                    _hover={{ bg: "#fdfafb" }}
                  >
                    {/* Bill */}
                    <Box gridColumn={{ base: "1 / -1", md: "auto" }}>
                      <Text fontSize="sm" fontWeight="600" color="gray.800">
                        {bill.bill_number || `#${bill.id}`}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {BILL_TYPE_LABEL[bill.bill_type] || bill.bill_type}
                      </Text>
                    </Box>

                    {/* Plan */}
                    <Box>
                      <MobileLabel>Plan</MobileLabel>
                      {packageName ? (
                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                          {packageName}
                        </Text>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          —
                        </Text>
                      )}
                    </Box>

                    {/* Issued */}
                    <Box>
                      <MobileLabel>Issued</MobileLabel>
                      <Text fontSize="sm" color="gray.700">
                        {formatDate(bill.created_at)}
                      </Text>
                    </Box>

                    {/* Paid on */}
                    <Box>
                      <MobileLabel>Paid on</MobileLabel>
                      <Text fontSize="sm" color="gray.700">
                        {paidDate ? formatDate(paidDate) : "—"}
                      </Text>
                    </Box>

                    {/* Amount */}
                    <Box textAlign={{ base: "left", md: "right" }}>
                      <MobileLabel>Amount</MobileLabel>
                      <Text fontSize="sm" fontWeight="700" color="gray.900">
                        {formatCurrency(bill.amount)}
                      </Text>
                      {bill.payment_receipt && (
                        <Link
                          href={bill.payment_receipt}
                          target="_blank"
                          rel="noreferrer"
                          fontSize="xs"
                          color={BRAND}
                          display="inline-flex"
                          alignItems="center"
                          gap={1}
                          mt={0.5}
                        >
                          <Icon as={LuFileText} boxSize={3} />
                          Receipt
                        </Link>
                      )}
                    </Box>

                    {/* Status */}
                    <Box>
                      <StatusPill status={bill.status} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default BillsPage;