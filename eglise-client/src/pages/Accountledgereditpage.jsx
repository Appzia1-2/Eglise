// src/admin/pages/AccountGroupEditPage.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

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
  LuFolderTree,
  LuCalendar,
  LuBookOpen,
  LuClipboardList,
  LuUser,
  LuTriangleAlert,
  LuClock,
  LuTrash2,
  LuBookMarked,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
  listAccountGroups,
} from "../api/registryServices";

import { toaster } from "../components/ui/toaster";

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

const pick = (
  obj,
  keys,
  fallback = "—"
) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce(
        (acc, k) =>
          acc == null
            ? acc
            : acc[k],
        obj
      );

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================================
   FIELD LABEL
========================================================= */

const FieldLabel = ({
  children,
  required,
}) => (
  <Text
    fontSize="sm"
    fontWeight="700"
    color="#1a1a2e"
    mb={1.5}
  >
    {children}{" "}
    {required && (
      <Text
        as="span"
        color="red.500"
      >
        *
      </Text>
    )}
  </Text>
);

/* =========================================================
   TEXT FIELD
========================================================= */

const TextField = ({
  error,
  ...props
}) => (
  <>
    <Input
      height="46px"
      fontSize="14px"
      borderColor={
        error
          ? "red.500"
          : "gray.200"
      }
      borderRadius="8px"
      _focus={{
        borderColor:
          primaryMaroon,
        boxShadow: `0 0 0 1px ${primaryMaroon}`,
      }}
      {...props}
    />

    {error && (
      <Text
        fontSize="xs"
        color="red.500"
        mt={1}
      >
        {error}
      </Text>
    )}
  </>
);

/* =========================================================
   ACCOUNT GROUP SELECT
========================================================= */

const AccountGroupSelect = ({
  value,
  onChange,
  groups,
  error,
  currentId,
}) => {
  const availableGroups =
    groups.filter(
      (group) =>
        String(group.id) !==
        String(currentId)
    );

  return (
    <>
      <Box position="relative">
        <Icon
          as={LuNetwork}
          boxSize={4}
          color="gray.400"
          position="absolute"
          left="14px"
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
            padding:
              "12px 14px 12px 38px",
            borderRadius: "8px",
            border: `1.5px solid ${
              error
                ? "#e53e3e"
                : "#e2e8f0"
            }`,
            fontSize: "14px",
            height: "46px",
            background: "white",
            outline: "none",
            color: value
              ? "#1a1a2e"
              : "#a0aec0",
          }}
        >
          <option value="">
            Top Level Group
          </option>

          {availableGroups.map(
            (group) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.group_name}
              </option>
            )
          )}
        </Box>
      </Box>

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
          {error}
        </Text>
      )}
    </>
  );
};

/* =========================================================
   SIDEBAR CARD
========================================================= */

