// src/admin/pages/AccountLedgerEditPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
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
  LuNetwork,
  LuCalendar,
  LuClipboardList,
  LuUser,
  LuTriangleAlert,
  LuClock,
  LuTrash2,
  LuBookOpen,
  LuIndianRupee,
  LuLock,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";

import {
  getAccountLedger,
  updateAccountLedger,
  deleteAccountLedger,
  listAccountGroups,
} from "../api/registryServices";

/* =========================================================
   COLORS
========================================================= */
const primaryMaroon = "#ae2050";
const dark = "#182338";
const muted = "#60708C";
const border = "#DCE2EA";
const red = "#D7193F";

/* =========================================================
   TOAST HELPER
========================================================= */
const showToast = ({ title, description, type = "info", duration = 4000 }) => {
  toaster.create({ title, description, type, duration, closable: true });
};

const FIELD_LABELS = {
  ledger_name: "Ledger Name",
  ledger_code: "Ledger Code",
  alias: "Alias",
  account_group: "Account Group",
  op_balance: "Opening Balance",
};

/* =========================================================
   HELPERS
========================================================= */
const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const FieldLabel = ({ children, required }) => (
  <Text fontSize="12px" fontWeight="700" color={dark} mb={1.5}>
    {children}
    {required && (
      <Text as="span" color="red.500" ml={1}>
        *
      </Text>
    )}
  </Text>
);

const TextField = ({ error, isReadOnly, ...props }) => (
  <Input
    height="40px"
    fontSize="12px"
    borderColor={error ? "red.500" : border}
    borderRadius="6px"
    bg={isReadOnly ? "#F7FAFC" : "white"}
    cursor={isReadOnly ? "not-allowed" : "text"}
    _focus={{
      borderColor: isReadOnly ? border : primaryMaroon,
      boxShadow: isReadOnly ? "none" : `0 0 0 1px ${primaryMaroon}`,
    }}
    isReadOnly={isReadOnly}
    {...props}
  />
);

const AccountGroupSelect = ({ value, onChange, groups, error, isReadOnly }) => (
  <Box position="relative">
    <Icon
      as={LuNetwork}
      boxSize={4}
      color="gray.400"
      position="absolute"
      left="12px"
      top="50%"
      transform="translateY(-50%)"
      zIndex={1}
      pointerEvents="none"
    />
    <Box
      as="select"
      value={value}
      onChange={onChange}
      disabled={isReadOnly}
      style={{
        width: "100%",
        padding: "0 12px 0 36px",
        borderRadius: "6px",
        border: `1px solid ${error ? "#e53e3e" : border}`,
        fontSize: "12px",
        height: "40px",
        background: isReadOnly ? "#F7FAFC" : "white",
        outline: "none",
        color: isReadOnly ? "#a0aec0" : value ? dark : "#a0aec0",
        cursor: isReadOnly ? "not-allowed" : "pointer",
      }}
    >
      <option value="">Select account group</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.group_name}
        </option>
      ))}
    </Box>
  </Box>
);

const SidebarCard = ({ icon, iconColor, title, children }) => (
  <Box bg="white" borderRadius="8px" border="1px solid" borderColor={border} p={4}>
    <HStack gap={2} mb={2}>
      <Icon as={icon} boxSize={4} color={iconColor || primaryMaroon} />
      <Text fontSize="13px" fontWeight="800" color={dark}>
        {title}
      </Text>
    </HStack>
    {children}
  </Box>
);

