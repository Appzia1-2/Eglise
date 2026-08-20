// src/admin/pages/SubscriptionDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  Grid,
  GridItem,
  Icon,
  Circle,
  Badge,
  Menu,
  Portal,
  Table,
  Separator,
} from "@chakra-ui/react";
import {
  LuPencil,
  LuChevronDown,
  LuChevronRight,
  LuChurch,
  LuBox,
  LuUsers,
  LuInfo,
  LuFileText,
  LuClock,
  LuHouse,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

const StatusBadge = ({ status }) => {
  const statusMap = {
    PAID: { bg: "green.50", color: "green.600", label: "Paid" },
    UNPAID: { bg: "red.50", color: "red.600", label: "Unpaid" },
    PENDING: { bg: "orange.50", color: "orange.600", label: "Pending" },
    EXPIRED: { bg: "gray.100", color: "gray.600", label: "Expired" },
  };
  const s = statusMap[status] || { bg: "gray.100", color: "gray.600", label: status || "—" };
  return (
    <Badge bg={s.bg} color={s.color} fontSize="11px" fontWeight="600" px={2.5} py={0.5} borderRadius="full">
      {s.label}
    </Badge>
  );
};

// Reusable row for the info cards
const InfoRow = ({ label, value, isLast }) => (
  <Flex
    justify="space-between"
    align="center"
    py={2}
    borderBottom={isLast ? "none" : "1px solid"}
    borderColor="gray.100"
  >
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
    {typeof value === "string" || typeof value === "number" ? (
      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
        {value}
      </Text>
    ) : (
      value
    )}
  </Flex>
);

const SubscriptionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionDetail();
  }, [id]);

  const fetchSubscriptionDetail = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getSubscriptionDetail(id);
      setSubscription(response.data || response);
    } catch (error) {
      console.error("Error fetching subscription detail:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load subscription details.",
        type: "error",
        duration: 4000,
      });
      navigate("/admin/subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (value, options) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-US", options || { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (amount, currency = "INR") => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const billingCycleLabel = (cycle) => (cycle === "MONTHLY" ? "Monthly" : cycle === "YEARLY" ? "Yearly" : cycle || "—");

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <div
              style={{
                border: "4px solid #e2e8f0",
                borderTop: "4px solid #ae2050",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </Flex>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Container>
      </AdminLayout>
    );
  }

  if (!subscription) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="300px">
            <Text color="gray.400">Subscription not found</Text>
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  const rate =
    subscription.billing_cycle === "MONTHLY"
      ? subscription.rate_per_member_monthly
      : subscription.rate_per_member_yearly;

  const activeMembers = subscription.active_members_count ?? 0;
  const memberLimit = subscription.member_limit ?? subscription.custom_capacity ?? 0;
  const usagePercent = memberLimit > 0 ? Math.round((activeMembers / memberLimit) * 100) : 0;
  const slotsAvailable = Math.max(memberLimit - activeMembers, 0);

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        {/* Breadcrumb */}
        <HStack fontSize="xs" color="gray.400" fontWeight="600" mb={2} spacing={1}>
          <Text as={RouterLink} to="/admin/subscriptions" _hover={{ color: primaryMaroon }}>
            Subscriptions
          </Text>
          <Text>/</Text>
          <Text color="gray.500">{subscription.subscription_code || subscription.id}</Text>
        </HStack>

        {/* Title row */}
        <Flex justify="space-between" align="flex-start" mb={4} flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
              Subscription Profile
            </Text>
            <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
              Subscription Details
            </Heading>
            <Text color="gray.500" fontSize="sm">
              View package assignment, pricing and renewal information.
            </Text>
          </VStack>

          <HStack spacing={3}>
            <Button
              bg={primaryMaroon}
              color="white"
              _hover={{ bg: "#8a1a3e" }}
              size="md"
              px={5}
              onClick={() => navigate(`/admin/subscriptions/${id}/edit`)}
            >
              <Icon as={LuPencil} boxSize={4} /> Edit Subscription
            </Button>

            <Menu.Root>
              <Menu.Trigger asChild>
                <Button variant="outline" borderColor="gray.200" color="gray.700" size="md" px={4}>
                  More Actions <Icon as={LuChevronDown} boxSize={4} ml={1} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="renew" onClick={() => {}}>
                      Renew Subscription
                    </Menu.Item>
                    <Menu.Item value="upgrade" onClick={() => {}}>
                      Upgrade Package
                    </Menu.Item>
                    <Menu.Item value="deactivate" color="red.600" onClick={() => {}}>
                      Deactivate
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </HStack>
        </Flex>

        {/* Church + Package banner */}
        <Flex
          bg="rgba(174,32,80,0.05)"
          border="1px solid"
          borderColor="rgba(174,32,80,0.15)"
          borderRadius="xl"
          p={5}
          mb={5}
          align="center"
          gap={6}
          flexWrap="wrap"
        >
          <HStack spacing={4} flex="1" minW="260px">
            <Circle size="56px" bg="rgba(174,32,80,0.1)" color={primaryMaroon}>
              <Icon as={LuChurch} boxSize={6} />
            </Circle>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="800" color="#1a1a2e">
                {subscription.church_name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {subscription.church_code}
              </Text>
              <HStack spacing={2} mt={1}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  {subscription.subscription_code || `SUB-${subscription.id}`}
                </Text>
                <Badge
                  bg={subscription.is_active ? "green.50" : "red.50"}
                  color={subscription.is_active ? "green.600" : "red.600"}
                  fontSize="11px"
                  fontWeight="600"
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                >
                  {subscription.is_active ? "Active" : "Inactive"}
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          <Separator orientation="vertical" height="60px" display={{ base: "none", md: "block" }} />

          <HStack spacing={4} flex="1" minW="220px">
            <Circle size="56px" bg="rgba(174,32,80,0.1)" color={primaryMaroon}>
              <Icon as={LuBox} boxSize={6} />
            </Circle>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="800" color="#1a1a2e">
                {subscription.package_name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Current Package
              </Text>
            </VStack>
          </HStack>
        </Flex>

        {/* Three info cards */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }} gap={4} mb={5}>
          {/* Subscription Information */}
          <GridItem>
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} h="100%">
              <HStack spacing={2.5} mb={3}>
                <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                  <Icon as={LuInfo} boxSize={3.5} />
                </Circle>
                <Text fontWeight="700" color="#1a1a2e" fontSize="sm">
                  Subscription Information
                </Text>
              </HStack>
              <VStack align="stretch" spacing={0}>
                <InfoRow label="Subscription ID" value={subscription.subscription_code || subscription.id} />
                <InfoRow label="Billing Cycle" value={billingCycleLabel(subscription.billing_cycle)} />
                <InfoRow label="Start Date" value={formatDate(subscription.start_date)} />
                <InfoRow label="Renewal Date" value={formatDate(subscription.end_date)} />
                <InfoRow
                  label="Auto Renew"
                  isLast
                  value={
                    <Badge
                      bg={subscription.auto_renew ? "green.50" : "gray.100"}
                      color={subscription.auto_renew ? "green.600" : "gray.500"}
                      fontSize="11px"
                      fontWeight="600"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                    >
                      {subscription.auto_renew ? "On" : "Off"}
                    </Badge>
                  }
                />
              </VStack>
            </Box>
          </GridItem>

          {/* Package & Pricing */}
          <GridItem>
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} h="100%">
              <HStack spacing={2.5} mb={3}>
                <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                  <Icon as={LuBox} boxSize={3.5} />
                </Circle>
                <Text fontWeight="700" color="#1a1a2e" fontSize="sm">
                  Package &amp; Pricing
                </Text>
              </HStack>
              <VStack align="stretch" spacing={0}>
                <InfoRow label="Package" value={subscription.package_name} />
                <InfoRow
                  label={`Rate per Member (${billingCycleLabel(subscription.billing_cycle)})`}
                  value={formatCurrency(rate, subscription.currency)}
                />
                <InfoRow label="Billable Member Limit" value={memberLimit?.toLocaleString()} />
                <InfoRow
                  label="Subscription Amount"
                  value={formatCurrency(subscription.total_price ?? rate * memberLimit, subscription.currency)}
                />
                <InfoRow label="Currency" isLast value={`${subscription.currency || "INR"} (₹)`} />
              </VStack>
            </Box>
          </GridItem>

          {/* Member Usage */}
          <GridItem>
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} h="100%">
              <HStack spacing={2.5} mb={4}>
                <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                  <Icon as={LuUsers} boxSize={3.5} />
                </Circle>
                <Text fontWeight="700" color="#1a1a2e" fontSize="sm">
                  Member Usage
                </Text>
              </HStack>

              <HStack align="baseline" spacing={1} mb={1}>
                <Text fontSize="3xl" fontWeight="800" color="#1a1a2e" lineHeight="1">
                  {activeMembers.toLocaleString()}
                </Text>
                <Text fontSize="lg" color="gray.400" fontWeight="600">
                  / {memberLimit.toLocaleString()}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500" mb={3}>
                Active Members / Member Limit
              </Text>

              <Flex align="center" gap={3}>
                <Box flex="1" bg="rgba(174,32,80,0.12)" borderRadius="full" h="8px" overflow="hidden">
                  <Box
                    h="100%"
                    borderRadius="full"
                    bg={primaryMaroon}
                    width={`${Math.min(usagePercent, 100)}%`}
                    transition="width 0.3s ease"
                  />
                </Box>
                <Text fontSize="sm" fontWeight="700" color={primaryMaroon} flexShrink={0}>
                  {usagePercent}%
                </Text>
              </Flex>

              <Text fontSize="xs" color="gray.500" mt={2}>
                {slotsAvailable.toLocaleString()} member slots available
              </Text>
            </Box>
          </GridItem>
        </Grid>

        {/* Payment History + Recent Activity */}
        <Grid templateColumns={{ base: "1fr", lg: "1.4fr 1fr" }} gap={4}>
          {/* Payment History */}
          <GridItem>
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} h="100%">
              <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={2.5}>
                  <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuFileText} boxSize={3.5} />
                  </Circle>
                  <Text fontWeight="700" color="#1a1a2e" fontSize="sm">
                    Payment History
                  </Text>
                </HStack>
                {subscription.bills && subscription.bills.length > 0 && (
                  <Button
                    variant="ghost"
                    color={primaryMaroon}
                    size="sm"
                    fontSize="xs"
                    fontWeight="600"
                    onClick={() => navigate(`/admin/subscriptions/${id}/payments`)}
                  >
                    View All Payments <Icon as={LuChevronRight} boxSize={3.5} ml={1} />
                  </Button>
                )}
              </Flex>

              {!subscription.bills || subscription.bills.length === 0 ? (
                <Text fontSize="sm" color="gray.400" py={6} textAlign="center">
                  No payments recorded yet.
                </Text>
              ) : (
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader fontSize="xs" color="gray.500">Receipt</Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="gray.500">Billing Period</Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="gray.500">Amount</Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="gray.500">Payment Date</Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" color="gray.500" textAlign="right">
                        Status
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {subscription.bills.map((bill) => (
                      <Table.Row key={bill.id}>
                        <Table.Cell fontSize="sm" fontWeight="600" color="#1a1a2e">
                          {bill.receipt_number || `RCP-${bill.id}`}
                        </Table.Cell>
                        <Table.Cell fontSize="sm" color="gray.600">
                          {bill.billing_period ||
                            `${formatDate(bill.period_start, { month: "short", year: "numeric" })} – ${formatDate(
                              bill.period_end,
                              { month: "short", year: "numeric" }
                            )}`}
                        </Table.Cell>
                        <Table.Cell fontSize="sm" fontWeight="600" color="#1a1a2e">
                          {formatCurrency(bill.amount, subscription.currency)}
                        </Table.Cell>
                        <Table.Cell fontSize="sm" color="gray.600">
                          {formatDate(bill.payment_date)}
                        </Table.Cell>
                        <Table.Cell textAlign="right">
                          <StatusBadge status={bill.status} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </GridItem>

          {/* Recent Activity */}
          <GridItem>
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} h="100%">
              <HStack spacing={2.5} mb={4}>
                <Circle size="32px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                  <Icon as={LuClock} boxSize={3.5} />
                </Circle>
                <Text fontWeight="700" color="#1a1a2e" fontSize="sm">
                  Recent Activity
                </Text>
              </HStack>

              {!subscription.activity_log || subscription.activity_log.length === 0 ? (
                <Text fontSize="sm" color="gray.400" py={6} textAlign="center">
                  No recent activity.
                </Text>
              ) : (
                <VStack align="stretch" spacing={0}>
                  {subscription.activity_log.map((activity, idx) => (
                    <HStack key={activity.id || idx} align="flex-start" spacing={3} pb={4} position="relative">
                      <VStack spacing={0} pt={1}>
                        <Circle size="8px" bg={primaryMaroon} flexShrink={0} />
                        {idx < subscription.activity_log.length - 1 && (
                          <Box width="1.5px" flex="1" bg="gray.200" minH="30px" mt={1} />
                        )}
                      </VStack>
                      <Flex flex="1" justify="space-between" align="flex-start" gap={2}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {activity.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {activity.actor || activity.subtitle}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color="gray.400" flexShrink={0}>
                          {formatDate(activity.timestamp)}
                        </Text>
                      </Flex>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default SubscriptionDetailPage;