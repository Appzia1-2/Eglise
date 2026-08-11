// src/admin/pages/BillDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Flex,
  Spinner,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { LuArrowLeft, LuCheck } from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const BillDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const primaryMaroon = "#ae2050";

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getBillDetail(id);
      setBill(data.data || data);
    } catch (error) {
      console.error("Error fetching bill:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load bill details.",
        type: "error",
        duration: 4000,
      });
      navigate("/admin/bills");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    try {
      await adminApi.markBillPaid(id);
      toaster.create({
        title: "Success",
        description: "Bill marked as paid. Church activated.",
        type: "success",
        duration: 3000,
      });
      fetchBill();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to mark bill as paid.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PAID: { color: "green", label: "PAID", bg: "green.50" },
      UNPAID: { color: "red", label: "UNPAID", bg: "red.50" },
      PENDING: { color: "orange", label: "PENDING", bg: "orange.50" },
      EXPIRED: { color: "gray", label: "EXPIRED", bg: "gray.50" },
    };
    const s = statusMap[status] || statusMap.UNPAID;
    return (
      <Badge
        colorScheme={s.color}
        fontSize="lg"
        px={6}
        py={2}
        borderRadius="full"
        bg={s.bg}
        color={`${s.color}.700`}
        border="2px solid"
        borderColor={`${s.color}.200`}
      >
        {s.label}
      </Badge>
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

  if (!bill) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Text>Bill not found</Text>
        </Container>
      </AdminLayout>
    );
  }

  const breakdownItems = bill.breakdown?.items || bill.breakdown?.line_items || [];
  const grandTotal = bill.breakdown?.grand_total || bill.amount || 0;
  const firstItem = breakdownItems[0] || {};

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/bills")}
          mb={4}
          leftIcon={<LuArrowLeft />}
        >
          Back to Bills
        </Button>

        {/* Main Card */}
        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          boxShadow="md"
        >
          {/* Header */}
          <Box
            p={6}
            borderBottom="1px solid"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="lg" color="gray.800">
                  Invoice No: <Text as="span" color={primaryMaroon}>EG-INV-{String(bill.id).padStart(4, '0')}</Text>
                </Heading>
                <Text color="gray.600" fontSize="sm" mt={2}>
                  Bill To: <Text as="span" fontWeight="600">{bill.church_name}</Text>
                </Text>
                <Text color="gray.500" fontSize="sm">
                  Billing Address: {bill.church_address || "N/A"}
                </Text>
              </Box>
              <Box textAlign="right">
                {getStatusBadge(bill.status)}
              </Box>
            </Flex>
          </Box>

          {/* Body */}
          <Box p={6}>
            {/* Meta Information - Row 1 */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} mb={4}>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Bill Type</Text>
                <Text fontWeight="600" fontSize="md">{bill.bill_type || "NEW"}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Billing Cycle</Text>
                <Text fontWeight="600" fontSize="md">{bill.billing_cycle || "N/A"}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Duration</Text>
                <Text fontWeight="600" fontSize="md">
                  {bill.bill_type === "UPGRADE" 
                    ? firstItem.remaining_months || bill.duration_months 
                    : firstItem.months || bill.duration_months} months
                </Text>
              </GridItem>
            </Grid>

            {/* Meta Information - Row 2 */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} mb={4}>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Total Members</Text>
                <Text fontWeight="600" fontSize="md">
                  {bill.bill_type === "UPGRADE" 
                    ? bill.breakdown?.apply?.custom_capacity || firstItem.capacity || "N/A"
                    : firstItem.capacity || "N/A"}
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">
                  {bill.bill_type === "UPGRADE" ? "Upgrade Rate" : "Rate"} (per member)
                </Text>
                <Text fontWeight="600" fontSize="md">
                  ${bill.bill_type === "UPGRADE" 
                    ? parseFloat(firstItem.upgrade_rate || 0).toFixed(2)
                    : parseFloat(firstItem.rate || 0).toFixed(2)}
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Created At</Text>
                <Text fontWeight="600" fontSize="md">{new Date(bill.created_at).toLocaleString()}</Text>
              </GridItem>
            </Grid>

            {bill.paid_at && (
              <Grid templateColumns="1fr" mb={4}>
                <GridItem>
                  <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Paid At</Text>
                  <Text fontWeight="600" fontSize="md">{new Date(bill.paid_at).toLocaleString()}</Text>
                </GridItem>
              </Grid>
            )}

            {/* Separator */}
            <Box borderBottom="1px solid" borderColor="gray.200" my={6} />

            {/* Bill Breakdown */}
            <Heading size="md" mb={4}>Bill Breakdown</Heading>

            {breakdownItems.length === 0 ? (
              <Box p={4} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                <Text color="yellow.700">No line items recorded for this bill.</Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
                  <Box as="thead" bg="gray.50">
                    <Box as="tr">
                      <Box as="th" px={4} py={3} textAlign="left" fontSize="sm" fontWeight="700" color="gray.600">
                        Description
                      </Box>
                      <Box as="th" px={4} py={3} textAlign="left" fontSize="sm" fontWeight="700" color="gray.600">
                        Details
                      </Box>
                      <Box as="th" px={4} py={3} textAlign="right" fontSize="sm" fontWeight="700" color="gray.600">
                        Amount ($)
                      </Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {breakdownItems.map((item, index) => (
                      <Box as="tr" key={index} borderBottom="1px solid" borderColor="gray.100">
                        <Box as="td" px={4} py={3} fontWeight="600">
                          {item.type === "NEW" ? "New Subscription" : 
                           item.type === "UPGRADE" ? "Upgrade" : 
                           item.type || "Line Item"}
                        </Box>
                        <Box as="td" px={4} py={3}>
                          {item.type === "NEW" && (
                            <Box>
                              <Text fontSize="sm">Members: {item.capacity}</Text>
                              <Text fontSize="sm">Rate: ${parseFloat(item.rate || 0).toFixed(2)} per member</Text>
                              <Text fontSize="sm">Duration: {item.months} months</Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Calculation: {item.calculation || `${item.rate} × ${item.capacity} × ${item.months}`}
                              </Text>
                            </Box>
                          )}
                          {item.type === "UPGRADE" && (
                            <Box>
                              <Text fontSize="sm">Remaining months: {item.remaining_months || item.remaining_days || "N/A"}</Text>
                              <Text fontSize="sm">Upgrade Rate: ${parseFloat(item.upgrade_rate || 0).toFixed(2)}</Text>
                              {item.explanation && (
                                <Text fontSize="xs" color="gray.500" mt={1}>{item.explanation}</Text>
                              )}
                              {item.credit && item.credit > 0 && (
                                <Text fontSize="sm" color="green.600">Credit Applied: -${parseFloat(item.credit).toFixed(2)}</Text>
                              )}
                            </Box>
                          )}
                        </Box>
                        <Box as="td" px={4} py={3} textAlign="right" fontWeight="bold">
                          ${parseFloat(item.total || item.amount || 0).toFixed(2)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Grand Total */}
            <Flex justify="flex-end" mt={6}>
              <Box textAlign="right">
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="600">Total Payable</Text>
                <Heading size="xl" color="green.600">
                  ${parseFloat(grandTotal).toFixed(2)}
                </Heading>
              </Box>
            </Flex>
          </Box>

          {/* Footer */}
          <Box
            p={4}
            borderTop="1px solid"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/churches/${bill.church_id}`)}
                leftIcon={<LuArrowLeft />}
              >
                Back to Church
              </Button>

              {(bill.status === "UNPAID" || bill.status === "PENDING") && (
                <Button
                  colorScheme="green"
                  size="lg"
                  leftIcon={<LuCheck />}
                  onClick={handleMarkPaid}
                  isLoading={isMarkingPaid}
                  loadingText="Processing..."
                >
                  Mark as Paid & Activate
                </Button>
              )}
            </Flex>
          </Box>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default BillDetailPage;