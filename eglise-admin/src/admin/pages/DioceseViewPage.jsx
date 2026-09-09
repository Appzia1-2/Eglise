// src/admin/pages/DioceseViewPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Badge,
  Flex,
  Circle,
  Spinner,
  Link,
  Image,
} from "@chakra-ui/react";

import {
  LuHouse,
  LuChevronRight,
  LuChevronDown,
  LuPencil,
  LuMail,
  LuGlobe,
  LuPhone,
  LuMapPin,
  LuChurch,
  LuSearch,
  LuArrowRight,
  LuBuilding2,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

// Import your logo
import logo from "../../assets/logo.png";

const primaryMaroon = "#ae2050";
const darkText = "#1a1a2e";

const DioceseViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [diocese, setDiocese] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /*
   * ------------------------------------------------------------
   * FETCH DIOCESE
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (id) {
      fetchDiocese();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDiocese = async () => {
    setIsLoading(true);

    try {
      const response = await adminApi.getDioceseDetail(id);

      console.log("Diocese detail response:", response);

      /*
       * adminApi.getDioceseDetail() returns response.data
       *
       * Django response:
       * {
       *   status: "success",
       *   data: {...}
       * }
       */
      setDiocese(response?.data || null);
    } catch (error) {
      console.error("Error fetching diocese:", error);

      toaster.create({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to load diocese details.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * DIOCESE CODE
   *
   * Your current API does not return a code field.
   * If code is added later, it will automatically use it.
   * ------------------------------------------------------------
   */
  const dioceseCode = useMemo(() => {
    if (!diocese) return "";

    if (diocese.code) {
      return diocese.code;
    }

    return `DIO-${String(diocese.id || id).padStart(3, "0")}`;
  }, [diocese, id]);

  /*
   * ------------------------------------------------------------
   * FILTER ASSIGNED CHURCHES
   * ------------------------------------------------------------
   */
  const filteredChurches = useMemo(() => {
    if (!diocese?.churches) return [];

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return diocese.churches;
    }

    return diocese.churches.filter((church) => {
      return [
        church.name,
        church.city,
        church.id,
      ].some(
        (value) =>
          value &&
          String(value).toLowerCase().includes(query)
      );
    });
  }, [diocese, searchQuery]);

  /*
   * ------------------------------------------------------------
   * ADDRESS - IMPROVED WITH DEDUPLICATION
   * MOVED BEFORE CONDITIONAL RETURNS TO FIX HOOKS ORDER
   * ------------------------------------------------------------
   */
  const formattedAddress = useMemo(() => {
    if (!diocese) return "No address available";

    // Get all address parts
    const parts = [
      diocese.address_line1,
      diocese.address_line2,
      diocese.city,
      diocese.state,
      diocese.postal_code,
      diocese.country,
    ].filter(Boolean);

    // Remove duplicates while preserving order
    const uniqueParts = [];
    const seen = new Set();

    for (const part of parts) {
      const normalized = part.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueParts.push(part.trim());
      }
    }

    return uniqueParts.length > 0 
      ? uniqueParts.join(", ") 
      : "No address available";
  }, [diocese]);

  /*
   * ------------------------------------------------------------
   * HANDLERS
   * ------------------------------------------------------------
   */

  const handleEdit = () => {
    navigate(`/admin/dioceses/edit/${diocese.id}`, {
      state: {
        diocese,
      },
    });
  };

  const handleViewAllChurches = () => {
    navigate("/admin/churches", {
      state: {
        dioceseId: diocese.id,
        dioceseName: diocese.name,
      },
    });
  };

  /*
   * ------------------------------------------------------------
   * LOADING - MOVED AFTER ALL HOOKS
   * ------------------------------------------------------------
   */

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex
            justify="center"
            align="center"
            minH="500px"
          >
            <VStack spacing={4}>
              <Spinner
                size="xl"
                color={primaryMaroon}
                thickness="4px"
              />

              <Text
                fontSize="sm"
                color="gray.500"
              >
                Loading diocese details...
              </Text>
            </VStack>
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  /*
   * ------------------------------------------------------------
   * NOT FOUND - MOVED AFTER ALL HOOKS
   * ------------------------------------------------------------
   */

  if (!diocese) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex
            minH="500px"
            justify="center"
            align="center"
          >
            <VStack spacing={4}>
              <Circle
                size="70px"
                bg="rgba(174,32,80,0.08)"
                color={primaryMaroon}
              >
                <LuBuilding2 size={30} />
              </Circle>

              <Heading
                fontSize="xl"
                color={darkText}
              >
                Diocese not found
              </Heading>

              <Text
                color="gray.500"
                fontSize="sm"
              >
                The requested diocese could not be found.
              </Text>

              <Button
                bg={primaryMaroon}
                color="white"
                borderRadius="lg"
                onClick={() =>
                  navigate("/admin/dioceses")
                }
                _hover={{
                  bg: "#8a1a3e",
                }}
              >
                Back to Dioceses
              </Button>
            </VStack>
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  /*
   * ------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------
   */

  return (
    <AdminLayout>
      <Container
        maxW="container.xl"
        py={{ base: 1, md: 2 }}
        px={{ base: 4, md: 6 }}
        height="calc(100vh - 60px)"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* =====================================================
            BREADCRUMB - SMALLER
        ===================================================== */}

        <HStack
          spacing={1.5}
          mb={1}
          color="gray.400"
          fontSize="2xs"
          fontWeight="600"
          flexShrink={0}
        >
          <Box
            as="button"
            display="flex"
            alignItems="center"
            _hover={{
              color: primaryMaroon,
            }}
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <LuHouse size={12} />
          </Box>

          <LuChevronRight size={11} />

          <Box
            as="button"
            _hover={{
              color: primaryMaroon,
            }}
            onClick={() =>
              navigate("/admin/churches")
            }
          >
            Churches
          </Box>

          <LuChevronRight size={11} />

          <Box
            as="button"
            _hover={{
              color: primaryMaroon,
            }}
            onClick={() =>
              navigate("/admin/dioceses")
            }
          >
            Dioceses
          </Box>

          <LuChevronRight size={11} />

          <Text
            color="gray.600"
            noOfLines={1}
          >
            {diocese.name}
          </Text>
        </HStack>

        {/* =====================================================
            PAGE HEADER - SMALLER
        ===================================================== */}

        <Flex
          justify="space-between"
          align="center"
          mb={1.5}
          gap={3}
          flexWrap="wrap"
          flexShrink={0}
        >
          <VStack
            align="start"
            spacing={0}
          >
            <Text
              fontSize="2xs"
              fontWeight="700"
              color={primaryMaroon}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Diocese Profile
            </Text>

            <Heading
              fontSize={{
                base: "lg",
                md: "xl",
              }}
              fontWeight="800"
              color={darkText}
              lineHeight="1.2"
            >
              Diocese Details
            </Heading>

            <Text
              color="gray.500"
              fontSize="2xs"
            >
              View diocese information and assigned churches.
            </Text>
          </VStack>

          <HStack spacing={2}>
            <Button
              bg={primaryMaroon}
              color="white"
              borderRadius="lg"
              px={4}
              size="xs"
              onClick={handleEdit}
              leftIcon={<LuPencil size={12} />}
              _hover={{
                bg: "#8a1a3e",
              }}
            >
              Edit Diocese
            </Button>

            <Button
              variant="outline"
              borderColor={primaryMaroon}
              color={primaryMaroon}
              borderRadius="lg"
              px={4}
              size="xs"
              rightIcon={<LuChevronDown size={12} />}
              _hover={{
                bg: "rgba(174,32,80,0.04)",
              }}
            >
              More Actions
            </Button>
          </HStack>
        </Flex>

        {/* =====================================================
            MAIN DIOCESE HERO CARD - SMALLER
        ===================================================== */}

        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="0 2px 12px rgba(0,0,0,0.03)"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3 }}
          mb={1.5}
          flexShrink={0}
        >
          <Flex
            align="center"
            justify="space-between"
            gap={3}
            flexWrap={{
              base: "wrap",
              md: "nowrap",
            }}
          >
            {/* Diocese identity */}

            <HStack
              spacing={3}
              flex="1"
              minW={0}
              align="center"
            >
              <Circle
                size={{ base: "45px", md: "55px" }}
                bg="rgba(174,32,80,0.08)"
                color={primaryMaroon}
                flexShrink={0}
              >
                <LuChurch size={24} strokeWidth={1.5} />
              </Circle>

              <VStack
                align="start"
                spacing={0}
                minW={0}
              >
                <Heading
                  fontSize={{
                    base: "md",
                    md: "lg",
                  }}
                  fontWeight="800"
                  color={darkText}
                  noOfLines={1}
                >
                  {diocese.name}
                </Heading>

                <Text
                  fontSize="2xs"
                  color="gray.500"
                  fontWeight="500"
                >
                  {dioceseCode}
                </Text>

                <Text
                  fontSize="2xs"
                  color="gray.600"
                >
                  <Text
                    as="span"
                    color="gray.500"
                  >
                    Metropolitan:
                  </Text>{" "}
                  <Text
                    as="span"
                    fontWeight="600"
                    color={darkText}
                  >
                    {diocese.metropolitan_name ||
                      "Not specified"}
                  </Text>
                </Text>
              </VStack>
            </HStack>

            {/* Assigned churches */}

            <Flex
              minW={{ base: "100%", md: "120px" }}
              justify={{ base: "flex-start", md: "center" }}
              align="center"
              borderLeft={{ base: "none", md: "1px solid" }}
              borderColor="gray.200"
              pl={{ base: 0, md: 4 }}
              pt={{ base: 1, md: 0 }}
            >
              <VStack spacing={0}>
                <Heading
                  fontSize="xl"
                  fontWeight="800"
                  color={primaryMaroon}
                  lineHeight="1"
                >
                  {diocese.church_count || 0}
                </Heading>

                <Text
                  fontSize="2xs"
                  color="gray.500"
                  fontWeight="500"
                >
                  Assigned Churches
                </Text>
              </VStack>
            </Flex>
          </Flex>
        </Box>

        {/* =====================================================
            INFORMATION CARDS - REDUCED GAP
        ===================================================== */}

        <Flex
          gap={1.5}
          mb={1.5}
          direction={{
            base: "column",
            lg: "row",
          }}
          flex="0.6"
          minHeight={0}
        >
         {/* Diocese Information */}

