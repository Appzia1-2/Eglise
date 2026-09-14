
// src/admin/pages/AccountLedgerAddPage.jsx

import React, {
  useEffect,
  useState,
} from "react";

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
  LuCalendar,
  LuIndianRupee,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toaster } from "../components/ui/toaster";

import {
  createAccountLedger,
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

const todayDisplay = () =>
  new Date().toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

const todayISO = () =>
  new Date()
    .toISOString()
    .split("T")[0];

/* =========================================================
   FIELD LABEL
========================================================= */

const FieldLabel = ({
  children,
  required,
}) => (
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
   TEXT FIELD
========================================================= */

const TextField = ({
  error,
  ...props
}) => (
  <>
    <Input
      height="40px"
      fontSize="12px"
      borderColor={
        error
          ? "red.500"
          : border
      }
      borderRadius="6px"
      _focus={{
        borderColor:
          primaryMaroon,
        boxShadow:
          `0 0 0 1px ${primaryMaroon}`,
      }}
      {...props}
    />

    {error && (
      <Text
        fontSize="10px"
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
}) => (
  <>
    <Box
      position="relative"
    >
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
          padding:
            "0 12px 0 36px",
          borderRadius: "6px",
          border:
            `1px solid ${
              error
                ? "#e53e3e"
                : border
            }`,
          fontSize: "12px",
          height: "40px",
          background: "white",
          outline: "none",
          color: value
            ? dark
            : "#a0aec0",
          cursor: "pointer",
        }}
      >
        <option value="">
          Select account group
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

    {error && (
      <Text
        fontSize="10px"
        color="red.500"
        mt={1}
      >
        {error}
      </Text>
    )}
  </>
);

/* =========================================================
   DR / CR TOGGLE
========================================================= */

const DrCrToggle = ({
  value,
  onChange,
}) => (
  <HStack
    spacing={0}
    border="1px solid"
    borderColor={border}
    borderRadius="6px"
    overflow="hidden"
    flexShrink={0}
    height="40px"
  >
    {["DR", "CR"].map(
      (side) => (
        <Box
          key={side}
          as="button"
          type="button"
          onClick={() =>
            onChange(side)
          }
          px={5}
          height="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="12px"
          fontWeight="700"
          color={
            value === side
              ? primaryMaroon
              : "gray.500"
          }
          bg={
            value === side
              ? "rgba(174,32,80,0.08)"
              : "white"
          }
          borderLeft={
            side === "CR"
              ? "1px solid"
              : "none"
          }
          borderColor={
            border
          }
          cursor="pointer"
          _hover={{
            bg:
              value === side
                ? "rgba(174,32,80,0.08)"
                : "gray.50",
          }}
        >
          {side === "DR"
            ? "Dr"
            : "Cr"}
        </Box>
      )
    )}
  </HStack>
);

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountLedgerAddPage =
  () => {
    const navigate =
      useNavigate();

    const [groups, setGroups] =
      useState([]);

    const [
      isLoadingGroups,
      setIsLoadingGroups,
    ] = useState(true);

    const [
      isSubmitting,
      setIsSubmitting,
    ] = useState(false);

    const [
      formData,
      setFormData,
    ] = useState({
      ledger_name: "",
      ledger_code: "",
      alias: "",
      account_group: "",
      opening_balance_date:
        todayISO(),
      op_balance: "",
      op_balance_type: "DR",
    });

    const [
      errors,
      setErrors,
    ] = useState({});

    /* =======================================================
       LOAD ACCOUNT GROUPS
    ======================================================= */

    useEffect(() => {
      const fetchGroups =
        async () => {
          setIsLoadingGroups(
            true
          );

          try {
            const response =
              await listAccountGroups();

            const data =
              response?.data
                ?.results ||
              response?.data ||
              [];

            setGroups(
              Array.isArray(data)
                ? data
                : []
            );
          } catch (error) {
            console.error(
              "Error fetching account groups:",
              error
            );

            toaster.create({
              title:
                "Unable to load account groups",
              description:
                "Please refresh the page and try again.",
              type: "error",
              duration: 4000,
            });
          } finally {
            setIsLoadingGroups(
              false
            );
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
        const value =
          event.target.value;

        setFormData(
          (previous) => ({
            ...previous,
            [field]: value,
          })
        );

        if (errors[field]) {
          setErrors(
            (previous) => ({
              ...previous,
              [field]: "",
            })
          );
        }
      };

    /* =======================================================
       VALIDATE
    ======================================================= */

    const validate = () => {
      const newErrors = {};

      if (
        !formData.ledger_name.trim()
      ) {
        newErrors.ledger_name =
          "Ledger name is required.";
      }

      if (
        !formData.account_group
      ) {
        newErrors.account_group =
          "Please select an account group.";
      }

      if (
        formData.op_balance !== "" &&
        Number.isNaN(
          Number(
            formData.op_balance
          )
        )
      ) {
        newErrors.op_balance =
          "Please enter a valid opening balance.";
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

    /* =======================================================
       HANDLE SUBMIT
    ======================================================= */

    const handleSubmit =
      async (event) => {
        event.preventDefault();

        if (!validate()) {
          return;
        }

        setIsSubmitting(true);

        /*
         * Build payload explicitly.
         *
         * Empty optional fields are not
         * sent as undefined because some
         * Django serializers handle
         * undefined inconsistently.
         */

        const payload = {
          ledger_name:
            formData.ledger_name.trim(),

          account_group:
            Number(
              formData.account_group
            ),

          op_balance:
            formData.op_balance === ""
              ? 0
              : Number(
                  formData.op_balance
                ),

          op_balance_type:
            formData.op_balance_type,

          opening_balance_date:
            formData.opening_balance_date,

          status: true,
        };

        if (
          formData.ledger_code.trim()
        ) {
          payload.ledger_code =
            formData.ledger_code.trim();
        }

        if (
          formData.alias.trim()
        ) {
          payload.alias =
            formData.alias.trim();
        }

        console.log(
          "Creating account ledger with payload:",
          payload
        );

        try {
          const response =
            await createAccountLedger(
              payload
            );

          console.log(
            "Account ledger created:",
            response?.data
          );

          toaster.create({
            title: "Success",
            description:
              "Account ledger created successfully.",
            type: "success",
            duration: 3000,
          });

          navigate(
            "/account-ledgers"
          );
        } catch (error) {
          console.error(
            "Error creating account ledger:",
            error
          );

          /*
           * Get the actual Django
           * validation response.
           */

          const backendData =
            error?.response?.data;

          console.error(
            "Backend response:",
            backendData
          );

          console.error(
            "HTTP status:",
            error?.response?.status
          );

          /*
           * Convert Django validation
           * errors into field errors.
           */

          if (
            backendData &&
            typeof backendData ===
              "object"
          ) {
            const backendErrors =
              {};

            Object.entries(
              backendData
            ).forEach(
              ([
                field,
                message,
              ]) => {
                if (
                  Array.isArray(
                    message
                  )
                ) {
                  backendErrors[
                    field
                  ] =
                    message.join(
                      ", "
                    );
                } else if (
                  typeof message ===
                  "string"
                ) {
                  backendErrors[
                    field
                  ] = message;
                }
              }
            );

            if (
              Object.keys(
                backendErrors
              ).length > 0
            ) {
              setErrors(
                backendErrors
              );
            }
          }

          /*
           * Build readable toast
           * message.
           */

          let description =
            "Failed to create account ledger.";

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
            backendData &&
            typeof backendData ===
              "object"
          ) {
            const messages =
              Object.entries(
                backendData
              )
                .map(
                  ([
                    field,
                    message,
                  ]) => {
                    const readable =
                      Array.isArray(
                        message
                      )
                        ? message.join(
                            ", "
                          )
                        : String(
                            message
                          );

                    return `${field}: ${readable}`;
                  }
                )
                .join(" | ");

            if (messages) {
              description =
                messages;
            }
          }

          toaster.create({
            title:
              "Unable to create account ledger",
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
        {/* =================================================
            HEADER / NAVBAR
        ================================================= */}

        <Navbar />

        {/* =================================================
            MAIN
        ================================================= */}

        <Box
          flex="1"
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
            gap={2}
            fontSize="11px"
            color={muted}
            mb={2}
          >
            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/admin/masters"
                )
              }
            >
              Masters
            </Text>

            <Text>/</Text>

            <Text
              color={primaryMaroon}
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/account-ledgers"
                )
              }
            >
              Account Ledgers
            </Text>

            <Text>/</Text>

            <Text>
              Add Account Ledger
            </Text>
          </HStack>

          {/* =================================================
              PAGE HEADER
          ================================================= */}

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
                ACCOUNT LEDGERS
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
                Add Account Ledger
              </Heading>

              <Text
                color={muted}
                fontSize="11px"
                mt={1}
              >
                Create a ledger account
                and define its opening
                balance.
              </Text>
            </Box>
          </Flex>

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
          >
            <Box
              bg="white"
              border={`1px solid ${border}`}
              borderRadius="8px"
              overflow="hidden"
              width="100%"
            >
              {/* =================================================
                  SECTION HEADER
              ================================================= */}

              <Box
                px={{
                  base: 4,
                  md: 5,
                }}
                pt={4}
                pb={3}
              >
                <Text
                  fontSize="14px"
                  fontWeight="800"
                  color={dark}
                >
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

              <Box
                borderBottom={`1px solid ${border}`}
              />

              {/* =================================================
                  LEDGER INFORMATION
              ================================================= */}

              <Box
                px={{
                  base: 4,
                  md: 5,
                }}
                py={5}
              >
                <VStack
                  align="stretch"
                  spacing={5}
                >
                  <Box>
                    <Text
                      fontSize="13px"
                      fontWeight="800"
                      color={dark}
                      mb={3}
                    >
                      Ledger Information
                    </Text>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "1fr 1fr",
                      }}
                      gap={4}
                    >
                      {/* LEDGER NAME */}

                      <GridItem>
                        <FieldLabel required>
                          Ledger Name
                        </FieldLabel>

                        <TextField
                          placeholder="Enter ledger name"
                          value={
                            formData.ledger_name
                          }
                          onChange={handleChange(
                            "ledger_name"
                          )}
                          error={
                            errors.ledger_name
                          }
                        />
                      </GridItem>

                      {/* LEDGER CODE */}

                      <GridItem>
                        <FieldLabel>
                          Ledger Code
                        </FieldLabel>

                        <TextField
                          placeholder="Enter ledger code (optional)"
                          value={
                            formData.ledger_code
                          }
                          onChange={handleChange(
                            "ledger_code"
                          )}
                          error={
                            errors.ledger_code
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
                          value={
                            formData.alias
                          }
                          onChange={handleChange(
                            "alias"
                          )}
                          error={
                            errors.alias
                          }
                        />
                      </GridItem>

                      {/* ACCOUNT GROUP */}

                      <GridItem>
                        <FieldLabel required>
                          Account Group
                        </FieldLabel>

                        <AccountGroupSelect
                          value={
                            formData.account_group
                          }
                          onChange={handleChange(
                            "account_group"
                          )}
                          groups={groups}
                          error={
                            errors.account_group
                          }
                        />

                        {isLoadingGroups && (
                          <Text
                            fontSize="10px"
                            color={muted}
                            mt={1}
                          >
                            Loading account
                            groups...
                          </Text>
                        )}
                      </GridItem>
                    </Grid>
                  </Box>

                  {/* =================================================
                      DIVIDER
                  ================================================= */}

                  <Box
                    borderBottom={`1px solid #EEF1F5`}
                  />

                  {/* =================================================
                      OPENING BALANCE
                  ================================================= */}

                  <Box>
                    <HStack
                      spacing={2}
                      mb={3}
                      align="center"
                    >
                      <Text
                        fontSize="13px"
                        fontWeight="800"
                        color={dark}
                      >
                        Opening Balance
                      </Text>

                      <HStack
                        spacing={1}
                        color={muted}
                      >
                        <Icon
                          as={LuCalendar}
                          boxSize={3.5}
                        />

                        <Text fontSize="10px">
                          Balance as on{" "}
                          {todayDisplay()}
                        </Text>
                      </HStack>
                    </HStack>

                    <FieldLabel>
                      Opening Balance as on{" "}
                      {todayDisplay()}
                    </FieldLabel>

                    <Flex
                      border="1px solid"
                      borderColor={
                        errors.op_balance
                          ? "red.500"
                          : border
                      }
                      borderRadius="6px"
                      overflow="hidden"
                      align="stretch"
                      height="40px"
                    >
                      {/* RUPEE ICON */}

                      <Flex
                        align="center"
                        px={3}
                        bg="white"
                      >
                        <Icon
                          as={
                            LuIndianRupee
                          }
                          boxSize={3.5}
                          color="gray.400"
                        />
                      </Flex>

                      {/* AMOUNT */}

                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          formData.op_balance
                        }
                        onChange={handleChange(
                          "op_balance"
                        )}
                        height="40px"
                        fontSize="12px"
                        border="none"
                        borderRadius="0"
                        _focus={{
                          boxShadow:
                            "none",
                        }}
                        flex="1"
                      />

                      {/* DR / CR */}

                      <DrCrToggle
                        value={
                          formData.op_balance_type
                        }
                        onChange={(
                          side
                        ) =>
                          setFormData(
                            (
                              previous
                            ) => ({
                              ...previous,
                              op_balance_type:
                                side,
                            })
                          )
                        }
                      />
                    </Flex>

                    {errors.op_balance && (
                      <Text
                        fontSize="10px"
                        color="red.500"
                        mt={1}
                      >
                        {
                          errors.op_balance
                        }
                      </Text>
                    )}

                    <Text
                      fontSize="10px"
                      color={muted}
                      mt={1}
                    >
                      Enter zero if the
                      ledger has no
                      opening balance.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Box>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <Flex
              justify="flex-end"
              gap={2}
              mt={4}
            >
              <Button
                type="button"
                variant="outline"
                borderColor={
                  primaryMaroon
                }
                color={
                  primaryMaroon
                }
                bg="white"
                borderRadius="6px"
                height="36px"
                fontSize="11px"
                px={6}
                onClick={() =>
                  navigate(
                    "/account-ledgers"
                  )
                }
                isDisabled={
                  isSubmitting
                }
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
                loading={
                  isSubmitting
                }
                loadingText="Saving..."
                _hover={{
                  bg: "#8a1a3e",
                }}
              >
                Save Ledger
              </Button>
            </Flex>
          </form>
        </Box>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Footer />
      </Box>
    );
  };

export default AccountLedgerAddPage;

