// src/admin/pages/EditSubscriptionPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  Spinner,
} from "@chakra-ui/react";

import {
  LuSave,
  LuBox,
  LuCalendar,
  LuChevronDown,
  LuCheck,
  LuSearch,
  LuX,
  LuChurch,
  LuHouse,
  LuLockKeyhole,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryRed = "#d7193f";
const darkText = "#17294d";
const mutedText = "#536684";
const borderColor = "#dfe4ec";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateInput = (date) => {
  if (!date) return "";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  return value.toISOString().slice(0, 10);
};

const formatCurrency = (amount, currency = "INR") => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `₹${numericAmount.toLocaleString("en-IN")}`;
  }
};

/* -------------------------------------------------------------------------- */
/* Searchable Church Dropdown                                                 */
/* -------------------------------------------------------------------------- */

const ChurchDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selectedOption = options.find((option) => option.id === value);

  const filteredOptions = searchTerm
    ? options.filter(
        (option) =>
          option.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.code?.toLowerCase().includes(searchTerm.toLowerCase())
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Box
        onClick={() => !disabled && setIsOpen((previous) => !previous)}
        cursor={disabled ? "not-allowed" : "pointer"}
        border="1px solid"
        borderColor={
          isInvalid ? "red.400" : isOpen ? primaryRed : borderColor
        }
        borderRadius="6px"
        minH="44px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={disabled ? "#f8fafc" : "white"}
        opacity={disabled ? 0.9 : 1}
        transition="all 0.2s"
        _hover={{
          borderColor: isInvalid
            ? "red.400"
            : disabled
            ? borderColor
            : "#b9c1cf",
        }}
      >
        {selectedOption ? (
          <Box flex="1" overflow="hidden">
            <Text
              fontSize="14px"
              fontWeight="500"
              color={disabled ? "#71809b" : darkText}
              noOfLines={1}
            >
              {selectedOption.name}
              {selectedOption.code ? ` (${selectedOption.code})` : ""}
            </Text>
          </Box>
        ) : (
          <Text color="gray.400" fontSize="14px">
            {placeholder}
          </Text>
        )}

        {disabled ? (
          <Icon as={LuLockKeyhole} color="#71809b" boxSize={4} />
        ) : (
          <Icon
            as={LuChevronDown}
            boxSize={4}
            color={isOpen ? primaryRed : "#61708b"}
            transform={isOpen ? "rotate(180deg)" : "none"}
            transition="transform 0.2s"
          />
        )}
      </Box>

      {isOpen && !disabled && (
        <Box
          position="absolute"
          left="0"
          right="0"
          top="calc(100% + 5px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="6px"
          boxShadow="0 10px 30px rgba(20,35,65,0.12)"
          zIndex={1000}
          overflow="hidden"
        >
          <Box p={2} bg="#f8fafc" borderBottom="1px solid #edf0f5">
            <Flex
              align="center"
              gap={2}
              bg="white"
              px={2}
              border="1px solid #e2e7ef"
              borderRadius="5px"
            >
              <Icon as={LuSearch} color="#71809b" boxSize={4} />
              <Input
                ref={searchRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search church by name or code..."
                border="none"
                outline="none"
                boxShadow="none"
                _focus={{ boxShadow: "none" }}
                height="34px"
                fontSize="13px"
                px={0}
              />
              {searchTerm && (
                <Box
                  as="button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearchTerm("");
                  }}
                  color="gray.400"
                >
                  <Icon as={LuX} boxSize={3} />
                </Box>
              )}
            </Flex>
          </Box>

          <Box maxH="260px" overflowY="auto">
            {filteredOptions.length === 0 ? (
              <Box py={6} textAlign="center">
                <Text fontSize="13px" color="gray.400">
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
                  bg={option.id === value ? "#fff4f6" : "white"}
                  borderBottom="1px solid #f0f2f6"
                  _hover={{ bg: "#fafbfc" }}
                  onClick={() => handleSelect(option)}
                >
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Text
                        fontSize="13px"
                        fontWeight={option.id === value ? "600" : "500"}
                        color={option.id === value ? primaryRed : darkText}
                      >
                        {option.name}
                      </Text>
                      <Text fontSize="11px" color="gray.500" mt={0.5}>
                        {option.code || "—"}
                        {option.city ? ` • ${option.city}` : ""}
                      </Text>
                    </Box>
                    {option.id === value && (
                      <Icon as={LuCheck} color={primaryRed} boxSize={4} />
                    )}
                  </Flex>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text fontSize="11px" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/* Searchable Package Dropdown                                                */
/* -------------------------------------------------------------------------- */

const PackageDropdown = ({
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

  const selectedOption = options.find((option) => option.id === value);

  const filteredOptions = searchTerm
    ? options.filter(
        (option) =>
          option.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.code?.toLowerCase().includes(searchTerm.toLowerCase())
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Box
        onClick={() => setIsOpen((previous) => !previous)}
        cursor="pointer"
        border="1px solid"
        borderColor={
          isInvalid ? "red.400" : isOpen ? primaryRed : borderColor
        }
        borderRadius="6px"
        minH="44px"
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        transition="all 0.2s"
        _hover={{
          borderColor: isInvalid ? "red.400" : "#b9c1cf",
        }}
      >
        <Text
          fontSize="14px"
          fontWeight="500"
          color={selectedOption ? darkText : "gray.400"}
          noOfLines={1}
          flex="1"
        >
          {selectedOption
            ? `${selectedOption.name}${
                selectedOption.code ? ` (${selectedOption.code})` : ""
              }`
            : placeholder}
        </Text>

        <Icon
          as={LuChevronDown}
          boxSize={4}
          color={isOpen ? primaryRed : "#61708b"}
          transform={isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          flexShrink={0}
        />
      </Box>

      {isOpen && (
        <Box
          position="absolute"
          left="0"
          right="0"
          top="calc(100% + 5px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="6px"
          boxShadow="0 10px 30px rgba(20,35,65,0.12)"
          zIndex={1000}
          overflow="hidden"
        >
          <Box p={2} bg="#f8fafc" borderBottom="1px solid #edf0f5">
            <Flex
              align="center"
              gap={2}
              bg="white"
              px={2}
              border="1px solid #e2e7ef"
              borderRadius="5px"
            >
              <Icon as={LuSearch} color="#71809b" boxSize={4} />
              <Input
                ref={searchRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search package by name or code..."
                border="none"
                _focus={{ boxShadow: "none" }}
                height="34px"
                fontSize="13px"
                px={0}
              />
              {searchTerm && (
                <Box
                  as="button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearchTerm("");
                  }}
                  color="gray.400"
                >
                  <Icon as={LuX} boxSize={3} />
                </Box>
              )}
            </Flex>
          </Box>

          <Box maxH="280px" overflowY="auto">
            {filteredOptions.length === 0 ? (
              <Box py={6} textAlign="center">
                <Text fontSize="13px" color="gray.400">
                  No packages found
                </Text>
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.id}
                  px={3}
                  py={2.5}
                  cursor="pointer"
                  bg={option.id === value ? "#fff4f6" : "white"}
                  borderBottom="1px solid #f0f2f6"
                  _hover={{ bg: "#fafbfc" }}
                  onClick={() => handleSelect(option)}
                >
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Text
                        fontSize="13px"
                        fontWeight={option.id === value ? "600" : "500"}
                        color={option.id === value ? primaryRed : darkText}
                      >
                        {option.name}
                      </Text>
                      <Text fontSize="11px" color="gray.500" mt={0.5}>
                        {option.code || "—"}
                        {option.rate_per_member_monthly != null
                          ? ` • ${formatCurrency(
                              option.rate_per_member_monthly
                            )}/mo`
                          : ""}
                      </Text>
                    </Box>

                    {option.id === value && (
                      <Icon as={LuCheck} color={primaryRed} boxSize={4} />
                    )}
                  </Flex>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text fontSize="11px" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/* Small UI pieces                                                            */
/* -------------------------------------------------------------------------- */

const FieldLabel = ({ children, required = false }) => (
  <Text
    fontSize="13px"
    fontWeight="600"
    color={darkText}
    mb={2}
  >
    {children}
    {required && (
      <Text as="span" color={primaryRed}>
        {" "}
        *
      </Text>
    )}
  </Text>
);

const DateField = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  min,
}) => (
  <Box>
    <FieldLabel required>{label}</FieldLabel>

    <Box
      position="relative"
      border="1px solid"
      borderColor={error ? "red.400" : borderColor}
      borderRadius="6px"
      height="44px"
      bg={disabled ? "#f8fafc" : "white"}
      overflow="hidden"
    >
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        min={min}
        border="none"
        borderRadius="none"
        height="100%"
        px={3}
        pr={10}
        fontSize="14px"
        fontWeight="500"
        color={disabled ? "#7b89a1" : darkText}
        _focus={{ boxShadow: "none" }}
        _disabled={{
          opacity: 1,
          cursor: "not-allowed",
          bg: "#f8fafc",
        }}
      />

      <Icon
        as={disabled ? LuLockKeyhole : LuCalendar}
        position="absolute"
        right="12px"
        top="50%"
        transform="translateY(-50%)"
        color="#687892"
        boxSize={4}
        pointerEvents="none"
      />
    </Box>

    {error && (
      <Text fontSize="11px" color="red.500" mt={1}>
        {error}
      </Text>
    )}
  </Box>
);

const SummaryRow = ({ label, value, strong = false }) => (
  <Flex
    justify="space-between"
    align="center"
    py={2.5}
    borderBottom="1px dashed #e4e8ef"
    gap={4}
  >
    <Text fontSize="13px" color={mutedText}>
      {label}
    </Text>
    <Text
      fontSize="13px"
      fontWeight={strong ? "700" : "500"}
      color={darkText}
      textAlign="right"
    >
      {value}
    </Text>
  </Flex>
);

const StatusBadge = ({ active }) => (
  <Badge
    bg={active ? "#dff5e5" : "#fbe2e6"}
    color={active ? "#24843c" : "#c72a43"}
    borderRadius="full"
    px={2.5}
    py={1}
    fontSize="11px"
    fontWeight="600"
    textTransform="none"
  >
    {active ? "Active" : "Inactive"}
  </Badge>
);

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

const EditSubscriptionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [churches, setChurches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [selectedChurch, setSelectedChurch] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [billingCycle, setBillingCycle] = useState("YEARLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [autoRenew, setAutoRenew] = useState(true);

  const [errors, setErrors] = useState({});

  /* ------------------------------ Load data ------------------------------ */

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const [subRes, churchesRes, packagesRes] = await Promise.all([
          adminApi.getSubscriptionDetail(id),
          adminApi.getChurches(),
          adminApi.getPackages({ is_active: true }),
        ]);

        const sub = subRes?.data || subRes;

        if (!sub || !sub.id) {
          toaster.create({
            title: "Not found",
            description: "Subscription could not be found.",
            type: "error",
            duration: 4000,
          });

          setTimeout(() => navigate("/admin/subscriptions"), 0);
          return;
        }

        const churchesData = churchesRes?.data || churchesRes || [];
        const packagesData =
          packagesRes?.results || packagesRes?.data || packagesRes || [];

        setSubscription(sub);
        setChurches(Array.isArray(churchesData) ? churchesData : []);
        setPackages(Array.isArray(packagesData) ? packagesData : []);

        const churchId =
          sub.church_id ?? sub.church?.id ?? sub.church ?? null;

        const packageId =
          sub.package_id ?? sub.package?.id ?? sub.package ?? null;

        const foundChurch = (churchesData || []).find(
          (church) => church.id === churchId
        );

        const foundPackage = (packagesData || []).find(
          (pkg) => pkg.id === packageId
        );

        /*
         * Some APIs return the nested church/package objects while others
         * return only their IDs. Keep the nested object as a fallback so the
         * page still renders correctly during edit.
         */
        setSelectedChurch(foundChurch || sub.church || null);
        setSelectedPackage(foundPackage || sub.package || null);

        setBillingCycle(sub.billing_cycle || "YEARLY");
        setStartDate(toDateInput(sub.start_date));
        setEndDate(toDateInput(sub.end_date));

        const initialActive =
          sub.is_active !== false &&
          String(sub.status || "ACTIVE").toUpperCase() !== "INACTIVE";

        setStatus(
          String(sub.status || (initialActive ? "ACTIVE" : "INACTIVE")).toUpperCase()
        );

        setAutoRenew(
          sub.auto_renew ??
            sub.auto_renewal ??
            sub.is_auto_renew ??
            true
        );
      } catch (error) {
        console.error("Error loading subscription:", error);

        toaster.create({
          title: "Error",
          description:
            error?.response?.data?.error ||
            "Failed to load subscription details.",
          type: "error",
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  /* ------------------------------ Handlers ------------------------------- */

  const handleChurchSelect = (churchId) => {
    const church = churches.find((item) => item.id === churchId);
    setSelectedChurch(church || null);

    if (errors.church) {
      setErrors((previous) => ({ ...previous, church: "" }));
    }
  };

  const handlePackageSelect = (packageId) => {
    const pkg = packages.find((item) => item.id === packageId);
    setSelectedPackage(pkg || null);

    if (errors.package) {
      setErrors((previous) => ({ ...previous, package: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!selectedChurch) {
      newErrors.church = "Please select a church";
    }

    if (!selectedPackage) {
      newErrors.package = "Please select a package";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "Renewal date is required";
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) <= new Date(startDate)
    ) {
      newErrors.endDate = "Renewal date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      /*
       * Keep the existing API fields used by the original page. The status
       * selector controls is_active, while auto_renew is sent when supported
       * by the backend serializer.
       */
      const data = {
        church_id: selectedChurch.id,
        package_id: selectedPackage.id,
        billing_cycle: billingCycle,
        start_date: startDate,
        end_date: endDate,
        is_active: status === "ACTIVE",
        auto_renew: autoRenew,
      };

      await adminApi.updateSubscription(id, data);

      toaster.create({
        title: "Success",
        description: `Subscription for ${selectedChurch.name} updated successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate(`/admin/subscriptions/${id}`);
    } catch (error) {
      console.error("Error updating subscription:", error);

      toaster.create({
        title: "Error",
        description:
          error?.response?.data?.error ||
          "Failed to update subscription.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------- Pricing calculation ---------------------- */

  const getRatePerMember = () => {
    if (!selectedPackage) return 0;

    return billingCycle === "MONTHLY"
      ? Number(selectedPackage.rate_per_member_monthly || 0)
      : Number(selectedPackage.rate_per_member_yearly || 0);
  };

  const memberLimit = Number(selectedPackage?.member_limit || 0);
  const ratePerMember = getRatePerMember();

  /*
   * Yearly package rates are already yearly rates. Do NOT multiply the
   * yearly rate by 12. Monthly packages are multiplied by the number of
   * members only.
   */
  const subscriptionAmount = memberLimit * ratePerMember;

  const currencyCode =
    selectedChurch?.currency ||
    subscription?.currency ||
    "INR";

  /* ------------------------------- Loading ------------------------------- */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex minH="420px" align="center" justify="center">
            <Spinner size="xl" color={primaryRed} thickness="4px" />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  if (!subscription) return null;

  const subscriptionNumber =
    subscription.subscription_number ||
    subscription.subscription_no ||
    subscription.number ||
    subscription.code ||
    `SUB-${String(id).padStart(6, "0")}`;

  const assignedDate =
    subscription.created_at ||
    subscription.assigned_at ||
    subscription.start_date;

  const updatedDate =
    subscription.updated_at ||
    subscription.last_updated ||
    subscription.created_at;

  const updatedBy =
    subscription.updated_by_name ||
    subscription.updated_by?.name ||
    subscription.updated_by?.username ||
    subscription.created_by_name ||
    "Super Admin";

  const churchCode =
    selectedChurch?.code ||
    selectedChurch?.church_code ||
    subscription.church_code ||
    "—";

  const packageCode =
    selectedPackage?.code ||
    selectedPackage?.package_code ||
    subscription.package_code ||
    "—";

  /* -------------------------------- Render ------------------------------- */

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        {/* Breadcrumb */}
        <HStack spacing={2} mb={3} color={mutedText} fontSize="13px">
          <Box
            as="button"
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            color="#60718e"
            _hover={{ color: primaryRed }}
          >
            <Icon as={LuHouse} boxSize={4} />
          </Box>

          <Text color="#9aa5b8">›</Text>

          <Box
            as="button"
            type="button"
            onClick={() => navigate("/admin/subscriptions")}
            _hover={{ color: primaryRed }}
          >
            Subscriptions
          </Box>

          <Text color="#9aa5b8">›</Text>

          <Text>{subscriptionNumber}</Text>

          <Text color="#9aa5b8">›</Text>

          <Text color={darkText}>Edit</Text>
        </HStack>

        {/* Page title */}
        <Box mb={5}>
          <Text
            fontSize="13px"
            fontWeight="700"
            color={primaryRed}
            textTransform="uppercase"
            letterSpacing="0.04em"
            mb={1}
          >
            Subscription Management
          </Text>

          <Heading
            fontSize={{ base: "26px", md: "32px" }}
            lineHeight="1.15"
            fontWeight="800"
            color={darkText}
          >
            Edit Subscription
          </Heading>

          <Text color={mutedText} fontSize="15px" mt={1}>
            Update package, billing cycle and renewal settings.
          </Text>
        </Box>

        {/* Subscription identity card */}
        <Box
          bg="white"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="10px"
          px={{ base: 4, md: 6 }}
          py={4}
          mb={5}
          boxShadow="0 2px 8px rgba(25,45,80,0.04)"
        >
          <Flex
            align="center"
            justify="space-between"
            gap={5}
            direction={{ base: "column", md: "row" }}
          >
            <HStack
              spacing={4}
              width={{ base: "100%", md: "auto" }}
              align="center"
            >
              <Circle
                size={{ base: "58px", md: "68px" }}
                bg="#fff0f3"
                color={primaryRed}
                flexShrink={0}
              >
                <Icon as={LuChurch} boxSize={{ base: 7, md: 8 }} />
              </Circle>

              <Box>
                <Heading
                  fontSize={{ base: "20px", md: "24px" }}
                  color={darkText}
                  fontWeight="750"
                  mb={1}
                >
                  {selectedChurch?.name || "Church"}
                </Heading>

                <HStack
                  spacing={3}
                  color={mutedText}
                  fontSize="14px"
                  flexWrap="wrap"
                >
                  <Text>{churchCode}</Text>
                  <Text>•</Text>
                  <Text>{subscriptionNumber}</Text>
                  <StatusBadge active={status === "ACTIVE"} />
                </HStack>
              </Box>
            </HStack>

            <Box
              height={{ base: "1px", md: "58px" }}
              width={{ base: "100%", md: "1px" }}
              bg="#e2e6ed"
            />

            <HStack
              spacing={4}
              width={{ base: "100%", md: "30%" }}
              minW={{ md: "260px" }}
            >
              <Circle
                size="54px"
                bg="#fff0f3"
                color={primaryRed}
                flexShrink={0}
              >
                <Icon as={LuBox} boxSize={6} />
              </Circle>

              <Box>
                <Text
                  fontSize="21px"
                  fontWeight="750"
                  color={darkText}
                  lineHeight="1.2"
                >
                  {selectedPackage?.name || "Package"}
                </Text>
                <Text fontSize="14px" color={mutedText} mt={1}>
                  Current Package
                </Text>
              </Box>
            </HStack>
          </Flex>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Main two-column area */}
          <Grid
            templateColumns={{ base: "1fr", xl: "minmax(0, 1.7fr) minmax(310px, 0.73fr)" }}
            gap={5}
            alignItems="start"
          >
            {/* Left: Subscription information */}
            <GridItem>
              <Box
                bg="white"
                border="1px solid"
                borderColor={borderColor}
                borderRadius="10px"
                p={{ base: 4, md: 6 }}
                boxShadow="0 2px 8px rgba(25,45,80,0.035)"
              >
                <Heading
                  fontSize="20px"
                  color={darkText}
                  fontWeight="700"
                  mb={5}
                >
                  Subscription Information
                </Heading>

                <VStack spacing={5} align="stretch">
                  {/* Church / Package */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={5}
                  >
                    <GridItem>
                      <FieldLabel required>Church</FieldLabel>

                      <ChurchDropdown
                        options={churches}
                        value={selectedChurch?.id || null}
                        onChange={handleChurchSelect}
                        placeholder="Select a church..."
                        isInvalid={!!errors.church}
                        error={errors.church}
                        disabled
                      />
                    </GridItem>

                    <GridItem>
                      <FieldLabel required>Package</FieldLabel>

                      <PackageDropdown
                        options={packages}
                        value={selectedPackage?.id || null}
                        onChange={handlePackageSelect}
                        placeholder="Select a package..."
                        isInvalid={!!errors.package}
                        error={errors.package}
                      />
                    </GridItem>
                  </Grid>

                  {/* Billing cycle / Start date */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={5}
                  >
                    <GridItem>
                      <FieldLabel required>Billing Cycle</FieldLabel>

                      <Box
                        display="grid"
                        gridTemplateColumns="1fr 1fr"
                        height="44px"
                        border="1px solid"
                        borderColor={primaryRed}
                        borderRadius="6px"
                        overflow="hidden"
                      >
                        <Button
                          type="button"
                          borderRadius="0"
                          height="100%"
                          bg={
                            billingCycle === "MONTHLY"
                              ? "white"
                              : "#fafafa"
                          }
                          color={
                            billingCycle === "MONTHLY"
                              ? primaryRed
                              : mutedText
                          }
                          border="none"
                          fontSize="14px"
                          fontWeight="500"
                          onClick={() => setBillingCycle("MONTHLY")}
                          _hover={{
                            bg:
                              billingCycle === "MONTHLY"
                                ? "#fff6f7"
                                : "#f7f8fa",
                          }}
                        >
                          Monthly
                        </Button>

                        <Button
                          type="button"
                          borderRadius="0"
                          height="100%"
                          bg={
                            billingCycle === "YEARLY"
                              ? "#fff0f3"
                              : "white"
                          }
                          color={
                            billingCycle === "YEARLY"
                              ? primaryRed
                              : mutedText
                          }
                          border="none"
                          borderLeft="1px solid"
                          borderColor={primaryRed}
                          fontSize="14px"
                          fontWeight="600"
                          onClick={() => setBillingCycle("YEARLY")}
                          _hover={{ bg: "#fff6f7" }}
                        >
                          Yearly
                        </Button>
                      </Box>
                    </GridItem>

                    <GridItem>
                      <DateField
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        disabled
                        error={errors.startDate}
                      />
                    </GridItem>
                  </Grid>

                  {/* Renewal / Status */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={5}
                  >
                    <GridItem>
                      <DateField
                        label="Next Renewal Date"
                        value={endDate}
                        onChange={setEndDate}
                        min={startDate || undefined}
                        error={errors.endDate}
                      />
                    </GridItem>

                    {/* <GridItem>
                      <FieldLabel required>Status</FieldLabel>

                      <Box
                        as="select"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        width="100%"
                        height="44px"
                        px={3}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="6px"
                        bg="white"
                        color={darkText}
                        fontSize="14px"
                        cursor="pointer"
                        _focus={{
                          borderColor: primaryRed,
                          boxShadow: `0 0 0 1px ${primaryRed}`,
                          outline: "none",
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="CANCELLED">Cancelled</option>
                      </Box>
                    </GridItem> */}
                  </Grid>

                  {/* Auto renew */}
                  <Flex
                    align="center"
                    justify="space-between"
                    gap={4}
                    pt={1}
                  >
                    <Box>
                      <Text
                        fontSize="14px"
                        fontWeight="600"
                        color={darkText}
                      >
                        Auto Renew
                      </Text>
                      <Text fontSize="13px" color={mutedText} mt={0.5}>
                        Renew automatically on the due date
                      </Text>
                    </Box>

                    <Box
                      as="button"
                      type="button"
                      role="switch"
                      aria-checked={autoRenew}
                      onClick={() => setAutoRenew((previous) => !previous)}
                      width="62px"
                      height="34px"
                      borderRadius="full"
                      bg={autoRenew ? "#2eb24d" : "#c7ced9"}
                      position="relative"
                      flexShrink={0}
                      transition="background 0.2s"
                    >
                      <Circle
                        size="28px"
                        bg="white"
                        position="absolute"
                        top="3px"
                        left={autoRenew ? "31px" : "3px"}
                        boxShadow="0 1px 4px rgba(0,0,0,0.2)"
                        transition="left 0.2s"
                      />
                    </Box>
                  </Flex>

                  {/* Footer actions */}
                  <Flex
                    justify="flex-end"
                    align="center"
                    gap={3}
                    borderTop="1px solid #edf0f4"
                    mt={1}
                    pt="18px"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      borderColor="#aeb7c7"
                      color={darkText}
                      height="44px"
                      minW="126px"
                      borderRadius="6px"
                      fontSize="14px"
                      fontWeight="600"
                      onClick={() =>
                        navigate(`/admin/subscriptions/${id}`)
                      }
                      isDisabled={isSubmitting}
                      _hover={{ bg: "#f8fafc" }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      bg={primaryRed}
                      color="white"
                      height="44px"
                      minW="164px"
                      borderRadius="6px"
                      fontSize="14px"
                      fontWeight="600"
                      isLoading={isSubmitting}
                      loadingText="Saving..."
                      leftIcon={<LuSave size={17} />}
                      _hover={{ bg: "#bd1436" }}
                    >
                      Save Changes
                    </Button>
                  </Flex>
                </VStack>
              </Box>
            </GridItem>

            {/* Right: Pricing + Record information */}
            <GridItem>
              <VStack spacing={5} align="stretch">
                {/* Pricing Summary */}
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="10px"
                  p={5}
                  boxShadow="0 2px 8px rgba(25,45,80,0.035)"
                >
                  <Heading
                    fontSize="20px"
                    color={darkText}
                    fontWeight="700"
                    mb={4}
                  >
                    Pricing Summary
                  </Heading>

                  <SummaryRow
                    label={`Rate per Member (${
                      billingCycle === "YEARLY" ? "Yearly" : "Monthly"
                    })`}
                    value={formatCurrency(ratePerMember, currencyCode)}
                  />

                  <SummaryRow
                    label="Billable Member Limit"
                    value={memberLimit.toLocaleString("en-IN")}
                  />

                  <SummaryRow
                    label="Subscription Amount"
                    value={formatCurrency(
                      subscriptionAmount,
                      currencyCode
                    )}
                    strong
                  />

                  <Flex
                    justify="space-between"
                    align="center"
                    pt={3}
                  >
                    <Text fontSize="13px" color={mutedText}>
                      Currency
                    </Text>
                    <Text
                      fontSize="13px"
                      color={darkText}
                      fontWeight="500"
                    >
                      {currencyCode === "INR"
                        ? "INR (₹)"
                        : currencyCode}
                    </Text>
                  </Flex>
                </Box>

                {/* Record Information */}
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="10px"
                  p={5}
                  boxShadow="0 2px 8px rgba(25,45,80,0.035)"
                >
                  <Heading
                    fontSize="20px"
                    color={darkText}
                    fontWeight="700"
                    mb={3}
                  >
                    Record Information
                  </Heading>

                  <SummaryRow
                    label="Assigned"
                    value={formatDate(assignedDate)}
                  />

                  <SummaryRow
                    label="Last Updated"
                    value={formatDate(updatedDate)}
                  />

                  <Flex
                    justify="space-between"
                    align="center"
                    py={2.5}
                    gap={4}
                  >
                    <Text fontSize="13px" color={mutedText}>
                      Updated By
                    </Text>
                    <Text
                      fontSize="13px"
                      color={darkText}
                      fontWeight="600"
                      textAlign="right"
                    >
                      {updatedBy}
                    </Text>
                  </Flex>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </form>
      </Container>
    </AdminLayout>
  );
};

export default EditSubscriptionPage;
