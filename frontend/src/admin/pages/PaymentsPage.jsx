// src/admin/pages/PaymentsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  IconButton,
  Flex,
  Circle,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuEye,
  LuPencil,
  LuTrash2,
  LuReceipt,
  LuReceiptText,
  LuIndianRupee,
  LuClock,
  LuCheck,
  LuImage,
  LuChurch,
  LuHouse,
  LuChevronRight,
  LuChevronLeft,
  LuFilter,
  LuCalendar,
  LuEllipsisVertical,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// ---- display helpers -------------------------------------------------------

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatCycle = (c) =>
  c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : "";

const fullINR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// Compact Indian currency: 9062000 -> ₹90.62L, 13500000 -> ₹1.35Cr
const compactINR = (v) => {
  const n = Number(v) || 0;
  const strip = (x) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e7) return `₹${strip(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${strip(n / 1e5)}L`;
  if (n >= 1e3) return `₹${strip(n / 1e3)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const methodLabel = (m) => {
  if (!m) return "—";
  const map = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    CHEQUE: "Cheque",
    BANK_TRANSFER: "Bank Transfer",
    BANK: "Bank Transfer",
    NETBANKING: "Net Banking",
    ONLINE: "Online",
  };
  return map[m.toUpperCase()] || m;
};

const normalizeStatus = (s) => {
  const v = (s || "").toUpperCase();
  if (v === "PAID") return "paid";
  if (v === "CANCELLED" || v === "CANCELED") return "cancelled";
  return "pending"; // UNPAID / PENDING / PENDING_VERIFICATION / etc.
};

const statusStyles = {
  paid: { dot: "#38a169", bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Paid" },
  pending: {
    dot: "#dd6b20",
    bg: "rgba(237,137,54,0.12)",
    color: "#c05621",
    label: "Pending Verification",
  },
  cancelled: { dot: "#e53e3e", bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Cancelled" },
};

const receiptNo = (item) =>
  item.bill_number ||
  item.invoice_number ||
  `RCP-${new Date(item.created_at || Date.now()).getFullYear()}-${String(item.id).padStart(4, "0")}`;

const proofUrlOf = (item) =>
  item.payment_proof ||
  item.proof ||
  item.screenshot ||
  item.screenshot_url ||
  item.receipt_image ||
  null;

// Kebab actions menu - fixed positioning with scroll prevention
const RowActionsMenu = ({ onDelete, onView, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState("bottom");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 120) {
        setPosition("top");
      } else {
        setPosition("bottom");
      }
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      checkPosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      checkPosition();
    }
  }, [isOpen]);

  return (
    <Box position="relative" ref={menuRef} display="inline-block">
      <IconButton
        ref={buttonRef}
        size="xs"
        variant="ghost"
        aria-label="More actions"
        onClick={handleToggle}
        color="gray.700"
        _hover={{ bg: "gray.100" }}
        minW="24px"
        h="24px"
        p={0}
      >
        <LuEllipsisVertical size={14} color="#1a202c" />
      </IconButton>
      {isOpen && (
        <Box
          position="fixed"
          right={
            buttonRef.current
              ? Math.min(
                  window.innerWidth - buttonRef.current.getBoundingClientRect().right + 10,
                  window.innerWidth - 10
                )
              : "auto"
          }
          {...(position === "top"
            ? {
                bottom: buttonRef.current
                  ? window.innerHeight - buttonRef.current.getBoundingClientRect().top + 4
                  : "auto",
              }
            : {
                top: buttonRef.current
                  ? buttonRef.current.getBoundingClientRect().bottom + 4
                  : "auto",
              })}
          minW="140px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={9999}
          py={1}
        >
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={3}
            py={2}
            fontSize="sm"
            color="blue.500"
            _hover={{ bg: "blue.50" }}
            onClick={() => {
              setIsOpen(false);
              onView();
            }}
          >
            <Box as="span" mr={2}>
              <LuEye size={14} />
            </Box>
            View
          </Box>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={3}
            py={2}
            fontSize="sm"
            color="green.600"
            _hover={{ bg: "green.50" }}
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
          >
            <Box as="span" mr={2}>
              <LuPencil size={14} />
            </Box>
            Edit
          </Box>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={3}
            py={2}
            fontSize="sm"
            color="red.500"
            _hover={{ bg: "red.50" }}
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            <Box as="span" mr={2}>
              <LuTrash2 size={14} />
            </Box>
            Delete
          </Box>
        </Box>
      )}
    </Box>
  );
};

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getBills();

      let paymentsData = [];
      if (response && response.data) {
        paymentsData = response.data;
      } else if (Array.isArray(response)) {
        paymentsData = response;
      }

      setPayments(paymentsData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load payments.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.deleteBill(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Payment deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchPayments();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete payment.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/payments/edit/${item.id}`, { state: { payment: item } });
  };

  const handleView = (item) => {
    navigate(`/admin/payments/view/${item.id}`, { state: { payment: item } });
  };

  const handleAddNew = () => {
    navigate("/admin/payments/add");
  };

  const handleMarkPaid = async (id) => {
    try {
      await adminApi.markBillPaid(id);
      toaster.create({
        title: "Success",
        description: "Payment verified and marked as paid.",
        type: "success",
        duration: 3000,
      });
      fetchPayments();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to mark payment as paid.",
        type: "error",
        duration: 5000,
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterPeriod("all");
    setCurrentPage(1);
  };

  const inPeriod = (p) => {
    if (filterPeriod === "all") return true;
    const src = p.paid_at || p.created_at;
    if (!src) return false;
    const date = new Date(src);
    const now = new Date();
    if (filterPeriod === "this_year") return date.getFullYear() === now.getFullYear();
    if (filterPeriod === "this_month")
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    if (filterPeriod === "last_30")
      return (now - date) / (1000 * 60 * 60 * 24) <= 30;
    return true;
  };

  // Period drives both the stat cards and the table
  const periodPayments = payments.filter(inPeriod);

  // Stats
  const totalPayments = periodPayments.length;
  const paid = periodPayments.filter((p) => normalizeStatus(p.status) === "paid");
  const totalCollected = paid.reduce(
    (s, p) => s + (parseFloat(p.total_amount) || parseFloat(p.amount) || 0),
    0
  );
  const taxableRevenue = paid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const taxCollected = paid.reduce((s, p) => s + (parseFloat(p.tax_amount) || 0), 0);
  const pendingVerification = periodPayments.filter(
    (p) => normalizeStatus(p.status) === "pending"
  ).length;

  const searchedPayments = searchQuery.trim()
    ? periodPayments.filter(
        (item) =>
          receiptNo(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.church_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.package_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : periodPayments;

  const statusFilteredPayments =
    filterStatus === "ALL"
      ? searchedPayments
      : searchedPayments.filter((p) => {
          const key = normalizeStatus(p.status);
          if (filterStatus === "PAID") return key === "paid";
          if (filterStatus === "PENDING") return key === "pending";
          if (filterStatus === "CANCELLED") return key === "cancelled";
          return true;
        });

  const totalPages = Math.ceil(statusFilteredPayments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = statusFilteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const StatCard = ({ icon, label, value, color, subtitle }) => (
    <Box
      flex="1"
      minW="200px"
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 4px 20px -5px rgba(0,0,0,0.05)"
      p={5}
      transition="all 0.3s"
      _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
    >
      <Flex align="center" gap={4}>
        <Circle
          size="50px"
          bg={`${color || primaryMaroon}15`}
          color={color || primaryMaroon}
          flexShrink={0}
        >
          <Icon as={icon} boxSize={6} />
        </Circle>
        <Box flex="1" minW={0}>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="0.5px"
            noOfLines={1}
          >
            {label}
          </Text>
          <Heading size="xl" fontWeight="800" color="#333" mt={0.5} noOfLines={1}>
            {value}
          </Heading>
          {subtitle && (
            <Text fontSize="xs" color="gray.400" mt={0.5}>
              {subtitle}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );

  // Shared style for the toolbar <select> filters
  const selectStyle = {
    padding: "0 34px 0 14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: "14px",
    height: "40px",
    outline: "none",
    minWidth: "150px",
    cursor: "pointer",
    color: "#4a5568",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  };

  const StatusPill = ({ status }) => {
    const s = statusStyles[normalizeStatus(status)] || statusStyles.pending;
    return (
      <Box
        display="inline-flex"
        alignItems="center"
        gap={2}
        bg={s.bg}
        color={s.color}
        borderRadius="full"
        px={3}
        py={1}
        fontSize="11px"
        fontWeight="700"
      >
        <Box w="7px" h="7px" borderRadius="full" bg={s.dot} />
        {s.label}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Breadcrumb */}
        <HStack spacing={2} mb={3} color="gray.400" fontSize="sm" fontWeight="600">
          <Box
            as="button"
            display="flex"
            alignItems="center"
            _hover={{ color: primaryMaroon }}
            onClick={() => navigate("/admin/dashboard")}
          >
            <LuHouse size={15} />
          </Box>
          <LuChevronRight size={13} />
          <Text color="gray.600">Payments</Text>
        </HStack>

        {/* Header */}
        <Flex justify="space-between" align="start" mb={6} flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Text
              fontSize="xs"
              fontWeight="700"
              color={primaryMaroon}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Payment Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Payments
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Record and manage church subscription payments.
            </Text>
          </VStack>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#8a1a3e" }}
            onClick={handleAddNew}
            borderRadius="lg"
            leftIcon={<LuPlus size={18} />}
            size="lg"
          >
            Record Payment
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuReceipt} label="Total Payments" value={totalPayments} color="#ae2050" />
          <StatCard
            icon={LuIndianRupee}
            label="Total Collected"
            value={compactINR(totalCollected)}
            color="#ae2050"
            subtitle="Including tax"
          />
          <StatCard
            icon={LuReceiptText}
            label="Taxable Revenue"
            value={compactINR(taxableRevenue)}
            color="#ed8936"
          />
          <StatCard
            icon={LuIndianRupee}
            label="Tax Collected"
            value={compactINR(taxCollected)}
            color="#38a169"
          />
          <StatCard
            icon={LuClock}
            label="Pending Verification"
            value={pendingVerification}
            color="#ed8936"
          />
        </Flex>

        {/* Table */}
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden">
          {/* Toolbar */}
          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={4}
            borderBottom="1px solid"
            borderColor="gray.100"
            gap={3}
            flexWrap="wrap"
          >
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              All Payments
            </Heading>

            <HStack spacing={3} flexWrap="wrap">
              <Box position="relative" w="260px" maxW="100%">
                <Input
                  placeholder="Search receipt or church"
                  size="sm"
                  borderRadius="lg"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.200"
                  fontSize="sm"
                  pl={10}
                  h="40px"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ bg: "white", borderColor: primaryMaroon }}
                />
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                >
                  <LuSearch size={16} />
                </Box>
              </Box>

              {/* Status Filter */}
              <Box
                as="select"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending Verification</option>
                <option value="CANCELLED">Cancelled</option>
              </Box>

              {/* Period Filter */}
              <Box position="relative">
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.500"
                  zIndex={1}
                  pointerEvents="none"
                >
                  <LuCalendar size={15} />
                </Box>
                <Box
                  as="select"
                  value={filterPeriod}
                  onChange={(e) => {
                    setFilterPeriod(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ ...selectStyle, paddingLeft: "36px" }}
                  onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                >
                  <option value="all">All Time</option>
                  <option value="this_year">This Year</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30">Last 30 Days</option>
                </Box>
              </Box>

              {/* Reset filters */}
              <Box
                as="button"
                onClick={resetFilters}
                title="Reset filters"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="40px"
                h="40px"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
                color="gray.500"
                _hover={{ bg: "gray.50", color: primaryMaroon, borderColor: primaryMaroon }}
                flexShrink={0}
              >
                <LuFilter size={16} />
              </Box>
            </HStack>
          </Flex>

          {/* Table */}
          <Box overflowX="auto">
            {paginatedItems.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text color="gray.400" fontSize="sm">
                  {searchQuery || filterStatus !== "ALL" || filterPeriod !== "all"
                    ? "No payments found matching your filters."
                    : "No payments found. Click 'Record Payment' to get started."}
                </Text>
              </Box>
            ) : (
              <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
                <Box as="thead" bg="gray.50">
                  <Box as="tr">
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Receipt
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Church
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Payment Date
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Method
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Taxable Amount
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Tax
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Total Paid
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Status
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Proof
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Actions
                    </Box>
                  </Box>
                </Box>

                <Box as="tbody">
                  {paginatedItems.map((item) => {
                    const proof = proofUrlOf(item);
                    const isPending = normalizeStatus(item.status) === "pending";
                    const subParts = [item.package_name, formatCycle(item.billing_cycle)].filter(Boolean);
                    return (
                      <Box
                        as="tr"
                        key={item.id}
                        borderBottom="1px solid"
                        borderColor="gray.50"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" fontWeight="600" color="#333" whiteSpace="nowrap">
                            {receiptNo(item)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <HStack spacing={2.5} align="center">
                            <Circle
                              size="32px"
                              bg="rgba(174,32,80,0.08)"
                              color={primaryMaroon}
                              flexShrink={0}
                            >
                              <Icon as={LuChurch} boxSize={3.5} />
                            </Circle>
                            <Box minW={0}>
                              <Text fontSize="13px" fontWeight="600" color="#333" noOfLines={1}>
                                {item.church_name || "N/A"}
                              </Text>
                              {subParts.length > 0 && (
                                <Text fontSize="11px" color="gray.400" noOfLines={1}>
                                  {subParts.join(" · ")}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600" whiteSpace="nowrap">
                            {formatDate(item.paid_at || item.created_at)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600" whiteSpace="nowrap">
                            {methodLabel(item.payment_method)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.700" whiteSpace="nowrap">
                            {fullINR(item.amount)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.700" whiteSpace="nowrap">
                            {fullINR(item.tax_amount)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" fontWeight="700" color="#333" whiteSpace="nowrap">
                            {fullINR(item.total_amount || item.amount)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
                          <StatusPill status={item.status} />
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
                          <Box
                            as="button"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="34px"
                            h="30px"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="white"
                            color={proof ? primaryMaroon : "gray.400"}
                            _hover={{ bg: "gray.50" }}
                            title={proof ? "View proof" : "No proof uploaded"}
                            onClick={() =>
                              proof
                                ? window.open(proof, "_blank", "noopener")
                                : toaster.create({
                                    title: "No proof",
                                    description: "No payment proof was uploaded for this payment.",
                                    type: "info",
                                    duration: 2500,
                                  })
                            }
                          >
                            <LuImage size={16} />
                          </Box>
                        </Box>
                        <Box as="td" px={2} py={3} textAlign="center">
                          <HStack spacing={1} justify="center">
                            {isPending && (
                              <IconButton
                                size="xs"
                                variant="ghost"
                                aria-label="Verify payment"
                                title="Verify & mark paid"
                                onClick={() => handleMarkPaid(item.id)}
                                color="gray.500"
                                _hover={{ bg: "green.50", color: "#38a169" }}
                                minW="30px"
                                h="30px"
                              >
                                <LuCheck size={16} />
                              </IconButton>
                            )}
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="View"
                              onClick={() => handleView(item)}
                              color="gray.500"
                              _hover={{ bg: "gray.100", color: primaryMaroon }}
                              minW="30px"
                              h="30px"
                            >
                              <LuEye size={15} />
                            </IconButton>
                            <RowActionsMenu
                              onView={() => handleView(item)}
                              onEdit={() => handleEdit(item)}
                              onDelete={() => handleDelete(item.id)}
                            />
                          </HStack>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>

          {/* Pagination */}
          {statusFilteredPayments.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              px={5}
              py={4}
              borderTop="1px solid"
              borderColor="gray.100"
              wrap="wrap"
              gap={3}
            >
              <Text fontSize="13px" color="gray.500" fontWeight="500">
                Showing {indexOfFirstItem + 1}–
                {Math.min(indexOfLastItem, statusFilteredPayments.length)} of{" "}
                {statusFilteredPayments.length} payments
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="md"
                  borderColor="gray.200"
                  color="gray.500"
                  minW="36px"
                  px={0}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  _hover={{ bg: "gray.50" }}
                >
                  <LuChevronLeft size={16} />
                </Button>

                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <Text key={`ellipsis-${idx}`} px={1} fontSize="13px" color="gray.400">
                      …
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      bg={currentPage === page ? primaryMaroon : "transparent"}
                      color={currentPage === page ? "white" : "gray.600"}
                      variant={currentPage === page ? "solid" : "ghost"}
                      size="sm"
                      borderRadius="md"
                      minW="36px"
                      px={0}
                      fontSize="13px"
                      fontWeight={currentPage === page ? "700" : "500"}
                      onClick={() => handlePageChange(page)}
                      _hover={{ bg: currentPage === page ? "#8a1a3e" : "gray.100" }}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="md"
                  borderColor="gray.200"
                  color="gray.500"
                  minW="36px"
                  px={0}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  _hover={{ bg: "gray.50" }}
                >
                  <LuChevronRight size={16} />
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </Container>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        entityName="Payment"
      />
    </AdminLayout>
  );
};

export default PaymentsPage;