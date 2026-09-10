// src/admin/pages/ChurchViewPage.jsx

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
  Badge,
  Flex,
  Circle,
  Spinner,
  Grid,
  GridItem,
  Tabs,
  Menu,
  ProgressRoot,
  ProgressTrack,
  ProgressRange,
} from "@chakra-ui/react";

import {
  LuChevronRight,
  LuChevronDown,
  LuChurch,
  LuBadgeCheck,
  LuUsers,
  LuUserCog,
  LuFileText,
  LuIndianRupee,
  LuInfo,
  LuMail,
  LuPhone,
  LuGlobe,
  LuMapPin,
  LuChartColumn,
  LuClock,
  LuCircleUserRound,
  LuPencil,
  LuCreditCard,
  LuRefreshCw,
  LuUserPlus,
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
  lightBg: "#F7F8FA",
  softPink: "#FCE9EF",
  green: "#16805C",
  greenBg: "#E8F7F0",
  red: "#C62828",
  gold: "#B7791F",
};

/* --------------------------------------------------
   Formatting Helpers
-------------------------------------------------- */

const money = (value, { withCents = false } = {}) => {
  if (value === null || value === undefined || value === "") {
    return "₹0";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `₹${value}`;
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  })}`;
};

const compactMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "₹0";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `₹${value}`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(0)}K`;
  }

  return `₹${number}`;
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

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const daysRemaining = (renewDate) => {
  if (!renewDate) return null;

  const end = new Date(renewDate);

  if (Number.isNaN(end.getTime())) return null;

  const diff = Math.ceil(
    (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return diff;
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

  if (data?.church && typeof data.church === "object") {
    data = data.church;
  }

  if (data?.church_detail && typeof data.church_detail === "object") {
    data = data.church_detail;
  }

  return data;
};

/* --------------------------------------------------
   Small Building Blocks
-------------------------------------------------- */

const StatCard = ({ icon, value, label }) => (
  <HStack spacing={3} minW="0">
    <Circle size="46px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
      {icon}
    </Circle>
    <Box>
      <Text fontSize="20px" fontWeight="700" color={COLORS.darkNavy} lineHeight="1.1">
        {value}
      </Text>
      <Text fontSize="12px" color={COLORS.mutedText} mt="2px">
        {label}
      </Text>
    </Box>
  </HStack>
);

const StatusPill = ({ tone = "green", children, icon }) => {
  const tones = {
    green: { bg: COLORS.greenBg, color: COLORS.green },
    maroon: { bg: COLORS.softPink, color: COLORS.primaryMaroon },
    gray: { bg: "#EEF1F5", color: COLORS.mutedText },
  };

  const s = tones[tone] || tones.green;

  return (
    <Badge
      display="inline-flex"
      alignItems="center"
      gap={1}
      px={2.5}
      py={1}
      borderRadius="full"
      fontSize="11px"
      fontWeight="700"
      bg={s.bg}
      color={s.color}
      textTransform="none"
    >
      {icon}
      {children}
    </Badge>
  );
};

const InfoCard = ({ icon, title, children, action }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor={COLORS.border}
    borderRadius="12px"
    p={4}
    h="100%"
  >
    <Flex align="center" justify="space-between" mb={3.5}>
      <HStack spacing={2.5}>
        <Circle size="28px" bg={COLORS.softPink} color={COLORS.primaryMaroon}>
          {icon}
        </Circle>
        <Heading fontSize="14px" color={COLORS.darkNavy} fontWeight="700">
          {title}
        </Heading>
      </HStack>
      {action}
    </Flex>
    {children}
  </Box>
);

const InfoRow = ({ label, value }) => (
  <Flex justify="space-between" gap={4} py={1.5}>
    <Text fontSize="13px" color={COLORS.mutedText}>
      {label}
    </Text>
    <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="600" textAlign="right">
      {value ?? "-"}
    </Text>
  </Flex>
);

const ContactRow = ({ icon, value, isLink }) => (
  <HStack spacing={2.5} py={1.5}>
    <Box color={COLORS.mutedText} flexShrink={0}>
      {icon}
    </Box>
    <Text
      fontSize="13px"
      color={isLink ? COLORS.primaryMaroon : COLORS.darkNavy}
      fontWeight={isLink ? "600" : "500"}
    >
      {value}
    </Text>
  </HStack>
);

/* --------------------------------------------------
   Main Component
-------------------------------------------------- */

const ChurchViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [churchData, setChurchData] = useState(location.state?.church || null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let mounted = true;

    const loadChurch = async () => {
      if (!id) {
        if (mounted) setIsLoading(false);
        return;
      }

      if (mounted) setIsLoading(true);

      try {
        const response = await adminApi.getChurchDetail(id);
        const data = unwrapObject(response);

        if (mounted) {
          if (data && typeof data === "object") {
            setChurchData(data);
          } else if (location.state?.church) {
            setChurchData(location.state.church);
          }
        }
      } catch (error) {
        console.error(
          "Error loading church detail:",
          error?.response?.data || error?.message || error
        );

        if (mounted && location.state?.church) {
          setChurchData(location.state.church);
        }
      }

      if (mounted) setIsLoading(false);
    };

    loadChurch();

    return () => {
      mounted = false;
    };
  }, [id]);

  const church = useMemo(() => churchData || {}, [churchData]);

  const churchName = church?.name || church?.church_name || "Church";
  const churchCode = church?.code || church?.church_code || `CH-${id}`;
  const city = church?.city || church?.address?.city || "";
  const stateName = church?.state || church?.address?.state || "";
  const isActive = church?.is_active ?? church?.active ?? true;
  const isVerified = church?.is_verified ?? church?.verified ?? false;

  const currentPackage =
    church?.current_package?.name || church?.package_name || church?.package || "-";

  const subscriptionRenewsOn =
    church?.subscription?.renews_on ||
    church?.subscription_renews_on ||
    church?.renews_on;

  const memberCount = church?.member_count ?? church?.members_count ?? 0;
  const adminCount = church?.administrator_count ?? church?.admins_count ?? 0;
  const documentCount = church?.document_count ?? church?.documents_count ?? 0;
  const annualValue = church?.annual_value ?? church?.subscription?.annual_value ?? 0;

  const diocese = church?.diocese || "-";
  const established = church?.established_year || church?.established || "-";
  const registrationNo = church?.registration_no || church?.registration_number || "-";
  const currency = church?.currency || "Indian Rupee (INR)";
  const primaryLanguage = church?.primary_language || "English";
  const timeZone = church?.time_zone || "Asia/Kolkata";

  const email = church?.email || "-";
  const phone = church?.phone || church?.phone_primary || "-";
  const phoneSecondary = church?.phone_secondary || "";
  const website = church?.website || "";

  const addressLine1 = church?.address_line1 || church?.address?.line1 || "";
  const addressLine2 = church?.address_line2 || church?.address?.line2 || "";
  const postalCode = church?.postal_code || church?.address?.postal_code || "";
  const country = church?.country || church?.address?.country || "India";

  const subscriptionPackageName =
    church?.subscription?.package_name || currentPackage;
  const subscriptionStatus = church?.subscription?.is_active ?? isActive;
  const subscriptionAmount =
    church?.subscription?.amount ?? annualValue;
  const subscriptionStartedOn =
    church?.subscription?.started_on || church?.subscription_started_on;
  const remainingDays = daysRemaining(subscriptionRenewsOn);

  const administrators = Array.isArray(church?.administrators)
    ? church.administrators
    : [];

  const recentActivities = Array.isArray(church?.recent_activity)
    ? church.recent_activity
    : Array.isArray(church?.activities)
    ? church.activities
    : [];

  const activityIcon = (type) => {
    const t = String(type || "").toUpperCase();

    if (t.includes("PAYMENT")) return <LuIndianRupee size={14} strokeWidth={2} />;
    if (t.includes("PACKAGE") || t.includes("RENEW"))
      return <LuRefreshCw size={14} strokeWidth={2} />;
    if (t.includes("ADMIN") || t.includes("INVITE"))
      return <LuUserPlus size={14} strokeWidth={2} />;
    if (t.includes("UPDATE")) return <LuPencil size={14} strokeWidth={2} />;

    return <LuClock size={14} strokeWidth={2} />;
  };

  const tabItems = [
    { value: "overview", label: "Overview" },
    { value: "subscription", label: "Subscription" },
    { value: "payments", label: "Payments" },
    { value: "administrators", label: "Administrators" },
    { value: "documents", label: "Documents" },
    { value: "activity", label: "Activity" },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="1400px" px={{ base: 4, md: 6 }} py={6}>
          <Flex minH="55vh" align="center" justify="center">
            <VStack spacing={3}>
              <Spinner size="lg" thickness="3px" color={COLORS.primaryMaroon} />
              <Text fontSize="13px" color={COLORS.mutedText}>
                Loading church details...
              </Text>
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
            onClick={() => navigate("/churches")}
          >
            Churches
          </Text>
          <LuChevronRight size={13} color="#AAB3BF" />
          <Text color={COLORS.darkNavy} fontWeight="600">
            {churchName}
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
              CHURCH PROFILE
            </Text>
            <Heading fontSize={{ base: "24px", md: "28px" }} color={COLORS.darkNavy} fontWeight="800">
              Church Details
            </Heading>
            <Text fontSize="13px" color={COLORS.mutedText} mt={1}>
              View church information, subscription and account activity.
            </Text>
          </Box>

          <HStack spacing={2.5}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={COLORS.border}
                  color={COLORS.darkNavy}
                  _hover={{ borderColor: COLORS.primaryMaroon, color: COLORS.primaryMaroon }}
                >
                  More Actions
                  <LuChevronDown size={14} strokeWidth={2} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="deactivate">Deactivate Church</Menu.Item>
                  <Menu.Item value="export">Export Details</Menu.Item>
                  <Menu.Item value="delete" color={COLORS.red}>
                    Delete Church
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>

            <Button
              size="sm"
              bg={COLORS.primaryMaroon}
              color="white"
              _hover={{ bg: "#951B45" }}
              onClick={() =>
                navigate(`/churches/${id}/edit`, { state: { church } })
              }
            >
              <LuPencil size={14} strokeWidth={2} />
              Edit Church
            </Button>
          </HStack>
        </Flex>

        {/* Profile Summary Card */}

        <Box
          bg="white"
          border="1px solid"
          borderColor={COLORS.border}
          borderRadius="14px"
          p={5}
          mb={5}
        >
          <Flex
            align={{ base: "flex-start", lg: "center" }}
            justify="space-between"
            gap={6}
            direction={{ base: "column", lg: "row" }}
          >
            {/* Identity block */}

            <HStack spacing={4} align="center">
              <Circle size="72px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
                <LuChurch size={28} strokeWidth={1.8} />
              </Circle>

              <Box>
                <Heading fontSize={{ base: "20px", md: "24px" }} color={COLORS.darkNavy} fontWeight="800">
                  {churchName}
                </Heading>

                <HStack spacing={3} mt={2} flexWrap="wrap">
                  <HStack spacing={1.5}>
                    <LuFileText size={13} color={COLORS.mutedText} />
                    <Text fontSize="12px" color={COLORS.mutedText} fontWeight="500">
                      {churchCode}
                    </Text>
                  </HStack>

                  {(city || stateName) && (
                    <HStack spacing={1.5}>
                      <LuMapPin size={13} color={COLORS.mutedText} />
                      <Text fontSize="12px" color={COLORS.mutedText} fontWeight="500">
                        {[city, stateName].filter(Boolean).join(", ")}
                      </Text>
                    </HStack>
                  )}
                </HStack>

                <HStack spacing={2} mt={2.5}>
                  <StatusPill tone={isActive ? "green" : "gray"}>
                    {isActive ? "Active" : "Inactive"}
                  </StatusPill>

                  {isVerified && (
                    <StatusPill tone="green" icon={<LuBadgeCheck size={12} strokeWidth={2.5} />}>
                      Verified
                    </StatusPill>
                  )}
                </HStack>
              </Box>
            </HStack>

            {/* Package + stats block */}

            <Flex
              align="center"
              gap={{ base: 5, xl: 8 }}
              flexWrap="wrap"
              justify={{ base: "flex-start", lg: "flex-end" }}
              w={{ base: "100%", lg: "auto" }}
            >
              <Box>
                <Text fontSize="11px" color={COLORS.mutedText} mb={1.5}>
                  Current Package
                </Text>
                <StatusPill tone="maroon" icon={<LuChartColumn size={12} strokeWidth={2.5} />}>
                  {subscriptionPackageName}
                </StatusPill>
                {subscriptionRenewsOn && (
                  <Text fontSize="11px" color={COLORS.mutedText} mt={1.5}>
                    Renews {formatDate(subscriptionRenewsOn)}
                  </Text>
                )}
              </Box>

              <StatCard
                icon={<LuUsers size={18} strokeWidth={2} />}
                value={Number(memberCount).toLocaleString("en-IN")}
                label="Members"
              />

              <StatCard
                icon={<LuUserCog size={18} strokeWidth={2} />}
                value={adminCount}
                label="Administrators"
              />

              <StatCard
                icon={<LuFileText size={18} strokeWidth={2} />}
                value={documentCount}
                label="Documents"
              />

              <StatCard
                icon={<LuIndianRupee size={18} strokeWidth={2} />}
                value={compactMoney(annualValue)}
                label="Annual Value"
              />
            </Flex>
          </Flex>
        </Box>

        {/* Tabs */}

        <Tabs.Root
          value={activeTab}
          onValueChange={(details) => setActiveTab(details.value)}
          mb={5}
        >
          <Tabs.List borderBottom="1px solid" borderColor={COLORS.border}>
            {tabItems.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                fontSize="13px"
                fontWeight="600"
                color={activeTab === tab.value ? COLORS.primaryMaroon : COLORS.mutedText}
                _selected={{
                  color: COLORS.primaryMaroon,
                  borderColor: COLORS.primaryMaroon,
                }}
                px={4}
                py={2.5}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Content */}

          <Tabs.Content value="overview" px={0} pt={5}>
            <Grid
              templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
              gap={5}
              mb={5}
            >
              {/* Church Information */}

              <GridItem>
                <InfoCard icon={<LuInfo size={15} strokeWidth={2} />} title="Church Information">
                  <VStack spacing={0} align="stretch" divideY="1px" divideColor="#EEF1F5">
                    <InfoRow label="Diocese" value={diocese} />
                    <InfoRow label="Established" value={established} />
                    <InfoRow label="Registration No" value={registrationNo} />
                    <InfoRow label="Currency" value={currency} />
                    <InfoRow label="Primary Language" value={primaryLanguage} />
                    <InfoRow label="Time Zone" value={timeZone} />
                  </VStack>
                </InfoCard>
              </GridItem>

              {/* Contact Information */}

              <GridItem>
                <InfoCard icon={<LuPhone size={15} strokeWidth={2} />} title="Contact Information">
                  <VStack spacing={0} align="stretch">
                    <ContactRow icon={<LuMail size={15} />} value={email} isLink />
                    <ContactRow icon={<LuPhone size={15} />} value={phone} />
                    {phoneSecondary && (
                      <ContactRow icon={<LuPhone size={15} />} value={phoneSecondary} />
                    )}
                    {website && (
                      <ContactRow icon={<LuGlobe size={15} />} value={website} isLink />
                    )}
                  </VStack>
                </InfoCard>
              </GridItem>

              {/* Address */}

              <GridItem>
                <InfoCard icon={<LuMapPin size={15} strokeWidth={2} />} title="Address">
                  <VStack spacing={0.5} align="stretch" mb={3}>
                    {addressLine1 && (
                      <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="500">
                        {addressLine1}
                      </Text>
                    )}
                    {addressLine2 && (
                      <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="500">
                        {addressLine2}
                      </Text>
                    )}
                    <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="500">
                      {[city, stateName, postalCode].filter(Boolean).join(", ")}
                    </Text>
                    <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="500">
                      {country}
                    </Text>
                  </VStack>

                  <Flex
                    align="center"
                    justify="center"
                    h="90px"
                    borderRadius="10px"
                    bg={COLORS.softPink}
                    color={COLORS.primaryMaroon}
                  >
                    <LuMapPin size={26} strokeWidth={1.6} />
                  </Flex>
                </InfoCard>
              </GridItem>
            </Grid>

            <Grid
              templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
              gap={5}
            >
              {/* Subscription Summary */}

              <GridItem>
                <InfoCard
                  icon={<LuChartColumn size={15} strokeWidth={2} />}
                  title="Subscription Summary"
                >
                  <HStack spacing={3} mb={4}>
                    <Circle size="42px" bg={COLORS.softPink} color={COLORS.primaryMaroon}>
                      <LuChartColumn size={18} strokeWidth={2} />
                    </Circle>

                    <Box flex="1">
                      <HStack spacing={2}>
                        <Text fontSize="15px" fontWeight="700" color={COLORS.darkNavy}>
                          {subscriptionPackageName}
                        </Text>
                        <StatusPill tone={subscriptionStatus ? "green" : "gray"}>
                          {subscriptionStatus ? "Active" : "Inactive"}
                        </StatusPill>
                      </HStack>
                    </Box>

                    <Text fontSize="17px" fontWeight="700" color={COLORS.darkNavy}>
                      {money(subscriptionAmount)}
                      <Text as="span" fontSize="12px" color={COLORS.mutedText} fontWeight="500">
                        /year
                      </Text>
                    </Text>
                  </HStack>

                  <Flex justify="space-between" fontSize="11px" color={COLORS.mutedText} mb={1.5}>
                    <Box>
                      <Text>Started</Text>
                      <Text color={COLORS.darkNavy} fontWeight="600" fontSize="12px" mt={0.5}>
                        {formatDate(subscriptionStartedOn)}
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text>Renews</Text>
                      <Text color={COLORS.darkNavy} fontWeight="600" fontSize="12px" mt={0.5}>
                        {formatDate(subscriptionRenewsOn)}
                      </Text>
                    </Box>
                  </Flex>

                  {remainingDays !== null && (
                    <>
                      <Text fontSize="11px" color={COLORS.mutedText} mb={1.5}>
                        {remainingDays} days remaining
                      </Text>
                      <ProgressRoot
                        value={Math.max(
                          0,
                          Math.min(100, (remainingDays / 365) * 100)
                        )}
                        size="sm"
                        borderRadius="full"
                        mb={4}
                      >
                        <ProgressTrack bg="#EEF1F5" borderRadius="full">
                          <ProgressRange bg={COLORS.primaryMaroon} />
                        </ProgressTrack>
                      </ProgressRoot>
                    </>
                  )}

                  <Button
                    w="100%"
                    size="sm"
                    variant="outline"
                    borderColor={COLORS.primaryMaroon}
                    color={COLORS.primaryMaroon}
                    _hover={{ bg: COLORS.softPink }}
                    onClick={() => setActiveTab("subscription")}
                  >
                    View Subscription
                  </Button>
                </InfoCard>
              </GridItem>

              {/* Church Administrators */}

              <GridItem>
                <InfoCard
                  icon={<LuUserCog size={15} strokeWidth={2} />}
                  title="Church Administrators"
                >
                  {administrators.length > 0 ? (
                    <VStack spacing={0} align="stretch" divideY="1px" divideColor="#EEF1F5">
                      {administrators.slice(0, 4).map((admin, index) => (
                        <Flex
                          key={admin?.id || index}
                          align="center"
                          justify="space-between"
                          py={2.5}
                          gap={3}
                        >
                          <HStack spacing={2.5} minW={0}>
                            <Circle size="34px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
                              <LuCircleUserRound size={17} strokeWidth={1.8} />
                            </Circle>
                            <Box minW={0}>
                              <Text fontSize="13px" color={COLORS.darkNavy} fontWeight="600" noOfLines={1}>
                                {admin?.name || admin?.full_name}
                              </Text>
                              <Text fontSize="11px" color={COLORS.mutedText} noOfLines={1}>
                                {admin?.role || admin?.designation}
                              </Text>
                            </Box>
                          </HStack>
                          <StatusPill tone={(admin?.is_active ?? true) ? "green" : "gray"}>
                            {(admin?.is_active ?? true) ? "Active" : "Inactive"}
                          </StatusPill>
                        </Flex>
                      ))}
                    </VStack>
                  ) : (
                    <Flex
                      minH="150px"
                      align="center"
                      justify="center"
                      border="1px dashed"
                      borderColor={COLORS.border}
                      borderRadius="8px"
                    >
                      <Text fontSize="12px" color={COLORS.mutedText}>
                        No administrators yet.
                      </Text>
                    </Flex>
                  )}
                </InfoCard>
              </GridItem>

              {/* Recent Activity */}

              <GridItem>
                <InfoCard icon={<LuClock size={15} strokeWidth={2} />} title="Recent Activity">
                  {recentActivities.length > 0 ? (
                    <VStack spacing={0} align="stretch">
                      {recentActivities.slice(0, 4).map((activity, index) => (
                        <HStack
                          key={activity?.id || index}
                          align="flex-start"
                          spacing={3}
                          py={2.5}
                          borderBottom="1px solid"
                          borderColor="#EEF1F5"
                          _last={{ borderBottom: "none" }}
                        >
                          <Circle size="28px" bg={COLORS.softPink} color={COLORS.primaryMaroon} flexShrink={0}>
                            {activityIcon(activity?.type)}
                          </Circle>

                          <Box flex="1" minW={0}>
                            <Text fontSize="12px" fontWeight="600" color={COLORS.darkNavy}>
                              {activity?.title || activity?.action_display}
                            </Text>
                            <Text fontSize="11px" color={COLORS.mutedText} mt={0.5} noOfLines={1}>
                              {activity?.description || activity?.message}
                            </Text>
                          </Box>

                          <Text fontSize="10px" color={COLORS.mutedText} whiteSpace="nowrap" flexShrink={0}>
                            {formatDateTime(activity?.created_at || activity?.date)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Flex
                      minH="150px"
                      align="center"
                      justify="center"
                      border="1px dashed"
                      borderColor={COLORS.border}
                      borderRadius="8px"
                    >
                      <Text fontSize="12px" color={COLORS.mutedText}>
                        No recent activity.
                      </Text>
                    </Flex>
                  )}
                </InfoCard>
              </GridItem>
            </Grid>
          </Tabs.Content>

          {/* Placeholder content for the other tabs */}

          <Tabs.Content value="subscription" pt={5}>
            <Text fontSize="13px" color={COLORS.mutedText}>
              Full subscription history and billing details go here.
            </Text>
          </Tabs.Content>

          <Tabs.Content value="payments" pt={5}>
            <Text fontSize="13px" color={COLORS.mutedText}>
              Payment records for this church go here.
            </Text>
          </Tabs.Content>

          <Tabs.Content value="administrators" pt={5}>
            <Text fontSize="13px" color={COLORS.mutedText}>
              Full administrator list and role management goes here.
            </Text>
          </Tabs.Content>

          <Tabs.Content value="documents" pt={5}>
            <Text fontSize="13px" color={COLORS.mutedText}>
              Uploaded documents for this church go here.
            </Text>
          </Tabs.Content>

          <Tabs.Content value="activity" pt={5}>
            <Text fontSize="13px" color={COLORS.mutedText}>
              Full activity log for this church goes here.
            </Text>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </AdminLayout>
  );
};

export default ChurchViewPage;