<Box
  flex="1"
  bg="white"
  borderRadius="xl"
  border="1px solid"
  borderColor="gray.200"
  p={1.5}
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  <Heading
    fontSize="xs"
    fontWeight="700"
    color={darkText}
    mb={0.5}
    flexShrink={0}
  >
    Diocese Information
  </Heading>

  <VStack
    spacing={0}
    align="stretch"
    flex="none"
  >
    <InfoRow
      label="Diocese Code"
      value={dioceseCode}
    />

    <InfoRow
      label="Diocese Name"
      value={diocese.name}
    />

    <InfoRow
      label="Metropolitan Name"
      value={diocese.metropolitan_name || "—"}
      last
    />
  </VStack>
</Box>


{/* Contact Information */}

<Box
  flex="1"
  bg="white"
  borderRadius="xl"
  border="1px solid"
  borderColor="gray.200"
  p={1.5}
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  <Heading
    fontSize="xs"
    fontWeight="700"
    color={darkText}
    mb={0.5}
    flexShrink={0}
  >
    Contact Information
  </Heading>

  <VStack
    spacing={0}
    align="stretch"
    flex="none"
  >
    <ContactRow
      icon={<LuMail size={13} />}
      label="Mail ID"
      value={diocese.email}
      href={
        diocese.email
          ? `mailto:${diocese.email}`
          : undefined
      }
    />

    <ContactRow
      icon={<LuGlobe size={13} />}
      label="Website"
      value={diocese.website}
      href={
        diocese.website
          ? diocese.website.startsWith("http")
            ? diocese.website
            : `https://${diocese.website}`
          : undefined
      }
    />

    <ContactRow
      icon={<LuPhone size={13} />}
      label="Contact Details"
      value={diocese.phone_number}
      href={
        diocese.phone_number
          ? `tel:${diocese.phone_number}`
          : undefined
      }
      last
    />
  </VStack>
