// src/pages/AccountLedgerTransactionsPage.jsx

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
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Text,
  Badge,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuSearch,
  LuWallet,
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

const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

const formatBalance = (
  amount,
  side
) => {
  return `₹ ${formatMoney(amount)} ${
    String(side || "DR").toUpperCase() ===
    "CR"
      ? "Cr"
      : "Dr"
  }`;
};

const formatDate = (
  dateString
) => {
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
   PAGE
========================================================= */

const AccountLedgerTransactionsPage =
  () => {
    const { id } =
      useParams();

    const navigate =
      useNavigate();

    const [
      ledger,
      setLedger,
    ] = useState(null);

    const [
      transactions,
      setTransactions,
    ] = useState([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      typeFilter,
      setTypeFilter,
    ] = useState("ALL");

    const [
      currentPage,
      setCurrentPage,
    ] = useState(1);

    const pageSize = 10;

    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(() => {
      if (!id) {
        return;
      }

      const loadData =
        async () => {
          setLoading(true);

          try {
            const ledgerResponse =
              await getAccountLedger(
                id
              );

            const ledgerData =
              ledgerResponse?.data ??
              ledgerResponse ??
              null;

            setLedger(
              ledgerData
            );

            const transactionResponse =
              await listLedgerTransactions(
                id
              );

            const transactionData =
              transactionResponse?.data
                ?.results ??
              transactionResponse?.data ??
              transactionResponse ??
              [];

            setTransactions(
              Array.isArray(
                transactionData
              )
                ? transactionData
                : []
            );
          } catch (error) {
            console.error(
              "Error loading transactions:",
              error
            );

            const backendError =
              error?.response
                ?.data;

            toaster.create({
              title: "Error",
              description:
                backendError?.error ||
                backendError?.detail ||
                "Failed to load transactions.",
              type: "error",
              duration: 4000,
            });

            setTransactions(
              []
            );
          } finally {
            setLoading(false);
          }
        };

      loadData();
    }, [id]);

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredTransactions =
      useMemo(() => {
        let result = [
          ...transactions,
        ];

        const searchText =
          search
            .trim()
            .toLowerCase();

        if (searchText) {
          result =
            result.filter(
              (txn) => {
                const voucher =
                  String(
                    pick(
                      txn,
                      [
                        "voucher_number",
                        "voucher_no",
                      ],
                      ""
                    )
                  ).toLowerCase();

                const particulars =
                  String(
                    pick(
                      txn,
                      [
                        "particulars",
                        "narration",
                      ],
                      ""
                    )
                  ).toLowerCase();

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
                  ).toLowerCase();

                return (
                  voucher.includes(
                    searchText
                  ) ||
                  particulars.includes(
                    searchText
                  ) ||
                  type.includes(
                    searchText
                  )
                );
              }
            );
        }

        if (
          typeFilter !==
          "ALL"
        ) {
          result =
            result.filter(
              (txn) =>
                String(
                  pick(
                    txn,
                    [
                      "voucher_type",
                      "type",
                    ],
                    ""
                  )
                ).toUpperCase() ===
                typeFilter
            );
        }

        return result;
      }, [
        transactions,
        search,
        typeFilter,
      ]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filteredTransactions.length /
            pageSize
        )
      );

    const safePage =
      Math.min(
        currentPage,
        totalPages
      );

    const startIndex =
      (safePage - 1) *
      pageSize;

    const paginatedTransactions =
      filteredTransactions.slice(
        startIndex,
        startIndex +
          pageSize
      );

    useEffect(() => {
      setCurrentPage(1);
    }, [
      search,
      typeFilter,
    ]);

    /* =====================================================
       PAGE NUMBERS
    ===================================================== */

    const renderPages =
      () => {
        const pages = [];

        if (
          totalPages <= 5
        ) {
          for (
            let i = 1;
            i <= totalPages;
            i++
          ) {
            pages.push(i);
          }
        } else {
          pages.push(1);

          if (
            safePage > 3
          ) {
            pages.push(
              "..."
            );
          }

          const start =
            Math.max(
              2,
              safePage - 1
            );

          const end =
            Math.min(
              totalPages - 1,
              safePage + 1
            );

          for (
            let i = start;
            i <= end;
            i++
          ) {
            pages.push(i);
          }

          if (
            safePage <
            totalPages - 2
          ) {
            pages.push(
              "..."
            );
          }

          pages.push(
            totalPages
          );
        }

        return pages;
      };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
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
                borderTopColor={
                  RED
                }
                borderRadius="50%"
                animation="transactionSpin 1s linear infinite"
              />
            </Flex>

            <style>
              {`
                @keyframes transactionSpin {
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

    /* =====================================================
       LEDGER VALUES
    ===================================================== */

    const ledgerName =
      pick(
        ledger,
        [
          "ledger_name",
          "name",
        ],
        "Account Ledger"
      );

    const ledgerCode =
      pick(
        ledger,
        [
          "ledger_code",
          "code",
        ],
        "—"
      );

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <Navbar />

        {/* ==================================================
            MAIN
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
              color={
                PRIMARY_MAROON
              }
              cursor="pointer"
              onClick={() =>
                navigate(
                  "/account-ledgers"
                )
              }
            >
              Masters
            </Text>

            <Text>/</Text>

            <Text
              color={
                PRIMARY_MAROON
              }
              cursor="pointer"
              onClick={() =>
                navigate(
                  `/account-ledgers/${id}`
                )
              }
            >
              Account Ledger
            </Text>

            <Text>/</Text>

            <Text>
              Transactions
            </Text>
          </HStack>

          {/* ==================================================
              HEADER
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
                Transactions
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                {ledgerName}{" "}
                • {ledgerCode}
              </Text>
            </Box>

            <Button
              variant="outline"
              borderColor={
                PRIMARY_MAROON
              }
              color={
                PRIMARY_MAROON
              }
              bg="white"
              h="36px"
              px={4}
              fontSize="12px"
              borderRadius="6px"
              onClick={() =>
                navigate(
                  `/account-ledgers/${id}`
                )
              }
              _hover={{
                bg: "#FFF0F4",
              }}
            >
              <Icon
                as={LuArrowLeft}
                mr={2}
              />

              Back to Ledger
            </Button>
          </Flex>

          {/* ==================================================
              LEDGER SUMMARY
          ================================================== */}

          <Box
            border="1px solid"
            borderColor={
              BORDER
            }
            borderRadius="8px"
            bg="white"
            p={3}
            mb={3}
          >
            <HStack
              gap={3}
              align="center"
            >
              <Box
                w="42px"
                h="42px"
                borderRadius="7px"
                bg="#FFF0F4"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon
                  as={LuWallet}
                  boxSize={5}
                  color={RED}
                />
              </Box>

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  color={DARK}
                >
                  {ledgerName}
                </Text>

                <Text
                  fontSize="10px"
                  color={MUTED}
                >
                  Ledger Code:{" "}
                  {ledgerCode}
                </Text>
              </Box>
            </HStack>
          </Box>

          {/* ==================================================
              TABLE CARD
          ================================================== */}

          <Box
            border="1px solid"
            borderColor={
              BORDER
            }
            borderRadius="8px"
            bg="white"
            p={3}
          >
            {/* ==================================================
                SEARCH / FILTER
            ================================================== */}

            <Flex
              gap={3}
              mb={3}
              direction={{
                base: "column",
                md: "row",
              }}
            >
              {/* SEARCH */}

              <Box
                position="relative"
                flex="1"
                maxW={{
                  base: "100%",
                  md: "400px",
                }}
              >
                <Icon
                  as={LuSearch}
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={MUTED}
                  zIndex={1}
                  boxSize={4}
                />

                <Input
                  value={
                    search
                  }
                  onChange={(
                    e
                  ) =>
                    setSearch(
                      e.target
                        .value
                    )
                  }
                  placeholder="Search voucher, particulars or type"
                  pl="38px"
                  h="38px"
                  borderColor={
                    BORDER
                  }
                  borderRadius="6px"
                  fontSize="12px"
                  _focus={{
                    borderColor:
                      PRIMARY_MAROON,
                    boxShadow:
                      `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              {/* TYPE */}

              <Box
                position="relative"
                width={{
                  base: "100%",
                  md: "190px",
                }}
              >
                <select
                  value={
                    typeFilter
                  }
                  onChange={(
                    e
                  ) =>
                    setTypeFilter(
                      e.target
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      "38px",
                    border:
                      "1px solid #DCE2EA",
                    borderRadius:
                      "6px",
                    padding:
                      "0 35px 0 11px",
                    fontSize:
                      "12px",
                    background:
                      "white",
                    color:
                      DARK,
                    outline:
                      "none",
                    cursor:
                      "pointer",
                    appearance:
                      "none",
                  }}
                >
                  <option value="ALL">
                    All Types
                  </option>

                  <option value="RECEIPT">
                    Receipt
                  </option>

                  <option value="PAYMENT">
                    Payment
                  </option>

                  <option value="OPENING">
                    Opening
                  </option>

                  <option value="JOURNAL">
                    Journal
                  </option>
                </select>

                <Icon
                  as={
                    LuChevronDown
                  }
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              {/* RESET */}

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() => {
                  setSearch(
                    ""
                  );

                  setTypeFilter(
                    "ALL"
                  );
                }}
              >
                <Icon
                  as={
                    LuFilter
                  }
                  mr={2}
                  boxSize={4}
                />

                Filter
              </Button>
            </Flex>

            {/* ==================================================
                TRANSACTION TABLE
            ================================================== */}

            <Box
              overflowX="auto"
              border="1px solid #E6EAF0"
              borderRadius="6px"
            >
              <table
                style={{
                  width:
                    "100%",
                  minWidth:
                    "1050px",
                  borderCollapse:
                    "collapse",
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
                    ].map(
                      (
                        heading
                      ) => (
                        <th
                          key={
                            heading
                          }
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
                              "10px 12px",

                            fontSize:
                              "11px",

                            fontWeight:
                              700,

                            color:
                              DARK,

                            borderBottom:
                              "1px solid #E6EAF0",

                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            heading
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {paginatedTransactions.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        style={{
                          padding:
                            "40px",
                          textAlign:
                            "center",
                          color:
                            "#98A2B3",
                          fontSize:
                            "12px",
                        }}
                      >
                        No transactions
                        found.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map(
                      (
                        txn
                      ) => {
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
                            bg:
                              "#F2F4F7",
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
                              [
                                "debit",
                              ],
                              0
                            )
                          );

                        const credit =
                          Number(
                            pick(
                              txn,
                              [
                                "credit",
                              ],
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
                            {/* DATE */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
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

                            {/* VOUCHER */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  600,
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

                            {/* PARTICULARS */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                fontSize:
                                  "11px",
                                color:
                                  "#344054",
                                maxWidth:
                                  "300px",
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

                            {/* TYPE */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
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

                            {/* DEBIT */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
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

                            {/* CREDIT */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
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

                            {/* BALANCE */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  700,
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

                            {/* ACTION */}

                            <td
                              style={{
                                padding:
                                  "11px 12px",
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
                                  size={
                                    14
                                  }
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

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <Flex
              justify="space-between"
              align="center"
              mt={3}
              gap={3}
              direction={{
                base: "column",
                md: "row",
              }}
            >
              <Text
                fontSize="11px"
                color={MUTED}
              >
                {filteredTransactions.length ===
                0
                  ? "Showing 0 transactions"
                  : `Showing ${
                      startIndex +
                      1
                    }–${Math.min(
                      startIndex +
                        paginatedTransactions.length,
                      filteredTransactions.length
                    )} of ${
                      filteredTransactions.length
                    } transactions`}
              </Text>

              <HStack gap={1}>
                {/* PREVIOUS */}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={
                    BORDER
                  }
                  color={MUTED}
                  disabled={
                    safePage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        1,
                        safePage -
                          1
                      )
                    )
                  }
                >
                  <Icon
                    as={
                      LuChevronLeft
                    }
                    boxSize={3.5}
                  />

                  Previous
                </Button>

                {/* NUMBERS */}

                {renderPages().map(
                  (
                    page,
                    index
                  ) =>
                    page ===
                    "..." ? (
                      <Text
                        key={`dots-${index}`}
                        px={1.5}
                        fontSize="11px"
                        color={
                          MUTED
                        }
                      >
                        ...
                      </Text>
                    ) : (
                      <Button
                        key={
                          page
                        }
                        size="xs"
                        h="30px"
                        minW="30px"
                        variant={
                          page ===
                          safePage
                            ? "solid"
                            : "outline"
                        }
                        bg={
                          page ===
                          safePage
                            ? PRIMARY_MAROON
                            : "white"
                        }
                        color={
                          page ===
                          safePage
                            ? "white"
                            : "#344054"
                        }
                        borderColor={
                          page ===
                          safePage
                            ? PRIMARY_MAROON
                            : BORDER
                        }
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        _hover={{
                          bg:
                            page ===
                            safePage
                              ? "#650A18"
                              : "#FFF0F4",
                        }}
                      >
                        {
                          page
                        }
                      </Button>
                    )
                )}

                {/* NEXT */}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#FF5A7D"
                  color={RED}
                  disabled={
                    safePage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        totalPages,
                        safePage +
                          1
                      )
                    )
                  }
                >
                  Next

                  <Icon
                    as={
                      LuChevronRight
                    }
                    ml={1}
                    boxSize={3.5}
                  />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <Footer />
      </Box>
    );
  };

export default AccountLedgerTransactionsPage;