const SidebarCard = ({
  icon,
  iconColor,
  title,
  children,
}) => (
  <Box
    bg="white"
    borderRadius="xl"
    border="1px solid"
    borderColor="gray.200"
    p={4}
  >
    <HStack
      spacing={2}
      mb={2}
    >
      <Icon
        as={icon}
        boxSize={4}
        color={
          iconColor ||
          primaryMaroon
        }
      />

      <Text
        fontSize="sm"
        fontWeight="800"
        color="#1a1a2e"
      >
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
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    group,
    setGroup,
  ] = useState(null);

  const [
    linkedLedgers,
    setLinkedLedgers,
  ] = useState(0);

  const [
    formData,
    setFormData,
  ] = useState({
    group_name: "",
    group_code: "",
    alias: "",
    under_group: "",
    status: true,
  });

  const [
    initialData,
    setInitialData,
  ] = useState(null);

  const [
    errors,
    setErrors,
  ] = useState({});

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData =
    async () => {
      setIsLoading(true);

      try {
        const [
          groupRes,
          groupsRes,
        ] = await Promise.all([
          getAccountGroup(id),
          listAccountGroups(),
        ]);

        const groupData =
          groupRes?.data ||
          null;

        const groupsData =
          groupsRes?.data
            ?.results ||
          groupsRes?.data ||
          [];

        setGroup(groupData);

        const safeGroups =
          Array.isArray(
            groupsData
          )
            ? groupsData
            : [];

        setGroups(
          safeGroups
        );

        /* =================================================
           LINKED LEDGERS COUNT
        ================================================= */

        const ledgerCount = Number(
          pick(
            groupData,
            [
              "ledgers_count",
              "linked_ledgers_count",
            ],
            0
          )
        );

        setLinkedLedgers(
          ledgerCount
        );

        /* =================================================
           FORM DATA
        ================================================= */

        const initial = {
          group_name:
            pick(
              groupData,
              ["group_name"],
              ""
            ),

          group_code:
            pick(
              groupData,
              [
                "group_code",
                "code",
              ],
              ""
            ),

          alias:
            pick(
              groupData,
              ["alias"],
              ""
            ),

          under_group:
            String(
              pick(
                groupData,
                [
                  "under_group.id",
                  "under_group",
                ],
                ""
              )
            ),

          status:
            Boolean(
              pick(
                groupData,
                [
                  "status",
                  "is_active",
                ],
                true
              )
            ),
        };

        setFormData(
          initial
        );

        setInitialData(
          initial
        );
      } catch (error) {
        console.error(
          "Error fetching account group:",
          error
        );

        toaster.create({
          title:
            "Error",
          description:
            "Failed to load account group.",
          type: "error",
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    };

  /* =========================================================
     HANDLE CHANGE
  ========================================================= */

  const handleChange =
    (field) =>
    (e) => {
      const value =
        e.target.value;

      setFormData(
        (prev) => ({
          ...prev,
          [field]: value,
        })
      );

      if (errors[field]) {
        setErrors(
          (prev) => ({
            ...prev,
            [field]: "",
          })
        );
      }
    };

  /* =========================================================
     MODIFIED FIELDS
  ========================================================= */

  const modifiedFields =
    useMemo(() => {
      if (!initialData) {
        return [];
      }

      return Object.keys(
        initialData
      ).filter(
        (key) =>
          String(
            formData[key]
          ) !==
          String(
            initialData[key]
          )
      );
    }, [
      formData,
      initialData,
    ]);

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validate =
    () => {
      const newErrors = {};

      if (
        !formData.group_name.trim()
      ) {
        newErrors.group_name =
          "Group name is required";
      }

      /* Prevent group from becoming
         its own parent */

      if (
        formData.under_group &&
        String(
          formData.under_group
        ) === String(id)
      ) {
        newErrors.under_group =
          "A group cannot be its own parent.";
      }

      setErrors(
        newErrors
      );

      return (
        Object.keys(
          newErrors
        ).length === 0
      );
    };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setIsSubmitting(
        true
      );

      const payload = {
        group_name:
          formData.group_name.trim(),

        status:
          formData.status,
      };

      if (
        formData.group_code.trim()
      ) {
        payload.group_code =
          formData.group_code.trim();
      } else {
        payload.group_code = "";
      }

      if (
        formData.alias.trim()
      ) {
        payload.alias =
          formData.alias.trim();
      } else {
        payload.alias = "";
      }

      if (
        formData.under_group
      ) {
        payload.under_group =
          Number(
            formData.under_group
          );
      } else {
        payload.under_group =
          null;
      }

      try {
        await updateAccountGroup(
          id,
          payload
        );

        toaster.create({
          title:
            "Success",
          description:
            "Account group updated successfully.",
          type: "success",
          duration: 3000,
        });

        navigate(
          `/account-groups/${id}`
        );
      } catch (error) {
        console.error(
          "Error updating account group:",
          error
        );

        const backendData =
          error?.response?.data;

        const backendErrors =
          {};

        if (
          backendData &&
          typeof backendData ===
            "object"
        ) {
          Object.entries(
            backendData
          ).forEach(
            ([field, message]) => {
              if (
                Array.isArray(
                  message
                )
              ) {
                backendErrors[field] =
                  message.join(
                    ", "
                  );
              } else if (
                typeof message ===
                "string"
              ) {
                backendErrors[field] =
                  message;
              }
            }
          );
        }

        if (
          Object.keys(
            backendErrors
          ).length > 0
        ) {
          setErrors(
            backendErrors
          );
        }

        let description =
          "Failed to update account group.";

        if (
          backendData?.error
        ) {
          description =
            backendData.error;
        } else if (
          backendData?.detail
        ) {
          description =
            backendData.detail;
        } else if (
          Object.keys(
            backendErrors
          ).length > 0
        ) {
          description =
            Object.entries(
              backendErrors
            )
              .map(
                ([field, message]) =>
                  `${field}: ${message}`
              )
              .join(" | ");
        }

        toaster.create({
          title:
            "Unable to update account group",
          description,
          type: "error",
          duration: 6000,
        });
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          `Delete "${formData.group_name}"? This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      if (
        linkedLedgers > 0
      ) {
        toaster.create({
          title:
            "Cannot delete account group",
          description:
            `This group has ${linkedLedgers} linked ledger${
              linkedLedgers > 1
                ? "s"
                : ""
            }. Remove the linked ledgers first.`,
          type: "error",
          duration: 5000,
        });

        return;
      }

      try {
        await deleteAccountGroup(
          id
        );

        toaster.create({
          title:
            "Deleted",
          description:
            "Account group has been deleted.",
          type: "success",
          duration: 3000,
        });

        navigate(
          "/account-groups"
        );
      } catch (error) {
        console.error(
          "Error deleting account group:",
          error
        );

        const backendData =
          error?.response?.data;

        toaster.create({
          title:
            "Unable to delete account group",
          description:
            backendData?.error ||
            backendData?.detail ||
            "This account group may contain linked records.",
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
              animation="accountGroupSpin 1s linear infinite"
            />
          </Flex>

          <style>
            {`
              @keyframes accountGroupSpin {
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
     DISPLAY DATA
  ========================================================= */

  const parentGroupName =
    pick(
      group,
      [
        "under_group.group_name",
        "under_group_name",
      ],
      "Top Level Group"
    );

  const createdAt =
    pick(
      group,
      ["created_at"],
      null
    );

  const updatedAt =
    pick(
      group,
      ["updated_at"],
      null
    );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <Box
        flex="1"
        w="100%"
      >
        <Box
          w="100%"
          px={{
            base: 3,
            md: 4,
          }}
          py={{
            base: 3,
            md: 4,
          }}
        >
          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <HStack
            fontSize="xs"
            color="gray.400"
            fontWeight="600"
            mb={2}
            spacing={1}
            wrap="wrap"
          >
            <Text
              as="span"
              color={
                primaryMaroon
              }
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/admin/masters"
                )
              }
            >
              Masters
            </Text>

            <Text as="span">
              /
            </Text>

            <Text
              as="span"
              color={
                primaryMaroon
              }
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/account-groups"
                )
              }
            >
              Account Groups
            </Text>

            <Text as="span">
              /
            </Text>

            <Text
              as="span"
              color={
                primaryMaroon
              }
            >
              {formData.group_name ||
                "Group"}
            </Text>

            <Text as="span">
              /
            </Text>

            <Text as="span">
              Edit
            </Text>
          </HStack>

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <VStack
            align="start"
            spacing={1}
            mb={5}
          >
            <Heading
              fontSize="2xl"
              fontWeight="800"
              color="#1a1a2e"
            >
              Edit Account Group
            </Heading>

            <Text
              color="gray.500"
              fontSize="sm"
            >
              Update group information
              and hierarchy.
            </Text>
          </VStack>

          {/* =================================================
              HERO INFO BAR
          ================================================= */}

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={5}
            mb={5}
          >
            <Flex
              align="center"
              gap={6}
              wrap="wrap"
            >
              {/* =============================================
                  GROUP INFO
              ============================================= */}

              <HStack
                spacing={4}
                flex="1"
                minW="260px"
              >
                <Circle
                  size="56px"
                  bg="rgba(174,32,80,0.08)"
                  color={
                    primaryMaroon
                  }
                >
                  <Icon
                    as={LuNetwork}
                    boxSize={6}
                  />
                </Circle>

                <Box>
                  <Heading
                    fontSize="xl"
                    fontWeight="800"
                    color="#1a1a2e"
                  >
                    {formData.group_name ||
                      "—"}
                  </Heading>

                  <HStack
                    spacing={2}
                    mt={1}
                    color="gray.500"
                    fontSize="sm"
                    flexWrap="wrap"
                  >
                    <Text>
  {formData.group_code || "—"}
</Text>

                    <Text>
                      •
                    </Text>

                    <Text>
                      Under:{" "}
                      {parentGroupName}
                    </Text>

                    <Badge
                      bg={
                        formData.status
                          ? "green.50"
                          : "gray.100"
                      }
                      color={
                        formData.status
                          ? "green.600"
                          : "gray.600"
                      }
                      fontSize="11px"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {formData.status
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>

              {/* =============================================
                  LINKED LEDGERS
              ============================================= */}

              <Box
                borderLeft={{
                  base: "none",
                  md: "1px solid",
                }}
                borderColor="gray.200"
                pl={{
                  base: 0,
                  md: 6,
                }}
              >
                <HStack
                  spacing={4}
                >
                  <Circle
                    size="48px"
                    bg="rgba(174,32,80,0.08)"
                    color={
                      primaryMaroon
                    }
                  >
                    <Icon
                      as={LuBookMarked}
                      boxSize={5}
                    />
                  </Circle>

                  <Box>
                    <Text
                      fontSize="xl"
                      fontWeight="800"
                      color="#1a1a2e"
                    >
                      {linkedLedgers}
                    </Text>

                    <Text
                      fontSize="sm"
                      color="gray.500"
                    >
                      Linked Ledgers
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Flex>
          </Box>

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
          >
            <Grid
              templateColumns={{
                base: "1fr",
                lg: "2fr 1fr",
              }}
              gap={5}
              alignItems="start"
            >
              {/* =============================================
                  LEFT FORM
              ============================================= */}

              <GridItem>
                <Box
                  bg="white"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  overflow="hidden"
                >
                  <Box
                    px={6}
                    pt={5}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="800"
                      color={
                        primaryMaroon
                      }
                      mb={2}
                    >
                      Account Group Details
                    </Text>

                    <Box
                      height="3px"
                      width="60px"
                      bg={
                        primaryMaroon
                      }
                      borderRadius="full"
                    />
                  </Box>

                  <Box
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    mt={3}
                  />

                  <Box p={6}>
                    <VStack
                      align="stretch"
                      spacing={5}
                    >
                      {/* ===================================
                          BASIC DETAILS
                      =================================== */}

                      <Grid
                        templateColumns={{
                          base: "1fr",
                          md: "1fr 1fr",
                        }}
                        gap={5}
                      >
                        {/* GROUP NAME */}

                        <GridItem>
                          <FieldLabel
                            required
                          >
                            Group Name
                          </FieldLabel>

                          <TextField
                            value={
                              formData.group_name
                            }
                            onChange={handleChange(
                              "group_name"
                            )}
                            error={
                              errors.group_name
                            }
                            placeholder="Enter group name"
                          />
                        </GridItem>

                        {/* GROUP CODE */}

                        <GridItem>
                          <FieldLabel>
                            Group Code
                          </FieldLabel>

                          <TextField
                            value={
                              formData.group_code
                            }
                            onChange={handleChange(
                              "group_code"
                            )}
                            error={
                              errors.group_code
                            }
                            placeholder="Enter group code"
                          />
                        </GridItem>

                        {/* ALIAS */}

                        <GridItem>
                          <FieldLabel>
                            Alias
                          </FieldLabel>

                          <TextField
                            value={
                              formData.alias
                            }
                            onChange={handleChange(
                              "alias"
                            )}
                            error={
                              errors.alias
                            }
                            placeholder="Enter alias"
                          />
                        </GridItem>

                        {/* UNDER GROUP */}

                        <GridItem>
                          <FieldLabel>
                            Under Group
                          </FieldLabel>

                          <AccountGroupSelect
                            value={
                              formData.under_group
                            }
                            onChange={handleChange(
                              "under_group"
                            )}
                            groups={
                              groups
                            }
                            error={
                              errors.under_group
                            }
                            currentId={
                              id
                            }
                          />

                          <Text
                            fontSize="xs"
                            color="gray.500"
                            mt={1}
                          >
                            Leave empty for
                            a top-level
                            group.
                          </Text>
                        </GridItem>
                      </Grid>

                      {/* ===================================
                          STATUS
                      =================================== */}

                      <Box>
                        <FieldLabel>
                          Status
                        </FieldLabel>

                        <HStack
                          spacing={3}
                        >
                          <Box
                            as="button"
                            type="button"
                            onClick={() =>
                              setFormData(
                                (prev) => ({
                                  ...prev,
                                  status:
                                    !prev.status,
                                })
                              )
                            }
                            width="44px"
                            height="24px"
                            borderRadius="full"
                            bg={
                              formData.status
                                ? primaryMaroon
                                : "gray.300"
                            }
                            position="relative"
                            transition="background 0.2s ease"
                            aria-label="Toggle status"
                          >
                            <Box
                              position="absolute"
                              top="2px"
                              left={
                                formData.status
                                  ? "22px"
                                  : "2px"
                              }
                              width="20px"
                              height="20px"
                              borderRadius="full"
                              bg="white"
                              boxShadow="sm"
                              transition="left 0.2s ease"
                            />
                          </Box>

                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="#1a1a2e"
                          >
                            {formData.status
                              ? "Active"
                              : "Inactive"}
                          </Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              </GridItem>

              {/* =============================================
                  RIGHT SIDEBAR
              ============================================= */}

              <GridItem>
                <VStack
                  align="stretch"
                  spacing={4}
                >
                  {/* =========================================
                      RECORD INFORMATION
                  ========================================= */}

                  <SidebarCard
                    icon={
                      LuClipboardList
                    }
                    title="Record Information"
                  >
                    <VStack
                      align="stretch"
                      spacing={3}
                      mt={2}
                    >
                      <HStack
                        spacing={2}
                        align="start"
                      >
                        <Icon
                          as={
                            LuCalendar
                          }
                          boxSize={4}
                          color="gray.400"
                          mt={0.5}
                        />

                        <Box>
                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            Created
                          </Text>

                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="#1a1a2e"
                          >
                            {formatDate(
                              createdAt
                            )}
                          </Text>
                        </Box>
                      </HStack>

                      <HStack
                        spacing={2}
                        align="start"
                      >
                        <Icon
                          as={
                            LuUser
                          }
                          boxSize={4}
                          color="gray.400"
                          mt={0.5}
                        />

                        <Box>
                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            Last updated
                          </Text>

                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="#1a1a2e"
                          >
                            {formatDate(
                              updatedAt
                            )}
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </SidebarCard>

                  {/* =========================================
                      LINKED LEDGERS
                  ========================================= */}

                  <SidebarCard
                    icon={
                      LuBookOpen
                    }
                    title="Linked Ledgers"
                  >
                    <HStack
                      spacing={3}
                      mt={2}
                      align="start"
                    >
                      <Circle
                        size="38px"
                        bg="rgba(174,32,80,0.08)"
                        color={
                          primaryMaroon
                        }
                      >
                        <Icon
                          as={
                            LuBookMarked
                          }
                          boxSize={4}
                        />
                      </Circle>

                      <Box>
                        <Text
                          fontSize="lg"
                          fontWeight="800"
                          color="#1a1a2e"
                        >
                          {
                            linkedLedgers
                          }
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.500"
                        >
                          Ledger
                          {linkedLedgers !==
                          1
                            ? "s"
                            : ""}{" "}
                          linked to
                          this group
                        </Text>
                      </Box>
                    </HStack>

                    {linkedLedgers >
                      0 && (
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        mt={3}
                      >
                        Linked ledgers
                        must be moved
                        before this
                        group can be
                        deleted.
                      </Text>
                    )}
                  </SidebarCard>

                  {/* =========================================
                      UNSAVED CHANGES
                  ========================================= */}

                  {modifiedFields.length >
                    0 && (
                    <SidebarCard
                      icon={
                        LuTriangleAlert
                      }
                      iconColor="orange.500"
                      title="Unsaved Changes"
                    >
                      <HStack
                        spacing={2}
                        align="start"
                        mt={1}
                      >
                        <Icon
                          as={
                            LuClock
                          }
                          boxSize={4}
                          color="orange.500"
                          mt={0.5}
                        />

                        <Box>
                          <Text
                            fontSize="sm"
                            fontWeight="700"
                            color="orange.600"
                          >
                            {
                              modifiedFields.length
                            }{" "}
                            field
                            {modifiedFields.length >
                            1
                              ? "s"
                              : ""}{" "}
                            modified
                          </Text>

                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            Please review
                            your changes
                            before
                            saving.
                          </Text>
                        </Box>
                      </HStack>
                    </SidebarCard>
                  )}

                  {/* =========================================
                      DANGER ZONE
                  ========================================= */}

                  <SidebarCard
                    icon={
                      LuTrash2
                    }
                    iconColor="red.500"
                    title="Danger Zone"
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={
                        handleDelete
                      }
                      textAlign="left"
                      mt={1}
                      display="flex"
                      alignItems="start"
                      gap={2}
                      width="100%"
                      cursor={
                        linkedLedgers >
                        0
                          ? "not-allowed"
                          : "pointer"
                      }
                      opacity={
                        linkedLedgers >
                        0
                          ? 0.55
                          : 1
                      }
                    >
                      <Icon
                        as={
                          LuTrash2
                        }
                        boxSize={4}
                        color="red.500"
                        mt={0.5}
                      />

                      <Box>
                        <Text
                          fontSize="sm"
                          fontWeight="700"
                          color="red.500"
                        >
                          Delete Account Group
                        </Text>

                        <Text
                          fontSize="xs"
                          color="gray.500"
                        >
                          {linkedLedgers >
                          0
                            ? "Remove linked ledgers before deleting."
                            : "This action cannot be undone."}
                        </Text>
                      </Box>
                    </Box>
                  </SidebarCard>
                </VStack>
              </GridItem>
            </Grid>

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <Flex
              justify="flex-end"
              gap={3}
              mt={5}
              pb={2}
            >
              <Button
                variant="outline"
                borderColor={
                  primaryMaroon
                }
                color={
                  primaryMaroon
                }
                bg="white"
                _hover={{
                  bg: "rgba(174,32,80,0.05)",
                }}
                px={8}
                onClick={() =>
                  navigate(
                    `/account-groups/${id}`
                  )
                }
                isDisabled={
                  isSubmitting
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                bg={
                  primaryMaroon
                }
                color="white"
                _hover={{
                  bg: "#8a1a3e",
                }}
                px={8}
                loading={
                  isSubmitting
                }
                loadingText="Updating..."
              >
                Update Account Group
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </Box>
  );
};

export default AccountGroupEditPage;