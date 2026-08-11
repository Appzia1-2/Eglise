// src/admin/pages/DioceseManagement.jsx
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
  Link,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuChevronDown,
  LuHouse,
  LuChevronRight,
  LuEye,
  LuPencil,
  LuTrash2,
  LuChurch,
  LuUsers,
  LuBuilding2,
  LuEllipsisVertical,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// Lightweight filter dropdown ("All Dioceses") - matches mockup toolbar
const FilterDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Box position="relative" ref={ref} flexShrink={0}>
      <HStack
        as="button"
        spacing={2}
        px={4}
        h="36px"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        bg="white"
        fontSize="sm"
        fontWeight="500"
        color="gray.700"
        whiteSpace="nowrap"
        _hover={{ bg: "gray.50" }}
        onClick={() => setIsOpen((o) => !o)}
      >
        <Text>{value}</Text>
        <Icon as={LuChevronDown} boxSize={3.5} color="gray.500" />
      </HStack>
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          minW="200px"
          maxH="260px"
          overflowY="auto"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={20}
          py={1}
        >
          {options.map((opt) => (
            <Box
              as="button"
              key={opt}
              display="flex"
              alignItems="center"
              width="full"
              textAlign="left"
              px={3}
              py={2}
              fontSize="sm"
              color={opt === value ? primaryMaroon : "gray.700"}
              fontWeight={opt === value ? "600" : "400"}
              bg={opt === value ? "rgba(174,32,80,0.06)" : "transparent"}
              _hover={{ bg: "gray.50" }}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
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

const DioceseManagement = () => {
  const navigate = useNavigate();
  const [dioceses, setDioceses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [locationFilter, setLocationFilter] = useState("All Dioceses");

  const totalDioceses = dioceses.length;
  const totalChurches = dioceses.reduce((sum, d) => sum + (d.church_count || 0), 0);
  const metropolitanSeats = dioceses.filter((d) => d.metropolitan_name).length;

  // Build filter options from the data (defaults to "All Dioceses")
  const filterOptions = [
    "All Dioceses",
    ...Array.from(
      new Set(dioceses.map((d) => d.state || d.country).filter(Boolean))
    ).sort(),
  ];

  useEffect(() => {
    fetchDioceses();
  }, []);

  const fetchDioceses = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getDioceses();
      const sortedData = (response.data || []).sort((a, b) => a.id - b.id);
      setDioceses(sortedData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching dioceses:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load dioceses.",
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
      await adminApi.deleteDiocese(itemToDelete);
      toaster.create({
        title: "Success",
        description: "Diocese deleted successfully.",
        type: "success",
        duration: 3000,
      });
      fetchDioceses();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting diocese:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete diocese.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/dioceses/edit/${item.id}`, { state: { diocese: item } });
  };

  const handleView = (item) => {
    navigate(`/admin/dioceses/view/${item.id}`, { state: { diocese: item } });
  };

  const handleAddNew = () => {
    navigate("/admin/dioceses/add");
  };

  // Get diocese code - use stored code if available
  const getDioceseCode = (item) => {
    if (item.code) {
      return item.code;
    }
    const sortedDioceses = [...dioceses].sort((a, b) => a.id - b.id);
    const index = sortedDioceses.findIndex((d) => d.id === item.id);
    if (index !== -1) {
      return `DIO-${String(index + 1).padStart(3, "0")}`;
    }
    return `DIO-${String(dioceses.length + 1).padStart(3, "0")}`;
  };

  // Comprehensive search - searches all fields displayed in the table
  const searchedDioceses = searchQuery.trim()
    ? dioceses.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const searchableFields = [
          item.name,
          item.code,
          item.metropolitan_name,
          item.state,
          item.country,
          item.email,
          item.website,
          item.phone_number,
          item.city,
          item.address_line1,
          item.address_line2,
          item.postal_code,
          String(item.church_count || "0"),
          getDioceseCode(item),
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(searchLower)
        );
      })
    : dioceses;

  // Apply the "All Dioceses" location filter on top of the search results
  const filteredDioceses =
    locationFilter === "All Dioceses"
      ? searchedDioceses
      : searchedDioceses.filter(
          (item) => (item.state || item.country) === locationFilter
        );

  const totalPages = Math.ceil(filteredDioceses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = filteredDioceses.slice(indexOfFirstItem, indexOfLastItem);

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
        <Circle size="50px" bg="rgba(174, 32, 80, 0.08)" color={primaryMaroon} flexShrink={0}>
          <Icon as={icon} boxSize={6} />
        </Circle>
        <Box flex="1">
          <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="0.5px">
            {label}
          </Text>
          <Heading size="xl" fontWeight="800" color="#333" mt={0.5}>
            {value}
          </Heading>
        </Box>
      </Flex>
    </Box>
  );

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
            onClick={() => navigate("/admin/churches")}
          >
            Churches
          </Box>
          <LuChevronRight size={13} />
          <Text color="gray.600">Dioceses</Text>
        </HStack>

        {/* Eyebrow + Title + Register button */}
        <Flex justify="space-between" align="start" mb={6} flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
              Diocese Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Dioceses
            </Heading>
            <Text color="gray.500" fontSize="sm">
              View and manage all registered dioceses.
            </Text>
          </VStack>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#8a1a3e" }}
            onClick={handleAddNew}
            borderRadius="lg"
            leftIcon={<LuPlus />}
            size="lg"
          >
            Register Diocese
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuChurch} label="Total Dioceses" value={totalDioceses} />
          <StatCard icon={LuUsers} label="Assigned Churches" value={totalChurches} />
          <StatCard icon={LuBuilding2} label="Metropolitan Seats" value={metropolitanSeats} />
        </Flex>

        {/* Table */}
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden">
          {/* Toolbar */}
          <Flex justify="space-between" align="center" px={4} py={3} borderBottom="1px solid" borderColor="gray.100" gap={3} flexWrap="wrap">
            <HStack spacing={3} flex="1" minW="200px">
              <Box position="relative" maxW="400px" flex="1">
                <Input
                  placeholder="Search by diocese, code or metropolitan"
                  size="sm"
                  borderRadius="md"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.200"
                  fontSize="sm"
                  pl={10}
                  h="36px"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ bg: "white", borderColor: primaryMaroon }}
                />
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                  <LuSearch size={14} />
                </Box>
              </Box>

              {/* All Dioceses filter dropdown */}
              <FilterDropdown
                value={locationFilter}
                options={filterOptions}
                onChange={(opt) => {
                  setLocationFilter(opt);
                  setCurrentPage(1);
                }}
              />
            </HStack>

            <Text fontSize="sm" color="gray.500" fontWeight="500">
              {filteredDioceses.length} dioceses
            </Text>
          </Flex>

          {/* Table */}
          <Box overflowX="auto">
            <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
              <Box as="thead" bg="white">
                <Box as="tr" borderBottom="1px solid" borderColor="gray.100">
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Diocese
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Code
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Location
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Metropolitan Name
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Mail ID
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Website
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="left" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Contact Details
                  </Box>
                  <Box as="th" px={3} py={3} textAlign="center" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" whiteSpace="nowrap">
                    Churches
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
                        {searchQuery || locationFilter !== "All Dioceses"
                          ? "No dioceses found matching your search."
                          : "No dioceses found. Click 'Register Diocese' to get started."}
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  paginatedItems.map((item) => (
                    <Box as="tr" key={item.id} borderBottom="1px solid" borderColor="gray.50" _hover={{ bg: "gray.50" }}>
                      <Box as="td" px={3} py={3}>
                        <HStack spacing={2} align="center">
                          <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                            <Icon as={LuChurch} boxSize={3.5} />
                          </Circle>
                          <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
                            {item.name}
                          </Text>
                        </HStack>
                      </Box>
                      <Box as="td" px={3} py={3}>
                        <Text fontSize="sm" color="gray.600" fontWeight="500">
                          {getDioceseCode(item)}
                        </Text>
                      </Box>
                      <Box as="td" px={3} py={3}>
                        <Text fontSize="sm" color="gray.600" noOfLines={1} whiteSpace="nowrap">
                          {[item.state, item.country].filter(Boolean).join(", ") || "—"}
                        </Text>
                      </Box>
                      <Box as="td" px={3} py={3}>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {item.metropolitan_name || "—"}
                        </Text>
                      </Box>
                      <Box as="td" px={3} py={3}>
                        <Text fontSize="xs" color="gray.600" noOfLines={1}>
                          {item.email || "—"}
                        </Text>
                      </Box>
                      <Box as="td" px={3} py={3}>
                        {item.website ? (
                          <Link href={item.website} isExternal fontSize="xs" color="blue.500" _hover={{ textDecoration: "underline" }} noOfLines={1}>
                            {item.website.replace(/^https?:\/\//, "")}
                          </Link>
                        ) : (
                          <Text fontSize="sm" color="gray.400">—</Text>
                        )}
                      </Box>
                      <Box as="td" px={3} py={3}>
                        <Text fontSize="xs" color="gray.600" noOfLines={1}>
                          {item.phone_number || "—"}
                        </Text>
                      </Box>
                      <Box as="td" px={3} py={3} textAlign="center">
                        <Badge bg="rgba(174,32,80,0.08)" color={primaryMaroon} borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="700">
                          {item.church_count || 0}
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
                  ))
                )}
              </Box>
            </Box>
          </Box>

          {/* Pagination */}
          {filteredDioceses.length > 0 && (
            <Flex justify="space-between" align="center" px={4} py={3} borderTop="1px solid" borderColor="gray.100" wrap="wrap" gap={3}>
              <Text fontSize="sm" color="gray.500" fontWeight="500">
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredDioceses.length)} of {filteredDioceses.length} dioceses
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        entityName="Diocese"
      />
    </AdminLayout>
  );
};

export default DioceseManagement;