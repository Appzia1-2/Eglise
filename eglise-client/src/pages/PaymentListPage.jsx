import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuWallet,
  LuSearch,
  LuPlus,
  LuEye,
  LuCircleX,
  LuBuilding2,
  LuTag,
  LuCalendarDays,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CancelPaymentModal from "../components/CancelPaymentModal";

import { listPayments, cancelPayment } from "../api/registryServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

const PAYMENT_TYPE_FILTERS = [
  { value: "ALL", label: "All Payment Types" },
  { value: "BANK", label: "Bank" },
  { value: "CASH", label: "Cash" },
];

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

// =========================================================
// STAT ITEM
// =========================================================
const StatItem = ({ value, label }) => (
  <Box textAlign="center" minW="100px">
    <Text fontSize="20px" fontWeight="700" color={PRIMARY_RED} lineHeight="1">
      {value}
    </Text>
    <Text mt={1.5} fontSize="10px" color={BLUE} whiteSpace="nowrap">
      {label}
    </Text>
  </Box>
);

const DetailLine = ({ icon, text }) => (
  <Flex align="center" gap={2} mb={1.5}>
    <Box color={TEXT_COLOR}>{icon}</Box>
    <Text fontSize="11px" color={TEXT_COLOR} lineClamp={1}>
      {text}
    </Text>
  </Flex>
);

const IconButton = ({ title, onClick, icon }) => (
  <Button
    variant="ghost"
    size="sm"
    h="28px"
    minW="28px"
    p={0}
    color={PRIMARY_RED}
    borderRadius="4px"
    onClick={onClick}
    title={title}
    _hover={{ bg: "#FFF5F7" }}
  >
    {icon}
  </Button>
);

