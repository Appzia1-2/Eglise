// src/pages/AccountGroupEditPage.jsx

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
} from "@chakra-ui/react";

import {
  LuNetwork,
  LuFolderTree,
  LuCalendar,
  LuUser,
  LuTriangleAlert,
  LuClock,
  LuTrash2,
  LuClipboardList,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toaster } from "../components/ui/toaster";

import {
  getAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
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

const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};

/* =========================================================
   FIELD LABELS
========================================================= */

const FIELD_LABELS = {
  group_name: "Group Name",
  group_code: "Group Code",
  account_code: "Account Code",
  alias: "Alias",
  under_group: "Under Group",
  status: "Status",
};

/* =========================================================
   HELPERS
========================================================= */

const pick = (obj, keys, fallback = "") => {
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

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
   TEXT FIELD — no inline error text
========================================================= */

const TextField = ({ error, ...props }) => (
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
);

/* =========================================================
   ACCOUNT GROUP SELECT — no inline error text
========================================================= */

const AccountGroupSelect = ({ value, onChange, groups, error, excludeId }) => {
  const options = groups.filter(
    (g) => String(g.id) !== String(excludeId)
  );

  return (
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
        <option value="">Select parent group</option>

        {options.map((group) => (
          <option key={group.id} value={group.id}>
            {group.group_name}
          </option>
        ))}
      </Box>
    </Box>
  );
};

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

const AccountGroupEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);

  const [formData, setFormData] = useState({
    group_name: "",
    account_code: "",
    alias: "",
    under_group: "",
    status: true,
  });

  const [initialData, setInitialData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isReserved = Boolean(group?.reserved);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [groupRes, groupsRes] = await Promise.all([
          getAccountGroup(id),
          listAccountGroups(),
        ]);

        const groupData = groupRes?.data ?? groupRes;

        const groupsData =
          groupsRes?.data?.results || groupsRes?.data || [];

        setGroup(groupData);
        setGroups(Array.isArray(groupsData) ? groupsData : []);

        const parentId = pick(
          groupData,
          ["under_group.id", "under_group"],
          ""
        );

        const initial = {
          group_name: pick(groupData, ["group_name"], ""),
          account_code: String(
            pick(groupData, ["account_code"], "")
          ),
          alias: pick(groupData, ["alias"], ""),
          under_group: parentId ? String(parentId) : "",
          status: Boolean(
            pick(groupData, ["status"], true)
          ),
        };

        setFormData(initial);
        setInitialData(initial);
      } catch (error) {
        console.error("Error loading account group:", error);

        showToast({
          title: "Failed to load record",
          description:
            error?.response?.data?.detail ||
            "Unable to load account group. Please try again.",
          type: "error",
          duration: 6000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));

    setFieldErrors((prev) =>
      prev[field] ? { ...prev, [field]: "" } : prev
    );
  };

  /* =======================================================
     MODIFIED FIELDS
  ======================================================= */

  const modifiedFields = useMemo(() => {
    if (!initialData) return [];

    return Object.keys(initialData).filter(
      (key) => String(formData[key]) !== String(initialData[key])
    );
  }, [formData, initialData]);

  const hasChanges = modifiedFields.length > 0;

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!formData.group_name.trim()) {
      newErrors.group_name = "Group name is required.";
      missing.push(FIELD_LABELS.group_name);
    }

    if (
      formData.account_code.trim() &&
      !/^\d+$/.test(formData.account_code.trim())
    ) {
      newErrors.account_code =
        "Account code must be a whole number.";
    }

    setFieldErrors(newErrors);

    return {
      errors: newErrors,
      missing,
      valid: Object.keys(newErrors).length === 0,
    };
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { errors, missing, valid } = validate();

    if (!valid) {
      const explicitMessages = Object.entries(errors)
        .filter(([key]) => !missing.includes(FIELD_LABELS[key]))
        .map(([, msg]) => msg);

      let description;

      if (explicitMessages.length > 0) {
        description = explicitMessages.join("\n");
      } else if (missing.length === 1) {
        description = `${missing[0]} is required.`;
      } else {
        description = `Please fill: ${missing.join(", ")}.`;
      }

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
        description:
          "Please modify at least one field before updating.",
        type: "info",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const payload = {
      group_name: formData.group_name.trim(),
      status: formData.status,
    };

    if (formData.account_code.trim()) {
      payload.account_code = Number(formData.account_code.trim());
    } else {
      payload.account_code = null;
    }

    if (formData.alias.trim()) {
      payload.alias = formData.alias.trim();
    } else {
      payload.alias = "";
    }

    if (formData.under_group) {
      payload.under_group = Number(formData.under_group);
    } else {
      payload.under_group = null;
    }

    try {
      await updateAccountGroup(id, payload);

      showToast({
        title: "Changes saved",
        description:
          "The account group was updated successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/account-groups");
    } catch (error) {
      console.error("Error updating account group:", error);

      const backendData = error?.response?.data;

      if (
        backendData &&
        typeof backendData === "object" &&
        !Array.isArray(backendData)
      ) {
        const backendErrors = {};

        Object.entries(backendData).forEach(([field, message]) => {
          if (Array.isArray(message)) {
            backendErrors[field] = message.join(", ");
          } else if (typeof message === "string") {
            backendErrors[field] = message;
          }
        });

        setFieldErrors(backendErrors);

        const generalError =
          backendData.error ||
          backendData.detail ||
          backendData.non_field_errors?.[0];

        const fieldMessages = Object.values(backendErrors).filter(Boolean);
        const onlyOneFieldError =
          fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not save changes",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : Object.entries(backendErrors)
                  .map(
                    ([field, message]) =>
                      `${FIELD_LABELS[field] || field}: ${message}`
                  )
                  .join(" | ")),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not save changes",
          description:
            "Unable to update account group. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async () => {
    if (isReserved) {
      showToast({
        title: "Cannot delete account group",
        description: "This is a reserved system group.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    const confirmed = window.confirm(
      `Delete "${formData.group_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteAccountGroup(id);

      showToast({
        title: "Record deleted",
        description: "Account group has been deleted.",
        type: "success",
        duration: 4000,
      });

      navigate("/account-groups");
    } catch (error) {
      console.error("Error deleting account group:", error);

      const backendData = error?.response?.data;

      showToast({
        title: "Could not delete record",
        description:
          backendData?.error ||
          backendData?.detail ||
          "This account group may have linked records.",
        type: "error",
        duration: 7000,
      });
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

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
              animation="accountGroupSpin 1s linear infinite"
            />
          </Flex>

          <style>
            {`
              @keyframes accountGroupSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </Box>

        <Footer />
      </Box>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!group) {
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
              Account Group Not Found
            </Text>

            <Text fontSize="12px" color={muted} mb={5}>
              The requested account group could not be loaded.
            </Text>

            <Button
              bg={primaryMaroon}
              color="white"
              h="36px"
              fontSize="12px"
              borderRadius="6px"
              onClick={() => navigate("/account-groups")}
              _hover={{ bg: "#8a1a3e" }}
            >
              Back to Account Groups
            </Button>
          </Box>
        </Box>

        <Footer />
      </Box>
    );
  }

  /* =======================================================
     DERIVED
  ======================================================= */

  const selectedParentName =
    groups.find(
      (g) => String(g.id) === String(formData.under_group)
    )?.group_name || "—";

  const createdAt = pick(group, ["created_at"], null);
  const updatedAt = pick(group, ["updated_at"], null);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}

          <HStack
            gap={2}
            fontSize="11px"
            color={muted}
            mb={2}
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
              onClick={() => navigate("/account-groups")}
            >
              Account Groups
            </Text>
            <Text>/</Text>
            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() => navigate(`/account-groups/${id}`)}
            >
              {formData.group_name || "Group"}
            </Text>
            <Text>/</Text>
            <Text>Edit</Text>
          </HStack>

          {/* PAGE HEADER */}

          <Box mb={4}>
            <Text fontSize="10px" fontWeight="700" color={red} mb={1}>
              ACCOUNT GROUPS
            </Text>

            <Heading
              fontSize={{ base: "22px", md: "26px" }}
              fontWeight="800"
              color={dark}
              lineHeight="1.15"
            >
              Edit Account Group
            </Heading>

            <Text color={muted} fontSize="11px" mt={1}>
              Update account group information and hierarchy.
            </Text>
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
                      Account Group Details
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
                      <Box>
                        <Text
                          fontSize="13px"
                          fontWeight="800"
                          color={dark}
                          mb={3}
                        >
                          Group Information
                        </Text>

                        <Grid
                          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                          gap={4}
                        >
                          <GridItem>
                            <FieldLabel required>
                              Group Name
                            </FieldLabel>

                            <TextField
                              placeholder="Enter group name"
                              value={formData.group_name}
                              onChange={handleChange("group_name")}
                              error={fieldErrors.group_name}
                            />
                          </GridItem>

                          <GridItem>
                            <FieldLabel>Account Code</FieldLabel>

                            <TextField
                              placeholder="Enter account code (optional)"
                              inputMode="numeric"
                              value={formData.account_code}
                              onChange={handleChange("account_code")}
                              error={fieldErrors.account_code}
                            />
                          </GridItem>

                          <GridItem>
                            <FieldLabel>Alias</FieldLabel>

                            <TextField
                              placeholder="Enter alias (optional)"
                              value={formData.alias}
                              onChange={handleChange("alias")}
                              error={fieldErrors.alias}
                            />
                          </GridItem>

                          <GridItem>
                            <FieldLabel>Under Group</FieldLabel>

                            <AccountGroupSelect
                              value={formData.under_group}
                              onChange={handleChange("under_group")}
                              groups={groups}
                              error={fieldErrors.under_group}
                              excludeId={id}
                            />
                          </GridItem>
                        </Grid>
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

                      <Box borderBottom="1px solid #EEF1F5" />

                      {/* HIERARCHY INFO */}

                      <Box>
                        <HStack gap={2} mb={3} align="center">
                          <Icon
                            as={LuFolderTree}
                            boxSize={4}
                            color={primaryMaroon}
                          />

                          <Text
                            fontSize="13px"
                            fontWeight="800"
                            color={dark}
                          >
                            Group Hierarchy
                          </Text>
                        </HStack>

                        <Box
                          bg="#FAFBFC"
                          border="1px solid #EEF1F5"
                          borderRadius="6px"
                          px={4}
                          py={3}
                        >
                          <Text
                            fontSize="11px"
                            color={muted}
                            lineHeight="1.6"
                          >
                            Current parent: <b>{selectedParentName}</b>.
                            Select a different parent to move this group,
                            or leave it empty to make it a top-level group.
                          </Text>
                        </Box>
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
                          <Text
                            fontSize="12px"
                            fontWeight="600"
                            color={dark}
                          >
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
                          <Text
                            fontSize="12px"
                            fontWeight="600"
                            color={dark}
                          >
                            {formatDate(updatedAt)}
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </SidebarCard>

                  {/* UNSAVED CHANGES */}

                  {hasChanges && (
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
                        <Text
                          fontSize="12px"
                          fontWeight="700"
                          color="red.500"
                        >
                          Delete Account Group
                        </Text>
                        <Text fontSize="11px" color={muted}>
                          {isReserved
                            ? "Reserved system groups cannot be deleted."
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
                onClick={() => navigate("/account-groups")}
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
                Update Account Group
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default AccountGroupEditPage;