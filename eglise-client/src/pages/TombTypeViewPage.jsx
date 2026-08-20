import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
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

import { listTombTypes } from "../api/churchServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const TombTypeViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [tombType, setTombType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTombType = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await listTombTypes();

        const data = response?.data ?? response;

        const items = Array.isArray(data)
          ? data
          : data?.results || [];

        const found = items.find(
          (item) => String(item.id) === String(id)
        );

        if (!found) {
          setError("Tomb type record not found.");
          return;
        }

        setTombType(found);
      } catch (err) {
        console.error(
          "Error loading tomb type:",
          err
        );

        const apiError =
          err?.response?.data?.detail ||
          "Unable to load tomb type record.";

        setError(apiError);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTombType();
    }
  }, [id]);

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

  const handleEdit = () => {
    navigate(`/tomb-type/${id}/edit`);
  };

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
          px={{ base: 4, md: 6 }}
          py={8}
          flex="1"
        >
          <Text
            color="#60708C"
            fontSize="13px"
          >
            Loading tomb type...
          </Text>
        </Container>

        <Footer />
      </Box>
    );
  }

  if (error || !tombType) {
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
          px={{ base: 4, md: 6 }}
          py={8}
          flex="1"
        >
          <Text
            color="#D7193F"
            fontWeight="600"
            fontSize="13px"
            mb={5}
          >
            {error || "Tomb type record not found."}
          </Text>

          <Button
            variant="outline"
            borderColor="#C7CFDA"
            color="#344054"
            h="38px"
            fontSize="12px"
            borderRadius="6px"
            onClick={() =>
              navigate("/tomb-type")
            }
          >
            <LuArrowLeft
              size={15}
              style={{
                marginRight: "7px",
              }}
            />

            Back to Tomb Type Master
          </Button>
        </Container>

        <Footer />
      </Box>
    );
  }

  const tombTypeName =
    tombType.name || "Unnamed Tomb Type";

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
        px={{ base: 4, md: 5 }}
        py={{ base: 3, md: 4 }}
        flex="1"
      >
        {/* BREADCRUMB */}

        <HStack
          gap={2}
          mb={3}
          fontSize="12px"
          color="#60708C"
          flexWrap="wrap"
        >
          <Text>Masters</Text>

          <Text>/</Text>

          <Text>Tomb Type Master</Text>

          <Text>/</Text>

          <Text color="#344054">
            {tombTypeName}
          </Text>

          <Text>/</Text>

          <Text color="#60708C">
            View
          </Text>
        </HStack>

        {/* HEADER */}

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
          gap={3}
          mb={4}
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
                base: "24px",
                md: "28px",
              }}
              lineHeight="1.2"
              mb={1}
            >
              {tombTypeName}
            </Heading>

            <Text
              color="#60708C"
              fontSize="12px"
            >
              View tomb type information.
            </Text>
          </Box>

          <Button
            bg={PRIMARY_MAROON}
            color="white"
            px={5}
            h="38px"
            borderRadius="6px"
            fontSize="12px"
            onClick={handleEdit}
            _hover={{
              bg: "#650A18",
            }}
          >
            <LuPencil
              size={15}
              style={{
                marginRight: "7px",
              }}
            />

            Edit Tomb Type
          </Button>
        </Flex>

        {/* CONTENT */}

        <Flex
          direction={{
            base: "column",
            lg: "row",
          }}
          gap={4}
          align="stretch"
        >
          {/* LEFT */}

          <Box
            flex="1"
            minW={0}
          >
            {/* HEADER CARD */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="9px"
              p={{
                base: 4,
                md: 4,
              }}
              mb={4}
            >
              <HStack
                align="center"
                gap={3}
              >
                <Flex
                  w="60px"
                  h="60px"
                  minW="60px"
                  borderRadius="full"
                  border="1px solid #F3B4C1"
                  bg="#FFF8FA"
                  align="center"
                  justify="center"
                >
                  <Text
                    color="#D7193F"
                    fontSize="22px"
                    fontWeight="700"
                  >
                    {tombTypeName
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </Flex>

                <Box>
                  <Heading
                    fontSize={{
                      base: "20px",
                      md: "22px",
                    }}
                    color="#182338"
                    mb={1}
                  >
                    {tombTypeName}
                  </Heading>

                  <HStack
                    gap={3}
                    flexWrap="wrap"
                    color="#60708C"
                    fontSize="12px"
                  >
                    <Text>
                      {tombType.code ||
                        `TT-${String(
                          tombType.id
                        ).padStart(4, "0")}`}
                    </Text>

                    <Text>•</Text>

                    <Box
                      px={2.5}
                      py={0.5}
                      borderRadius="5px"
                      bg="#EAF8ED"
                      border="1px solid #B8E0BE"
                      color="#25803C"
                      fontSize="11px"
                      fontWeight="600"
                    >
                      Active
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* DETAILS CARD */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="9px"
              overflow="hidden"
            >
              <Box
                px={{
                  base: 4,
                  md: 5,
                }}
                pt={3}
                borderBottom="1px solid #DCE2EA"
              >
                <Text
                  color="#D7193F"
                  fontWeight="700"
                  fontSize="13px"
                  pb={2.5}
                  borderBottom="3px solid #D7193F"
                  width="fit-content"
                >
                  Tomb Type Details
                </Text>
              </Box>

              <Box
                p={{
                  base: 4,
                  md: 5,
                }}
              >
                <Heading
                  fontSize="16px"
                  color="#182338"
                  mb={1}
                >
                  Tomb Type Information
                </Heading>

                <Text
                  color="#60708C"
                  fontSize="12px"
                  mb={5}
                >
                  Basic information about this
                  tomb type record.
                </Text>

                <Box>
                  <Text
                    fontSize="11px"
                    color="#60708C"
                    mb={1}
                  >
                    Tomb Type Name
                  </Text>

                  <Text
                    fontSize="14px"
                    fontWeight="600"
                    color="#182338"
                  >
                    {tombTypeName}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* RIGHT SIDEBAR */}

          <Box
            w={{
              base: "100%",
              lg: "300px",
            }}
            flexShrink={0}
          >
            {/* RECORD INFORMATION */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="9px"
              p={4}
              mb={3}
            >
              <HStack
                gap={2.5}
                mb={4}
              >
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="6px"
                  bg="#FFF0F3"
                  align="center"
                  justify="center"
                >
                  <LuFileText
                    size={15}
                    color="#D7193F"
                  />
                </Flex>

                <Heading
                  fontSize="15px"
                  color="#182338"
                >
                  Record Information
                </Heading>
              </HStack>

              <VStack
                align="stretch"
                gap={4}
              >
                {/* CREATED */}

                <HStack
                  align="flex-start"
                  gap={2.5}
                >
                  <Flex
                    w="28px"
                    h="28px"
                    borderRadius="6px"
                    bg="#F5F7FA"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <LuCalendarDays
                      size={15}
                      color="#60708C"
                    />
                  </Flex>

                  <Box>
                    <Text
                      fontSize="11px"
                      color="#8491A5"
                      mb={0.5}
                    >
                      Created
                    </Text>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {formatDate(
                        tombType.created_at
                      )}
                    </Text>
                  </Box>
                </HStack>

                {/* UPDATED */}

                <HStack
                  align="flex-start"
                  gap={2.5}
                >
                  <Flex
                    w="28px"
                    h="28px"
                    borderRadius="6px"
                    bg="#F5F7FA"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <LuUserRound
                      size={15}
                      color="#60708C"
                    />
                  </Flex>

                  <Box>
                    <Text
                      fontSize="11px"
                      color="#8491A5"
                      mb={0.5}
                    >
                      Last Updated
                    </Text>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="#182338"
                    >
                      {formatDate(
                        tombType.updated_at
                      )}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            {/* ACTIONS */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="9px"
              p={4}
            >
              <Text
                fontSize="13px"
                fontWeight="700"
                color="#182338"
                mb={1}
              >
                Tomb Type Actions
              </Text>

              <Text
                fontSize="11px"
                color="#60708C"
                mb={3}
              >
                Manage this tomb type record.
              </Text>

              <Button
                width="100%"
                variant="outline"
                borderColor="#D7193F"
                color="#D7193F"
                h="36px"
                fontSize="12px"
                borderRadius="6px"
                onClick={handleEdit}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <LuPencil
                  size={14}
                  style={{
                    marginRight: "7px",
                  }}
                />

                Edit Tomb Type
              </Button>
            </Box>
          </Box>
        </Flex>

        {/* BOTTOM ACTION */}

        <Flex
          justify="flex-end"
          mt={4}
          pt={4}
          borderTop="1px solid #E6EAF0"
        >
          <Button
            variant="outline"
            borderColor="#C7CFDA"
            color="#344054"
            h="36px"
            px={4}
            fontSize="12px"
            borderRadius="6px"
            onClick={() =>
              navigate("/tomb-type")
            }
          >
            <LuArrowLeft
              size={14}
              style={{
                marginRight: "7px",
              }}
            />

            Back to Tomb Type Master
          </Button>
        </Flex>
      </Container>

      <Footer />
    </Box>
  );
};

export default TombTypeViewPage;