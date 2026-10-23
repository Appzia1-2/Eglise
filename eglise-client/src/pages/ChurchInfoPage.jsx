import React, { useEffect, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Circle,
  Flex,
  Skeleton,
  Progress,
  Badge,
  Button,
  Image,
  Input,
  Textarea,
  Field,
  Dialog,
  Portal,
  CloseButton,
  Spinner,
} from "@chakra-ui/react";

import {
  LuChurch,
  LuMapPin,
  LuCircleCheck,
  LuUsers,
  LuPencil,
  LuHouse,
  LuCreditCard,
  LuSettings,
  LuEye,
  LuUpload,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ✅ Correct imports: getChurchDashboard from churchServices,
// updateMyChurch + getPriestMaster from registryServices
import { getChurchDashboard } from "../api/churchServices";
import {
  updateMyChurch,
  getPriestMaster,
} from "../api/registryServices";

// =========================================================
// MEDIA URL
// =========================================================

const getMediaUrl = (url) => {
  if (!url) return null;

  const value = String(url).trim();
  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const cleanBase = apiBase.replace(/\/+$/, "");
  const cleanUrl = value.replace(/^\/+/, "");

  return `${cleanBase}/${cleanUrl}`;
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (date, options = {}) => {
  if (!date) return "N/A";

  try {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", options);
  } catch {
    return "N/A";
  }
};

// =========================================================
// ADD MONTHS
// =========================================================

const addMonths = (dateInput, months) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

// =========================================================
// SECTION CARD
// =========================================================

const SectionCard = ({ title, icon, children, action }) => {
  return (
    <Box
      border="1px solid"
      borderColor="var(--border-color)"
      borderRadius="9px"
      bg="var(--white)"
      overflow="hidden"
    >
      <Flex
        px={{ base: 3, md: 4 }}
        py={2}
        align="center"
        justify="space-between"
        minH="48px"
      >
        <HStack gap={2}>
          <Circle
            size="32px"
            bg="rgba(174, 32, 80, 0.08)"
            color="var(--primary-maroon)"
          >
            <Icon as={icon} boxSize={4} />
          </Circle>

          <Heading
            size="md"
            color="var(--primary-maroon)"
            fontWeight="700"
          >
            {title}
          </Heading>
        </HStack>

        {action}
      </Flex>

      <Box px={{ base: 3, md: 4 }} pb={3}>
        {children}
      </Box>
    </Box>
  );
};

// =========================================================
// DETAIL ROW
// =========================================================

const DetailRow = ({ label, value }) => {
  return (
    <Flex
      minH="34px"
      align="center"
      borderBottom="1px solid"
      borderColor="var(--divider-color)"
      _last={{ borderBottom: "none" }}
    >
      <Text
        width={{ base: "42%", md: "30%" }}
        flexShrink={0}
        fontSize="sm"
        color="var(--dark-text)"
        fontWeight="500"
      >
        {label}
      </Text>

      <Text
        flex="1"
        fontSize="sm"
        color="var(--light-gray)"
        fontWeight="400"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {value || "N/A"}
      </Text>
    </Flex>
  );
};

// =========================================================
// ADMIN DETAIL
// =========================================================

const AdminDetail = ({ label, value, isLast = false }) => {
  return (
    <Box
      textAlign="center"
      px={{ base: 2, md: 4 }}
      position="relative"
      borderRight={
        isLast
          ? "none"
          : {
              base: "none",
              md: "1px solid var(--muted-border)",
            }
      }
    >
      <Text fontSize="xs" color="var(--dark-text)" mb={1}>
        {label}
      </Text>

      <Text
        fontSize="sm"
        fontWeight="600"
        color="var(--dark-text)"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {value || "N/A"}
      </Text>
    </Box>
  );
};

// =========================================================
// EDIT CHURCH DIALOG
// =========================================================

const EMPTY_FORM = {
  name: "",
  established_year: "",
  registration_number: "",
  currency: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  email: "",
  phone_number: "",
  website: "",
};

const EditChurchDialog = ({
  open,
  onClose,
  initialChurch,
  onSaved,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      name: initialChurch?.name || "",
      established_year: initialChurch?.established_year || "",
      registration_number: initialChurch?.registration_number || "",
      currency: initialChurch?.currency || "",
      address: initialChurch?.address || "",
      city: initialChurch?.city || "",
      state: initialChurch?.state || "",
      postal_code: initialChurch?.postal_code || "",
      email: initialChurch?.email || "",
      phone_number: initialChurch?.phone_number || "",
      website: initialChurch?.website || "",
    });

    setLogoFile(null);
    setError("");
    setSaving(false);
  }, [open, initialChurch]);

  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        const trimmed =
          typeof value === "string" ? value.trim() : value;
        if (trimmed === "") return;
        fd.append(key, trimmed);
      });

      if (logoFile) fd.append("logo", logoFile);

      const res = await updateMyChurch(fd);

      if (onSaved) onSaved(res?.data || null);
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        setError(
          Array.isArray(firstVal)
            ? `${firstKey}: ${firstVal[0]}`
            : `${firstKey}: ${firstVal}`
        );
      } else {
        setError("Failed to save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title color="var(--primary-maroon)">
                Edit Church Information
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>

            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {error && (
                  <Box
                    border="1px solid"
                    borderColor="red.300"
                    bg="red.50"
                    color="red.700"
                    px={3}
                    py={2}
                    borderRadius="6px"
                    fontSize="sm"
                  >
                    {error}
                  </Box>
                )}

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Field.Root>
                    <Field.Label>Church Name *</Field.Label>
                    <Input
                      value={form.name}
                      onChange={setField("name")}
                      placeholder="Enter church name"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Established Year</Field.Label>
                    <Input
                      type="number"
                      value={form.established_year}
                      onChange={setField("established_year")}
                      placeholder="e.g. 1950"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Registration Number</Field.Label>
                    <Input
                      value={form.registration_number}
                      onChange={setField("registration_number")}
                      placeholder="Government reg. no."
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Currency</Field.Label>
                    <Input
                      value={form.currency}
                      onChange={setField("currency")}
                      placeholder="e.g. INR"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Email</Field.Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={setField("email")}
                      placeholder="church@example.com"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Phone Number</Field.Label>
                    <Input
                      value={form.phone_number}
                      onChange={setField("phone_number")}
                      placeholder="+91..."
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>City</Field.Label>
                    <Input
                      value={form.city}
                      onChange={setField("city")}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>State</Field.Label>
                    <Input
                      value={form.state}
                      onChange={setField("state")}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Postal Code</Field.Label>
                    <Input
                      value={form.postal_code}
                      onChange={setField("postal_code")}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Website</Field.Label>
                    <Input
                      value={form.website}
                      onChange={setField("website")}
                      placeholder="https://..."
                    />
                  </Field.Root>
                </SimpleGrid>

                <Field.Root>
                  <Field.Label>Address</Field.Label>
                  <Textarea
                    value={form.address}
                    onChange={setField("address")}
                    rows={2}
                    placeholder="Street address, building name..."
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Church Logo</Field.Label>
                  <HStack>
                    <Button
                      as="label"
                      variant="outline"
                      size="sm"
                      borderColor="var(--primary-maroon)"
                      color="var(--primary-maroon)"
                      cursor="pointer"
                    >
                      <Icon as={LuUpload} mr={2} />
                      Choose Logo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          setLogoFile(
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </Button>

                    <Text fontSize="sm" color="var(--light-gray)">
                      {logoFile
                        ? logoFile.name
                        : "No file chosen"}
                    </Text>
                  </HStack>
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                bg="var(--primary-maroon)"
                color="white"
                _hover={{ opacity: 0.9 }}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <Spinner size="sm" /> : "Save Changes"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

// =========================================================
// CHURCH INFO PAGE
// =========================================================

const ChurchInfoPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [vicarName, setVicarName] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // =======================================================
  // FETCH CHURCH DASHBOARD
  // =======================================================

  const loadChurch = async () => {
    try {
      const response = await getChurchDashboard();
      setData(response?.data || {});
      setLogoError(false);
    } catch (error) {
      console.error("Error fetching church information:", error);
      setData({});
    } finally {
      setIsLoading(false);
    }
  };

  // =======================================================
  // FETCH VICAR — Extracts the MAIN vicar safely
  // =======================================================

  const loadVicar = async () => {
    try {
      const res = await getPriestMaster();
      const payload = res?.data || {};
      
      // Look inside `current`, `upcoming`, and `previous` for the MAIN vicar
      const allPriests = [
        ...(payload.current || []),
        ...(payload.upcoming || []),
        ...(payload.previous || []),
      ];

      const mainVicar = allPriests.find(
        (p) => String(p.designation).toUpperCase() === "MAIN"
      );

      if (mainVicar && mainVicar.name) {
        setVicarName(mainVicar.name);
      } else if (payload.current && payload.current.length > 0) {
        // Fallback to whoever is currently active
        setVicarName(payload.current[0]?.name || null);
      } else {
        setVicarName(null);
      }
    } catch (e) {
      console.warn("Could not load vicar:", e?.message);
      setVicarName(null);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadChurch(), loadVicar()]);
    })();
  }, []);

  // =======================================================
  // LOADING
  // =======================================================

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bg="var(--white)"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Container maxW="container.xl" flex="1" py={4}>
          <VStack gap={4} align="stretch">
            <Skeleton height="48px" borderRadius="8px" />
            <Skeleton height="105px" borderRadius="10px" />

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              <Skeleton height="400px" borderRadius="10px" />

              <VStack gap={4} align="stretch">
                <Skeleton height="235px" borderRadius="10px" />
                <Skeleton height="160px" borderRadius="10px" />
              </VStack>
            </SimpleGrid>

            <Skeleton height="105px" borderRadius="10px" />
          </VStack>
        </Container>

        <Footer />
      </Box>
    );
  }

  // =======================================================
  // SAFE DATA
  // =======================================================

  const church = data?.church || {};
  const subscription = data?.subscription || {};
  const members = data?.members || {};

  // =======================================================
  // CHURCH INFORMATION
  // =======================================================

  const churchName =
    church?.name || church?.church_name || "Church Name";

  const churchCode =
    church?.code || church?.church_code || "N/A";

  const diocese =
    church?.diocese || church?.diocese_name || "N/A";

  const city = church?.city || church?.location || "N/A";

  const phone =
    church?.phone_number || church?.phone || "N/A";

  const email =
    church?.email || church?.official_email || "N/A";

  const address =
    church?.full_address || church?.address || "N/A";

  const establishedYear =
    church?.established_year ??
    church?.establishedYear ??
    church?.establishment_year ??
    church?.establishmentYear ??
    "N/A";

  // =======================================================
  // VICAR
  // =======================================================

  const vicarPriest = vicarName || "N/A";

  // =======================================================
  // ADMINISTRATIVE DETAILS
  // =======================================================

  const registrationNumber =
    church?.registration_number ||
    church?.registration_no ||
    church?.reg_number ||
    "N/A";

  const financialYear =
    church?.financial_year ||
    church?.financial_year_name ||
    "N/A";

  const currency =
    church?.currency || church?.default_currency || "INR (₹)";

  const timezone =
    church?.timezone || "Asia/Kolkata";

  // =======================================================
  // LOGO
  // =======================================================

  const churchLogo =
    church?.logo ||
    church?.logo_url ||
    church?.image ||
    church?.image_url ||
    null;

  const logoUrl = getMediaUrl(churchLogo);

  // =======================================================
  // SUBSCRIPTION
  // =======================================================

  const packageName =
    subscription?.package_name ||
    subscription?.package ||
    subscription?.plan ||
    subscription?.package_title ||
    "Standard";

  const billingCycleRaw =
    subscription?.billing_cycle ||
    subscription?.billingCycle ||
    "Monthly";

  const billingCycle = String(billingCycleRaw);

  const memberLimit = Number(
    subscription?.allowed_limit ??
      subscription?.member_limit ??
      subscription?.capacity ??
      members?.allowed_limit ??
      0
  );

  const subscribedOn =
    subscription?.start_date ||
    subscription?.subscribed_on ||
    subscription?.created_at ||
    null;

  // =======================================================
  // RENEWAL DATE — respect MONTHLY vs YEARLY
  // =======================================================

  let renewalDate =
    subscription?.end_date ||
    subscription?.renewal_date ||
    subscription?.renewalDate ||
    null;

  if (
    renewalDate &&
    subscribedOn &&
    String(billingCycle).toUpperCase() === "MONTHLY"
  ) {
    const start = new Date(subscribedOn);
    const end = new Date(renewalDate);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime())
    ) {
      const days =
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24);

      if (days >= 60) {
        const computed = addMonths(start, 1);
        if (computed) renewalDate = computed.toISOString();
      }
    }
  }

  // =======================================================
  // SUBSCRIPTION STATUS
  // =======================================================

  let subscriptionStatus = "Active";

  if (subscription?.status) {
    subscriptionStatus = subscription.status;
  } else if (subscription?.payment_status) {
    subscriptionStatus = subscription.payment_status;
  } else if (subscription?.is_active === false) {
    subscriptionStatus = "Inactive";
  }

  // =======================================================
  // MEMBERS
  // =======================================================

  const currentMembers = Number(
    members?.current_count ??
      members?.active_count ??
      members?.count ??
      0
  );

  const allowedMembers = Number(memberLimit || 0);

  const memberPercentage =
    allowedMembers > 0
      ? Math.min((currentMembers / allowedMembers) * 100, 100)
      : 0;

  const remainingMembers =
    members?.remaining != null
      ? Number(members.remaining)
      : Math.max(allowedMembers - currentMembers, 0);

  // =======================================================
  // OPEN EDIT
  // =======================================================

  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  const handleSaved = async () => {
    await Promise.all([loadChurch(), loadVicar()]);
  };

  // =======================================================
  // RETURN
  // =======================================================

  return (
    <Box
      minH="100vh"
      bg="var(--white)"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" overflow="hidden">
        <Container
          maxW="none"
          w="calc(100% - 56px)"
          px={0}
          py={{ base: 2, md: 3 }}
        >
          {/* PAGE HEADER */}

          <Flex
            justify="space-between"
            align="center"
            mb={3}
            gap={3}
          >
            <HStack gap={2}>
              <Circle
                size="44px"
                border="1px solid"
                borderColor="var(--border-color)"
                bg="var(--white)"
                color="var(--primary-maroon)"
                flexShrink={0}
              >
                <Icon as={LuHouse} boxSize={5} />
              </Circle>

              <Box>
                <Heading
                  size={{ base: "md", md: "lg" }}
                  color="var(--primary-maroon)"
                  fontWeight="700"
                  lineHeight="1.2"
                >
                  Church Information
                </Heading>

                <Text
                  fontSize="xs"
                  color="var(--light-gray)"
                  mt={0.5}
                >
                  View and manage your church profile and
                  subscription
                </Text>
              </Box>
            </HStack>

            <Button
              variant="outline"
              borderColor="var(--primary-maroon)"
              color="var(--primary-maroon)"
              borderRadius="6px"
              size="sm"
              px={3}
              h="34px"
              fontWeight="600"
              flexShrink={0}
              _hover={{ bg: "rgba(174, 32, 80, 0.05)" }}
              onClick={openEdit}
            >
              <Icon as={LuPencil} mr={2} />
              Edit Church Info
            </Button>
          </Flex>

          {/* CHURCH SUMMARY */}

          <Box
            border="1px solid"
            borderColor="var(--border-color)"
            borderRadius="9px"
            px={{ base: 4, md: 6 }}
            py={3}
            mb={3}
            bg="var(--white)"
          >
            <HStack gap={4} align="center">
              <Box
                width={{ base: "64px", md: "78px" }}
                height={{ base: "64px", md: "78px" }}
                flexShrink={0}
                border="1px solid"
                borderColor="var(--primary-maroon)"
                borderRadius="50%"
                bg="var(--white)"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {logoUrl && !logoError ? (
                  <Image
                    src={logoUrl}
                    alt={`${churchName} logo`}
                    width="100%"
                    height="100%"
                    objectFit="contain"
                    p={1}
                    display="block"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Icon
                    as={LuChurch}
                    boxSize={{ base: 7, md: 8 }}
                    color="var(--primary-maroon)"
                  />
                )}
              </Box>

              <Box minW={0}>
                <Heading
                  size={{ base: "lg", md: "xl" }}
                  color="var(--dark-text)"
                  fontWeight="700"
                  lineHeight="1.15"
                  truncate
                >
                  {churchName}
                </Heading>

                <HStack gap={3} mt={0.5} flexWrap="wrap">
                  <Text
                    color="var(--light-gray)"
                    fontSize="sm"
                    fontWeight="500"
                  >
                    {churchCode}
                  </Text>

                  <Badge
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="5px"
                    px={2}
                    py="2px"
                    fontSize="xs"
                  >
                    <Icon
                      as={LuCircleCheck}
                      mr={1}
                      boxSize={3}
                    />
                    {subscriptionStatus}
                  </Badge>
                </HStack>

                <HStack
                  gap={2}
                  mt={0.5}
                  color="var(--light-gray)"
                  fontSize="xs"
                >
                  <Icon as={LuMapPin} boxSize={3.5} />

                  <Text truncate>
                    {diocese}
                    {city && city !== "N/A" ? ` • ${city}` : ""}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Box>

          {/* TWO COLUMN CONTENT */}

          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            gap={3}
            alignItems="stretch"
          >
            <SectionCard
              title="General Information"
              icon={LuChurch}
              action={
                <Button
                  variant="ghost"
                  color="var(--primary-maroon)"
                  size="xs"
                  fontWeight="600"
                  _hover={{ bg: "rgba(174, 32, 80, 0.05)" }}
                  onClick={openEdit}
                >
                  <Icon as={LuPencil} mr={1} boxSize={3.5} />
                  Edit
                </Button>
              }
            >
              <VStack align="stretch" gap={0}>
                <DetailRow label="Church Name" value={churchName} />
                <DetailRow label="Church Code" value={churchCode} />
                <DetailRow label="Diocese" value={diocese} />
                <DetailRow
                  label="Established Year"
                  value={establishedYear}
                />
                <DetailRow
                  label="Vicar / Priest"
                  value={vicarPriest}
                />
                <DetailRow label="Phone" value={phone} />
                <DetailRow label="Email" value={email} />
                <DetailRow label="Address" value={address} />
              </VStack>
            </SectionCard>

            <VStack gap={3} align="stretch">
              {/* SUBSCRIPTION */}

              <SectionCard
                title="Subscription Details"
                icon={LuCreditCard}
                action={
                  <Badge
                    colorPalette={
                      subscription?.is_active === false
                        ? "red"
                        : "green"
                    }
                    variant="subtle"
                    borderRadius="5px"
                    px={2}
                    py="2px"
                    fontSize="xs"
                  >
                    {subscriptionStatus}
                  </Badge>
                }
              >
                <VStack align="stretch" gap={0}>
                  <Flex
                    px={3}
                    py={2}
                    bg="var(--light-maroon-bg)"
                    borderRadius="5px"
                    justify="space-between"
                    align="center"
                    mb={1}
                  >
                    <Text
                      fontSize="xs"
                      color="var(--primary-maroon)"
                      fontWeight="500"
                    >
                      Current Plan
                    </Text>

                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="var(--dark-text)"
                    >
                      {packageName}
                    </Text>
                  </Flex>

                  <DetailRow
                    label="Member Limit"
                    value={
                      allowedMembers
                        ? `${allowedMembers.toLocaleString()} members`
                        : "N/A"
                    }
                  />

                  <DetailRow
                    label="Billing Cycle"
                    value={billingCycle}
                  />

                  <DetailRow
                    label="Subscribed On"
                    value={formatDate(subscribedOn, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  />

                  <DetailRow
                    label="Renewal Date"
                    value={formatDate(renewalDate, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  />

                  {/* ✅ Button is visible but not clickable */}
                  <Button
                    variant="outline"
                    borderColor="var(--primary-maroon)"
                    color="var(--primary-maroon)"
                    mt={2}
                    w="full"
                    h="34px"
                    size="sm"
                    borderRadius="5px"
                    fontWeight="600"
                    pointerEvents="none"
                    cursor="default"
                    opacity={0.7}
                  >
                    <Icon as={LuEye} mr={2} />
                    View Subscription
                  </Button>
                </VStack>
              </SectionCard>

              {/* MEMBER CAPACITY */}

              <SectionCard
                title="Member Capacity"
                icon={LuUsers}
              >
                <VStack align="stretch" gap={2}>
                  <Flex
                    justify="space-between"
                    align="flex-end"
                  >
                    <Box>
                      <Text
                        fontSize="2xl"
                        lineHeight="1"
                        fontWeight="700"
                        color="var(--dark-text)"
                      >
                        {currentMembers.toLocaleString()}
                      </Text>

                      <Text
                        fontSize="xs"
                        color="var(--light-gray)"
                        mt={0.5}
                      >
                        Active Members
                      </Text>
                    </Box>

                    <Box textAlign="right">
                      <Text
                        fontSize="2xl"
                        lineHeight="1"
                        fontWeight="700"
                        color="var(--dark-text)"
                      >
                        {allowedMembers.toLocaleString()}
                      </Text>

                      <Text
                        fontSize="xs"
                        color="var(--light-gray)"
                        mt={0.5}
                      >
                        Limit
                      </Text>
                    </Box>
                  </Flex>

                  <Progress.Root
                    value={memberPercentage}
                    size="sm"
                    borderRadius="full"
                  >
                    <Progress.Track
                      bg="var(--divider-color)"
                      borderRadius="full"
                    >
                      <Progress.Range
                        bg="var(--primary-maroon)"
                        borderRadius="full"
                      />
                    </Progress.Track>
                  </Progress.Root>

                  <Flex
                    justify="space-between"
                    align="center"
                    gap={1.5}
                    flexWrap="wrap"
                  >
                    <Text
                      fontSize="xs"
                      color="var(--light-gray)"
                    >
                      {remainingMembers.toLocaleString()} member
                      slots available
                    </Text>

                    <Badge
                      colorPalette={
                        memberPercentage >= 100
                          ? "red"
                          : memberPercentage >= 80
                          ? "orange"
                          : "green"
                      }
                      variant="subtle"
                      borderRadius="5px"
                      px={2}
                      py="2px"
                      fontSize="xs"
                    >
                      {Math.round(memberPercentage)}% Used
                    </Badge>

                    <Button
                      variant="ghost"
                      color="var(--primary-maroon)"
                      size="xs"
                      fontWeight="600"
                      _hover={{ bg: "rgba(174, 32, 80, 0.05)" }}
                      onClick={() => navigate("/family-heads")}
                    >
                      View Members
                    </Button>
                  </Flex>
                </VStack>
              </SectionCard>
            </VStack>
          </SimpleGrid>

          {/* ADMINISTRATIVE DETAILS */}

          <Box mt={3}>
            <SectionCard
              title="Administrative Details"
              icon={LuSettings}
            >
              <SimpleGrid
                columns={{ base: 2, md: 4 }}
                gap={0}
                py={1}
              >
                <AdminDetail
                  label="Registration Number"
                  value={registrationNumber}
                />
                <AdminDetail
                  label="Financial Year"
                  value={financialYear}
                />
                <AdminDetail
                  label="Default Currency"
                  value={currency}
                />
                <AdminDetail
                  label="Timezone"
                  value={timezone}
                  isLast
                />
              </SimpleGrid>
            </SectionCard>
          </Box>
        </Container>
      </Box>

      <Footer />

      {/* EDIT DIALOG */}

      <EditChurchDialog
        open={isEditOpen}
        onClose={closeEdit}
        initialChurch={church}
        onSaved={handleSaved}
      />
    </Box>
  );
};

export default ChurchInfoPage;