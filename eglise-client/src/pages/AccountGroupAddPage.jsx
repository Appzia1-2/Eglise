// src/admin/pages/AccountGroupAddPage.jsx

import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

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
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toaster } from "../components/ui/toaster";

import {
  createAccountGroup,
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
  alias: "Alias",
  under_group: "Under Group",
};

/* =========================================================
   FIELD LABEL
========================================================= */

const FieldLabel = ({ children, required }) => (
  <Text
    fontSize="12px"
    fontWeight="700"
    color={dark}
    mb={1.5}
  >
    {children}

    {required && (
      <Text
        as="span"
        color="red.500"
        ml={1}
      >
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

const AccountGroupSelect = ({
  value,
  onChange,
  groups,
  error,
}) => (
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
        border: `1px solid ${
          error ? "#e53e3e" : border
        }`,
        fontSize: "12px",
        height: "40px",
        background: "white",
        outline: "none",
        color: value ? dark : "#a0aec0",
        cursor: "pointer",
      }}
    >
      <option value="">
        Select parent group
      </option>

      {groups.map((group) => (
        <option
          key={group.id}
          value={group.id}
        >
          {group.group_name}
        </option>
      ))}
    </Box>
  </Box>
);

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountGroupAddPage = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);

  const [isLoadingGroups, setIsLoadingGroups] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formData, setFormData] = useState({
    group_name: "",
    group_code: "",
    alias: "",
    under_group: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  /* =======================================================
     LOAD ACCOUNT GROUPS
  ======================================================= */

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoadingGroups(true);

      try {
        const response = await listAccountGroups();

        const data =
          response?.data?.results ||
          response?.data ||
          [];

        setGroups(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Error fetching account groups:",
          error
        );

        showToast({
          title: "Failed to load data",
          description:
            error?.response?.data?.detail ||
            "Unable to load account groups. Please refresh and try again.",
          type: "error",
          duration: 6000,
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  /* =======================================================
     HANDLE CHANGE
  ======================================================= */

  const handleChange =
    (field) =>
    (event) => {
      const value = event.target.value;

      setFormData((previous) => ({
        ...previous,
        [field]: value,
      }));

      setFieldErrors((previous) =>
        previous[field]
          ? { ...previous, [field]: "" }
          : previous
      );
    };

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!formData.group_name.trim()) {
      newErrors.group_name =
        "Group name is required.";
      missing.push(FIELD_LABELS.group_name);
    }

    setFieldErrors(newErrors);

    return {
      errors: newErrors,
      missing,
      valid:
        Object.keys(newErrors).length === 0,
    };
  };

  /* =======================================================
     HANDLE SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { errors, missing, valid } = validate();

    if (!valid) {
      showToast({
        title: "Please fix the form",
        description:
          missing.length === 1
            ? `${missing[0]} is required.`
            : `Please fill: ${missing.join(", ")}.`,
        type: "warning",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const payload = {
      group_name:
        formData.group_name.trim(),

      status: true,
    };

    if (formData.group_code.trim()) {
      payload.group_code =
        formData.group_code.trim();
    }

    if (formData.alias.trim()) {
      payload.alias =
        formData.alias.trim();
    }

    if (formData.under_group) {
      payload.under_group = Number(
        formData.under_group
      );
    }

    try {
      await createAccountGroup(payload);

      showToast({
        title: "Account group created",
        description:
          "The account group was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/account-groups");
    } catch (error) {
      console.error(
        "Error creating account group:",
        error
      );

      const backendData =
        error?.response?.data;

      if (
        backendData &&
        typeof backendData === "object" &&
        !Array.isArray(backendData)
      ) {
        const backendErrors = {};

        Object.entries(
          backendData
        ).forEach(([field, message]) => {
          if (Array.isArray(message)) {
            backendErrors[field] =
              message.join(", ");
          } else if (
            typeof message === "string"
          ) {
            backendErrors[field] =
              message;
          }
        });

        setFieldErrors(backendErrors);

        const generalError =
          backendData.error ||
          backendData.detail ||
          backendData.non_field_errors?.[0];

        const fieldMessages =
          Object.values(backendErrors).filter(
            Boolean
          );

        const onlyOneFieldError =
          fieldMessages.length === 1 &&
          !generalError;

        showToast({
          title:
            "Could not create account group",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : Object.entries(backendErrors)
                  .map(
                    ([field, message]) =>
                      `${
                        FIELD_LABELS[field] || field
                      }: ${message}`
                  )
                  .join(" | ")),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title:
            "Could not create account group",
          description:
            "Unable to create account group. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box
        flex="1"
        w="100%"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
      >
        {/* BREADCRUMB */}

        <HStack
          gap={2}
          fontSize="11px"
          color={muted}
          mb={2}
        >
          <Text
            color={primaryMaroon}
            cursor="pointer"
            onClick={() =>
              navigate("/admin/masters")
            }
          >
            Masters
          </Text>

          <Text>/</Text>

          <Text
            color={primaryMaroon}
            cursor="pointer"
            onClick={() =>
              navigate("/account-groups")
            }
          >
            Account Groups
          </Text>

          <Text>/</Text>

          <Text>Add Account Group</Text>
        </HStack>

        {/* PAGE HEADER */}

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
          mb={4}
        >
          <Box>
            <Text
              fontSize="10px"
              fontWeight="700"
              color={red}
              textTransform="uppercase"
              letterSpacing="0.08em"
              mb={1}
            >
              ACCOUNT GROUPS
            </Text>

            <Heading
              fontSize={{
                base: "22px",
                md: "26px",
              }}
              fontWeight="800"
              color={dark}
              lineHeight="1.15"
            >
              Add Account Group
            </Heading>

            <Text
              color={muted}
              fontSize="11px"
              mt={1}
            >
              Create an account group and
              define its hierarchy.
            </Text>
          </Box>
        </Flex>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <Box
            bg="white"
            border={`1px solid ${border}`}
            borderRadius="8px"
            overflow="hidden"
            width="100%"
          >
            {/* SECTION HEADER */}

            <Box
              px={{ base: 4, md: 5 }}
              pt={4}
              pb={3}
            >
              <Text
                fontSize="14px"
                fontWeight="800"
                color={dark}
              >
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

            <Box
              borderBottom={`1px solid ${border}`}
            />

            {/* GROUP INFORMATION */}

            <Box
              px={{ base: 4, md: 5 }}
              py={5}
            >
              <VStack
                align="stretch"
                gap={5}
              >
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
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap={4}
                  >
                    {/* GROUP NAME */}

                    <GridItem>
                      <FieldLabel required>
                        Group Name
                      </FieldLabel>

                      <TextField
                        placeholder="Enter group name"
                        value={formData.group_name}
                        onChange={handleChange(
                          "group_name"
                        )}
                        error={
                          fieldErrors.group_name
                        }
                      />
                    </GridItem>

                    {/* GROUP CODE */}

                    <GridItem>
                      <FieldLabel>
                        Group Code
                      </FieldLabel>

                      <TextField
                        placeholder="Enter group code (optional)"
                        value={formData.group_code}
                        onChange={handleChange(
                          "group_code"
                        )}
                        error={
                          fieldErrors.group_code
                        }
                      />
                    </GridItem>

                    {/* ALIAS */}

                    <GridItem>
                      <FieldLabel>
                        Alias
                      </FieldLabel>

                      <TextField
                        placeholder="Enter alias (optional)"
                        value={formData.alias}
                        onChange={handleChange(
                          "alias"
                        )}
                        error={fieldErrors.alias}
                      />
                    </GridItem>

                    {/* UNDER GROUP */}

                    <GridItem>
                      <FieldLabel>
                        Under Group
                      </FieldLabel>

                      <AccountGroupSelect
                        value={formData.under_group}
                        onChange={handleChange(
                          "under_group"
                        )}
                        groups={groups}
                        error={
                          fieldErrors.under_group
                        }
                      />

                      {isLoadingGroups && (
                        <Text
                          fontSize="10px"
                          color={muted}
                          mt={1}
                        >
                          Loading account groups...
                        </Text>
                      )}
                    </GridItem>
                  </Grid>
                </Box>

                <Box borderBottom="1px solid #EEF1F5" />

                {/* GROUP HIERARCHY */}

                <Box>
                  <HStack
                    gap={2}
                    mb={3}
                    align="center"
                  >
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
                      Select an existing account
                      group under which this group
                      should be created. Leave it
                      empty to create a top-level
                      account group.
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </Box>
          </Box>

          {/* BUTTONS */}

          <Flex justify="flex-end" gap={2} mt={4}>
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
              onClick={() =>
                navigate("/account-groups")
              }
              disabled={isSubmitting}
              _hover={{
                bg: "rgba(174,32,80,0.05)",
              }}
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
              loadingText="Saving..."
              _hover={{ bg: "#8a1a3e" }}
            >
              Save Account Group
            </Button>
          </Flex>
        </form>
      </Box>

      <Footer />
    </Box>
  );
};

export default AccountGroupAddPage;