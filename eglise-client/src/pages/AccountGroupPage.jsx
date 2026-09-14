// src/pages/AccountGroupPage.jsx

import React, {
  useEffect,
  useMemo,
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
  Icon,
  Circle,
  Badge,
} from "@chakra-ui/react";

import {
  LuPlus,
  LuSearch,
  LuNetwork,
  LuFolder,
  LuBookOpen,
  LuEye,
  LuPencil,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCornerDownRight,
  LuFilter,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
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
   FLATTEN HIERARCHY
========================================================= */

const flattenHierarchy = (groups) => {
  const byParent = {};

  groups.forEach((group) => {
    const parentId = pick(
      group,
      [
        "under_group.id",
        "under_group",
      ],
      null
    );

    const key =
      parentId === "—"
        ? null
        : parentId;

    byParent[key] =
      byParent[key] || [];

    byParent[key].push(group);
  });

  const result = [];

  const walk = (
    parentId,
    depth
  ) => {
    (
      byParent[parentId] || []
    ).forEach((group) => {
      result.push({
        ...group,
        depth,
      });

      walk(
        group.id,
        depth + 1
      );
    });
  };

  walk(null, 0);

  return result;
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon,
  title,
  value,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor={BORDER}
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
          borderRight="1px solid"
          borderColor={BORDER}
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
            fontSize="24px"
            fontWeight="700"
            color={DARK}
            lineHeight="1"
          >
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

/* =========================================================
   FILTER SELECT
========================================================= */

const FilterSelect = ({
  children,
  ...props
}) => {
  return (
    <Box
      position="relative"
      width="100%"
    >
      <Box
        as="select"
        {...props}
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
        {children}
      </Box>

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
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const PAGE_SIZE = 5;

const AccountGroupPage = () => {
  const navigate = useNavigate();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    parentFilter,
    setParentFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  /* =========================================================
     LOAD ACCOUNT GROUPS
  ========================================================= */

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response =
        await listAccountGroups();

      const data =
        response?.data ?? response;

      if (Array.isArray(data)) {
        setGroups(data);
      } else if (
        Array.isArray(data?.results)
      ) {
        setGroups(data.results);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error(
        "Error fetching account groups:",
        error
      );

      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     ENRICH GROUP DATA
  ========================================================= */

  const enrichedGroups = useMemo(() => {
    return groups.map((group) => {
      const parentId = pick(
        group,
        [
          "under_group.id",
          "under_group",
        ],
        null
      );

      const parentObject =
        groups.find(
          (parent) =>
            String(parent.id) ===
            String(parentId)
        );

      const calculatedSubGroups =
        groups.filter(
          (child) =>
            String(
              child.under_group?.id ??
                child.under_group
            ) ===
            String(group.id)
        ).length;

      return {
        ...group,

        under_group_id:
          parentId === "—"
            ? null
            : parentId,

        under_group_name:
          group.under_group_name ||
          parentObject?.group_name ||
          "—",

        is_active:
          group.status ??
          group.is_active ??
          true,

        sub_groups_count:
          group.sub_groups_count ??
          calculatedSubGroups,

        /*
         * The serializer now returns
         * ledgers_count from:
         *
         * source="ledgers.count"
         */
        ledgers_count:
          group.ledgers_count ??
          group.linked_ledgers_count ??
          0,
      };
    });
  }, [groups]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const totalGroups =
      enrichedGroups.length;

    const activeGroups =
      enrichedGroups.filter(
        (group) =>
          group.is_active
      ).length;

    const subGroups =
      enrichedGroups.filter(
        (group) =>
          group.under_group_id
      ).length;

    const linkedLedgers =
      enrichedGroups.reduce(
        (sum, group) =>
          sum +
          Number(
            group.ledgers_count || 0
          ),
        0
      );

    return {
      totalGroups,
      activeGroups,
      subGroups,
      linkedLedgers,
    };
  }, [enrichedGroups]);

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const isFiltering =
    Boolean(
      searchTerm ||
        parentFilter ||
        statusFilter
    );

  const filteredFlatGroups =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return enrichedGroups.filter(
        (group) => {
          const matchesSearch =
            !search ||
            [
              group.group_name,
              group.account_code,
              group.alias,
            ]
              .filter(Boolean)
              .some((field) =>
                String(field)
                  .toLowerCase()
                  .includes(search)
              );

          const matchesParent =
            !parentFilter ||
            String(
              group.under_group_id
            ) ===
              String(parentFilter);

          const matchesStatus =
            !statusFilter ||
            (
              statusFilter ===
                "ACTIVE" &&
              group.is_active
            ) ||
            (
              statusFilter ===
                "INACTIVE" &&
              !group.is_active
            );

          return (
            matchesSearch &&
            matchesParent &&
            matchesStatus
          );
        }
      );
    }, [
      enrichedGroups,
      searchTerm,
      parentFilter,
      statusFilter,
    ]);

  /* =========================================================
     DISPLAY ROWS
  ========================================================= */

  const displayRows =
    useMemo(() => {
      if (isFiltering) {
        return filteredFlatGroups.map(
          (group) => ({
            ...group,
            depth: 0,
          })
        );
      }

      return flattenHierarchy(
        enrichedGroups
      );
    }, [
      isFiltering,
      filteredFlatGroups,
      enrichedGroups,
    ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalCount =
    displayRows.length;

  const totalPages =
    Math.max(
      Math.ceil(
        totalCount / PAGE_SIZE
      ),
      1
    );

  const currentPage =
    Math.min(
      page,
      totalPages
    );

  const paginatedRows =
    displayRows.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage *
        PAGE_SIZE
    );

  const rangeStart =
    totalCount === 0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const rangeEnd =
    Math.min(
      currentPage *
        PAGE_SIZE,
      totalCount
    );

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    parentFilter,
    statusFilter,
  ]);

  /* =========================================================
     PAGINATION NUMBERS
  ========================================================= */

  const pageNumbers =
    useMemo(() => {
      const pages = [];

      if (totalPages <= 5) {
        for (
          let i = 1;
          i <= totalPages;
          i += 1
        ) {
          pages.push(i);
        }

        return pages;
      }

      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start =
        Math.max(
          2,
          currentPage - 1
        );

      const end =
        Math.min(
          totalPages - 1,
          currentPage + 1
        );

      for (
        let i = start;
        i <= end;
        i += 1
      ) {
        pages.push(i);
      }

      if (
        currentPage <
        totalPages - 2
      ) {
        pages.push("...");
      }

      pages.push(totalPages);

      return pages;
    }, [
      currentPage,
      totalPages,
    ]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleAdd = () => {
    navigate(
      "/account-groups/add"
    );
  };

  const handleView = (
    group
  ) => {
    navigate(
      `/account-groups/${group.id}`
    );
  };

  const handleEdit = (
    group
  ) => {
    navigate(
      `/account-groups/${group.id}/edit`
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
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          MAIN CONTENT
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
              Account Groups
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
                ACCOUNT GROUPS
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
                Account Group Master
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage account groups used
                for ledger classification.
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

              Add Account Group
            </Button>
          </Flex>

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <Grid
            templateColumns={{
              base: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuNetwork}
              title="Total Groups"
              value={
                stats.totalGroups
              }
            />

            <StatCard
              icon={LuNetwork}
              title="Active Groups"
              value={
                stats.activeGroups
              }
            />

            <StatCard
              icon={LuFolder}
              title="Sub Groups"
              value={
                stats.subGroups
              }
            />

            <StatCard
              icon={LuBookOpen}
              title="Linked Ledgers"
              value={
                stats.linkedLedgers
              }
            />
          </Grid>

          {/* =================================================
              TABLE CARD
          ================================================= */}

          <Box
            border="1px solid"
            borderColor={BORDER}
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
                maxW={{
                  base: "100%",
                  md: "380px",
                }}
                flex="1"
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
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search group, code or alias"
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

              {/* PARENT FILTER */}

              <Box
                width={{
                  base: "100%",
                  md: "210px",
                }}
              >
                <FilterSelect
                  value={
                    parentFilter
                  }
                  onChange={(e) => {
                    setParentFilter(
                      e.target.value
                    );
                    setPage(1);
                  }}
                >
                  <option value="">
                    All Parent Groups
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
                </FilterSelect>
              </Box>

              {/* STATUS FILTER */}

              <Box
                width={{
                  base: "100%",
                  md: "180px",
                }}
              >
                <FilterSelect
                  value={
                    statusFilter
                  }
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );
                    setPage(1);
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
                </FilterSelect>
              </Box>

              {/* FILTER BUTTON */}

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() =>
                  setPage(1)
                }
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
              border="1px solid #E6EAF0"
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
                      "Group Name",
                      "Account Code",
                      "Alias",
                      "Under Group",
                      "Sub Groups",
                      "Ledgers",
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
                              "Actions" ||
                            heading ===
                              "Sub Groups" ||
                            heading ===
                              "Ledgers"
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
                        groups...
                      </Box>
                    </Box>
                  ) : paginatedRows.length ===
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
                        groups found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedRows.map(
                      (group) => {
                        const isSub =
                          group.depth >
                          0;

                        return (
                          <Box
                            as="tr"
                            key={group.id}
                            height="42px"
                            _hover={{
                              bg: "#FFFBFC",
                            }}
                          >
                            {/* GROUP NAME */}

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
                                spacing={2}
                                pl={`${group.depth * 24}px`}
                              >
                                {isSub && (
                                  <Icon
                                    as={
                                      LuCornerDownRight
                                    }
                                    boxSize={
                                      4
                                    }
                                    color="gray.400"
                                  />
                                )}

                                <Icon
                                  as={
                                    LuNetwork
                                  }
                                  boxSize={
                                    4
                                  }
                                  color={
                                    isSub
                                      ? SUB_GROUP_BLUE
                                      : PRIMARY_MAROON
                                  }
                                />

                                <Text>
                                  {pick(
                                    group,
                                    [
                                      "group_name",
                                    ]
                                  )}
                                </Text>
                              </HStack>
                            </Box>

                            {/* ACCOUNT CODE */}

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
                                group,
                                [
                                  "account_code",
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
                                group,
                                ["alias"]
                              )}
                            </Box>

                            {/* UNDER GROUP */}

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
                                group.under_group_name
                              }
                            </Box>

                            {/* SUB GROUPS */}

                            <Box
                              as="td"
                              px={4}
                              py={1}
                              fontSize="12px"
                              color="#344054"
                              borderBottom="1px solid #E6EAF0"
                              textAlign="right"
                            >
                              {
                                group.sub_groups_count
                              }
                            </Box>

                            {/* LEDGERS */}

                            <Box
                              as="td"
                              px={4}
                              py={1}
                              fontSize="12px"
                              color="#344054"
                              borderBottom="1px solid #E6EAF0"
                              textAlign="right"
                              fontWeight="600"
                            >
                              {
                                group.ledgers_count
                              }
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
                                  group.is_active
                                    ? "green.50"
                                    : "gray.100"
                                }
                                color={
                                  group.is_active
                                    ? "green.600"
                                    : "gray.600"
                                }
                                fontSize="10px"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {group.is_active
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
                              color={MUTED}
                              borderBottom="1px solid #E6EAF0"
                              whiteSpace="nowrap"
                            >
                              {formatDate(
                                pick(
                                  group,
                                  [
                                    "updated_at",
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
                                      group
                                    )
                                  }
                                  _hover={{
                                    bg: "#FFF0F4",
                                  }}
                                >
                                  <Icon
                                    as={
                                      LuEye
                                    }
                                    mr={1}
                                    boxSize={
                                      3.5
                                    }
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
                                      group
                                    )
                                  }
                                  _hover={{
                                    bg: "#FFF0F4",
                                  }}
                                >
                                  <Icon
                                    as={
                                      LuPencil
                                    }
                                    mr={1}
                                    boxSize={
                                      3.5
                                    }
                                  />

                                  Edit
                                </Button>
                              </HStack>
                            </Box>
                          </Box>
                        );
                      }
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
                  ? "Showing 0 account groups"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} account groups`}
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
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        Math.max(
                          1,
                          previous - 1
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

                {/* PAGE NUMBERS */}

                {pageNumbers.map(
                  (
                    pageNumber,
                    index
                  ) =>
                    pageNumber ===
                    "..." ? (
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
                        key={
                          pageNumber
                        }
                        size="xs"
                        h="30px"
                        minW="30px"
                        variant={
                          pageNumber ===
                          currentPage
                            ? "solid"
                            : "outline"
                        }
                        bg={
                          pageNumber ===
                          currentPage
                            ? PRIMARY_MAROON
                            : "white"
                        }
                        color={
                          pageNumber ===
                          currentPage
                            ? "white"
                            : "#344054"
                        }
                        borderColor={
                          pageNumber ===
                          currentPage
                            ? PRIMARY_MAROON
                            : BORDER
                        }
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                        _hover={{
                          bg:
                            pageNumber ===
                            currentPage
                              ? "#650A18"
                              : "#FFF0F4",
                        }}
                      >
                        {
                          pageNumber
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
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        Math.min(
                          totalPages,
                          previous + 1
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
      </Box>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </Box>
  );
};

export default AccountGroupPage;