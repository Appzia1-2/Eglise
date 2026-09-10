// src/admin/pages/PaymentAddPage.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useLocation,
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
  LuClock,
  LuUser,
  LuPackage,
  LuDollarSign,
  LuWallet,
  LuCreditCard,
  LuImage,
  LuUpload,
  LuTrash2,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

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
          opt.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          opt.code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
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
        <Flex
          align="center"
          gap={2}
          flex="1"
          overflow="hidden"
        >
          <Box flex="1">
            <Text
              fontSize="sm"
              fontWeight="600"
              color="#333"
              noOfLines={1}
            >
              {selectedOption.name}
            </Text>

            <Text
              fontSize="xs"
              color="gray.500"
            >
              {selectedOption.code}
            </Text>
          </Box>
        </Flex>
      );
    }

    return (
      <Text
        color="gray.400"
        fontSize="sm"
      >
        {placeholder}
      </Text>
    );
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
    >
      <Text
        fontSize="xs"
        fontWeight="600"
        color="gray.700"
        mb={1}
      >
        Church *
      </Text>

      <Box
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        border="1.5px solid"
        borderColor={
          isInvalid
            ? "#e53e3e"
            : isOpen
            ? primaryMaroon
            : "#e2e8f0"
        }
        borderRadius="md"
        height="48px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _hover={{
          borderColor: isInvalid
            ? "#e53e3e"
            : "#cbd5e0",
        }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}

        <LuChevronDown
          size={16}
          style={{
            transform: isOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition:
              "transform 0.25s ease",
            color: isOpen
              ? primaryMaroon
              : "#718096",
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
          <Box
            p={2}
            borderBottom="1px solid"
            borderColor="gray.100"
            bg="gray.50"
          >
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
              <LuSearch
                size={14}
                color="#718096"
              />

              <Input
                ref={searchRef}
                placeholder="Search church by name or code..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                onClick={(e) =>
                  e.stopPropagation()
                }
                border="none"
                _focus={{
                  boxShadow: "none",
                }}
                bg="transparent"
                px={0}
                height="28px"
                fontSize="13px"
                _placeholder={{
                  color: "gray.400",
                }}
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
                  _hover={{
                    color: "gray.600",
                  }}
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
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f7fafc",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e0",
                borderRadius: "24px",
              },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box
                px={4}
                py={6}
                textAlign="center"
              >
                <Text
                  fontSize="sm"
                  color="gray.400"
                >
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
                  _hover={{
                    bg: "gray.50",
                  }}
                  onClick={() =>
                    handleSelect(option)
                  }
                  bg={
                    Number(option.id) ===
                    Number(value)
                      ? "purple.50"
                      : "transparent"
                  }
                  transition="all 0.15s"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                >
                  <Flex
                    direction="column"
                    flex="1"
                  >
                    <Text
                      fontSize="sm"
                      color={
                        Number(option.id) ===
                        Number(value)
                          ? primaryMaroon
                          : "gray.700"
                      }
                      fontWeight={
                        Number(option.id) ===
                        Number(value)
                          ? "600"
                          : "500"
                      }
                    >
                      {option.name}
                    </Text>

                    <Text
                      fontSize="xs"
                      color="gray.500"
                    >
                      {option.code} •{" "}
                      {option.city ||
                        "No city"}
                    </Text>
                  </Flex>

                  {Number(option.id) ===
                    Number(value) && (
                    <LuCheck
                      size={16}
                      color={primaryMaroon}
                    />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
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

  const selectedOption = options.find(
    (opt) => Number(opt.id) === Number(value)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (selectedOption) {
      const isYearly =
        selectedOption.billing_cycle ===
        "YEARLY";

      const cycleLabel = isYearly
        ? "Yearly"
        : "Monthly";

      return (
        <Flex
          align="center"
          gap={2}
          flex="1"
          overflow="hidden"
        >
          <Box flex="1">
            <Text
              fontSize="sm"
              fontWeight="600"
              color="#333"
              noOfLines={1}
            >
              {selectedOption.package_name}
            </Text>

            <Text
              fontSize="xs"
              color="gray.500"
            >
              {cycleLabel} •{" "}
              {selectedOption.capacity ||
                selectedOption.member_limit ||
                0}{" "}
              members •{" "}
              {formatCurrencyStatic(
                selectedOption.amount
              )}
            </Text>
          </Box>

          <Badge
            bg={
              isYearly
                ? "purple.50"
                : "blue.50"
            }
            color={
              isYearly
                ? "purple.600"
                : "blue.600"
            }
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

    return (
      <Text
        color="gray.400"
        fontSize="sm"
      >
        {placeholder}
      </Text>
    );
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
    >
      <Text
        fontSize="xs"
        fontWeight="600"
        color="gray.700"
        mb={1}
      >
        Subscription *
      </Text>

      <Box
        onClick={() =>
          options.length > 0 &&
          setIsOpen(!isOpen)
        }
        cursor={
          options.length > 0
            ? "pointer"
            : "default"
        }
        border="1.5px solid"
        borderColor={
          isInvalid
            ? "#e53e3e"
            : isOpen
            ? primaryMaroon
            : "#e2e8f0"
        }
        borderRadius="md"
        height="48px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={
          options.length === 0
            ? "gray.50"
            : "white"
        }
        _hover={{
          borderColor: isInvalid
            ? "#e53e3e"
            : options.length > 0
            ? "#cbd5e0"
            : "#e2e8f0",
        }}
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
              transform: isOpen
                ? "rotate(180deg)"
                : "rotate(0deg)",
              transition:
                "transform 0.25s ease",
              color: isOpen
                ? primaryMaroon
                : "#718096",
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
            const isYearly =
              option.billing_cycle ===
              "YEARLY";

            const cycleLabel = isYearly
              ? "Yearly"
              : "Monthly";

            return (
              <Box
                key={option.id}
                px={3}
                py={2.5}
                cursor="pointer"
                _hover={{
                  bg: "gray.50",
                }}
                onClick={() =>
                  handleSelect(option)
                }
                bg={
                  Number(option.id) ===
                  Number(value)
                    ? "purple.50"
                    : "transparent"
                }
                transition="all 0.15s"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                borderBottom="1px solid"
                borderColor="gray.50"
              >
                <Flex
                  direction="column"
                  flex="1"
                >
                  <Text
                    fontSize="sm"
                    color={
                      Number(option.id) ===
                      Number(value)
                        ? primaryMaroon
                        : "gray.700"
                    }
                    fontWeight={
                      Number(option.id) ===
                      Number(value)
                        ? "600"
                        : "500"
                    }
                  >
                    {option.package_name}
                  </Text>

                  <Text
                    fontSize="xs"
                    color="gray.500"
                  >
                    {cycleLabel} •{" "}
                    {option.capacity ||
                      option.member_limit ||
                      0}{" "}
                    members •{" "}
                    {formatCurrencyStatic(
                      option.amount
                    )}
                  </Text>
                </Flex>

                <HStack spacing={2}>
                  <Badge
                    bg={
                      isYearly
                        ? "purple.50"
                        : "blue.50"
                    }
                    color={
                      isYearly
                        ? "purple.600"
                        : "blue.600"
                    }
                    fontSize="10px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {cycleLabel}
                  </Badge>

                  {Number(option.id) ===
                    Number(value) && (
                    <LuCheck
                      size={16}
                      color={primaryMaroon}
                    />
                  )}
                </HStack>
              </Box>
            );
          })}
        </Box>
      )}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

