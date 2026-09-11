// src/admin/pages/PaymentAddPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

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
  Image,
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
  LuLock,
  LuUsers,
  LuImage,
  LuUpload,
  LuTrash2,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";
const deepMaroon = "#7d1538";

/* =========================================================
   SHARED FIELD LABEL
========================================================= */

const FieldLabel = ({ children, required }) => (
  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
    {children} {required && <Text as="span" color="red.500">*</Text>}
  </Text>
);

/* =========================================================
   NATIVE SELECT (styled to match design)
========================================================= */

const NativeSelect = ({ children, leftDot, ...props }) => (
  <Box position="relative">
    {leftDot && (
      <Box
        position="absolute"
        left="12px"
        top="50%"
        transform="translateY(-50%)"
        width="8px"
        height="8px"
        borderRadius="full"
        bg={leftDot}
        zIndex={1}
        pointerEvents="none"
      />
    )}
    <Box
      as="select"
      style={{
        width: "100%",
        padding: leftDot ? "12px 12px 12px 28px" : "12px",
        borderRadius: "6px",
        border: "1.5px solid #e2e8f0",
        fontSize: "13px",
        height: "48px",
        background: "white",
        outline: "none",
      }}
      {...props}
    >
      {children}
    </Box>
  </Box>
);

/* =========================================================
   CHURCH DROPDOWN
========================================================= */

const ChurchDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selectedOption = options.find(
    (opt) => Number(opt.id) === Number(value)
  );

  const filteredOptions = searchTerm
    ? options.filter(
        (opt) =>
          opt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
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
          <Icon as={LuSearch} color="gray.400" boxSize={4} flexShrink={0} />
          <Box flex="1">
            <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
              {selectedOption.name}
            </Text>
          </Box>
          <Text fontSize="xs" color="gray.500" flexShrink={0}>
            {selectedOption.code}
          </Text>
        </Flex>
      );
    }
    return (
      <Flex align="center" gap={2}>
        <Icon as={LuSearch} color="gray.400" boxSize={4} />
        <Text color="gray.400" fontSize="sm">
          {placeholder}
        </Text>
      </Flex>
    );
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <FieldLabel required>Church</FieldLabel>

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
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            color: isOpen ? primaryMaroon : "#718096",
            flexShrink: 0,
            marginLeft: "6px",
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
                onClick={(e) => e.stopPropagation()}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
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
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": { background: "#f7fafc" },
              "&::-webkit-scrollbar-thumb": { background: "#cbd5e0", borderRadius: "24px" },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box px={4} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400">
                  No churches found
                </Text>
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
                  bg={Number(option.id) === Number(value) ? "purple.50" : "transparent"}
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
                      color={Number(option.id) === Number(value) ? primaryMaroon : "gray.700"}
                      fontWeight={Number(option.id) === Number(value) ? "600" : "500"}
                    >
                      {option.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {option.code} • {option.city || "No city"}
                    </Text>
                  </Flex>
                  {Number(option.id) === Number(value) && (
                    <LuCheck size={16} color={primaryMaroon} />
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

/* =========================================================
   SUBSCRIPTION DROPDOWN
========================================================= */

const SubscriptionDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => Number(opt.id) === Number(value));

  useEffect(() => {
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
          <Icon as={LuSearch} color="gray.400" boxSize={4} flexShrink={0} />
          <Text fontSize="sm" fontWeight="600" color="#333" noOfLines={1}>
            {selectedOption.subscription_code || `SUB-${selectedOption.id}`} ·{" "}
            {selectedOption.package_name} · {cycleLabel}
          </Text>
        </Flex>
      );
    }
    return (
      <Flex align="center" gap={2}>
        <Icon as={LuSearch} color="gray.400" boxSize={4} />
        <Text color="gray.400" fontSize="sm">
          {placeholder}
        </Text>
      </Flex>
    );
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <FieldLabel required>Subscription</FieldLabel>

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
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
              color: isOpen ? primaryMaroon : "#718096",
              flexShrink: 0,
              marginLeft: "6px",
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
                bg={Number(option.id) === Number(value) ? "purple.50" : "transparent"}
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
                    color={Number(option.id) === Number(value) ? primaryMaroon : "gray.700"}
                    fontWeight={Number(option.id) === Number(value) ? "600" : "500"}
                  >
                    {option.subscription_code || `SUB-${option.id}`} · {option.package_name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {cycleLabel} • {option.capacity || option.member_limit || 0} members
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
                  {Number(option.id) === Number(value) && (
                    <LuCheck size={16} color={primaryMaroon} />
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

/* =========================================================
   CURRENCY
========================================================= */

const formatCurrencyStatic = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

/* =========================================================
   SUMMARY ROW (used in the sidebar cards)
========================================================= */

const SummaryRow = ({ label, value, valueColor = "#1a1a2e", bold }) => (
  <Flex justify="space-between" align="center" py={1.5}>
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight={bold ? "700" : "600"} color={valueColor}>
      {value}
    </Text>
  </Flex>
);

/* =========================================================
   MAIN PAGE
========================================================= */

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

  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState("");
  const paymentReceiptInputRef = useRef(null);

  const todayISO = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    amount: "",
    previously_paid: "0",
    payment_method: "BANK_TRANSFER",
    payment_date: todayISO(),
    status: "PAID",
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
    { value: "PAID", label: "Paid", color: "#38a169" },
    { value: "UNPAID", label: "Unpaid", color: "#e53e3e" },
    { value: "CANCELLED", label: "Cancelled", color: "#a0aec0" },
  ];

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {
    fetchData();
  }, []);

  const generateTransactionId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `TXN-${year}-${month}${random}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [churchesRes, subscriptionsRes, taxTypesRes, taxRatesRes] =
        await Promise.all([
          adminApi.getChurches(),
          adminApi.getSubscriptions(),
          adminApi.getTaxTypes(),
          adminApi.getTaxRates(),
        ]);

      const allChurchesData = churchesRes.data || [];
      const subscriptionsData = subscriptionsRes.data || [];
      const taxTypesData = taxTypesRes.data || [];
      const taxRatesData = taxRatesRes.data || [];

      const churchIdsWithUnpaidSubs = new Set(
        subscriptionsData
          .filter((s) => s.payment_status === "UNPAID")
          .map((s) => Number(s.church_id))
      );

      const churchesData = allChurchesData.filter((c) =>
        churchIdsWithUnpaidSubs.has(Number(c.id))
      );

      setChurches(churchesData);
      setAllSubscriptions(subscriptionsData);
      setTaxTypes(taxTypesData);
      setTaxRates(taxRatesData);

      setFormData((prev) => ({
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

  /* =========================================================
     CHURCH SELECT
  ========================================================= */

  const handleChurchSelect = (churchId) => {
    const church = churches.find((c) => Number(c.id) === Number(churchId));
    setSelectedChurch(church);
    setSelectedSubscription(null);

    const churchSubs = allSubscriptions.filter(
      (s) => Number(s.church_id) === Number(churchId) && s.payment_status === "UNPAID"
    );

    setFilteredSubscriptions(churchSubs);

    if (churchSubs.length > 0) {
      setSelectedSubscription(churchSubs[0]);
      updateFormFromSubscription(churchSubs[0]);
    } else {
      setSelectedSubscription(null);
      setFormData((prev) => ({ ...prev, amount: "" }));
    }

    if (errors.church) {
      setErrors((prev) => ({ ...prev, church: "" }));
    }
  };

  /* =========================================================
     SUBSCRIPTION SELECT
  ========================================================= */

  const handleSubscriptionSelect = (subscriptionId) => {
    const subscription = filteredSubscriptions.find(
      (s) => Number(s.id) === Number(subscriptionId)
    );

    if (subscription) {
      setSelectedSubscription(subscription);
      updateFormFromSubscription(subscription);

      if (errors.subscription) {
        setErrors((prev) => ({ ...prev, subscription: "" }));
      }
    }
  };

  const updateFormFromSubscription = (subscription) => {
    const amount = Number(subscription?.amount || 0);
    setFormData((prev) => ({
      ...prev,
      amount: amount > 0 ? amount.toString() : "",
    }));
  };

  /* =========================================================
     TAX TYPE / TAX RATE
  ========================================================= */

  const availableTaxRates = useMemo(() => {
    if (!selectedTaxType) return [];
    return taxRates.filter(
      (r) => Number(r.tax_type_id) === Number(selectedTaxType.id) && r.is_active
    );
  }, [selectedTaxType, taxRates]);

  const handleTaxTypeSelect = (taxTypeId) => {
    if (!taxTypeId) {
      setSelectedTaxType(null);
      setSelectedTaxRate(null);
      setErrors((prev) => ({ ...prev, tax: "" }));
      return;
    }

    const parsedTaxTypeId = parseInt(taxTypeId, 10);
    const taxType = taxTypes.find((t) => Number(t.id) === parsedTaxTypeId);
    setSelectedTaxType(taxType);

    const rates = taxRates.filter(
      (r) => Number(r.tax_type_id) === parsedTaxTypeId && r.is_active
    );

    if (rates.length > 0) {
      setSelectedTaxRate(rates[0]);
      setErrors((prev) => ({ ...prev, tax: "" }));
    } else {
      setSelectedTaxRate(null);
      setErrors((prev) => ({
        ...prev,
        tax: "No active tax rate found for this tax type",
      }));
    }
  };

  const handleTaxRateSelect = (taxRateId) => {
    const rate = availableTaxRates.find((r) => Number(r.id) === Number(taxRateId));
    setSelectedTaxRate(rate || null);
    if (errors.tax) {
      setErrors((prev) => ({ ...prev, tax: "" }));
    }
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* =========================================================
     PAYMENT RECEIPT IMAGE
  ========================================================= */

  const handlePaymentReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        payment_receipt: "Please upload a JPG, JPEG, PNG or WebP image.",
      }));
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        payment_receipt: "Image size must be less than 5 MB.",
      }));
      e.target.value = "";
      return;
    }

    setPaymentReceipt(file);
    setErrors((prev) => ({ ...prev, payment_receipt: "" }));
  };

  const handleReceiptDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handlePaymentReceiptChange({ target: { files: [file], value: "" } });
  };

  const removePaymentReceipt = () => {
    setPaymentReceipt(null);
    setPaymentReceiptPreview("");
    if (paymentReceiptInputRef.current) {
      paymentReceiptInputRef.current.value = "";
    }
    setErrors((prev) => ({ ...prev, payment_receipt: "" }));
  };

  useEffect(() => {
    if (!paymentReceipt) {
      setPaymentReceiptPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(paymentReceipt);
    setPaymentReceiptPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [paymentReceipt]);

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validate = () => {
    const newErrors = {};

    if (!selectedChurch) newErrors.church = "Please select a church";
    if (!selectedSubscription) newErrors.subscription = "Please select a subscription";

    const amountValue = Number(formData.amount || 0);
    if (amountValue <= 0) newErrors.amount = "Amount paid is invalid";

    if (!formData.transaction_id) {
      newErrors.transaction_id = "Transaction ID is required";
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    }

    if (selectedTaxType && !selectedTaxRate) {
      newErrors.tax = "No active tax rate found for this tax type";
    }

    if (!paymentReceipt) {
      newErrors.payment_receipt = "Payment screenshot is required for manual payment verification";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const getSubscriptionAmount = () => Number(selectedSubscription?.amount || 0);

  const getTaxPercentage = () => Number(selectedTaxRate?.rate_percentage || 0);

  const calculateTax = () => {
    const subtotal = getSubscriptionAmount();
    const taxPercentage = getTaxPercentage();
    const taxAmount = Math.round(((subtotal * taxPercentage) / 100 + Number.EPSILON) * 100) / 100;
    const totalPayable = Math.round((subtotal + taxAmount + Number.EPSILON) * 100) / 100;
    return { subtotal, taxPercentage, taxAmount, totalPayable };
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getBillingPeriodDisplay = () => {
    if (!selectedSubscription) return "Select a subscription to view billing period";

    const startDate = selectedSubscription.start_date
      ? new Date(selectedSubscription.start_date)
      : new Date();

    const endDate = selectedSubscription.end_date
      ? new Date(selectedSubscription.end_date)
      : null;

    if (endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`;

    return `${formatDate(startDate)} – ${selectedSubscription.duration_months || 12} months`;
  };

  const getCalculationBreakdown = () => {
    if (!selectedSubscription) return null;

    const isYearly = selectedSubscription.billing_cycle === "YEARLY";

    const rate = isYearly
      ? Number(selectedSubscription.rate_per_member_yearly || 0)
      : Number(selectedSubscription.rate_per_member_monthly || 0);

    const capacity = Number(
      selectedSubscription.capacity || selectedSubscription.member_limit || 0
    );

    const durationMonths = Number(
      selectedSubscription.duration_months || (isYearly ? 12 : 1)
    );

    const subtotal = getSubscriptionAmount();
    const taxPercentage = getTaxPercentage();
    const taxAmount = Math.round(((subtotal * taxPercentage) / 100 + Number.EPSILON) * 100) / 100;
    const total = Math.round((subtotal + taxAmount + Number.EPSILON) * 100) / 100;

    return {
      rate,
      capacity,
      durationMonths,
      subtotal,
      taxPercentage,
      taxAmount,
      total,
      billingCycle: selectedSubscription.billing_cycle,
      cycleDisplay: isYearly ? "Yearly" : "Monthly",
      rateDisplay: isYearly ? "Rate per Member (Yearly)" : "Rate per Member (Monthly)",
    };
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data = new FormData();

      data.append("church_id", String(selectedChurch.id));
      data.append("subscription_id", String(selectedSubscription.id));
      data.append("amount", String(formData.amount));
      data.append("payment_method", formData.payment_method);
      data.append("payment_date", formData.payment_date);
      data.append("status", formData.status);
      data.append("transaction_id", formData.transaction_id);
      data.append("note", formData.notes || "");

      if (selectedTaxType?.id) data.append("tax_type_id", String(selectedTaxType.id));
      if (selectedTaxRate?.id) data.append("tax_rate_id", String(selectedTaxRate.id));

      data.append("bill_type", "NEW");
      data.append("billing_cycle", selectedSubscription.billing_cycle || "");

      if (selectedSubscription.duration_months != null) {
        data.append("duration_months", String(selectedSubscription.duration_months));
      }

      if (paymentReceipt) {
        data.append("payment_receipt", paymentReceipt, paymentReceipt.name);
      }

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
        description:
          error.response?.data?.error ||
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to record payment.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const { taxAmount, totalPayable, taxPercentage } = calculateTax();
  const breakdown = getCalculationBreakdown();
  const previouslyPaid = Number(formData.previously_paid || 0);
  const amountDue = Math.max(
    Math.round((totalPayable - previouslyPaid + Number.EPSILON) * 100) / 100,
    0
  );
  const currentStatus = paymentStatuses.find((s) => s.value === formData.status);

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <Box
              width="40px"
              height="40px"
              border="4px solid"
              borderColor="gray.200"
              borderTopColor={primaryMaroon}
              borderRadius="50%"
              animation="spin 1s linear infinite"
            />
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        <Text fontSize="xs" color="gray.400" fontWeight="600" mb={2}>
          Payments / Add Payment
        </Text>

        <VStack align="start" spacing={1} mb={4}>
          <Text
            fontSize="xs"
            fontWeight="700"
            color={primaryMaroon}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Payment Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Record Payment
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Record a manual payment against an existing church subscription.
          </Text>
        </VStack>

        <form onSubmit={handleSubmit}>
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} alignItems="start">
            {/* =====================================================
                LEFT: PAYMENT INFORMATION FORM
            ===================================================== */}
            <GridItem>
              <Box
                bg="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                p={5}
                boxShadow="sm"
              >
                <HStack spacing={3} mb={5}>
                  <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuBox} boxSize={5} />
                  </Circle>
                  <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
                    Payment Information
                  </Heading>
                </HStack>

                <VStack spacing={4} align="stretch">
                  {/* CHURCH + SUBSCRIPTION */}
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
                    </GridItem>

                    <GridItem>
                      <SubscriptionDropdown
                        options={filteredSubscriptions}
                        value={selectedSubscription?.id || null}
                        onChange={handleSubscriptionSelect}
                        placeholder={
                          filteredSubscriptions.length === 0
                            ? "No active subscriptions"
                            : "Select subscription..."
                        }
                        isInvalid={!!errors.subscription}
                        error={errors.subscription}
                      />
                    </GridItem>
                  </Grid>

                  {/* BILLING PERIOD + PAYMENT DATE */}
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <GridItem>
                      <FieldLabel required>Billing Period</FieldLabel>
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
                        <Icon as={LuLock} color="gray.400" boxSize={4} />
                        <Text fontSize="sm" fontWeight="500" color="#333">
                          {getBillingPeriodDisplay()}
                        </Text>
                      </Box>
                    </GridItem>

                    <GridItem>
                      <FieldLabel required>Payment Date</FieldLabel>
                      <Box position="relative">
                        <Icon
                          as={LuCalendar}
                          color="gray.400"
                          boxSize={4}
                          position="absolute"
                          left="12px"
                          top="50%"
                          transform="translateY(-50%)"
                          zIndex={1}
                          pointerEvents="none"
                        />
                        <Input
                          type="date"
                          name="payment_date"
                          value={formData.payment_date}
                          onChange={handleChange}
                          pl="34px"
                          height="48px"
                          fontSize="13px"
                          borderColor={errors.payment_date ? "red.500" : "gray.200"}
                          _focus={{
                            borderColor: primaryMaroon,
                            boxShadow: `0 0 0 1px ${primaryMaroon}`,
                          }}
                        />
                      </Box>
                      {errors.payment_date && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {errors.payment_date}
                        </Text>
                      )}
                    </GridItem>
                  </Grid>

                  {/* PAYMENT METHOD + TRANSACTION */}
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <GridItem>
                      <FieldLabel required>Payment Method</FieldLabel>
                      <NativeSelect
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </GridItem>

                    <GridItem>
                      <FieldLabel required>Transaction / Reference Number</FieldLabel>
                      <Input
                        name="transaction_id"
                        value={formData.transaction_id}
                        onChange={handleChange}
                        placeholder="TXN-YYYY-XXXX"
                        height="48px"
                        fontSize="13px"
                        borderColor={errors.transaction_id ? "red.500" : "gray.200"}
                        _focus={{
                          borderColor: primaryMaroon,
                          boxShadow: `0 0 0 1px ${primaryMaroon}`,
                        }}
                      />
                      {errors.transaction_id && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {errors.transaction_id}
                        </Text>
                      )}
                    </GridItem>
                  </Grid>

                  {/* TAX TYPE + TAX RATE */}
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <GridItem>
                      <FieldLabel required>Tax Type</FieldLabel>
                      <NativeSelect
                        value={selectedTaxType?.id || ""}
                        onChange={(e) => handleTaxTypeSelect(e.target.value)}
                      >
                        <option value="">No Tax</option>
                        {taxTypes.map((tax) => (
                          <option key={tax.id} value={tax.id}>
                            {tax.tax_type_name} {tax.country_name ? `(${tax.country_name})` : ""}
                          </option>
                        ))}
                      </NativeSelect>
                    </GridItem>

                    <GridItem>
                      <FieldLabel required>Tax Rate</FieldLabel>
                      <NativeSelect
                        value={selectedTaxRate?.id || ""}
                        onChange={(e) => handleTaxRateSelect(e.target.value)}
                        disabled={!selectedTaxType || availableTaxRates.length === 0}
                      >
                        {availableTaxRates.length === 0 ? (
                          <option value="">—</option>
                        ) : (
                          availableTaxRates.map((rate) => (
                            <option key={rate.id} value={rate.id}>
                              {rate.rate_percentage}%
                            </option>
                          ))
                        )}
                      </NativeSelect>
                      {errors.tax && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {errors.tax}
                        </Text>
                      )}
                    </GridItem>
                  </Grid>

                  {/* AMOUNT PAID + PAYMENT STATUS */}
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <GridItem>
                      <FieldLabel required>Amount Paid</FieldLabel>
                      <Box position="relative">
                        <Text
                          position="absolute"
                          left="12px"
                          top="50%"
                          transform="translateY(-50%)"
                          fontSize="sm"
                          color="gray.500"
                          zIndex={1}
                        >
                          ₹
                        </Text>
                        <Input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          pl="26px"
                          height="48px"
                          fontSize="13px"
                          borderColor={errors.amount ? "red.500" : "gray.200"}
                          _focus={{
                            borderColor: primaryMaroon,
                            boxShadow: `0 0 0 1px ${primaryMaroon}`,
                          }}
                        />
                      </Box>
                      {errors.amount && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {errors.amount}
                        </Text>
                      )}
                    </GridItem>

                    <GridItem>
                      <FieldLabel required>Payment Status</FieldLabel>
                      <NativeSelect
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        leftDot={currentStatus?.color}
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </GridItem>
                  </Grid>

                  {/* NOTES */}
                  <Box>
                    <FieldLabel>Notes</FieldLabel>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Add any additional notes about this payment..."
                      rows={2}
                      fontSize="13px"
                      borderColor="gray.200"
                      _focus={{
                        borderColor: primaryMaroon,
                        boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      }}
                    />
                  </Box>

                  {/* PAYMENT SCREENSHOT */}
                  <Box>
                    <FieldLabel required>Payment Screenshot</FieldLabel>

                    {!paymentReceiptPreview ? (
                      <Box
                        as="label"
                        display="block"
                        cursor="pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleReceiptDrop}
                      >
                        <Box
                          border="1.5px dashed"
                          borderColor={errors.payment_receipt ? "red.400" : "red.300"}
                          bg={errors.payment_receipt ? "red.50" : "rgba(229,62,62,0.02)"}
                          borderRadius="md"
                          minH="100px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          textAlign="center"
                          px={4}
                          py={5}
                          transition="all 0.2s"
                          _hover={{ borderColor: "red.400", bg: "red.50" }}
                        >
                          <VStack spacing={1}>
                            <Icon as={LuImage} boxSize={6} color="red.400" />
                            <Text fontSize="sm" color="gray.600">
                              Drag and drop, payment screenshot
                            </Text>
                            <Text fontSize="sm" fontWeight="600" color={primaryMaroon} textDecoration="underline">
                              Browse file
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              JPG or PNG, maximum 5 MB
                            </Text>
                          </VStack>

                          <Input
                            ref={paymentReceiptInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handlePaymentReceiptChange}
                            display="none"
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="gray.50">
                        <Box
                          position="relative"
                          width="100%"
                          maxH="260px"
                          overflow="hidden"
                          bg="gray.100"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Image
                            src={paymentReceiptPreview}
                            alt="Payment receipt preview"
                            maxH="260px"
                            maxW="100%"
                            objectFit="contain"
                          />
                          <Button
                            type="button"
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            minW="34px"
                            h="34px"
                            p={0}
                            borderRadius="full"
                            bg="white"
                            color="red.500"
                            boxShadow="md"
                            _hover={{ bg: "red.50" }}
                            onClick={removePaymentReceipt}
                          >
                            <Icon as={LuTrash2} boxSize={4} />
                          </Button>
                        </Box>

                        <Flex align="center" justify="space-between" px={3} py={2} bg="white" borderTop="1px solid" borderColor="gray.200">
                          <Flex align="center" gap={2} minW={0}>
                            <Icon as={LuImage} color={primaryMaroon} boxSize={4} />
                            <Text fontSize="xs" color="gray.600" noOfLines={1}>
                              {paymentReceipt?.name}
                            </Text>
                          </Flex>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            color={primaryMaroon}
                            onClick={() => paymentReceiptInputRef.current?.click()}
                          >
                            Change
                          </Button>
                        </Flex>
                      </Box>
                    )}

                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Required for manual payment verification.
                    </Text>

                    {errors.payment_receipt && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {errors.payment_receipt}
                      </Text>
                    )}
                  </Box>

                  {/* ACTIONS */}
                  <Flex justify="flex-end" pt={2}>
                    <Button
                      bg={primaryMaroon}
                      color="white"
                      _hover={{ bg: "#8a1a3e" }}
                      type="submit"
                      loading={isSubmitting}
                      loadingText="Recording..."
                      size="lg"
                      px={8}
                    >
                      <Icon as={LuSave} boxSize={4} mr={2} />
                      Record Payment
                    </Button>
                  </Flex>
                </VStack>
              </Box>
            </GridItem>

            {/* =====================================================
                RIGHT: SUMMARY SIDEBAR
            ===================================================== */}
            <GridItem>
              <VStack spacing={5} align="stretch">
                {/* SUBSCRIPTION SUMMARY */}
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                  <HStack spacing={3} mb={3}>
                    <Circle size="36px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                      <Icon as={LuUsers} boxSize={4} />
                    </Circle>
                    <Heading fontSize="md" fontWeight="700" color="#1a1a2e">
                      Subscription Summary
                    </Heading>
                  </HStack>

                  <VStack spacing={0} align="stretch" divider={<Box borderBottom="1px solid" borderColor="gray.100" />}>
                    <SummaryRow label="Church" value={selectedChurch?.name || "—"} />
                    <SummaryRow
                      label="Subscription ID"
                      value={
                        selectedSubscription
                          ? selectedSubscription.subscription_code || `SUB-${selectedSubscription.id}`
                          : "—"
                      }
                    />
                    <SummaryRow label="Package" value={selectedSubscription?.package_name || "—"} />
                    <SummaryRow label="Billing Cycle" value={breakdown?.cycleDisplay || "—"} />
                    <SummaryRow
                      label="Member Limit"
                      value={breakdown ? breakdown.capacity.toLocaleString("en-IN") : "—"}
                    />
                    <SummaryRow
                      label={breakdown?.rateDisplay || "Rate per Member"}
                      value={breakdown ? formatCurrencyStatic(breakdown.rate) : "—"}
                    />
                  </VStack>
                </Box>

                {/* TAX & PAYMENT SUMMARY */}
                <Box
                  bg="white"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  p={5}
                  boxShadow="sm"
                >
                  <HStack spacing={3} mb={3}>
                    <Circle size="36px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                      <Icon as={LuCalculator} boxSize={4} />
                    </Circle>
                    <Heading fontSize="md" fontWeight="700" color="#1a1a2e">
                      Tax &amp; Payment Summary
                    </Heading>
                  </HStack>

                  <VStack spacing={0} align="stretch" divider={<Box borderBottom="1px solid" borderColor="gray.100" />}>
                    <SummaryRow label="Subscription Amount" value={formatCurrencyStatic(getSubscriptionAmount())} />
                    <SummaryRow label="Tax Type" value={selectedTaxType?.tax_type_name || "No Tax"} />
                    <SummaryRow label="Tax Rate" value={`${taxPercentage}%`} />
                    <SummaryRow label="Tax Amount" value={formatCurrencyStatic(taxAmount)} />
                  </VStack>

                  <Box borderTop="1px solid" borderColor="gray.200" my={3} />

                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" color="gray.500">
                      Total Payable
                    </Text>
                    <Text fontSize="2xl" fontWeight="800" color={primaryMaroon}>
                      {formatCurrencyStatic(totalPayable)}
                    </Text>
                  </Flex>

                  <VStack spacing={0} align="stretch">
                    <SummaryRow label="Previously Paid" value={formatCurrencyStatic(previouslyPaid)} />
                    <SummaryRow label="Amount Due" value={formatCurrencyStatic(amountDue)} valueColor={deepMaroon} />
                    <SummaryRow label="Currency" value="INR (₹)" />
                  </VStack>

                  <Text fontSize="xs" color="gray.400" mt={2}>
                    Tax calculated on the subscription amount.
                  </Text>
                </Box>

                {/* RECEIPT INFORMATION */}
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
                  <HStack spacing={3} align="start">
                    <Circle size="36px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                      <Icon as={LuReceipt} boxSize={4} />
                    </Circle>
                    <Box>
                      <Text fontWeight="700" color="#1a1a2e" mb={1}>
                        Receipt Information
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Receipt number and tax details will be generated after the payment is recorded.
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </form>
      </Container>
    </AdminLayout>
  );
};

export default PaymentAddPage;