</Box>


{/* Address */}

<Box
  flex="1"
  bg="white"
  borderRadius="xl"
  border="1px solid"
  borderColor="gray.200"
  p={1.5}
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  <Heading
    fontSize="xs"
    fontWeight="700"
    color={darkText}
    mb={0.5}
    flexShrink={0}
  >
    Address
  </Heading>

  <HStack
    align="flex-start"
    spacing={2}
    width="100%"
    flexShrink={0}
  >
    <Circle
      size="28px"
      bg="rgba(174,32,80,0.08)"
      color={primaryMaroon}
      flexShrink={0}
    >
      <LuMapPin size={14} />
    </Circle>

    <Text
      fontSize="xs"
      color="gray.600"
      lineHeight="1.35"
      wordBreak="break-word"
      mt="2px"
    >
      {formattedAddress}
    </Text>
  </HStack>

  {/* Keep original image size */}
  <Image
    src={logo}
    alt="Logo"
    maxH="40px"
    width="auto"
    objectFit="contain"
    opacity={0.5}
    pl={10}
  />
</Box>
        </Flex>

        {/* =====================================================
            BOTTOM SECTION
        ===================================================== */}

        <Flex
          gap={1.5}
          direction={{
            base: "column",
            lg: "row",
          }}
          flex="1"
          minHeight={0}
        >
          {/* ===================================================
              ASSIGNED CHURCHES
          =================================================== */}

          <Box
            flex="1.25"
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}

            <Flex
              justify="space-between"
              align="center"
              px={3}
              pt={2}
              pb={1}
              gap={2}
              flexWrap="wrap"
              flexShrink={0}
            >
              <Heading
                fontSize="xs"
                fontWeight="700"
                color={darkText}
              >
                Assigned Churches
              </Heading>

              <Button
                variant="ghost"
                size="2xs"
                color={primaryMaroon}
                fontWeight="600"
                onClick={handleViewAllChurches}
                rightIcon={
                  <LuArrowRight size={11} />
                }
                _hover={{
                  bg: "rgba(174,32,80,0.05)",
                }}
              >
                View All{" "}
                {diocese.church_count || 0} Churches
              </Button>
            </Flex>

            {/* Search */}

            <Box px={3} pb={1} flexShrink={0}>
              <Box
                position="relative"
                maxW="240px"
              >
                <Input
                  placeholder="Search assigned churches"
                  size="2xs"
                  h="26px"
                  pl={7}
                  borderRadius="md"
                  bg="white"
                  borderColor="gray.200"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  _focus={{
                    borderColor: primaryMaroon,
                    boxShadow: `0 0 0 1px ${primaryMaroon}`,
                  }}
                  _placeholder={{
                    color: "gray.400",
                    fontSize: "2xs",
                  }}
                  fontSize="2xs"
                />

                <Box
                  position="absolute"
                  left="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                >
                  <LuSearch size={10} />
                </Box>
              </Box>
            </Box>

            {/* Church table */}

            <Box overflow="auto" flex="1">
              <Box
                as="table"
                width="100%"
                style={{
                  borderCollapse: "collapse",
                }}
              >
                <Box as="thead">
                  <Box
                    as="tr"
                    bg="gray.50"
                    borderTop="1px solid"
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    <TableHeader>
                      Church
                    </TableHeader>

                    <TableHeader>
                      City
                    </TableHeader>

                    <TableHeader textAlign="center">
                      Status
                    </TableHeader>
                  </Box>
                </Box>

                <Box as="tbody">
                  {filteredChurches.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={3}
                        textAlign="center"
                        py={4}
                      >
                        <VStack spacing={1}>
                          <Circle
                            size="28px"
                            bg="gray.50"
                            color="gray.400"
                          >
                            <LuChurch size={12} />
                          </Circle>

                          <Text
                            fontSize="2xs"
                            color="gray.400"
                          >
                            {searchQuery
                              ? "No churches found matching your search."
                              : "No churches assigned to this diocese."}
                          </Text>
                        </VStack>
                      </Box>
                    </Box>
                  ) : (
                    filteredChurches
                      .slice(0, 5)
                      .map((church) => (
                        <Box
                          as="tr"
                          key={church.id}
                          borderBottom="1px solid"
                          borderColor="gray.50"
                          _hover={{
                            bg: "gray.50",
                          }}
                        >
                          <Box
                            as="td"
                            px={3}
                            py={1.5}
                          >
                            <HStack spacing={1.5}>
                              <Circle
                                size="20px"
                                bg="rgba(174,32,80,0.07)"
                                color={primaryMaroon}
                              >
                                <LuChurch
                                  size={10}
                                />
                              </Circle>

                              <Text
                                fontSize="2xs"
                                fontWeight="600"
                                color={darkText}
                                noOfLines={1}
                              >
                                {church.name ||
                                  "Unnamed Church"}
                              </Text>
                            </HStack>
                          </Box>

                          <Box
                            as="td"
                            px={3}
                            py={1.5}
                          >
                            <Text
                              fontSize="2xs"
                              color="gray.600"
                            >
                              {church.city ||
                                "—"}
                            </Text>
                          </Box>

                          <Box
                            as="td"
                            px={3}
                            py={1.5}
                            textAlign="center"
                          >
                            <Badge
                              bg="#e8f8ee"
                              color="#24934a"
                              borderRadius="full"
                              px={2}
                              py={0.5}
                              fontSize="2xs"
                              fontWeight="600"
                            >
                              Active
                            </Badge>
                          </Box>
                        </Box>
                      ))
                  )}
                </Box>
              </Box>
            </Box>

            {/* Show all link */}

            {filteredChurches.length > 5 && (
              <Flex
                justify="center"
                px={3}
                py={1}
                borderTop="1px solid"
                borderColor="gray.100"
                flexShrink={0}
              >
                <Button
                  variant="ghost"
                  size="2xs"
                  color={primaryMaroon}
                  fontWeight="600"
                  onClick={handleViewAllChurches}
                  rightIcon={
                    <LuArrowRight size={10} />
                  }
                >
                  View all{" "}
                  {filteredChurches.length} churches
                </Button>
              </Flex>
            )}
          </Box>

          {/* ===================================================
              RECENT ACTIVITY
          =================================================== */}

          <Box
            flex="1"
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
            p={2.5}
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <Heading
              fontSize="xs"
              fontWeight="700"
              color={darkText}
              mb={1.5}
              flexShrink={0}
            >
              Recent Activity
            </Heading>

            <VStack
              align="stretch"
              spacing={0}
              flex="1"
              justify="center"
            >
              <ActivityItem
                title="Diocese information"
                description="Current profile information"
                icon={<LuBuilding2 size={11} />}
              />

              <ActivityItem
                title="Assigned churches"
                description={`${diocese.church_count || 0} active churches assigned`}
                icon={<LuChurch size={11} />}
              />

              <ActivityItem
                title="Contact information"
                description={
                  diocese.email ||
                  diocese.phone_number ||
                  "No contact information"
                }
                icon={<LuPhone size={11} />}
                last
              />
            </VStack>
          </Box>
        </Flex>
      </Container>
    </AdminLayout>
  );
};

