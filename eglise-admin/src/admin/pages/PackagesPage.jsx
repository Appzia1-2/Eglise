// src/admin/pages/PackagesPage.jsx
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
  LuBox,
  LuCircleCheck,
  LuCirclePause,
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

const money = (v) => `₹${Number(v || 0).toLocaleString()}`;
const formatLimit = (v) => (v ? Number(v).toLocaleString() : "Unlimited");

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

const PackagesPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");

  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.is_active !== false).length;
  const inactivePackages = packages.filter((p) => p.is_active === false).length;
  const subscribedChurches = packages.reduce((sum, p) => sum + (p.church_count || 0), 0);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getPackages();

      let packagesData = [];
      if (response && response.results) {
        packagesData = response.results;
      } else if (response && response.data) {
        packagesData = response.data;
      } else if (Array.isArray(response)) {
        packagesData = response;
      }

      setPackages(packagesData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load packages.",
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
      await adminApi.deletePackage(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Package deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchPackages();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting package:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete package.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
  navigate(`/admin/packages/edit/${item.id}`, { state: { package: item } });
};

  const handleView = (item) => {
    navigate(`/admin/packages/view/${item.id}`, { state: { package: item } });
  };

  const handleAddNew = () => {
    navigate("/admin/packages/add");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const generatePackageCode = (index) => {
    return `PKG-${String(index + 1).padStart(3, "0")}`;
  };

  const searchedPackages = searchQuery.trim()
    ? packages.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.code || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : packages;

  const filteredPackages =
    filterStatus === "all"
      ? searchedPackages
      : searchedPackages.filter((p) =>
          filterStatus === "active" ? p.is_active !== false : p.is_active === false
        );

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);

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

  // Shared style for the status <select>
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
          <Text color="gray.600">Packages</Text>
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
              Package Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Packages
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Create and manage subscription packages for churches.
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
            Create Package
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuBox} label="Total Packages" value={totalPackages} color="#ae2050" />
          <StatCard icon={LuCircleCheck} label="Active Packages" value={activePackages} color="#38a169" />
          <StatCard icon={LuCirclePause} label="Inactive Packages" value={inactivePackages} color="#ed8936" />
          <StatCard icon={LuChurch} label="Subscribed Churches" value={subscribedChurches} color="#ae2050" />
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
              All Packages
            </Heading>

            <HStack spacing={3} flexWrap="wrap">
              <Box position="relative" w="240px" maxW="100%">
                <Input
                  placeholder="Search packages"
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
                <option value="inactive">Inactive</option>
              </Box>

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
                  {searchQuery || filterStatus !== "all"
                    ? "No packages found matching your search."
                    : "No packages found. Click 'Create Package' to get started."}
                </Text>
              </Box>
            ) : (
              <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
                <Box as="thead" bg="gray.50">
                  <Box as="tr">
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Package
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Code
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Rate per Member (Monthly)
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Rate per Member (Yearly)
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Member Limit
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Churches
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Status
                    </Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">
                      Actions
                    </Box>
                  </Box>
                </Box>

                <Box as="tbody">
                  {paginatedItems.map((item) => {
                    const globalIndex = filteredPackages.indexOf(item);
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
                              <Icon as={LuBox} boxSize={3.5} />
                            </Circle>
                            <Text fontSize="13px" fontWeight="600" color="#333" noOfLines={1}>
                              {item.name}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600" fontWeight="500" whiteSpace="nowrap">
                            {item.code || generatePackageCode(globalIndex)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600">
                            {money(item.rate_per_member_monthly)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600">
                            {money(item.rate_per_member_yearly)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600">
                            {formatLimit(item.member_limit)}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
                          <Text fontSize="13px" color="#333" fontWeight="600">
                            {item.church_count || 0}
                          </Text>
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="center">
                          <Badge
                            bg={item.is_active !== false ? "rgba(56,161,105,0.10)" : "gray.100"}
                            color={item.is_active !== false ? "#2f855a" : "gray.500"}
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize="11px"
                            fontWeight="700"
                          >
                            {item.is_active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </Box>
                        <Box as="td" px={2} py={3} textAlign="center">
                          <HStack spacing={1} justify="center">
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
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="Edit"
                              onClick={() => handleEdit(item)}
                              color="gray.500"
                              _hover={{ bg: "gray.100", color: primaryMaroon }}
                              minW="30px"
                              h="30px"
                            >
                              <LuPencil size={15} />
                            </IconButton>
                            <RowActionsMenu onDelete={() => handleDelete(item.id)} />
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
          {filteredPackages.length > 0 && (
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
                {Math.min(indexOfLastItem, filteredPackages.length)} of{" "}
                {filteredPackages.length} packages
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
        entityName="Package"
      />
    </AdminLayout>
  );
};

export default PackagesPage;