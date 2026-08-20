// src/admin/pages/ChurchesPage.jsx
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
  LuCirclePlus,
  LuSearch,
  LuChevronDown,
  LuHouse,
  LuChevronRight,
  LuEye,
  LuPencil,
  LuTrash2,
  LuChurch,
  LuUsers,
  LuCirclePause,
  LuListFilter,
  LuEllipsisVertical,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// ---- display helpers -------------------------------------------------------

// Normalize the church status (falls back to is_active if the API hasn't
// been updated to return `status` yet)
const getChurchStatus = (c) =>
  c.status || (c.is_active ? "active" : "suspended");

const statusStyles = {
  active: { bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Active" },
  expiring: { bg: "rgba(214,158,46,0.16)", color: "#b7791f", label: "Expiring" },
  expired: { bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Expired" },
  suspended: { bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Suspended" },
  inactive: { bg: "gray.100", color: "gray.500", label: "Inactive" },
};

// Package pill colors — known packages get fixed colors, anything else gets a
// stable color derived from its name so the palette stays consistent per name.
const packagePalette = [
  { bg: "rgba(56,161,105,0.10)", color: "#2f855a" }, // green
  { bg: "rgba(214,158,46,0.14)", color: "#b7791f" }, // amber
  { bg: "rgba(128,90,213,0.10)", color: "#6b46c1" }, // purple
  { bg: "rgba(221,107,32,0.12)", color: "#c05621" }, // orange
  { bg: "rgba(49,130,206,0.10)", color: "#2b6cb0" }, // blue
  { bg: "rgba(174,32,80,0.08)", color: primaryMaroon }, // maroon
];
const knownPackageColors = {
  starter: packagePalette[1],
  growth: packagePalette[0],
  premium: packagePalette[2],
  enterprise: packagePalette[3],
  basic: packagePalette[4],
};
const getPackageColor = (name) => {
  if (!name) return { bg: "gray.100", color: "gray.500" };
  const key = name.toLowerCase().trim();
  if (knownPackageColors[key]) return knownPackageColors[key];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return packagePalette[Math.abs(h) % packagePalette.length];
};

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  OMR: "ر.ع.",
  AED: "د.إ",
};
const formatCurrency = (code) =>
  code
    ? `${code}${currencySymbols[code] ? ` (${currencySymbols[code]})` : ""}`
    : "—";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

const ChurchesPage = () => {
  const navigate = useNavigate();
  const [churches, setChurches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDiocese, setFilterDiocese] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [dioceses, setDioceses] = useState([]);
  const [packages, setPackages] = useState([]);

  const totalChurches = churches.length;
  const activeChurches = churches.filter((c) => c.is_active).length;
  const suspendedChurches = churches.filter(
    (c) => getChurchStatus(c) === "suspended"
  ).length;

  useEffect(() => {
    fetchChurches();
    fetchDioceses();
    fetchPackages();
  }, []);

  const fetchChurches = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getChurches();
      const sortedData = (response.data || []).sort((a, b) => a.id - b.id);
      setChurches(sortedData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching churches:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load churches.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDioceses = async () => {
    try {
      const response = await adminApi.getDioceses();
      setDioceses(response.data || []);
    } catch (error) {
      console.error("Error fetching dioceses:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await adminApi.getPackages();
      setPackages(response.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.deleteChurch(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Church deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchChurches();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting church:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete church.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/churches/edit/${item.id}`, { state: { church: item } });
  };

  const handleView = (item) => {
    navigate(`/admin/churches/view/${item.id}`, { state: { church: item } });
  };

  const handleAddNew = () => {
    navigate("/admin/churches/add");
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterDiocese("all");
    setFilterPackage("all");
    setFilterCurrency("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const generateChurchCode = (item) => {
    if (item.code) {
      return item.code;
    }
    const sortedChurches = [...churches].sort((a, b) => a.id - b.id);
    const index = sortedChurches.findIndex((d) => d.id === item.id);
    if (index !== -1) {
      return `CH-${String(index + 1).padStart(3, "0")}`;
    }
    return `CH-${String(churches.length + 1).padStart(3, "0")}`;
  };

  // Comprehensive search
  const filteredChurches = searchQuery.trim()
    ? churches.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const searchableFields = [
          item.name,
          item.code,
          item.diocese,
          item.city,
          item.state,
          item.country,
          item.email,
          item.phone_number,
          item.package_name,
          item.currency,
          generateChurchCode(item),
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(searchLower)
        );
      })
    : churches;

  // Apply filters
  const filteredByStatus =
    filterStatus === "all"
      ? filteredChurches
      : filteredChurches.filter((c) => getChurchStatus(c) === filterStatus);

  const filteredByDiocese =
    filterDiocese === "all"
      ? filteredByStatus
      : filteredByStatus.filter((c) => c.diocese_id === parseInt(filterDiocese));

  const filteredByPackage =
    filterPackage === "all"
      ? filteredByDiocese
      : filteredByDiocese.filter((c) => c.package_id === parseInt(filterPackage));

  const filteredByCurrency =
    filterCurrency === "all"
      ? filteredByPackage
      : filteredByPackage.filter((c) => c.currency === filterCurrency);

  const finalFiltered = filteredByCurrency;

  const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = finalFiltered.slice(indexOfFirstItem, indexOfLastItem);

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

  const StatCard = ({ icon, label, value }) => (
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
          bg="rgba(174, 32, 80, 0.08)"
          color={primaryMaroon}
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
          <Text color="gray.600">Churches</Text>
        </HStack>

        <Flex justify="space-between" align="start" mb={6} flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Text
              fontSize="xs"
              fontWeight="700"
              color={primaryMaroon}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Church Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Churches
            </Heading>
            <Text color="gray.500" fontSize="sm">
              View and manage all registered churches.
            </Text>
          </VStack>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#8a1a3e" }}
            onClick={handleAddNew}
            borderRadius="lg"
            leftIcon={<LuCirclePlus size={18} />}
            size="lg"
          >
            Register Church
          </Button>
        </Flex>

        {/* Stat cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuChurch} label="Total Churches" value={totalChurches} />
          <StatCard icon={LuUsers} label="Active Churches" value={activeChurches} />
          <StatCard
            icon={LuCirclePause}
            label="Suspended Churches"
            value={suspendedChurches}
          />
        </Flex>

        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
        >
          {/* Toolbar */}
          <Flex
            justify="space-between"
            align="center"
            px={4}
            py={3}
            borderBottom="1px solid"
            borderColor="gray.100"
            gap={3}
            flexWrap="wrap"
          >
            <HStack spacing={3} flex="1" minW="200px" flexWrap="wrap">
              <Box position="relative" maxW="320px" flex="1" minW="200px">
                <Input
                  placeholder="Search churches by name, code or city"
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
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </Box>

              {/* Diocese Filter */}
              <Box
                as="select"
                value={filterDiocese}
                onChange={(e) => {
                  setFilterDiocese(e.target.value);
                  setCurrentPage(1);
                }}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              >
                <option value="all">All Dioceses</option>
                {dioceses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
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

              {/* Currency Filter */}
              <Box
                as="select"
                value={filterCurrency}
                onChange={(e) => {
                  setFilterCurrency(e.target.value);
                  setCurrentPage(1);
                }}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = primaryMaroon)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              >
                <option value="all">All Currencies</option>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="OMR">OMR</option>
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
                <LuListFilter size={17} />
              </Box>
            </HStack>

            <Text fontSize="sm" color="gray.500" fontWeight="500" whiteSpace="nowrap">
              {finalFiltered.length} churches
            </Text>
          </Flex>

          {/* Table */}
          <Box overflowX="auto">
            <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
              <Box as="thead" bg="gray.50">
                <Box as="tr">
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Church
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Code
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Diocese
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Location
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Currency
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Package
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Renewal Date
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
                {paginatedItems.length === 0 ? (
                  <Box as="tr">
                    <Box as="td" colSpan="9" textAlign="center" py={8}>
                      <Text color="gray.400">
                        {searchQuery
                          ? "No churches found matching your search."
                          : "No churches found. Click 'Register Church' to get started."}
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  paginatedItems.map((item) => {
                    const st = statusStyles[getChurchStatus(item)] || statusStyles.inactive;
                    const pkgColor = getPackageColor(item.package_name);
                    return (
                      <Box
                        as="tr"
                        key={item.id}
                        borderBottom="1px solid"
                        borderColor="gray.50"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box as="td" px={3} py={3}>
                          <HStack spacing={2} align="center">
                            <Circle
                              size="32px"
                              bg="rgba(174,32,80,0.08)"
                              color={primaryMaroon}
                              flexShrink={0}
                            >
                              <Icon as={LuChurch} boxSize={3.5} />
                            </Circle>
                            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
                              {item.name}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" fontWeight="500">
                            {generateChurchCode(item)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {item.diocese || "—"}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" noOfLines={1} whiteSpace="nowrap">
                            {[item.city, item.state].filter(Boolean).join(", ") || "—"}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {formatCurrency(item.currency)}
                          </Text>
                        </Box>
                        <Box as="td" px={3} py={3}>
                          {item.package_name ? (
                            <Badge
                              bg={pkgColor.bg}
                              color={pkgColor.color}
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontSize="xs"
                              fontWeight="700"
                            >
                              {item.package_name}
                            </Badge>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              —
                            </Text>
                          )}
                        </Box>
                        <Box as="td" px={3} py={3}>
                          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
                            {formatDate(item.renewal_date)}
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
                            <RowActionsMenu onDelete={() => handleDelete(item.id)} />
                          </HStack>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>

          {finalFiltered.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              px={4}
              py={3}
              borderTop="1px solid"
              borderColor="gray.100"
              wrap="wrap"
              gap={3}
            >
              <Text fontSize="sm" color="gray.500" fontWeight="500">
                Showing {indexOfFirstItem + 1}–
                {Math.min(indexOfLastItem, finalFiltered.length)} of{" "}
                {finalFiltered.length} churches
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="md"
                  borderColor="gray.200"
                  color="gray.600"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  _hover={{ bg: "gray.50" }}
                >
                  Previous
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
                  color="gray.600"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  _hover={{ bg: "gray.50" }}
                >
                  Next
                </Button>

                <HStack
                  as="button"
                  spacing={1}
                  px={2}
                  h="32px"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                  fontSize="sm"
                  color="gray.600"
                  onClick={() => setItemsPerPage(itemsPerPage === 10 ? 25 : 10)}
                >
                  <Text>{itemsPerPage}</Text>
                  <Icon as={LuChevronDown} boxSize={3} />
                </HStack>
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
        entityName="Church"
      />
    </AdminLayout>
  );
};

export default ChurchesPage;