import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Text,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuEye,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuUsers,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { listRelationships } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RelationshipPage = () => {
  const navigate = useNavigate();

  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  // Maximum 6 records per page
  const ITEMS_PER_PAGE = 6;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listRelationships();

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setRelationships(items);
    } catch (err) {
      console.error("Error fetching relationships:", err);

      setError("Unable to load relationships.");
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredRelationships = useMemo(() => {
    let result = [...relationships];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((item) =>
        String(item.name || "")
          .toLowerCase()
          .includes(searchValue)
      );
    }

    return result;
  }, [relationships, search]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalItems = filteredRelationships.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ITEMS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRelationships =
    filteredRelationships.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================================
  // RECENTLY UPDATED
  // ==========================================================

  const recentlyUpdatedCount = useMemo(() => {
    if (!relationships.length) return 0;

    const now = new Date();

    return relationships.filter((item) => {
      if (!item.updated_at) return false;

      const updated = new Date(item.updated_at);

      if (Number.isNaN(updated.getTime())) {
        return false;
      }

      const difference =
        now.getTime() - updated.getTime();

      const days =
        difference / (1000 * 60 * 60 * 24);

      return days >= 0 && days <= 30;
    }).length;
  }, [relationships]);

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const pageNumbers = [];

  for (let page = 1; page <= totalPages; page++) {
    pageNumbers.push(page);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      h="100vh"
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
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
        minH="0"
        overflow="hidden"
      >
        <Container
          maxW="1200px"
          px={{ base: 4, md: 5 }}
          py={{ base: 2, md: 3 }}
          height="100%"
        >
          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <HStack
            gap={2}
            mb={2}
            color="#60708C"
            fontSize="12px"
          >
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Relationship Master</Text>
          </HStack>

          {/* =================================================
              HEADER
          ================================================= */}

          <Flex
            justify="space-between"
            align="center"
            direction={{
              base: "column",
              md: "row",
            }}
            gap={2}
            mb={3}
          >
            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color="#D7193F"
                mb={1}
              >
                RELATIONSHIP MASTER
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
                Relationship Master
              </Heading>

              <Text
                color="#60708C"
                fontSize="12px"
              >
                Manage relationship records used in
                member and family details.
              </Text>
            </Box>

            {/* ADD BUTTON */}

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="38px"
              fontSize="13px"
              borderRadius="6px"
              flexShrink={0}
              onClick={() =>
                navigate("/relationship/add")
              }
              _hover={{
                bg: "#650A18",
              }}
            >
              <LuPlus
                size={17}
                style={{
                  marginRight: "7px",
                }}
              />

              Add Relationship
            </Button>
          </Flex>

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <SimpleGrid
            columns={{
              base: 1,
              md: 2,
            }}
            gap={3}
            mb={3}
          >
            {/* TOTAL */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="8px"
              h="78px"
              px={4}
              display="flex"
              alignItems="center"
              flexShrink={0}
            >
              <Flex
                align="center"
                width="100%"
                height="100%"
              >
                <Box
                  width="68px"
                  height="52px"
                  borderRight="1px solid #DCE2EA"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  flexShrink={0}
                >
                  <LuUsers
                    size={34}
                    color="#D7193F"
                    strokeWidth={1.5}
                  />
                </Box>

                <Box pl={4}>
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#182338"
                    mb={1}
                  >
                    Total Relationships
                  </Text>

                  <Text
                    fontSize="25px"
                    fontWeight="700"
                    color="#182338"
                    lineHeight="1"
                  >
                    {relationships.length}
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* RECENTLY UPDATED */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="8px"
              h="78px"
              px={4}
              display="flex"
              alignItems="center"
              flexShrink={0}
            >
              <Flex
                align="center"
                width="100%"
                height="100%"
              >
                <Box
                  width="68px"
                  height="52px"
                  borderRight="1px solid #DCE2EA"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  flexShrink={0}
                >
                  <LuCalendarDays
                    size={34}
                    color="#D7193F"
                    strokeWidth={1.5}
                  />
                </Box>

                <Box pl={4}>
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#182338"
                    mb={1}
                  >
                    Recently Updated
                  </Text>

                  <Text
                    fontSize="25px"
                    fontWeight="700"
                    color="#182338"
                    lineHeight="1"
                  >
                    {recentlyUpdatedCount}
                  </Text>
                </Box>
              </Flex>
            </Box>
          </SimpleGrid>

          {/* =================================================
              TABLE CARD
          ================================================= */}

          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            p={{ base: 2, md: 3 }}
            overflow="hidden"
          >
            {/* =================================================
                FILTER BAR
            ================================================= */}

            <Flex
              gap={2}
              mb={2}
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
                  md: "430px",
                }}
              >
                <Box
                  position="absolute"
                  left="13px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="#60708C"
                  zIndex={1}
                >
                  <LuSearch size={16} />
                </Box>

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search relationship name"
                  pl="40px"
                  h="38px"
                  fontSize="13px"
                  borderColor="#DCE2EA"
                  borderRadius="6px"
                  color="#182338"
                  _placeholder={{
                    color: "#8B98AB",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow:
                      `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              {/* RECORD FILTER */}

              {/* <Box
                width={{
                  base: "100%",
                  md: "200px",
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
                    padding: "0 12px",
                    fontSize: "13px",
                    color: "#182338",
                    background: "white",
                    outline: "none",
                  }}
                >
                  <option value="all">
                    All Records
                  </option>
                </select>
              </Box> */}

              {/* FILTER BUTTON */}

              {/* <Button
                variant="outline"
                h="38px"
                px={4}
                fontSize="13px"
                borderColor="#D7193F"
                color="#D7193F"
                borderRadius="6px"
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <LuFilter
                  size={15}
                  style={{
                    marginRight: "7px",
                  }}
                />

                Filter
              </Button> */}
            </Flex>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <Box
                mb={2}
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

            {/* =================================================
                TABLE

                IMPORTANT:
                No fixed height here.
                It grows only when rows are added.
            ================================================= */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="7px"
              overflow="hidden"
            >
              <Table.Root
                size="sm"
                variant="outline"
                width="100%"
              >
                {/* TABLE HEADER */}

                <Table.Header>
                  <Table.Row bg="white">
                    <Table.ColumnHeader
                      color="#182338"
                      fontWeight="700"
                      fontSize="12px"
                      py={2}
                      px={4}
                    >
                      Relationship Name
                    </Table.ColumnHeader>

                    <Table.ColumnHeader
                      color="#182338"
                      fontWeight="700"
                      fontSize="12px"
                      py={2}
                      px={4}
                    >
                      Last Updated
                    </Table.ColumnHeader>

                    <Table.ColumnHeader
                      color="#182338"
                      fontWeight="700"
                      fontSize="12px"
                      py={2}
                      px={4}
                      textAlign="right"
                    >
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                {/* TABLE BODY */}

                <Table.Body>
                  {/* LOADING */}

                  {loading && (
                    <Table.Row>
                      <Table.Cell
                        colSpan={3}
                        py={5}
                        textAlign="center"
                      >
                        <Text
                          color="#60708C"
                          fontSize="12px"
                        >
                          Loading relationships...
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  )}

                  {/* EMPTY */}

                  {!loading &&
                    paginatedRelationships.length === 0 && (
                      <Table.Row>
                        <Table.Cell
                          colSpan={3}
                          py={5}
                          textAlign="center"
                        >
                          <Text
                            color="#60708C"
                            fontSize="12px"
                          >
                            No relationships found.
                          </Text>

                          <Button
                            mt={2}
                            bg={PRIMARY_MAROON}
                            color="white"
                            size="sm"
                            fontSize="12px"
                            onClick={() =>
                              navigate(
                                "/relationship/add"
                              )
                            }
                            _hover={{
                              bg: "#650A18",
                            }}
                          >
                            <LuPlus
                              size={15}
                              style={{
                                marginRight: "6px",
                              }}
                            />

                            Add your first relationship
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    )}

                  {/* DATA */}

                  {!loading &&
                    paginatedRelationships.map(
                      (relationship) => (
                        <Table.Row
                          key={relationship.id}
                          _hover={{
                            bg: "#FCFCFD",
                          }}
                        >
                          {/* NAME */}

                          <Table.Cell
                            px={4}
                            py={1.5}
                            color="#182338"
                            fontSize="13px"
                            fontWeight="500"
                          >
                            {relationship.name || "-"}
                          </Table.Cell>

                          {/* DATE */}

                          <Table.Cell
                            px={4}
                            py={1.5}
                            color="#182338"
                            fontSize="13px"
                          >
                            {formatDate(
                              relationship.updated_at
                            )}
                          </Table.Cell>

                          {/* ACTIONS */}

                          <Table.Cell
                            px={4}
                            py={1.5}
                          >
                            <HStack
                              justify="flex-end"
                              gap={0}
                            >
                              {/* VIEW */}

                              <Button
                                variant="ghost"
                                size="sm"
                                h="28px"
                                px={3}
                                fontSize="12px"
                                color="#D7193F"
                                borderRadius="4px"
                                onClick={() =>
                                  navigate(
                                    `/relationship/${relationship.id}`
                                  )
                                }
                                _hover={{
                                  bg: "#FFF5F7",
                                }}
                              >
                                <LuEye
                                  size={14}
                                  style={{
                                    marginRight: "5px",
                                  }}
                                />

                                View
                              </Button>

                              {/* DIVIDER */}

                              <Box
                                height="18px"
                                width="1px"
                                bg="#DCE2EA"
                              />

                              {/* EDIT */}

                              <Button
                                variant="ghost"
                                size="sm"
                                h="28px"
                                px={3}
                                fontSize="12px"
                                color="#D7193F"
                                borderRadius="4px"
                                onClick={() =>
                                  navigate(
                                    `/relationship/${relationship.id}/edit`
                                  )
                                }
                                _hover={{
                                  bg: "#FFF5F7",
                                }}
                              >
                                <LuPencil
                                  size={14}
                                  style={{
                                    marginRight: "5px",
                                  }}
                                />

                                Edit
                              </Button>
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      )
                    )}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* =================================================
                PAGINATION

                Only show pagination when there are records.
            ================================================= */}

            {totalItems > 0 && (
              <Flex
                mt={2}
                align="center"
                justify="space-between"
                direction={{
                  base: "column",
                  md: "row",
                }}
                gap={2}
              >
                {/* COUNT */}

                <Text
                  color="#60708C"
                  fontSize="11px"
                >
                  Showing{" "}
                  {startIndex + 1}-
                  {Math.min(
                    startIndex +
                      paginatedRelationships.length,
                    totalItems
                  )}{" "}
                  of {totalItems} relationships
                </Text>

                {/* PAGINATION */}

                {totalPages > 1 && (
                  <HStack gap={1}>
                    {/* FIRST */}

                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      minW="28px"
                      borderColor="#DCE2EA"
                      color="#60708C"
                      disabled={
                        safeCurrentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage(1)
                      }
                    >
                      <LuChevronsLeft size={13} />
                    </Button>

                    {/* PREVIOUS */}

                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      minW="28px"
                      borderColor="#DCE2EA"
                      color="#60708C"
                      disabled={
                        safeCurrentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.max(
                            1,
                            prev - 1
                          )
                        )
                      }
                    >
                      <LuChevronLeft size={13} />
                    </Button>

                    {/* PAGE NUMBERS */}

                    {pageNumbers.map((page) => (
                      <Button
                        key={page}
                        size="xs"
                        h="28px"
                        minW="28px"
                        border="1px solid"
                        borderColor={
                          safeCurrentPage === page
                            ? PRIMARY_MAROON
                            : "#DCE2EA"
                        }
                        bg={
                          safeCurrentPage === page
                            ? PRIMARY_MAROON
                            : "white"
                        }
                        color={
                          safeCurrentPage === page
                            ? "white"
                            : "#60708C"
                        }
                        onClick={() =>
                          setCurrentPage(page)
                        }
                        _hover={{
                          bg:
                            safeCurrentPage === page
                              ? "#650A18"
                              : "#FFF5F7",
                        }}
                      >
                        {page}
                      </Button>
                    ))}

                    {/* NEXT */}

                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      minW="28px"
                      borderColor="#DCE2EA"
                      color="#60708C"
                      disabled={
                        safeCurrentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            totalPages,
                            prev + 1
                          )
                        )
                      }
                    >
                      <LuChevronRight size={13} />
                    </Button>

                    {/* LAST */}

                    <Button
                      variant="outline"
                      size="xs"
                      h="28px"
                      minW="28px"
                      borderColor="#DCE2EA"
                      color="#60708C"
                      disabled={
                        safeCurrentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(totalPages)
                      }
                    >
                      <LuChevronsRight size={13} />
                    </Button>
                  </HStack>
                )}
              </Flex>
            )}
          </Box>
        </Container>
      </Box>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </Box>
  );
};

export default RelationshipPage;