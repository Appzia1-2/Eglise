import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  Badge,
  Spinner,
  SimpleGrid,
  Icon,
  Circle,
  Image,
} from "@chakra-ui/react";
import {
  LuChurch,
  LuMapPin,
  LuMail,
  LuPhone,
  LuGlobe,
  LuUsers,
  LuUserCog,
  LuFileText,
  LuIndianRupee,
  LuChevronDown,
  LuBadgeCheck,
  LuCreditCard,
  LuRefreshCw,
  LuPencil,
  LuUserPlus,
  LuTrendingUp,
  LuCalendar,
  LuHash,
  LuInfo,
} from "react-icons/lu";
import { Country, State } from "country-state-city";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const TABS = ["Overview", "Subscription", "Payments", "Administrators", "Documents", "Activity"];

const CURRENCY_LABELS = {
  USD: "USD ($) — US Dollar",
  EUR: "EUR (€) — Euro",
  GBP: "GBP (£) — British Pound",
  INR: "INR (₹) — Indian Rupee",
  AED: "AED (د.إ) — UAE Dirham",
  SAR: "SAR (﷼) — Saudi Riyal",
  SGD: "SGD (S$) — Singapore Dollar",
  MYR: "MYR (RM) — Malaysian Ringgit",
  AUD: "AUD (A$) — Australian Dollar",
  CAD: "CAD (C$) — Canadian Dollar",
};

const primaryMaroon = "var(--primary-maroon)";

