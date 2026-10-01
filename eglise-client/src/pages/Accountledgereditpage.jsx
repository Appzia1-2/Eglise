// src/admin/pages/Accountledgereditpage.jsx

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
   HELPERS
========================================================= */

const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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

/* =========================================================
   FIELD LABEL
========================================================= */

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

/* =========================================================
   TEXT FIELD
========================================================= */

const TextField = ({ error, ...props }) => (
  <>
    <Input
      height="40px"
      fontSize="12px"
      borderColor={error ? "red.500" : border}
      borderRadius="6px"
      _focus={{
        borderColor: primaryMaroon,
        boxShadow: `0 0 0 1px ${primaryMaroon}`,
      }}
      {...props}
    />

    {error && (
      <Text fontSize="10px" color="red.500" mt={1}>
        {error}
      </Text>
    )}
  </>
);

/* =========================================================
   ACCOUNT GROUP SELECT
========================================================= */

const AccountGroupSelect = ({ value, onChange, groups, error }) => (
  <>
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
        style={{
          width: "100%",
          padding: "0 12px 0 36px",
          borderRadius: "6px",
          border: `1px solid ${error ? "#e53e3e" : border}`,
          fontSize: "12px",
          height: "40px",
          background: "white",
          outline: "none",
          color: value ? dark : "#a0aec0",
          cursor: "pointer",
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

    {error && (
      <Text fontSize="10px" color="red.500" mt={1}>
        {error}
      </Text>
    )}
  </>
);

/* =========================================================
   SIDEBAR CARD
========================================================= */

const SidebarCard = ({ icon, iconColor, title, children }) => (
  <Box
    bg="white"
    borderRadius="8px"
    border="1px solid"
    borderColor={border}
    p={4}
  >
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

  const [errors, setErrors] = useState({});

  const isReserved = Boolean(ledger?.reserved);

  /* =========================================================
     LOAD DATA
  ========================================================= */

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

          account_group: String(
            pick(ledgerData, ["account_group.id", "account_group"], "")
          ),

          op_balance: String(pick(ledgerData, ["op_balance"], "")),

          status: Boolean(pick(ledgerData, ["status", "is_active"], true)),
        };

        setFormData(initial);

        setInitialData(initial);
      } catch (error) {
        console.error("Error fetching account ledger:", error);

        toaster.create({
          title: "Error",
          description: "Failed to load account ledger.",
          type: "error",
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  /* =========================================================
     HANDLE CHANGE
  ========================================================= */

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  /* =========================================================
     MODIFIED FIELDS
  ========================================================= */

  const modifiedFields = useMemo(() => {
    if (!initialData) {
      return [];
    }

    return Object.keys(initialData).filter(
      (key) => String(formData[key]) !== String(initialData[key])
    );
  }, [formData, initialData]);

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validate = () => {
    const newErrors = {};

    if (!formData.ledger_name.trim()) {
      newErrors.ledger_name = "Ledger name is required.";
    }

    if (!formData.account_group) {
      newErrors.account_group = "Please select an account group.";
    }

    /* ledger_code is an integer field in the model */

    if (
      formData.ledger_code.trim() &&
      !/^\d+$/.test(formData.ledger_code.trim())
    ) {
      newErrors.ledger_code = "Ledger code must be a whole number.";
    }

    if (
      formData.op_balance !== "" &&
      Number.isNaN(Number(formData.op_balance))
    ) {
      newErrors.op_balance = "Please enter a valid opening balance.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ledger_name: formData.ledger_name.trim(),

      account_group: Number(formData.account_group),

      ledger_code: formData.ledger_code.trim()
        ? Number(formData.ledger_code.trim())
        : null,

      alias: formData.alias.trim(),

      op_balance: formData.op_balance === "" ? 0 : Number(formData.op_balance),

      status: formData.status,
    };

    try {
      await updateAccountLedger(id, payload);

      toaster.create({
        title: "Success",
        description: "Account ledger updated successfully.",
        type: "success",
        duration: 3000,
      });

      navigate(`/account-ledgers/${id}`);
    } catch (error) {
      console.error("Error updating account ledger:", error);

      const backendData = error?.response?.data;

      const backendErrors = {};

      if (backendData && typeof backendData === "object") {
        Object.entries(backendData).forEach(([field, message]) => {
          if (Array.isArray(message)) {
            backendErrors[field] = message.join(", ");
          } else if (typeof message === "string") {
            backendErrors[field] = message;
          }
        });
      }

      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }

      let description = "Failed to update account ledger.";

      if (backendData?.error) {
        description = backendData.error;
      } else if (backendData?.detail) {
        description = backendData.detail;
      } else if (Object.keys(backendErrors).length > 0) {
        description = Object.entries(backendErrors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(" | ");
      }

      toaster.create({
        title: "Unable to update account ledger",
        description,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async () => {
    if (isReserved) {
      toaster.create({
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

    if (!confirmed) {
      return;
    }

    try {
      await deleteAccountLedger(id);

      toaster.create({
        title: "Deleted",
        description: "Account ledger has been deleted.",
        type: "success",
        duration: 3000,
      });

      navigate("/account-ledgers");
    } catch (error) {
      console.error("Error deleting account ledger:", error);

      const backendData = error?.response?.data;

      toaster.create({
        title: "Unable to delete account ledger",
        description:
          backendData?.error ||
          backendData?.detail ||
          "This account ledger may have linked records.",
        type: "error",
        duration: 5000,
      });
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

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

          <style>
            {`
              @keyframes accountLedgerSpin {
                0% {
                  transform: rotate(0deg);
                }

                100% {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </Box>

        <Footer />
      </Box>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!ledger) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />

        <Box flex="1" w="100%" px={{ base: 3, md: 4 }} py={5}>
          <Box
            border="1px solid"
            borderColor={border}
            borderRadius="8px"
            p={8}
            textAlign="center"
          >
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

  /* =========================================================
     DISPLAY DATA
  ========================================================= */

  const selectedGroupName =
    groups.find((g) => String(g.id) === String(formData.account_group))
      ?.group_name || "—";

  const createdAt = pick(ledger, ["created_at"], null);

  const updatedAt = pick(ledger, ["updated_at"], null);

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      {/* NAVBAR */}

      <Navbar />

      {/* MAIN */}

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}

          <HStack
            fontSize="11px"
            color={muted}
            mb={2}
            gap={2}
            flexWrap="wrap"
          >
            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() => navigate("/admin/masters")}
            >
              Masters
            </Text>

            <Text>/</Text>

            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() => navigate("/account-ledgers")}
            >
              Account Ledgers
            </Text>

            <Text>/</Text>

            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() => navigate(`/account-ledgers/${id}`)}
            >
              {formData.ledger_name || "Ledger"}
            </Text>

            <Text>/</Text>

            <Text>Edit</Text>
          </HStack>

          {/* PAGE HEADER */}

          <Box mb={4}>
            <Text fontSize="10px" fontWeight="700" color={red} mb={1}>
              ACCOUNT LEDGERS
            </Text>

            <Heading
              fontSize={{ base: "22px", md: "26px" }}
              fontWeight="800"
              color={dark}
              lineHeight="1.15"
            >
              Edit Account Ledger
            </Heading>

            <Text color={muted} fontSize="11px" mt={1}>
              Update ledger information and opening balance.
            </Text>
          </Box>

          {/* HERO INFO BAR */}

          <Box
            bg="white"
            border="1px solid"
            borderColor={border}
            borderRadius="8px"
            p={4}
            mb={4}
          >
            <Flex align="center" gap={6} flexWrap="wrap">
              {/* LEDGER INFO */}

              <HStack gap={3} flex="1" minW="260px">
                <Circle
                  size="52px"
                  bg="rgba(174,32,80,0.08)"
                  color={primaryMaroon}
                  flexShrink={0}
                >
                  <Icon as={LuBookOpen} boxSize={6} />
                </Circle>

                <Box minW={0}>
                  <Heading fontSize="19px" fontWeight="700" color={dark}>
                    {formData.ledger_name || "—"}
                  </Heading>

                  <HStack
                    gap={2}
                    mt={1}
                    color={muted}
                    fontSize="11px"
                    flexWrap="wrap"
                  >
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
                  </HStack>
                </Box>
              </HStack>

              {/* OPENING BALANCE */}

              <Box
                borderLeft={{ base: "none", md: `1px solid ${border}` }}
                pl={{ base: 0, md: 6 }}
              >
                <HStack gap={3}>
                  <Circle
                    size="44px"
                    bg="rgba(174,32,80,0.08)"
                    color={primaryMaroon}
                  >
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

          {/* FORM */}

          <form onSubmit={handleSubmit}>
            <Grid
              templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
              gap={4}
              alignItems="start"
            >
              {/* LEFT FORM */}

              <GridItem>
                <Box
                  bg="white"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={border}
                  overflow="hidden"
                >
                  <Box px={5} pt={4} pb={3}>
                    <Text fontSize="14px" fontWeight="800" color={dark}>
                      Account Ledger Details
                    </Text>

                    <Box
                      mt={2}
                      height="3px"
                      width="55px"
                      bg={primaryMaroon}
                      borderRadius="full"
                    />
                  </Box>

                  <Box borderBottom={`1px solid ${border}`} />

                  <Box px={5} py={5}>
                    <VStack align="stretch" gap={5}>
                      {/* LEDGER INFORMATION */}

                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={4}
                      >
                        {/* LEDGER NAME */}

                        <GridItem>
                          <FieldLabel required>Ledger Name</FieldLabel>

                          <TextField
                            placeholder="Enter ledger name"
                            maxLength={100}
                            value={formData.ledger_name}
                            onChange={handleChange("ledger_name")}
                            error={errors.ledger_name}
                          />
                        </GridItem>

                        {/* LEDGER CODE */}

                        <GridItem>
                          <FieldLabel>Ledger Code</FieldLabel>

                          <TextField
                            placeholder="Enter ledger code (optional)"
                            inputMode="numeric"
                            value={formData.ledger_code}
                            onChange={handleChange("ledger_code")}
                            error={errors.ledger_code}
                          />
                        </GridItem>

                        {/* ALIAS */}

                        <GridItem>
                          <FieldLabel>Alias</FieldLabel>

                          <TextField
                            placeholder="Enter alias (optional)"
                            value={formData.alias}
                            onChange={handleChange("alias")}
                            error={errors.alias}
                          />
                        </GridItem>

                        {/* ACCOUNT GROUP */}

                        <GridItem>
                          <FieldLabel required>Account Group</FieldLabel>

                          <AccountGroupSelect
                            value={formData.account_group}
                            onChange={handleChange("account_group")}
                            groups={groups}
                            error={errors.account_group}
                          />
                        </GridItem>
                      </Grid>

                      <Box borderBottom="1px solid #EEF1F5" />

                      {/* OPENING BALANCE */}

                      <Box>
                        <Text
                          fontSize="13px"
                          fontWeight="800"
                          color={dark}
                          mb={3}
                        >
                          Opening Balance
                        </Text>

                        <FieldLabel>Amount</FieldLabel>

                        <Flex
                          border="1px solid"
                          borderColor={errors.op_balance ? "red.500" : border}
                          borderRadius="6px"
                          overflow="hidden"
                          align="stretch"
                          height="40px"
                        >
                          <Flex align="center" px={3} bg="white">
                            <Icon
                              as={LuIndianRupee}
                              boxSize={3.5}
                              color="gray.400"
                            />
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
                            _focus={{ boxShadow: "none" }}
                            flex="1"
                          />
                        </Flex>

                        {errors.op_balance && (
                          <Text fontSize="10px" color="red.500" mt={1}>
                            {errors.op_balance}
                          </Text>
                        )}

                        <Text fontSize="10px" color={muted} mt={1}>
                          Enter zero if the ledger has no opening balance.
                        </Text>
                      </Box>

                      <Box borderBottom="1px solid #EEF1F5" />

                      {/* STATUS */}

                      <Box>
                        <FieldLabel>Status</FieldLabel>

                        <HStack gap={3}>
                          <Box
                            as="button"
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                status: !prev.status,
                              }))
                            }
                            width="44px"
                            height="24px"
                            borderRadius="full"
                            bg={formData.status ? primaryMaroon : "gray.300"}
                            position="relative"
                            transition="background 0.2s ease"
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

              {/* RIGHT SIDEBAR */}

              <GridItem>
                <VStack align="stretch" gap={3}>
                  {/* RECORD INFORMATION */}

                  <SidebarCard
                    icon={LuClipboardList}
                    title="Record Information"
                  >
                    <VStack align="stretch" gap={3} mt={2}>
                      <HStack gap={2} align="start">
                        <Icon
                          as={LuCalendar}
                          boxSize={4}
                          color="gray.400"
                          mt={0.5}
                        />

                        <Box>
                          <Text fontSize="11px" color={muted}>
                            Created
                          </Text>

                          <Text fontSize="12px" fontWeight="600" color={dark}>
                            {formatDate(createdAt)}
                          </Text>
                        </Box>
                      </HStack>

                      <HStack gap={2} align="start">
                        <Icon
                          as={LuUser}
                          boxSize={4}
                          color="gray.400"
                          mt={0.5}
                        />

                        <Box>
                          <Text fontSize="11px" color={muted}>
                            Last updated
                          </Text>

                          <Text fontSize="12px" fontWeight="600" color={dark}>
                            {formatDate(updatedAt)}
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </SidebarCard>

                  {/* UNSAVED CHANGES */}

                  {modifiedFields.length > 0 && (
                    <SidebarCard
                      icon={LuTriangleAlert}
                      iconColor="orange.500"
                      title="Unsaved Changes"
                    >
                      <HStack gap={2} align="start" mt={1}>
                        <Icon
                          as={LuClock}
                          boxSize={4}
                          color="orange.500"
                          mt={0.5}
                        />

                        <Box>
                          <Text
                            fontSize="12px"
                            fontWeight="700"
                            color="orange.600"
                          >
                            {modifiedFields.length} field
                            {modifiedFields.length > 1 ? "s" : ""} modified
                          </Text>

                          <Text fontSize="11px" color={muted}>
                            Please review your changes before saving.
                          </Text>
                        </Box>
                      </HStack>
                    </SidebarCard>
                  )}

                  {/* DANGER ZONE */}

                  <SidebarCard
                    icon={LuTrash2}
                    iconColor="red.500"
                    title="Danger Zone"
                  >
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
                      <Icon
                        as={LuTrash2}
                        boxSize={4}
                        color="red.500"
                        mt={0.5}
                      />

                      <Box>
                        <Text fontSize="12px" fontWeight="700" color="red.500">
                          Delete Account Ledger
                        </Text>

                        <Text fontSize="11px" color={muted}>
                          {isReserved
                            ? "Reserved system ledgers cannot be deleted."
                            : "This action cannot be undone."}
                        </Text>
                      </Box>
                    </Box>
                  </SidebarCard>
                </VStack>
              </GridItem>
            </Grid>

            {/* ACTION BUTTONS */}

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
                Update Account Ledger
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>

      {/* FOOTER */}

      <Footer />
    </Box>
  );
};

export default AccountLedgerEditPage;