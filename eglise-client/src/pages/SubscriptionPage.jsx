import React, { useEffect, useMemo, useState } from "react";

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
} from "@chakra-ui/react";

import {
  LuBadgeDollarSign,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuCircleX,
  LuEye,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listSubscriptions,
  listGrades,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const SubscriptionPage = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [subscriptions, setSubscriptions] = useState([]);
  const [grades, setGrades] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  // ==========================================================
  // LOAD SUBSCRIPTIONS
  // ==========================================================

  const loadSubscriptions = async () => {
    try {
      setLoading(true);

      const [subscriptionResponse, gradeResponse] =
        await Promise.all([
          listSubscriptions(),
          listGrades(),
        ]);

      const subscriptionData =
        subscriptionResponse?.data ??
        subscriptionResponse;

      const gradeData =
        gradeResponse?.data ??
        gradeResponse;

      const subscriptionList = Array.isArray(
        subscriptionData
      )
        ? subscriptionData
        : subscriptionData?.results || [];

      const gradeList = Array.isArray(gradeData)
        ? gradeData
        : gradeData?.results || [];

      setGrades(gradeList);

      // --------------------------------------------------------
      // Enrich subscriptions with grade name
      // --------------------------------------------------------

      const mappedSubscriptions =
        subscriptionList.map((subscription) => {
          const gradeId =
            subscription?.grade?.id ??
            subscription?.grade;

          const gradeObject = gradeList.find(
            (grade) =>
              String(grade.id) === String(gradeId)
          );

          return {
            ...subscription,

            grade_name:
              subscription?.grade?.name ||
              gradeObject?.name ||
              "—",

            status_label:
              subscription?.is_cancelled
                ? "Cancelled"
                : "Active",
          };
        });

      setSubscriptions(mappedSubscriptions);
    } catch (error) {
      console.error(
        "Error loading subscriptions:",
        error
      );

      setSubscriptions([]);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredSubscriptions = useMemo(() => {
    let result = [...subscriptions];

    const searchText =
      search.trim().toLowerCase();

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (searchText) {
      result = result.filter((subscription) => {
        const gradeName =
          subscription.grade_name
            ?.toLowerCase() || "";

        const term =
          subscription.term
            ?.toLowerCase() || "";

        return (
          gradeName.includes(searchText) ||
          term.includes(searchText)
        );
      });
    }

    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    if (filter === "ACTIVE") {
      result = result.filter(
        (subscription) =>
          !subscription.is_cancelled
      );
    }

    if (filter === "CANCELLED") {
      result = result.filter(
        (subscription) =>
          subscription.is_cancelled
      );
    }

    return result;
  }, [
    subscriptions,
    search,
    filter,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSubscriptions.length /
        pageSize
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedSubscriptions =
    filteredSubscriptions.slice(
      startIndex,
      startIndex + pageSize
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalSubscriptions =
    subscriptions.length;

  const activeSubscriptions =
    subscriptions.filter(
      (subscription) =>
        !subscription.is_cancelled
    ).length;

  const cancelledSubscriptions =
    subscriptions.filter(
      (subscription) =>
        subscription.is_cancelled
    ).length;

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================================
  // AMOUNT FORMAT
  // ==========================================================

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "-";
    }

    const numericAmount =
      Number(amount);

    if (Number.isNaN(numericAmount)) {
      return amount;
    }

    return numericAmount.toFixed(2);
  };

  // ==========================================================
  // TABLE HEIGHT
  // ==========================================================

  const tableRowHeight = 42;
  const tableHeaderHeight = 42;

  const tableHeight = loading
    ? 90
    : Math.max(
        90,
        tableHeaderHeight +
          paginatedSubscriptions.length *
            tableRowHeight
      );

  // ==========================================================
  // PAGINATION NUMBERS
  // ==========================================================

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }
    } else {
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
    }

    return pages;
  };

  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({
    icon,
    title,
    value,
  }) => {
    return (
      <Box
        border="1px solid #DCE2EA"
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
            borderRight="1px solid #DCE2EA"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Icon
              as={icon}
              boxSize={8}
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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <Box flex="1" w="100%">
        {/* ====================================================
            CHANGED:
            Removed Container maxW="1200px"
            so content can use full available width.
        ==================================================== */}

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
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="11px"
          >
            <Text>
              Masters
            </Text>

            <Text>/</Text>

            <Text>
              Subscription Master
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
                SUBSCRIPTION MASTER
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
                Subscription Master
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage church subscriptions,
                grades, terms and billing
                information.
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
              onClick={() =>
                navigate(
                  "/subscription/add"
                )
              }
              _hover={{
                bg: "#650A18",
              }}
            >
              <Icon
                as={LuPlus}
                mr={2}
                boxSize={4}
              />

              Add Subscription
            </Button>
          </Flex>

          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <SimpleGrid
            columns={{
              base: 1,
              md: 3,
            }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuBadgeDollarSign}
              title="Total Subscriptions"
              value={
                totalSubscriptions
              }
            />

            <StatCard
              icon={LuCircleCheck}
              title="Active Subscriptions"
              value={
                activeSubscriptions
              }
            />

            <StatCard
              icon={LuCircleX}
              title="Cancelled Subscriptions"
              value={
                cancelledSubscriptions
              }
            />
          </SimpleGrid>

          {/* ==================================================
              TABLE CARD
          ================================================== */}

          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            p={3}
            bg="white"
            w="100%"
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
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search grade or term"
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

              {/* FILTER */}

              <Box
                position="relative"
                width={{
                  base: "100%",
                  md: "210px",
                }}
              >
                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    height: "38px",
                    border:
                      "1px solid #DCE2EA",
                    borderRadius: "6px",
                    padding:
                      "0 35px 0 11px",
                    fontSize: "12px",
                    background:
                      "white",
                    color: DARK,
                    outline: "none",
                    cursor: "pointer",
                    appearance:
                      "none",
                  }}
                >
                  <option value="ALL">
                    All Records
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="CANCELLED">
                    Cancelled
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
                  setSearch("");
                  setFilter("ALL");
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

            {/* ==================================================
                TABLE
            ================================================== */}

            <Box
              height={`${tableHeight}px`}
              overflowX="auto"
              overflowY="hidden"
              border="1px solid #E6EAF0"
              borderRadius="6px"
              transition="height 0.2s ease"
              width="100%"
            >
              <Box
                as="table"
                width="100%"
                minW="1000px"
                height="100%"
                borderCollapse="collapse"
              >
                {/* TABLE HEADER */}

                <Box as="thead">
                  <Box
                    as="tr"
                    height={`${tableHeaderHeight}px`}
                  >
                    {[
                      "Grade",
                      "Term",
                      "Start Date",
                      "End Date",
                      "Amount",
                      "Status",
                      "Actions",
                    ].map(
                      (heading) => (
                        <Box
                          as="th"
                          key={heading}
                          textAlign="left"
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
                  {/* LOADING */}

                  {loading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading subscriptions...
                      </Box>
                    </Box>
                  ) : paginatedSubscriptions.length ===
                    0 ? (
                    /* EMPTY */

                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No subscriptions found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedSubscriptions.map(
                      (subscription) => (
                        <Box
                          as="tr"
                          key={
                            subscription.id
                          }
                          height={`${tableRowHeight}px`}
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* GRADE */}

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
                            {
                              subscription.grade_name
                            }
                          </Box>

                          {/* TERM */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {subscription.term ||
                              "-"}
                          </Box>

                          {/* START DATE */}

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
                              subscription.start_date
                            )}
                          </Box>

                          {/* END DATE */}

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
                              subscription.end_date
                            )}
                          </Box>

                          {/* AMOUNT */}

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
                            {formatAmount(
                              subscription.amount
                            )}
                          </Box>

                          {/* STATUS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <Box
                              display="inline-flex"
                              alignItems="center"
                              px={2}
                              py="3px"
                              borderRadius="5px"
                              fontSize="10px"
                              fontWeight="600"
                              bg={
                                subscription.is_cancelled
                                  ? "#FFF0F0"
                                  : "#EAF8EA"
                              }
                              border="1px solid"
                              borderColor={
                                subscription.is_cancelled
                                  ? "#F2B8C3"
                                  : "#B7DFB7"
                              }
                              color={
                                subscription.is_cancelled
                                  ? "#B5122F"
                                  : "#238B2D"
                              }
                            >
                              {subscription.is_cancelled
                                ? "Cancelled"
                                : "Active"}
                            </Box>
                          </Box>

                          {/* ACTIONS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <HStack gap={2}>
                              {/* VIEW */}

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/subscription/${subscription.id}`
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
                                  boxSize={3.5}
                                />

                                View
                              </Button>

                              <Box
                                h="20px"
                                borderLeft="1px solid #DCE2EA"
                              />

                              {/* EDIT */}

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/subscriptions/${subscription.id}/edit`
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
              {/* COUNT */}

              <Text
                fontSize="11px"
                color={MUTED}
              >
                {filteredSubscriptions.length ===
                0
                  ? "Showing 0 subscriptions"
                  : `Showing ${
                      startIndex + 1
                    }–${Math.min(
                      startIndex +
                        paginatedSubscriptions.length,
                      filteredSubscriptions.length
                    )} of ${
                      filteredSubscriptions.length
                    } subscriptions`}
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
                    safePage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
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

                {renderPages().map(
                  (
                    page,
                    index
                  ) =>
                    page === "..." ? (
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
                        key={page}
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
                        {page}
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
                        safePage + 1
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

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default SubscriptionPage;