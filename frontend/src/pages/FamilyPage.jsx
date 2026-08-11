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

  const [pageSize] = useState(5);

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
  // FILTER + SEARCH
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

  const paginatedFamilies =
    filteredFamilies.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize
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

      const start = Math.max(2, safePage - 1);
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
        borderRadius="9px"
        p={5}
        bg="white"
      >
        <Flex align="center" gap={5}>
          <Box
            boxSize="65px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRight="1px solid #DCE2EA"
            pr={5}
          >
            <Icon
              as={icon}
              boxSize={10}
              color="#D7193F"
              strokeWidth={1.7}
            />
          </Box>

          <Box>
            <Text
              fontSize="sm"
              color="#182338"
              mb={1}
            >
              {title}
            </Text>

            <Text
              fontSize="3xl"
              fontWeight="600"
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
      <Navbar />

      <Container
        maxW="container.xl"
        py={5}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={4}
          color="#60708C"
          fontSize="sm"
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
          gap={4}
          mb={5}
          direction={{
            base: "column",
            md: "row",
          }}
        >
          <Box>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="#D7193F"
              mb={1}
            >
              FAMILY MASTER
            </Text>

            <Heading
              size="xl"
              color="#182338"
              mb={1}
            >
              Family Master
            </Heading>

            <Text
              color="#60708C"
              fontSize="sm"
            >
              Manage family records, origins and
              history information.
            </Text>
          </Box>

          <Button
            bg={PRIMARY_MAROON}
            color="white"
            px={6}
            h="48px"
            borderRadius="7px"
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
              boxSize={5}
            />

            Add Family
          </Button>
        </Flex>

        {/* ==================================================
            STATS
        ================================================== */}

        <SimpleGrid
          columns={{
            base: 1,
            md: 3,
          }}
          gap={5}
          mb={5}
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
            TABLE CONTAINER
        ================================================== */}

        <Box
          border="1px solid #DCE2EA"
          borderRadius="9px"
          p={4}
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
            <Box
              position="relative"
              maxW={{
                base: "100%",
                md: "360px",
              }}
              flex="1"
            >
              <Icon
                as={LuSearch}
                position="absolute"
                left="14px"
                top="50%"
                transform="translateY(-50%)"
                color="#60708C"
                zIndex={1}
              />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search family name or origin"
                pl="42px"
                h="44px"
                borderColor="#DCE2EA"
                borderRadius="7px"
                fontSize="14px"
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow:
                    `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />
            </Box>

            <Box
              position="relative"
              maxW={{
                base: "100%",
                md: "230px",
              }}
            >
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
                style={{
                  width: "100%",
                  height: "44px",
                  border:
                    "1px solid #DCE2EA",
                  borderRadius: "7px",
                  padding: "0 38px 0 12px",
                  fontSize: "14px",
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
                right="12px"
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
                color="#182338"
              />
            </Box>

            <Button
              variant="outline"
              h="44px"
              borderColor="#FF5A7D"
              color="#D7193F"
              borderRadius="7px"
              px={5}
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
            >
              <Icon
                as={LuFilter}
                mr={2}
              />

              Filter
            </Button>
          </Flex>

          {/* ==================================================
              TABLE
          ================================================== */}

          <Box
            overflowX="auto"
            border="1px solid #E6EAF0"
            borderRadius="7px"
          >
            <Box
              as="table"
              width="100%"
              minW="900px"
              borderCollapse="collapse"
            >
              <Box as="thead">
                <Box as="tr">
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
                      py={3}
                      fontSize="13px"
                      fontWeight="600"
                      color="#182338"
                      borderBottom="1px solid #E6EAF0"
                      whiteSpace="nowrap"
                    >
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box as="tbody">
                {loading ? (
                  <Box as="tr">
                    <Box
                      as="td"
                      colSpan={5}
                      textAlign="center"
                      py={10}
                      color="#60708C"
                    >
                      Loading families...
                    </Box>
                  </Box>
                ) : paginatedFamilies.length === 0 ? (
                  <Box as="tr">
                    <Box
                      as="td"
                      colSpan={5}
                      textAlign="center"
                      py={10}
                      color="#60708C"
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
                        _hover={{
                          bg: "#FFFBFC",
                        }}
                      >
                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="14px"
                          fontWeight="500"
                          color="#182338"
                          borderBottom="1px solid #E6EAF0"
                        >
                          {family.family_name ||
                            "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="14px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                        >
                          {family.origin ||
                            "-"}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="14px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          maxW="450px"
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

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          fontSize="14px"
                          color="#344054"
                          borderBottom="1px solid #E6EAF0"
                          whiteSpace="nowrap"
                        >
                          {formatDate(
                            family.updated_at
                          )}
                        </Box>

                        <Box
                          as="td"
                          px={4}
                          py={3}
                          borderBottom="1px solid #E6EAF0"
                        >
                          <HStack gap={3}>
                            <Button
                              variant="ghost"
                              size="sm"
                              color="#D7193F"
                              px={1}
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
                              />

                              View
                            </Button>

                            <Box
                              h="22px"
                              borderLeft="1px solid #DCE2EA"
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              color="#D7193F"
                              px={1}
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
            <Text
              fontSize="13px"
              color="#60708C"
            >
              {filteredFamilies.length === 0
                ? "Showing 0 families"
                : `Showing ${
                    (safePage - 1) *
                      pageSize +
                    1
                  }–${Math.min(
                    safePage * pageSize,
                    filteredFamilies.length
                  )} of ${
                    filteredFamilies.length
                  } families`}
            </Text>

            <HStack gap={1}>
              <Button
                size="sm"
                variant="outline"
                borderColor="#DCE2EA"
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
                />
                Previous
              </Button>

              {renderPages().map(
                (page, index) =>
                  page === "..." ? (
                    <Text
                      key={`dots-${index}`}
                      px={2}
                      color="#60708C"
                    >
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      size="sm"
                      minW="36px"
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
                    >
                      {page}
                    </Button>
                  )
              )}

              <Button
                size="sm"
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
                />
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default FamilyPage;