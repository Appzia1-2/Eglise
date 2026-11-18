// src/admin/pages/UpgradeRequestDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Flex,
  Circle,
  Icon,
  Spinner,
  Separator,
  Textarea,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import {
  LuHouse,
  LuChevronRight,
  LuChevronLeft,
  LuCheck,
  LuX,
  LuPhone,
  LuMail,
  LuUser,
  LuCalendar,
  LuPackage,
  LuReceipt,
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
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const UpgradeRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUpgradeRequestDetail(id);
      const payload = data?.data ?? data;
      setRequest(payload);
      setAdminNote(payload?.admin_note || "");
    } catch (error) {
      console.error("Error fetching request detail:", error);
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to load request detail.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkContacted = async () => {
    setActionLoading("contacted");
    try {
      await adminApi.markUpgradeContacted(id, adminNote);
      toaster.create({
        title: "Marked Contacted",
        description: "This request is now marked as contacted.",
        type: "success",
        duration: 3000,
      });
      fetchDetail();
    } catch (error) {
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error || "Failed to mark contacted.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    try {
      const res = await adminApi.approveUpgradeRequest(id);
      toaster.create({
        title: "Approved",
        description:
          res?.message ||
          res?.detail ||
          "Upgrade approved. A bill has been generated.",
        type: "success",
        duration: 4000,
      });
      fetchDetail();
    } catch (error) {
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error || "Failed to approve request.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading("reject");
    try {
      const res = await adminApi.rejectUpgradeRequest(id, adminNote);
      toaster.create({
        title: "Rejected",
        description: res?.message || "Upgrade request rejected.",
        type: "success",
        duration: 3000,
      });
      setShowRejectBox(false);
      fetchDetail();
    } catch (error) {
      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error || "Failed to reject request.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: { bg: "rgba(237,137,54,0.10)", color: "#c05621", label: "Pending" },
      CONTACTED: { bg: "rgba(66,153,225,0.10)", color: "#2b6cb0", label: "Contacted" },
      APPROVED: { bg: "rgba(56,161,105,0.10)", color: "#2f855a", label: "Approved" },
      REJECTED: { bg: "rgba(229,62,62,0.10)", color: "#c53030", label: "Rejected" },
    };
    const cfg =
      map[status] || { bg: "gray.100", color: "gray.500", label: status || "—" };
    return (
      <Badge
        bg={cfg.bg}
        color={cfg.color}
        borderRadius="full"
        px={3}
        py={1}
        fontSize="12px"
        fontWeight="700"
      >
        {cfg.label}
      </Badge>
    );
  };

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------
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

  if (!request) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Box
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
            p={10}
            textAlign="center"
          >
            <Text color="gray.500">Upgrade request not found.</Text>
            <Button mt={4} onClick={() => navigate("/admin/upgrade-requests")}>
              Back to list
            </Button>
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  const canAct = request.status === "PENDING" || request.status === "CONTACTED";
  const canMarkContacted = request.status === "PENDING";

  // Info card helper
  const InfoRow = ({ label, value, mono = false }) => (
    <Flex
      justify="space-between"
      align="flex-start"
      py={3}
      borderBottom="1px solid"
      borderColor="gray.50"
    >
      <Text fontSize="13px" color="gray.500" fontWeight="600" minW="140px">
        {label}
      </Text>
      <Text
        fontSize="13px"
        color="#333"
        fontWeight="600"
        textAlign="right"
        fontFamily={mono ? "mono" : "inherit"}
        wordBreak="break-word"
      >
        {value ?? "—"}
      </Text>
    </Flex>
  );

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
            display="flex"
            alignItems="center"
            _hover={{ color: primaryMaroon }}
            onClick={() => navigate("/admin/upgrade-requests")}
          >
            <Text color="gray.600">Upgrade Requests</Text>
          </Box>
          <LuChevronRight size={13} />
          <Text color="gray.600">#{request.id}</Text>
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
              Upgrade Request #{request.id}
            </Text>
            <HStack spacing={3}>
              <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
                {request.church_name || "Church"}
              </Heading>
              {statusBadge(request.status)}
            </HStack>
            <Text color="gray.500" fontSize="sm">
              {request.current_package || request.current_package_name || "—"} →{" "}
              <Text as="span" fontWeight="700" color="#1a1a2e">
                {request.requested_package_name || "—"}
              </Text>
            </Text>
          </VStack>
          <Button
            variant="outline"
            borderColor="gray.200"
            color="gray.600"
            borderRadius="lg"
            size="md"
            leftIcon={<LuChevronLeft size={16} />}
            onClick={() => navigate("/admin/upgrade-requests")}
            _hover={{ bg: "gray.50", borderColor: primaryMaroon, color: primaryMaroon }}
          >
            Back to list
          </Button>
        </Flex>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={5}>
          {/* ================= LEFT COLUMN ================= */}
          <GridItem>
            <VStack spacing={5} align="stretch">
              {/* Package change card */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6}>
                <HStack mb={4} spacing={2}>
                  <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuPackage} boxSize={4} />
                  </Circle>
                  <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
                    Package Change
                  </Heading>
                </HStack>
                <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
                  <Box
                    flex="1"
                    minW="140px"
                    p={4}
                    bg="gray.50"
                    borderRadius="lg"
                    border="1px dashed"
                    borderColor="gray.200"
                  >
                    <Text fontSize="xs" color="gray.400" fontWeight="700" textTransform="uppercase" mb={1}>
                      Current
                    </Text>
                    <Text fontSize="md" fontWeight="700" color="#333">
                      {request.current_package || request.current_package_name || "—"}
                    </Text>
                  </Box>
                  <Icon as={LuChevronRight} color="gray.400" boxSize={5} />
                  <Box
                    flex="1"
                    minW="140px"
                    p={4}
                    bg="rgba(174,32,80,0.04)"
                    borderRadius="lg"
                    border="1px dashed"
                    borderColor="rgba(174,32,80,0.3)"
                  >
                    <Text fontSize="xs" color={primaryMaroon} fontWeight="700" textTransform="uppercase" mb={1}>
                      Requested
                    </Text>
                    <Text fontSize="md" fontWeight="700" color="#1a1a2e">
                      {request.requested_package_name || "—"}
                    </Text>
                  </Box>
                </Flex>

                <Separator my={5} />

                <InfoRow label="Billing Cycle" value={request.billing_cycle} />
                <InfoRow
                  label="Requested Capacity"
                  value={
                    request.requested_capacity
                      ? `${request.requested_capacity} members`
                      : "Package default"
                  }
                />
                <InfoRow
                  label="Quoted Amount"
                  value={request.amount != null ? money(request.amount) : "Not quoted"}
                  mono
                />
              </Box>

              {/* Contact card */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6}>
                <HStack mb={4} spacing={2}>
                  <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuUser} boxSize={4} />
                  </Circle>
                  <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
                    Contact Information
                  </Heading>
                </HStack>
                <InfoRow
                  label={
                    <HStack spacing={1}>
                      <LuUser size={13} /> <span>Contact Person</span>
                    </HStack>
                  }
                  value={request.contact_person}
                />
                <InfoRow
                  label={
                    <HStack spacing={1}>
                      <LuPhone size={13} /> <span>Mobile</span>
                    </HStack>
                  }
                  value={request.mobile}
                  mono
                />
                <InfoRow
                  label={
                    <HStack spacing={1}>
                      <LuMail size={13} /> <span>Email</span>
                    </HStack>
                  }
                  value={request.email}
                  mono
                />
                <InfoRow label="Preferred Contact" value={request.preferred_contact} />
                <InfoRow
                  label={
                    <HStack spacing={1}>
                      <LuCalendar size={13} /> <span>Preferred Date</span>
                    </HStack>
                  }
                  value={fmtDate(request.preferred_date)}
                />
                {request.reason && (
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      fontWeight="700"
                      textTransform="uppercase"
                      mb={2}
                    >
                      Requirements / Message
                    </Text>
                    <Text fontSize="13px" color="#333" whiteSpace="pre-wrap">
                      {request.reason}
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Linked bill (if approved) */}
              {request.linked_bill && (
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6}>
                  <HStack mb={4} spacing={2}>
                    <Circle size="32px" bg="rgba(56,161,105,0.10)" color="#2f855a">
                      <Icon as={LuReceipt} boxSize={4} />
                    </Circle>
                    <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
                      Generated Bill
                    </Heading>
                  </HStack>
                  <InfoRow label="Bill ID" value={`#${request.linked_bill}`} mono />
                  <InfoRow
                    label="Amount"
                    value={request.amount != null ? money(request.amount) : "—"}
                    mono
                  />
                  <Button
                    mt={4}
                    size="sm"
                    variant="outline"
                    borderColor={primaryMaroon}
                    color={primaryMaroon}
                    leftIcon={<LuReceipt size={14} />}
                    onClick={() => navigate(`/admin/payments/view/${request.linked_bill}`)}
                    _hover={{ bg: "rgba(174,32,80,0.04)" }}
                  >
                    Open Bill
                  </Button>
                </Box>
              )}
            </VStack>
          </GridItem>

          {/* ================= RIGHT COLUMN ================= */}
          <GridItem>
            <VStack spacing={5} align="stretch">
              {/* Status + actions card */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6}>
                <Heading fontSize="lg" fontWeight="700" color="#1a1a2e" mb={4}>
                  Status & Actions
                </Heading>

                <HStack spacing={2} mb={4} flexWrap="wrap">
                  {request.status === "PENDING" && <Icon as={LuClock} color="#c05621" boxSize={5} />}
                  {request.status === "CONTACTED" && <Icon as={LuClock} color="#2b6cb0" boxSize={5} />}
                  {request.status === "APPROVED" && <Icon as={LuCircleCheck} color="#2f855a" boxSize={5} />}
                  {request.status === "REJECTED" && <Icon as={LuCircleX} color="#c53030" boxSize={5} />}
                  {statusBadge(request.status)}
                </HStack>

                <Separator mb={4} />

                <InfoRow label="Created" value={fmtDateTime(request.created_at)} />
                <InfoRow label="Reviewed At" value={fmtDateTime(request.reviewed_at)} />
                <InfoRow label="Reviewed By" value={request.reviewed_by} />

                {/* Admin note editor */}
                {canAct && (
                  <Box mt={5}>
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      fontWeight="700"
                      textTransform="uppercase"
                      mb={2}
                    >
                      Admin Note (optional)
                    </Text>
                    <Textarea
                      size="sm"
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Reason, notes from the call, etc."
                      borderRadius="lg"
                      bg="gray.50"
                      fontSize="13px"
                      _focus={{ bg: "white", borderColor: primaryMaroon }}
                    />
                  </Box>
                )}

                {/* Action buttons */}
                {canAct ? (
                  <VStack spacing={2} mt={5} align="stretch">
                    {canMarkContacted && (
                      <Button
                        leftIcon={<LuPhone size={15} />}
                        onClick={handleMarkContacted}
                        isLoading={actionLoading === "contacted"}
                        isDisabled={!!actionLoading}
                        bg="blue.500"
                        color="white"
                        _hover={{ bg: "blue.600" }}
                        borderRadius="lg"
                      >
                        Mark as Contacted
                      </Button>
                    )}
                    <Button
                      leftIcon={<LuCheck size={15} />}
                      onClick={handleApprove}
                      isLoading={actionLoading === "approve"}
                      isDisabled={!!actionLoading}
                      bg="#38a169"
                      color="white"
                      _hover={{ bg: "#2f855a" }}
                      borderRadius="lg"
                    >
                      Approve & Generate Bill
                    </Button>
                    {!showRejectBox ? (
                      <Button
                        leftIcon={<LuX size={15} />}
                        variant="outline"
                        borderColor="red.300"
                        color="red.500"
                        onClick={() => setShowRejectBox(true)}
                        isDisabled={!!actionLoading}
                        _hover={{ bg: "red.50" }}
                        borderRadius="lg"
                      >
                        Reject Request
                      </Button>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        <Text fontSize="xs" color="gray.500">
                          Optional reason will be stored in admin note.
                        </Text>
                        <HStack>
                          <Button
                            size="sm"
                            variant="outline"
                            flex="1"
                            onClick={() => setShowRejectBox(false)}
                            isDisabled={!!actionLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            flex="1"
                            leftIcon={<LuX size={14} />}
                            onClick={handleReject}
                            isLoading={actionLoading === "reject"}
                            isDisabled={!!actionLoading}
                          >
                            Confirm Reject
                          </Button>
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                ) : (
                  <Box mt={5} p={4} bg="gray.50" borderRadius="lg" textAlign="center">
                    <Text fontSize="13px" color="gray.500">
                      No actions available — request is{" "}
                      <Text as="span" fontWeight="700" color="#333">
                        {request.status.toLowerCase()}
                      </Text>
                      .
                    </Text>
                  </Box>
                )}

                {request.admin_note && !canAct && (
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      fontWeight="700"
                      textTransform="uppercase"
                      mb={2}
                    >
                      Admin Note
                    </Text>
                    <Text fontSize="13px" color="#333" whiteSpace="pre-wrap">
                      {request.admin_note}
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Status history card */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6}>
                <HStack mb={4} spacing={2}>
                  <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuCircleArrowUp} boxSize={4} />
                  </Circle>
                  <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
                    Timeline
                  </Heading>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  <HStack align="start" spacing={3}>
                    <Circle size="8px" bg="gray.400" mt={1.5} />
                    <Box flex="1">
                      <Text fontSize="13px" fontWeight="600" color="#333">
                        Created
                      </Text>
                      <Text fontSize="12px" color="gray.500">
                        {fmtDateTime(request.created_at)}
                      </Text>
                    </Box>
                  </HStack>
                  {request.reviewed_at && (
                    <HStack align="start" spacing={3}>
                      <Circle
                        size="8px"
                        bg={
                          request.status === "APPROVED"
                            ? "#38a169"
                            : request.status === "REJECTED"
                            ? "#e53e3e"
                            : "#2b6cb0"
                        }
                        mt={1.5}
                      />
                      <Box flex="1">
                        <Text fontSize="13px" fontWeight="600" color="#333">
                          {request.status === "APPROVED"
                            ? "Approved"
                            : request.status === "REJECTED"
                            ? "Rejected"
                            : "Contacted"}
                        </Text>
                        <Text fontSize="12px" color="gray.500">
                          {fmtDateTime(request.reviewed_at)}
                          {request.reviewed_by ? ` · ${request.reviewed_by}` : ""}
                        </Text>
                      </Box>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default UpgradeRequestDetailPage;