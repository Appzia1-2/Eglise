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
  LuHeartPulse,
  LuPencil,
  LuPlus,
  LuSearch,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listDeaths,
  listFamilies,
  listMembers,
} from "../api/registryServices";

import { listTombTypes } from "../api/churchServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";

const PAGE_SIZE = 8;

const DeathRegisterPage = () => {
  const navigate = useNavigate();

  const [deaths, setDeaths] = useState([]);
  const [tombTypes, setTombTypes] = useState([]);
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTombType, setSelectedTombType] = useState("ALL");

  const [page, setPage] = useState(1);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [deathRes, tombRes, familyRes, memberRes] =
        await Promise.all([
          listDeaths(),
          listTombTypes(),
          listFamilies(),
          listMembers(),
        ]);

      const deathData =
        deathRes?.data?.results ??
        deathRes?.data ??
        deathRes ??
        [];

      const tombData =
        tombRes?.data?.results ??
        tombRes?.data ??
        tombRes ??
        [];

      const familyData =
        familyRes?.data?.results ??
        familyRes?.data ??
        familyRes ??
        [];

      const memberData =
        memberRes?.data?.results ??
        memberRes?.data ??
        memberRes ??
        [];

      setDeaths(
        Array.isArray(deathData) ? deathData : []
      );

      setTombTypes(
        Array.isArray(tombData) ? tombData : []
      );

      setFamilies(
        Array.isArray(familyData) ? familyData : []
      );

      const activeMembers = Array.isArray(memberData)
        ? memberData.filter(
            (m) =>
              m.is_active !== false &&
              m.expired !== true
          )
        : [];

      setMembers(activeMembers);
    } catch (err) {
      console.error(
        "Error loading death register:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load death register records."
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

  const getFamily = (death) => {
    const familyId =
      death?.family?.id ??
      death?.family_id ??
      death?.family;

    return (
      families.find(
        (family) =>
          String(family.id) === String(familyId)
      ) || null
    );
  };

  const getMember = (death) => {
    const memberId =
      death?.member?.id ??
      death?.member_id ??
      death?.member;

    return (
      members.find(
        (member) =>
          String(member.id) === String(memberId)
      ) || null
    );
  };

  const getTombType = (death) => {
    const tombId =
      death?.tomb_type?.id ??
      death?.tomb_type_id ??
      death?.tomb_type;

    return (
      tombTypes.find(
        (tomb) =>
          String(tomb.id) === String(tombId)
      ) || null
    );
  };

  const getDeathName = (death) => {
    return (
      death?.member_name ||
      death?.member?.name ||
      getMember(death)?.name ||
      "Unknown Member"
    );
  };

  const getFamilyName = (death) => {
    const family = getFamily(death);

    return (
      death?.family_name ||
      death?.family?.family_name ||
      family?.family_name ||
      "N/A"
    );
  };

  const getHouseName = (death) => {
    const family = getFamily(death);

    return (
      death?.house_name ||
      death?.family?.house_name ||
      family?.house_name ||
      ""
    );
  };

  const getTombName = (death) => {
    const tomb = getTombType(death);

    return (
      tomb?.name ||
      death?.tomb_type?.name ||
      "Common Tomb"
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

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredDeaths = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return deaths.filter((death) => {
      const name = getDeathName(death)
        .toLowerCase();

      const family = getFamilyName(death)
        .toLowerCase();

      const house = getHouseName(death)
        .toLowerCase();

      const reason = String(
        death?.reason_of_death || ""
      ).toLowerCase();

      const tombName = getTombName(death)
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        family.includes(keyword) ||
        house.includes(keyword) ||
        reason.includes(keyword) ||
        tombName.includes(keyword);

      if (!matchesSearch) {
        return false;
      }

      if (selectedTombType === "ALL") {
        return true;
      }

      const deathTombId =
        death?.tomb_type?.id ??
        death?.tomb_type_id ??
        death?.tomb_type;

      return (
        String(deathTombId) ===
        String(selectedTombType)
      );
    });
  }, [
    deaths,
    families,
    members,
    tombTypes,
    search,
    selectedTombType,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalItems = filteredDeaths.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / PAGE_SIZE)
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const paginatedDeaths =
    filteredDeaths.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [search, selectedTombType]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const currentDate = new Date();
  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  const deathsThisYear = useMemo(() => {
    return deaths.filter((death) => {
      if (!death?.died_on) {
        return false;
      }

      const date = new Date(
        death.died_on
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date.getFullYear() ===
        currentYear
      );
    }).length;
  }, [deaths, currentYear]);

  const deathsThisMonth = useMemo(() => {
    return deaths.filter((death) => {
      if (!death?.died_on) {
        return false;
      }

      const date = new Date(
        death.died_on
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date.getFullYear() ===
          currentYear &&
        date.getMonth() ===
          currentMonth
      );
    }).length;
  }, [
    deaths,
    currentYear,
    currentMonth,
  ]);

  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const pageNumbers = [];

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
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
        maxW="1400px"
        px={{ base: 4, md: 5 }}
        py={{ base: 3, md: 4 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
          color={SECONDARY_TEXT}
          fontSize="12px"
        >
          <Text>Masters</Text>
          <Text>/</Text>
          <Text>Death Register</Text>
        </HStack>

        {/* ==================================================
            HEADER
        ================================================== */}

        <Flex
          justify="space-between"
          align={{
            base: "stretch",
            md: "center",
          }}
          direction={{
            base: "column",
            md: "row",
          }}
          gap={4}
          mb={4}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={PRIMARY_RED}
              mb={1}
              letterSpacing="0.4px"
            >
              DEATH REGISTER
            </Text>

            <Heading
              color={TEXT_COLOR}
              fontSize={{
                base: "22px",
                md: "26px",
              }}
              lineHeight="1.1"
              mb={1}
            >
              Death Register
            </Heading>

            <Text
              color={SECONDARY_TEXT}
              fontSize="12px"
            >
              Manage death and funeral records
              of parish members.
            </Text>
          </Box>

          {/* HEADER ACTIONS */}

          <HStack
            gap={2}
            flexWrap="wrap"
          >
            <select
              value={selectedTombType}
              onChange={(e) =>
                setSelectedTombType(
                  e.target.value
                )
              }
              style={{
                height: "38px",
                minWidth: "180px",
                border:
                  "1px solid #5277C7",
                borderRadius: "6px",
                padding:
                  "0 32px 0 12px",
                fontSize: "13px",
                color: TEXT_COLOR,
                background: "white",
                outline: "none",
              }}
            >
              <option value="ALL">
                All Tomb Types
              </option>

              {tombTypes.map((tomb) => (
                <option
                  key={tomb.id}
                  value={tomb.id}
                >
                  {tomb.name}
                </option>
              ))}
            </select>

            <Button
              bg={PRIMARY_RED}
              color="white"
              px={5}
              h="38px"
              fontSize="13px"
              borderRadius="6px"
              onClick={() =>
                navigate("/death/add")
              }
              _hover={{
                bg: DARK_RED,
              }}
            >
              <LuPlus
                size={17}
                style={{
                  marginRight: "7px",
                }}
              />

              Add Death Record
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            DIRECTORY STATISTICS
        ================================================== */}

        <Box
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="8px"
          px={{ base: 4, md: 5 }}
          py={4}
          mb={5}
        >
          <Flex
            align="center"
            gap={4}
            direction={{
              base: "column",
              lg: "row",
            }}
          >
            {/* DIRECTORY */}

            <Flex
              align="center"
              width={{
                base: "100%",
                lg: "280px",
              }}
              flexShrink={0}
            >
              <Box
                width="68px"
                height="68px"
                borderRadius="50%"
                bg="#FFF5F7"
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexShrink={0}
              >
                <LuChurch
                  size={36}
                  color={PRIMARY_RED}
                  strokeWidth={1.5}
                />
              </Box>

              <Box pl={4}>
                <Text
                  color={TEXT_COLOR}
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  Death Register
                  Directory
                </Text>

               
              </Box>
            </Flex>

            {/* DIVIDER */}

            <Box
              display={{
                base: "none",
                lg: "block",
              }}
              width="1px"
              height="60px"
              bg={BORDER_COLOR}
            />

            {/* STATS */}

            <Flex
              flex="1"
              width="100%"
              justify="space-around"
              align="center"
              gap={3}
              direction={{
                base: "column",
                md: "row",
              }}
            >
              <StatItem
                value={deathsThisYear}
                label="Deaths This Year"
              />

              <Box
                display={{
                  base: "none",
                  md: "block",
                }}
                width="1px"
                height="48px"
                bg={BORDER_COLOR}
              />

              <StatItem
                value={deathsThisMonth}
                label="This Month"
              />

              <Box
                display={{
                  base: "none",
                  md: "block",
                }}
                width="1px"
                height="48px"
                bg={BORDER_COLOR}
              />

              <StatItem
                value={deaths.length}
                label="Total Records"
              />
            </Flex>

            {/* SEARCH */}

            <Box
              position="relative"
              width={{
                base: "100%",
                lg: "260px",
              }}
              flexShrink={0}
            >
              <Box
                position="absolute"
                left="13px"
                top="50%"
                transform="translateY(-50%)"
                color={SECONDARY_TEXT}
                zIndex={1}
              >
                <LuSearch size={16} />
              </Box>

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search records"
                pl="40px"
                h="38px"
                fontSize="13px"
                borderColor={
                  BORDER_COLOR
                }
                borderRadius="6px"
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
          </Flex>
        </Box>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <Box
            mb={4}
            p={3}
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
            RECORD HEADER
        ================================================== */}

        <Flex
          justify="space-between"
          align="center"
          mb={3}
        >
          <HStack gap={2}>
            <Heading
              color={TEXT_COLOR}
              fontSize="20px"
              fontWeight="600"
            >
              Death Records
            </Heading>

            <Box
              bg="#F1F3F6"
              px={2.5}
              py={1}
              borderRadius="5px"
            >
              <Text
                fontSize="10px"
                fontWeight="600"
                color={SECONDARY_TEXT}
              >
                {filteredDeaths.length}
              </Text>
            </Box>
          </HStack>
        </Flex>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="8px"
            py={10}
            textAlign="center"
          >
            <Text
              color={SECONDARY_TEXT}
              fontSize="12px"
            >
              Loading death records...
            </Text>
          </Box>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filteredDeaths.length === 0 && (
            <Box
              border={`1px solid ${BORDER_COLOR}`}
              borderRadius="8px"
              py={12}
              textAlign="center"
            >
              <LuChurch
                size={40}
                color="#C8CFD9"
                style={{
                  margin:
                    "0 auto 10px",
                }}
              />

              <Text
                color={TEXT_COLOR}
                fontSize="15px"
                fontWeight="600"
              >
                No death records found
              </Text>

              <Text
                color={SECONDARY_TEXT}
                fontSize="12px"
                mt={1}
              >
                Try changing your search
                or tomb type filter.
              </Text>

              <Button
                mt={4}
                bg={PRIMARY_RED}
                color="white"
                fontSize="12px"
                h="34px"
                onClick={() =>
                  navigate("/death/add")
                }
                _hover={{
                  bg: DARK_RED,
                }}
              >
                <LuPlus
                  size={15}
                  style={{
                    marginRight: "6px",
                  }}
                />

                Add Death Record
              </Button>
            </Box>
          )}

        {/* ==================================================
            DEATH CARDS
        ================================================== */}

        {!loading &&
          paginatedDeaths.length > 0 && (
            <SimpleGrid
              columns={{
                base: 1,
                sm: 2,
                lg: 3,
                xl: 4,
              }}
              gap={5}
            >
              {paginatedDeaths.map(
                (death) => (
                  <DeathCard
                    key={death.id}
                    death={death}
                    name={getDeathName(
                      death
                    )}
                    family={getFamilyName(
                      death
                    )}
                    house={getHouseName(
                      death
                    )}
                    tombName={getTombName(
                      death
                    )}
                    formatDate={
                      formatDate
                    }
                    onView={() =>
                      navigate(
                        `/death/${death.id}`
                      )
                    }
                    onEdit={() =>
                      navigate(
                        `/death/${death.id}/edit`
                      )
                    }
                  />
                )
              )}
            </SimpleGrid>
          )}

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {!loading &&
          filteredDeaths.length > 0 && (
            <Flex
              mt={4}
              align="center"
              justify="space-between"
              direction={{
                base: "column",
                md: "row",
              }}
              gap={2}
            >
              <Text
                color={SECONDARY_TEXT}
                fontSize="11px"
              >
                Showing{" "}
                {totalItems === 0
                  ? 0
                  : startIndex + 1}
                -
                {Math.min(
                  startIndex +
                    paginatedDeaths.length,
                  totalItems
                )}{" "}
                of {totalItems} records
              </Text>

              <HStack gap={1}>
                {/* FIRST */}

                <Button
                  variant="outline"
                  size="xs"
                  h="28px"
                  minW="28px"
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
                    setPage(1)
                  }
                >
                  <Text
                    fontSize="12px"
                  >
                    «
                  </Text>
                </Button>

                {/* PREVIOUS */}

                <Button
                  variant="outline"
                  size="xs"
                  h="28px"
                  minW="28px"
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
                >
                  <LuChevronLeft
                    size={13}
                  />
                </Button>

                {/* NUMBERS */}

                {pageNumbers.map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      size="xs"
                      h="28px"
                      minW="28px"
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
                            : "#FFF5F7",
                      }}
                    >
                      {pageNumber}
                    </Button>
                  )
                )}

                {/* NEXT */}

                <Button
                  variant="outline"
                  size="xs"
                  h="28px"
                  minW="28px"
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
                >
                  <LuChevronRight
                    size={13}
                  />
                </Button>

                {/* LAST */}

                <Button
                  variant="outline"
                  size="xs"
                  h="28px"
                  minW="28px"
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
                    setPage(totalPages)
                  }
                >
                  <Text
                    fontSize="12px"
                  >
                    »
                  </Text>
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
// STAT ITEM
// ==========================================================

