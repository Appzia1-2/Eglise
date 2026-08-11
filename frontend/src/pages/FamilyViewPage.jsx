import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuPencil,
  LuFileText,
  LuCalendarDays,
  LuUserRound,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getFamily } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const FamilyViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD FAMILY
  // ==========================================================

  useEffect(() => {
    const loadFamily = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getFamily(id);

        const data = response?.data ?? response;

        setFamily(data);
      } catch (err) {
        console.error("Error loading family:", err);

        const data = err?.response?.data;

        setError(
          data?.detail ||
            "Unable to load family record."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFamily();
    }
  }, [id]);

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Container
          maxW="container.xl"
          py={10}
          flex="1"
        >
          <Text color="#60708C">
            Loading family...
          </Text>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !family) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />

        <Container
          maxW="container.xl"
          py={10}
          flex="1"
        >
          <Text
            color="#D7193F"
            fontWeight="600"
            mb={5}
          >
            {error || "Family record not found."}
          </Text>

          <Button
            variant="outline"
            borderColor="#C7CFDA"
            onClick={() => navigate("/family")}
          >
            <LuArrowLeft
              style={{ marginRight: "8px" }}
            />
            Back to Family Master
          </Button>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="white"
    >
      <Navbar />

      <Container
        maxW="container.xl"
        py={{ base: 4, md: 5 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={5}
          fontSize="sm"
          color="#60708C"
          flexWrap="wrap"
        >
          <Text>Masters</Text>
          <Text>/</Text>

          <Text>Family Master</Text>
          <Text>/</Text>

          <Text color="#344054">
            {family.family_name}
          </Text>

          <Text>/</Text>

          <Text color="#60708C">
            View
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Flex
          justify="space-between"
          align={{
            base: "flex-start",
            md: "center",
          }}
          direction={{
            base: "column",
            md: "row",
          }}
          gap={4}
          mb={5}
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
              color="#182338"
              fontSize={{
                base: "28px",
                md: "34px",
              }}
              lineHeight="1.2"
              mb={1}
            >
              {family.family_name}
            </Heading>

            <Text
              color="#60708C"
              fontSize="sm"
            >
              View family information, origin
              and history.
            </Text>
          </Box>

          {/* EDIT BUTTON */}

          <Button
            bg={PRIMARY_MAROON}
            color="white"
            px={6}
            h="44px"
            borderRadius="6px"
            onClick={() =>
              navigate(
                `/family-master/${family.id}/edit`
              )
            }
            _hover={{
              bg: "#650A18",
            }}
          >
            <LuPencil
              style={{
                marginRight: "8px",
              }}
            />

            Edit Family
          </Button>
        </Flex>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <Flex
          direction={{
            base: "column",
            lg: "row",
          }}
          gap={5}
          align="stretch"
        >
          {/* =================================================
              LEFT
          ================================================= */}

          <Box
            flex="1"
            minW={0}
          >
            {/* FAMILY HEADER CARD */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              p={{
                base: 4,
                md: 5,
              }}
              mb={5}
            >
              <HStack
                align="center"
                gap={4}
              >
                {/* FAMILY AVATAR */}

                <Flex
                  w="72px"
                  h="72px"
                  minW="72px"
                  borderRadius="full"
                  border="1px solid #F3B4C1"
                  bg="#FFF8FA"
                  align="center"
                  justify="center"
                >
                  <LuFileText
                    size={28}
                    color="#D7193F"
                  />
                </Flex>

                <Box>
                  <Heading
                    fontSize={{
                      base: "22px",
                      md: "25px",
                    }}
                    color="#182338"
                    mb={1}
                  >
                    {family.family_name}
                  </Heading>

                  <HStack
                    gap={3}
                    flexWrap="wrap"
                    color="#60708C"
                    fontSize="sm"
                  >
                    <Text>
                      Family Record
                    </Text>

                    <Text>•</Text>

                    <Text>
                      {family.origin || "Origin not specified"}
                    </Text>

                    <Box
                      px={2.5}
                      py={0.5}
                      borderRadius="6px"
                      bg="#EAF8ED"
                      border="1px solid #B8E0BE"
                      color="#25803C"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      Active
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* FAMILY DETAILS CARD */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              overflow="hidden"
            >
              {/* TAB HEADER */}

              <Box
                px={{
                  base: 4,
                  md: 6,
                }}
                pt={4}
                borderBottom="1px solid #DCE2EA"
              >
                <Text
                  color="#D7193F"
                  fontWeight="700"
                  fontSize="sm"
                  pb={3}
                  borderBottom="3px solid #D7193F"
                  width="fit-content"
                >
                  Family Details
                </Text>
              </Box>

              <Box
                p={{
                  base: 4,
                  md: 6,
                }}
              >
                <Heading
                  fontSize="18px"
                  color="#182338"
                  mb={1}
                >
                  Family Information
                </Heading>

                <Text
                  color="#60708C"
                  fontSize="sm"
                  mb={6}
                >
                  Basic information about this
                  family record.
                </Text>

                {/* INFORMATION */}

                <SimpleGrid
                  columns={{
                    base: 1,
                    md: 2,
                  }}
                  gap={6}
                >
                  {/* FAMILY NAME */}

                  <Box>
                    <Text
                      fontSize="12px"
                      color="#60708C"
                      mb={1}
                    >
                      Family Name
                    </Text>

                    <Text
                      fontSize="15px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {family.family_name || "-"}
                    </Text>
                  </Box>

                  {/* ORIGIN */}

                  <Box>
                    <Text
                      fontSize="12px"
                      color="#60708C"
                      mb={1}
                    >
                      Origin
                    </Text>

                    <Text
                      fontSize="15px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {family.origin || "-"}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* HISTORY */}

                <Box
                  mt={7}
                  pt={6}
                  borderTop="1px solid #E6EAF0"
                >
                  <Heading
                    fontSize="18px"
                    color="#182338"
                    mb={1}
                  >
                    Family History
                  </Heading>

                  <Text
                    color="#60708C"
                    fontSize="sm"
                    mb={4}
                  >
                    Historical information about
                    this family.
                  </Text>

                  <Box
                    border="1px solid #DCE2EA"
                    borderRadius="7px"
                    bg="#FAFBFC"
                    p={5}
                    minH="150px"
                  >
                    <Text
                      color="#344054"
                      fontSize="14px"
                      lineHeight="1.8"
                      whiteSpace="pre-wrap"
                    >
                      {family.history ||
                        "No family history has been added."}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <Box
            w={{
              base: "100%",
              lg: "310px",
            }}
            flexShrink={0}
          >
            {/* RECORD INFORMATION */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              p={5}
              mb={4}
            >
              <HStack
                gap={3}
                mb={5}
              >
                <Flex
                  w="30px"
                  h="30px"
                  borderRadius="6px"
                  bg="#FFF0F3"
                  align="center"
                  justify="center"
                >
                  <LuFileText
                    size={17}
                    color="#D7193F"
                  />
                </Flex>

                <Heading
                  fontSize="16px"
                  color="#182338"
                >
                  Record Information
                </Heading>
              </HStack>

              <VStack
                align="stretch"
                gap={5}
              >
                {/* CREATED */}

                <HStack
                  align="flex-start"
                  gap={3}
                >
                  <Flex
                    w="30px"
                    h="30px"
                    borderRadius="6px"
                    bg="#F5F7FA"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <LuCalendarDays
                      size={16}
                      color="#60708C"
                    />
                  </Flex>

                  <Box>
                    <Text
                      fontSize="12px"
                      color="#8491A5"
                      mb={1}
                    >
                      Created
                    </Text>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {formatDate(
                        family.created_at
                      )}
                    </Text>
                  </Box>
                </HStack>

                {/* UPDATED */}

                <HStack
                  align="flex-start"
                  gap={3}
                >
                  <Flex
                    w="30px"
                    h="30px"
                    borderRadius="6px"
                    bg="#F5F7FA"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <LuUserRound
                      size={16}
                      color="#60708C"
                    />
                  </Flex>

                  <Box>
                    <Text
                      fontSize="12px"
                      color="#8491A5"
                      mb={1}
                    >
                      Last Updated
                    </Text>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {formatDate(
                        family.updated_at
                      )}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            {/* QUICK ACTION */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              p={5}
            >
              <Text
                fontSize="14px"
                fontWeight="700"
                color="#182338"
                mb={1}
              >
                Family Actions
              </Text>

              <Text
                fontSize="12px"
                color="#60708C"
                mb={4}
              >
                Manage this family record.
              </Text>

              <Button
                width="100%"
                variant="outline"
                borderColor="#D7193F"
                color="#D7193F"
                h="42px"
                onClick={() =>
                  navigate(
                    `/family-master/${family.id}/edit`
                  )
                }
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <LuPencil
                  style={{
                    marginRight: "8px",
                  }}
                />

                Edit Family
              </Button>
            </Box>
          </Box>
        </Flex>

        {/* ==================================================
            BOTTOM ACTION
        ================================================== */}

        <Flex
          justify="flex-end"
          mt={5}
          pt={5}
          borderTop="1px solid #E6EAF0"
        >
          <Button
            variant="outline"
            borderColor="#C7CFDA"
            color="#344054"
            onClick={() => navigate("/family")}
          >
            <LuArrowLeft
              style={{
                marginRight: "8px",
              }}
            />

            Back to Family Master
          </Button>
        </Flex>
      </Container>

      <Footer />
    </Box>
  );
};

export default FamilyViewPage;