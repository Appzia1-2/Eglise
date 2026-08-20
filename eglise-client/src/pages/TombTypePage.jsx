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
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuEye,
  LuFilter,
  LuLandmark,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listTombTypes,
} from "../api/churchServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const PAGE_SIZE = 5;

const TombTypePage = () => {
  const navigate = useNavigate();

  const [tombTypes, setTombTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [page, setPage] = useState(1);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD TOMB TYPES
  // ==========================================================

  const loadTombTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listTombTypes();

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.results || [];

      setTombTypes(items);
    } catch (err) {
      console.error("Error loading tomb types:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load tomb type records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTombTypes();
  }, []);

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

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
  // GET LAST UPDATED
  // ==========================================================

  const getLastUpdated = (tombType) => {
    return (
      tombType?.updated_at ||
      tombType?.updated ||
      tombType?.updated_on ||
      null
    );
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredTombTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tombTypes.filter((tombType) => {
      const matchesSearch =
        !keyword ||
        String(tombType.name || "")
          .toLowerCase()
          .includes(keyword);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "ALL") {
        return true;
      }

      return true;
    });
  }, [tombTypes, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalItems = filteredTombTypes.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const paginatedTombTypes =
    filteredTombTypes.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
        maxW="1200px"
        px={{ base: 4, md: 5 }}
        py={{ base: 2, md: 3 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
          color="#60708C"
          fontSize="12px"
        >
          <Text>Masters</Text>
          <Text>/</Text>
          <Text>Tomb Type Master</Text>
        </HStack>

        {/* ==================================================
            HEADER
        ================================================== */}

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
              TOMB TYPE MASTER
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
              Tomb Type Master
            </Heading>

            <Text
              color="#60708C"
              fontSize="12px"
            >
              Manage tomb type records used in
              church and cemetery details.
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
            onClick={() =>
              navigate("/tomb-type/add")
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

            Add Tomb Type
          </Button>
        </Flex>

        {/* ==================================================
            STAT CARDS
        ================================================== */}

        <SimpleGrid
          columns={{
            base: 1,
            md: 2,
          }}
          gap={3}
          mb={3}
        >
          {/* TOTAL TOMB TYPES */}

          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            h="78px"
            px={4}
            display="flex"
            alignItems="center"
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
              >
                <LuLandmark
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
                  Total Tomb Types
                </Text>

                <Text
                  fontSize="25px"
                  fontWeight="700"
                  color="#182338"
                  lineHeight="1"
                >
                  {tombTypes.length}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* MATCHING RECORDS */}

          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            h="78px"
            px={4}
            display="flex"
            alignItems="center"
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
              >
                <LuSearch
                  size={32}
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
                  Matching Records
                </Text>

                <Text
                  fontSize="25px"
                  fontWeight="700"
                  color="#182338"
                  lineHeight="1"
                >
                  {filteredTombTypes.length}
                </Text>
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>

        {/* ==================================================
            TABLE CARD
        ================================================== */}

        <Box
          border="1px solid #DCE2EA"
          borderRadius="8px"
          p={{ base: 2, md: 3 }}
          overflow="hidden"
        >
          {/* ==================================================
              FILTER BAR
          ================================================== */}

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
                placeholder="Search tomb type name"
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
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />
            </Box>

            {/* FILTER */}

            <Box
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
                  border: "1px solid #DCE2EA",
                  borderRadius: "6px",
                  padding: "0 12px",
                  fontSize: "13px",
                  color: "#182338",
                  background: "white",
                  outline: "none",
                }}
              >
                <option value="ALL">
                  All Records
                </option>
              </select>
            </Box>

            {/* FILTER / RESET */}

            <Button
              variant="outline"
              h="38px"
              px={4}
              fontSize="13px"
              borderColor="#D7193F"
              color="#D7193F"
              borderRadius="6px"
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
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
            </Button>
          </Flex>

          {/* ==================================================
              ERROR
          ================================================== */}

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

          {/* ==================================================
              TABLE
          ================================================== */}

          <Box
            border="1px solid #DCE2EA"
            borderRadius="7px"
            overflowX="auto"
          >
            <Box minW="800px">
              <Table.Root
                size="sm"
                variant="outline"
              >
                <Table.Header>
                  <Table.Row bg="white">

                    {/* NAME */}

                    <Table.ColumnHeader
                      color="#182338"
                      fontWeight="700"
                      fontSize="12px"
                      py={2}
                      px={4}
                    >
                      Tomb Type Name
                    </Table.ColumnHeader>

                    {/* LAST UPDATED */}

                    <Table.ColumnHeader
                      color="#182338"
                      fontWeight="700"
                      fontSize="12px"
                      py={2}
                      px={4}
                    >
                      Last Updated
                    </Table.ColumnHeader>

                    {/* ACTIONS */}

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

                <Table.Body>

                  {/* ==================================================
                      LOADING
                  ================================================== */}

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
                          Loading tomb types...
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  )}

                  {/* ==================================================
                      EMPTY
                  ================================================== */}

                  {!loading &&
                    paginatedTombTypes.length ===
                      0 && (
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
                            No tomb types found.
                          </Text>

                          <Button
                            mt={2}
                            bg={PRIMARY_MAROON}
                            color="white"
                            size="sm"
                            fontSize="12px"
                            onClick={() =>
                              navigate(
                                "/tomb-type/add"
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

                            Add your first tomb type
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    )}

                  {/* ==================================================
                      DATA
                  ================================================== */}

                  {!loading &&
                    paginatedTombTypes.map(
                      (tombType) => (
                        <Table.Row
                          key={tombType.id}
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
                            fontWeight="600"
                          >
                            {tombType.name || "-"}
                          </Table.Cell>

                          {/* LAST UPDATED */}

                          <Table.Cell
                            px={4}
                            py={1.5}
                            color="#60708C"
                            fontSize="12px"
                          >
                            {formatDate(
                              getLastUpdated(tombType)
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
                                    `/tomb-type/${tombType.id}`
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
                                    `/tomb-type/${tombType.id}/edit`
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
          </Box>

          {/* ==================================================
              PAGINATION
          ================================================== */}

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
            {/* SHOWING */}

            <Text
              color="#60708C"
              fontSize="11px"
            >
              Showing{" "}
              {totalItems === 0
                ? 0
                : startIndex + 1}
              -
              {Math.min(
                startIndex +
                  paginatedTombTypes.length,
                totalItems
              )}{" "}
              of {totalItems} tomb types
            </Text>

            {/* PAGINATION BUTTONS */}

            <HStack gap={1}>

              {/* FIRST PAGE */}

              <Button
                variant="outline"
                size="xs"
                h="28px"
                minW="28px"
                borderColor="#DCE2EA"
                color="#60708C"
                disabled={safePage === 1}
                onClick={() => setPage(1)}
              >
                <LuChevronsLeft size={13} />
              </Button>

              {/* PREVIOUS PAGE */}

              <Button
                variant="outline"
                size="xs"
                h="28px"
                minW="28px"
                borderColor="#DCE2EA"
                color="#60708C"
                disabled={safePage === 1}
                onClick={() =>
                  setPage((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
              >
                <LuChevronLeft size={13} />
              </Button>

              {/* PAGE NUMBERS */}

              {pageNumbers.map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="xs"
                    h="28px"
                    minW="28px"
                    border="1px solid"
                    borderColor={
                      safePage === pageNumber
                        ? PRIMARY_MAROON
                        : "#DCE2EA"
                    }
                    bg={
                      safePage === pageNumber
                        ? PRIMARY_MAROON
                        : "white"
                    }
                    color={
                      safePage === pageNumber
                        ? "white"
                        : "#60708C"
                    }
                    onClick={() =>
                      setPage(pageNumber)
                    }
                    _hover={{
                      bg:
                        safePage === pageNumber
                          ? "#650A18"
                          : "#FFF5F7",
                    }}
                  >
                    {pageNumber}
                  </Button>
                )
              )}

              {/* NEXT PAGE */}

              <Button
                variant="outline"
                size="xs"
                h="28px"
                minW="28px"
                borderColor="#DCE2EA"
                color="#60708C"
                disabled={
                  safePage === totalPages
                }
                onClick={() =>
                  setPage((prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                  )
                }
              >
                <LuChevronRight size={13} />
              </Button>

              {/* LAST PAGE */}

              <Button
                variant="outline"
                size="xs"
                h="28px"
                minW="28px"
                borderColor="#DCE2EA"
                color="#60708C"
                disabled={
                  safePage === totalPages
                }
                onClick={() =>
                  setPage(totalPages)
                }
              >
                <LuChevronsRight size={13} />
              </Button>

            </HStack>
          </Flex>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default TombTypePage;