/* =========================================================
   CURRENCY
========================================================= */

const formatCurrencyStatic = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

/* =========================================================
   MAIN PAGE
========================================================= */

const PaymentAddPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [churches, setChurches] =
    useState([]);

  const [allSubscriptions, setAllSubscriptions] =
    useState([]);

  const [filteredSubscriptions, setFilteredSubscriptions] =
    useState([]);

  const [taxTypes, setTaxTypes] =
    useState([]);

  const [taxRates, setTaxRates] =
    useState([]);

  const [selectedChurch, setSelectedChurch] =
    useState(null);

  const [selectedSubscription, setSelectedSubscription] =
    useState(null);

  const [selectedTaxType, setSelectedTaxType] =
    useState(null);

  const [selectedTaxRate, setSelectedTaxRate] =
    useState(null);

  /* =========================================================
     EXISTING BILL.payment_receipt FIELD

     NO NEW DATABASE FIELD
========================================================= */

  const [paymentReceipt, setPaymentReceipt] =
    useState(null);

  const [paymentReceiptPreview, setPaymentReceiptPreview] =
    useState("");

  const paymentReceiptInputRef =
    useRef(null);

  const [formData, setFormData] =
    useState({
      amount: "",
      payment_method: "CASH",
      status: "PAID",
      transaction_id: "",
      notes: "",
    });

  const [errors, setErrors] =
    useState({});

  /* =========================================================
     PAYMENT OPTIONS
========================================================= */

  const paymentMethods = [
    {
      value: "CASH",
      label: "Cash",
    },
    {
      value: "UPI",
      label: "UPI",
    },
    {
      value: "CARD",
      label: "Card",
    },
    {
      value: "CHEQUE",
      label: "Cheque",
    },
  ];

  const paymentStatuses = [
    {
      value: "PAID",
      label: "Paid",
    },
    {
      value: "UNPAID",
      label: "Unpaid",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
    },
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

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    const random = Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0");

    return `TXN-${year}${month}${day}-${random}`;
  };

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [
        churchesRes,
        subscriptionsRes,
        taxTypesRes,
        taxRatesRes,
      ] = await Promise.all([
        adminApi.getChurches(),
        adminApi.getSubscriptions(),
        adminApi.getTaxTypes(),
        adminApi.getTaxRates(),
      ]);

      const allChurchesData =
        churchesRes.data || [];

      const subscriptionsData =
        subscriptionsRes.data || [];

      const taxTypesData =
        taxTypesRes.data || [];

      const taxRatesData =
        taxRatesRes.data || [];

      const churchIdsWithUnpaidSubs =
        new Set(
          subscriptionsData
            .filter(
              (s) =>
                s.payment_status ===
                "UNPAID"
            )
            .map((s) =>
              Number(s.church_id)
            )
        );

      const churchesData =
        allChurchesData.filter((c) =>
          churchIdsWithUnpaidSubs.has(
            Number(c.id)
          )
        );

      setChurches(churchesData);
      setAllSubscriptions(
        subscriptionsData
      );
      setTaxTypes(taxTypesData);
      setTaxRates(taxRatesData);

      setFormData((prev) => ({
        ...prev,
        transaction_id:
          generateTransactionId(),
      }));
    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );

      toaster.create({
        title: "Error",
        description:
          "Failed to load data.",
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

  const handleChurchSelect = (
    churchId
  ) => {
    const church = churches.find(
      (c) =>
        Number(c.id) ===
        Number(churchId)
    );

    setSelectedChurch(church);

    setSelectedSubscription(null);

    const churchSubs =
      allSubscriptions.filter(
        (s) =>
          Number(s.church_id) ===
            Number(churchId) &&
          s.payment_status ===
            "UNPAID"
      );

    setFilteredSubscriptions(
      churchSubs
    );

    if (churchSubs.length > 0) {
      setSelectedSubscription(
        churchSubs[0]
      );

      updateFormFromSubscription(
        churchSubs[0]
      );
    } else {
      setSelectedSubscription(null);

      setFormData((prev) => ({
        ...prev,
        amount: "",
      }));
    }

    if (errors.church) {
      setErrors((prev) => ({
        ...prev,
        church: "",
      }));
    }
  };

  /* =========================================================
     SUBSCRIPTION SELECT
========================================================= */

  const handleSubscriptionSelect = (
    subscriptionId
  ) => {
    const subscription =
      filteredSubscriptions.find(
        (s) =>
          Number(s.id) ===
          Number(subscriptionId)
      );

    if (subscription) {
      setSelectedSubscription(
        subscription
      );

      updateFormFromSubscription(
        subscription
      );

      if (errors.subscription) {
        setErrors((prev) => ({
          ...prev,
          subscription: "",
        }));
      }
    }
  };

  /* =========================================================
     SUBSCRIPTION AMOUNT
========================================================= */

  const updateFormFromSubscription = (
    subscription
  ) => {
    const amount = Number(
      subscription?.amount || 0
    );

    setFormData((prev) => ({
      ...prev,
      amount:
        amount > 0
          ? amount.toString()
          : "",
    }));
  };

  /* =========================================================
     TAX TYPE
========================================================= */

  const handleTaxTypeSelect = (
    taxTypeId
  ) => {
    if (!taxTypeId) {
      setSelectedTaxType(null);
      setSelectedTaxRate(null);

      setErrors((prev) => ({
        ...prev,
        tax: "",
      }));

      return;
    }

    const parsedTaxTypeId =
      parseInt(taxTypeId, 10);

    const taxType = taxTypes.find(
      (t) =>
        Number(t.id) ===
        parsedTaxTypeId
    );

    setSelectedTaxType(taxType);

    const rates = taxRates.filter(
      (r) =>
        Number(r.tax_type_id) ===
          parsedTaxTypeId &&
        r.is_active
    );

    if (rates.length > 0) {
      setSelectedTaxRate(
        rates[0]
      );

      setErrors((prev) => ({
        ...prev,
        tax: "",
      }));
    } else {
      setSelectedTaxRate(null);

      setErrors((prev) => ({
        ...prev,
        tax: "No active tax rate found for this tax type",
      }));
    }
  };

  /* =========================================================
     FORM CHANGE
========================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* =========================================================
     PAYMENT RECEIPT IMAGE

     Uses existing Bill.payment_receipt
========================================================= */

  const handlePaymentReceiptChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setErrors((prev) => ({
        ...prev,
        payment_receipt:
          "Please upload a JPG, JPEG, PNG or WebP image.",
      }));

      e.target.value = "";
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        payment_receipt:
          "Image size must be less than 5 MB.",
      }));

      e.target.value = "";
      return;
    }

    setPaymentReceipt(file);

    setErrors((prev) => ({
      ...prev,
      payment_receipt: "",
    }));
  };

  const removePaymentReceipt = () => {
    setPaymentReceipt(null);
    setPaymentReceiptPreview("");

    if (
      paymentReceiptInputRef.current
    ) {
      paymentReceiptInputRef.current.value =
        "";
    }

    setErrors((prev) => ({
      ...prev,
      payment_receipt: "",
    }));
  };

  /* =========================================================
     CREATE / UPDATE PREVIEW URL
========================================================= */

  useEffect(() => {
    if (!paymentReceipt) {
      setPaymentReceiptPreview("");
      return;
    }

    const previewUrl =
      URL.createObjectURL(
        paymentReceipt
      );

    setPaymentReceiptPreview(
      previewUrl
    );

    return () => {
      URL.revokeObjectURL(
        previewUrl
      );
    };
  }, [paymentReceipt]);

  /* =========================================================
     VALIDATION
========================================================= */

  const validate = () => {
    const newErrors = {};

    if (!selectedChurch) {
      newErrors.church =
        "Please select a church";
    }

    if (!selectedSubscription) {
      newErrors.subscription =
        "Please select a subscription";
    }

    const subscriptionAmount =
      Number(
        selectedSubscription?.amount ||
          0
      );

    if (subscriptionAmount <= 0) {
      newErrors.amount =
        "Subscription amount is invalid";
    }

    if (!formData.transaction_id) {
      newErrors.transaction_id =
        "Transaction ID is required";
    }

    if (
      selectedTaxType &&
      !selectedTaxRate
    ) {
      newErrors.tax =
        "No active tax rate found for this tax type";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length ===
      0
    );
  };

  /* =========================================================
     SUBSCRIPTION AMOUNT
========================================================= */

  const getSubscriptionAmount = () => {
    if (!selectedSubscription) {
      return 0;
    }

    return Number(
      selectedSubscription.amount || 0
    );
  };

  /* =========================================================
     TAX PERCENTAGE
========================================================= */

  const getTaxPercentage = () => {
    if (!selectedTaxRate) {
      return 0;
    }

    return Number(
      selectedTaxRate.rate_percentage ||
        0
    );
  };

  /* =========================================================
     TAX CALCULATION
========================================================= */

  const calculateTax = () => {
    const subtotal =
      getSubscriptionAmount();

    const taxPercentage =
      getTaxPercentage();

    const taxAmount =
      Math.round(
        ((subtotal *
          taxPercentage) /
          100 +
          Number.EPSILON) *
          100
      ) / 100;

    const totalPayable =
      Math.round(
        (subtotal +
          taxAmount +
          Number.EPSILON) *
          100
      ) / 100;

    return {
      subtotal,
      taxPercentage,
      taxAmount,
      totalPayable,
    };
  };

  /* =========================================================
     CURRENCY
========================================================= */

  const formatCurrency = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(
      Number(amount) || 0
    );
  };

  /* =========================================================
     DATE
========================================================= */

  const formatDate = (
    dateString
  ) => {
    if (!dateString) {
      return "—";
    }

    const date =
      new Date(dateString);

    return date.toLocaleDateString(
      "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     BILLING PERIOD
========================================================= */

  const getBillingPeriodDisplay =
    () => {
      if (!selectedSubscription) {
        return "Select a subscription to view billing period";
      }

      const startDate =
        selectedSubscription.start_date
          ? new Date(
              selectedSubscription.start_date
            )
          : new Date();

      const endDate =
        selectedSubscription.end_date
          ? new Date(
              selectedSubscription.end_date
            )
          : null;

      if (endDate) {
        return `${formatDate(
          startDate
        )} – ${formatDate(endDate)}`;
      }

      return `${formatDate(
        startDate
      )} – ${
        selectedSubscription.duration_months ||
        12
      } months`;
    };

  /* =========================================================
     CALCULATION BREAKDOWN
========================================================= */

  const getCalculationBreakdown =
    () => {
      if (!selectedSubscription) {
        return null;
      }

      const isYearly =
        selectedSubscription.billing_cycle ===
        "YEARLY";

      const rate = isYearly
        ? Number(
            selectedSubscription.rate_per_member_yearly ||
              0
          )
        : Number(
            selectedSubscription.rate_per_member_monthly ||
              0
          );

      const capacity = Number(
        selectedSubscription.capacity ||
          selectedSubscription.member_limit ||
          0
      );

      const durationMonths = Number(
        selectedSubscription.duration_months ||
          (isYearly ? 12 : 1)
      );

      const subtotal =
        getSubscriptionAmount();

      const taxPercentage =
        getTaxPercentage();

      const taxAmount =
        Math.round(
          ((subtotal *
            taxPercentage) /
            100 +
            Number.EPSILON) *
            100
        ) / 100;

      const total =
        Math.round(
          (subtotal +
            taxAmount +
            Number.EPSILON) *
            100
        ) / 100;

      return {
        rate,
        capacity,
        durationMonths,
        subtotal,
        taxPercentage,
        taxAmount,
        total,
        billingCycle:
          selectedSubscription.billing_cycle,
        cycleDisplay:
          isYearly
            ? "Yearly"
            : "Monthly",
        rateDisplay:
          isYearly
            ? "Yearly Rate"
            : "Monthly Rate",
      };
    };

  /* =========================================================
     SUBMIT

     IMPORTANT:
     Uses FormData because payment_receipt
     is an ImageField.

     Existing backend field:
         payment_receipt
========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const subscriptionAmount =
        getSubscriptionAmount();

      const data = new FormData();

      data.append(
        "church_id",
        String(selectedChurch.id)
      );

      data.append(
        "subscription_id",
        String(selectedSubscription.id)
      );

      data.append(
        "amount",
        String(subscriptionAmount)
      );

      data.append(
        "payment_method",
        formData.payment_method
      );

      data.append(
        "status",
        formData.status
      );

      data.append(
        "transaction_id",
        formData.transaction_id
      );

      data.append(
        "note",
        formData.notes || ""
      );

      if (selectedTaxType?.id) {
        data.append(
          "tax_type_id",
          String(selectedTaxType.id)
        );
      }

      if (selectedTaxRate?.id) {
        data.append(
          "tax_rate_id",
          String(selectedTaxRate.id)
        );
      }

      data.append(
        "bill_type",
        "NEW"
      );

      data.append(
        "billing_cycle",
        selectedSubscription.billing_cycle ||
          ""
      );

      if (
        selectedSubscription.duration_months !=
        null
      ) {
        data.append(
          "duration_months",
          String(
            selectedSubscription.duration_months
          )
        );
      }

      /* ================================================
         EXISTING IMAGE FIELD
         
         Bill.payment_receipt
      ================================================= */

      if (paymentReceipt) {
        data.append(
          "payment_receipt",
          paymentReceipt,
          paymentReceipt.name
        );
      }

      console.log(
        "Creating payment with receipt:",
        paymentReceipt
      );

      await adminApi.createBill(data);

      toaster.create({
        title: "Success",
        description:
          "Payment recorded successfully.",
        type: "success",
        duration: 3000,
      });

      navigate(
        "/admin/payments"
      );
    } catch (error) {
      console.error(
        "Error creating payment:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      toaster.create({
        title: "Error",
        description:
          error.response?.data
            ?.error ||
          error.response?.data
            ?.detail ||
          error.response?.data
            ?.message ||
          "Failed to record payment.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     CALCULATION VALUES
========================================================= */

  const {
    taxAmount,
    totalPayable,
    taxPercentage,
  } = calculateTax();

  const subscriptionAmount =
    getSubscriptionAmount();

  const breakdown =
    getCalculationBreakdown();

  /* =========================================================
     LOADING
========================================================= */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container
          maxW="container.xl"
          py={6}
        >
          <Flex
            justify="center"
            align="center"
            minH="400px"
          >
            <Box
              width="40px"
              height="40px"
              border="4px solid"
              borderColor="gray.200"
              borderTopColor={
                primaryMaroon
              }
              borderRadius="50%"
              animation="spin 1s linear infinite"
            />
          </Flex>

          <style>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
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
      <Container
        maxW="container.xl"
        py={4}
      >
        <Text
          fontSize="xs"
          color="gray.400"
          fontWeight="600"
          mb={2}
        >
          Payments / Add Payment
        </Text>

        <VStack
          align="start"
          spacing={1}
          mb={4}
        >
          <Text
            fontSize="xs"
            fontWeight="700"
            color={primaryMaroon}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Payment Management
          </Text>

          <Heading
            fontSize="2xl"
            fontWeight="800"
            color="#1a1a2e"
          >
            Record Payment
          </Heading>

          <Text
            color="gray.500"
            fontSize="sm"
          >
            Record a manual payment against
            an existing church subscription.
          </Text>
        </VStack>

        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          p={5}
          boxShadow="sm"
        >
          <HStack
            spacing={3}
            mb={5}
          >
            <Circle
              size="40px"
              bg="rgba(174,32,80,0.08)"
              color={primaryMaroon}
            >
              <Icon
                as={LuBox}
                boxSize={5}
              />
            </Circle>

            <Heading
              fontSize="lg"
              fontWeight="700"
              color="#1a1a2e"
            >
              Payment Information
            </Heading>
          </HStack>

          <form
            onSubmit={handleSubmit}
          >
            <VStack
              spacing={4}
              align="stretch"
            >
              {/* =================================================
                  CHURCH + SUBSCRIPTION
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={4}
              >
                <GridItem>
                  <ChurchDropdown
                    options={churches}
                    value={
                      selectedChurch?.id ||
                      null
                    }
                    onChange={
                      handleChurchSelect
                    }
                    placeholder="Select a church..."
                    isInvalid={
                      !!errors.church
                    }
                    error={
                      errors.church
                    }
                  />

                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={1}
                  >
                    Select the church
                    making the payment
                  </Text>
                </GridItem>

                <GridItem>
                  <SubscriptionDropdown
                    options={
                      filteredSubscriptions
                    }
                    value={
                      selectedSubscription?.id ||
                      null
                    }
                    onChange={
                      handleSubscriptionSelect
                    }
                    placeholder={
                      filteredSubscriptions.length ===
                      0
                        ? "No active subscriptions"
                        : "Select subscription..."
                    }
                    isInvalid={
                      !!errors.subscription
                    }
                    error={
                      errors.subscription
                    }
                  />

                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={1}
                  >
                    Subscription will
                    auto-select if only
                    one exists
                  </Text>
                </GridItem>
              </Grid>

              {/* =================================================
                  BILLING + PAYMENT METHOD
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={4}
              >
                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
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
                    <Icon
                      as={LuCalendar}
                      color="gray.400"
                      boxSize={4}
                    />

                    <Text
                      fontSize="sm"
                      fontWeight="500"
                      color="#333"
                    >
                      {getBillingPeriodDisplay()}
                    </Text>
                  </Box>
                </GridItem>

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Payment Method *
                  </Text>

                  <Box
                    as="select"
                    name="payment_method"
                    value={
                      formData.payment_method
                    }
                    onChange={
                      handleChange
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border:
                        "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background:
                        "white",
                      outline: "none",
                    }}
                  >
                    {paymentMethods.map(
                      (method) => (
                        <option
                          key={
                            method.value
                          }
                          value={
                            method.value
                          }
                        >
                          {method.label}
                        </option>
                      )
                    )}
                  </Box>
                </GridItem>
              </Grid>

              {/* =================================================
                  TAX + STATUS
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={4}
              >
                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Tax Type
                  </Text>

                  <Box
                    as="select"
                    value={
                      selectedTaxType?.id ||
                      ""
                    }
                    onChange={(e) =>
                      handleTaxTypeSelect(
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border:
                        "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background:
                        "white",
                      outline: "none",
                    }}
                  >
                    <option value="">
                      No Tax
                    </option>

                    {taxTypes.map(
                      (tax) => (
                        <option
                          key={tax.id}
                          value={tax.id}
                        >
                          {
                            tax.tax_type_name
                          }{" "}
                          {tax.country_name
                            ? `(${tax.country_name})`
                            : ""}
                        </option>
                      )
                    )}
                  </Box>

                  {selectedTaxType &&
                    selectedTaxRate && (
                    <Flex
                      align="center"
                      gap={2}
                      mt={1}
                    >
                      <Icon
                        as={LuTag}
                        color={
                          primaryMaroon
                        }
                        boxSize={3}
                      />

                      <Text
                        fontSize="xs"
                        color="gray.600"
                      >
                        {
                          selectedTaxType.tax_type_code
                        }{" "}
                        •{" "}
                        {
                          selectedTaxRate.rate_percentage
                        }
                        %
                      </Text>
                    </Flex>
                  )}

                  {errors.tax && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={1}
                    >
                      {errors.tax}
                    </Text>
                  )}
                </GridItem>

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Payment Status
                  </Text>

                  <Box
                    as="select"
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border:
                        "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      height: "48px",
                      background:
                        "white",
                      outline: "none",
                    }}
                  >
                    {paymentStatuses.map(
                      (status) => (
                        <option
                          key={
                            status.value
                          }
                          value={
                            status.value
                          }
                        >
                          {status.label}
                        </option>
                      )
                    )}
                  </Box>
                </GridItem>
              </Grid>

              {/* =================================================
                  TRANSACTION + AMOUNT
              ================================================= */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={4}
              >
                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Transaction /
                    Reference Number *
                  </Text>

                  <Input
                    name="transaction_id"
                    value={
                      formData.transaction_id
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="TXN-YYYYMMDD-XXXX"
                    height="48px"
                    fontSize="13px"
                    borderColor={
                      errors.transaction_id
                        ? "red.500"
                        : "gray.200"
                    }
                    _focus={{
                      borderColor:
                        primaryMaroon,
                      boxShadow: `0 0 0 1px ${primaryMaroon}`,
                    }}
                  />

                  {errors.transaction_id && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={1}
                    >
                      {
                        errors.transaction_id
                      }
                    </Text>
                  )}

                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={1}
                  >
                    Auto-generated. You
                    can edit it if needed.
                  </Text>
                </GridItem>

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Amount *
                  </Text>

                  <Input
                    type="number"
                    name="amount"
                    value={
                      formData.amount
                    }
                    readOnly
                    bg="gray.50"
                    cursor="not-allowed"
                    height="48px"
                    fontSize="13px"
                    borderColor={
                      errors.amount
                        ? "red.500"
                        : "gray.200"
                    }
                  />

                  {errors.amount && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={1}
                    >
                      {errors.amount}
                    </Text>
                  )}
                </GridItem>
              </Grid>

              {/* =================================================
                  NOTES
              ================================================= */}

              <Grid>
                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={1}
                  >
                    Notes
                  </Text>

                  <Textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Add any additional notes about this payment..."
                    rows={2}
                    fontSize="13px"
                    borderColor="gray.200"
                    _focus={{
                      borderColor:
                        primaryMaroon,
                      boxShadow: `0 0 0 1px ${primaryMaroon}`,
                    }}
                  />
                </GridItem>
              </Grid>

              {/* =================================================
                  PAYMENT RECEIPT / SCREENSHOT

                  EXISTING FIELD:
                  Bill.payment_receipt
              ================================================= */}

              <Box
                border="1px solid"
                borderColor={
                  errors.payment_receipt
                    ? "red.300"
                    : "gray.200"
                }
                borderRadius="lg"
                p={4}
                bg="white"
              >
                <Flex
                  align="center"
                  justify="space-between"
                  mb={3}
                >
                  <HStack spacing={3}>
                    <Circle
                      size="36px"
                      bg="rgba(174,32,80,0.08)"
                      color={
                        primaryMaroon
                      }
                    >
                      <Icon
                        as={LuImage}
                        boxSize={4}
                      />
                    </Circle>

                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color="#1a1a2e"
                      >
                        Payment Receipt /
                        Screenshot
                      </Text>

                      <Text
                        fontSize="xs"
                        color="gray.500"
                      >
                        Upload the payment
                        proof image
                      </Text>
                    </Box>
                  </HStack>

                  <Badge
                    bg="gray.100"
                    color="gray.600"
                    fontSize="10px"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    Optional
                  </Badge>
                </Flex>

                {!paymentReceiptPreview ? (
                  <Box
                    as="label"
                    display="block"
                    cursor="pointer"
                  >
                    <Box
                      border="1.5px dashed"
                      borderColor="gray.300"
                      borderRadius="md"
                      minH="120px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      px={4}
                      py={5}
                      transition="all 0.2s"
                      _hover={{
                        borderColor:
                          primaryMaroon,
                        bg: "rgba(174,32,80,0.02)",
                      }}
                    >
                      <VStack
                        spacing={2}
                      >
                        <Circle
                          size="40px"
                          bg="rgba(174,32,80,0.08)"
                          color={
                            primaryMaroon
                          }
                        >
                          <Icon
                            as={LuUpload}
                            boxSize={5}
                          />
                        </Circle>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color={
                            primaryMaroon
                          }
                        >
                          Click to upload
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.500"
                        >
                          JPG, JPEG, PNG or
                          WebP • Maximum
                          5 MB
                        </Text>
                      </VStack>

                      <Input
                        ref={
                          paymentReceiptInputRef
                        }
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={
                          handlePaymentReceiptChange
                        }
                        display="none"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    overflow="hidden"
                    bg="gray.50"
                  >
                    <Box
                      position="relative"
                      width="100%"
                      maxH="320px"
                      overflow="hidden"
                      bg="gray.100"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Image
                        src={
                          paymentReceiptPreview
                        }
                        alt="Payment receipt preview"
                        maxH="320px"
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
                        _hover={{
                          bg: "red.50",
                        }}
                        onClick={
                          removePaymentReceipt
                        }
                      >
                        <Icon
                          as={LuTrash2}
                          boxSize={4}
                        />
                      </Button>
                    </Box>

                    <Flex
                      align="center"
                      justify="space-between"
                      px={3}
                      py={2}
                      bg="white"
                      borderTop="1px solid"
                      borderColor="gray.200"
                    >
                      <Flex
                        align="center"
                        gap={2}
                        minW={0}
                      >
                        <Icon
                          as={LuImage}
                          color={
                            primaryMaroon
                          }
                          boxSize={4}
                        />

                        <Text
                          fontSize="xs"
                          color="gray.600"
                          noOfLines={1}
                        >
                          {
                            paymentReceipt?.name
                          }
                        </Text>
                      </Flex>

                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        color={
                          primaryMaroon
                        }
                        onClick={() =>
                          paymentReceiptInputRef.current?.click()
                        }
                      >
                        Change
                      </Button>
                    </Flex>
                  </Box>
                )}

                {errors.payment_receipt && (
                  <Text
                    fontSize="xs"
                    color="red.500"
                    mt={2}
                  >
                    {
                      errors.payment_receipt
                    }
                  </Text>
                )}
              </Box>

              {/* =================================================
                  PACKAGE SUMMARY
              ================================================= */}

              {selectedSubscription &&
                breakdown && (
                  <Box
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    p={4}
                  >
                    <HStack
                      spacing={3}
                      mb={4}
                    >
                      <Circle
                        size="36px"
                        bg="rgba(174,32,80,0.08)"
                        color={
                          primaryMaroon
                        }
                      >
                        <Icon
                          as={LuPackage}
                          boxSize={4}
                        />
                      </Circle>

                      <Text
                        fontWeight="700"
                        color="#1a1a2e"
                      >
                        Package &
                        Subscription Details
                      </Text>

                      <Badge
                        bg={
                          breakdown.billingCycle ===
                          "YEARLY"
                            ? "purple.50"
                            : "blue.50"
                        }
                        color={
                          breakdown.billingCycle ===
                          "YEARLY"
                            ? "purple.600"
                            : "blue.600"
                        }
                        fontSize="11px"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {
                          breakdown.cycleDisplay
                        }
                      </Badge>
                    </HStack>

                    <Grid
                      templateColumns={{
                        base:
                          "1fr 1fr",
                        md:
                          "1fr 1fr 1fr 1fr 1fr 1fr",
                      }}
                      gap={3}
                    >
                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Package
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#1a1a2e"
                        >
                          {
                            selectedSubscription.package_name
                          }
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          {
                            selectedSubscription.package_code
                          }
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Billing Cycle
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#1a1a2e"
                        >
                          {
                            breakdown.cycleDisplay
                          }
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          {
                            breakdown.durationMonths
                          }{" "}
                          months
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Member Capacity
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="700"
                          color={
                            primaryMaroon
                          }
                        >
                          {breakdown.capacity.toLocaleString(
                            "en-IN"
                          )}
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          Package limit
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          {
                            breakdown.rateDisplay
                          }
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#1a1a2e"
                        >
                          {formatCurrency(
                            breakdown.rate
                          )}
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          Per{" "}
                          {breakdown.billingCycle ===
                          "YEARLY"
                            ? "year"
                            : "month"}
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Subscription Amount
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#1a1a2e"
                        >
                          {formatCurrency(
                            breakdown.subtotal
                          )}
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          Before tax
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Tax Rate
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#1a1a2e"
                        >
                          {
                            breakdown.taxPercentage
                          }
                          %
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          {
                            selectedTaxType?.tax_type_name ||
                            "No Tax"
                          }
                        </Text>
                      </GridItem>
                    </Grid>
                  </Box>
                )}

              {/* =================================================
                  TAX SUMMARY
              ================================================= */}

              {selectedSubscription &&
                breakdown && (
                  <Box
                    bg="rgba(174,32,80,0.06)"
                    border="1px solid"
                    borderColor="rgba(174,32,80,0.15)"
                    borderRadius="lg"
                    p={4}
                  >
                    <HStack
                      spacing={3}
                      mb={4}
                    >
                      <Circle
                        size="36px"
                        bg="rgba(174,32,80,0.1)"
                        color={
                          primaryMaroon
                        }
                      >
                        <Icon
                          as={LuCalculator}
                          boxSize={4}
                        />
                      </Circle>

                      <Text
                        fontWeight="700"
                        color="#1a1a2e"
                      >
                        Tax & Payment Summary
                      </Text>

                      <Badge
                        bg={
                          breakdown.billingCycle ===
                          "YEARLY"
                            ? "purple.50"
                            : "blue.50"
                        }
                        color={
                          breakdown.billingCycle ===
                          "YEARLY"
                            ? "purple.600"
                            : "blue.600"
                        }
                        fontSize="11px"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {
                          breakdown.cycleDisplay
                        }{" "}
                        Billing
                      </Badge>
                    </HStack>

                    <Grid
                      templateColumns={{
                        base:
                          "1fr 1fr",
                        md:
                          "1fr 1fr 1fr 1fr",
                      }}
                      gap={4}
                    >
                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Subtotal
                        </Text>

                        <Text
                          fontSize="lg"
                          fontWeight="700"
                          color="#333"
                        >
                          {formatCurrency(
                            breakdown.subtotal
                          )}
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.400"
                        >
                          Before tax
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Tax Type
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#333"
                        >
                          {
                            selectedTaxType?.tax_type_name ||
                            "No Tax"
                          }
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Tax Rate
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#333"
                        >
                          {
                            breakdown.taxPercentage
                          }
                          %
                        </Text>
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Tax Amount
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="#333"
                        >
                          {formatCurrency(
                            breakdown.taxAmount
                          )}
                        </Text>
                      </GridItem>
                    </Grid>

                    <Box
                      borderTop="1px solid"
                      borderColor="rgba(174,32,80,0.15)"
                      my={4}
                    />

                    <Flex
                      justify="space-between"
                      align={{
                        base: "flex-start",
                        md: "center",
                      }}
                      direction={{
                        base: "column",
                        md: "row",
                      }}
                      gap={3}
                    >
                      <Box>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Total Payable
                        </Text>

                        <Text
                          fontSize="2xl"
                          fontWeight="800"
                          color={
                            primaryMaroon
                          }
                        >
                          {formatCurrency(
                            breakdown.total
                          )}
                        </Text>
                      </Box>

                      <Box>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Payment Status
                        </Text>

                        <Badge
                          bg={
                            formData.status ===
                            "PAID"
                              ? "green.50"
                              : formData.status ===
                                "UNPAID"
                              ? "red.50"
                              : "gray.50"
                          }
                          color={
                            formData.status ===
                            "PAID"
                              ? "green.600"
                              : formData.status ===
                                "UNPAID"
                              ? "red.600"
                              : "gray.600"
                          }
                          fontSize="12px"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {
                            formData.status
                          }
                        </Badge>
                      </Box>

                      <Box>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                        >
                          Payment Method
                        </Text>

                        <Text
                          fontSize="sm"
                          fontWeight="600"
                        >
                          {
                            formData.payment_method
                          }
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                )}

              {/* =================================================
                  RECEIPT INFORMATION
              ================================================= */}

              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
              >
                <Flex
                  align="center"
                  gap={2}
                >
                  <Icon
                    as={LuReceipt}
                    boxSize={4}
                    color={
                      primaryMaroon
                    }
                  />

                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.700"
                  >
                    Receipt Information
                  </Text>
                </Flex>

                <Text
                  fontSize="xs"
                  color="gray.500"
                  mt={1}
                >
                  Receipt number and tax
                  details will be generated
                  after the payment is
                  recorded.
                </Text>

                {selectedSubscription &&
                  breakdown && (
                    <Flex
                      gap={4}
                      mt={2}
                      fontSize="xs"
                      color="gray.500"
                      flexWrap="wrap"
                    >
                      <Flex
                        align="center"
                        gap={1}
                      >
                        <Icon
                          as={LuClock}
                          boxSize={3}
                        />

                        <Text>
                          Payment Date:{" "}
                          {new Date().toLocaleDateString()}
                        </Text>
                      </Flex>

                      <Flex
                        align="center"
                        gap={1}
                      >
                        <Icon
                          as={LuUser}
                          boxSize={3}
                        />

                        <Text>
                          Receipt will be
                          sent to:{" "}
                          {selectedChurch?.email ||
                            "N/A"}
                        </Text>
                      </Flex>

                      <Flex
                        align="center"
                        gap={1}
                      >
                        <Icon
                          as={LuDollarSign}
                          boxSize={3}
                        />

                        <Text>
                          Total:{" "}
                          {formatCurrency(
                            breakdown.total
                          )}
                        </Text>
                      </Flex>

                      <Flex
                        align="center"
                        gap={1}
                      >
                        <Icon
                          as={LuWallet}
                          boxSize={3}
                        />

                        <Text>
                          Tax:{" "}
                          {
                            breakdown.taxPercentage
                          }
                          %
                        </Text>
                      </Flex>

                      <Flex
                        align="center"
                        gap={1}
                      >
                        <Icon
                          as={LuCreditCard}
                          boxSize={3}
                        />

                        <Text>
                          {
                            formData.payment_method
                          }
                        </Text>
                      </Flex>
                    </Flex>
                  )}
              </Box>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <Flex
                justify="flex-end"
                pt={2}
              >
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{
                    bg: "#8a1a3e",
                  }}
                  type="submit"
                  isLoading={
                    isSubmitting
                  }
                  loadingText="Recording..."
                  size="lg"
                  px={8}
                >
                  <Icon
                    as={LuSave}
                    boxSize={4}
                    mr={2}
                  />

                  Record Payment
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