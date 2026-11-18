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
  Badge,
  Button,
  Input,
  Textarea,
  Field,
  Checkbox,
  Separator,
} from "@chakra-ui/react";
import {
  LuHouse,
  LuArrowLeft,
  LuPackage,
  LuCircleCheck,
  LuCalendar,
  LuArrowRight,
  LuTriangleAlert,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";
import { getChurchDashboard } from "../api/churchServices";
import { listAvailablePackages, createUpgradeEnquiry } from "../api/registryServices";

// Route of the church info page. Change this if your route is different.
const CHURCH_INFO_ROUTE = "/church-info";

const UpgradePackagePage = () => {
  const navigate = useNavigate();

  const [churchData, setChurchData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [form, setForm] = useState({
    contactPerson: "",
    mobile: "",
    email: "",
    expectedMembers: "",
    preferredContact: "Phone Call",
    preferredDate: "",
    requirements: "",
    agreed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [dashRes, pkgRes] = await Promise.all([
          getChurchDashboard(),
          listAvailablePackages(),
        ]);

        const dashData = dashRes?.data || {};
        setChurchData(dashData);

        // Expired subscriptions must renew first, not upgrade
        const subInfo = dashData.subscription;
        if (subInfo?.is_expired === true || subInfo?.status === "EXPIRED") {
          toaster.create({
            title: "Subscription expired",
            description: "Please renew your subscription before upgrading.",
            type: "warning",
          });
          navigate(CHURCH_INFO_ROUTE);
          return;
        }

        setForm((prev) => ({
          ...prev,
          contactPerson: dashData.church?.vicar_name || "",
          email: dashData.church?.email || "",
          mobile: dashData.church?.phone || "",
          expectedMembers: dashData.members?.current_count || "",
        }));

        let pkgs = pkgRes?.data?.data || pkgRes?.data || [];
        if (!Array.isArray(pkgs)) pkgs = [];

        // Never offer the plan the church is already on
        const currentPkgId = dashData.subscription?.package_id;
        if (currentPkgId) {
          pkgs = pkgs.filter((p) => p.id !== currentPkgId);
        }

        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);
      } catch (error) {
        console.error("Failed to load data", error);
        toaster.create({ title: "Error loading data", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleFieldChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!selectedPackage) {
      toaster.create({ title: "Please select a package", type: "warning" });
      return;
    }
    if (!form.agreed) {
      toaster.create({ title: "Please agree to the terms", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createUpgradeEnquiry({
        package_id: selectedPackage.id,
        contact_person: form.contactPerson,
        mobile: form.mobile,
        email: form.email,
        expected_members: form.expectedMembers,
        preferred_contact: form.preferredContact,
        preferred_date: form.preferredDate || null,
        requirements: form.requirements,
      });

      toaster.create({
        title: "Enquiry Submitted",
        description:
          "Our subscription team will review your request and contact you shortly.",
        type: "success",
        duration: 5000,
      });

      navigate(CHURCH_INFO_ROUTE);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Failed to submit enquiry.";
      toaster.create({ title: "Submission Failed", description: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="#fcfcfc">
        <Navbar />
        <Container maxW="7xl" py={8}>
          <Skeleton height="40px" w="200px" mb={6} />
          <Skeleton height="120px" borderRadius="lg" mb={6} />
          <Skeleton height="400px" borderRadius="lg" />
        </Container>
      </Box>
    );
  }

  const church = churchData?.church || {};
  const sub = churchData?.subscription || {};
  const members = churchData?.members || {};
  const currentMembers = Number(members?.current_count || 0);
  const allowedMembers = Number(sub?.capacity || sub?.member_limit || 0);
  const memberPct =
    allowedMembers > 0 ? Math.min((currentMembers / allowedMembers) * 100, 100) : 0;

  const currentYearlyPrice =
    sub?.billing_cycle === "YEARLY"
      ? Number(sub?.amount || 0)
      : Number(sub?.rate_per_member_yearly || 0) * allowedMembers;
  const newYearlyPrice = selectedPackage
    ? Number(selectedPackage.rate_per_member_yearly) * selectedPackage.member_limit
    : 0;

  // Expired / inactive status
  const isExpired =
    sub?.is_expired === true ||
    sub?.status?.toUpperCase() === "EXPIRED" ||
    sub?.is_active === false;

  return (
    <Box minH="100vh" bg="#fcfcfc" display="flex" flexDirection="column">
      <Navbar />
      <Box flex="1" py={6}>
        <Container maxW="7xl">
          {/* HEADER */}
          <Flex justify="space-between" align="center" mb={6}>
            <HStack gap={4}>
              <Circle size="48px" bg="white" border="1px solid #e2e8f0" color="#ae2050">
                <Icon as={LuHouse} boxSize={6} />
              </Circle>
              <Box>
                <Heading size="lg" color="#ae2050" fontWeight="700">
                  Upgrade Package
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Compare available packages and book an enquiry for your preferred upgrade
                </Text>
              </Box>
            </HStack>
            <Button
              variant="outline"
              color="#ae2050"
              borderColor="#ae2050"
              onClick={() => navigate(CHURCH_INFO_ROUTE)}
            >
              <Icon as={LuArrowLeft} mr={2} /> Back to Subscription
            </Button>
          </Flex>

          {/* EXPIRED BANNER (fallback if the page is ever reached while expired) */}
          {isExpired && (
            <Flex
              align="center"
              gap={3}
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              color="red.700"
              borderRadius="lg"
              p={4}
              mb={6}
            >
              <Icon as={LuTriangleAlert} boxSize={5} />
              <Text fontSize="sm" fontWeight="500">
                Your subscription has expired. Please renew it before requesting an upgrade.
              </Text>
            </Flex>
          )}

          {/* CURRENT PLAN BAR */}
          <Box
            border="1px solid #e2e8f0"
            borderRadius="xl"
            bg="white"
            p={5}
            mb={6}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
              <HStack gap={4}>
                <Circle size="50px" bg="#fdf2f6" color="#ae2050">
                  <Icon as={LuPackage} boxSize={6} />
                </Circle>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Current Plan
                  </Text>
                  <HStack>
                    <Heading size="md" color="gray.800">
                      {sub?.package_name || "N/A"}
                    </Heading>
                    <Badge colorPalette={isExpired ? "red" : "green"} variant="subtle">
                      {isExpired ? "Expired" : "Active"}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>
              <Separator
                orientation="vertical"
                height="40px"
                display={{ base: "none", md: "block" }}
              />
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Member Limit
                </Text>
                <Text fontSize="lg" fontWeight="600" color="gray.800">
                  {allowedMembers.toLocaleString()}
                </Text>
              </Box>
              <Separator
                orientation="vertical"
                height="40px"
                display={{ base: "none", md: "block" }}
              />
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Active Members
                </Text>
                <Text fontSize="lg" fontWeight="600" color="gray.800">
                  {currentMembers.toLocaleString()}
                </Text>
              </Box>
              <Separator
                orientation="vertical"
                height="40px"
                display={{ base: "none", md: "block" }}
              />
              <Box>
                <Text fontSize="xs" color="gray.500">
                  {isExpired ? "Expired On" : "Renewal Date"}
                </Text>
                <Text fontSize="lg" fontWeight="600" color="gray.800">
                  {sub?.end_date
                    ? new Date(sub.end_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </Box>
              <Badge colorPalette="red" variant="subtle" px={3} py={1.5} borderRadius="md">
                {Math.round(memberPct)}% Used
              </Badge>
            </Flex>
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} alignItems="start">
            {/* LEFT COLUMN: PACKAGE SELECTION */}
            <Box gridColumn={{ lg: "span 2" }}>
              <HStack mb={4}>
                <Circle size="36px" bg="#fdf2f6" color="#ae2050">
                  <Icon as={LuPackage} boxSize={5} />
                </Circle>
                <Box>
                  <Heading size="md" color="#ae2050">
                    Available Upgrade Packages
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    Select a package to view its complete details.
                  </Text>
                </Box>
              </HStack>

              {packages.length === 0 && (
                <Box
                  border="1px dashed #e2e8f0"
                  borderRadius="xl"
                  bg="white"
                  p={8}
                  textAlign="center"
                  mb={6}
                >
                  <Text fontSize="sm" color="gray.500">
                    No upgrade packages are available for your current plan.
                  </Text>
                </Box>
              )}

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
                {packages.map((pkg, idx) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <Box
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      cursor="pointer"
                      position="relative"
                      border="2px solid"
                      borderColor={isSelected ? "#ae2050" : "#e2e8f0"}
                      bg={isSelected ? "#fffafb" : "white"}
                      borderRadius="xl"
                      p={5}
                      transition="all 0.2s"
                      _hover={{ borderColor: isSelected ? "#ae2050" : "gray.300" }}
                    >
                      {idx === 0 && (
                        <Badge
                          position="absolute"
                          top="-10px"
                          left="50%"
                          transform="translateX(-50%)"
                          colorPalette="red"
                          variant="solid"
                          borderRadius="full"
                          px={3}
                        >
                          Recommended
                        </Badge>
                      )}
                      <VStack align="center" gap={2}>
                        <Heading size="sm" color={isSelected ? "#ae2050" : "gray.700"}>
                          {pkg.name}
                        </Heading>
                        <Text fontSize="sm" fontWeight="600" color="gray.600">
                          ₹{pkg.rate_per_member_yearly} / member / year
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Member Limit: {pkg.member_limit}
                        </Text>
                      </VStack>
                      <Circle
                        size="20px"
                        border="2px solid"
                        borderColor={isSelected ? "#ae2050" : "gray.300"}
                        mt={4}
                        mx="auto"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isSelected && <Circle size="10px" bg="#ae2050" />}
                      </Circle>
                    </Box>
                  );
                })}
              </SimpleGrid>

              {selectedPackage && (
                <Box border="1px solid #e2e8f0" borderRadius="xl" bg="white" p={6}>
                  <HStack mb={2}>
                    <Heading size="md" color="#ae2050">
                      {selectedPackage.name}
                    </Heading>
                    <Badge colorPalette="green" variant="subtle">
                      Available
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mb={6}>
                    A scalable annual plan for growing parishes.
                  </Text>

                  <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    gap={4}
                    mb={6}
                    bg="#fcfcfc"
                    p={4}
                    borderRadius="lg"
                  >
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Billing Cycle
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        Annual
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Member Limit
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {selectedPackage.member_limit.toLocaleString()} members
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Storage
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        50 GB
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Priority Support
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        Included
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                    <Box>
                      <Heading size="sm" color="#ae2050" mb={3}>
                        Package Features
                      </Heading>
                      <SimpleGrid columns={2} gap={2}>
                        {[
                          "All Sacramental Registers",
                          "Member Subscription Management",
                          "Advanced Accounting & Financial Reports",
                          "Email and SMS Notifications",
                          "Unlimited Users and Roles",
                          "Priority Technical Support",
                          "Automated Daily Backups",
                          "Data Export and API Access",
                        ].map((feat, i) => (
                          <HStack key={i} align="start" gap={2}>
                            <Icon as={LuCircleCheck} color="#ae2050" boxSize={4} mt={0.5} />
                            <Text fontSize="xs" color="gray.600">
                              {feat}
                            </Text>
                          </HStack>
                        ))}
                      </SimpleGrid>
                    </Box>
                    <Box>
                      <Heading size="sm" color="#ae2050" mb={3}>
                        Estimated Pricing
                      </Heading>
                      <VStack align="stretch" gap={2} fontSize="sm">
                        <Flex justify="space-between">
                          <Text color="gray.600">Package Rate</Text>
                          <Text fontWeight="500">
                            ₹{selectedPackage.rate_per_member_yearly}.00 ×{" "}
                            {selectedPackage.member_limit} members
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Base Amount</Text>
                          <Text fontWeight="500">₹{newYearlyPrice.toLocaleString()}.00</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Tax (18%)</Text>
                          <Text fontWeight="500">
                            ₹{(newYearlyPrice * 0.18).toLocaleString()}.00
                          </Text>
                        </Flex>
                        <Separator my={1} />
                        <Flex justify="space-between">
                          <Text fontWeight="700" color="#ae2050">
                            Estimated Annual Total
                          </Text>
                          <Text fontWeight="700" color="#ae2050">
                            ₹{(newYearlyPrice * 1.18).toLocaleString()}.00
                          </Text>
                        </Flex>
                      </VStack>
                    </Box>
                  </SimpleGrid>

                  <Separator my={6} />

                  {/* Arrow Comparison */}
                  <Flex
                    justify="space-between"
                    align="center"
                    bg="#fffafb"
                    p={4}
                    borderRadius="lg"
                    border="1px solid #fdf2f6"
                  >
                    <Box>
                      <Text fontSize="xs" fontWeight="600" color="#ae2050">
                        Current: {sub?.package_name}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {allowedMembers} members • ₹{currentYearlyPrice.toLocaleString()}/year
                      </Text>
                    </Box>
                    <Icon as={LuArrowRight} color="#ae2050" boxSize={5} />
                    <Box textAlign="right">
                      <Text fontSize="xs" fontWeight="600" color="#ae2050">
                        Upgrade: {selectedPackage.name}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {selectedPackage.member_limit} members • ₹
                        {newYearlyPrice.toLocaleString()}/year
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* RIGHT COLUMN: ENQUIRY FORM */}
            <Box
              border="1px solid #e2e8f0"
              borderRadius="xl"
              bg="white"
              p={6}
              boxShadow="sm"
              position="sticky"
              top={6}
            >
              <HStack mb={2}>
                <Circle size="32px" bg="#fdf2f6" color="#ae2050">
                  <Icon as={LuCalendar} boxSize={4} />
                </Circle>
                <Box>
                  <Heading size="md" color="#ae2050">
                    Book an Enquiry
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    Our team will contact you to discuss the upgrade.
                  </Text>
                </Box>
              </HStack>

              <VStack gap={4} align="stretch" mt={6}>
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="600">
                    Preferred Package *
                  </Field.Label>
                  <Input value={selectedPackage?.name || ""} readOnly bg="gray.50" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="600">
                    Church Name
                  </Field.Label>
                  <Input value={church?.name || ""} readOnly bg="gray.50" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="600">
                    Contact Person *
                  </Field.Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => handleFieldChange("contactPerson", e.target.value)}
                  />
                </Field.Root>

                <SimpleGrid columns={2} gap={3}>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="600">
                      Mobile Number *
                    </Field.Label>
                    <Input
                      value={form.mobile}
                      onChange={(e) => handleFieldChange("mobile", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="600">
                      Email *
                    </Field.Label>
                    <Input
                      value={form.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                    />
                  </Field.Root>
                </SimpleGrid>

                <SimpleGrid columns={2} gap={3}>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="600">
                      Expected Members *
                    </Field.Label>
                    <Input
                      value={form.expectedMembers}
                      onChange={(e) => handleFieldChange("expectedMembers", e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="600">
                      Preferred Contact *
                    </Field.Label>
                    <select
                      className="chakra-select"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                      }}
                      value={form.preferredContact}
                      onChange={(e) => handleFieldChange("preferredContact", e.target.value)}
                    >
                      <option>Phone Call</option>
                      <option>Email</option>
                      <option>WhatsApp</option>
                    </select>
                  </Field.Root>
                </SimpleGrid>

                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="600">
                    Preferred Date *
                  </Field.Label>
                  <Input
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => handleFieldChange("preferredDate", e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="600">
                    Requirements / Message
                  </Field.Label>
                  <Textarea
                    placeholder="We would like to understand the upgrade process..."
                    rows={3}
                    value={form.requirements}
                    onChange={(e) => handleFieldChange("requirements", e.target.value)}
                  />
                </Field.Root>

                <Checkbox.Root
                  checked={form.agreed}
                  onCheckedChange={(e) => handleFieldChange("agreed", !!e.checked)}
                  size="sm"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label fontSize="xs" color="gray.600">
                    I agree to be contacted regarding this package enquiry.
                  </Checkbox.Label>
                </Checkbox.Root>

                <Button
                  bg="#ae2050"
                  color="white"
                  w="full"
                  mt={2}
                  size="lg"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isExpired || !selectedPackage}
                >
                  Submit Enquiry
                </Button>

                <Box
                  bg="#fffafb"
                  p={3}
                  borderRadius="md"
                  textAlign="center"
                  border="1px solid #fdf2f6"
                >
                  <Text fontSize="xs" color="#ae2050" fontStyle="italic">
                    Our subscription team will respond within one business day.
                  </Text>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default UpgradePackagePage;