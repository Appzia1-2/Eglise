// src/pages/OfferingPage.jsx

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
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuDollarSign,
  LuUsers,
  LuBan,
  LuTrash2,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listOfferings,
  deleteOffering,
  listEvents,
  listMembers,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const OfferingPage = () => {
  const navigate = useNavigate();

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadOfferings = async () => {
    try {
      setLoading(true);
      setError("");

      const [oRes, eRes, mRes] = await Promise.all([
        listOfferings(),
        listEvents(),
        listMembers(),
      ]);

      const offeringsData = oRes?.data ?? oRes;
      const eventsData = eRes?.data ?? eRes;
      const membersData = mRes?.data ?? mRes;

      const offeringsList = Array.isArray(offeringsData)
        ? offeringsData
        : offeringsData?.results || [];

      const eventsList = Array.isArray(eventsData)
        ? eventsData
        : eventsData?.results || [];

      const membersList = Array.isArray(membersData)
        ? membersData
        : membersData?.results || [];

      // Enrich offerings with event and member names
      const enriched = offeringsList.map((o) => {
        const eventObj = eventsList.find(
          (e) => e.id === (o.event?.id || o.event)
        );
        const memberObj = membersList.find(
          (m) => m.id === (o.member?.id || o.member)
        );

        return {
          ...o,
          event_name: o.event?.name || eventObj?.name || "—",
          member_name: o.member?.name || memberObj?.name || "—",
          status_label: o.is_cancelled ? "Cancelled" : "Active",
        };
      });

      setOfferings(enriched);
    } catch (err) {
      console.error("Error loading offerings:", err);
      setError("Unable to load offering records.");
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredOfferings = useMemo(() => {
    let result = [...offerings];

    const searchText = search.trim().toLowerCase();

    // ========================================================
    // SEARCH
    // ========================================================

    if (searchText) {
      result = result.filter((offering) => {
        const memberName = String(offering.member_name || "").toLowerCase();
        const eventName = String(offering.event_name || "").toLowerCase();
        const narration = String(offering.narration || "").toLowerCase();
        const amount = String(offering.amount || "").toLowerCase();

        return (
          memberName.includes(searchText) ||
          eventName.includes(searchText) ||
          narration.includes(searchText) ||
          amount.includes(searchText)
        );
      });
    }

    // ========================================================
    // FILTER
    // ========================================================

    if (filter === "ACTIVE") {
      result = result.filter(
        (offering) => !offering.is_cancelled
      );
    }

    if (filter === "CANCELLED") {
      result = result.filter(
        (offering) => offering.is_cancelled === true
      );
    }

    if (filter === "RECENTLY_UPDATED") {
      const now = new Date();
      const sevenDaysAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      result = result.filter((offering) => {
        if (!offering.updated_at) return false;
        const updated = new Date(offering.updated_at);
        if (Number.isNaN(updated.getTime())) return false;
        return updated >= sevenDaysAgo && updated <= now;
      });
    }

    return result;
  }, [offerings, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOfferings.length / pageSize
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedOfferings =
    filteredOfferings.slice(
      startIndex,
      startIndex + pageSize
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalOfferings = offerings.length;

  const totalAmount = useMemo(() => {
    return offerings
      .filter((o) => !o.is_cancelled)
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);
  }, [offerings]);

  const cancelledCount = useMemo(() => {
    return offerings.filter((o) => o.is_cancelled === true).length;
  }, [offerings]);

  // ==========================================================
  // DATE FORMAT - with time
  // ==========================================================

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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

    if (
      Number.isNaN(numericAmount)
    ) {
      return amount;
    }

    return numericAmount.toFixed(2);
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this offering?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteOffering(id);
      await loadOfferings();
    } catch (err) {
      console.error("Error deleting offering:", err);
      alert(
        err?.response?.data?.detail ||
          "Unable to delete offering."
      );
    }
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
  // PAGINATION NUMBERS
  // ==========================================================

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
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

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
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
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="11px"
          >
            <Text>Offerings</Text>
            <Text>/</Text>
            <Text>Member Offerings</Text>
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
                OFFERING MASTER
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
                Member Offerings
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage member offering records.
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
                navigate("/offerings/add")
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

              Add Offering
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
              icon={LuUsers}
              title="Total Offerings"
              value={totalOfferings}
            />

            <StatCard
              icon={LuDollarSign}
              title="Total Amount"
              value={`₹${formatAmount(totalAmount)}`}
            />

            <StatCard
              icon={LuBan}
              title="Cancelled"
              value={cancelledCount}
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
                    setSearch(e.target.value)
                  }
                  placeholder="Search member, event, narration or amount"
                  pl="38px"
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                  _focus={{
                    borderColor: PRIMARY_MAROON,
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
                    setFilter(e.target.value)
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
                    background: "white",
                    color: DARK,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
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

                  <option value="RECENTLY_UPDATED">
                    Recently Updated
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

              {/* RESET FILTER */}

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
                ERROR MESSAGE
            ================================================== */}

            {error && (
              <Box
                mb={3}
                p={2}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text
                  color="red.600"
                  fontSize="12px"
                >
                  {error}
                </Text>
              </Box>
            )}

            {/* ==================================================
                TABLE
            ================================================== */}

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
                minW="1200px"
                borderCollapse="collapse"
              >
                {/* TABLE HEADER */}

                <Box as="thead">
                  <Box
                    as="tr"
                    height="42px"
                  >
                    {[
                      "Event Name",
                      "Member",
                      "Amount",
                      "Narration",
                      "Status",
                      "Last Updated",
                      "Actions",
                    ].map((heading) => (
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
                    ))}
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
                        Loading offerings...
                      </Box>
                    </Box>
                  ) : paginatedOfferings.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={7}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No offerings found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedOfferings.map(
                      (offering) => (
                        <Box
                          as="tr"
                          key={offering.id}
                          height="42px"
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* EVENT NAME */}

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
                            {offering.event_name || "-"}
                          </Box>

                          {/* MEMBER */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {offering.member_name || "-"}
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
                            ₹{formatAmount(offering.amount)}
                          </Box>

                          {/* NARRATION */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            maxW="200px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                          >
                            {offering.narration || "-"}
                          </Box>

                          {/* STATUS */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            <Box
                              px={2.5}
                              py={0.5}
                              borderRadius="5px"
                              bg={
                                offering.is_cancelled
                                  ? "#FFF5F5"
                                  : "#EAF8ED"
                              }
                              border="1px solid"
                              borderColor={
                                offering.is_cancelled
                                  ? "#FECACA"
                                  : "#B8E0BE"
                              }
                              color={
                                offering.is_cancelled
                                  ? "#C53030"
                                  : "#25803C"
                              }
                              fontSize="11px"
                              fontWeight="600"
                              display="inline-block"
                            >
                              {offering.is_cancelled
                                ? "Cancelled"
                                : "Active"}
                            </Box>
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
                            {formatDateTime(
                              offering.updated_at
                            )}
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

                              {/* <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/offerings/${offering.id}`
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

                              <Box
                                h="20px"
                                borderLeft="1px solid #DCE2EA"
                              /> */}

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
                                    `/offerings/${offering.id}/edit`
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

                              {/* <Box
                                h="20px"
                                borderLeft="1px solid #DCE2EA"
                              /> */}

                              {/* DELETE */}

                              {/* <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color="#C53030"
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  handleDelete(offering.id)
                                }
                                _hover={{
                                  bg: "#FFF5F5",
                                }}
                              >
                                <Icon
                                  as={LuTrash2}
                                  mr={1}
                                  boxSize={3.5}
                                />

                                Delete
                              </Button> */}
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
                {filteredOfferings.length === 0
                  ? "Showing 0 offerings"
                  : `Showing ${
                      startIndex + 1
                    }–${Math.min(
                      startIndex +
                        paginatedOfferings.length,
                      filteredOfferings.length
                    )} of ${
                      filteredOfferings.length
                    } offerings`}
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
                  disabled={safePage === 1}
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
                  (page, index) =>
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
                          page === safePage
                            ? "solid"
                            : "outline"
                        }
                        bg={
                          page === safePage
                            ? PRIMARY_MAROON
                            : "white"
                        }
                        color={
                          page === safePage
                            ? "white"
                            : "#344054"
                        }
                        borderColor={
                          page === safePage
                            ? PRIMARY_MAROON
                            : BORDER
                        }
                        onClick={() =>
                          setCurrentPage(page)
                        }
                        _hover={{
                          bg:
                            page === safePage
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
                    safePage === totalPages
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

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default OfferingPage;