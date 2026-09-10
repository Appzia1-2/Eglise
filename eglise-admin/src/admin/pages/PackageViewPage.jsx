// src/admin/pages/PackageViewPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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
  Flex,
  Circle,
  Spinner,
  Grid,
  GridItem,
  Menu,
  ProgressRoot,
  ProgressTrack,
  ProgressRange,
} from "@chakra-ui/react";

import {
  LuChevronRight,
  LuChevronDown,
  LuBox,
  LuTag,
  LuFileText,
  LuCircleCheck,
  LuIndianRupee,
  LuCalendarDays,
  LuChurch,
  LuSearch,
  LuPencil,
  LuUsers,
  LuRefreshCw,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/adminApi";

/* --------------------------------------------------
   Design Tokens
-------------------------------------------------- */

const COLORS = {
  primaryMaroon: "#ae2050",
  darkNavy: "#182338",
  mutedText: "#60708C",
  border: "#DCE2EA",
  white: "#FFFFFF",
  softPink: "#FCE9EF",
  green: "#16805C",
  greenBg: "#E8F7F0",
  red: "#C62828",
};

/* --------------------------------------------------
   Formatting Helpers
-------------------------------------------------- */

const money = (value) => {
  if (value === null || value === undefined || value === "") {
    return "₹0";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `₹${value}`;
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatLimit = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return "Unlimited";
  }

  const number = Number(value);

  if (!Number.isNaN(number)) {
    return number.toLocaleString("en-IN");
  }

  return String(value);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* --------------------------------------------------
   Response Helpers
-------------------------------------------------- */

const unwrapObject = (response) => {
  if (!response) return null;

  let data = response;

  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    data = data.data;
  }

  if (data?.package && typeof data.package === "object") {
    data = data.package;
  }

  if (data?.package_detail && typeof data.package_detail === "object") {
    data = data.package_detail;
  }

  if (data?.result && typeof data.result === "object" && !Array.isArray(data.result)) {
    data = data.result;
  }

  return data;
};

const extractArray = (response) => {
  if (!response) return [];

  if (Array.isArray(response)) return response;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.results)) return response.data.results;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.result)) return response.result;
  if (Array.isArray(response.items)) return response.items;

  return [];
};

/* --------------------------------------------------
   Small Building Blocks
-------------------------------------------------- */

const StatusBadge = ({ active }) => (
  <Badge
    display="inline-flex"
    alignItems="center"
    px={2.5}
    py={0.5}
    borderRadius="full"
    fontSize="11px"
    fontWeight="700"
    bg={active ? COLORS.greenBg : "#FDECEC"}
    color={active ? COLORS.green : COLORS.red}
    textTransform="none"
  >
    {active ? "Active" : "Inactive"}
  </Badge>
);

const Card = ({ children, ...rest }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor={COLORS.border}
    borderRadius="12px"
    p={5}
    {...rest}
  >
    {children}
  </Box>
);

const DetailRow = ({ icon, label, value, valueNode }) => (
  <Flex
    align="center"
    justify="space-between"
    gap={4}
    py={2.5}
    borderBottom="1px solid"
    borderColor="#EEF1F5"
    _last={{ borderBottom: "none" }}
  >
    <HStack spacing={2.5} minW={0}>
      <Circle size="30px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
        {icon}
      </Circle>
      <Text fontSize="13px" color={COLORS.mutedText} fontWeight="500" noOfLines={1}>
        {label}
      </Text>
    </HStack>

    {valueNode || (
      <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="600" textAlign="right">
        {value ?? "-"}
      </Text>
    )}
  </Flex>
);

const PricingRow = ({ icon, label, sublabel, value }) => (
  <Flex align="center" justify="space-between" gap={4} py={2.5}>
    <HStack spacing={3}>
      <Circle size="36px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
        {icon}
      </Circle>
      <Box>
        <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="600">
          {label}
        </Text>
        <Text fontSize="11px" color={COLORS.mutedText} mt={0.5}>
          {sublabel}
        </Text>
      </Box>
    </HStack>

    <Text fontSize="20px" color={COLORS.primaryMaroon} fontWeight="700">
      {value}
    </Text>
  </Flex>
);

/* --------------------------------------------------
   Main Component
-------------------------------------------------- */

const PackageViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [packageData, setPackageData] = useState(location.state?.package || null);
  const [isLoading, setIsLoading] = useState(true);
  const [churchSearch, setChurchSearch] = useState("");
  const [subscriptionData, setSubscriptionData] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadPackage = async () => {
      if (!id) {
        if (mounted) setIsLoading(false);
        return;
      }

      if (mounted) setIsLoading(true);

      try {
        const response = await adminApi.getPackageDetail(id);
        const data = unwrapObject(response);

        if (mounted) {
          if (data && typeof data === "object" && !Array.isArray(data)) {
            setPackageData(data);
          } else if (location.state?.package) {
            setPackageData(location.state.package);
          }
        }
      } catch (error) {
        console.error(
          "Error loading package detail:",
          error?.response?.data || error?.message || error
        );

        if (mounted && location.state?.package) {
          setPackageData(location.state.package);
        } else if (mounted) {
          setPackageData(null);
        }
      }

      try {
        const subscriptionsResponse = await adminApi.getSubscriptions();
        const subscriptions = extractArray(subscriptionsResponse);

        if (mounted) setSubscriptionData(subscriptions);
      } catch (error) {
        console.warn(
          "Could not load subscriptions:",
          error?.response?.data || error?.message || error
        );

        if (mounted) setSubscriptionData([]);
      }

      if (mounted) setIsLoading(false);
    };

    loadPackage();

    return () => {
      mounted = false;
    };
  }, [id]);

  const packageItem = useMemo(() => {
    if (!packageData) return {};

    if (packageData.package && typeof packageData.package === "object") {
      return packageData.package;
    }

    if (packageData.package_detail && typeof packageData.package_detail === "object") {
      return packageData.package_detail;
    }

    return packageData;
  }, [packageData]);

  const subscribedChurches = useMemo(() => {
    const directSources = [
      packageItem?.subscribed_churches,
      packageItem?.churches,
      packageItem?.subscriptions,
      packageItem?.subscribedChurches,
    ];

    for (const source of directSources) {
      if (Array.isArray(source) && source.length > 0) return source;
    }

    if (Array.isArray(subscriptionData)) {
      return subscriptionData.filter((subscription) => {
        if (!subscription) return false;

        const packageId =
          subscription?.package_id ??
          subscription?.package?.id ??
          subscription?.package_detail?.id ??
          subscription?.packageId;

        return String(packageId) === String(id);
      });
    }

    return [];
  }, [packageItem, subscriptionData, id]);

  const recentActivities = useMemo(() => {
    const source =
      packageItem?.recent_activity ||
      packageItem?.activity ||
      packageItem?.recent_activities ||
      packageItem?.activities ||
      [];

    return Array.isArray(source) ? source : [];
  }, [packageItem]);

  const packageName = packageItem?.name || packageItem?.package_name || "Package";
  const packageCode = packageItem?.code || packageItem?.package_code || `PKG-${id}`;
  const packageActive = packageItem?.is_active ?? packageItem?.active ?? true;

  const memberLimit =
    packageItem?.member_limit ??
    packageItem?.capacity ??
    packageItem?.max_members ??
    packageItem?.maximum_members ??
    null;

  const monthlyRate =
    packageItem?.rate_per_member_monthly ??
    packageItem?.monthly_rate ??
    packageItem?.monthly_price ??
    null;

  const yearlyRate =
    packageItem?.rate_per_member_yearly ??
    packageItem?.yearly_rate ??
    packageItem?.yearly_price ??
    null;

  const utilization =
    packageItem?.utilization_percentage ?? packageItem?.member_utilization ?? null;

  const backendChurchCount =
    packageItem?.church_count ??
    packageItem?.subscribed_church_count ??
    packageItem?.churches_count ??
    packageItem?.churchesCount ??
    0;

  const churchCount =
    subscribedChurches.length > 0
      ? subscribedChurches.length
      : Number(backendChurchCount) || 0;

  const canEdit = packageItem?.can_edit !== false;

  const parsedUtilization =
    utilization !== null && utilization !== undefined && utilization !== ""
      ? Math.max(0, Math.min(100, Number(utilization) || 0))
      : null;

  const filteredChurches = useMemo(() => {
    const search = churchSearch.trim().toLowerCase();

    if (!search) return subscribedChurches;

    return subscribedChurches.filter((church) => {
      const churchData = church?.church || church?.church_detail || church?.churchData || church;

      const name = churchData?.name || church?.church_name || church?.name || "";
      const code = church?.church_code || churchData?.code || church?.code || "";

      return (
        String(name).toLowerCase().includes(search) ||
        String(code).toLowerCase().includes(search)
      );
    });
  }, [subscribedChurches, churchSearch]);

  const activityIcon = (activity) => {
    const type = String(
      activity?.type || activity?.activity_type || activity?.action || ""
    ).toUpperCase();

    if (type.includes("PRICING") || type.includes("RATE"))
      return <LuIndianRupee size={15} strokeWidth={2} />;
    if (type.includes("CHURCH")) return <LuChurch size={15} strokeWidth={2} />;
    if (type.includes("MEMBER") || type.includes("CAPACITY"))
      return <LuUsers size={15} strokeWidth={2} />;
    if (type.includes("PACKAGE")) return <LuBox size={15} strokeWidth={2} />;

    return <LuRefreshCw size={15} strokeWidth={2} />;
  };

  const getActivityTitle = (activity) =>
    activity?.title ||
    activity?.description ||
    activity?.message ||
    activity?.action_display ||
    "Package activity";

  const getActivityActor = (activity) =>
    activity?.actor || activity?.performed_by || activity?.user || "";

  const getActivityDate = (activity) =>
    activity?.created_at || activity?.created || activity?.timestamp || activity?.date;

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="1400px" px={{ base: 4, md: 6 }} py={6}>
          <Flex minH="55vh" align="center" justify="center">
            <VStack spacing={3}>
              <Spinner size="lg" thickness="3px" color={COLORS.primaryMaroon} />
              <Text fontSize="13px" color={COLORS.mutedText}>
                Loading package details...
              </Text>
            </VStack>
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  if (!packageItem || Object.keys(packageItem).length === 0) {
    return (
      <AdminLayout>
        <Container maxW="1400px" px={{ base: 4, md: 6 }} py={6}>
          <Flex minH="55vh" align="center" justify="center">
            <VStack spacing={4}>
              <Circle size="70px" bg={COLORS.softPink} color={COLORS.primaryMaroon}>
                <LuBox size={20} strokeWidth={2} />
              </Circle>
              <Heading fontSize="20px" color={COLORS.darkNavy}>
                Package not found
              </Heading>
              <Text fontSize="13px" color={COLORS.mutedText} textAlign="center">
                The package you are looking for could not be found.
              </Text>
              <Button
                size="sm"
                bg={COLORS.primaryMaroon}
                color="white"
                _hover={{ bg: "#951B45" }}
                onClick={() => navigate("/package")}
              >
                Back to Packages
              </Button>
            </VStack>
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="1400px" px={{ base: 4, md: 6 }} py={5}>
        {/* Breadcrumb */}

        <HStack spacing={1.5} mb={4} fontSize="12px" color={COLORS.mutedText}>
          <Text
            cursor="pointer"
            _hover={{ color: COLORS.primaryMaroon }}
            onClick={() => navigate("/package")}
          >
            Packages
          </Text>
          <LuChevronRight size={13} color="#AAB3BF" />
          <Text color={COLORS.darkNavy} fontWeight="600">
            {packageName}
          </Text>
        </HStack>

        {/* Header */}

        <Flex
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={4}
          mb={5}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={COLORS.primaryMaroon}
              letterSpacing="0.03em"
              mb={1}
            >
              PACKAGE PROFILE
            </Text>
            <Heading fontSize={{ base: "24px", md: "28px" }} color={COLORS.darkNavy} fontWeight="800">
              Package Details
            </Heading>
            <Text fontSize="13px" color={COLORS.mutedText} mt={1}>
              View package pricing, capacity and subscribed churches.
            </Text>
          </Box>

          <HStack spacing={2.5}>
            {canEdit && (
              <Button
                size="sm"
                bg={COLORS.primaryMaroon}
                color="white"
                _hover={{ bg: "#951B45" }}
                onClick={() =>
                  navigate(`/package/${id}/edit`, { state: { package: packageItem } })
                }
              >
                <LuPencil size={14} strokeWidth={2} />
                Edit Package
              </Button>
            )}

            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={COLORS.primaryMaroon}
                  color={COLORS.primaryMaroon}
                  _hover={{ bg: COLORS.softPink }}
                >
                  More Actions
                  <LuChevronDown size={14} strokeWidth={2} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="duplicate">Duplicate Package</Menu.Item>
                  <Menu.Item value="deactivate">
                    {packageActive ? "Deactivate Package" : "Activate Package"}
                  </Menu.Item>
                  <Menu.Item value="delete" color={COLORS.red}>
                    Delete Package
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </HStack>
        </Flex>

        {/* Summary Card */}

        <Card mb={5}>
          <Flex
            align="center"
            justify="space-between"
            gap={5}
            direction={{ base: "column", md: "row" }}
          >
            <HStack spacing={4} align="center">
              <Circle size="64px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
                <LuBox size={26} strokeWidth={1.8} />
              </Circle>

              <Box>
                <Heading fontSize="22px" color={COLORS.darkNavy} fontWeight="800">
                  {packageName}
                </Heading>

                <HStack spacing={2.5} mt={1.5}>
                  <Text fontSize="12px" color={COLORS.mutedText}>
                    {packageCode}
                  </Text>
                  <StatusBadge active={Boolean(packageActive)} />
                </HStack>
              </Box>
            </HStack>

            <HStack
              spacing={6}
              borderLeft={{ base: "none", md: "1px solid" }}
              borderColor={COLORS.border}
              pl={{ base: 0, md: 6 }}
              w={{ base: "100%", md: "auto" }}
              justify={{ base: "space-between", md: "flex-end" }}
            >
              <Box textAlign={{ base: "left", md: "right" }}>
                <Text fontSize="34px" color={COLORS.darkNavy} fontWeight="800" lineHeight="1">
                  {churchCount}
                </Text>
                <Text fontSize="12px" color={COLORS.mutedText} mt={1}>
                  Subscribed Churches
                </Text>
              </Box>
            </HStack>
          </Flex>
        </Card>

        {/* Package Information / Pricing / Member Capacity */}

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1.2fr 1fr" }} gap={5} mb={5}>
          {/* Package Information */}

          <GridItem>
            <Card h="100%">
              <Heading fontSize="16px" color={COLORS.darkNavy} fontWeight="700" mb={3}>
                Package Information
              </Heading>

              <VStack spacing={0} align="stretch">
                <DetailRow
                  icon={<LuTag size={15} strokeWidth={2} />}
                  label="Package Code"
                  value={packageCode}
                />
                <DetailRow
                  icon={<LuFileText size={15} strokeWidth={2} />}
                  label="Package Name"
                  value={packageName}
                />
                <DetailRow
                  icon={<LuCircleCheck size={15} strokeWidth={2} />}
                  label="Status"
                  valueNode={<StatusBadge active={Boolean(packageActive)} />}
                />
              </VStack>
            </Card>
          </GridItem>

          {/* Pricing */}

          <GridItem>
            <Card h="100%">
              <Heading fontSize="16px" color={COLORS.darkNavy} fontWeight="700" mb={2}>
                Pricing
              </Heading>

              <VStack spacing={0} align="stretch" divideY="1px" divideColor="#EEF1F5">
                <PricingRow
                  icon={<LuIndianRupee size={17} strokeWidth={2} />}
                  label="Rate per Member (Monthly)"
                  sublabel="Per member / month"
                  value={money(monthlyRate)}
                />
                <PricingRow
                  icon={<LuCalendarDays size={17} strokeWidth={2} />}
                  label="Rate per Member (Yearly)"
                  sublabel="Per member / year"
                  value={money(yearlyRate)}
                />
              </VStack>
            </Card>
          </GridItem>

          {/* Member Capacity */}

          <GridItem>
            <Card h="100%">
              <Heading fontSize="16px" color={COLORS.darkNavy} fontWeight="700" mb={3}>
                Member Capacity
              </Heading>

              <Text fontSize="30px" color={COLORS.darkNavy} fontWeight="800" lineHeight="1">
                {formatLimit(memberLimit)}
              </Text>
              <Text fontSize="12px" color={COLORS.mutedText} mt={1} mb={4}>
                Member Limit
              </Text>

              <ProgressRoot
                value={parsedUtilization !== null ? parsedUtilization : 0}
                size="sm"
                borderRadius="full"
                mb={2}
              >
                <ProgressTrack bg="#EDF0F4" borderRadius="full">
                  <ProgressRange bg={COLORS.primaryMaroon} />
                </ProgressTrack>
              </ProgressRoot>

              <Flex justify="space-between" align="center">
                <Text fontSize="11px" color={COLORS.mutedText}>
                  Average utilization across subscribed churches
                </Text>
                <Text fontSize="12px" color={COLORS.darkNavy} fontWeight="700" flexShrink={0} ml={2}>
                  {parsedUtilization !== null ? `${parsedUtilization}%` : "-"}
                </Text>
              </Flex>
            </Card>
          </GridItem>
        </Grid>

        {/* Subscribed Churches + Recent Activity */}

        <Grid templateColumns={{ base: "1fr", lg: "1.6fr 1fr" }} gap={5} mb={5}>
          {/* Subscribed Churches */}

          <GridItem>
            <Card>
              <Flex align="center" justify="space-between" mb={4}>
                <Heading fontSize="16px" color={COLORS.darkNavy} fontWeight="700">
                  Subscribed Churches
                </Heading>

                <Text
                  fontSize="12px"
                  color={COLORS.primaryMaroon}
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  onClick={() =>
                    navigate("/churches", { state: { packageFilter: id } })
                  }
                >
                  View All {churchCount} Churches
                </Text>
              </Flex>

              <Box position="relative" mb={4}>
                <Box
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                  color={COLORS.mutedText}
                >
                  <LuSearch size={15} strokeWidth={2} />
                </Box>

                <Input
                  value={churchSearch}
                  onChange={(e) => setChurchSearch(e.target.value)}
                  placeholder="Search subscribed churches"
                  size="sm"
                  pl="36px"
                  borderColor={COLORS.border}
                  borderRadius="8px"
                  fontSize="12px"
                  _focus={{
                    borderColor: COLORS.primaryMaroon,
                    boxShadow: `0 0 0 1px ${COLORS.primaryMaroon}`,
                  }}
                />
              </Box>

              {filteredChurches.length > 0 ? (
                <Box overflowX="auto">
                  <Box as="table" width="100%" borderCollapse="collapse">
                    <Box as="thead">
                      <Box as="tr">
                        {["Church", "Code", "Members", "Billing", "Status"].map((heading) => (
                          <Box
                            as="th"
                            key={heading}
                            textAlign="left"
                            px={2}
                            py={2}
                            fontSize="11px"
                            color={COLORS.mutedText}
                            fontWeight="700"
                            borderBottom="1px solid"
                            borderColor="#EEF1F5"
                            whiteSpace="nowrap"
                          >
                            {heading}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Box as="tbody">
                      {filteredChurches.slice(0, 6).map((subscription, index) => {
                        const churchData =
                          subscription?.church ||
                          subscription?.church_detail ||
                          subscription?.churchData ||
                          subscription;

                        const name =
                          churchData?.name ||
                          subscription?.church_name ||
                          subscription?.name ||
                          "Church";

                        const code =
                          subscription?.church_code ||
                          churchData?.code ||
                          subscription?.code ||
                          "-";

                        const members =
                          subscription?.member_count ??
                          subscription?.members_count ??
                          subscription?.members ??
                          churchData?.member_count ??
                          "-";

                        const limit = subscription?.member_limit ?? memberLimit ?? "-";

                        const billing =
                          subscription?.billing_cycle ||
                          subscription?.billing ||
                          subscription?.plan_type ||
                          subscription?.subscription_type ||
                          "-";

                        const subscriptionStatus =
                          subscription?.is_active ??
                          subscription?.active ??
                          String(subscription?.status || "").toUpperCase() === "ACTIVE";

                        return (
                          <Box
                            as="tr"
                            key={subscription?.id || `${code}-${index}`}
                            _hover={{ bg: "#FCF9FB" }}
                          >
                            <Box
                              as="td"
                              px={2}
                              py={2.5}
                              borderBottom="1px solid"
                              borderColor="#EEF1F5"
                            >
                              <HStack spacing={2}>
                                <Circle
                                  size="26px"
                                  bg={COLORS.softPink}
                                  color={COLORS.primaryMaroon}
                                  flexShrink={0}
                                >
                                  <LuChurch size={13} strokeWidth={2} />
                                </Circle>
                                <Text
                                  fontSize="13px"
                                  color={COLORS.darkNavy}
                                  fontWeight="600"
                                  noOfLines={1}
                                >
                                  {name}
                                </Text>
                              </HStack>
                            </Box>

                            <Box
                              as="td"
                              px={2}
                              py={2.5}
                              borderBottom="1px solid"
                              borderColor="#EEF1F5"
                              whiteSpace="nowrap"
                            >
                              <Text fontSize="12px" color={COLORS.mutedText}>
                                {code}
                              </Text>
                            </Box>

                            <Box
                              as="td"
                              px={2}
                              py={2.5}
                              borderBottom="1px solid"
                              borderColor="#EEF1F5"
                              whiteSpace="nowrap"
                            >
                              <Text fontSize="12px" color={COLORS.darkNavy}>
                                {members !== "-"
                                  ? `${Number(members).toLocaleString("en-IN")} / ${formatLimit(
                                      limit
                                    )}`
                                  : "-"}
                              </Text>
                            </Box>

                            <Box
                              as="td"
                              px={2}
                              py={2.5}
                              borderBottom="1px solid"
                              borderColor="#EEF1F5"
                              whiteSpace="nowrap"
                            >
                              <Text fontSize="12px" color={COLORS.darkNavy}>
                                {String(billing).replace(/_/g, " ")}
                              </Text>
                            </Box>

                            <Box
                              as="td"
                              px={2}
                              py={2.5}
                              borderBottom="1px solid"
                              borderColor="#EEF1F5"
                              whiteSpace="nowrap"
                            >
                              <StatusBadge active={Boolean(subscriptionStatus)} />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Flex
                  minH="150px"
                  align="center"
                  justify="center"
                  border="1px dashed"
                  borderColor={COLORS.border}
                  borderRadius="8px"
                  bg="#FCFCFD"
                >
                  <Text fontSize="12px" color={COLORS.mutedText}>
                    {churchSearch ? "No churches found." : "No subscribed churches yet."}
                  </Text>
                </Flex>
              )}
            </Card>
          </GridItem>

          {/* Recent Activity */}

          <GridItem>
            <Card h="100%">
              <Heading fontSize="16px" color={COLORS.darkNavy} fontWeight="700" mb={4}>
                Recent Activity
              </Heading>

              {recentActivities.length > 0 ? (
                <Box position="relative" pl={1}>
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <Flex key={activity?.id || index} gap={3} position="relative" pb={5}>
                      {/* Connector line */}
                      {index < Math.min(recentActivities.length, 5) - 1 && (
                        <Box
                          position="absolute"
                          left="17px"
                          top="36px"
                          bottom="-6px"
                          w="2px"
                          bg="#EEF1F5"
                        />
                      )}

                      <Circle
                        size="34px"
                        bg={COLORS.softPink}
                        color={COLORS.primaryMaroon}
                        flexShrink={0}
                        zIndex={1}
                      >
                        {activityIcon(activity)}
                      </Circle>

                      <Flex flex="1" justify="space-between" align="flex-start" gap={3}>
                        <Box>
                          <Text fontSize="13px" fontWeight="700" color={COLORS.darkNavy}>
                            {getActivityTitle(activity)}
                          </Text>
                          {getActivityActor(activity) && (
                            <Text fontSize="11px" color={COLORS.mutedText} mt={0.5}>
                              {getActivityActor(activity)}
                            </Text>
                          )}
                        </Box>

                        <Text
                          fontSize="11px"
                          color={COLORS.mutedText}
                          whiteSpace="nowrap"
                          flexShrink={0}
                        >
                          {formatDate(getActivityDate(activity))}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Box>
              ) : (
                <Flex
                  minH="150px"
                  align="center"
                  justify="center"
                  border="1px dashed"
                  borderColor={COLORS.border}
                  borderRadius="8px"
                  bg="#FCFCFD"
                >
                  <Text fontSize="12px" color={COLORS.mutedText}>
                    No recent activity.
                  </Text>
                </Flex>
              )}
            </Card>
          </GridItem>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default PackageViewPage;