/*
 * ================================================================
 * INFO ROW
 * ================================================================
 */

const InfoRow = ({
  label,
  value,
  last = false,
}) => {
  return (
    <Flex
      justify="space-between"
      align="center"
      gap={3}
      py={1.5}
      borderBottom={
        last ? "none" : "1px solid"
      }
      borderColor="gray.100"
      width="100%"
    >
      <Text
        fontSize="2xs"
        fontWeight="600"
        color="gray.700"
        flexShrink={0}
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        {label}
      </Text>

      <Text
        fontSize="xs"
        color="gray.600"
        textAlign="right"
        noOfLines={1}
      >
        {value || "—"}
      </Text>
    </Flex>
  );
};

/*
 * ================================================================
 * CONTACT ROW
 * ================================================================
 */

const ContactRow = ({
  icon,
  label,
  value,
  href,
  last = false,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      py={1.5}
      borderBottom={
        last ? "none" : "1px solid"
      }
      borderColor="gray.100"
      width="100%"
    >
      <Circle
        size="24px"
        bg="gray.50"
        color="#1a1a2e"
        flexShrink={0}
      >
        {icon}
      </Circle>

      <Text
        fontSize="2xs"
        fontWeight="600"
        color="gray.700"
        minW="65px"
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        {label}
      </Text>

      {href && value ? (
        <Link
          href={href}
          isExternal={href.startsWith("http")}
          fontSize="xs"
          color="gray.700"
          fontWeight="500"
          noOfLines={1}
          _hover={{
            color: primaryMaroon,
          }}
        >
          {value}
        </Link>
      ) : (
        <Text
          fontSize="xs"
          color="gray.600"
          fontWeight="500"
          noOfLines={1}
        >
          {value || "—"}
        </Text>
      )}
    </Flex>
  );
};

