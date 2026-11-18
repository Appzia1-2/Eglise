// src/admin/pages/UpgradeRequestsPage.jsx
import React, { useState, useEffect } from "react";
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
  LuSearch,
  LuCheck,
  LuX,
  LuEye,
  LuHouse,
  LuChevronRight,
  LuChevronLeft,
  LuFilter,
  LuCircleArrowUp,
  LuClock,
  LuCircleCheck,
  LuCircleX,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

const money = (v) => `₹${Number(v || 0).toLocaleString()}`;

const UpgradeRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [processingId, setProcessingId] = useState(null);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;
  const approvedRequests = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedRequests = requests.filter((r) => r.status === "REJECTED").length;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUpgradeRequests();
      const list = Array.isArray(data) ? data : data?.data || data?.results || [];
      setRequests(list);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching upgrade requests:", error);
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to load upgrade requests.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const res = await adminApi.approveUpgradeRequest(id);

      // ============================================================
      // Redirect to payment page with the new bill id
      // ============================================================
      const billId = res?.bill_id || res?.data?.bill_id;
      if (billId) {
        toaster.create({
          title: "Approved",
          description: res?.message || "Bill generated. Opening payment page…",
          type: "success",
          duration: 2500,
        });
        navigate(`/admin/payments/create?bill_id=${billId}`);
        return;
      }

      // Fallback: approved but no bill id returned
      toaster.create({
        title: "Approved",
        description:
          res?.message ||
          "Upgrade approved, but no bill was created. Check the Bills page.",
        type: "warning",
        duration: 4000,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.detail ||
          "Failed to approve request.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const res = await adminApi.rejectUpgradeRequest(id);
      toaster.create({
        title: "Rejected",
        description: res?.message || res?.detail || "Upgrade request rejected.",
        type: "success",
        duration: 3000,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.detail ||
          "Failed to reject request.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const searchedRequests = searchQuery.trim()
    ? requests.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          (r.church_name || "").toLowerCase().includes(q) ||
          (r.current_package || r.current_package_name || "").toLowerCase().includes(q) ||
          (r.requested_package_name || "").toLowerCase().includes(q)
        );
      })
    : requests;

  const filteredRequests =
    filterStatus === "all"
      ? searchedRequests
      : searchedRequests.filter(
          (r) => (r.status || "").toLowerCase() === filterStatus
        );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

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

  const statusBadge = (status) => {
    const map = {
      PENDING: { bg: "rgba(237,137,54,0.10)", color: "#c05621", label: "Pending" },
      CONTACTED: { bg: "rgba(66,153,225,0.10)", color: "#2b6cb0", label: "Contacted" },
      APPROVED: { bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Approved" },
      REJECTED: { bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Rejected" },
    };
    const cfg = map[status] || { bg: "gray.100", color: "gray.500", label: status || "—" };
    return (
      <Badge
        bg={cfg.bg}
        color={cfg.color}
        borderRadius="full"
        px={3}
        py={1}
        fontSize="11px"
        fontWeight="700"
      >
        {cfg.label}
      </Badge>
    );
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

  if (isLoading && requests.length === 0) {
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
          <Text color="gray.600">Upgrade Requests</Text>
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
              Subscription Management
            </Text>
            <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
              Upgrade Requests
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Review, approve, or reject package upgrade enquiries from churches.
            </Text>
          </VStack>
          <Button
            variant="outline"
            borderColor="gray.200"
            color="gray.600"
            borderRadius="lg"
            size="lg"
            onClick={fetchRequests}
            _hover={{ bg: "gray.50", borderColor: primaryMaroon, color: primaryMaroon }}
          >
            Refresh
          </Button>
        </Flex>

        <Flex gap={4} mb={6} flexWrap="wrap">
          <StatCard icon={LuCircleArrowUp} label="Total Requests" value={totalRequests} color="#ae2050" />
          <StatCard icon={LuClock} label="Pending" value={pendingRequests} color="#ed8936" />
          <StatCard icon={LuCircleCheck} label="Approved" value={approvedRequests} color="#38a169" />
          <StatCard icon={LuCircleX} label="Rejected" value={rejectedRequests} color="#e53e3e" />
        </Flex>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden">
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
              All Upgrade Requests
            </Heading>

            <HStack spacing={3} flexWrap="wrap">
              <Box position="relative" w="240px" maxW="100%">
                <Input
                  placeholder="Search church or package"
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
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
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
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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

          <Box overflowX="auto">
            {paginatedItems.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text color="gray.400" fontSize="sm">
                  {searchQuery || filterStatus !== "all"
                    ? "No upgrade requests match your filters."
                    : "No upgrade requests yet. Requests from churches will appear here."}
                </Text>
              </Box>
            ) : (
              <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
                <Box as="thead" bg="gray.50">
                  <Box as="tr">
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Church</Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Current Package</Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Requested Package</Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Billing Cycle</Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Amount</Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Status</Box>
                    <Box as="th" px={4} py={3} textAlign="left" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Requested</Box>
                    <Box as="th" px={4} py={3} textAlign="center" fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" borderBottom="1px solid" borderColor="gray.200" whiteSpace="nowrap">Actions</Box>
                  </Box>
                </Box>

                <Box as="tbody">
                  {paginatedItems.map((req) => {
                    const canAct = req.status === "PENDING" || req.status === "CONTACTED";
                    const isBusy = processingId === req.id;
                    return (
                      <Box as="tr" key={req.id} borderBottom="1px solid" borderColor="gray.50" _hover={{ bg: "gray.50" }}>
                        <Box as="td" px={4} py={3}>
                          <HStack spacing={2.5} align="center">
                            <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                              <Icon as={LuCircleArrowUp} boxSize={3.5} />
                            </Circle>
                            <Text fontSize="13px" fontWeight="600" color="#333" noOfLines={1}>
                              {req.church_name || "—"}
                            </Text>
                          </HStack>
                        </Box>

                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600" fontWeight="500">
                            {req.current_package || req.current_package_name || "—"}
                          </Text>
                        </Box>

                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="#333" fontWeight="600">
                            {req.requested_package_name || "—"}
                          </Text>
                        </Box>

                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600">
                            {req.billing_cycle || "—"}
                          </Text>
                        </Box>

                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="#333" fontWeight="600">
                            {req.amount != null ? money(req.amount) : "—"}
                          </Text>
                        </Box>

                        <Box as="td" px={4} py={3} textAlign="center">
                          {statusBadge(req.status)}
                        </Box>

                        <Box as="td" px={4} py={3}>
                          <Text fontSize="13px" color="gray.600" whiteSpace="nowrap">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
                          </Text>
                        </Box>

                        <Box as="td" px={2} py={3} textAlign="center">
                          <HStack spacing={1} justify="center">
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="View"
                              color="gray.500"
                              _hover={{ bg: "gray.100", color: primaryMaroon }}
                              minW="30px"
                              h="30px"
                              onClick={() => navigate(`/admin/upgrade-requests/view/${req.id}`)}
                            >
                              <LuEye size={15} />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="Approve"
                              color="green.600"
                              isDisabled={!canAct || isBusy}
                              isLoading={isBusy}
                              _hover={{ bg: "green.50" }}
                              minW="30px"
                              h="30px"
                              onClick={() => handleApprove(req.id)}
                            >
                              <LuCheck size={15} />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="Reject"
                              color="red.500"
                              isDisabled={!canAct || isBusy}
                              _hover={{ bg: "red.50" }}
                              minW="30px"
                              h="30px"
                              onClick={() => handleReject(req.id)}
                            >
                              <LuX size={15} />
                            </IconButton>
                          </HStack>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>

          {filteredRequests.length > 0 && (
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
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredRequests.length)} of{" "}
                {filteredRequests.length} requests
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
    </AdminLayout>
  );
};

export default UpgradeRequestsPage;