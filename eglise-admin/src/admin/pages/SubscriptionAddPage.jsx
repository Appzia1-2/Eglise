// src/admin/pages/SubscriptionAddPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Flex,
  Grid,
  GridItem,
  Icon,
  Circle,
  Badge,
} from "@chakra-ui/react";
import {
  LuSave,
  LuBox,
  LuCalendar,
  LuChevronDown,
  LuCheck,
  LuSearch,
  LuX,
  LuUsers,
  LuCalculator,
  LuPackage,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// Church Dropdown Component
const ChurchDropdown = ({ options, value, onChange, placeholder, isInvalid, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = React.useRef(null);
  const searchRef = React.useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayValue = () => {
    if (selectedOption) {
      return (
        <Flex align="center" gap={2} flex="1" overflow="hidden">
          <Box flex="1">
            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
              {selectedOption.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {selectedOption.code}
            </Text>
          </Box>
        </Flex>
      );
    }
    return <Text color="gray.400" fontSize="sm">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Box
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
        borderRadius="md"
        height="40px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _hover={{ borderColor: isInvalid ? "#e53e3e" : "#cbd5e0" }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}
        <LuChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            color: isOpen ? primaryMaroon : '#718096',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </Box>

      {isOpen && (
        <Box
          position="absolute"
          left="0"
          right="0"
          top="calc(100% + 4px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          maxHeight="360px"
          overflow="hidden"
        >
          <Box p={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
            <Flex
              align="center"
              gap={2}
              bg="white"
              px={2}
              py={1}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <LuSearch size={14} color="#718096" />
              <Input
                ref={searchRef}
                placeholder="Search church by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                border="none"
                _focus={{ boxShadow: "none" }}
                bg="transparent"
                px={0}
                height="28px"
                fontSize="13px"
                _placeholder={{ color: "gray.400" }}
              />
              {searchTerm && (
                <Box
                  as="button"
                  onClick={() => setSearchTerm("")}
                  color="gray.400"
                  _hover={{ color: "gray.600" }}
                >
                  <LuX size={12} />
                </Box>
              )}
            </Flex>
          </Box>

          <Box
            maxHeight="260px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'gray.50' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box px={4} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400">No churches found</Text>
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.id}
                  px={3}
                  py={2.5}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleSelect(option)}
                  bg={option.id === value ? "purple.50" : "transparent"}
                  transition="all 0.15s"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                >
                  <Flex direction="column" flex="1">
                    <Text
                      fontSize="sm"
                      color={option.id === value ? primaryMaroon : "gray.700"}
                      fontWeight={option.id === value ? "600" : "500"}
                    >
                      {option.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {option.code} • {option.city || "No city"}
                    </Text>
                  </Flex>
                  {option.id === value && (
                    <LuCheck size={16} color={primaryMaroon} flexShrink={0} />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Package Dropdown Component
const PackageDropdown = ({ options, value, onChange, placeholder, isInvalid, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = React.useRef(null);
  const searchRef = React.useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayValue = () => {
    if (selectedOption) {
      return (
        <Flex align="center" gap={2} flex="1" overflow="hidden">
          <Box flex="1">
            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
              {selectedOption.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {selectedOption.code}
            </Text>
          </Box>
          <Badge
            bg={selectedOption.is_active ? "green.50" : "red.50"}
            color={selectedOption.is_active ? "green.600" : "red.600"}
            fontSize="10px"
            px={2}
            py={0.5}
            borderRadius="full"
          >
            {selectedOption.is_active ? "Active" : "Inactive"}
          </Badge>
        </Flex>
      );
    }
    return <Text color="gray.400" fontSize="sm">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Box
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
        borderRadius="md"
        height="40px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _hover={{ borderColor: isInvalid ? "#e53e3e" : "#cbd5e0" }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}
        <LuChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            color: isOpen ? primaryMaroon : '#718096',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </Box>

      {isOpen && (
        <Box
          position="absolute"
          left="0"
          right="0"
          top="calc(100% + 4px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          maxHeight="360px"
          overflow="hidden"
        >
          <Box p={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
            <Flex
              align="center"
              gap={2}
              bg="white"
              px={2}
              py={1}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <LuSearch size={14} color="#718096" />
              <Input
                ref={searchRef}
                placeholder="Search package by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                border="none"
                _focus={{ boxShadow: "none" }}
                bg="transparent"
                px={0}
                height="28px"
                fontSize="13px"
                _placeholder={{ color: "gray.400" }}
              />
              {searchTerm && (
                <Box
                  as="button"
                  onClick={() => setSearchTerm("")}
                  color="gray.400"
                  _hover={{ color: "gray.600" }}
                >
                  <LuX size={12} />
                </Box>
              )}
            </Flex>
          </Box>

          <Box
            maxHeight="260px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'gray.50' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box px={4} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400">No packages found</Text>
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.id}
                  px={3}
                  py={2.5}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleSelect(option)}
                  bg={option.id === value ? "purple.50" : "transparent"}
                  transition="all 0.15s"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                >
                  <Flex direction="column" flex="1">
                    <Text
                      fontSize="sm"
                      color={option.id === value ? primaryMaroon : "gray.700"}
                      fontWeight={option.id === value ? "600" : "500"}
                    >
                      {option.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {option.code} • ₹{option.rate_per_member_monthly}/mo
                    </Text>
                  </Flex>
                  <Badge
                    bg={option.is_active ? "green.50" : "red.50"}
                    color={option.is_active ? "green.600" : "red.600"}
                    fontSize="10px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {option.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {option.id === value && (
                    <LuCheck size={16} color={primaryMaroon} flexShrink={0} ml={2} />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

const SubscriptionAddPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [churches, setChurches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [billingCycle, setBillingCycle] = useState("YEARLY");
  // 🔥 FIX: durationMonths is removed from UI, but we'll use a default value
  // This is ONLY for end_date calculation, NOT for pricing
  const durationMonths = 12; // Default to 12 months
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [churchesRes, packagesRes] = await Promise.all([
        adminApi.getChurches(),
        adminApi.getPackages({ is_active: true }),
      ]);

      let churchesData = churchesRes.data || [];
      let packagesData = packagesRes.results || packagesRes.data || [];

      setChurches(churchesData);
      setPackages(packagesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load data.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChurchSelect = (churchId) => {
    const church = churches.find(c => c.id === churchId);
    setSelectedChurch(church);
    if (errors.church) {
      setErrors({ ...errors, church: "" });
    }
  };

  const handlePackageSelect = (packageId) => {
    const pkg = packages.find(p => p.id === packageId);
    setSelectedPackage(pkg);
    if (errors.package) {
      setErrors({ ...errors, package: "" });
    }
  };

  const handleBillingCycleToggle = (cycle) => {
    setBillingCycle(cycle);
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedChurch) newErrors.church = "Please select a church";
    if (!selectedPackage) newErrors.package = "Please select a package";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Rate per member for the currently selected billing cycle
  const getRatePerMember = () => {
    if (!selectedPackage) return 0;
    return billingCycle === "MONTHLY"
      ? selectedPackage.rate_per_member_monthly
      : selectedPackage.rate_per_member_yearly;
  };

  // 🔥 FIX: Amount = capacity × rate per member
  // NO duration_months multiplication!
  const calculateAmount = () => {
    if (!selectedPackage) return 0;
    const capacity = selectedPackage.member_limit || 0;
    const rate = getRatePerMember();
    return capacity * rate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = {
        church_id: selectedChurch.id,
        package_id: selectedPackage.id,
        billing_cycle: billingCycle,
        duration_months: durationMonths, // ONLY for end_date calculation
      };

      const response = await adminApi.createSubscription(data);

      toaster.create({
        title: "Success",
        description: `Subscription assigned to ${selectedChurch.name} successfully.`,
        type: "success",
        duration: 3000,
      });

      if (response && response.data && response.data.subscription_id) {
        navigate(`/admin/subscriptions/${response.data.subscription_id}`);
      } else {
        navigate("/admin/subscriptions");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to assign subscription.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalAmount = calculateAmount();
  const ratePerMember = getRatePerMember();
  const capacity = selectedPackage?.member_limit || 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <div style={{ border: "4px solid #e2e8f0", borderTop: "4px solid #ae2050", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
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

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        <Text fontSize="xs" color="gray.400" fontWeight="600" mb={2}>
          Churches / Subscriptions / Assign Subscription
        </Text>

        <VStack align="start" spacing={1} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Subscription Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Assign Subscription
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Assign an existing package to a registered church.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
          {/* Section header with icon */}
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuBox} boxSize={5} />
            </Circle>
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              Subscription Assignment
            </Heading>
          </HStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              {/* Row 1: Church and Package */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Church *
                  </Text>
                  <ChurchDropdown
                    options={churches}
                    value={selectedChurch?.id || null}
                    onChange={handleChurchSelect}
                    placeholder="Select a church..."
                    isInvalid={!!errors.church}
                    error={errors.church}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Select the church to assign the package
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Package *
                  </Text>
                  <PackageDropdown
                    options={packages}
                    value={selectedPackage?.id || null}
                    onChange={handlePackageSelect}
                    placeholder="Select a package..."
                    isInvalid={!!errors.package}
                    error={errors.package}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Select the package to assign to the church
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 2: Billing Cycle */}
              <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Billing Cycle *
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      flex="1"
                      onClick={() => handleBillingCycleToggle("MONTHLY")}
                      bg={billingCycle === "MONTHLY" ? primaryMaroon : "gray.50"}
                      color={billingCycle === "MONTHLY" ? "white" : "gray.600"}
                      border={billingCycle === "MONTHLY" ? `2px solid ${primaryMaroon}` : "2px solid transparent"}
                      borderRadius="md"
                      py={1.5}
                      fontSize="sm"
                      fontWeight="600"
                      height="40px"
                      _hover={{
                        bg: billingCycle === "MONTHLY" ? "#8a1a3e" : "gray.100"
                      }}
                    >
                      Monthly
                    </Button>
                    <Button
                      flex="1"
                      onClick={() => handleBillingCycleToggle("YEARLY")}
                      bg={billingCycle === "YEARLY" ? primaryMaroon : "gray.50"}
                      color={billingCycle === "YEARLY" ? "white" : "gray.600"}
                      border={billingCycle === "YEARLY" ? `2px solid ${primaryMaroon}` : "2px solid transparent"}
                      borderRadius="md"
                      py={1.5}
                      fontSize="sm"
                      fontWeight="600"
                      height="40px"
                      _hover={{
                        bg: billingCycle === "YEARLY" ? "#8a1a3e" : "gray.100"
                      }}
                    >
                      Yearly
                    </Button>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {billingCycle === "MONTHLY" ? "Billed monthly" : "Billed annually"} • 12 months duration
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 3: Start Date */}
              <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Start Date *
                  </Text>
                  <Box
                    bg="gray.50"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    border="1.5px solid"
                    borderColor="gray.200"
                    height="40px"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Icon as={LuCalendar} color="gray.400" boxSize={4} />
                    <Text fontSize="sm" fontWeight="500" color="#333">
                      {new Date().toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      (Today)
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Subscription starts from today • End date will be automatically calculated
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 4: Church Summary + Selected Package */}
              {(selectedChurch || selectedPackage) && (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem>
                    <Box
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="lg"
                      p={4}
                    >
                      <HStack spacing={3} mb={4}>
                        <Circle size="36px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                          <Icon as={LuUsers} boxSize={4} />
                        </Circle>
                        <Text fontWeight="700" color="#1a1a2e">
                          Church Summary
                        </Text>
                      </HStack>
                      <Grid templateColumns="1fr 1fr 1fr" gap={3}>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Location
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {selectedChurch
                              ? [selectedChurch.city, selectedChurch.state].filter(Boolean).join(", ") || "—"
                              : "—"}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Currency
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {selectedChurch?.currency ? `${selectedChurch.currency} (₹)` : "INR (₹)"}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Status
                          </Text>
                          <Badge
                            bg={selectedChurch?.is_active ? "green.50" : "red.50"}
                            color={selectedChurch?.is_active ? "green.600" : "red.600"}
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            {selectedChurch?.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </GridItem>
                      </Grid>
                    </Box>
                  </GridItem>

                  <GridItem>
                    <Box
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="lg"
                      p={4}
                    >
                      <HStack spacing={3} mb={4}>
                        <Circle size="36px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                          <Icon as={LuPackage} boxSize={4} />
                        </Circle>
                        <Text fontWeight="700" color="#1a1a2e">
                          Selected Package
                        </Text>
                      </HStack>
                      <Grid templateColumns="1fr 1fr 1fr 1fr" gap={3}>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Rate (Monthly)
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {selectedPackage ? formatCurrency(selectedPackage.rate_per_member_monthly) : "—"}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Rate (Yearly)
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {selectedPackage ? formatCurrency(selectedPackage.rate_per_member_yearly) : "—"}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Member Limit
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                            {selectedPackage?.member_limit?.toLocaleString() ?? "—"}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            Status
                          </Text>
                          <Badge
                            bg={selectedPackage?.is_active ? "green.50" : "red.50"}
                            color={selectedPackage?.is_active ? "green.600" : "red.600"}
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            {selectedPackage ? (selectedPackage.is_active ? "Active" : "Inactive") : "—"}
                          </Badge>
                        </GridItem>
                      </Grid>
                    </Box>
                  </GridItem>
                </Grid>
              )}

              {/* Row 5: Amount - WITH DYNAMIC CALCULATION */}
              {selectedPackage && (
                <Box
                  bg="rgba(174,32,80,0.06)"
                  border="1px solid"
                  borderColor="rgba(174,32,80,0.15)"
                  borderRadius="lg"
                  p={4}
                >
                  <HStack spacing={3} mb={2}>
                    <Circle size="36px" bg="rgba(174,32,80,0.1)" color={primaryMaroon}>
                      <Icon as={LuCalculator} boxSize={4} />
                    </Circle>
                    <Text fontWeight="700" color="#1a1a2e">
                      {billingCycle === "YEARLY" ? "Yearly" : "Monthly"} Subscription Amount
                    </Text>
                    {/* ✅ FIX: Dynamic calculation instead of hardcoded */}
                    <Badge
                      bg="blue.50"
                      color="blue.600"
                      fontSize="10px"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {formatCurrency(ratePerMember)} × {capacity} = {formatCurrency(totalAmount)}
                    </Badge>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="800" color={primaryMaroon} lineHeight="1">
                    {formatCurrency(totalAmount)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {capacity.toLocaleString()} member limit × {formatCurrency(ratePerMember)} per member ({billingCycle === "YEARLY" ? "yearly" : "monthly"})
                  </Text>
                  {billingCycle === "YEARLY" && selectedPackage?.rate_per_member_monthly && (
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      (Monthly equivalent: {formatCurrency(selectedPackage.rate_per_member_monthly)} × {capacity} = {formatCurrency(selectedPackage.rate_per_member_monthly * capacity)})
                    </Text>
                  )}
                </Box>
              )}

              {/* Row 6: Submit */}
              <Flex justify="flex-end" pt={2}>
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#8a1a3e" }}
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Assigning..."
                  size="lg"
                  px={8}
                >
                  <Icon as={LuSave} boxSize={4} /> Assign Subscription
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default SubscriptionAddPage;