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
  LuCalendarDays,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuGraduationCap,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listGrades,
  deleteGrade,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const GradePage = () => {
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listGrades();

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.results || [];

      setGrades(items);
    } catch (err) {
      console.error("Error loading grades:", err);
      setError("Unable to load grade records.");
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredGrades = useMemo(() => {
    let result = [...grades];

    const searchText = search.trim().toLowerCase();

    // ========================================================
    // SEARCH
    // ========================================================

    if (searchText) {
      result = result.filter((grade) => {
        const name = String(grade.name || "").toLowerCase();
        return name.includes(searchText);
      });
    }

    // ========================================================
    // FILTER
    // ========================================================

    if (filter === "RECENTLY_UPDATED") {
      const now = new Date();
      const sevenDaysAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      result = result.filter((grade) => {
        if (!grade.updated_at) return false;
        const updated = new Date(grade.updated_at);
        if (Number.isNaN(updated.getTime())) return false;
        return updated >= sevenDaysAgo && updated <= now;
      });
    }

    return result;
  }, [grades, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredGrades.length / pageSize
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedGrades =
    filteredGrades.slice(
      startIndex,
      startIndex + pageSize
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalGrades = grades.length;

  const recentlyUpdatedCount = useMemo(() => {
    if (!grades.length) return 0;

    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    return grades.filter((grade) => {
      if (!grade.updated_at) return false;
      const updated = new Date(grade.updated_at);
      if (Number.isNaN(updated.getTime())) return false;
      return updated >= sevenDaysAgo && updated <= now;
    }).length;
  }, [grades]);

  // ==========================================================
  // DATE FORMAT - with time like Tomb Fees
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
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this grade?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGrade(id);
      await loadGrades();
    } catch (err) {
      console.error("Error deleting grade:", err);
      alert(
        err?.response?.data?.detail ||
          "Unable to delete grade."
      );
    }
  };

  // ==========================================================
  // STAT CARD - Matches Tomb Fees exactly
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
  // PAGINATION NUMBERS - with ellipsis like Tomb Fees
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
          MAIN CONTENT - Full width like Tomb Fees
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
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Grade Master</Text>
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
                GRADE MASTER
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
                Grade Master
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage grade records used in
                church and member details.
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
                navigate("/grade/add")
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

              Add Grade
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
            <StatCard
              icon={LuGraduationCap}
              title="Total Grades"
              value={totalGrades}
            />

            <StatCard
              icon={LuCalendarDays}
              title="Recently Updated"
              value={recentlyUpdatedCount}
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
                  placeholder="Search grade name"
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
                TABLE - Custom table like Tomb Fees
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
                minW="850px"
                borderCollapse="collapse"
              >
                {/* TABLE HEADER */}

                <Box as="thead">
                  <Box
                    as="tr"
                    height="42px"
                  >
                    {[
                      "Grade Name",
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
                        colSpan={3}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading grades...
                      </Box>
                    </Box>
                  ) : paginatedGrades.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={3}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No grades found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedGrades.map(
                      (grade) => (
                        <Box
                          as="tr"
                          key={grade.id}
                          height="42px"
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* GRADE NAME */}

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
                            {grade.name || "-"}
                          </Box>

                          {/* LAST UPDATED - with time */}

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
                              grade.updated_at
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
                                    `/grade/${grade.id}`
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
                                    `/grade/${grade.id}/edit`
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
                PAGINATION - Like Tomb Fees
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
                {filteredGrades.length === 0
                  ? "Showing 0 grades"
                  : `Showing ${
                      startIndex + 1
                    }–${Math.min(
                      startIndex +
                        paginatedGrades.length,
                      filteredGrades.length
                    )} of ${
                      filteredGrades.length
                    } grades`}
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

export default GradePage;