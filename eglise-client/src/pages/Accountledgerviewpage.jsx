// src/pages/AccountLedgerViewPage.jsx

import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  Badge,
  Circle,
} from "@chakra-ui/react";

import {
  LuBookOpen,
  LuWallet,
  LuScale,
  LuNetwork,
  LuClipboardList,
  LuEye,
  LuPencil,
  LuArrowLeft,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toaster } from "../components/ui/toaster";

import {
  getAccountLedger,
  listLedgerTransactions,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

/* =========================================================
   HELPERS
========================================================= */

const pick = (obj, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce(
        (acc, k) => (acc == null ? acc : acc[k]),
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

const formatMoney = (amount) => {
  const value = Number(amount || 0);

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatBalance = (amount, side) => {
  return `₹ ${formatMoney(amount)} ${
    String(side || "DR").toUpperCase() === "CR"
      ? "Cr"
      : "Dr"
  }`;
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

const voucherTypeStyle = {
  RECEIPT: {
    bg: "#ECFDF3",
    color: "#16804A",
    label: "Receipt",
  },

  PAYMENT: {
    bg: "#FFF1F3",
    color: "#D7193F",
    label: "Payment",
  },

  OPENING: {
    bg: "#EFF6FF",
    color: "#2563EB",
    label: "Opening",
  },

  JOURNAL: {
    bg: "#F5F3FF",
    color: "#7C3AED",
    label: "Journal",
  },
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({ icon, title, rows }) => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="8px"
      p={4}
      h="100%"
    >
      <HStack gap={2} mb={3}>
        <Icon
          as={icon}
          boxSize={4}
          color={RED}
        />

        <Text
          fontSize="13px"
          fontWeight="700"
          color={DARK}
        >
          {title}
        </Text>
      </HStack>

      <Box>
        {rows.map((row, index) => (
          <Flex
            key={`${row.label}-${index}`}
            justify="space-between"
            align="center"
            gap={4}
            py={2}
            borderTop={
              index === 0
                ? "none"
                : "1px solid #F0F2F5"
            }
          >
            <Text
              fontSize="11px"
              color={MUTED}
            >
              {row.label}
            </Text>

            <Text
              fontSize="11px"
              fontWeight="600"
              color={row.color || DARK}
              textAlign="right"
              maxW="65%"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>
    </Box>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountLedgerViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);

      try {
        const ledgerResponse =
          await getAccountLedger(id);

        const ledgerData =
          ledgerResponse?.data ??
          ledgerResponse ??
          null;

        setLedger(ledgerData);

        try {
          const transactionResponse =
            await listLedgerTransactions(id, {
              limit: 4,
            });

          const transactionData =
            transactionResponse?.data?.results ??
            transactionResponse?.data ??
            transactionResponse ??
            [];

          setTransactions(
            Array.isArray(transactionData)
              ? transactionData
              : []
          );
        } catch (transactionError) {
          console.warn(
            "Could not load transactions:",
            transactionError
          );

          setTransactions([]);
        }
      } catch (error) {
        console.error(
          "Error fetching account ledger:",
          error
        );

        const backendError =
          error?.response?.data;

        toaster.create({
          title: "Error",
          description:
            backendError?.error ||
            backendError?.detail ||
            "Failed to load account ledger.",
          type: "error",
          duration: 4000,
        });

        setLedger(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box flex="1">
          <Flex
            justify="center"
            align="center"
            minH="450px"
          >
            <Box
              width="38px"
              height="38px"
              border="4px solid"
              borderColor="#E5E7EB"
              borderTopColor={RED}
              borderRadius="50%"
              animation="ledgerSpin 1s linear infinite"
            />
          </Flex>

          <style>
            {`
              @keyframes ledgerSpin {
                from {
                  transform: rotate(0deg);
                }
                to {
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

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!ledger) {
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
          py={5}
        >
          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="8px"
            bg="white"
            p={8}
            textAlign="center"
          >
            <Text
              fontSize="18px"
              fontWeight="700"
              color={DARK}
              mb={2}
            >
              Account Ledger Not Found
            </Text>

            <Text
              fontSize="12px"
              color={MUTED}
              mb={5}
            >
              The requested account ledger could
              not be loaded.
            </Text>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              h="36px"
              fontSize="12px"
              borderRadius="6px"
              onClick={() =>
                navigate("/account-ledgers")
              }
              _hover={{
                bg: "#650A18",
              }}
            >
              <Icon
                as={LuArrowLeft}
                mr={2}
              />
              Back to Account Ledgers
            </Button>
          </Box>
        </Box>

        <Footer />
      </Box>
    );
  }

  /* =======================================================
     LEDGER VALUES
  ======================================================= */

  const ledgerName = pick(
    ledger,
    ["ledger_name", "name"],
    "—"
  );

  const ledgerCode = pick(
    ledger,
    ["ledger_code", "code"],
    "—"
  );

  const alias = pick(
    ledger,
    ["alias"],
    "—"
  );

  const groupName = pick(
    ledger,
    [
      "account_group.group_name",
      "account_group.name",
      "account_group_name",
    ],
    "—"
  );

  const underGroupName = pick(
    ledger,
    [
      "account_group.under_group_name",
      "under_group_name",
    ],
    "—"
  );

  const nature = pick(
    ledger,
    [
      "account_group.nature",
      "nature",
    ],
    "—"
  );

  const rawStatus = pick(
    ledger,
    ["status", "is_active"],
    true
  );

  const isActive =
    rawStatus === true ||
    rawStatus === 1 ||
    rawStatus === "true" ||
    String(rawStatus).toLowerCase() === "active";

  const openingBalance = Number(
    pick(
      ledger,
      [
        "op_balance",
        "opening_balance",
      ],
      0
    )
  );

  const openingBalanceSide = pick(
    ledger,
    [
      "op_balance_type",
      "opening_balance_type",
    ],
    "DR"
  );

  const balanceAsOn = pick(
    ledger,
    ["opening_balance_date"],
    null
  );

  const currentBalance = Number(
    pick(
      ledger,
      [
        "current_balance",
        "closing_balance",
      ],
      0
    )
  );

  const currentBalanceSide = pick(
    ledger,
    [
      "current_balance_type",
      "balance_type",
    ],
    currentBalance < 0 ? "CR" : "DR"
  );

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
      {/* ==================================================
          CLIENT HEADER
      ================================================== */}

      <Navbar />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

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
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
          color={MUTED}
          fontSize="11px"
        >
          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() =>
              navigate("/account-ledgers")
            }
          >
            Masters
          </Text>

          <Text>/</Text>

          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() =>
              navigate("/account-ledgers")
            }
          >
            Account Ledgers
          </Text>

          <Text>/</Text>

          <Text>
            {ledgerCode}
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

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
              color={RED}
              mb={1}
            >
              ACCOUNT LEDGER
            </Text>

            <Heading
              color={DARK}
              fontSize={{
                base: "22px",
                md: "26px",
              }}
              lineHeight="1.1"
              mb={1}
            >
              Account Ledger Details
            </Heading>

            <Text
              color={MUTED}
              fontSize="11px"
            >
              View ledger information, balances
              and recent transactions.
            </Text>
          </Box>

          <HStack gap={2}>
            <Button
              variant="outline"
              borderColor={BORDER}
              color={MUTED}
              bg="white"
              h="36px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() =>
                navigate("/account-ledgers")
              }
              _hover={{
                borderColor: PRIMARY_MAROON,
                color: PRIMARY_MAROON,
                bg: "#FFF7F9",
              }}
            >
              <Icon
                as={LuArrowLeft}
                mr={2}
              />
              Back
            </Button>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              h="36px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() =>
                navigate(
                  `/account-ledgers/${id}/edit`
                )
              }
              _hover={{
                bg: "#650A18",
              }}
            >
              <Icon
                as={LuPencil}
                mr={2}
              />
              Edit
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            HERO CARD
        ================================================== */}

        <Box
          border="1px solid"
          borderColor={BORDER}
          borderRadius="8px"
          bg="white"
          p={4}
          mb={3}
        >
          <Flex
            align="center"
            gap={5}
            wrap="wrap"
          >
            {/* LEDGER */}

            <HStack
              gap={3}
              flex="1.4"
              minW="280px"
            >
              <Circle
                size="52px"
                bg="#FFF0F4"
                color={RED}
                flexShrink={0}
              >
                <Icon
                  as={LuBookOpen}
                  boxSize={6}
                />
              </Circle>

              <Box minW={0}>
                <Heading
                  fontSize="19px"
                  fontWeight="700"
                  color={DARK}
                  noOfLines={1}
                >
                  {ledgerName}
                </Heading>

                <HStack
                  gap={2}
                  mt={1}
                  color={MUTED}
                  fontSize="11px"
                  flexWrap="wrap"
                >
                  <Text>
                    {ledgerCode}
                  </Text>

                  <Text>•</Text>

                  <Text>
                    Group: {groupName}
                  </Text>

                  <Badge
                    bg={
                      isActive
                        ? "#ECFDF3"
                        : "#F3F4F6"
                    }
                    color={
                      isActive
                        ? "#16804A"
                        : "#667085"
                    }
                    fontSize="10px"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {isActive
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </HStack>
              </Box>
            </HStack>

            {/* OPENING */}

            <HStack
              gap={3}
              flex="1"
              minW="210px"
              borderLeft={{
                base: "none",
                md: `1px solid ${BORDER}`,
              }}
              pl={{
                base: 0,
                md: 5,
              }}
            >
              <Circle
                size="44px"
                bg="#FFF0F4"
                color={RED}
                flexShrink={0}
              >
                <Icon
                  as={LuWallet}
                  boxSize={5}
                />
              </Circle>

              <Box>
                <Text
                  fontSize="18px"
                  fontWeight="700"
                  color={DARK}
                >
                  {formatBalance(
                    openingBalance,
                    openingBalanceSide
                  )}
                </Text>

                <Text
                  fontSize="11px"
                  color={MUTED}
                >
                  Opening Balance
                </Text>
              </Box>
            </HStack>

            {/* CURRENT */}

            <HStack
              gap={3}
              flex="1"
              minW="210px"
              borderLeft={{
                base: "none",
                md: `1px solid ${BORDER}`,
              }}
              pl={{
                base: 0,
                md: 5,
              }}
            >
              <Circle
                size="44px"
                bg="#FFF0F4"
                color={RED}
                flexShrink={0}
              >
                <Icon
                  as={LuScale}
                  boxSize={5}
                />
              </Circle>

              <Box>
                <Text
                  fontSize="18px"
                  fontWeight="700"
                  color={DARK}
                >
                  {formatBalance(
                    currentBalance,
                    currentBalanceSide
                  )}
                </Text>

                <Text
                  fontSize="11px"
                  color={MUTED}
                >
                  Current Balance
                </Text>
              </Box>
            </HStack>
          </Flex>
        </Box>

        {/* ==================================================
            INFO CARDS
        ================================================== */}

        <SimpleGrid
          columns={{
            base: 1,
            md: 3,
          }}
          gap={3}
          mb={3}
          alignItems="stretch"
        >
          <InfoCard
            icon={LuBookOpen}
            title="Ledger Information"
            rows={[
              {
                label: "Ledger Name",
                value: ledgerName,
              },
              {
                label: "Ledger Code",
                value: ledgerCode,
              },
              {
                label: "Alias",
                value: alias,
              },
            ]}
          />

          <InfoCard
            icon={LuNetwork}
            title="Account Classification"
            rows={[
              {
                label: "Account Group",
                value: groupName,
              },
              {
                label: "Under Group",
                value: underGroupName,
              },
              {
                label: "Nature",
                value: nature,
              },
            ]}
          />

          <InfoCard
            icon={LuWallet}
            title="Balance Information"
            rows={[
              {
                label: "Opening Balance",
                value: formatBalance(
                  openingBalance,
                  openingBalanceSide
                ),
              },
              {
                label: "Balance As On",
                value: formatDate(
                  balanceAsOn
                ),
              },
              {
                label: "Current Balance",
                value: formatBalance(
                  currentBalance,
                  currentBalanceSide
                ),
                color: PRIMARY_MAROON,
              },
            ]}
          />
        </SimpleGrid>

        {/* ==================================================
            RECENT TRANSACTIONS
        ================================================== */}

        <Box
          border="1px solid"
          borderColor={BORDER}
          borderRadius="8px"
          bg="white"
          p={3}
        >
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
            mb={3}
          >
            <HStack gap={2}>
              <Icon
                as={LuClipboardList}
                boxSize={4}
                color={RED}
              />

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  color={DARK}
                >
                  Recent Transactions
                </Text>

                <Text
                  fontSize="10px"
                  color={MUTED}
                >
                  Latest entries posted to this
                  ledger
                </Text>
              </Box>
            </HStack>

            <Button
              size="sm"
              variant="outline"
              borderColor={PRIMARY_MAROON}
              color={PRIMARY_MAROON}
              bg="white"
              h="34px"
              px={3}
              fontSize="11px"
              borderRadius="6px"
              onClick={() =>
                navigate(
                  `/account-ledgers/${id}/transactions`
                )
              }
              _hover={{
                bg: "#FFF0F4",
              }}
            >
              View All Transactions
            </Button>
          </Flex>

          {/* TABLE */}

          <Box
            overflowX="auto"
            border="1px solid #E6EAF0"
            borderRadius="6px"
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Date",
                    "Voucher No.",
                    "Particulars",
                    "Type",
                    "Debit",
                    "Credit",
                    "Balance",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign:
                          [
                            "Debit",
                            "Credit",
                            "Balance",
                          ].includes(
                            heading
                          )
                            ? "right"
                            : heading ===
                                "Action"
                              ? "right"
                              : "left",
                        padding:
                          "9px 12px",
                        fontSize:
                          "11px",
                        fontWeight: 700,
                        color: DARK,
                        borderBottom:
                          "1px solid #E6EAF0",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {transactions.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding:
                          "30px",
                        textAlign:
                          "center",
                        color:
                          "#98A2B3",
                        fontSize:
                          "12px",
                      }}
                    >
                      No recent transactions
                      for this ledger.
                    </td>
                  </tr>
                ) : (
                  transactions.map(
                    (txn) => {
                      const type =
                        String(
                          pick(
                            txn,
                            [
                              "voucher_type",
                              "type",
                            ],
                            ""
                          )
                        ).toUpperCase();

                      const typeStyle =
                        voucherTypeStyle[
                          type
                        ] || {
                          bg: "#F2F4F7",
                          color:
                            "#667085",
                          label:
                            type ||
                            "—",
                        };

                      const debit =
                        Number(
                          pick(
                            txn,
                            ["debit"],
                            0
                          )
                        );

                      const credit =
                        Number(
                          pick(
                            txn,
                            ["credit"],
                            0
                          )
                        );

                      const balance =
                        Number(
                          pick(
                            txn,
                            [
                              "running_balance",
                              "balance",
                            ],
                            0
                          )
                        );

                      const balanceSide =
                        pick(
                          txn,
                          [
                            "balance_type",
                          ],
                          balance <
                            0
                            ? "CR"
                            : "DR"
                        );

                      return (
                        <tr
                          key={
                            txn.id
                          }
                          style={{
                            borderBottom:
                              "1px solid #F1F3F5",
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              color:
                                MUTED,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatDate(
                              pick(
                                txn,
                                [
                                  "date",
                                  "voucher_date",
                                ],
                                null
                              )
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              fontWeight: 600,
                              color:
                                DARK,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {pick(
                              txn,
                              [
                                "voucher_number",
                                "voucher_no",
                              ]
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              color:
                                "#344054",
                            }}
                          >
                            {pick(
                              txn,
                              [
                                "particulars",
                                "narration",
                              ]
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                            }}
                          >
                            <Badge
                              bg={
                                typeStyle.bg
                              }
                              color={
                                typeStyle.color
                              }
                              fontSize="9px"
                              px={2}
                              py={1}
                              borderRadius="full"
                            >
                              {
                                typeStyle.label
                              }
                            </Badge>
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              color:
                                DARK,
                              textAlign:
                                "right",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {debit
                              ? `₹ ${formatMoney(
                                  debit
                                )}`
                              : "—"}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              color:
                                DARK,
                              textAlign:
                                "right",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {credit
                              ? `₹ ${formatMoney(
                                  credit
                                )}`
                              : "—"}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              fontSize:
                                "11px",
                              fontWeight: 700,
                              color:
                                DARK,
                              textAlign:
                                "right",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatBalance(
                              balance,
                              balanceSide
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "10px 12px",
                              textAlign:
                                "right",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/account-ledgers/${id}/transactions/${txn.id}`
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "transparent",
                                color:
                                  RED,
                                cursor:
                                  "pointer",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  600,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                gap:
                                  "5px",
                              }}
                            >
                              <LuEye
                                size={14}
                              />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </Box>

          <Text
            fontSize="10px"
            color={MUTED}
            mt={2}
            textAlign="right"
          >
            Showing{" "}
            {transactions.length}{" "}
            recent transactions
          </Text>
        </Box>
      </Box>

      {/* ==================================================
          CLIENT FOOTER
      ================================================== */}

      <Footer />
    </Box>
  );
};

export default AccountLedgerViewPage;