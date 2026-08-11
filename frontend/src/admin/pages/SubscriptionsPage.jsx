// src/admin/pages/SubscriptionsPage.jsx
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
  Badge,
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
  LuClock,
  LuBox,
  LuCircleCheck,
  LuTriangleAlert,
  LuChurch,
  LuHouse,
  LuChevronRight,
  LuChevronLeft,
  LuFilter,
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
  c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : "—";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const getSubscriptionId = (sub) => {
  const src = sub.created_at || sub.start_date;
  const year = src ? new Date(src).getFullYear() : new Date().getFullYear();
  return `SUB-${year}-${String(sub.id).padStart(4, "0")}`;
};

const statusStyles = {
  active: { bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Active" },
  expiring: { bg: "rgba(214,158,46,0.16)", color: "#b7791f", label: "Expiring Soon" },
  expired: { bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Expired" },
  inactive: { bg: "gray.100", color: "gray.500", label: "Inactive" },
};

const getStatusKey = (sub) => {
  if (sub.payment_status === "EXPIRED") return "expired";
  if (sub.end_date) {
    const daysLeft = (new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 0) return "expired";
    if (daysLeft <= 30) return "expiring";
  }
  if (sub.is_active) return "active";
  return "inactive";
};

// Kebab actions menu - fixed positioning with scroll prevention
const RowActionsMenu = ({ onDelete }) => {
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
      if (spaceBelow < 100) {
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

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");
  const [itemsPerPage] = useState(10);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subscriptionsData, packagesData] = await Promise.all([
        adminApi.getSubscriptions(),
        adminApi.getPackages(),
      ]);

      const subs = subscriptionsData.data || subscriptionsData || [];
      setSubscriptions(subs);
      setPackages(packagesData.results || packagesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load subscription data.",
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
      await adminApi.deleteSubscription(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Subscription deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchData();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete subscription.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterPackage("all");
    setCurrentPage(1);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (sub.church_name || "").toLowerCase().includes(q) ||
      getSubscriptionId(sub).toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || sub.payment_status === filterStatus;
    const matchesPackage =
      filterPackage === "all" || sub.package_id === parseInt(filterPackage);
    return matchesSearch && matchesStatus && matchesPackage;
  });

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

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

  // Stats
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter((sub) => sub.is_active === true).length;
  const expiringSoon = subscriptions.filter((sub) => {
    if (!sub.end_date) return false;
    const daysLeft = (new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30 && daysLeft > 0;
  }).length;
  const expiredSubscriptions = subscriptions.filter(
    (sub) => getStatusKey(sub) === "expired"
  ).length;

  const StatCard = ({ icon, label, value, color }) => (
    <Box
      flex="1"
      minW="230px"
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
          size="52px"
          bg={`${color || primaryMaroon}15`}
          color={color || primaryMaroon}
          flexShrink={0}
        >
          <Icon as={icon} boxSize={6} />
        </Circle>
        <Box flex="1">
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {label}
          </Text>
          <Heading size="xl" fontWeight="800" color="#333" mt={0.5}>
            {value}
          </Heading>
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
          <Text color="gray.600">Subscriptions</Text>
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
              Subscription Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Subscriptions
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Assign packages and manage church subscriptions.
            </Text>
          </VStack>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#8a1a3e" }}
            onClick={() => navigate("/admin/subscriptions/add")}
            borderRadius="lg"
            leftIcon={<LuPlus size={18} />}
            size="lg"
          >
            Assign Subscription
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuBox} label="Total Subscriptions" value={totalSubscriptions} color="#ae2050" />
          <StatCard icon={LuCircleCheck} label="Active Subscriptions" value={activeSubscriptions} color="#38a169" />
          <StatCard icon={LuClock} label="Expiring Soon" value={expiringSoon} color="#ed8936" />
          <StatCard icon={LuTriangleAlert} label="Expired Subscriptions" value={expiredSubscriptions} color="#e53e3e" />
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
              All Subscriptions
            </Heading>

            <HStack spacing={3} flexWrap="wrap">
              <Box position="relative" w="260px" maxW="100%">
                <Input
                  placeholder="Search church or subscription"
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
                <option value="all">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PENDING">Pending</option>
                <option value="EXPIRED">Expired</option>
              </Box>

              {/* Package Filter */}
              <Box
                as="select"
                value={filterPackage}
                onChange={(e) => {
                  setFilterPackage(e.target.value);
                  setCurrentPage(1);
                }}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              >
                <option value="all">All Packages</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
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
            <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
              <Box as="thead" bg="gray.50">
                <Box as="tr">
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Subscription ID
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Church
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Package
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Billing Cycle
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Start Date
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Renewal Date
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Amount
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Status
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Actions
                  </Box>
                </Box>
              </Box>

              <Box as="tbody">
                {paginatedSubscriptions.length === 0 ? (
                  <Box as="tr">
                    <Box as="td" colSpan="9" textAlign="center" py={8}>
                      <Text color="gray.400">
                        {searchQuery || filterStatus !== "all" || filterPackage !== "all"
                          ? "No subscriptions found matching your search."
                          : "No subscriptions found. Click 'Assign Subscription' to get started."}
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  paginatedSubscriptions.map((sub) => {
                    const st = statusStyles[getStatusKey(sub)] || statusStyles.inactive;
                    return (
                      <Box
                        as="tr"
                        key={sub.id}
                        borderBottom="1px solid"
                        borderColor="gray.50"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" fontWeight="600" color="#333" whiteSpace="nowrap">
                            {getSubscriptionId(sub)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <HStack spacing={2.5} align="center">
                            <Circle
                              size="32px"
                              bg="rgba(174,32,80,0.08)"
                              color={primaryMaroon}
                              flexShrink={0}
                            >
                              <Icon as={LuChurch} boxSize={3.5} />
                            </Circle>
                            <Text fontSize="sm" fontWeight="500" color="#333" noOfLines={1}>
                              {sub.church_name}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {sub.package_name || "—"}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" fontWeight="500">
                            {formatCycle(sub.billing_cycle)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {formatDate(sub.start_date)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {formatDate(sub.end_date)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" fontWeight="600" color="#333" whiteSpace="nowrap">
                            {money(sub.amount)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3} textAlign="center">
                          <Badge
                            bg={st.bg}
                            color={st.color}
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize="xs"
                            fontWeight="700"
                          >
                            {st.label}
                          </Badge>
                        </Box>
                        <Box as="td" px={1} py={3} textAlign="center">
                          <HStack spacing={0} justify="center">
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="View"
                              onClick={() => navigate(`/admin/subscriptions/${sub.id}`)}
                              color="gray.700"
                              _hover={{ bg: "gray.100" }}
                              minW="24px"
                              h="24px"
                              p={0}
                            >
                              <LuEye size={14} color="#1a202c" />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="Edit"
                              onClick={() => navigate(`/admin/subscriptions/edit/${sub.id}`)}
                              color="gray.700"
                              _hover={{ bg: "gray.100" }}
                              minW="24px"
                              h="24px"
                              p={0}
                            >
                              <LuPencil size={14} color="#1a202c" />
                            </IconButton>
                            <RowActionsMenu onDelete={() => handleDelete(sub.id)} />
                          </HStack>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>

          {/* Pagination */}
          {filteredSubscriptions.length > 0 && (
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
              <Text fontSize="sm" color="gray.500" fontWeight="500">
                Showing {indexOfFirstItem + 1}–
                {Math.min(indexOfLastItem, filteredSubscriptions.length)} of{" "}
                {filteredSubscriptions.length} subscriptions
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
                    <Text key={`ellipsis-${idx}`} px={1} fontSize="sm" color="gray.400">
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        entityName="Subscription"
      />
    </AdminLayout>
  );
};

export default SubscriptionsPage;