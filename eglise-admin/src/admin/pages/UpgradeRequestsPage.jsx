import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Icon,
  Table,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { LuEye, LuCheck, LuX } from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/adminApi";
import { toaster } from "../../components/ui/toaster";

const UpgradeRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const primaryMaroon = "var(--primary-maroon)";
  const lightGray = "var(--light-gray)";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUpgradeRequests();
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching upgrade requests:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load upgrade requests.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.approveUpgradeRequest(id);
      toaster.create({
        title: "Success",
        description: "Upgrade request approved.",
        type: "success",
        duration: 3000,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toaster.create({
        title: "Error",
        description: "Failed to approve request.",
        type: "error",
        duration: 4000,
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await adminApi.rejectUpgradeRequest(id);
      toaster.create({
        title: "Success",
        description: "Upgrade request rejected.",
        type: "success",
        duration: 3000,
      });
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toaster.create({
        title: "Error",
        description: "Failed to reject request.",
        type: "error",
        duration: 4000,
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <AdminLayout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading fontSize="2xl" fontWeight="800" color="#333">
              Upgrade Requests
            </Heading>
            <Text color={lightGray} fontSize="sm">
              Manage package upgrade requests from churches
            </Text>
          </VStack>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        ) : (
          <Box overflowX="auto" bg="white" borderRadius="2xl" p={5} boxShadow="sm">
            <Table.Root size="sm">
              <Table.Header bg="gray.50">
                <Table.Row>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray}>Church</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray}>Current Package</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray}>Billing Cycle</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray}>Amount</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray}>Requested</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="700" color={lightGray} textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <Table.Row key={req.id} _hover={{ bg: "gray.50" }}>
                      <Table.Cell fontWeight="600" color="#333">{req.church_name}</Table.Cell>
                      <Table.Cell>{req.current_package || "N/A"}</Table.Cell>
                      <Table.Cell>{req.billing_cycle}</Table.Cell>
                      <Table.Cell fontWeight="600">{formatCurrency(req.amount)}</Table.Cell>
                      <Table.Cell color={lightGray}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A"}
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <HStack spacing={2} justify="flex-end">
                          <Button size="xs" variant="ghost" color="blue.500" leftIcon={<Icon as={LuEye} />}>
                            View
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="green"
                            leftIcon={<Icon as={LuCheck} />}
                            onClick={() => handleApprove(req.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<Icon as={LuX} />}
                            onClick={() => handleReject(req.id)}
                          >
                            Reject
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" color={lightGray} py={8}>
                      No upgrade requests found
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
};

export default UpgradeRequestsPage;