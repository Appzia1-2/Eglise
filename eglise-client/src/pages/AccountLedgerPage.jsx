
// src/admin/pages/AccountLedgerPage.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
  Badge,
} from "@chakra-ui/react";

import {
  LuPlus,
  LuSearch,
  LuBookOpen,
  LuFileCheck2,
  LuArrowDownToLine,
  LuArrowUpFromLine,
  LuEye,
  LuPencil,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuFilter,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listAccountLedgers,
  listAccountGroups,
} from "../api/registryServices";

/* =========================================================
   COLORS
========================================================= */

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 5;

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
          acc == null ? acc : acc[k],
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

const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

const formatBalanceWithSide = (
  amount,
  explicitType
) => {
  const value = Number(amount || 0);

  const side =
    explicitType ||
    (value < 0 ? "CR" : "DR");

  return `₹ ${formatMoney(
    Math.abs(value)
  )} ${
    side === "CR" ? "Cr" : "Dr"
  }`;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
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
   STAT CARD
   Matches Grade Master / Tomb Fees style
========================================================= */

const StatCard = ({
  icon,
  title,
  value,
}) => {
  return (
    <Box
      border={`1px solid ${BORDER}`}
      borderRadius="8px"
      h="78px"
      px={4}
      bg="white"
      display="flex"
      alignItems="center"
    >
      <Flex
        align="center"
        width="100%"
        height="100%"
      >
        <Box
          width="65px"
          height="100%"
          borderRight={`1px solid ${BORDER}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon
            as={icon}
            boxSize={7}
            color={RED}
            strokeWidth={1.6}
          />
        </Box>

        <Box pl={4}>
          <Text
            fontSize="12px"
            color={DARK}
            mb={1}
            fontWeight="600"
          >
            {title}
          </Text>

          <Text
            fontSize={
              typeof value === "string" &&
              value.length > 15
                ? "18px"
                : "24px"
            }
            fontWeight="700"
            color={DARK}
            lineHeight="1"
            whiteSpace="nowrap"
          >
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountLedgerPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] =
    useState(true);

  const [ledgers, setLedgers] =
    useState([]);

  const [groups, setGroups] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [groupFilter, setGroupFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [page, setPage] =
    useState(1);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [
        ledgersRes,
        groupsRes,
      ] = await Promise.all([
        listAccountLedgers(),
        listAccountGroups(),
      ]);

      const ledgersData =
        ledgersRes?.data?.results ||
        ledgersRes?.data ||
        [];

      const groupsData =
        groupsRes?.data?.results ||
        groupsRes?.data ||
        [];

      setLedgers(
        Array.isArray(ledgersData)
          ? ledgersData
          : []
      );

      setGroups(
        Array.isArray(groupsData)
          ? groupsData
          : []
      );
    } catch (error) {
      console.error(
        "Error fetching account ledgers:",
        error
      );

      setLedgers([]);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =======================================================
     ENRICH LEDGERS
  ======================================================= */

  const enrichedLedgers = useMemo(() => {
    return ledgers.map((ledger) => {
      const groupId =
        ledger.account_group?.id ??
        ledger.account_group;

      const groupObj =
        groups.find(
          (group) =>
            String(group.id) ===
            String(groupId)
        );

      return {
        ...ledger,

        account_group_id:
          groupId,

        account_group_name:
          ledger.account_group_name ||
          groupObj?.group_name ||
          "—",

        is_active:
          ledger.status ??
          ledger.is_active ??
          true,
      };
    });
  }, [ledgers, groups]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const totalLedgers =
      enrichedLedgers.length;

    const activeLedgers =
      enrichedLedgers.filter(
        (ledger) =>
          ledger.is_active
      ).length;

    const debitTotal =
      enrichedLedgers.reduce(
        (sum, ledger) => {
          const balance = Number(
            pick(
              ledger,
              [
                "current_balance",
                "closing_balance",
              ],
              0
            )
          );

          const side = pick(
            ledger,
            [
              "current_balance_type",
              "balance_type",
            ],
            balance < 0
              ? "CR"
              : "DR"
          );

          if (
            side === "DR" ||
            side === "Dr"
          ) {
            return (
              sum +
              Math.abs(balance)
            );
          }

          return sum;
        },
        0
      );

    const creditTotal =
      enrichedLedgers.reduce(
        (sum, ledger) => {
          const balance = Number(
            pick(
              ledger,
              [
                "current_balance",
                "closing_balance",
              ],
              0
            )
          );

          const side = pick(
            ledger,
            [
              "current_balance_type",
              "balance_type",
            ],
            balance < 0
              ? "CR"
              : "DR"
          );

          if (
            side === "CR" ||
            side === "Cr"
          ) {
            return (
              sum +
              Math.abs(balance)
            );
          }

          return sum;
        },
        0
      );

    return {
      totalLedgers,
      activeLedgers,
      debitTotal,
      creditTotal,
    };
  }, [enrichedLedgers]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredLedgers =
    useMemo(() => {
      return enrichedLedgers.filter(
        (ledger) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            !search ||
            [
              ledger.ledger_name,
              ledger.ledger_code,
              ledger.alias,
            ]
              .filter(Boolean)
              .some((field) =>
                String(field)
                  .toLowerCase()
                  .includes(search)
              );

          const matchesGroup =
            !groupFilter ||
            String(
              ledger.account_group_id
            ) === String(groupFilter);

          const matchesStatus =
            !statusFilter ||
            (
              statusFilter ===
                "ACTIVE" &&
              ledger.is_active
            ) ||
            (
              statusFilter ===
                "INACTIVE" &&
              !ledger.is_active
            );

          return (
            matchesSearch &&
            matchesGroup &&
            matchesStatus
          );
        }
      );
    }, [
      enrichedLedgers,
      searchTerm,
      groupFilter,
      statusFilter,
    ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalCount =
    filteredLedgers.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalCount / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    PAGE_SIZE;

  const paginatedLedgers =
    filteredLedgers.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  const rangeStart =
    totalCount === 0
      ? 0
      : startIndex + 1;

  const rangeEnd = Math.min(
    startIndex +
      paginatedLedgers.length,
    totalCount
  );

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    groupFilter,
    statusFilter,
  ]);

  /* =======================================================
     PAGE NUMBERS
  ======================================================= */

  const pageNumbers = useMemo(() => {
    const pages = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (safePage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      safePage - 1
    );

    const end = Math.min(
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
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [
    safePage,
    totalPages,
  ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleAdd = () => {
    navigate(
      "/account-ledgers/add"
    );
  };

  const handleView = (ledger) => {
    navigate(
      `/account-ledgers/${ledger.id}`
    );
  };

  const handleEdit = (ledger) => {
    navigate(
      `/account-ledgers/${ledger.id}/edit`
    );
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
          NAVBAR
      ================================================= */}

      <Navbar />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

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
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="11px"
          >
            <Text
              color={PRIMARY_MAROON}
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

            <Text>
              Account Ledger Master
            </Text>
          </HStack>

          {/* =================================================
              HEADER
          ================================================= */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap={3}
            mb={3}
            direction={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                ACCOUNT LEDGER MASTER
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
                Account Ledger Master
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage account ledgers,
                balances and account
                classifications.
              </Text>
            </Box>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="38px"
              fontSize="12px"
              borderRadius="6px"
              flexShrink={0}
              onClick={handleAdd}
              _hover={{
                bg: "#650A18",
              }}
            >
              <Icon
                as={LuPlus}
                mr={2}
                boxSize={4}
              />

              Add Account Ledger
            </Button>
          </Flex>

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <SimpleGrid
            columns={{
              base: 1,
              md: 2,
              xl: 4,
            }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuBookOpen}
              title="Total Ledgers"
              value={
                stats.totalLedgers
              }
            />

            <StatCard
              icon={LuFileCheck2}
              title="Active Ledgers"
              value={
                stats.activeLedgers
              }
            />

            <StatCard
              icon={
                LuArrowDownToLine
              }
              title="Debit Balances"
              value={`₹ ${formatMoney(
                stats.debitTotal
              )}`}
            />

            <StatCard
              icon={
                LuArrowUpFromLine
              }
              title="Credit Balances"
              value={`₹ ${formatMoney(
                stats.creditTotal
              )}`}
            />
          </SimpleGrid>

          {/* =================================================
              TABLE CARD
          ================================================= */}

          <Box
            border={`1px solid ${BORDER}`}
            borderRadius="8px"
            p={3}
            bg="white"
            w="100%"
          >
            {/* =================================================
                SEARCH / FILTER
            ================================================= */}

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
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(
                      e.target.value
                    );
                    setPage(1);
                  }}
                  placeholder="Search ledger, code or alias"
                  pl="38px"
                  h="38px"
                  borderColor={BORDER}
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

              {/* ACCOUNT GROUP */}

              <Box
                position="relative"
                width={{
                  base: "100%",
                  md: "210px",
                }}
              >
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(
                      e.target.value
                    );
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: "38px",
                    border:
                      `1px solid ${BORDER}`,
                    borderRadius: "6px",
                    padding:
                      "0 35px 0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">
                    All Account Groups
                  </option>

                  {groups.map(
                    (group) => (
                      <option
                        key={group.id}
                        value={group.id}
                      >
                        {
                          group.group_name
                        }
                      </option>
                    )
                  )}
                </select>

                <Icon
                  as={LuChevronDown}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              {/* STATUS */}

              <Box
                position="relative"
                width={{
                  base: "100%",
                  md: "170px",
                }}
              >
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: "38px",
                    border:
                      `1px solid ${BORDER}`,
                    borderRadius: "6px",
                    padding:
                      "0 35px 0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

                <Icon
                  as={LuChevronDown}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              {/* FILTER / RESET */}

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() => {
                  setSearchTerm("");
                  setGroupFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
              >
                <Icon
                  as={LuFilter}
                  mr={2}
                  boxSize={4}
                />

                Filter
              </Button>
            </Flex>

            {/* =================================================
                TABLE
            ================================================= */}

            <Box
              overflowX="auto"
              overflowY="hidden"
              border={`1px solid #E6EAF0`}
              borderRadius="6px"
              width="100%"
            >
              <Box
                as="table"
                width="100%"
                minW="1050px"
                borderCollapse="collapse"
              >
                {/* TABLE HEADER */}

                <Box as="thead">
                  <Box
                    as="tr"
                    height="42px"
                  >
                    {[
                      "Ledger Name",
                      "Ledger Code",
                      "Alias",
                      "Account Group",
                      "Opening Balance",
                      "Current Balance",
                      "Status",
                      "Last Updated",
                      "Actions",
                    ].map(
                      (heading) => (
                        <Box
                          as="th"
                          key={heading}
                          textAlign={
                            heading ===
                            "Actions"
                              ? "right"
                              : heading ===
                                  "Opening Balance" ||
                                heading ===
                                  "Current Balance"
                              ? "right"
                              : "left"
                          }
                          px={4}
                          py={2}
                          fontSize="11px"
                          fontWeight="700"
                          color={DARK}
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                          bg="white"
                        >
                          {heading}
                        </Box>
                      )
                    )}
                  </Box>
                </Box>

                {/* TABLE BODY */}

                <Box as="tbody">
                  {isLoading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={9}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading account
                        ledgers...
                      </Box>
                    </Box>
                  ) : paginatedLedgers.length ===
                    0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={9}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No account
                        ledgers found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedLedgers.map(
                      (ledger) => (
                        <Box
                          as="tr"
                          key={ledger.id}
                          height="42px"
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* LEDGER NAME */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            fontWeight="600"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            <HStack
                              gap={2}
                            >
                              <Icon
                                as={
                                  LuBookOpen
                                }
                                boxSize={3.5}
                                color={RED}
                              />

                              <Text>
                                {pick(
                                  ledger,
                                  [
                                    "ledger_name",
                                  ]
                                )}
                              </Text>
                            </HStack>
                          </Box>

                          {/* LEDGER CODE */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {pick(
                              ledger,
                              [
                                "ledger_code",
                              ]
                            )}
                          </Box>

                          {/* ALIAS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {pick(
                              ledger,
                              ["alias"]
                            )}
                          </Box>

                          {/* ACCOUNT GROUP */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {
                              ledger.account_group_name
                            }
                          </Box>

                          {/* OPENING BALANCE */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                            textAlign="right"
                          >
                            {formatBalanceWithSide(
                              pick(
                                ledger,
                                [
                                  "op_balance",
                                  "opening_balance",
                                ],
                                0
                              ),
                              pick(
                                ledger,
                                [
                                  "op_balance_type",
                                  "opening_balance_type",
                                ],
                                null
                              )
                            )}
                          </Box>

                          {/* CURRENT BALANCE */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            fontWeight="600"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                            textAlign="right"
                          >
                            {formatBalanceWithSide(
                              pick(
                                ledger,
                                [
                                  "current_balance",
                                  "closing_balance",
                                ],
                                0
                              ),
                              pick(
                                ledger,
                                [
                                  "current_balance_type",
                                  "balance_type",
                                ],
                                null
                              )
                            )}
                          </Box>

                          {/* STATUS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <Badge
                              bg={
                                ledger.is_active
                                  ? "green.50"
                                  : "gray.100"
                              }
                              color={
                                ledger.is_active
                                  ? "green.600"
                                  : "gray.600"
                              }
                              fontSize="10px"
                              px={2}
                              py={1}
                              borderRadius="full"
                              fontWeight="600"
                            >
                              {ledger.is_active
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </Box>

                          {/* LAST UPDATED */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {formatDate(
                              pick(
                                ledger,
                                [
                                  "updated_at",
                                  "last_updated",
                                ],
                                null
                              )
                            )}
                          </Box>

                          {/* ACTIONS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <HStack
                              gap={2}
                              justify="flex-end"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  handleView(
                                    ledger
                                  )
                                }
                                _hover={{
                                  bg: "#FFF0F4",
                                }}
                              >
                                <Icon
                                  as={LuEye}
                                  mr={1}
                                  boxSize={3.5}
                                />

                                View
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  handleEdit(
                                    ledger
                                  )
                                }
                                _hover={{
                                  bg: "#FFF0F4",
                                }}
                              >
                                <Icon
                                  as={LuPencil}
                                  mr={1}
                                  boxSize={3.5}
                                />

                                Edit
                              </Button>
                            </HStack>
                          </Box>
                        </Box>
                      )
                    )
                  )}
                </Box>
              </Box>
            </Box>

            {/* =================================================
                PAGINATION
            ================================================= */}

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
              {/* COUNT */}

              <Text
                fontSize="11px"
                color={MUTED}
              >
                {totalCount === 0
                  ? "Showing 0 account ledgers"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} account ledgers`}
              </Text>

              {/* PAGINATION */}

              <HStack gap={1}>
                {/* PREVIOUS */}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  isDisabled={
                    safePage === 1
                  }
                  onClick={() =>
                    setPage(
                      Math.max(
                        1,
                        safePage - 1
                      )
                    )
                  }
                >
                  <Icon
                    as={LuChevronLeft}
                    boxSize={3.5}
                  />

                  Previous
                </Button>

                {/* PAGE NUMBERS */}

                {pageNumbers.map(
                  (num, index) =>
                    num === "..." ? (
                      <Text
                        key={`dots-${index}`}
                        px={1.5}
                        fontSize="11px"
                        color={MUTED}
                      >
                        ...
                      </Text>
                    ) : (
                      <Button
                        key={num}
                        size="xs"
                        h="30px"
                        minW="30px"
                        variant={
                          num === safePage
                            ? "solid"
                            : "outline"
                        }
                        bg={
                          num === safePage
                            ? PRIMARY_MAROON
                            : "white"
                        }
                        color={
                          num === safePage
                            ? "white"
                            : "#344054"
                        }
                        borderColor={
                          num === safePage
                            ? PRIMARY_MAROON
                            : BORDER
                        }
                        onClick={() =>
                          setPage(num)
                        }
                        _hover={{
                          bg:
                            num === safePage
                              ? "#650A18"
                              : "#FFF0F4",
                        }}
                      >
                        {num}
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
                  isDisabled={
                    safePage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      Math.min(
                        totalPages,
                        safePage + 1
                      )
                    )
                  }
                >
                  Next

                  <Icon
                    as={LuChevronRight}
                    ml={1}
                    boxSize={3.5}
                  />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </Box>
  );
};

export default AccountLedgerPage;

