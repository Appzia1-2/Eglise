import React, { useEffect, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Flex,
  Image,
  Button,
  Badge,
  Input,
  Spinner,
  Icon,
} from "@chakra-ui/react";

import {
  LuSearch,
  LuPlus,
  LuUserRound,
  LuPhone,
  LuMapPin,
  LuCalendar,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getPriestMaster } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (url) => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const cleanBase = apiBase.replace(/\/+$/, "");
  const cleanUrl = url.replace(/^\/+/, "");

  return `${cleanBase}/${cleanUrl}`;
};

// ============================================================
// DATE
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// ADDRESS
// ============================================================

const getFullAddress = (priest) => {
  return [
    priest.address_line1,
    priest.address_line2,
    priest.city,
    priest.state,
    priest.country,
    priest.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
};

// ============================================================
// ACTIVE STATUS
// ============================================================

const isPriestActive = (priest) => {
  return (
    priest.is_active === true ||
    priest.is_active === 1 ||
    priest.is_active === "true" ||
    priest.is_active === "1"
  );
};

// ============================================================
// PRIEST IMAGE
// ============================================================

const PriestImage = ({
  priest,
  previous = false,
}) => {
  const [error, setError] = useState(false);

  const imageUrl = getImageUrl(
    priest.image_url ||
      priest.image ||
      priest.photo_url ||
      priest.photo
  );

  const imageSize = previous
    ? "80px"
    : "96px";

  if (!imageUrl || error) {
    return (
      <Box
        boxSize={imageSize}
        borderRadius="full"
        bg="#FFF5F7"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        border="1px solid #E3E6EA"
      >
        <Icon
          as={LuUserRound}
          boxSize={previous ? 7 : 8}
          color={PRIMARY_MAROON}
        />
      </Box>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={priest.name || "Priest"}
      boxSize={imageSize}
      borderRadius="full"
      objectFit="cover"
      flexShrink={0}
      border="1px solid #E3E6EA"
      onError={() => setError(true)}
    />
  );
};

// ============================================================
// CURRENT VICAR CARD
// ============================================================

const CurrentPriestCard = ({
  priest,
  onView,
  onEdit,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor="#E0E5EC"
      borderRadius="9px"
      bg="white"
      px={4}
      py={3}
      minH="200px"
      transition="all .2s"
      _hover={{
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.05)",
      }}
    >
      <Flex
        align="center"
        gap={4}
        h="100%"
      >
        {/* ==================================================
            PHOTO
        ================================================== */}

        <PriestImage priest={priest} />

        {/* ==================================================
            DETAILS
        ================================================== */}

        <Box
          flex="1"
          minW={0}
          alignSelf="stretch"
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Heading
            size="sm"
            color="#182338"
            mb={1}
            noOfLines={1}
          >
            {priest.name ||
              "Unnamed Priest"}
          </Heading>

          <Text
            fontSize="sm"
            color="#60708C"
            mb={2}
          >
            {priest.designation_label ||
              (priest.designation ===
              "ASSISTANT"
                ? "Assistant Vicar"
                : "Vicar")}
          </Text>

          {/* FAMILY */}

          {priest.family_name && (
            <HStack
              gap={2}
              mb={1}
              align="center"
            >
              <Icon
                as={LuUserRound}
                boxSize={4}
                color="#52627A"
              />

              <Text
                fontSize="sm"
                color="#344054"
              >
                {priest.family_name} Family
              </Text>
            </HStack>
          )}

          {/* PHONE */}

          {priest.phone_number && (
            <HStack
              gap={2}
              mb={1}
              align="center"
            >
              <Icon
                as={LuPhone}
                boxSize={4}
                color="#52627A"
              />

              <Text
                fontSize="sm"
                color="#344054"
              >
                {priest.phone_number}
              </Text>
            </HStack>
          )}

          {/* ADDRESS */}

          {getFullAddress(priest) && (
            <HStack
              gap={2}
              align="flex-start"
              mb={1}
            >
              <Icon
                as={LuMapPin}
                boxSize={4}
                color="#52627A"
                mt="2px"
              />

              <Text
                fontSize="xs"
                color="#52627A"
                lineHeight="1.4"
                noOfLines={2}
              >
                {getFullAddress(priest)}
              </Text>
            </HStack>
          )}

          {/* DATE */}

          <HStack
            gap={2}
            mt={1}
          >
            <Icon
              as={LuCalendar}
              boxSize={4}
              color="#52627A"
            />

            <Text
              fontSize="xs"
              color="#52627A"
            >
              {formatDate(
                priest.date_from ||
                  priest.serving_from
              )}

              {!(
                priest.date_to ||
                priest.serving_to
              ) && " — Present"}
            </Text>
          </HStack>
        </Box>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <VStack
          align="stretch"
          justify="center"
          gap={2}
          minW="120px"
          alignSelf="stretch"
        >
          {/* CURRENTLY SERVING */}

          <Badge
            display="flex"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            h="36px"
            px={3}
            bg="#E6F7E9"
            color="#16803A"
            borderRadius="6px"
            fontSize="xs"
            fontWeight="500"
            whiteSpace="nowrap"
          >
            Currently Serving
          </Badge>

          {/* VIEW */}

          <Button
            size="sm"
            h="36px"
            variant="outline"
            borderColor={PRIMARY_MAROON}
            color={PRIMARY_MAROON}
            onClick={() =>
              onView?.(priest)
            }
            _hover={{
              bg: "#FFF5F7",
            }}
          >
            View Details
          </Button>

          {/* EDIT */}

          <Button
            variant="ghost"
            size="sm"
            h="30px"
            color={PRIMARY_MAROON}
            justifyContent="center"
            onClick={() =>
              onEdit?.(priest)
            }
            _hover={{
              bg: "transparent",
              color: "#650A18",
            }}
          >
            Edit
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

// ============================================================
// PREVIOUS VICAR CARD
//
// Shows:
// - Photo
// - Name
// - Designation
// - Phone
// - Date
// - Previous badge
// - View Details
//
// Does NOT show:
// - Family
// - Address
// - Edit
// ============================================================

const PreviousPriestCard = ({
  priest,
  onView,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor="#E0E5EC"
      borderRadius="9px"
      bg="white"
      px={4}
      py={3}
      minH="140px"
      transition="all .2s"
      _hover={{
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.05)",
      }}
    >
      <Flex
        align="center"
        gap={4}
        h="100%"
      >
        {/* ==================================================
            PHOTO
        ================================================== */}

        <PriestImage
          priest={priest}
          previous
        />

        {/* ==================================================
            DETAILS
        ================================================== */}

        <Box
          flex="1"
          minW={0}
          alignSelf="stretch"
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Heading
            size="sm"
            color="#182338"
            mb={1}
            noOfLines={1}
          >
            {priest.name ||
              "Unnamed Priest"}
          </Heading>

          <Text
            fontSize="sm"
            color="#60708C"
            mb={2}
          >
            {priest.designation_label ||
              (priest.designation ===
              "ASSISTANT"
                ? "Assistant Vicar"
                : "Vicar")}
          </Text>

          {/* PHONE */}

          {priest.phone_number && (
            <HStack
              gap={2}
              mb={1}
              align="center"
            >
              <Icon
                as={LuPhone}
                boxSize={4}
                color="#52627A"
              />

              <Text
                fontSize="xs"
                color="#344054"
                noOfLines={1}
              >
                {priest.phone_number}
              </Text>
            </HStack>
          )}

          {/* SERVICE DATE */}

          <HStack gap={2}>
            <Icon
              as={LuCalendar}
              boxSize={4}
              color="#52627A"
            />

            <Text
              fontSize="xs"
              color="#52627A"
              whiteSpace="nowrap"
            >
              {formatDate(
                priest.date_from ||
                  priest.serving_from
              )}

              {(priest.date_to ||
                priest.serving_to) &&
                ` — ${formatDate(
                  priest.date_to ||
                    priest.serving_to
                )}`}
            </Text>
          </HStack>
        </Box>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <VStack
          align="stretch"
          justify="center"
          gap={2}
          minW="112px"
          alignSelf="stretch"
        >
          {/* PREVIOUS */}

          <Badge
            display="flex"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            h="36px"
            px={3}
            bg="#F0F2F5"
            color="#52627A"
            borderRadius="6px"
            fontSize="xs"
            fontWeight="500"
            whiteSpace="nowrap"
          >
            Previous
          </Badge>

          {/* VIEW */}

          <Button
            size="sm"
            h="36px"
            variant="outline"
            borderColor={PRIMARY_MAROON}
            color={PRIMARY_MAROON}
            onClick={() =>
              onView?.(priest)
            }
            _hover={{
              bg: "#FFF5F7",
            }}
          >
            View Details
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

// ============================================================
// STAT
// ============================================================

const Stat = ({
  value,
  label,
}) => {
  return (
    <Box textAlign="center">
      <Text
        fontSize="xl"
        fontWeight="700"
        color="#182338"
        lineHeight="1"
      >
        {value}
      </Text>

      <Text
        fontSize="sm"
        color="#52627A"
        mt={1}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Box>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const PriestPage = () => {
  const navigate = useNavigate();

  const [priests, setPriests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [designationFilter, setDesignationFilter] =
    useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const response =
        await getPriestMaster();

      let result =
        response?.data;

      if (
        result &&
        !Array.isArray(result)
      ) {
        if (
          Array.isArray(
            result.results
          )
        ) {
          result =
            result.results;
        } else if (
          Array.isArray(
            result.data
          )
        ) {
          result =
            result.data;
        } else if (
          Array.isArray(
            result.priests
          )
        ) {
          result =
            result.priests;
        } else if (
          Array.isArray(
            result.current
          )
        ) {
          result = [
            ...(result.current ||
              []),
            ...(result.previous ||
              []),
          ];
        }
      }

      if (
        !Array.isArray(result)
      ) {
        result = [];
      }

      setPriests(result);
    } catch (error) {
      console.error(
        "ERROR LOADING PRIESTS:",
        error
      );

      setPriests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filterPriest = (
    priest
  ) => {
    // Text search

    if (search.trim()) {
      const query =
        search.toLowerCase().trim();

      const matches = [
        priest.name,
        priest.family_name,
        priest.phone_number,
        priest.city,
        priest.state,
        priest.country,
        priest.postal_code,
        priest.designation,
        priest.designation_label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

      if (!matches) {
        return false;
      }
    }

    // Designation filter

    if (designationFilter) {
      const priestDesignation =
        priest.designation ||
        (priest.designation_label ===
        "Assistant Vicar"
          ? "ASSISTANT"
          : "MAIN");

      if (
        priestDesignation !==
        designationFilter
      ) {
        return false;
      }
    }

    return true;
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredPriests =
    priests.filter(
      filterPriest
    );

  const current =
    filteredPriests.filter(
      (priest) =>
        isPriestActive(priest)
    );

  const previous =
    filteredPriests.filter(
      (priest) =>
        !isPriestActive(priest)
    );

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalCurrent =
    priests.filter(
      isPriestActive
    ).length;

  const totalPrevious =
    priests.filter(
      (priest) =>
        !isPriestActive(priest)
    ).length;

  const totalRecords =
    priests.length;

  // ==========================================================
  // VIEW
  // ==========================================================

  const handleView = (
    priest
  ) => {
    if (!priest?.id) {
      return;
    }

    navigate(
      `/priest-master/${priest.id}`
    );
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (
    priest
  ) => {
    if (!priest?.id) {
      return;
    }

    navigate(
      `/priest-master/edit/${priest.id}`
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="#F8F9FB"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="container.xl"
        flex="1"
        py={5}
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          color="#60708C"
          fontSize="sm"
          mb={4}
        >
          <Text>
            Masters
          </Text>

          <Text>/</Text>

          <Text>
            Priest Master
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
          mb={6}
          gap={4}
          flexWrap="wrap"
        >
          <Box>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="#D7193F"
              mb={1}
            >
              PRIEST MANAGEMENT
            </Text>

            <Heading
              size="xl"
              color="#182338"
            >
              Priest Master
            </Heading>

            <Text
              fontSize="sm"
              color="#60708C"
              mt={1}
            >
              Manage vicars and assistant
              vicars who serve or
              previously served the church.
            </Text>
          </Box>

          <HStack
            gap={3}
            align="center"
          >
            {/* DESIGNATION FILTER */}

            <Box
              as="select"
              value={designationFilter}
              onChange={(e) =>
                setDesignationFilter(
                  e.target.value
                )
              }
              h="40px"
              borderColor="#DCE2EA"
              borderRadius="7px"
              bg="white"
              fontSize="sm"
              minW="160px"
              border="1px solid"
              px={3}
              py={2}
              cursor="pointer"
              _focus={{
                borderColor:
                  PRIMARY_MAROON,
                boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                outline: "none",
              }}
            >
              <option value="">
                All Designations
              </option>

              <option value="MAIN">
                Vicar
              </option>

              <option value="ASSISTANT">
                Assistant Vicar
              </option>
            </Box>

            {/* ADD BUTTON */}

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="40px"
              onClick={() =>
                navigate(
                  "/priest-master/register"
                )
              }
              _hover={{
                bg: "#650A18",
              }}
            >
              <Icon
                as={LuPlus}
                mr={2}
              />

              Add Priest
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            DIRECTORY SUMMARY
        ================================================== */}

        <Box
          border="1px solid"
          borderColor="#E0E5EC"
          borderRadius="10px"
          px={5}
          py={4}
          mb={6}
          bg="white"
        >
          <Flex
            align="center"
            gap={5}
            flexWrap="wrap"
          >
            {/* TITLE */}

            <HStack
              gap={4}
              flex="1"
              minW="280px"
            >
              <Box
                boxSize="60px"
                borderRadius="full"
                bg="#FFF0F4"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon
                  as={LuUserRound}
                  boxSize={7}
                  color={PRIMARY_MAROON}
                />
              </Box>

              <Box>
                <Heading
                  size="md"
                  color="#182338"
                >
                  Priest Service Directory
                </Heading>

                <Text
                  fontSize="xs"
                  color="#667085"
                  mt={1}
                >
                  Church clergy service records
                </Text>
              </Box>
            </HStack>

            {/* STATS */}

            <Flex
              gap={4}
              align="center"
              flexWrap="wrap"
            >
              <Stat
                value={
                  totalCurrent
                }
                label="Currently Serving"
              />

              <Box
                h="40px"
                w="1px"
                bg="#E0E5EC"
              />

              <Stat
                value={
                  totalPrevious
                }
                label="Previous Vicars"
              />

              <Box
                h="40px"
                w="1px"
                bg="#E0E5EC"
              />

              <Stat
                value={
                  totalRecords
                }
                label="Total Records"
              />
            </Flex>

            {/* SEARCH */}

            <Box
              position="relative"
              w={{
                base: "100%",
                md: "230px",
              }}
            >
              <Icon
                as={LuSearch}
                position="absolute"
                left="12px"
                top="13px"
                color="#98A2B3"
                boxSize={4}
                zIndex={1}
              />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search priests"
                h="40px"
                borderColor="#DCE2EA"
                borderRadius="7px"
                pl="38px"
                bg="white"
              />
            </Box>
          </Flex>
        </Box>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <Box
            textAlign="center"
            py={20}
          >
            <Spinner
              size="lg"
              color={PRIMARY_MAROON}
            />

            <Text
              mt={3}
              color="#667085"
            >
              Loading priests...
            </Text>
          </Box>
        ) : (
          <>
            {/* =================================================
                CURRENTLY SERVING
            ================================================= */}

            <Flex
              align="center"
              gap={2}
              mb={3}
            >
              <Heading
                size="md"
                color="#182338"
              >
                Currently Serving
              </Heading>

              <Badge
                bg="#E6F7E9"
                color="#16803A"
                borderRadius="5px"
                px={2}
                py={1}
                fontSize="xs"
              >
                {current.length} Active
              </Badge>
            </Flex>

            {current.length > 0 ? (
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                gap={4}
                mb={6}
              >
                {current.map(
                  (priest) => (
                    <CurrentPriestCard
                      key={
                        priest.id
                      }
                      priest={
                        priest
                      }
                      onView={
                        handleView
                      }
                      onEdit={
                        handleEdit
                      }
                    />
                  )
                )}
              </SimpleGrid>
            ) : (
              <Box
                border="1px dashed #DCE2EA"
                borderRadius="8px"
                p={8}
                textAlign="center"
                mb={6}
              >
                <Text
                  color="#667085"
                  fontSize="sm"
                >
                  No priests currently
                  serving.
                </Text>
              </Box>
            )}

            {/* =================================================
                PREVIOUS VICARS
            ================================================= */}

            <Flex
              align="center"
              gap={2}
              mb={3}
            >
              <Heading
                size="md"
                color="#182338"
              >
                Previous Priests
              </Heading>

              <Badge
                bg="#F0F2F5"
                color="#52627A"
                borderRadius="5px"
                px={2}
                py={1}
                fontSize="xs"
              >
                {previous.length} Records
              </Badge>
            </Flex>

            {previous.length > 0 ? (
              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2,
                  xl: 3,
                }}
                gap={4}
                pb={6}
              >
                {previous.map(
                  (priest) => (
                    <PreviousPriestCard
                      key={
                        priest.id
                      }
                      priest={
                        priest
                      }
                      onView={
                        handleView
                      }
                    />
                  )
                )}
              </SimpleGrid>
            ) : (
              <Box
                border="1px dashed #DCE2EA"
                borderRadius="8px"
                p={8}
                textAlign="center"
              >
                <Text
                  color="#667085"
                  fontSize="sm"
                >
                  No previous priest
                  records found.
                </Text>
              </Box>
            )}
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default PriestPage;