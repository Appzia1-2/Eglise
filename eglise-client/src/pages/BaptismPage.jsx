
// src/pages/BaptismPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuChurch,
  LuEye,
  LuPencil,
  LuPlus,
  LuSearch,
  LuUsers,
  LuUserRound,
  LuBaby,
  LuFilter,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listBaptisms,
  listFamilies,
} from "../api/registryServices";

// ==========================================================
// COLORS
// ==========================================================

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const PRIMARY_BLUE = "#1F3A7D";
const SECONDARY_BLUE = "#315AB5";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const LIGHT_RED_BG = "#FFF5F7";
const LIGHT_BLUE_BG = "#F5F7FF";

const PAGE_SIZE = 8;

// ==========================================================
// BAPTISM PAGE
// ==========================================================

const BaptismPage = () => {
  const navigate = useNavigate();

  const [baptisms, setBaptisms] = useState([]);
  const [families, setFamilies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [selectedParish, setSelectedParish] =
    useState("ALL");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [page, setPage] = useState(1);

  // Used so the Filter button explicitly applies the filters.
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "ALL",
    parish: "ALL",
    date: "",
  });

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [baptismRes, familyRes] =
        await Promise.all([
          listBaptisms(),
          listFamilies(),
        ]);

      const baptismData =
        baptismRes?.data?.results ??
        baptismRes?.data ??
        baptismRes ??
        [];

      const familyData =
        familyRes?.data?.results ??
        familyRes?.data ??
        familyRes ??
        [];

      setBaptisms(
        Array.isArray(baptismData)
          ? baptismData
          : []
      );

      setFamilies(
        Array.isArray(familyData)
          ? familyData
          : []
      );
    } catch (err) {
      console.error(
        "Error loading baptism register:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load baptism register records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getFamily = (baptism) => {
    const familyId =
      baptism?.family?.id ??
      baptism?.family_id ??
      baptism?.family;

    return (
      families.find(
        (family) =>
          String(family.id) ===
          String(familyId)
      ) || null
    );
  };

  const getName = (baptism) => {
    return (
      baptism?.name ||
      baptism?.baptismal_name ||
      "Unknown"
    );
  };

  const getBaptismalName = (baptism) => {
    return (
      baptism?.baptismal_name ||
      baptism?.name ||
      "-"
    );
  };

  const getFamilyName = (baptism) => {
    const family = getFamily(baptism);

    return (
      baptism?.family_name ||
      baptism?.family?.family_name ||
      family?.family_name ||
      "N/A"
    );
  };

  const getCategory = (baptism) => {
    return (
      baptism?.baptism_category ||
      baptism?.category ||
      "OTHER"
    );
  };

  const getCategoryName = (baptism) => {
    return getCategory(baptism) === "PARISH"
      ? "Parish Member"
      : "Other Parish Member";
  };

  const getParishName = (baptism) => {
    return (
      baptism?.parish_of_baptism ||
      "N/A"
    );
  };

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

  // Normalize date for filtering.
  // Handles both YYYY-MM-DD and full ISO datetime values.
  const normalizeDate = (value) => {
    if (!value) {
      return "";
    }

    const stringValue = String(value);

    if (stringValue.includes("T")) {
      return stringValue.split("T")[0];
    }

    if (stringValue.includes(" ")) {
      return stringValue.split(" ")[0];
    }

    return stringValue;
  };

  // ==========================================================
  // PARISH OPTIONS
  // ==========================================================

  const parishOptions = useMemo(() => {
    const values = baptisms
      .map(
        (baptism) =>
          baptism?.parish_of_baptism
      )
      .filter(Boolean);

    return [...new Set(values)].sort(
      (a, b) =>
        String(a).localeCompare(String(b))
    );
  }, [baptisms]);

  // ==========================================================
  // APPLY FILTER BUTTON
  // ==========================================================

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: search.trim(),
      category: selectedCategory,
      parish: selectedParish,
      date: selectedDate,
    });

    setPage(1);
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredBaptisms = useMemo(() => {
    const keyword =
      appliedFilters.search
        .trim()
        .toLowerCase();

    return baptisms.filter((baptism) => {
      const name = getName(baptism)
        .toLowerCase();

      const baptismalName =
        getBaptismalName(baptism)
          .toLowerCase();

      const familyName =
        getFamilyName(baptism)
          .toLowerCase();

      const registerNumber = String(
        baptism?.register_number || ""
      ).toLowerCase();

      const parishName =
        getParishName(baptism)
          .toLowerCase();

      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        baptismalName.includes(keyword) ||
        familyName.includes(keyword) ||
        registerNumber.includes(keyword) ||
        parishName.includes(keyword);

      if (!matchesSearch) {
        return false;
      }

      // ------------------------------------------------------
      // CATEGORY
      // ------------------------------------------------------

      if (
        appliedFilters.category !== "ALL" &&
        getCategory(baptism) !==
          appliedFilters.category
      ) {
        return false;
      }

      // ------------------------------------------------------
      // PARISH
      // ------------------------------------------------------

      if (
        appliedFilters.parish !== "ALL" &&
        getParishName(baptism) !==
          appliedFilters.parish
      ) {
        return false;
      }

      // ------------------------------------------------------
      // DATE
      // ------------------------------------------------------

      if (
        appliedFilters.date &&
        normalizeDate(
          baptism?.date_of_baptism
        ) !== appliedFilters.date
      ) {
        return false;
      }

      return true;
    });
  }, [
    baptisms,
    families,
    appliedFilters,
  ]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const currentDate = new Date();

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  const parishMembers = useMemo(() => {
    return baptisms.filter(
      (baptism) =>
        getCategory(baptism) === "PARISH"
    ).length;
  }, [baptisms]);

  const otherMembers = useMemo(() => {
    return baptisms.filter(
      (baptism) =>
        getCategory(baptism) === "OTHER"
    ).length;
  }, [baptisms]);

  const baptismsThisYear = useMemo(() => {
    return baptisms.filter((baptism) => {
      if (!baptism?.date_of_baptism) {
        return false;
      }

      const date = new Date(
        baptism.date_of_baptism
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date.getFullYear() ===
        currentYear
      );
    }).length;
  }, [baptisms, currentYear]);

  const baptismsThisMonth = useMemo(() => {
    return baptisms.filter((baptism) => {
      if (!baptism?.date_of_baptism) {
        return false;
      }

      const date = new Date(
        baptism.date_of_baptism
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date.getFullYear() ===
          currentYear &&
        date.getMonth() === currentMonth
      );
    }).length;
  }, [
    baptisms,
    currentYear,
    currentMonth,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalItems =
    filteredBaptisms.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const paginatedBaptisms =
    filteredBaptisms.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1
      );
    }

    if (safePage <= 3) {
      return [
        1,
        2,
        3,
        "...",
        totalPages,
      ];
    }

    if (safePage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      safePage,
      "...",
      totalPages,
    ];
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
        maxW="1400px"
        px={{
          base: 3,
          md: 4,
          lg: 5,
        }}
        pt={{
          base: 2,
          md: 3,
        }}
        pb={{
          base: 4,
          md: 5,
        }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={1.5}
          mb={0}
          color={SECONDARY_BLUE}
          fontSize="11px"
        >
          <Text>Masters</Text>

          <Text>/</Text>

          <Text fontWeight="500">
            Baptism Register
          </Text>
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
          <Box flex="1">
            <Text
              fontSize="9px"
              fontWeight="700"
              color={PRIMARY_RED}
              mb={0.5}
              letterSpacing="0.5px"
            >
              BAPTISM REGISTER
            </Text>

            <Heading
              color={PRIMARY_BLUE}
              fontSize={{
                base: "22px",
                md: "25px",
              }}
              fontWeight="700"
              lineHeight="1.15"
              mb={0.5}
            >
              Baptism Register Dashboard
            </Heading>

            <Text
              color={SECONDARY_TEXT}
              fontSize="11px"
            >
              Manage parish and other parish
              member baptism records.
            </Text>
          </Box>

          {/* HEADER ACTION */}

          <Button
            bg={PRIMARY_RED}
            color="white"
            px={4}
            h="34px"
            fontSize="11px"
            fontWeight="600"
            borderRadius="5px"
            onClick={() =>
              navigate("/baptism/add")
            }
            _hover={{
              bg: DARK_RED,
            }}
            flexShrink={0}
          >
            <LuPlus
              size={15}
              style={{
                marginRight: "6px",
              }}
            />

            Add Baptism
          </Button>
        </Flex>

        {/* ==================================================
            STATS
        ================================================== */}

        <Flex
          bg="white"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="7px"
          mb={3}
          align="stretch"
          px={1}
          py={1}
          gap={0}
          direction={{
            base: "column",
            md: "row",
          }}
          minH={{
            base: "auto",
            md: "68px",
          }}
        >
          <HorizontalStatItem
            icon={
              <LuBaby
                size={23}
                color={PRIMARY_RED}
              />
            }
            value={baptisms.length}
            label="Total Baptisms"
          />

          <Box
            display={{
              base: "none",
              md: "block",
            }}
            width="1px"
            height="42px"
            bg={BORDER_COLOR}
            alignSelf="center"
          />

          <HorizontalStatItem
            icon={
              <LuUsers
                size={23}
                color={PRIMARY_RED}
              />
            }
            value={parishMembers}
            label="Parish Members"
          />

          <Box
            display={{
              base: "none",
              md: "block",
            }}
            width="1px"
            height="42px"
            bg={BORDER_COLOR}
            alignSelf="center"
          />

          <HorizontalStatItem
            icon={
              <LuUserRound
                size={23}
                color={PRIMARY_RED}
              />
            }
            value={otherMembers}
            label="Other Parish Members"
          />

          <Box
            display={{
              base: "none",
              md: "block",
            }}
            width="1px"
            height="42px"
            bg={BORDER_COLOR}
            alignSelf="center"
          />

          <HorizontalStatItem
            icon={
              <LuCalendarDays
                size={23}
                color={PRIMARY_RED}
              />
            }
            value={baptismsThisMonth}
            label="This Month"
          />
        </Flex>

        {/* ==================================================
            SEARCH & FILTER
        ================================================== */}

        <Flex
          align="center"
          gap={2}
          mb={3}
          direction={{
            base: "column",
            lg: "row",
          }}
        >
          {/* SEARCH */}

          <Box
            position="relative"
            flex="1"
            minW="0"
            w={{
              base: "100%",
              lg: "auto",
            }}
          >
            <Box
              position="absolute"
              left="10px"
              top="50%"
              transform="translateY(-50%)"
              color={SECONDARY_TEXT}
              zIndex={1}
            >
              <LuSearch size={14} />
            </Box>

            <Input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilters();
                }
              }}
              placeholder="Search name, baptism name or family"
              pl="32px"
              h="34px"
              fontSize="11px"
              borderColor={BORDER_COLOR}
              borderRadius="5px"
              color={TEXT_COLOR}
              _placeholder={{
                color: "#8B98AB",
              }}
              _focus={{
                borderColor:
                  PRIMARY_RED,
                boxShadow:
                  `0 0 0 1px ${PRIMARY_RED}`,
              }}
            />
          </Box>

          {/* FILTERS */}

          <HStack
            gap={2}
            flexShrink={0}
            flexWrap="wrap"
            justify={{
              base: "stretch",
              lg: "flex-end",
            }}
          >
            {/* CATEGORY */}

            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value
                )
              }
              style={{
                height: "34px",
                minWidth: "145px",
                border:
                  `1px solid ${BORDER_COLOR}`,
                borderRadius: "5px",
                padding:
                  "0 28px 0 9px",
                fontSize: "11px",
                color: TEXT_COLOR,
                background: "white",
                outline: "none",
              }}
            >
              <option value="ALL">
                All Member Types
              </option>

              <option value="PARISH">
                Parish Member
              </option>

              <option value="OTHER">
                Other Parish Member
              </option>
            </select>

            {/* PARISH */}

            <select
              value={selectedParish}
              onChange={(e) =>
                setSelectedParish(
                  e.target.value
                )
              }
              style={{
                height: "34px",
                minWidth: "145px",
                border:
                  `1px solid ${BORDER_COLOR}`,
                borderRadius: "5px",
                padding:
                  "0 28px 0 9px",
                fontSize: "11px",
                color: TEXT_COLOR,
                background: "white",
                outline: "none",
              }}
            >
              <option value="ALL">
                All Parishes
              </option>

              {parishOptions.map(
                (parish) => (
                  <option
                    key={parish}
                    value={parish}
                  >
                    {parish}
                  </option>
                )
              )}
            </select>

            {/* DATE */}

            <Box position="relative">
              <Box
                position="absolute"
                left="9px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
                pointerEvents="none"
                color={SECONDARY_TEXT}
              >
                <LuCalendarDays
                  size={13}
                />
              </Box>

              <Input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
                h="34px"
                w="145px"
                pl="29px"
                fontSize="11px"
                borderColor={
                  BORDER_COLOR
                }
                borderRadius="5px"
              />
            </Box>

            {/* FILTER BUTTON */}

            <Button
              bg={
                appliedFilters.search !==
                  search.trim() ||
                appliedFilters.category !==
                  selectedCategory ||
                appliedFilters.parish !==
                  selectedParish ||
                appliedFilters.date !==
                  selectedDate
                  ? PRIMARY_RED
                  : "white"
              }
              color={
                appliedFilters.search !==
                  search.trim() ||
                appliedFilters.category !==
                  selectedCategory ||
                appliedFilters.parish !==
                  selectedParish ||
                appliedFilters.date !==
                  selectedDate
                  ? "white"
                  : PRIMARY_RED
              }
              border="1px solid"
              borderColor={
                PRIMARY_RED
              }
              h="34px"
              px={3}
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              onClick={
                handleApplyFilters
              }
              _hover={{
                bg: DARK_RED,
                color: "white",
                borderColor:
                  DARK_RED,
              }}
            >
              <LuFilter
                size={14}
                style={{
                  marginRight: "5px",
                }}
              />

              Filter
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <Box
            mb={3}
            p={2}
            borderRadius="5px"
            bg="#FFF5F5"
            border="1px solid #FED7D7"
          >
            <Text
              color="red.600"
              fontSize="10px"
            >
              {error}
            </Text>
          </Box>
        )}

        {/* ==================================================
            RECORD TITLE
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
        >
          <Heading
            color={PRIMARY_BLUE}
            fontSize="16px"
            fontWeight="700"
          >
            Baptism Records
          </Heading>

          <Text
            fontSize="10px"
            color={SECONDARY_TEXT}
          >
            Showing{" "}
            {totalItems === 0
              ? 0
              : startIndex + 1}
            -
            {Math.min(
              startIndex +
                paginatedBaptisms.length,
              totalItems
            )}{" "}
            of {totalItems} records
          </Text>
        </HStack>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="6px"
            py={10}
            textAlign="center"
          >
            <Text
              color={SECONDARY_TEXT}
              fontSize="11px"
            >
              Loading baptism records...
            </Text>
          </Box>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filteredBaptisms.length === 0 && (
            <Box
              border={`1px solid ${BORDER_COLOR}`}
              borderRadius="6px"
              py={10}
              textAlign="center"
            >
              <LuBaby
                size={34}
                color="#C8CFD9"
                style={{
                  margin:
                    "0 auto 8px",
                }}
              />

              <Text
                color={TEXT_COLOR}
                fontSize="13px"
                fontWeight="600"
              >
                No baptism records found
              </Text>

              <Text
                color={SECONDARY_TEXT}
                fontSize="10px"
                mt={1}
              >
                Try changing your search
                or filter options.
              </Text>

              <Button
                mt={3}
                bg={PRIMARY_RED}
                color="white"
                fontSize="10px"
                h="30px"
                onClick={() =>
                  navigate(
                    "/baptism/add"
                  )
                }
                _hover={{
                  bg: DARK_RED,
                }}
              >
                <LuPlus
                  size={13}
                  style={{
                    marginRight: "5px",
                  }}
                />

                Add Baptism
              </Button>
            </Box>
          )}

        {/* ==================================================
            BAPTISM CARDS
        ================================================== */}

        {!loading &&
          paginatedBaptisms.length > 0 && (
            <SimpleGrid
              columns={{
                base: 1,
                sm: 2,
                md: 3,
                lg: 4,
              }}
              gap={{
                base: 2.5,
                md: 3,
                lg: 3,
              }}
              mb={3}
            >
              {paginatedBaptisms.map(
                (baptism) => (
                  <BaptismCard
                    key={baptism.id}
                    baptism={baptism}
                    name={getName(
                      baptism
                    )}
                    baptismalName={getBaptismalName(
                      baptism
                    )}
                    family={getFamilyName(
                      baptism
                    )}
                    category={getCategoryName(
                      baptism
                    )}
                    formatDate={
                      formatDate
                    }
                    onView={() =>
                      navigate(
                        `/baptism/${baptism.id}`
                      )
                    }
                    onEdit={() =>
                      navigate(
                        `/baptism/${baptism.id}/edit`
                      )
                    }
                  />
                )
              )}
            </SimpleGrid>
          )}

        {/* ==================================================
            PAGINATION
            RIGHT ALIGNED
        ================================================== */}

        {!loading &&
          filteredBaptisms.length > 0 && (
            <Flex
              align="center"
              justify="flex-end"
              gap={3}
              mt={1}
              mb={1}
              w="100%"
            >
              <Text
                fontSize="10px"
                color={SECONDARY_TEXT}
                whiteSpace="nowrap"
              >
                Showing{" "}
                <Text
                  as="span"
                  fontWeight="600"
                  color={TEXT_COLOR}
                >
                  {totalItems === 0
                    ? 0
                    : startIndex + 1}
                  -
                  {Math.min(
                    startIndex +
                      paginatedBaptisms.length,
                    totalItems
                  )}
                </Text>{" "}
                of{" "}
                <Text
                  as="span"
                  fontWeight="600"
                  color={TEXT_COLOR}
                >
                  {totalItems}
                </Text>{" "}
                records
              </Text>

              <HStack
                gap={1}
                flexWrap="wrap"
                justify="flex-end"
              >
                {/* PREVIOUS */}

                <Button
                  variant="outline"
                  h="29px"
                  minW="29px"
                  px={2}
                  borderColor={
                    BORDER_COLOR
                  }
                  color={
                    SECONDARY_TEXT
                  }
                  disabled={
                    safePage === 1
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.max(
                          1,
                          prev - 1
                        )
                    )
                  }
                  _hover={{
                    bg: LIGHT_RED_BG,
                    borderColor:
                      PRIMARY_RED,
                    color: PRIMARY_RED,
                  }}
                  _disabled={{
                    opacity: 0.4,
                    cursor:
                      "not-allowed",
                  }}
                  title="Previous"
                >
                  <LuChevronLeft
                    size={14}
                  />
                </Button>

                {/* PAGE NUMBERS */}

                {getPageNumbers().map(
                  (
                    pageNumber,
                    index
                  ) => {
                    if (
                      pageNumber ===
                      "..."
                    ) {
                      return (
                        <Text
                          key={`dots-${index}`}
                          px="4px"
                          fontSize="10px"
                          color={
                            SECONDARY_TEXT
                          }
                        >
                          ...
                        </Text>
                      );
                    }

                    return (
                      <Button
                        key={
                          pageNumber
                        }
                        h="29px"
                        minW="29px"
                        px={1}
                        border="1px solid"
                        borderColor={
                          safePage ===
                          pageNumber
                            ? PRIMARY_RED
                            : BORDER_COLOR
                        }
                        bg={
                          safePage ===
                          pageNumber
                            ? PRIMARY_RED
                            : "white"
                        }
                        color={
                          safePage ===
                          pageNumber
                            ? "white"
                            : SECONDARY_TEXT
                        }
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                        _hover={{
                          bg:
                            safePage ===
                            pageNumber
                              ? DARK_RED
                              : LIGHT_RED_BG,
                          borderColor:
                            PRIMARY_RED,
                          color:
                            safePage ===
                            pageNumber
                              ? "white"
                              : PRIMARY_RED,
                        }}
                        fontSize="10px"
                        fontWeight="600"
                        borderRadius="4px"
                      >
                        {pageNumber}
                      </Button>
                    );
                  }
                )}

                {/* NEXT */}

                <Button
                  variant="outline"
                  h="29px"
                  minW="29px"
                  px={2}
                  borderColor={
                    BORDER_COLOR
                  }
                  color={
                    SECONDARY_TEXT
                  }
                  disabled={
                    safePage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.min(
                          totalPages,
                          prev + 1
                        )
                    )
                  }
                  _hover={{
                    bg: LIGHT_RED_BG,
                    borderColor:
                      PRIMARY_RED,
                    color: PRIMARY_RED,
                  }}
                  _disabled={{
                    opacity: 0.4,
                    cursor:
                      "not-allowed",
                  }}
                  title="Next"
                >
                  <LuChevronRight
                    size={14}
                  />
                </Button>
              </HStack>
            </Flex>
          )}
      </Container>

      <Footer />
    </Box>
  );
};