const ChurchView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [church, setChurch] = useState(null);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (location.state?.church) {
      setChurch(location.state.church);
      setIsLoading(false);
      fetchBills(location.state.church.id);
    } else if (id) {
      fetchChurch(id);
    } else {
      navigate("/admin/churches");
    }
  }, [location, id, navigate]);

  const fetchChurch = async (churchId) => {
    try {
      const response = await adminApi.getChurchDetail(churchId);
      const churchData = response?.data || response;
      setChurch(churchData);
      fetchBills(churchId);
    } catch (error) {
      console.error("Error fetching church:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load church details.",
        type: "error",
        duration: 5000,
      });
      navigate("/admin/churches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBills = async (churchId) => {
    try {
      const response = await adminApi.getBills({ church: churchId });
      let list = [];
      if (response) {
        if (Array.isArray(response)) {
          list = response;
        } else if (response.results && Array.isArray(response.results)) {
          list = response.results;
        } else if (response.data && Array.isArray(response.data)) {
          list = response.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          list = response.data.results;
        }
      }
      setBills(list);
    } catch (error) {
      console.error("Error fetching bills for church:", error);
      setBills([]);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="xl" style={{ color: primaryMaroon }} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  if (!church) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Text>Church not found</Text>
        </Container>
      </AdminLayout>
    );
  }

  const countryLabel = church.country
    ? Country.getCountryByCode(church.country)?.name || church.country
    : null;
  const stateLabel = church.state
    ? State.getStateByCodeAndCountry(church.state, church.country)?.name || church.state
    : null;
  const currencyLabel = church.currency ? CURRENCY_LABELS[church.currency] || church.currency : null;

  const addressLine1 = church.address;
  const addressLine2 = church.address_line1;

  const churchCode = church.code || `CH-${String(church.id).padStart(3, "0")}`;
  const locationLabel = [church.city, stateLabel].filter(Boolean).join(", ") || church.city || "—";
  const isVerified = church.is_verified ?? church.is_active ?? true;

  const subscription = church.subscription || {};
  const packageName = subscription.locked_package_name || subscription.package_name || church.current_package || church.package_name || "—";
  const renewsOn = subscription.renews_on || subscription.next_billing_date || subscription.end_date
    ? new Date(subscription.renews_on || subscription.next_billing_date || subscription.end_date).toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;
  const startedOn = subscription.started_on || subscription.start_date || subscription.created_at
    ? new Date(subscription.started_on || subscription.start_date || subscription.created_at).toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;
  const daysRemaining = subscription.days_remaining;
  const subscriptionProgressPct = subscription.progress_pct ?? 0;

  const paidBills = bills.filter((b) => b.status === "PAID" || b.paid_at);
  const annualValue =
    subscription.annual_value ??
    subscription.total_price ??
    (paidBills.length ? paidBills.reduce((sum, b) => sum + Number(b.amount || 0), 0) : null);

  const stats = [
    { label: "Members", value: church.member_count ?? church.stats?.members_count ?? "—", icon: LuUsers, tinted: true },
    { label: "Administrators", value: church.administrators?.length ?? church.admin_count ?? "—", icon: LuUserCog, tinted: false },
    { label: "Documents", value: church.document_count ?? "—", icon: LuFileText, tinted: false },
    {
      label: "Annual Value",
      value: annualValue != null ? `₹${Number(annualValue).toLocaleString("en-IN")}` : "—",
      icon: LuIndianRupee,
      tinted: true,
    },
  ];

  const administrators = church.administrators || [];

  const recentActivity = [...bills]
    .sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at))
    .slice(0, 4)
    .map((b) => ({
      icon: LuIndianRupee,
      title: b.status === "PAID" ? "Payment received" : "Bill created",
      description: `₹${Number(b.amount || 0).toLocaleString("en-IN")} via ${b.payment_method || "—"}`,
      date: b.paid_at || b.created_at
        ? new Date(b.paid_at || b.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    }));

  // Sample activity data for display when no bills exist
  const sampleActivities = [
    {
      icon: LuTrendingUp,
      title: "Package renewed",
      description: `${packageName} package renewed for 1 year`,
      date: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
    },
    {
      icon: LuInfo,
      title: "Church details updated",
      description: "Address and contact information updated",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
    },
    {
      icon: LuUserPlus,
      title: "Administrator invited",
      description: "New administrator invited to join",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
    },
  ];

  const displayActivities = recentActivity.length > 0 ? recentActivity : sampleActivities;

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Breadcrumb */}
        <Text fontSize="xs" fontWeight="600" letterSpacing="0.5px" mb={4} style={{ color: "#9CA3AF" }}>
          <Text as="span" style={{ color: primaryMaroon, cursor: "pointer" }} onClick={() => navigate("/admin/churches")}>
            Churches
          </Text>{" "}
          / {church.name}
        </Text>

        {/* Header */}
        <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="1px" textTransform="uppercase" style={{ color: primaryMaroon }}>
              Church Profile
            </Text>
            <Heading fontSize="3xl" fontWeight="800" style={{ color: "#1a1a1a" }}>Church Details</Heading>
            <Text fontSize="sm" style={{ color: "#6B7280" }}>
              View church information, subscription and account activity.
            </Text>
          </VStack>

          <HStack gap={3} position="relative">
            <Box position="relative">
              <Button variant="outline" onClick={() => setShowActions((prev) => !prev)}>
                <HStack gap={2}>
                  <Text>More Actions</Text>
                  <Icon as={LuChevronDown} boxSize={4} />
                </HStack>
              </Button>
              {showActions && (
                <Box
                  position="absolute" top="110%" right={0} bg="white" borderRadius="lg"
                  border="1px solid" borderColor="gray.200" boxShadow="md" minW="180px" zIndex={10} overflow="hidden"
                >
                  {[
                    { label: "Suspend Church", action: () => adminApi.suspendChurch(church.id) },
                    { label: "Activate Church", action: () => adminApi.activateChurch(church.id) },
                    { label: "Delete Church", action: () => adminApi.deleteChurch(church.id) },
                  ].map((item) => (
                    <Box
                      key={item.label} px={4} py={2} fontSize="sm" cursor="pointer" _hover={{ bg: "gray.50" }}
                      onClick={async () => {
                        setShowActions(false);
                        try {
                          await item.action();
                          toaster.create({ title: "Success", description: `${item.label} completed.`, type: "success", duration: 4000 });
                          fetchChurch(church.id);
                        } catch (err) {
                          toaster.create({ title: "Error", description: `Failed: ${item.label}`, type: "error", duration: 4000 });
                        }
                      }}
                    >
                      {item.label}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Button
              style={{ background: primaryMaroon, color: "white" }}
              _hover={{ opacity: 0.9 }}
              onClick={() => navigate(`/admin/churches/edit/${church.id}`, { state: { church } })}
            >
              <HStack gap={2}>
                <Icon as={LuPencil} boxSize={4} />
                <Text>Edit Church</Text>
              </HStack>
            </Button>
          </HStack>
        </Flex>

        {/* Profile Header Card */}
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6} mb={6} boxShadow="sm">
          <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "flex-start", lg: "center" }} gap={4}>
            <HStack gap={4} align="center">
              {church.logo || church.logo_url ? (
                <Circle size="72px" overflow="hidden" border="1px solid" borderColor="gray.200">
                  <Image src={church.logo || church.logo_url} alt={church.name} w="100%" h="100%" objectFit="cover" />
                </Circle>
              ) : (
                <Circle size="72px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                  <Icon as={LuChurch} boxSize={8} style={{ color: primaryMaroon }} />
                </Circle>
              )}
              <VStack align="start" gap={1}>
                <Heading fontSize="2xl" fontWeight="800" style={{ color: "#1a1a1a" }}>{church.name}</Heading>
                <HStack gap={4} fontSize="sm" style={{ color: "#6B7280" }}>
                  <Text fontWeight="500" color={primaryMaroon}>{churchCode}</Text>
                  <HStack gap={1}>
                    <Icon as={LuMapPin} boxSize={3.5} />
                    <Text>{locationLabel}</Text>
                  </HStack>
                </HStack>
                <HStack gap={2} pt={1}>
                  <Badge colorPalette={church.is_active ? "green" : "red"} borderRadius="full" px={3} py={0.5} fontSize="xs">
                    {church.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {isVerified && (
                    <Badge colorPalette="blue" borderRadius="full" px={3} py={0.5} fontSize="xs">
                      <HStack gap={1}>
                        <Icon as={LuBadgeCheck} boxSize={3} />
                        <Text>Verified</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>

            <HStack gap={8} flexWrap="wrap">
              {stats.map((stat) => (
                <VStack key={stat.label} gap={0} align="center">
                  <Text fontSize="xl" fontWeight="800" style={{ color: "#1a1a1a" }}>{stat.value}</Text>
                  <Text fontSize="xs" style={{ color: "#9CA3AF" }}>{stat.label}</Text>
                </VStack>
              ))}
            </HStack>
          </Flex>
        </Box>

        {/* Tabs */}
        <HStack gap={6} borderBottom="1px solid" borderColor="gray.200" mb={6}>
          {TABS.map((tab) => (
            <Box
              key={tab} pb={3} cursor="pointer" onClick={() => setActiveTab(tab)}
              borderBottom="2px solid" borderColor={activeTab === tab ? primaryMaroon : "transparent"}
              transition="border-color 0.2s"
            >
              <Text 
                fontSize="sm" 
                fontWeight={activeTab === tab ? "700" : "500"} 
                style={{ color: activeTab === tab ? primaryMaroon : "#6B7280" }}
                transition="color 0.2s"
              >
                {tab}
              </Text>
            </Box>
          ))}
        </HStack>

        {/* Overview Tab */}
        {activeTab === "Overview" && (
          <VStack align="stretch" gap={6}>
            {/* Three column grid - Church Info, Contact, Address */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {/* Church Information */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuChurch} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Church Information</Heading>
                </HStack>
                <VStack align="stretch" gap={2}>
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Diocese</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {church.diocese_name || church.diocese?.name || "—"}
                    </Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Established</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {church.established_year || "—"}
                    </Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Registration No</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {church.registration_number || "—"}
                    </Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Currency</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {currencyLabel || "—"}
                    </Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Primary Language</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {church.primary_language || "English"}
                    </Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex justify="space-between" align="center" py={1}>
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>Time Zone</Text>
                    <Text fontSize="sm" fontWeight="500" style={{ color: "#1a1a1a" }}>
                      {church.timezone || "Asia/Kolkata"}
                    </Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Contact Information */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuMail} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Contact Information</Heading>
                </HStack>
                <VStack align="stretch" gap={2}>
                  <Flex align="center" gap={3} py={1}>
                    <Circle size="28px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                      <Icon as={LuMail} boxSize={3.5} style={{ color: primaryMaroon }} />
                    </Circle>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{church.email || "—"}</Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex align="center" gap={3} py={1}>
                    <Circle size="28px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                      <Icon as={LuPhone} boxSize={3.5} style={{ color: primaryMaroon }} />
                    </Circle>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{church.phone_number || "—"}</Text>
                  </Flex>
                  <Box borderBottom="1px solid" borderColor="gray.100" />
                  <Flex align="center" gap={3} py={1}>
                    <Circle size="28px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                      <Icon as={LuPhone} boxSize={3.5} style={{ color: primaryMaroon }} />
                    </Circle>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{church.alternate_phone || "—"}</Text>
                  </Flex>
                  {church.website && (
                    <>
                      <Box borderBottom="1px solid" borderColor="gray.100" />
                      <Flex align="center" gap={3} py={1}>
                        <Circle size="28px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                          <Icon as={LuGlobe} boxSize={3.5} style={{ color: primaryMaroon }} />
                        </Circle>
                        <Text fontSize="sm" style={{ color: primaryMaroon, cursor: "pointer" }} onClick={() => window.open(church.website, "_blank")}>
                          {church.website}
                        </Text>
                      </Flex>
                    </>
                  )}
                </VStack>
              </Box>

              {/* Address */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuMapPin} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Address</Heading>
                </HStack>
                <VStack align="stretch" gap={2}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{addressLine1 || "Not provided"}</Text>
                    {addressLine2 && <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{addressLine2}</Text>}
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{[church.city, stateLabel].filter(Boolean).join(", ") || "—"}</Text>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{countryLabel || "—"}</Text>
                    <Text fontSize="sm" style={{ color: "#1a1a1a" }}>{church.postal_code || "—"}</Text>
                  </VStack>
                  <Flex h="80px" borderRadius="lg" align="center" justify="center" style={{ background: "rgba(174, 32, 80, 0.06)", mt: 2 }}>
                    <Icon as={LuMapPin} boxSize={6} style={{ color: primaryMaroon }} />
                  </Flex>
                </VStack>
              </Box>
            </SimpleGrid>

            {/* Bottom row - Subscription Summary, Administrators, Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
              {/* Subscription Summary */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuCreditCard} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Subscription Summary</Heading>
                </HStack>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Circle size="36px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                        <Icon as={LuTrendingUp} boxSize={4} style={{ color: primaryMaroon }} />
                      </Circle>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="700" fontSize="sm">{packageName}</Text>
                        <Badge colorPalette={church.is_active ? "green" : "gray"} size="sm" borderRadius="full" fontSize="xs">
                          {church.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </VStack>
                    </HStack>
                    <VStack align="end" gap={0}>
                      <Text fontWeight="800" fontSize="lg">
                        {annualValue != null ? `₹${Number(annualValue).toLocaleString("en-IN")}` : "—"}
                      </Text>
                      <Text fontSize="xs" style={{ color: "#9CA3AF" }}>/ year</Text>
                    </VStack>
                  </HStack>

                  <Flex justify="space-between" fontSize="xs" style={{ color: "#9CA3AF" }}>
                    <VStack align="start" gap={0}>
                      <Text>Started</Text>
                      <Text fontWeight="600" style={{ color: "#374151" }}>{startedOn || "—"}</Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                      <Text>Renews</Text>
                      <Text fontWeight="600" style={{ color: "#374151" }}>{renewsOn || "—"}</Text>
                    </VStack>
                    {daysRemaining != null && (
                      <VStack align="end" gap={0}>
                        <Text>Days remaining</Text>
                        <Text fontWeight="600" style={{ color: "#374151" }}>{daysRemaining}</Text>
                      </VStack>
                    )}
                  </Flex>

                  <Box h="6px" borderRadius="full" bg="gray.100" overflow="hidden">
                    <Box h="100%" borderRadius="full" style={{ width: `${subscriptionProgressPct}%`, background: primaryMaroon }} />
                  </Box>

                  <Button 
                    variant="outline" 
                    size="sm"
                    borderColor={primaryMaroon}
                    color={primaryMaroon}
                    _hover={{ bg: "rgba(174, 32, 80, 0.05)" }}
                    onClick={() => setActiveTab("Subscription")}
                  >
                    View Subscription
                  </Button>
                </VStack>
              </Box>

              {/* Church Administrators */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuUserCog} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Church Administrators</Heading>
                </HStack>
                <VStack align="stretch" gap={3}>
                  {administrators.length === 0 ? (
                    <Text fontSize="sm" style={{ color: "#9CA3AF" }}>No administrators found.</Text>
                  ) : (
                    administrators.map((admin, idx) => (
                      <HStack key={idx} justify="space-between">
                        <HStack gap={3}>
                          <Circle size="32px" style={{ background: "rgba(174, 32, 80, 0.08)" }}>
                            <Icon as={LuUserPlus} boxSize={4} style={{ color: primaryMaroon }} />
                          </Circle>
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="600">{admin.name || admin.email}</Text>
                            <Text fontSize="xs" style={{ color: "#9CA3AF" }}>{admin.role || "Administrator"}</Text>
                          </VStack>
                        </HStack>
                        <Badge colorPalette={admin.status === "Active" ? "green" : "gray"} size="sm" borderRadius="full" fontSize="xs">
                          {admin.status || "Active"}
                        </Badge>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>

              {/* Recent Activity */}
              <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                <HStack gap={2} mb={4}>
                  <Icon as={LuRefreshCw} boxSize={4} style={{ color: primaryMaroon }} />
                  <Heading size="sm" fontWeight="700" style={{ color: "#1a1a1a" }}>Recent Activity</Heading>
                </HStack>
                <VStack align="stretch" gap={4}>
                  {displayActivities.map((item, idx) => (
                    <HStack key={idx} align="start" gap={3}>
                      <Circle size="28px" style={{ background: "rgba(174, 32, 80, 0.08)", flexShrink: 0 }}>
                        <Icon as={item.icon} boxSize={3.5} style={{ color: primaryMaroon }} />
                      </Circle>
                      <VStack align="start" gap={0} flex="1">
                        <Text fontSize="sm" fontWeight="600">{item.title}</Text>
                        <Text fontSize="xs" style={{ color: "#9CA3AF" }}>{item.description}</Text>
                      </VStack>
                      <Text fontSize="xs" style={{ color: "#9CA3AF" }} whiteSpace="nowrap">{item.date}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        )}

        {/* Payments Tab */}
        {activeTab === "Payments" && (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
            {bills.length === 0 ? (
              <Text style={{ color: "#9CA3AF" }} textAlign="center" py={6}>
                No payment records found for this church.
              </Text>
            ) : (
              <VStack align="stretch" gap={0}>
                {bills.map((b, idx) => (
                  <Flex key={idx} justify="space-between" py={3} borderBottom={idx < bills.length - 1 ? "1px solid" : "none"} borderColor="gray.100">
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="600">₹{Number(b.amount || 0).toLocaleString("en-IN")}</Text>
                      <Text fontSize="xs" style={{ color: "#9CA3AF" }}>{b.payment_method || b.bill_type || "—"}</Text>
                    </VStack>
                    <Badge colorPalette={b.status === "PAID" ? "green" : "yellow"} borderRadius="full" fontSize="xs">
                      {b.status || "PENDING"}
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* Placeholder tabs */}
        {["Subscription", "Administrators", "Documents", "Activity"].includes(activeTab) && (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={10} textAlign="center">
            <Text style={{ color: "#9CA3AF" }}>{activeTab} content goes here.</Text>
          </Box>
        )}

        {/* Footer */}
        <Flex justify="space-between" mt={10} fontSize="xs" style={{ color: "#9CA3AF" }}>
          <Text>Version 1.0.0</Text>
          <Text>© 2026 Appzia Tec Solutions. All rights reserved</Text>
        </Flex>
      </Container>
    </AdminLayout>
  );
};

export default ChurchView;