// =========================================================
// PAYMENT CARD
// =========================================================
const PaymentCard = ({ payment, onView, onCancel }) => {
  const cancelled = payment.is_cancelled;

  return (
    <Box
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="10px"
      bg="white"
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: "0 4px 12px rgba(24,35,56,0.08)",
        borderColor: "#B8C2D2",
        transform: "translateY(-2px)",
      }}
    >
      {/* HEADER */}
      <Flex px={4} pt={4} pb={2} justify="space-between" align="flex-start" gap={2}>
        <Box minW={0} flex="1">
          <Text
            color={TEXT_COLOR}
            fontSize="14px"
            fontWeight="600"
            lineHeight="1.3"
            lineClamp={1}
          >
            {payment.party_name}
          </Text>
          <Text color={BLUE} fontSize="11px" mt={0.5} lineClamp={1}>
            {payment.voucher_number}
          </Text>
        </Box>

        <Box
          flexShrink={0}
          bg={cancelled ? "#FEE9EC" : "#EAF7EC"}
          color={cancelled ? "#B31D27" : "#238B2D"}
          px={2.5}
          py="3px"
          borderRadius="4px"
        >
          <Text fontSize="10px" fontWeight="600" whiteSpace="nowrap">
            {cancelled ? "Cancelled" : "Paid"}
          </Text>
        </Box>
      </Flex>

      {/* DETAILS */}
      <Box px={4} py={2}>
        <DetailLine
          icon={<LuCalendarDays size={13} color={TEXT_COLOR} />}
          text={formatDate(payment.payment_date)}
        />
        <DetailLine
          icon={<LuBuilding2 size={13} color={TEXT_COLOR} />}
          text={[payment.payment_type_label, payment.payment_mode_label]
            .filter(Boolean)
            .join(" • ")}
        />
        <DetailLine
          icon={<LuTag size={13} color={TEXT_COLOR} />}
          text={payment.account_ledger_name || "—"}
        />
      </Box>

      {/* FOOTER */}
      <Flex
        px={4}
        py={3}
        mt={1}
        justify="space-between"
        align="center"
        borderTop={`1px solid ${BORDER_COLOR}`}
      >
        <Text
          fontSize="14px"
          color={cancelled ? SECONDARY_TEXT : PRIMARY_RED}
          fontWeight="700"
          textDecoration={cancelled ? "line-through" : "none"}
        >
          ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
        </Text>

        <HStack gap={1}>
          <IconButton
            title="View / Edit"
            onClick={onView}
            icon={<LuEye size={15} />}
          />
          {!cancelled && (
            <IconButton
              title="Cancel Payment"
              onClick={onCancel}
              icon={<LuCircleX size={15} />}
            />
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

// =========================================================
// PAGE
// =========================================================
const PaymentListPage = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);

  // ---------------------------------------------------------
  // LOAD
  // ---------------------------------------------------------
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listPayments();
      const data = res?.data?.results ?? res?.data ?? [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // ---------------------------------------------------------
  // FILTER
  // ---------------------------------------------------------
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (typeFilter !== "ALL" && p.payment_type !== typeFilter) return false;
      if (!kw) return true;
      return (
        String(p.voucher_number || "").toLowerCase().includes(kw) ||
        String(p.party_name || "").toLowerCase().includes(kw)
      );
    });
  }, [payments, search, typeFilter]);

  // ---------------------------------------------------------
  // STATS
  // ---------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    let paid = 0;
    let cancelled = 0;
    let thisMonth = 0;

    payments.forEach((p) => {
      const amount = Number(p.amount || 0);
      if (p.is_cancelled) cancelled += amount;
      else paid += amount;

      if (p.payment_date) {
        const d = new Date(p.payment_date);
        if (
          !Number.isNaN(d.getTime()) &&
          d.getFullYear() === y &&
          d.getMonth() === m &&
          !p.is_cancelled
        ) {
          thisMonth += amount;
        }
      }
    });

    return { paid, cancelled, thisMonth, total: payments.length };
  }, [payments]);

  // ---------------------------------------------------------
  // CANCEL HANDLERS
  // ---------------------------------------------------------
  const openCancel = (payment) => {
    setCancelTarget(payment);
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (cancelSaving) return;
    setCancelOpen(false);
    setCancelTarget(null);
  };

  const confirmCancel = async (payload) => {
    if (!cancelTarget) return;
    try {
      setCancelSaving(true);
      await cancelPayment(cancelTarget.id, payload);
      setCancelOpen(false);
      setCancelTarget(null);
      await loadPayments();
    } catch (err) {
      console.error("Cancel error:", err);
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Unable to cancel payment."
      );
    } finally {
      setCancelSaving(false);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 4, md: 5 }} py={4} flex="1">
        {/* BREADCRUMB */}
        <HStack gap={2} mb={2} color={SECONDARY_TEXT} fontSize="12px">
          <Text>Activities</Text>
          <Text>/</Text>
          <Text>Payments</Text>
        </HStack>

        {/* HEADER */}
        <Box mb={4}>
          <Text
            fontSize="11px"
            fontWeight="700"
            color={PRIMARY_RED}
            letterSpacing="0.4px"
            mb={0.5}
          >
            PAYMENT MANAGEMENT
          </Text>
          <Heading color={TEXT_COLOR} fontSize={{ base: "22px", md: "26px" }} mb={1}>
            Payments
          </Heading>
          <Text color={SECONDARY_TEXT} fontSize="12px">
            Record and manage parish payments.
          </Text>
        </Box>

        {/* DIRECTORY CARD */}
        <Box
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="10px"
          px={{ base: 4, md: 5 }}
          py={4}
          mb={5}
        >
          <Flex
            align={{ base: "stretch", lg: "center" }}
            gap={4}
            direction={{ base: "column", lg: "row" }}
          >
            {/* ICON + TITLE */}
            <Flex align="center" width={{ base: "100%", lg: "280px" }} flexShrink={0}>
              <Box
                width="58px"
                height="58px"
                borderRadius="full"
                bg="#FFF5F7"
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexShrink={0}
              >
                <LuWallet size={28} color={PRIMARY_RED} strokeWidth={1.6} />
              </Box>
              <Box pl={3}>
                <Text color={TEXT_COLOR} fontSize="16px" fontWeight="600" lineHeight="1.2">
                  Payment Directory
                </Text>
              </Box>
            </Flex>

            <Box
              display={{ base: "none", lg: "block" }}
              width="1px"
              height="58px"
              bg={BORDER_COLOR}
            />

            {/* STATS */}
            <Flex
              flex="1"
              width="100%"
              justify="space-around"
              align="center"
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <StatItem value={`₹${stats.paid.toLocaleString("en-IN")}`} label="Total Paid" />
              <Box display={{ base: "none", md: "block" }} width="1px" height="44px" bg={BORDER_COLOR} />
              <StatItem value={`₹${stats.cancelled.toLocaleString("en-IN")}`} label="Total Cancelled" />
              <Box display={{ base: "none", md: "block" }} width="1px" height="44px" bg={BORDER_COLOR} />
              <StatItem value={`₹${stats.thisMonth.toLocaleString("en-IN")}`} label="This Month" />
              <Box display={{ base: "none", md: "block" }} width="1px" height="44px" bg={BORDER_COLOR} />
              <StatItem value={stats.total} label="Total Records" />
            </Flex>

            {/* SEARCH */}
            <Box position="relative" width={{ base: "100%", lg: "260px" }} flexShrink={0}>
              <Box
                position="absolute"
                left="13px"
                top="50%"
                transform="translateY(-50%)"
                color={SECONDARY_TEXT}
                zIndex={1}
              >
                <LuSearch size={16} />
              </Box>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vouchers or parties"
                pl="40px"
                h="38px"
                fontSize="13px"
                borderColor={BORDER_COLOR}
                borderRadius="6px"
                color={TEXT_COLOR}
                _placeholder={{ color: "#8B98AB" }}
                _focus={{
                  borderColor: PRIMARY_RED,
                  boxShadow: `0 0 0 1px ${PRIMARY_RED}`,
                }}
              />
            </Box>
          </Flex>
        </Box>

        {/* RECORDS HEADER */}
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          mb={4}
        >
          <HStack gap={3}>
            <Heading color={TEXT_COLOR} fontSize="20px" fontWeight="600">
              Payment Records
            </Heading>
            <Box bg="#F1F3F6" px={2.5} py={1} borderRadius="5px">
              <Text fontSize="10px" fontWeight="600" color={SECONDARY_TEXT}>
                {filtered.length} Records
              </Text>
            </Box>
          </HStack>

          <HStack gap={2} flexWrap="wrap">
            <Box position="relative">
              <Box
                as="select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                h="38px"
                minW="180px"
                fontSize="12px"
                color={TEXT_COLOR}
                border="1px solid #5277C7"
                borderRadius="6px"
                bg="white"
                pl="12px"
                pr="32px"
                appearance="none"
                outline="none"
                cursor="pointer"
              >
                {PAYMENT_TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Box>
              <Box
                position="absolute"
                right="10px"
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
                color={BLUE}
                fontSize="10px"
              >
                ▼
              </Box>
            </Box>

            {/* v3: leftIcon removed — icon is a child */}
            <Button
              bg={PRIMARY_RED}
              color="white"
              h="38px"
              px={5}
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/payments/add")}
              _hover={{ bg: DARK_RED }}
            >
              <LuPlus size={15} />
              Add Payment
            </Button>
          </HStack>
        </Flex>

        {/* ERROR */}
        {error && (
          <Box mb={4} p={3} borderRadius="6px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="12px">
              {error}
            </Text>
          </Box>
        )}

        {/* LOADING */}
        {loading && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={10} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="12px">
              Loading payments...
            </Text>
          </Box>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="10px" py={14} textAlign="center">
            <LuWallet size={40} color="#C8CFD9" style={{ margin: "0 auto 12px" }} />
            <Text color={TEXT_COLOR} fontSize="15px" fontWeight="600">
              No payments found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="12px" mt={1}>
              Try changing your filters or add a new payment.
            </Text>
            <Button
              mt={4}
              bg={PRIMARY_RED}
              color="white"
              fontSize="12px"
              h="36px"
              onClick={() => navigate("/payments/add")}
              _hover={{ bg: DARK_RED }}
            >
              <LuPlus size={15} />
              Add Payment
            </Button>
          </Box>
        )}

        {/* CARD GRID */}
        {!loading && filtered.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={4}>
            {filtered.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                onView={() => navigate(`/payments/${p.id}`)}
                onCancel={() => openCancel(p)}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>

      <Footer />

      <CancelPaymentModal
        isOpen={cancelOpen}
        onClose={closeCancel}
        payment={cancelTarget}
        onConfirm={confirmCancel}
        saving={cancelSaving}
      />
    </Box>
  );
};

export default PaymentListPage;