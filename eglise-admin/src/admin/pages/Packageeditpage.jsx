// src/admin/pages/PackageEditPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Flex,
  Circle,
  Icon,
  Badge,
} from "@chakra-ui/react";
import {
  LuBox,
  LuHouse,
  LuChevronRight,
  LuLock,
  LuCalendar,
  LuClock,
  LuUser,
  LuUsers,
  LuArrowRight,
  LuIndianRupee,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// Field names — matched to your Package model / API.
const F = {
  code: "code",
  name: "name",
  monthly: "rate_per_member_monthly",
  yearly: "rate_per_member_yearly",
  limit: "member_limit",
  active: "is_active",
  created: "created_at",
  updated: "updated_at",
  subscribed: "church_count",       // active subscriptions
  activeChurches: "church_count",
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PackageEditPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Data comes from location.state (passed when Edit is clicked), like the other pages
  const pkg = location.state?.package || location.state?.pkg || {};

  const [form, setForm] = useState({
    [F.name]: pkg[F.name] || "",
    [F.monthly]: pkg[F.monthly] ?? "",
    [F.yearly]: pkg[F.yearly] ?? "",
    [F.limit]: pkg[F.limit] ?? "",
    [F.active]: pkg[F.active] ?? true,
  });
  const [saving, setSaving] = useState(false);

  const packageId = pkg.id || id;
  const subscribedCount = pkg[F.subscribed] ?? pkg[F.activeChurches] ?? 0;
  const activeChurches = pkg[F.activeChurches] ?? pkg[F.subscribed] ?? 0;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();

    if (!String(form[F.name]).trim()) {
      toaster.create({ title: "Package name required", type: "error", duration: 3500 });
      return;
    }
    if (form[F.monthly] === "" || form[F.yearly] === "" || form[F.limit] === "") {
      toaster.create({ title: "Missing values", description: "Rates and member limit are required.", type: "error", duration: 3500 });
      return;
    }

    const payload = {
      [F.name]: String(form[F.name]).trim(),
      [F.monthly]: Number(form[F.monthly]),
      [F.yearly]: Number(form[F.yearly]),
      [F.limit]: Number(form[F.limit]),
      [F.active]: !!form[F.active],
    };

    setSaving(true);
    try {
      // Backend: PATCH packages/<id>/ (PackageDetailAPIView).
      // Uses adminApi.updatePackage if you have it, else falls back to the endpoint.
      if (adminApi.updatePackage) {
        await adminApi.updatePackage(packageId, payload);
      } else {
        await adminApi.patch(`/api/packages/${packageId}/`, payload);
      }
      toaster.create({ title: "Package updated", description: "Your changes have been saved.", type: "success", duration: 3000 });
      navigate("/admin/packages");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to save changes.";
      toaster.create({ title: "Save failed", description: msg, type: "error", duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const fieldProps = {
    h: "44px",
    fontSize: "sm",
    borderRadius: "lg",
    borderWidth: "1.5px",
    borderColor: "gray.200",
    bg: "white",
    _hover: { borderColor: "gray.300" },
    _focus: { borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` },
  };

  const Label = ({ children, required }) => (
    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
      {children}
      {required && <Box as="span" color="#e53e3e" ml={1}>*</Box>}
    </Text>
  );

  const RecordRow = ({ icon, label, value }) => (
    <Flex align="center" justify="space-between" py={2.5}>
      <HStack spacing={2.5} color="gray.500">
        <Icon as={icon} boxSize={4} color={primaryMaroon} />
        <Text fontSize="sm">{label}</Text>
      </HStack>
      <Text fontSize="sm" fontWeight="600" color="#333">
        {value}
      </Text>
    </Flex>
  );

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        {/* Breadcrumb */}
        <HStack spacing={2} mb={3} color="gray.400" fontSize="sm" fontWeight="600">
          <Box as="button" display="flex" alignItems="center" _hover={{ color: primaryMaroon }} onClick={() => navigate("/admin/dashboard")}>
            <LuHouse size={15} />
          </Box>
          <LuChevronRight size={13} />
          <Box as="button" _hover={{ color: primaryMaroon }} onClick={() => navigate("/admin/packages")}>
            Packages
          </Box>
          <LuChevronRight size={13} />
          <Text color="gray.600">{pkg[F.name] || "Edit"}</Text>
          <LuChevronRight size={13} />
          <Text color="gray.600">Edit</Text>
        </HStack>

        {/* Header */}
        <VStack align="start" spacing={1} mb={3}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Package Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Edit Package
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Update package pricing, capacity and availability.
          </Text>
        </VStack>

        {/* Summary strip */}
        <Flex
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.100"
          boxShadow="0 4px 20px -8px rgba(0,0,0,0.06)"
          p={4}
          mb={4}
          align="center"
          justify="space-between"
          flexWrap="wrap"
          gap={4}
        >
          <HStack spacing={4}>
            <Circle size="56px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuBox} boxSize={7} />
            </Circle>
            <Box>
              <HStack spacing={3}>
                <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
                  {pkg[F.name] || form[F.name] || "Package"}
                </Heading>
                <Badge
                  bg={form[F.active] ? "rgba(56,161,105,0.10)" : "gray.100"}
                  color={form[F.active] ? "#2f855a" : "gray.500"}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="700"
                >
                  {form[F.active] ? "Active" : "Inactive"}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500" mt={0.5}>
                {pkg[F.code] || "—"}
              </Text>
            </Box>
          </HStack>

          <HStack spacing={4} borderLeft="1px solid" borderColor="gray.100" pl={6}>
            <Box textAlign="right">
              <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
                {subscribedCount}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Subscribed Churches
              </Text>
            </Box>
          </HStack>
        </Flex>

        {/* Body: form + side cards */}
        <Flex gap={5} align="start" flexWrap={{ base: "wrap", lg: "nowrap" }}>
          {/* Form card */}
          <Box
            as="form"
            onSubmit={handleSave}
            flex="1"
            minW={{ base: "100%", lg: "auto" }}
            bg="white"
            borderRadius="2xl"
            border="1px solid"
            borderColor="gray.100"
            boxShadow="0 4px 20px -8px rgba(0,0,0,0.06)"
            p={{ base: 4, md: 6 }}
          >
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e" mb={4}>
              Package Information
            </Heading>

            <Flex gap={5} flexWrap="wrap">
              {/* Package Code (read-only) */}
              <Box flex="1" minW="240px">
                <Label required>Package Code</Label>
                <Box position="relative">
                  <Input value={pkg[F.code] || ""} readOnly {...fieldProps} bg="gray.50" color="gray.500" pr="40px" cursor="not-allowed" />
                  <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color="gray.400">
                    <LuLock size={15} />
                  </Box>
                </Box>
              </Box>

              {/* Package Name */}
              <Box flex="1" minW="240px">
                <Label required>Package Name</Label>
                <Input value={form[F.name]} onChange={(e) => set(F.name, e.target.value)} placeholder="Package name" {...fieldProps} />
              </Box>
            </Flex>

            <Flex gap={5} flexWrap="wrap" mt={4}>
              {/* Monthly */}
              <Box flex="1" minW="240px">
                <Label required>Rate per Member (Monthly)</Label>
                <Box position="relative">
                  <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="gray.400" zIndex={1}>
                    <LuIndianRupee size={15} />
                  </Box>
                  <Input type="number" min="0" step="0.01" value={form[F.monthly]} onChange={(e) => set(F.monthly, e.target.value)} pl="34px" {...fieldProps} />
                </Box>
                <Text fontSize="xs" color="gray.400" mt={1.5}>Per member / month</Text>
              </Box>

              {/* Yearly */}
              <Box flex="1" minW="240px">
                <Label required>Rate per Member (Yearly)</Label>
                <Box position="relative">
                  <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="gray.400" zIndex={1}>
                    <LuIndianRupee size={15} />
                  </Box>
                  <Input type="number" min="0" step="0.01" value={form[F.yearly]} onChange={(e) => set(F.yearly, e.target.value)} pl="34px" {...fieldProps} />
                </Box>
                <Text fontSize="xs" color="gray.400" mt={1.5}>Per member / year</Text>
              </Box>
            </Flex>

            <Flex gap={5} flexWrap="wrap" mt={4} align="start">
              {/* Member limit */}
              <Box flex="1" minW="240px">
                <Label required>Member Limit</Label>
                <Input type="number" min="0" value={form[F.limit]} onChange={(e) => set(F.limit, e.target.value)} {...fieldProps} />
              </Box>

              {/* Status toggle */}
              <Box flex="1" minW="240px">
                <Label required>Status</Label>
                <HStack spacing={3} h="48px">
                  <Box
                    as="button"
                    type="button"
                    onClick={() => set(F.active, !form[F.active])}
                    w="46px"
                    h="26px"
                    borderRadius="full"
                    bg={form[F.active] ? "#38a169" : "gray.300"}
                    position="relative"
                    transition="background 0.2s"
                    flexShrink={0}
                  >
                    <Box
                      position="absolute"
                      top="3px"
                      left={form[F.active] ? "23px" : "3px"}
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      bg="white"
                      transition="left 0.2s"
                      boxShadow="sm"
                    />
                  </Box>
                  <Text fontSize="sm" fontWeight="600" color="#333">
                    {form[F.active] ? "Active" : "Inactive"}
                  </Text>
                </HStack>
              </Box>
            </Flex>

            {/* Actions */}
            <Flex justify="flex-end" gap={3} mt={5}>
              <Button
                type="button"
                variant="outline"
                borderColor={primaryMaroon}
                color={primaryMaroon}
                borderRadius="lg"
                px={8}
                h="46px"
                _hover={{ bg: "rgba(174,32,80,0.05)" }}
                onClick={() => navigate("/admin/packages")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="white"
                borderRadius="lg"
                px={8}
                h="46px"
                fontWeight="700"
                style={{ background: "linear-gradient(100deg,#c11a4c 0%,#7a1236 100%)" }}
                _hover={{ filter: "brightness(0.95)" }}
                isLoading={saving}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </Flex>
          </Box>

          {/* Side cards */}
          <VStack spacing={4} align="stretch" w={{ base: "100%", lg: "320px" }} flexShrink={0}>
            {/* Record Information */}
            <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="0 4px 20px -8px rgba(0,0,0,0.06)" p={4}>
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={2}>
                Record Information
              </Heading>
              <RecordRow icon={LuCalendar} label="Created" value={formatDate(pkg[F.created])} />
              <RecordRow icon={LuClock} label="Last Updated" value={formatDate(pkg[F.updated])} />
            </Box>

            {/* Subscription Summary */}
            <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="0 4px 20px -8px rgba(0,0,0,0.06)" p={4}>
              <Heading fontSize="md" fontWeight="700" color="#1a1a2e" mb={3}>
                Subscription Summary
              </Heading>
              <HStack spacing={4} mb={4}>
                <Circle size="52px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                  <Icon as={LuUsers} boxSize={6} />
                </Circle>
                <Box>
                  <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
                    {activeChurches}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    Active Churches
                  </Text>
                </Box>
              </HStack>
              <Box
                as="button"
                type="button"
                display="flex"
                alignItems="center"
                gap={2}
                color={primaryMaroon}
                fontWeight="600"
                fontSize="sm"
                _hover={{ textDecoration: "underline" }}
                onClick={() => navigate(`/admin/packages/${packageId}/churches`, { state: { package: pkg } })}
              >
                View subscribed churches
                <LuArrowRight size={16} />
              </Box>
            </Box>
          </VStack>
        </Flex>
      </Container>
    </AdminLayout>
  );
};

export default PackageEditPage;