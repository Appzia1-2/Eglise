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
  LuMapPin,
  LuHash,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getWard } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const WardViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ward, setWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD WARD
  // ==========================================================

  useEffect(() => {
    const loadWard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWard(id);

        const data = response?.data ?? response;

        if (!data) {
          setError("Ward record not found.");
          return;
        }

        setWard(data);
      } catch (err) {
        console.error("Error loading ward:", err);

        const apiError =
          err?.response?.data?.detail ||
          "Unable to load ward record.";

        setError(apiError);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadWard();
    }
  }, [id]);

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "-";
      }

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = () => {
    navigate(`/ward/${id}/edit`);
  };

  // ==========================================================
  // BACK
  // ==========================================================

  const handleBack = () => {
    navigate("/ward");
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
          px={{ base: 4, md: 6 }}
          py={8}
          flex="1"
        >
          <Text
            color={MUTED}
            fontSize="13px"
          >
            Loading ward...
          </Text>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !ward) {
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
            color={RED}
            fontWeight="600"
            fontSize="13px"
            mb={5}
          >
            {error || "Ward record not found."}
          </Text>

          <Button
            variant="outline"
            borderColor="#C7CFDA"
            color="#344054"
            h="38px"
            fontSize="12px"
            borderRadius="6px"
            onClick={handleBack}
            _hover={{
              bg: "#F8FAFC",
            }}
          >
            <LuArrowLeft
              size={15}
              style={{
                marginRight: "7px",
              }}
            />

            Back to Ward Master
          </Button>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // WARD DATA
  // ==========================================================

  const wardName =
    ward?.ward_name || "Unnamed Ward";

  const wardNumber =
    ward?.ward_number !== null &&
    ward?.ward_number !== undefined
      ? ward.ward_number
      : "-";

  const place =
    ward?.place || "-";

  const wardCode =
    ward?.code ||
    `WD-${String(
      ward?.id || "0001"
    ).padStart(4, "0")}`;

  const createdDate =
    ward?.created_at ||
    ward?.created ||
    ward?.created_on;

  const updatedDate =
    ward?.updated_at ||
    ward?.updated ||
    ward?.updated_on;

  // ==========================================================
  // MAIN PAGE
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
        px={{ base: 4, md: 5 }}
        py={{ base: 3, md: 4 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={3}
          fontSize="12px"
          color={MUTED}
          flexWrap="wrap"
        >
          <Text>
            Masters
          </Text>

          <Text>/</Text>

          <Text>
            Ward Master
          </Text>

          <Text>/</Text>

          <Text color="#344054">
            {wardName}
          </Text>

          <Text>/</Text>

          <Text color={MUTED}>
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
          gap={3}
          mb={4}
        >
          <Box>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={RED}
              mb={1}
            >
              WARD MASTER
            </Text>

            <Heading
              color={DARK}
              fontSize={{
                base: "24px",
                md: "28px",
              }}
              lineHeight="1.2"
              mb={1}
            >
              {wardName}
            </Heading>

            <Text
              color={MUTED}
              fontSize="12px"
            >
              View ward information.
            </Text>
          </Box>

          {/* EDIT BUTTON */}

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

            Edit Ward
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
          gap={4}
          align="stretch"
        >
          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <Box
            flex="1"
            minW={0}
          >
            {/* =================================================
                WARD HEADER CARD
            ================================================= */}

            <Box
              border={`1px solid ${BORDER}`}
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
                {/* AVATAR */}

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
                    color={RED}
                    fontSize="22px"
                    fontWeight="700"
                  >
                    {wardName
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </Flex>

                {/* WARD SUMMARY */}

                <Box>
                  <Heading
                    fontSize={{
                      base: "20px",
                      md: "22px",
                    }}
                    color={DARK}
                    mb={1}
                  >
                    {wardName}
                  </Heading>

                  <HStack
                    gap={3}
                    flexWrap="wrap"
                    color={MUTED}
                    fontSize="12px"
                  >
                    <Text>
                      {wardCode}
                    </Text>

                    <Text>
                      •
                    </Text>

                    <Text>
                      Ward {wardNumber}
                    </Text>

                    <Text>
                      •
                    </Text>

                    <Text>
                      {place}
                    </Text>

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

            {/* =================================================
                WARD DETAILS CARD
            ================================================= */}

            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="9px"
              overflow="hidden"
            >
              {/* TAB HEADER */}

              <Box
                px={{
                  base: 4,
                  md: 5,
                }}
                pt={3}
                borderBottom={`1px solid ${BORDER}`}
              >
                <Text
                  color={RED}
                  fontWeight="700"
                  fontSize="13px"
                  pb={2.5}
                  borderBottom={`3px solid ${RED}`}
                  width="fit-content"
                >
                  Ward Details
                </Text>
              </Box>

              {/* DETAILS */}

              <Box
                p={{
                  base: 4,
                  md: 5,
                }}
              >
                <Heading
                  fontSize="16px"
                  color={DARK}
                  mb={1}
                >
                  Ward Information
                </Heading>

                <Text
                  color={MUTED}
                  fontSize="12px"
                  mb={5}
                >
                  Basic information about this
                  ward record.
                </Text>

                {/* =========================================
                    WARD INFORMATION GRID
                ========================================= */}

                <Box
                  display="grid"
                  gridTemplateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                  }}
                  gap={{
                    base: 4,
                    md: 5,
                  }}
                >
                  {/* WARD NAME */}

                  <Box>
                    <HStack
                      gap={2}
                      mb={1}
                    >
                      <LuFileText
                        size={14}
                        color={MUTED}
                      />

                      <Text
                        fontSize="11px"
                        color={MUTED}
                      >
                        Ward Name
                      </Text>
                    </HStack>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {wardName}
                    </Text>
                  </Box>

                  {/* WARD NUMBER */}

                  <Box>
                    <HStack
                      gap={2}
                      mb={1}
                    >
                      <LuHash
                        size={14}
                        color={MUTED}
                      />

                      <Text
                        fontSize="11px"
                        color={MUTED}
                      >
                        Ward Number
                      </Text>
                    </HStack>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {wardNumber}
                    </Text>
                  </Box>

                  {/* PLACE */}

                  <Box>
                    <HStack
                      gap={2}
                      mb={1}
                    >
                      <LuMapPin
                        size={14}
                        color={MUTED}
                      />

                      <Text
                        fontSize="11px"
                        color={MUTED}
                      >
                        Place
                      </Text>
                    </HStack>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {place}
                    </Text>
                  </Box>

                  {/* WARD CODE */}

                  <Box>
                    <HStack
                      gap={2}
                      mb={1}
                    >
                      <LuFileText
                        size={14}
                        color={MUTED}
                      />

                      <Text
                        fontSize="11px"
                        color={MUTED}
                      >
                        Ward Code
                      </Text>
                    </HStack>

                    <Text
                      fontSize="14px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {wardCode}
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
              lg: "300px",
            }}
            flexShrink={0}
          >
            {/* =================================================
                RECORD INFORMATION
            ================================================= */}

            <Box
              border={`1px solid ${BORDER}`}
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
                    color={RED}
                  />
                </Flex>

                <Heading
                  fontSize="15px"
                  color={DARK}
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
                      color={MUTED}
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
                      color={DARK}
                    >
                      {formatDate(createdDate)}
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
                      color={MUTED}
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
                      color={DARK}
                    >
                      {formatDate(updatedDate)}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            {/* =================================================
                QUICK ACTION
            ================================================= */}

            <Box
              border={`1px solid ${BORDER}`}
              borderRadius="9px"
              p={4}
            >
              <Text
                fontSize="13px"
                fontWeight="700"
                color={DARK}
                mb={1}
              >
                Ward Actions
              </Text>

              <Text
                fontSize="11px"
                color={MUTED}
                mb={3}
              >
                Manage this ward record.
              </Text>

              <Button
                width="100%"
                variant="outline"
                borderColor={RED}
                color={RED}
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

                Edit Ward
              </Button>
            </Box>
          </Box>
        </Flex>

        {/* ==================================================
            BOTTOM ACTION
        ================================================== */}

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
            onClick={handleBack}
          >
            <LuArrowLeft
              size={14}
              style={{
                marginRight: "7px",
              }}
            />

            Back to Ward Master
          </Button>
        </Flex>
      </Container>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default WardViewPage;