/*
 * ================================================================
 * TABLE HEADER
 * ================================================================
 */

const TableHeader = ({
  children,
  textAlign = "left",
}) => {
  return (
    <Box
      as="th"
      px={3}
      py={1.5}
      textAlign={textAlign}
      fontSize="2xs"
      fontWeight="700"
      color="gray.600"
      textTransform="uppercase"
      letterSpacing="0.04em"
      whiteSpace="nowrap"
    >
      {children}
    </Box>
  );
};

/*
 * ================================================================
 * ACTIVITY ITEM
 * ================================================================
 */

const ActivityItem = ({
  title,
  description,
  icon,
  last = false,
}) => {
  return (
    <Flex
      position="relative"
      gap={2}
      pb={last ? 0 : 2}
      mb={last ? 0 : 0.5}
      width="100%"
    >
      {!last && (
        <Box
          position="absolute"
          left="10px"
          top="20px"
          bottom="0"
          width="1px"
          bg="gray.200"
        />
      )}

      <Circle
        size="20px"
        bg="rgba(174,32,80,0.08)"
        color={primaryMaroon}
        flexShrink={0}
        position="relative"
        zIndex={1}
      >
        {icon}
      </Circle>

      <VStack
        align="start"
        spacing={0}
        pt={0.5}
      >
        <Text
          fontSize="xs"
          fontWeight="600"
          color={darkText}
        >
          {title}
        </Text>

        <Text
          fontSize="2xs"
          color="gray.500"
          noOfLines={1}
        >
          {description}
        </Text>
      </VStack>
    </Flex>
  );
};

export default DioceseViewPage;