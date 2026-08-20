// src/admin/pages/TaxRatesPage.jsx
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
  LuPercent,
  LuCalendar,
  LuCirclePause,
  LuHouse,
  LuChevronRight,
  LuChevronLeft,
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

const statusStyles = {
  active: { bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Active" },
  scheduled: { bg: "rgba(237,137,54,0.14)", color: "#c05621", label: "Scheduled" },
  expired: { bg: "gray.100", color: "gray.500", label: "Expired" },
  inactive: { bg: "gray.100", color: "gray.500", label: "Inactive" },
};

const getRateStatus = (item) => {
  if (item.is_active === false) return "inactive";
  const isScheduled = item.effective_from && new Date(item.effective_from) > new Date();
  if (isScheduled) return "scheduled";
  if (item.is_effective === false) return "expired";
  return "active";
};

// Kebab actions menu - fixed positioning with scroll prevention
const RowActionsMenu = ({ onDelete, onEdit, onView }) => {
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

const TaxRatesPage = () => {
  const navigate = useNavigate();
  const [taxRates, setTaxRates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(10);
  const [filterTaxType, setFilterTaxType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTaxRates();

      let taxRatesData = [];
      if (response && response.data) {
        taxRatesData = response.data;
      } else if (Array.isArray(response)) {
        taxRatesData = response;
      }

      setTaxRates(taxRatesData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching tax rates:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load tax rates.",
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
      await adminApi.deleteTaxRate(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Tax rate deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchTaxRates();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting tax rate:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete tax rate.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/tax-rates/edit/${item.id}`, { state: { taxRate: item } });
  };

  const handleView = (item) => {
    navigate(`/admin/tax-rates/view/${item.id}`, { state: { taxRate: item } });
  };

  const handleAddNew = () => {
    navigate("/admin/tax-rates/add");
  };

  const taxTypeOptions = Array.from(
    new Set(taxRates.map((t) => t.tax_type_name).filter(Boolean))
  ).sort();

  const searchedTaxRates = searchQuery.trim()
    ? taxRates.filter(
        (item) =>
          (item.tax_rate_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tax_rate_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tax_type_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : taxRates;

  const byTaxType =
    filterTaxType === "all"
      ? searchedTaxRates
      : searchedTaxRates.filter((t) => t.tax_type_name === filterTaxType);

  const filteredTaxRates =
    filterStatus === "all"
      ? byTaxType
      : byTaxType.filter((t) => getRateStatus(t) === filterStatus);

  const totalPages = Math.ceil(filteredTaxRates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = filteredTaxRates.slice(indexOfFirstItem, indexOfLastItem);

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
  const totalTaxRates = taxRates.length;
  const activeRates = taxRates.filter(
    (t) => t.is_active !== false && t.is_effective !== false
  ).length;
  const scheduledRates = taxRates.filter(
    (t) =>
      t.is_active !== false &&
      t.is_effective === false &&
      t.effective_from &&
      new Date(t.effective_from) > new Date()
  ).length;
  const inactiveRates = taxRates.filter((t) => t.is_active === false).length;

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
    minWidth: "160px",
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
          <Box
            as="button"
            _hover={{ color: primaryMaroon }}
            onClick={() => navigate("/admin/payments")}
          >
            Payments
          </Box>
          <LuChevronRight size={13} />
          <Text color="gray.600">Tax Rates</Text>
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
              Tax Configuration
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Tax Rates
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Create and manage percentage rates linked to tax types.
            </Text>
          </VStack>
          <HStack spacing={5}>
            <Text
              as="button"
              color={primaryMaroon}
              fontWeight="600"
              fontSize="sm"
              whiteSpace="nowrap"
              _hover={{ textDecoration: "underline" }}
              onClick={() => navigate("/admin/tax-types")}
            >
              View Tax Types
            </Text>
            <Button
              bg={primaryMaroon}
              color="white"
              _hover={{ bg: "#8a1a3e" }}
              onClick={handleAddNew}
              borderRadius="lg"
              leftIcon={<LuPlus size={18} />}
              size="lg"
            >
              Create Tax Rate
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuPercent} label="Total Tax Rates" value={totalTaxRates} color="#ae2050" />
          <StatCard icon={LuPercent} label="Active Rates" value={activeRates} color="#ae2050" />
          <StatCard icon={LuCalendar} label="Scheduled Rates" value={scheduledRates} color="#ae2050" />
          <StatCard icon={LuCirclePause} label="Inactive Rates" value={inactiveRates} color="#ae2050" />
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
              All Tax Rates
            </Heading>

            <HStack spacing={3} flexWrap="wrap">
              <Box position="relative" w="240px" maxW="100%">
                <Input
                  placeholder="Search tax rates"
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

              {/* Tax Type Filter */}
              <Box
                as="select"
                value={filterTaxType}
                onChange={(e) => {
                  setFilterTaxType(e.target.value);
                  setCurrentPage(1);
                }}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              >
                <option value="all">All Tax Types</option>
                {taxTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="inactive">Inactive</option>
              </Box>
            </HStack>
          </Flex>

          {/* Table */}
          <Box overflowX="auto">
            <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
              <Box as="thead" bg="gray.50">
                <Box as="tr">
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Tax Rate
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Code
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Tax Type
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Rate
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Effective From
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Effective Until
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Payments Using Rate
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Status
                  </Box>
                  <Box as="th" px={4} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Actions
                  </Box>
                </Box>
              </Box>

              <Box as="tbody">
                {paginatedItems.length === 0 ? (
                  <Box as="tr">
                    <Box as="td" colSpan="9" textAlign="center" py={8}>
                      <Text color="gray.400">
                        {searchQuery || filterTaxType !== "all" || filterStatus !== "all"
                          ? "No tax rates found matching your search."
                          : "No tax rates found. Click 'Create Tax Rate' to get started."}
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  paginatedItems.map((item) => {
                    const st = statusStyles[getRateStatus(item)] || statusStyles.inactive;
                    return (
                      <Box
                        as="tr"
                        key={item.id}
                        borderBottom="1px solid"
                        borderColor="gray.50"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box as="td" px={4} py={3}>
                          <HStack spacing={2.5} align="center">
                            <Circle
                              size="32px"
                              bg="rgba(174,32,80,0.08)"
                              color={primaryMaroon}
                              flexShrink={0}
                            >
                              <Icon as={LuPercent} boxSize={3.5} />
                            </Circle>
                            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
                              {item.tax_rate_name}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="sm" color="gray.600" fontWeight="500">
                            {item.tax_rate_code}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="sm" color="gray.600">
                            {item.tax_type_name || "—"}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="sm" fontWeight="700" color="#333">
                            {item.rate_percentage}%
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {formatDate(item.effective_from)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {item.effective_until ? formatDate(item.effective_until) : "No end date"}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
                          <Text fontSize="sm" color="#333" fontWeight="600">
                            {item.payment_count ?? 0}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
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
                        <Box as="td" px={2} py={3} textAlign="center">
                          <HStack spacing={0} justify="center">
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="View"
                              onClick={() => handleView(item)}
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
                              onClick={() => handleEdit(item)}
                              color="gray.700"
                              _hover={{ bg: "gray.100" }}
                              minW="24px"
                              h="24px"
                              p={0}
                            >
                              <LuPencil size={14} color="#1a202c" />
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
                  })
                )}
              </Box>
            </Box>
          </Box>

          {/* Pagination */}
          {filteredTaxRates.length > 0 && (
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
                {indexOfFirstItem + 1}–
                {Math.min(indexOfLastItem, filteredTaxRates.length)} of{" "}
                {filteredTaxRates.length} tax rates
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
        entityName="Tax Rate"
      />
    </AdminLayout>
  );
};

export default TaxRatesPage;