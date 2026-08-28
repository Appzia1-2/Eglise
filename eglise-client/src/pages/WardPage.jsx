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
  LuMapPin,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listWards,
  deleteWard,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const WardPage = () => {
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadWards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listWards();

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.results || [];

      setWards(items);
    } catch (err) {
      console.error("Error loading wards:", err);
      setError("Unable to load ward records.");
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredWards = useMemo(() => {
    let result = [...wards];

    const searchText = search.trim().toLowerCase();

    // ========================================================
    // SEARCH
    // ========================================================

    if (searchText) {
      result = result.filter((ward) => {
        const wardNumber = String(ward.ward_number || "").toLowerCase();
        const wardName = String(ward.ward_name || "").toLowerCase();
        const place = String(ward.place || "").toLowerCase();

        return (
          wardNumber.includes(searchText) ||
          wardName.includes(searchText) ||
          place.includes(searchText)
        );
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

      result = result.filter((ward) => {
        if (!ward.updated_at) return false;
        const updated = new Date(ward.updated_at);
        if (Number.isNaN(updated.getTime())) return false;
        return updated >= sevenDaysAgo && updated <= now;
      });
    }

    return result;
  }, [wards, search, filter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredWards.length / pageSize
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedWards =
    filteredWards.slice(
      startIndex,
      startIndex + pageSize
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalWards = wards.length;

  const recentlyUpdatedCount = useMemo(() => {
    if (!wards.length) return 0;

    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    return wards.filter((ward) => {
      if (!ward.updated_at) return false;
      const updated = new Date(ward.updated_at);
      if (Number.isNaN(updated.getTime())) return false;
      return updated >= sevenDaysAgo && updated <= now;
    }).length;
  }, [wards]);

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
      "Are you sure you want to delete this ward?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteWard(id);
      await loadWards();
    } catch (err) {
      console.error("Error deleting ward:", err);
      alert(
        err?.response?.data?.detail ||
          "Unable to delete ward."
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
            <Text>Ward Master</Text>
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
                WARD MASTER
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
                Ward Master
              </Heading>

              <Text
                color={MUTED}
                fontSize="11px"
              >
                Manage ward records used in church
                and member details.
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
                navigate("/ward/add")
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

              Add Ward
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
              icon={LuMapPin}
              title="Total Wards"
              value={totalWards}
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
                  placeholder="Search ward name, number or place"
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
                      "Ward Number",
                      "Ward Name",
                      "Place",
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
                        colSpan={5}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading wards...
                      </Box>
                    </Box>
                  ) : paginatedWards.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={5}
                        textAlign="center"
                        height="48px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No wards found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedWards.map(
                      (ward) => (
                        <Box
                          as="tr"
                          key={ward.id}
                          height="42px"
                          _hover={{
                            bg: "#FFFBFC",
                          }}
                        >
                          {/* WARD NUMBER */}

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
                            W-{String(ward.ward_number).padStart(3, "0")}
                          </Box>

                          {/* WARD NAME */}

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
                            {ward.ward_name || "-"}
                          </Box>

                          {/* PLACE */}

                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {ward.place || "-"}
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
                              ward.updated_at
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

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(
                                    `/ward/${ward.id}`
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
                                    `/ward/${ward.id}/edit`
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
                {filteredWards.length === 0
                  ? "Showing 0 wards"
                  : `Showing ${
                      startIndex + 1
                    }–${Math.min(
                      startIndex +
                        paginatedWards.length,
                      filteredWards.length
                    )} of ${
                      filteredWards.length
                    } wards`}
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

export default WardPage;