const StatItem = ({
  value,
  label,
}) => {
  return (
    <Box
      textAlign="center"
      minW="120px"
    >
      <Text
        fontSize="25px"
        fontWeight="700"
        color={PRIMARY_RED}
        lineHeight="1"
      >
        {value}
      </Text>

      <Text
        mt={2}
        fontSize="11px"
        color="#315AB5"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Box>
  );
};

// ==========================================================
// DEATH CARD
// ==========================================================

const DeathCard = ({
  death,
  name,
  family,
  house,
  tombName,
  formatDate,
  onView,
  onEdit,
}) => {
  return (
    <Box
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="8px"
      bg="white"
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease"
      _hover={{
        boxShadow:
          "0 4px 12px rgba(24,35,56,0.1)",
        borderColor: "#B8C2D2",
        transform:
          "translateY(-2px)",
      }}
    >
      {/* CARD HEADER */}

      <Flex
        px={4}
        pt={4}
        pb={3}
        justify="space-between"
        align="flex-start"
        gap={2}
      >
        <Box
          minW={0}
          flex="1"
        >
          <Text
            color={TEXT_COLOR}
            fontSize="15px"
            fontWeight="600"
            lineHeight="1.3"
            noOfLines={1}
          >
            {name}
          </Text>

          <Text
            color="#315AB5"
            fontSize="13px"
            mt={0.5}
            noOfLines={1}
          >
            {family}
          </Text>
        </Box>

        {/* TOMB BADGE */}

        <Box
          flexShrink={0}
          bg="#EAF7EC"
          color="#238B2D"
          px={2.5}
          py="4px"
          borderRadius="4px"
          textAlign="center"
        >
          <Text
            fontSize="11px"
            fontWeight="600"
            whiteSpace="nowrap"
          >
            {tombName}
          </Text>
        </Box>
      </Flex>

      {/* DATE DETAILS */}

      <VStack
        align="stretch"
        gap={2}
        px={4}
        py={3}
      >
        <Flex align="center" gap={2}>
          <LuCalendarDays
            size={14}
            color={TEXT_COLOR}
            strokeWidth={1.5}
          />

          <Text
            fontSize="12px"
            color={TEXT_COLOR}
          >
            Death • {formatDate(
              death?.died_on
            )}
          </Text>
        </Flex>

        <Flex align="center" gap={2}>
          <LuCalendarDays
            size={14}
            color={TEXT_COLOR}
            strokeWidth={1.5}
          />

          <Text
            fontSize="12px"
            color={TEXT_COLOR}
          >
            Funeral • {formatDate(
              death?.funeral_on
            )}
          </Text>
        </Flex>

        <Flex align="center" gap={2}>
          <LuHeartPulse
            size={14}
            color={TEXT_COLOR}
            strokeWidth={1.5}
          />

          <Text
            fontSize="12px"
            color={TEXT_COLOR}
          >
            {death?.reason_of_death ||
              "Not specified"}
          </Text>
        </Flex>
      </VStack>

      {/* CARD FOOTER */}

      <Flex
        px={4}
        py={3}
        mt={2}
        justify="space-between"
        align="center"
        borderTop={`1px solid ${BORDER_COLOR}`}
      >
        <Text
          fontSize="12px"
          color="#315AB5"
          fontWeight="500"
        >
          Tomb Charge{" "}
          <Text
            as="span"
            fontWeight="600"
          >
            ₹
            {Number(
              death?.tomb_charge || 0
            ).toLocaleString(
              "en-IN"
            )}
          </Text>
        </Text>

        <HStack gap={1}>
          {/* VIEW */}

          <Button
            variant="ghost"
            size="sm"
            h="28px"
            minW="28px"
            p={0}
            color={PRIMARY_RED}
            borderRadius="4px"
            onClick={onView}
            title="View"
            _hover={{
              bg: "#FFF5F7",
            }}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <LuEye size={16} />
          </Button>

          {/* EDIT */}

          <Button
            variant="ghost"
            size="sm"
            h="28px"
            minW="28px"
            p={0}
            color={PRIMARY_RED}
            borderRadius="4px"
            onClick={onEdit}
            title="Edit"
            _hover={{
              bg: "#FFF5F7",
            }}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <LuPencil size={16} />
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default DeathRegisterPage;