// ==========================================================
// HORIZONTAL STAT ITEM
// ==========================================================

const HorizontalStatItem = ({
  icon,
  value,
  label,
}) => {
  return (
    <Flex
      flex="1"
      align="center"
      justify="flex-start"
      gap={3}
      px={{
        base: 3,
        md: 4,
      }}
      py={{
        base: 2.5,
        md: 2.5,
      }}
      direction={{
        base: "column",
        md: "row",
      }}
      textAlign={{
        base: "center",
        md: "left",
      }}
    >
      <Box flexShrink={0}>
        {icon}
      </Box>

      <VStack
        align={{
          base: "center",
          md: "flex-start",
        }}
        gap={0}
      >
        <Text
          fontSize="9px"
          color={SECONDARY_BLUE}
          fontWeight="500"
          letterSpacing="0.2px"
        >
          {label}
        </Text>

        <Text
          fontSize="21px"
          fontWeight="700"
          color={PRIMARY_BLUE}
          lineHeight="1.05"
          mt="1px"
        >
          {value}
        </Text>
      </VStack>
    </Flex>
  );
};

// ==========================================================
// BAPTISM CARD
// ==========================================================

const BaptismCard = ({
  baptism,
  name,
  baptismalName,
  family,
  category,
  formatDate,
  onView,
  onEdit,
}) => {
  const isParish =
    (baptism?.baptism_category ||
      baptism?.category) ===
    "PARISH";

  return (
    <Box
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="6px"
      bg="white"
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease"
      overflow="hidden"
      minH="0"
      _hover={{
        boxShadow:
          "0 4px 12px rgba(24,35,56,0.1)",
        borderColor: "#B8C2D2",
      }}
    >
      {/* ==================================================
          CARD HEADER
      ================================================== */}

      <Flex
        px={3}
        pt={2.5}
        pb={1.5}
        justify="space-between"
        align="flex-start"
        gap={2}
      >
        <Text
          color={PRIMARY_BLUE}
          fontSize="12px"
          fontWeight="700"
          lineHeight="1.3"
          flex="1"
          minW={0}
          noOfLines={1}
        >
          {name}
        </Text>

        <Box
          flexShrink={0}
          bg={
            isParish
              ? LIGHT_RED_BG
              : LIGHT_BLUE_BG
          }
          color={
            isParish
              ? PRIMARY_RED
              : SECONDARY_BLUE
          }
          border="1px solid"
          borderColor={
            isParish
              ? "#F4A3B2"
              : "#AFC0E9"
          }
          px="6px"
          py="1.5px"
          borderRadius="3px"
          textAlign="center"
          whiteSpace="nowrap"
        >
          <Text
            fontSize="8px"
            fontWeight="700"
            letterSpacing="0.2px"
          >
            {category}
          </Text>
        </Box>
      </Flex>

      {/* ==================================================
          DETAILS ROW 1
      ================================================== */}

      <Flex
        px={3}
        gap={3}
        mb={1.5}
      >
        <Box flex="1" minW={0}>
          <Text
            fontSize="8px"
            color={TEXT_COLOR}
            fontWeight="700"
            mb="1px"
            letterSpacing="0.2px"
          >
            Reg No.
          </Text>

          <Text
            fontSize="10px"
            color={PRIMARY_BLUE}
            fontWeight="600"
            noOfLines={1}
          >
            {baptism?.register_number ||
              "-"}
          </Text>
        </Box>

        <Box flex="1" minW={0}>
          <Text
            fontSize="8px"
            color={TEXT_COLOR}
            fontWeight="700"
            mb="1px"
            letterSpacing="0.2px"
          >
            Date of Birth
          </Text>

          <Text
            fontSize="10px"
            color={TEXT_COLOR}
            noOfLines={1}
          >
            {formatDate(
              baptism?.dob
            )}
          </Text>
        </Box>
      </Flex>

      {/* ==================================================
          DETAILS ROW 2
      ================================================== */}

      <Flex
        px={3}
        gap={3}
        mb={1.5}
      >
        <Box flex="1" minW={0}>
          <Text
            fontSize="8px"
            color={TEXT_COLOR}
            fontWeight="700"
            mb="1px"
            letterSpacing="0.2px"
          >
            Baptism Name
          </Text>

          <Text
            fontSize="10px"
            color={PRIMARY_BLUE}
            fontWeight="600"
            noOfLines={1}
          >
            {baptismalName}
          </Text>
        </Box>

        <Box flex="1" minW={0}>
          <Text
            fontSize="8px"
            color={TEXT_COLOR}
            fontWeight="700"
            mb="1px"
            letterSpacing="0.2px"
          >
            Baptism Date
          </Text>

          <Text
            fontSize="10px"
            color={TEXT_COLOR}
            noOfLines={1}
          >
            {formatDate(
              baptism?.date_of_baptism
            )}
          </Text>
        </Box>
      </Flex>

      
      {/* ==================================================
          CARD FOOTER
      ================================================== */}

      <Flex
        px={3}
        py={1.5}
        justify="flex-end"
        align="center"
        gap={1}
      >
        {/* VIEW */}

        <Button
          variant="ghost"
          size="sm"
          h="24px"
          minW="24px"
          p={0}
          color={PRIMARY_RED}
          borderRadius="3px"
          onClick={onView}
          title="View"
          _hover={{
            bg: LIGHT_RED_BG,
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <LuEye
            size={14}
            strokeWidth={1.5}
          />
        </Button>

        {/* EDIT */}

        <Button
          variant="ghost"
          size="sm"
          h="24px"
          minW="24px"
          p={0}
          color={PRIMARY_RED}
          borderRadius="3px"
          onClick={onEdit}
          title="Edit"
          _hover={{
            bg: LIGHT_RED_BG,
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <LuPencil
            size={14}
            strokeWidth={1.5}
          />
        </Button>
      </Flex>
    </Box>
  );
};

export default BaptismPage;