/* =========================================================
   MAIN PAGE
========================================================= */
const AccountLedgerEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [ledger, setLedger] = useState(null);

  const [formData, setFormData] = useState({
    ledger_name: "",
    ledger_code: "",
    alias: "",
    account_group: "",
    op_balance: "",
    status: true,
  });

  const [initialData, setInitialData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isReserved = Boolean(ledger?.reserved);

  // ✅ FIXED LOGIC: 
  // 1. Opening Balance is ONLY locked if a value > 0 exists.
  // 2. It does NOT check isReserved, so you can always enter the first opening balance.
  const initialOpBalance = Number(pick(ledger, ["op_balance"], 0));
  const isOpeningBalanceLocked = initialOpBalance > 0;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ledgerRes, groupsRes] = await Promise.all([
          getAccountLedger(id),
          listAccountGroups(),
        ]);

        const ledgerData = ledgerRes?.data || null;
        const groupsData = groupsRes?.data?.results || groupsRes?.data || [];

        setLedger(ledgerData);
        setGroups(Array.isArray(groupsData) ? groupsData : []);

        const initial = {
          ledger_name: pick(ledgerData, ["ledger_name"], ""),
          ledger_code: String(pick(ledgerData, ["ledger_code"], "")),
          alias: pick(ledgerData, ["alias"], ""),
          account_group: String(pick(ledgerData, ["account_group.id", "account_group"], "")),
          op_balance: String(pick(ledgerData, ["op_balance"], "")),
          status: Boolean(pick(ledgerData, ["status", "is_active"], true)),
        };

        setFormData(initial);
        setInitialData(initial);
      } catch (error) {
        console.error("Error fetching account ledger:", error);
        showToast({
          title: "Failed to load record",
          description: error?.response?.data?.detail || "Unable to load account ledger.",
          type: "error",
          duration: 6000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field) => (e) => {
    // We only block changing the standard fields for reserved ledgers,
    // but we still allow changing the opening balance if it's unlocked.
    if (isReserved && field !== "op_balance") return; 
    
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  const modifiedFields = useMemo(() => {
    if (!initialData) return [];
    return Object.keys(initialData).filter(
      (key) => String(formData[key]) !== String(initialData[key])
    );
  }, [formData, initialData]);

  const hasChanges = modifiedFields.length > 0;

  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!formData.ledger_name.trim()) {
      newErrors.ledger_name = "Ledger name is required.";
      missing.push(FIELD_LABELS.ledger_name);
    }

    if (!formData.account_group) {
      newErrors.account_group = "Please select an account group.";
      missing.push(FIELD_LABELS.account_group);
    }

    if (formData.ledger_code.trim() && !/^\d+$/.test(formData.ledger_code.trim())) {
      newErrors.ledger_code = "Ledger code must be a whole number.";
    }

    if (formData.op_balance !== "" && Number.isNaN(Number(formData.op_balance))) {
      newErrors.op_balance = "Please enter a valid opening balance.";
    }

    setFieldErrors(newErrors);

    return {
      errors: newErrors,
      missing,
      valid: Object.keys(newErrors).length === 0,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors, missing, valid } = validate();

    if (!valid) {
      const explicitMessages = Object.entries(errors)
        .filter(([key]) => !missing.includes(FIELD_LABELS[key]))
        .map(([, msg]) => msg);

      let description;
      if (explicitMessages.length > 0) description = explicitMessages.join("\n");
      else if (missing.length === 1) description = `${missing[0]} is required.`;
      else description = `Please fill: ${missing.join(", ")}.`;

      showToast({
        title: "Please fix the form",
        description,
        type: "warning",
        duration: 5000,
      });
      return;
    }

    if (!hasChanges) {
      showToast({
        title: "No changes to save",
        description: "Please modify at least one field before updating.",
        type: "info",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    // If it's reserved, we ONLY send the op_balance to the backend so it doesn't complain about locked fields
    const payload = isReserved ? {
      op_balance: formData.op_balance === "" ? 0 : Number(formData.op_balance),
    } : {
      ledger_name: formData.ledger_name.trim(),
      account_group: Number(formData.account_group),
      ledger_code: formData.ledger_code.trim() ? Number(formData.ledger_code.trim()) : null,
      alias: formData.alias.trim(),
      op_balance: formData.op_balance === "" ? 0 : Number(formData.op_balance),
      status: formData.status,
    };

    try {
      await updateAccountLedger(id, payload);
      showToast({
        title: "Changes saved",
        description: "Account ledger updated successfully.",
        type: "success",
        duration: 4000,
      });
      navigate(`/account-ledgers/${id}`);
    } catch (error) {
      console.error("Error updating account ledger:", error);
      const backendData = error?.response?.data;

      if (backendData && typeof backendData === "object" && !Array.isArray(backendData)) {
        const backendErrors = {};
        Object.entries(backendData).forEach(([field, message]) => {
          if (Array.isArray(message)) backendErrors[field] = message.join(", ");
          else if (typeof message === "string") backendErrors[field] = message;
        });

        setFieldErrors(backendErrors);

        const generalError = backendData.error || backendData.detail || backendData.non_field_errors?.[0];
        const fieldMessages = Object.values(backendErrors).filter(Boolean);
        const onlyOneFieldError = fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not save changes",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : Object.entries(backendErrors)
                  .map(([field, message]) => `${FIELD_LABELS[field] || field}: ${message}`)
                  .join(" | ")),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not save changes",
          description: "Unable to update account ledger. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isReserved) {
      showToast({
        title: "Cannot delete account ledger",
        description: "This is a reserved system ledger.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    const confirmed = window.confirm(
      `Delete "${formData.ledger_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteAccountLedger(id);
      showToast({
        title: "Record deleted",
        description: "Account ledger has been deleted.",
        type: "success",
        duration: 4000,
      });
      navigate("/account-ledgers");
    } catch (error) {
      console.error("Error deleting account ledger:", error);
      const backendData = error?.response?.data;
      showToast({
        title: "Could not delete record",
        description: backendData?.error || backendData?.detail || "This account ledger may have linked records.",
        type: "error",
        duration: 7000,
      });
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" w="100%">
          <Flex justify="center" align="center" minH="400px">
            <Box
              width="40px"
              height="40px"
              border="4px solid"
              borderColor="gray.200"
              borderTopColor={primaryMaroon}
              borderRadius="50%"
              animation="accountLedgerSpin 1s linear infinite"
            />
          </Flex>
          <style>{`@keyframes accountLedgerSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (!ledger) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={5}>
          <Box border="1px solid" borderColor={border} borderRadius="8px" p={8} textAlign="center">
            <Text fontSize="18px" fontWeight="700" color={dark} mb={2}>
              Account Ledger Not Found
            </Text>
            <Text fontSize="12px" color={muted} mb={5}>
              The requested account ledger could not be loaded.
            </Text>
            <Button
              bg={primaryMaroon}
              color="white"
              h="36px"
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/account-ledgers")}
              _hover={{ bg: "#8a1a3e" }}
            >
              Back to Account Ledgers
            </Button>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  const selectedGroupName =
    groups.find((g) => String(g.id) === String(formData.account_group))?.group_name || "—";

  const createdAt = pick(ledger, ["created_at"], null);
  const updatedAt = pick(ledger, ["updated_at"], null);

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />
      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          <HStack fontSize="11px" color={muted} mb={2} gap={2} flexWrap="wrap">
            <Text color={primaryMaroon} cursor="pointer" onClick={() => navigate("/admin/masters")}>
              Masters
            </Text>
            <Text>/</Text>
            <Text color={primaryMaroon} cursor="pointer" onClick={() => navigate("/account-ledgers")}>
              Account Ledgers
            </Text>
            <Text>/</Text>
            <Text color={primaryMaroon} cursor="pointer" onClick={() => navigate(`/account-ledgers/${id}`)}>
              {formData.ledger_name || "Ledger"}
            </Text>
            <Text>/</Text>
            <Text>Edit</Text>
          </HStack>

          <Box mb={4}>
            <Text fontSize="10px" fontWeight="700" color={red} mb={1}>
              ACCOUNT LEDGERS
            </Text>
            <Heading fontSize={{ base: "22px", md: "26px" }} fontWeight="800" color={dark} lineHeight="1.15">
              {isReserved ? "Manage Account Ledger" : "Edit Account Ledger"}
            </Heading>
            <Text color={muted} fontSize="11px" mt={1}>
              {isReserved 
                ? "System ledgers have locked details, but you can still set their initial opening balance."
                : "Update ledger information and opening balance."}
            </Text>
          </Box>

          {/* ✅ CUSTOM SYSTEM WARNING BANNER */}
          {isReserved && (
            <Box
              mb={4}
              p={4}
              borderRadius="6px"
              bg="#FFFBEB"
              border="1px solid #FDE68A"
            >
              <HStack align="start" gap={3}>
                <Icon
                  as={LuTriangleAlert}
                  boxSize={5}
                  color="#D97706"
                  mt={0.5}
                  flexShrink={0}
                />
                <Box>
                  <Text fontWeight="700" fontSize="13px" color="#92400E" mb={1}>
                    System Ledger (Locked Details)
                  </Text>
                  <Text fontSize="12px" color="#B45309">
                    The name, code, and group of this ledger are locked because it was auto-generated by the system. 
                    You can only set its opening balance once. After it saves a value greater than zero, it will become fully locked.
                  </Text>
                </Box>
              </HStack>
            </Box>
          )}

          <Box bg="white" border="1px solid" borderColor={border} borderRadius="8px" p={4} mb={4}>
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack gap={3} flex="1" minW="260px">
                <Circle size="52px" bg="rgba(174,32,80,0.08)" color={primaryMaroon} flexShrink={0}>
                  <Icon as={LuBookOpen} boxSize={6} />
                </Circle>
                <Box minW={0}>
                  <Heading fontSize="19px" fontWeight="700" color={dark}>
                    {formData.ledger_name || "—"}
                  </Heading>
                  <HStack gap={2} mt={1} color={muted} fontSize="11px" flexWrap="wrap">
                    <Text>{formData.ledger_code || "—"}</Text>
                    <Text>•</Text>
                    <Text>Group: {selectedGroupName}</Text>
                    <Badge
                      bg={formData.status ? "green.50" : "gray.100"}
                      color={formData.status ? "green.600" : "gray.600"}
                      fontSize="10px"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {formData.status ? "Active" : "Inactive"}
                    </Badge>
                    {isReserved && (
                      <Badge
                        bg="#FFF0F4"
                        color={red}
                        fontSize="10px"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        SYSTEM
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>

              <Box borderLeft={{ base: "none", md: `1px solid ${border}` }} pl={{ base: 0, md: 6 }}>
                <HStack gap={3}>
                  <Circle size="44px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
                    <Icon as={LuIndianRupee} boxSize={5} />
                  </Circle>
                  <Box>
                    <Text fontSize="18px" fontWeight="700" color={dark}>
                      {formatAmount(formData.op_balance)}
                    </Text>
                    <Text fontSize="11px" color={muted}>
                      Opening Balance
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Flex>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4} alignItems="start">
              <GridItem>
                <Box bg="white" borderRadius="8px" border="1px solid" borderColor={border} overflow="hidden">
                  <Box px={5} pt={4} pb={3}>
                    <Text fontSize="14px" fontWeight="800" color={dark}>
                      Account Ledger Details
                    </Text>
                    <Box mt={2} height="3px" width="55px" bg={primaryMaroon} borderRadius="full" />
                  </Box>
                  <Box borderBottom={`1px solid ${border}`} />

                  <Box px={5} py={5}>
                    <VStack align="stretch" gap={5}>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                        <GridItem>
                          <FieldLabel required>Ledger Name</FieldLabel>
                          <TextField
                            placeholder="Enter ledger name"
                            maxLength={100}
                            value={formData.ledger_name}
                            onChange={handleChange("ledger_name")}
                            error={fieldErrors.ledger_name}
                            isReadOnly={isReserved}
                          />
                        </GridItem>
                        <GridItem>
                          <FieldLabel>Ledger Code</FieldLabel>
                          <TextField
                            placeholder="Enter ledger code (optional)"
                            inputMode="numeric"
                            value={formData.ledger_code}
                            onChange={handleChange("ledger_code")}
                            error={fieldErrors.ledger_code}
                            isReadOnly={isReserved}
                          />
                        </GridItem>
                        <GridItem>
                          <FieldLabel>Alias</FieldLabel>
                          <TextField
                            placeholder="Enter alias (optional)"
                            value={formData.alias}
                            onChange={handleChange("alias")}
                            error={fieldErrors.alias}
                            isReadOnly={isReserved}
                          />
                        </GridItem>
                        <GridItem>
                          <FieldLabel required>Account Group</FieldLabel>
                          <AccountGroupSelect
                            value={formData.account_group}
                            onChange={handleChange("account_group")}
                            groups={groups}
                            error={fieldErrors.account_group}
                            isReadOnly={isReserved}
                          />
                        </GridItem>
                      </Grid>

                      <Box borderBottom="1px solid #EEF1F5" />

                      {/* OPENING BALANCE */}
                      <Box>
                        <Text fontSize="13px" fontWeight="800" color={dark} mb={3}>
                          Opening Balance
                        </Text>
                        <FieldLabel>Amount</FieldLabel>

                        <Flex
                          border="1px solid"
                          borderColor={fieldErrors.op_balance ? "red.500" : border}
                          borderRadius="6px"
                          overflow="hidden"
                          align="stretch"
                          height="40px"
                          bg={isOpeningBalanceLocked ? "#F7FAFC" : "white"}
                        >
                          <Flex align="center" px={3} bg={isOpeningBalanceLocked ? "#F7FAFC" : "white"}>
                            <Icon as={LuIndianRupee} boxSize={3.5} color="gray.400" />
                          </Flex>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.op_balance}
                            onChange={handleChange("op_balance")}
                            height="40px"
                            fontSize="12px"
                            border="none"
                            borderRadius="0"
                            bg="transparent"
                            _focus={{ boxShadow: "none" }}
                            flex="1"
                            isReadOnly={isOpeningBalanceLocked}
                            cursor={isOpeningBalanceLocked ? "not-allowed" : "text"}
                          />
                          {isOpeningBalanceLocked && (
                            <Flex align="center" pr={3}>
                              <Icon as={LuLock} boxSize={4} color={muted} />
                            </Flex>
                          )}
                        </Flex>
                        <Text fontSize="10px" color={isOpeningBalanceLocked ? "orange.500" : muted} mt={1} fontWeight={isOpeningBalanceLocked ? "600" : "normal"}>
                          {isOpeningBalanceLocked
                            ? "Opening balance is locked once set and cannot be modified."
                            : "Enter zero if the ledger has no opening balance."}
                        </Text>
                      </Box>

                      <Box borderBottom="1px solid #EEF1F5" />

                      <Box>
                        <FieldLabel>Status</FieldLabel>
                        <HStack gap={3}>
                          <Box
                            as="button"
                            type="button"
                            disabled={isReserved}
                            onClick={() => setFormData((prev) => ({ ...prev, status: !prev.status }))}
                            width="44px"
                            height="24px"
                            borderRadius="full"
                            bg={isReserved ? "gray.300" : formData.status ? primaryMaroon : "gray.300"}
                            position="relative"
                            transition="background 0.2s ease"
                            cursor={isReserved ? "not-allowed" : "pointer"}
                            aria-label="Toggle status"
                          >
                            <Box
                              position="absolute"
                              top="2px"
                              left={formData.status ? "22px" : "2px"}
                              width="20px"
                              height="20px"
                              borderRadius="full"
                              bg="white"
                              boxShadow="sm"
                              transition="left 0.2s ease"
                            />
                          </Box>
                          <Text fontSize="12px" fontWeight="600" color={dark}>
                            {formData.status ? "Active" : "Inactive"}
                          </Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              </GridItem>

              <GridItem>
                <VStack align="stretch" gap={3}>
                  <SidebarCard icon={LuClipboardList} title="Record Information">
                    <VStack align="stretch" gap={3} mt={2}>
                      <HStack gap={2} align="start">
                        <Icon as={LuCalendar} boxSize={4} color="gray.400" mt={0.5} />
                        <Box>
                          <Text fontSize="11px" color={muted}>Created</Text>
                          <Text fontSize="12px" fontWeight="600" color={dark}>{formatDate(createdAt)}</Text>
                        </Box>
                      </HStack>
                      <HStack gap={2} align="start">
                        <Icon as={LuUser} boxSize={4} color="gray.400" mt={0.5} />
                        <Box>
                          <Text fontSize="11px" color={muted}>Last updated</Text>
                          <Text fontSize="12px" fontWeight="600" color={dark}>{formatDate(updatedAt)}</Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </SidebarCard>

                  {hasChanges && (
                    <SidebarCard icon={LuTriangleAlert} iconColor="orange.500" title="Unsaved Changes">
                      <HStack gap={2} align="start" mt={1}>
                        <Icon as={LuClock} boxSize={4} color="orange.500" mt={0.5} />
                        <Box>
                          <Text fontSize="12px" fontWeight="700" color="orange.600">
                            {modifiedFields.length} field{modifiedFields.length > 1 ? "s" : ""} modified
                          </Text>
                          <Text fontSize="11px" color={muted}>
                            Please review your changes before saving.
                          </Text>
                        </Box>
                      </HStack>
                    </SidebarCard>
                  )}

                  <SidebarCard icon={LuTrash2} iconColor="red.500" title="Danger Zone">
                    <Box
                      as="button"
                      type="button"
                      onClick={handleDelete}
                      textAlign="left"
                      mt={1}
                      display="flex"
                      alignItems="start"
                      gap={2}
                      width="100%"
                      cursor={isReserved ? "not-allowed" : "pointer"}
                      opacity={isReserved ? 0.55 : 1}
                    >
                      <Icon as={LuTrash2} boxSize={4} color="red.500" mt={0.5} />
                      <Box>
                        <Text fontSize="12px" fontWeight="700" color="red.500">
                          Delete Account Ledger
                        </Text>
                        <Text fontSize="11px" color={muted}>
                          {isReserved ? "Reserved system ledgers cannot be deleted." : "This action cannot be undone."}
                        </Text>
                      </Box>
                    </Box>
                  </SidebarCard>
                </VStack>
              </GridItem>
            </Grid>

            <Flex justify="flex-end" gap={2} mt={4} pb={2}>
              <Button
                type="button"
                variant="outline"
                borderColor={primaryMaroon}
                color={primaryMaroon}
                bg="white"
                borderRadius="6px"
                height="36px"
                fontSize="11px"
                px={6}
                onClick={() => navigate(`/account-ledgers/${id}`)}
                disabled={isSubmitting}
                _hover={{ bg: "rgba(174,32,80,0.05)" }}
              >
                Cancel
              </Button>
              
              {/* SHOW BUTTON IF IT'S NOT RESERVED, OR IF THE OPENING BALANCE IS STILL UNLOCKED */}
              {(!isReserved || !isOpeningBalanceLocked) && (
                <Button
                  type="submit"
                  bg={primaryMaroon}
                  color="white"
                  borderRadius="6px"
                  height="36px"
                  fontSize="11px"
                  px={7}
                  loading={isSubmitting}
                  loadingText="Updating..."
                  _hover={{ bg: "#8a1a3e" }}
                >
                  {isReserved ? "Set Opening Balance" : "Update Account Ledger"}
                </Button>
              )}
            </Flex>
          </form>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default AccountLedgerEditPage;