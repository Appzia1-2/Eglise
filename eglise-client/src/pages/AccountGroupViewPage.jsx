
// src/pages/AccountGroupViewPage.jsx

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
  HStack,
  Button,
  Text,
  Input,
  Flex,
  Grid,
  Icon,
  Badge,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuPencil,
  LuNetwork,
  LuFileText,
  LuIndianRupee,
  LuSearch,
  LuChevronDown,
  LuChevronRight,
  LuEye,
  LuList,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getAccountGroup,
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
const SUB_GROUP_BLUE = "#3182ce";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹ 0";
  }

  return `₹ ${number.toLocaleString("en-IN")}`;
};

const treeFor = (rootId, allGroups) => {
  return allGroups.filter(
    (group) =>
      String(
        group.under_group?.id ??
          group.under_group
      ) === String(rootId)
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  accent = RED,
}) => (
  <Flex
    align="center"
    gap={3}
    px={4}
    borderLeft="1px solid"
    borderColor={BORDER}
    height="100%"
  >
    <Flex
      align="center"
      justify="center"
      boxSize="42px"
      borderRadius="full"
      bg="#FFF0F4"
      color={accent}
      flexShrink={0}
    >
      <Icon as={icon} boxSize={5} />
    </Flex>

    <Box>
      <Text
        fontSize="22px"
        fontWeight="700"
        color={DARK}
        lineHeight="1.1"
      >
        {value}
      </Text>

      <Text
        fontSize="11px"
        color={MUTED}
        mt={0.5}
      >
        {title}
      </Text>
    </Box>
  </Flex>
);

/* =========================================================
   HIERARCHY ROW
========================================================= */

