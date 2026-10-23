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
// PRIEST STATUS — derived from dates safely
// ============================================================

const getPriestStatus = (priest) => {
  if (!priest) {
    return "PREVIOUS";
  }

  // Manually archived / disabled
  if (
    priest.is_active === false ||
    priest.is_active === 0 ||
    priest.is_active === "false" ||
    priest.is_active === "0"
  ) {
    return "PREVIOUS";
  }

  // ✅ Safe local date string (avoids UTC timezone bugs)
  const getLocalDateString = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    
    // Adjust for timezone offset so we get the exact calendar date
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString(new Date());
  const fromStr = getLocalDateString(priest.date_from || priest.serving_from);
  const toStr = getLocalDateString(priest.date_to || priest.serving_to);

  // Compare string dates (e.g., "2026-10-23" > "2026-10-22")
  if (fromStr && fromStr > todayStr) {
    return "UPCOMING";
  }

  if (fromStr && fromStr <= todayStr && (!toStr || toStr >= todayStr)) {
    return "CURRENT";
  }

  return "PREVIOUS";
};

const isPriestActive = (priest) => getPriestStatus(priest) === "CURRENT";

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
      bg="#FFFFFF"
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
        <PriestImage priest={priest} />

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
            {priest.name || "Unnamed Priest"}
          </Heading>

          <Text
            fontSize="sm"
            color="#60708C"
            mb={2}
          >
            {priest.designation_label ||
              (priest.designation === "ASSISTANT"
                ? "Assistant Vicar"
                : "Vicar")}
          </Text>

          {priest.family_name && (
            <HStack gap={2} mb={1} align="center">
              <Icon
                as={LuUserRound}
                boxSize={4}
                color="#52627A"
              />
              <Text fontSize="sm" color="#344054">
                {priest.family_name} Family
              </Text>
            </HStack>
          )}

          {priest.phone_number && (
            <HStack gap={2} mb={1} align="center">
              <Icon
                as={LuPhone}
                boxSize={4}
                color="#52627A"
              />
              <Text fontSize="sm" color="#344054">
                {priest.phone_number}
              </Text>
            </HStack>
          )}

          {getFullAddress(priest) && (
            <HStack gap={2} align="flex-start" mb={1}>
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

          <HStack gap={2} mt={1}>
            <Icon
              as={LuCalendar}
              boxSize={4}
              color="#52627A"
            />
            <Text fontSize="xs" color="#52627A">
              {formatDate(
                priest.date_from || priest.serving_from
              )}
              {!(priest.date_to || priest.serving_to) &&
                " — Present"}
            </Text>
          </HStack>
        </Box>

        <VStack
          align="stretch"
          justify="center"
          gap={2}
          minW="120px"
          alignSelf="stretch"
        >
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

          <Button
            size="sm"
            h="36px"
            variant="outline"
            borderColor={PRIMARY_MAROON}
            color={PRIMARY_MAROON}
            onClick={() => onView?.(priest)}
            _hover={{ bg: "#FFF5F7" }}
          >
            View Details
          </Button>

          <Button
            variant="ghost"
            size="sm"
            h="30px"
            color={PRIMARY_MAROON}
            justifyContent="center"
            onClick={() => onEdit?.(priest)}
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
      bg="#FFFFFF"
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
        <PriestImage priest={priest} previous />

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
            {priest.name || "Unnamed Priest"}
          </Heading>

          <Text
            fontSize="sm"
            color="#60708C"
            mb={2}
          >
            {priest.designation_label ||
              (priest.designation === "ASSISTANT"
                ? "Assistant Vicar"
                : "Vicar")}
          </Text>

          {priest.phone_number && (
            <HStack gap={2} mb={1} align="center">
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
                priest.date_from || priest.serving_from
              )}
              {(priest.date_to || priest.serving_to) &&
                ` — ${formatDate(
                  priest.date_to || priest.serving_to
                )}`}
            </Text>
          </HStack>
        </Box>

        <VStack
          align="stretch"
          justify="center"
          gap={2}
          minW="112px"
          alignSelf="stretch"
        >
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

          <Button
            size="sm"
            h="36px"
            variant="outline"
            borderColor={PRIMARY_MAROON}
            color={PRIMARY_MAROON}
            onClick={() => onView?.(priest)}
            _hover={{ bg: "#FFF5F7" }}
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

const Stat = ({ value, label }) => {
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

  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await getPriestMaster();

      let result = response?.data;

      if (result && !Array.isArray(result)) {
        if (Array.isArray(result.results)) {
          result = result.results;
        } else if (Array.isArray(result.data)) {
          result = result.data;
        } else if (Array.isArray(result.priests)) {
          result = result.priests;
        } else if (Array.isArray(result.current)) {
          result = [
            ...(result.current || []),
            ...(result.previous || []),
          ];
        }
      }

      if (!Array.isArray(result)) {
        result = [];
      }

      setPriests(result);
    } catch (error) {
      console.error("ERROR LOADING PRIESTS:", error);
      setPriests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterPriest = (priest) => {
    if (search.trim()) {
      const query = search.toLowerCase().trim();

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

    if (designationFilter) {
      const priestDesignation =
        priest.designation ||
        (priest.designation_label === "Assistant Vicar"
          ? "ASSISTANT"
          : "MAIN");

      if (priestDesignation !== designationFilter) {
        return false;
      }
    }

    return true;
  };

  const filteredPriests = priests.filter(filterPriest);

  // ==========================================
  // GROUPING LOGIC
  // ==========================================

  const upcoming = filteredPriests.filter(
    (priest) => getPriestStatus(priest) === "UPCOMING"
  );

  const current = filteredPriests.filter(
    (priest) => getPriestStatus(priest) === "CURRENT"
  );

  const previous = filteredPriests.filter(
    (priest) => getPriestStatus(priest) === "PREVIOUS"
  );

  // ==========================================
  // COUNTS
  // ==========================================

  const totalUpcoming = priests.filter(
    (priest) => getPriestStatus(priest) === "UPCOMING"
  ).length;

  const totalCurrent = priests.filter(
    (priest) => getPriestStatus(priest) === "CURRENT"
  ).length;

  const totalPrevious = priests.filter(
    (priest) => getPriestStatus(priest) === "PREVIOUS"
  ).length;

  const totalRecords = priests.length;

  const handleView = (priest) => {
    if (!priest?.id) {
      return;
    }
    navigate(`/priest-master/${priest.id}`);
  };

  const handleEdit = (priest) => {
    if (!priest?.id) {
      return;
    }
    navigate(`/priest-master/edit/${priest.id}`);
  };

  return (
    <Box
      minH="100vh"
      bg="#FFFFFF"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="container.xl"
        flex="1"
        py={5}
      >
        <HStack
          gap={2}
          color="#60708C"
          fontSize="sm"
          mb={4}
        >
          <Text>Masters</Text>
          <Text>/</Text>
          <Text>Priest Master</Text>
        </HStack>

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

            <Heading size="xl" color="#182338">
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

          <HStack gap={3} align="center">
            <Box
              as="select"
              value={designationFilter}
              onChange={(e) =>
                setDesignationFilter(e.target.value)
              }
              h="40px"
              borderColor="#DCE2EA"
              borderRadius="7px"
              bg="#FFFFFF"
              fontSize="sm"
              minW="160px"
              border="1px solid"
              px={3}
              py={2}
              cursor="pointer"
              _focus={{
                borderColor: PRIMARY_MAROON,
                boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                outline: "none",
              }}
            >
              <option value="">
                All Designations
              </option>
              <option value="MAIN">Vicar</option>
              <option value="ASSISTANT">
                Assistant Vicar
              </option>
            </Box>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="40px"
              onClick={() =>
                navigate("/priest-master/register")
              }
              _hover={{ bg: "#650A18" }}
            >
              <Icon as={LuPlus} mr={2} />
              Add Priest
            </Button>
          </HStack>
        </Flex>

        <Box
          border="1px solid"
          borderColor="#E0E5EC"
          borderRadius="10px"
          px={5}
          py={4}
          mb={6}
          bg="#FFFFFF"
        >
          <Flex
            align="center"
            gap={5}
            flexWrap="wrap"
          >
            <HStack gap={4} flex="1" minW="280px">
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
                <Heading size="md" color="#182338">
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

            <Flex
              gap={4}
              align="center"
              flexWrap="wrap"
            >
              <Stat
                value={totalCurrent}
                label="Currently Serving"
              />
              <Box h="40px" w="1px" bg="#E0E5EC" />
              <Stat
                value={totalUpcoming}
                label="Upcoming"
              />
              <Box h="40px" w="1px" bg="#E0E5EC" />
              <Stat
                value={totalPrevious}
                label="Previous Vicars"
              />
              <Box h="40px" w="1px" bg="#E0E5EC" />
              <Stat
                value={totalRecords}
                label="Total Records"
              />
            </Flex>

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
                  setSearch(e.target.value)
                }
                placeholder="Search priests"
                h="40px"
                borderColor="#DCE2EA"
                borderRadius="7px"
                pl="38px"
                bg="#FFFFFF"
              />
            </Box>
          </Flex>
        </Box>

        {loading ? (
          <Box textAlign="center" py={20}>
            <Spinner
              size="lg"
              color={PRIMARY_MAROON}
            />
            <Text mt={3} color="#667085">
              Loading priests...
            </Text>
          </Box>
        ) : (
          <>
            {/* =================================================
                CURRENTLY SERVING
            ================================================= */}
            <Flex align="center" gap={2} mb={3}>
              <Heading size="md" color="#182338">
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
                columns={{ base: 1, lg: 2 }}
                gap={4}
                mb={6}
              >
                {current.map((priest) => (
                  <CurrentPriestCard
                    key={priest.id}
                    priest={priest}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Box
                border="1px dashed #DCE2EA"
                borderRadius="8px"
                p={8}
                textAlign="center"
                mb={6}
                bg="#FFFFFF"
              >
                <Text color="#667085" fontSize="sm">
                  No priests currently serving.
                </Text>
              </Box>
            )}

            {/* =================================================
                UPCOMING PRIESTS
            ================================================= */}
            {upcoming.length > 0 && (
              <>
                <Flex align="center" gap={2} mb={3} mt={6}>
                  <Heading size="md" color="#182338">
                    Upcoming Priests
                  </Heading>

                  <Badge
                    bg="#FFF3E0"
                    color="#E65100"
                    borderRadius="5px"
                    px={2}
                    py={1}
                    fontSize="xs"
                  >
                    {upcoming.length} Scheduled
                  </Badge>
                </Flex>

                <SimpleGrid
                  columns={{ base: 1, lg: 2 }}
                  gap={4}
                  mb={6}
                >
                  {upcoming.map((priest) => (
                    <CurrentPriestCard
                      key={priest.id}
                      priest={priest}
                      onView={handleView}
                      onEdit={handleEdit}
                    />
                  ))}
                </SimpleGrid>
              </>
            )}

            {/* =================================================
                PREVIOUS PRIESTS
            ================================================= */}
            <Flex align="center" gap={2} mb={3} mt={6}>
              <Heading size="md" color="#182338">
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
                {previous.map((priest) => (
                  <PreviousPriestCard
                    key={priest.id}
                    priest={priest}
                    onView={handleView}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Box
                border="1px dashed #DCE2EA"
                borderRadius="8px"
                p={8}
                textAlign="center"
                bg="#FFFFFF"
              >
                <Text color="#667085" fontSize="sm">
                  No previous priest records found.
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