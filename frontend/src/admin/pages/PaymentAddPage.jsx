// src/admin/pages/PaymentAddPage.jsx
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
  Textarea,
} from "@chakra-ui/react";
import {
  LuSave,
  LuBox,
  LuCalendar,
  LuChevronDown,
  LuCheck,
  LuSearch,
  LuX,
  LuCalculator,
  LuReceipt,
  LuTag,
  LuClock,
  LuUser,
  LuPackage,
  LuDollarSign,
  LuInfo,
  LuBuilding,
  LuWallet,
  LuTrendingUp,
  LuCreditCard,
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
      <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
        Church *
      </Text>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
        borderRadius="md"
        height="48px"
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
          size={16}
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

// Subscription Dropdown Component
const SubscriptionDropdown = ({ options, value, onChange, placeholder, isInvalid, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (selectedOption) {
      const isYearly = selectedOption.billing_cycle === "YEARLY";
      const cycleLabel = isYearly ? "Yearly" : "Monthly";
      return (
        <Flex align="center" gap={2} flex="1" overflow="hidden">
          <Box flex="1">
            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
              {selectedOption.package_name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {cycleLabel} • {selectedOption.capacity || 0} members • ₹{selectedOption.amount?.toLocaleString() || 0}
            </Text>
          </Box>
          <Badge
            bg={isYearly ? "purple.50" : "blue.50"}
            color={isYearly ? "purple.600" : "blue.600"}
            fontSize="10px"
            px={2}
            py={0.5}
            borderRadius="full"
            flexShrink={0}
          >
            {cycleLabel}
          </Badge>
        </Flex>
      );
    }
    return <Text color="gray.400" fontSize="sm">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
        Subscription *
      </Text>
      <Box
        onClick={() => options.length > 0 && setIsOpen(!isOpen)}
        cursor={options.length > 0 ? "pointer" : "default"}
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
        borderRadius="md"
        height="48px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={options.length === 0 ? "gray.50" : "white"}
        _hover={{ borderColor: isInvalid ? "#e53e3e" : options.length > 0 ? "#cbd5e0" : "#e2e8f0" }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}
        {options.length > 0 && (
          <LuChevronDown
            size={16}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
              color: isOpen ? primaryMaroon : '#718096',
              flexShrink: 0,
              marginLeft: '6px'
            }}
          />
        )}
      </Box>

      {isOpen && options.length > 0 && (
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
          maxHeight="260px"
          overflowY="auto"
        >
          {options.map((option) => {
            const isYearly = option.billing_cycle === "YEARLY";
            const cycleLabel = isYearly ? "Yearly" : "Monthly";
            return (
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
                    {option.package_name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {cycleLabel} • {option.capacity || 0} members • ₹{option.amount?.toLocaleString() || 0}
                  </Text>
                </Flex>
                <HStack spacing={2}>
                  <Badge
                    bg={isYearly ? "purple.50" : "blue.50"}
                    color={isYearly ? "purple.600" : "blue.600"}
                    fontSize="10px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {cycleLabel}
                  </Badge>
                  {option.id === value && (
                    <LuCheck size={16} color={primaryMaroon} flexShrink={0} />
                  )}
                </HStack>
              </Box>
            );
          })}
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

const PaymentAddPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [churches, setChurches] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedTaxType, setSelectedTaxType] = useState(null);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "CASH",
    payment_status: "PAID",
    transaction_id: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
  ];

  const paymentStatuses = [
    { value: "PAID", label: "Paid" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "PENDING", label: "Pending" },
    { value: "FAILED", label: "Failed" },
    { value: "REFUNDED", label: "Refunded" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const generateTransactionId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN-${year}${month}${day}-${random}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [churchesRes, subscriptionsRes, taxTypesRes, taxRatesRes] = await Promise.all([
        adminApi.getChurches(),
        adminApi.getSubscriptions(),
        adminApi.getTaxTypes(),
        adminApi.getTaxRates(),
      ]);

      let churchesData = churchesRes.data || [];
      let subscriptionsData = subscriptionsRes.data || [];
      let taxTypesData = taxTypesRes.data || [];
      let taxRatesData = taxRatesRes.data || [];

      setChurches(churchesData);
      setAllSubscriptions(subscriptionsData);
      setTaxTypes(taxTypesData);
      setTaxRates(taxRatesData);
      
      setFormData(prev => ({
        ...prev,
        transaction_id: generateTransactionId(),
      }));
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
    setSelectedSubscription(null);
    setFilteredSubscriptions([]);
    
    const churchSubs = allSubscriptions.filter(s => s.church_id === churchId);
    setFilteredSubscriptions(churchSubs);
    
    if (churchSubs.length > 0) {
      setSelectedSubscription(churchSubs[0]);
      updateFormFromSubscription(churchSubs[0]);
    } else {
      setSelectedSubscription(null);
      setFormData(prev => ({
        ...prev,
        amount: "",
      }));
    }
    
    if (errors.church) {
      setErrors({ ...errors, church: "" });
    }
  };

  const handleSubscriptionSelect = (subscriptionId) => {
    const subscription = filteredSubscriptions.find(s => s.id === subscriptionId);
    if (subscription) {
      setSelectedSubscription(subscription);
      updateFormFromSubscription(subscription);
    }
  };

  const updateFormFromSubscription = (subscription) => {
    // Use the amount already calculated by the backend
    // For yearly: rate_per_member_yearly × capacity
    // For monthly: rate_per_member_monthly × capacity
    const amount = subscription.amount || 0;
    
    setFormData(prev => ({
      ...prev,
      amount: amount > 0 ? amount.toString() : "",
    }));
  };

  const handleTaxTypeSelect = (taxTypeId) => {
    if (!taxTypeId) {
      setSelectedTaxType(null);
      setSelectedTaxRate(null);
      return;
    }
    
    const taxType = taxTypes.find(t => t.id === parseInt(taxTypeId));
    setSelectedTaxType(taxType);
    
    const rates = taxRates.filter(r => r.tax_type_id === parseInt(taxTypeId) && r.is_active);
    if (rates.length > 0) {
      setSelectedTaxRate(rates[0]);
    } else {
      setSelectedTaxRate(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedChurch) newErrors.church = "Please select a church";
    if (!selectedSubscription) newErrors.subscription = "Please select a subscription";
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.transaction_id) {
      newErrors.transaction_id = "Transaction ID is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSubscriptionAmount = () => {
    if (!selectedSubscription) return 0;
    const amount = parseFloat(formData.amount);
    if (amount > 0) return amount;
    return selectedSubscription.amount || 0;
  };

  const getTaxPercentage = () => {
    if (selectedTaxRate && selectedTaxRate.rate_percentage) {
      return selectedTaxRate.rate_percentage;
    }
    if (selectedTaxType) return 18;
    return 0;
  };

  const calculateTax = () => {
    const subtotal = getSubscriptionAmount();
    const taxPercentage = getTaxPercentage();
    const taxAmount = (subtotal * taxPercentage) / 100;
    return {
      taxAmount,
      totalPayable: subtotal + taxAmount,
      taxPercentage,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getBillingPeriodDisplay = () => {
    if (!selectedSubscription) return "Select a subscription to view billing period";
    
    const today = new Date();
    const endDate = new Date(today);
    const durationMonths = selectedSubscription.duration_months || 12;
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    return `${formatDate(today)} – ${formatDate(endDate)}`;
  };

  const getCalculationBreakdown = () => {
    if (!selectedSubscription) return null;
    
    const isYearly = selectedSubscription.billing_cycle === "YEARLY";
    
    // 🔥 FIX: Use the correct rate based on billing cycle
    const rate = isYearly 
      ? (selectedSubscription.rate_per_member_yearly || 0)
      : (selectedSubscription.rate_per_member_monthly || 0);
    
    const capacity = selectedSubscription.capacity || selectedSubscription.member_limit || 0;
    const subtotal = rate * capacity;
    const taxPercentage = getTaxPercentage();
    const taxAmount = (subtotal * taxPercentage) / 100;
    
    return {
      rate,
      capacity,
      subtotal,
      taxPercentage,
      taxAmount,
      total: subtotal + taxAmount,
      billingCycle: selectedSubscription.billing_cycle,
      cycleDisplay: isYearly ? 'Yearly' : 'Monthly',
      rateDisplay: isYearly ? 'Yearly Rate' : 'Monthly Rate',
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { taxAmount, totalPayable, taxPercentage } = calculateTax();
      
      const data = {
        church_id: selectedChurch.id,
        subscription_id: selectedSubscription.id,
        amount: getSubscriptionAmount(),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        transaction_id: formData.transaction_id,
        note: formData.notes,
        tax_type_id: selectedTaxType?.id || null,
        tax_rate_id: selectedTaxRate?.id || null,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: totalPayable,
        bill_type: "NEW",
        billing_cycle: selectedSubscription?.billing_cycle || "YEARLY",
        duration_months: selectedSubscription?.duration_months || 12,
      };

      await adminApi.createBill(data);

      toaster.create({
        title: "Success",
        description: "Payment recorded successfully.",
        type: "success",
        duration: 3000,
      });

      navigate("/admin/payments");
    } catch (error) {
      console.error("Error creating payment:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to record payment.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { taxAmount, totalPayable, taxPercentage } = calculateTax();
  const subscriptionAmount = getSubscriptionAmount();
  const breakdown = getCalculationBreakdown();

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
          Payments / Add Payment
        </Text>

        <VStack align="start" spacing={1} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Payment Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Record Payment
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Record a manual payment against an existing church subscription.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuBox} boxSize={5} />
            </Circle>
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              Payment Information
            </Heading>
          </HStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              {/* Row 1: Church and Subscription */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <ChurchDropdown
                    options={churches}
                    value={selectedChurch?.id || null}
                    onChange={handleChurchSelect}
                    placeholder="Select a church..."
                    isInvalid={!!errors.church}
                    error={errors.church}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Select the church making the payment
                  </Text>
                </GridItem>
                <GridItem>
                  <SubscriptionDropdown
                    options={filteredSubscriptions}
                    value={selectedSubscription?.id || null}
                    onChange={handleSubscriptionSelect}
                    placeholder={filteredSubscriptions.length === 0 ? "No active subscriptions" : "Select subscription..."}
                    isInvalid={!!errors.subscription}
                    error={errors.subscription}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Subscription will auto-select if only one exists
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 2: Billing Period and Payment Method */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Billing Period
                  </Text>
                  <Box
                    bg="gray.50"
                    px={3}
                    py={2.5}
                    borderRadius="md"
                    border="1.5px solid"
                    borderColor="gray.200"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    height="48px"
                  >
                    <Icon as={LuCalendar} color="gray.400" boxSize={4} />
                    <Text fontSize="sm" fontWeight="500" color="#333">
                      {getBillingPeriodDisplay()}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Today to end of subscription duration ({selectedSubscription?.duration_months || 12} months)
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Payment Method *
                  </Text>
                  <Box
                    as="select"
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background: "white",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Box>
                </GridItem>
              </Grid>

              {/* Row 3: Tax Type and Payment Status */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Type
                  </Text>
                  <Box
                    as="select"
                    value={selectedTaxType?.id || ""}
                    onChange={(e) => handleTaxTypeSelect(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background: "white",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  >
                    <option value="">Select Tax Type</option>
                    {taxTypes.map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.tax_type_name} {tax.country_name ? `(${tax.country_name})` : ''}
                      </option>
                    ))}
                  </Box>
                  {selectedTaxType && selectedTaxRate && (
                    <Flex align="center" gap={2} mt={1}>
                      <Icon as={LuTag} color={primaryMaroon} boxSize={3} />
                      <Text fontSize="xs" color="gray.600">
                        {selectedTaxType.tax_type_code} • {selectedTaxRate.rate_percentage}% ({selectedTaxRate.tax_rate_code})
                      </Text>
                    </Flex>
                  )}
                  {selectedTaxType && !selectedTaxRate && (
                    <Flex align="center" gap={2} mt={1}>
                      <Icon as={LuInfo} color="orange.500" boxSize={3} />
                      <Text fontSize="xs" color="orange.500">
                        No active tax rate found for this type
                      </Text>
                    </Flex>
                  )}
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Payment Status
                  </Text>
                  <Box
                    as="select"
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background: "white",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Box>
                </GridItem>
              </Grid>

              {/* Row 4: Transaction ID and Amount */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Transaction / Reference Number *
                  </Text>
                  <Input
                    name="transaction_id"
                    value={formData.transaction_id}
                    onChange={handleChange}
                    placeholder="TXN-YYYYMMDD-XXXX"
                    height="48px"
                    fontSize="13px"
                    borderColor={errors.transaction_id ? "red.500" : "gray.200"}
                    _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                  />
                  {errors.transaction_id && (
                    <Text fontSize="xs" color="red.500" mt={1}>{errors.transaction_id}</Text>
                  )}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Auto-generated. You can edit it if needed.
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Amount Paid *
                  </Text>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Auto-calculated from rate × capacity"
                    height="48px"
                    fontSize="13px"
                    borderColor={errors.amount ? "red.500" : "gray.200"}
                    _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                  />
                  {errors.amount && (
                    <Text fontSize="xs" color="red.500" mt={1}>{errors.amount}</Text>
                  )}
                  {breakdown && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {breakdown.cycleDisplay}: {formatCurrency(breakdown.rate)} × {breakdown.capacity} members = {formatCurrency(breakdown.subtotal)}
                    </Text>
                  )}
                </GridItem>
              </Grid>

              {/* Row 5: Notes */}
              <Grid templateColumns="1fr" gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Notes
                  </Text>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any additional notes about this payment..."
                    rows={2}
                    fontSize="13px"
                    borderColor="gray.200"
                    _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                    resize="vertical"
                  />
                </GridItem>
              </Grid>

              {/* Package & Subscription Summary */}
              {(selectedChurch || selectedSubscription) && breakdown && (
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
                      Package & Subscription Details
                    </Text>
                    <Badge
                      bg={breakdown.billingCycle === "YEARLY" ? "purple.50" : "blue.50"}
                      color={breakdown.billingCycle === "YEARLY" ? "purple.600" : "blue.600"}
                      fontSize="11px"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {breakdown.cycleDisplay}
                    </Badge>
                  </HStack>

                  <Grid templateColumns={{ base: "1fr 1fr", md: "1fr 1fr 1fr 1fr 1fr 1fr" }} gap={3}>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Package</Text>
                      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                        {selectedSubscription?.package_name || "—"}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {selectedSubscription?.package_code || ""}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Billing Cycle</Text>
                      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                        {breakdown.cycleDisplay}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {selectedSubscription?.duration_months || 12} months
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Member Capacity</Text>
                      <Text fontSize="sm" fontWeight="700" color={primaryMaroon}>
                        {breakdown.capacity.toLocaleString()}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {selectedSubscription?.custom_capacity ? 'Custom capacity' : 'Package limit'}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>{breakdown.rateDisplay}</Text>
                      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                        {formatCurrency(breakdown.rate)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Per {breakdown.billingCycle === "YEARLY" ? "year" : "month"}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Subtotal</Text>
                      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                        {formatCurrency(breakdown.subtotal)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {formatCurrency(breakdown.rate)} × {breakdown.capacity}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Tax Rate</Text>
                      <Text fontSize="sm" fontWeight="600" color="#1a1a2e">
                        {breakdown.taxPercentage}%
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        GST
                      </Text>
                    </GridItem>
                  </Grid>
                </Box>
              )}

              {/* Tax & Payment Summary */}
              {(selectedSubscription || subscriptionAmount > 0) && breakdown && (
                <Box
                  bg="rgba(174,32,80,0.06)"
                  border="1px solid"
                  borderColor="rgba(174,32,80,0.15)"
                  borderRadius="lg"
                  p={4}
                >
                  <HStack spacing={3} mb={4}>
                    <Circle size="36px" bg="rgba(174,32,80,0.1)" color={primaryMaroon}>
                      <Icon as={LuCalculator} boxSize={4} />
                    </Circle>
                    <Text fontWeight="700" color="#1a1a2e">
                      Tax & Payment Summary
                    </Text>
                    <Badge
                      bg={breakdown.billingCycle === "YEARLY" ? "purple.50" : "blue.50"}
                      color={breakdown.billingCycle === "YEARLY" ? "purple.600" : "blue.600"}
                      fontSize="11px"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {breakdown.cycleDisplay} Billing
                    </Badge>
                  </HStack>

                  <Grid templateColumns={{ base: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }} gap={4}>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Subtotal</Text>
                      <Text fontSize="lg" fontWeight="700" color="#333">
                        {formatCurrency(breakdown.subtotal)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {formatCurrency(breakdown.rate)} × {breakdown.capacity} members ({breakdown.cycleDisplay})
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Tax Type</Text>
                      <Text fontSize="sm" fontWeight="600" color="#333">
                        {selectedTaxType?.tax_type_name || "GST"}
                      </Text>
                      {selectedTaxType && (
                        <Text fontSize="xs" color="gray.400">
                          {selectedTaxType.tax_type_code}
                        </Text>
                      )}
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Tax Rate</Text>
                      <Text fontSize="sm" fontWeight="600" color="#333">
                        {breakdown.taxPercentage}%
                      </Text>
                      {selectedTaxRate && (
                        <Text fontSize="xs" color="gray.400">
                          {selectedTaxRate.tax_rate_code}
                        </Text>
                      )}
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Tax Amount</Text>
                      <Text fontSize="sm" fontWeight="600" color="#333">
                        {formatCurrency(breakdown.taxAmount)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {breakdown.taxPercentage}% of {formatCurrency(breakdown.subtotal)}
                      </Text>
                    </GridItem>
                  </Grid>

                  <Box
                    borderTop="1px solid"
                    borderColor="rgba(174,32,80,0.15)"
                    my={4}
                  />

                  <Grid templateColumns={{ base: "1fr 1fr", md: "1fr 1fr 1fr 1fr 1fr" }} gap={4}>
                    <GridItem colSpan={2}>
                      <Text fontSize="xs" color="gray.500" mb={1}>Total Payable</Text>
                      <Text fontSize="2xl" fontWeight="800" color={primaryMaroon}>
                        {formatCurrency(breakdown.total)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {formatCurrency(breakdown.subtotal)} + {formatCurrency(breakdown.taxAmount)} tax
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Payment Status</Text>
                      <Badge
                        bg={formData.payment_status === "PAID" ? "green.50" : 
                            formData.payment_status === "UNPAID" ? "red.50" :
                            formData.payment_status === "PENDING" ? "orange.50" :
                            formData.payment_status === "FAILED" ? "red.50" : "gray.50"}
                        color={formData.payment_status === "PAID" ? "green.600" : 
                            formData.payment_status === "UNPAID" ? "red.600" :
                            formData.payment_status === "PENDING" ? "orange.600" :
                            formData.payment_status === "FAILED" ? "red.600" : "gray.600"}
                        fontSize="12px"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {formData.payment_status || "N/A"}
                      </Badge>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Transaction ID</Text>
                      <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
                        {formData.transaction_id || "N/A"}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="xs" color="gray.500" mb={1}>Currency</Text>
                      <Text fontSize="sm" fontWeight="600" color="#333">INR (₹)</Text>
                    </GridItem>
                  </Grid>

                  <Text fontSize="xs" color="gray.400" mt={3}>
                    {breakdown.cycleDisplay} billing: {formatCurrency(breakdown.rate)} × {breakdown.capacity} members = {formatCurrency(breakdown.subtotal)} + {breakdown.taxPercentage}% GST = {formatCurrency(breakdown.total)}
                  </Text>
                </Box>
              )}

              {/* Receipt Information */}
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
              >
                <Flex align="center" gap={2}>
                  <Icon as={LuReceipt} boxSize={4} color={primaryMaroon} />
                  <Text fontSize="sm" fontWeight="600" color="gray.700">
                    Receipt Information
                  </Text>
                </Flex>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Receipt number and tax details will be generated after the payment is recorded.
                </Text>
                {selectedSubscription && breakdown && (
                  <Flex gap={4} mt={2} fontSize="xs" color="gray.500" flexWrap="wrap">
                    <Flex align="center" gap={1}>
                      <Icon as={LuClock} boxSize={3} />
                      <Text>Payment Date: {new Date().toLocaleDateString()}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Icon as={LuUser} boxSize={3} />
                      <Text>Receipt will be sent to: {selectedChurch?.email || "N/A"}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Icon as={LuDollarSign} boxSize={3} />
                      <Text>Total: {formatCurrency(breakdown.total)}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Icon as={LuTrendingUp} boxSize={3} />
                      <Text>{breakdown.capacity} members × {formatCurrency(breakdown.rate)}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Icon as={LuWallet} boxSize={3} />
                      <Text>Tax: {breakdown.taxPercentage}%</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Icon as={LuCreditCard} boxSize={3} />
                      <Text>{formData.payment_method}</Text>
                    </Flex>
                  </Flex>
                )}
              </Box>

              {/* Submit Button */}
              <Flex justify="flex-end" pt={2}>
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#8a1a3e" }}
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Recording..."
                  size="lg"
                  px={8}
                >
                  <Icon as={LuSave} boxSize={4} /> Record Payment
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default PaymentAddPage;