const HierarchyRow = ({
  row,
  onToggle,
  onViewLedger,
}) => {
  const isGroup = row.kind === "group";
  const isRoot = row.depth === 0;

  return (
    <Flex
      align="center"
      minH="48px"
      px={4}
      bg={isRoot ? "#FFF5F7" : "white"}
      borderBottom="1px solid #EDF1F6"
      _hover={{
        bg: isRoot
          ? "#FFF5F7"
          : "#FFFBFC",
      }}
    >
      {/* ACCOUNT / LEDGER */}

      <HStack
        spacing={2}
        pl={`${row.depth * 26}px`}
        flex="1"
        minW={0}
      >
        {isGroup ? (
          <Flex
            align="center"
            justify="center"
            boxSize="22px"
            borderRadius="4px"
            border="1px solid"
            borderColor={BORDER}
            bg="white"
            cursor="pointer"
            onClick={() =>
              onToggle(row.id)
            }
            flexShrink={0}
          >
            <Icon
              as={
                row.expanded
                  ? LuChevronDown
                  : LuChevronRight
              }
              boxSize={3.5}
              color={DARK}
            />
          </Flex>
        ) : (
          <Box
            w="22px"
            flexShrink={0}
          />
        )}

        <Icon
          as={
            isGroup
              ? LuNetwork
              : LuFileText
          }
          boxSize={4}
          color={
            isGroup
              ? PRIMARY_MAROON
              : SUB_GROUP_BLUE
          }
          flexShrink={0}
        />

        <Text
          fontSize="12px"
          fontWeight={
            isGroup
              ? "600"
              : "500"
          }
          color={DARK}
          noOfLines={1}
        >
          {row.name}
        </Text>

        {isGroup && !isRoot && (
          <Badge
            bg="#EAF2FB"
            color="#2B6CB0"
            fontSize="9px"
            px={2}
            py={0.5}
            borderRadius="4px"
          >
            Sub Group
          </Badge>
        )}

        {isRoot && (
          <Badge
            bg="green.50"
            color="green.600"
            fontSize="9px"
            px={2}
            py={0.5}
            borderRadius="full"
          >
            Active
          </Badge>
        )}
      </HStack>

      {/* CODE */}

      <Text
        fontSize="12px"
        color="#344054"
        w="140px"
        flexShrink={0}
      >
        {row.code}
      </Text>

      {/* TYPE */}

      <Text
        fontSize="12px"
        color="#344054"
        w="140px"
        flexShrink={0}
      >
        {row.type}
      </Text>

      {/* BALANCE / COUNT */}

      <Text
        fontSize="12px"
        color={DARK}
        fontWeight={
          isGroup
            ? "600"
            : "500"
        }
        w="140px"
        flexShrink={0}
      >
        {row.balance}
      </Text>

      {/* ACTIONS */}

      <Box
        w="90px"
        flexShrink={0}
        textAlign="right"
      >
        {!isGroup && (
          <Button
            variant="ghost"
            size="sm"
            h="28px"
            px={2}
            fontSize="11px"
            color={RED}
            onClick={() =>
              onViewLedger(row)
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
        )}
      </Box>
    </Flex>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountGroupViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] =
    useState(null);

  const [allGroups, setAllGroups] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [expanded, setExpanded] =
    useState(() => new Set());

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const [
          detailRes,
          listRes,
        ] = await Promise.all([
          getAccountGroup(id),
          listAccountGroups(),
        ]);

        const detail =
          detailRes?.data ??
          detailRes;

        const listRaw =
          listRes?.data ??
          listRes;

        const list = Array.isArray(
          listRaw
        )
          ? listRaw
          : Array.isArray(
              listRaw?.results
            )
          ? listRaw.results
          : [];

        if (!cancelled) {
          setGroup(detail);
          setAllGroups(list);

          if (detail?.id) {
            setExpanded(
              new Set([
                String(detail.id),
              ])
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load account group:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================================================
     SUMMARY COUNTS
  ========================================================= */

  const subGroupsCount = useMemo(() => {
    if (!group?.id) {
      return 0;
    }

    return allGroups.filter(
      (item) =>
        String(
          item.under_group?.id ??
            item.under_group
        ) === String(group.id)
    ).length;
  }, [allGroups, group]);

  const linkedLedgersCount =
    useMemo(() => {
      return Number(
        group?.ledgers_count ??
          group?.linked_ledgers_count ??
          0
      );
    }, [group]);

  const totalBalance = useMemo(() => {
    return (
      group?.total_balance ??
      0
    );
  }, [group]);

  /* =========================================================
     BUILD HIERARCHY ROWS
  ========================================================= */

  const treeRows = useMemo(() => {
    if (!group) {
      return [];
    }

    const rows = [];

    const walk = (
      node,
      depth
    ) => {
      const nodeId =
        String(node.id);

      const childGroups =
        treeFor(
          node.id,
          allGroups
        );

      rows.push({
        id: nodeId,
        kind: "group",
        depth,
        name:
          node.group_name ||
          "Unnamed Group",

        code: node.group_code
          ? `ACG-${node.group_code}`
          : node.account_code
          ? `ACG-${node.account_code}`
          : "—",

        type:
          depth === 0
            ? "Account Group"
            : "Sub Group",

        balance: `${
          node.ledgers_count ??
          0
        } Ledgers`,

        raw: node,

        expanded:
          expanded.has(nodeId),
      });

      if (
        !expanded.has(nodeId)
      ) {
        return;
      }

      /* SUB GROUPS */

      childGroups.forEach(
        (child) => {
          walk(
            child,
            depth + 1
          );
        }
      );

      /* EMBEDDED LEDGERS */

      const ledgers =
        Array.isArray(
          node.ledgers
        )
          ? node.ledgers
          : [];

      ledgers.forEach(
        (ledger) => {
          rows.push({
            id: `ledger-${ledger.id}`,
            kind: "ledger",
            depth:
              depth + 1,

            name:
              ledger.ledger_name ||
              ledger.name ||
              "Unnamed Ledger",

            code:
              ledger.ledger_code
                ? `LDG-${ledger.ledger_code}`
                : "—",

            type:
              ledger.ledger_type ||
              "Ledger",

            balance:
              formatCurrency(
                ledger.balance ??
                  ledger.op_balance ??
                  0
              ),

            raw: ledger,
          });
        }
      );
    };

    walk(group, 0);

    /* SEARCH */

    const term =
      search.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter(
      (row) =>
        [
          row.name,
          row.code,
          row.type,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term)
          )
    );
  }, [
    group,
    allGroups,
    expanded,
    search,
  ]);

  /* =========================================================
     TOGGLE
  ========================================================= */

  const toggleExpand = (
    nodeId
  ) => {
    setExpanded((previous) => {
      const next = new Set(
        previous
      );

      if (
        next.has(nodeId)
      ) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  };

  /* =========================================================
     EXPAND ALL
  ========================================================= */

  const handleExpandAll =
    () => {
      const ids = new Set(
        allGroups.map(
          (item) =>
            String(item.id)
        )
      );

      if (group?.id) {
        ids.add(
          String(group.id)
        );
      }

      setExpanded(ids);
    };

  /* =========================================================
     COLLAPSE ALL
  ========================================================= */

  const handleCollapseAll =
    () => {
      setExpanded(
        new Set()
      );
    };

  /* =========================================================
     RENDER
  ========================================================= */

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
        px={{
          base: 3,
          md: 6,
        }}
        py={4}
      >
        {/* =====================================================
            BREADCRUMB
        ===================================================== */}

        <HStack
          spacing={2}
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

          <Text
            color={PRIMARY_MAROON}
            cursor="pointer"
            onClick={() =>
              navigate(
                "/account-groups"
              )
            }
          >
            Account Groups
          </Text>

          <Text>/</Text>

          <Text>
            {group?.group_code ||
              group?.account_code ||
              "—"}
          </Text>
        </HStack>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <Flex
          justify="space-between"
          align="flex-start"
          gap={3}
          mb={4}
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
              ACCOUNT GROUPS
            </Text>

            <Heading
              fontSize={{
                base: "22px",
                md: "26px",
              }}
              color={DARK}
              lineHeight="1.1"
              mb={1}
            >
              Account Group Details
            </Heading>

            <Text
              fontSize="11px"
              color={MUTED}
            >
              View account group
              information, subgroups
              and linked ledgers.
            </Text>
          </Box>

          <HStack spacing={2}>
            <Button
              variant="outline"
              h="38px"
              px={5}
              fontSize="12px"
              borderColor={
                PRIMARY_MAROON
              }
              color={
                PRIMARY_MAROON
              }
              borderRadius="6px"
              onClick={() =>
                navigate(
                  "/account-groups"
                )
              }
            >
              <Icon
                as={LuArrowLeft}
                mr={2}
                boxSize={4}
              />
              Back
            </Button>

            <Button
              bg={
                PRIMARY_MAROON
              }
              color="white"
              h="38px"
              px={5}
              fontSize="12px"
              borderRadius="6px"
              _hover={{
                bg: "#650A18",
              }}
              onClick={() =>
                navigate(
                  `/account-groups/${id}/edit`
                )
              }
            >
              <Icon
                as={LuPencil}
                mr={2}
                boxSize={4}
              />
              Edit Account Group
            </Button>
          </HStack>
        </Flex>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        {isLoading ||
        !group ? (
          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="10px"
            p={6}
            mb={4}
            textAlign="center"
            color={MUTED}
            fontSize="12px"
          >
            Loading account
            group...
          </Box>
        ) : (
          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="10px"
            mb={4}
            overflow="hidden"
          >
            <Grid
              templateColumns={{
                base: "1fr",
                md:
                  "1.4fr 1fr 1fr 1fr",
              }}
            >
              {/* IDENTITY */}

              <Flex
                align="center"
                gap={4}
                px={6}
                py={4}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="64px"
                  borderRadius="10px"
                  bg="#FFF0F4"
                  color={RED}
                  flexShrink={0}
                >
                  <Icon
                    as={LuNetwork}
                    boxSize={8}
                  />
                </Flex>

                <Box minW={0}>
                  <Heading
                    fontSize="22px"
                    color={DARK}
                    lineHeight="1.1"
                    mb={1}
                    noOfLines={1}
                  >
                    {group.group_name ||
                      "Account Group"}
                  </Heading>

                  <HStack
                    spacing={2}
                    fontSize="11px"
                    color={MUTED}
                    flexWrap="wrap"
                  >
                    <Text
                      fontWeight="600"
                    >
                      {group.group_code ||
                      group.account_code
                        ? `ACG-${
                            group.group_code ||
                            group.account_code
                          }`
                        : "—"}
                    </Text>

                    <Text>•</Text>

                    <Text>
                      Under:{" "}
                      {group.under_group_name ||
                        "—"}
                    </Text>

                    <Badge
                      bg={
                        group.status
                          ? "green.50"
                          : "gray.100"
                      }
                      color={
                        group.status
                          ? "green.600"
                          : "gray.600"
                      }
                      fontSize="10px"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {group.status
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </HStack>
                </Box>
              </Flex>

              {/* SUB GROUPS */}

              <SummaryCard
                icon={LuNetwork}
                title="Sub Groups"
                value={
                  subGroupsCount
                }
              />

              {/* LINKED LEDGERS */}

              <SummaryCard
                icon={LuFileText}
                title="Linked Ledgers"
                value={
                  linkedLedgersCount
                }
              />

              {/* TOTAL BALANCE */}

              <SummaryCard
                icon={
                  LuIndianRupee
                }
                title="Total Balance"
                value={formatCurrency(
                  totalBalance
                )}
              />
            </Grid>
          </Box>
        )}

        {/* =====================================================
            HIERARCHY
        ===================================================== */}

        <Box
          border="1px solid"
          borderColor={BORDER}
          borderRadius="10px"
          overflow="hidden"
        >
          {/* HEADER STRIP */}

          <Flex
            align="center"
            justify="space-between"
            gap={3}
            px={5}
            py={4}
            direction={{
              base: "column",
              md: "row",
            }}
            borderBottom="1px solid"
            borderColor={BORDER}
          >
            <HStack spacing={3}>
              <Flex
                align="center"
                justify="center"
                boxSize="34px"
                borderRadius="8px"
                bg="#FFF0F4"
                color={RED}
              >
                <Icon
                  as={LuNetwork}
                  boxSize={4}
                />
              </Flex>

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  color={DARK}
                >
                  Account Hierarchy
                </Text>

                <Text
                  fontSize="11px"
                  color={MUTED}
                >
                  Subgroups and ledgers
                  under{" "}
                  {group?.group_name ||
                    "this group"}
                </Text>
              </Box>
            </HStack>

            <HStack
              spacing={2}
              w={{
                base: "100%",
                md: "auto",
              }}
            >
              {/* SEARCH */}

              <Box
                position="relative"
                flex="1"
              >
                <Icon
                  as={LuSearch}
                  position="absolute"
                  left="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={MUTED}
                  boxSize={4}
                  zIndex={1}
                />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search subgroup or ledger"
                  pl="36px"
                  h="38px"
                  fontSize="12px"
                  borderColor={
                    BORDER
                  }
                  borderRadius="6px"
                  _focus={{
                    borderColor:
                      PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              {/* EXPAND ALL */}

              <Button
                variant="outline"
                h="38px"
                px={4}
                fontSize="12px"
                color={RED}
                borderColor="#FF5A7D"
                borderRadius="6px"
                onClick={
                  handleExpandAll
                }
              >
                Expand All
              </Button>

              {/* COLLAPSE ALL */}

              <Button
                variant="outline"
                h="38px"
                px={3}
                fontSize="12px"
                borderRadius="6px"
                borderColor={
                  BORDER
                }
                onClick={
                  handleCollapseAll
                }
                title="Collapse All"
              >
                <Icon
                  as={LuList}
                  boxSize={4}
                  color={DARK}
                />

                <Icon
                  as={LuChevronDown}
                  boxSize={3}
                  ml={1}
                  color={DARK}
                />
              </Button>
            </HStack>
          </Flex>

          {/* ===================================================
              TABLE HEADER
          =================================================== */}

          <Flex
            px={4}
            py={2}
            borderBottom="1px solid"
            borderColor={BORDER}
            fontSize="11px"
            fontWeight="700"
            color={DARK}
            bg="#FAFBFC"
            minW="760px"
          >
            <Text flex="1">
              Account / Ledger
            </Text>

            <Text
              w="140px"
              flexShrink={0}
            >
              Code
            </Text>

            <Text
              w="140px"
              flexShrink={0}
            >
              Type
            </Text>

            <Text
              w="140px"
              flexShrink={0}
            >
              Balance
            </Text>

            <Text
              w="90px"
              flexShrink={0}
              textAlign="right"
            >
              Actions
            </Text>
          </Flex>

          {/* ===================================================
              ROWS
          =================================================== */}

          {isLoading ? (
            <Box
              py={6}
              textAlign="center"
              color={MUTED}
              fontSize="12px"
            >
              Loading hierarchy...
            </Box>
          ) : treeRows.length ===
            0 ? (
            <Box
              py={6}
              textAlign="center"
              color={MUTED}
              fontSize="12px"
            >
              No subgroups or
              ledgers found.
            </Box>
          ) : (
            <Box
              overflowX="auto"
            >
              {treeRows.map(
                (row) => (
                  <HierarchyRow
                    key={row.id}
                    row={row}
                    onToggle={
                      toggleExpand
                    }
                    onViewLedger={(
                      ledger
                    ) =>
                      navigate(
                        `/ledgers/${ledger.raw.id}`
                      )
                    }
                  />
                )
              )}
            </Box>
          )}

          {/* ===================================================
              LEGEND
          =================================================== */}

          <Flex
            justify="flex-end"
            gap={6}
            px={5}
            py={3}
            borderTop="1px solid"
            borderColor={BORDER}
            fontSize="11px"
            color={MUTED}
          >
            <HStack spacing={1.5}>
              <Icon
                as={LuNetwork}
                color={RED}
                boxSize={3.5}
              />
              <Text>
                Account Group
              </Text>
            </HStack>

            <HStack spacing={1.5}>
              <Icon
                as={LuNetwork}
                color={
                  SUB_GROUP_BLUE
                }
                boxSize={3.5}
              />
              <Text>
                Sub Group
              </Text>
            </HStack>

            <HStack spacing={1.5}>
              <Icon
                as={LuFileText}
                color={
                  SUB_GROUP_BLUE
                }
                boxSize={3.5}
              />
              <Text>
                Ledger
              </Text>
            </HStack>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default AccountGroupViewPage;

