import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuBookOpen,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuHouse,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { listFamilies } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const FamilyPage = () => {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  // Number of records displayed per page
  const pageSize = 5;

  // ==========================================================
  // LOAD FAMILIES
  // ==========================================================

  const loadFamilies = async () => {
    try {
      setLoading(true);

      const response = await listFamilies();

      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        setFamilies(data);
      } else if (Array.isArray(data?.results)) {
        setFamilies(data.results);
      } else {
        setFamilies([]);
      }
    } catch (error) {
      console.error("Error loading families:", error);
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredFamilies = useMemo(() => {
    let result = [...families];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((family) => {
        const familyName =
          family.family_name?.toLowerCase() || "";

        const origin =
          family.origin?.toLowerCase() || "";

        return (
          familyName.includes(searchText) ||
          origin.includes(searchText)
        );
      });
    }

    if (filter === "ORIGIN") {
      result = result.filter(
        (family) =>
          family.origin &&
          family.origin.trim() !== ""
      );
    }

    if (filter === "HISTORY") {
      result = result.filter(
        (family) =>
          family.history &&
          family.history.trim() !== ""
      );
    }

    if (filter === "NO_ORIGIN") {
      result = result.filter(
        (family) =>
          !family.origin ||
          family.origin.trim() === ""
      );
    }

    return result;
  }, [families, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFamilies.length / pageSize
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedFamilies =
    filteredFamilies.slice(
      startIndex,
      startIndex + pageSize
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalFamilies = families.length;

  const withOrigin = families.filter(
    (family) =>
      family.origin &&
      family.origin.trim() !== ""
  ).length;

  const withHistory = families.filter(
    (family) =>
      family.history &&
      family.history.trim() !== ""
  ).length;

  // ==========================================================
  // DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
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
  // DYNAMIC TABLE HEIGHT
  // ==========================================================

  /*
    Header = 40px
    Each row = 42px

    The table grows depending on how many
    records are currently displayed.
  */

  const tableRowHeight = 42;
  const tableHeaderHeight = 42;

  const tableHeight = loading
    ? 90
    : Math.max(
        90,
        tableHeaderHeight +
          paginatedFamilies.length *
            tableRowHeight
      );

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
              color="#D7193F"
              strokeWidth={1.6}
            />
          </Box>

          <Box pl={4}>
            <Text
              fontSize="12px"
              color="#182338"
              mb={1}
              fontWeight="600"
            >
              {title}
            </Text>

            <Text
              fontSize="24px"
              fontWeight="700"
              color="#182338"
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

      <Box flex="1">
        <Container
          maxW="1200px"
          px={{ base: 4, md: 5 }}
          py={{ base: 3, md: 4 }}
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={2}
            mb={2}
            color="#60708C"
            fontSize="11px"
          >
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Family Master</Text>
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
                color="#D7193F"
                mb={1}
              >
                FAMILY MASTER
              </Text>

              <Heading
                color="#182338"
                fontSize={{
                  base: "22px",
                  md: "26px",
                }}
                lineHeight="1.1"
                mb={1}
              >
                Family Master
              </Heading>

              <Text
                color="#60708C"
                fontSize="11px"
              >
                Manage family records, origins and
                history information.
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
                navigate("/family-master/add")
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

              Add Family
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
              icon={LuHouse}
              title="Total Families"
              value={totalFamilies}
            />

            <StatCard
              icon={LuMapPin}
              title="With Origin"
              value={withOrigin}
            />

            <StatCard
              icon={LuBookOpen}
              title="With History"
              value={withHistory}
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
                  color="#60708C"
                  zIndex={1}
                  boxSize={4}
                />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search family name or origin"
                  pl="38px"
                  h="38px"
                  borderColor="#DCE2EA"
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
                    color: "#182338",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="ALL">
                    All Records
                  </option>

                  <option value="ORIGIN">
                    With Origin
                  </option>

                  <option value="HISTORY">
                    With History
                  </option>

                  <option value="NO_ORIGIN">
                    Without Origin
                  </option>
                </select>

                <Icon
                  as={LuChevronDown}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color="#182338"
                  boxSize={4}
                />
              </Box>

              {/* RESET FILTER */}

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color="#D7193F"
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
            >
              <Box
                as="table"
                width="100%"
                minW="850px"
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
                      "Family Name",
                      "Origin",
                      "History",
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
                        color="#182338"
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
                        colSpan={5}
                        textAlign="center"
                        height="48px"
                        color="#60708C"
                        fontSize="12px"
                      >
                        Loading families...
                      </Box>
                    </Box>
                  ) : paginatedFamilies.length === 0 ? (
                    /* EMPTY */

                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={5}
                        textAlign="center"
                        height="48px"
                        color="#60708C"
                        fontSize="12px"
                      >
                        No families found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedFamilies.map(
                      (family) => (
                        <Box
                          as="tr"
                          key={family.id}
                          height={`${tableRowHeight}px`}
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* FAMILY NAME */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            fontWeight="600"
                            color="#182338"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {family.family_name ||
                              "-"}
                          </Box>

                          {/* ORIGIN */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                          >
                            {family.origin ||
                              "-"}
                          </Box>

                          {/* HISTORY */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            maxW="400px"
                          >
                            <Text
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {family.history ||
                                "-"}
                            </Text>
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
                              family.updated_at
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
                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color="#D7193F"
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/family-master/${family.id}`
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
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color="#D7193F"
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/family-master/${family.id}/edit`
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
                color="#60708C"
              >
                {filteredFamilies.length === 0
                  ? "Showing 0 families"
                  : `Showing ${
                      startIndex + 1
                    }–${Math.min(
                      startIndex +
                        paginatedFamilies.length,
                      filteredFamilies.length
                    )} of ${
                      filteredFamilies.length
                    } families`}
              </Text>

              {/* PAGINATION */}

              <HStack gap={1}>
                {/* PREVIOUS */}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#DCE2EA"
                  color="#60708C"
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
                        color="#60708C"
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
                            : "#DCE2EA"
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
                  color="#D7193F"
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
        </Container>
      </Box>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default FamilyPage;