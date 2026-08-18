// src/pages/HeadlessPromote.jsx

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
  Badge,
  Card,
  RadioGroup,
  Spinner,
} from "@chakra-ui/react";

import { useNavigate, useLocation } from "react-router-dom";

import {
  LuArrowLeft,
  LuUserPlus,
  LuUsers,
  LuMapPin,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listMembers,
  promoteToHead,
} from "../api/registryServices";

/* ============================================================
   HELPERS
============================================================ */

const getArrayData = (response) => {
  const data = response?.data ?? response ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || [];
};

const getId = (value) => {
  if (value && typeof value === "object") {
    return value.id ?? null;
  }

  return value ?? null;
};

/* ============================================================
   COMPONENT
============================================================ */

const HeadlessPromote = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ==========================================================
     STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] =
    useState(null);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  /* ==========================================================
     LOCATION STATE
  ========================================================== */

  const {
    family_id,
    house_name,
    house_sequence,
  } = location.state || {};

  /* ==========================================================
     LOAD HOUSEHOLD MEMBERS
  ========================================================== */

  const loadHouseholdMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listMembers();

      const allMembers =
        getArrayData(response);

      const normalizedFamilyId =
        Number(family_id);

      const normalizedHouseName =
        String(house_name || "")
          .trim()
          .toLowerCase();

      const normalizedHouseSequence =
        Number(house_sequence ?? 1);

      /* ======================================================
         FILTER MEMBERS BELONGING TO HOUSEHOLD
      ====================================================== */

      const householdMembers =
        allMembers.filter((member) => {
          const memberFamilyId =
            Number(getId(member.family));

          const memberHouseName =
            String(member.house_name || "")
              .trim()
              .toLowerCase();

          const memberHouseSequence =
            Number(
              member.house_sequence ?? 1
            );

          return (
            memberFamilyId ===
              normalizedFamilyId &&
            memberHouseName ===
              normalizedHouseName &&
            memberHouseSequence ===
              normalizedHouseSequence &&
            Boolean(member.is_active) &&
            !member.expired
          );
        });

      /* ======================================================
         ONLY NON-HEAD MEMBERS ARE ELIGIBLE
      ====================================================== */

      const eligibleMembers =
        householdMembers.filter(
          (member) =>
            !member.is_family_head
        );

      setMembers(eligibleMembers);
      setSelectedMember(null);
    } catch (err) {
      console.error(
        "Error loading household members:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load household members."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (!family_id || !house_name) {
      setError(
        "Missing family or house information."
      );

      setLoading(false);

      return;
    }

    loadHouseholdMembers();
  }, [
    family_id,
    house_name,
    house_sequence,
  ]);

  /* ==========================================================
     SELECT MEMBER
  ========================================================== */

  const handleSelectMember = (value) => {
    const selectedId = Number(value);

    const member = members.find(
      (item) =>
        Number(item.id) === selectedId
    );

    setSelectedMember(
      member || null
    );
  };

  /* ==========================================================
     PROMOTE MEMBER
  ========================================================== */

  const handlePromote = async () => {
    if (!selectedMember) {
      setError(
        "Please select a member to promote to family head."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await promoteToHead(
        selectedMember.id
      );

      /*
       * Return to Family Head Dashboard.
       *
       * The dashboard can read this state and
       * optionally show a success message.
       */

      navigate("/family-heads", {
        state: {
          successMessage: `${selectedMember.name} has been promoted to family head.`,
        },
      });
    } catch (err) {
      console.error(
        "Promotion error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to promote member."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="var(--white)"
        display="flex"
        flexDirection="column"
        overflowX="hidden"
      >
        <Navbar />

        <Container
          maxW="container.md"
          flex="1"
          py="40px"
        >
          <Flex
            justify="center"
            align="center"
            minH="300px"
          >
            <VStack gap="12px">
              <Spinner
                size="xl"
                color="var(--primary-maroon)"
              />

              <Text
                fontSize="13px"
                color="var(--light-gray)"
              >
                Loading household members...
              </Text>
            </VStack>
          </Flex>
        </Container>

        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <Box
      minH="100vh"
      bg="var(--white)"
      display="flex"
      flexDirection="column"
      overflowX="hidden"
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <Container
        maxW="container.md"
        flex="1"
        py={{
          base: "20px",
          md: "30px",
        }}
        px={{
          base: "16px",
          sm: "20px",
          md: "24px",
        }}
      >
        {/* ====================================================
            BACK BUTTON
        ===================================================== */}

        <Button
          variant="ghost"
          onClick={() =>
            navigate("/family-heads")
          }
          mb="20px"
          color="var(--primary-maroon)"
          fontSize="12px"
          fontWeight="500"
          h="36px"
          px="10px"
          _hover={{
            bg: "var(--light-maroon-bg)",
          }}
        >
          <LuArrowLeft size={17} />

          <Text ml="7px">
            Back to Family Heads
          </Text>
        </Button>

        {/* ====================================================
            ERROR MESSAGE
        ===================================================== */}

        {error && (
          <Box
            mb="16px"
            p="11px 14px"
            border="1px solid"
            borderColor="var(--danger)"
            bg="var(--light-bg)"
            borderRadius="7px"
          >
            <Text
              color="var(--danger)"
              fontSize="12px"
              fontWeight="500"
            >
              {error}
            </Text>
          </Box>
        )}

        {/* ====================================================
            MAIN CARD
        ===================================================== */}

        <Card.Root
          width="100%"
          border="1px solid"
          borderColor="var(--border-color)"
          borderRadius="10px"
          overflow="hidden"
          bg="var(--white)"
          boxShadow="none"
        >
          {/* ==================================================
              CARD HEADER
          ================================================== */}

          <Card.Header
            px={{
              base: "16px",
              md: "22px",
            }}
            pt={{
              base: "18px",
              md: "22px",
            }}
            pb="12px"
          >
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
              gap="14px"
            >
              <Box minW="0">
                <Text
                  fontSize="10px"
                  fontWeight="700"
                  color="var(--primary-maroon)"
                  letterSpacing="0.4px"
                  mb="4px"
                >
                  FAMILY HEAD MASTER
                </Text>

                <Heading
                  fontSize={{
                    base: "21px",
                    md: "25px",
                  }}
                  color="var(--dark-text)"
                  fontWeight="700"
                  lineHeight="1.2"
                >
                  Promote Family Head
                </Heading>

                <Text
                  color="var(--light-gray)"
                  fontSize="12px"
                  mt="5px"
                >
                  This household has no active
                  family head. Select a member
                  to promote.
                </Text>
              </Box>

              <Badge
                bg="var(--warning-bg)"
                color="var(--warning-color)"
                fontSize="10px"
                fontWeight="600"
                px="11px"
                py="6px"
                borderRadius="full"
                flexShrink={0}
              >
                Headless Household
              </Badge>
            </Flex>
          </Card.Header>

          {/* ==================================================
              CARD BODY
          ================================================== */}

          <Card.Body
            px={{
              base: "16px",
              md: "22px",
            }}
            pb={{
              base: "18px",
              md: "22px",
            }}
          >
            {/* ================================================
                HOUSEHOLD INFORMATION
            ================================================= */}

            <Box
              bg="var(--light-bg)"
              p={{
                base: "13px",
                md: "16px",
              }}
              borderRadius="7px"
              mb="24px"
              border="1px solid"
              borderColor="var(--border-color)"
            >
              <Flex
                gap={{
                  base: "17px",
                  md: "28px",
                }}
                wrap="wrap"
              >
                {/* FAMILY */}

                <HStack
                  gap="9px"
                  minW="150px"
                >
                  <Box
                    color="var(--primary-maroon)"
                    flexShrink={0}
                  >
                    <LuUsers size={18} />
                  </Box>

                  <Box minW="0">
                    <Text
                      fontSize="9px"
                      color="var(--light-gray)"
                      textTransform="uppercase"
                      letterSpacing="0.4px"
                    >
                      Family
                    </Text>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="var(--dark-text)"
                      mt="2px"
                      lineClamp={1}
                    >
                      {members[0]
                        ?.family_name ||
                        "Unknown Family"}
                    </Text>
                  </Box>
                </HStack>

                {/* HOUSE */}

                <HStack
                  gap="9px"
                  minW="150px"
                >
                  <Box
                    color="var(--primary-maroon)"
                    flexShrink={0}
                  >
                    <LuMapPin size={18} />
                  </Box>

                  <Box minW="0">
                    <Text
                      fontSize="9px"
                      color="var(--light-gray)"
                      textTransform="uppercase"
                      letterSpacing="0.4px"
                    >
                      House
                    </Text>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="var(--dark-text)"
                      mt="2px"
                      lineClamp={1}
                    >
                      {house_name ||
                        "Unnamed House"}
                    </Text>
                  </Box>
                </HStack>

                {/* MEMBERS */}

                <HStack
                  gap="9px"
                  minW="150px"
                >
                  <Box
                    color="var(--primary-maroon)"
                    flexShrink={0}
                  >
                    <LuUsers size={18} />
                  </Box>

                  <Box minW="0">
                    <Text
                      fontSize="9px"
                      color="var(--light-gray)"
                      textTransform="uppercase"
                      letterSpacing="0.4px"
                    >
                      Members
                    </Text>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="var(--dark-text)"
                      mt="2px"
                    >
                      {members.length} eligible{" "}
                      {members.length === 1
                        ? "member"
                        : "members"}
                    </Text>
                  </Box>
                </HStack>
              </Flex>
            </Box>

            {/* ================================================
                NO ELIGIBLE MEMBERS
            ================================================= */}

            {members.length === 0 ? (
              <Box
                textAlign="center"
                py="45px"
              >
                <Box
                  width="54px"
                  height="54px"
                  borderRadius="50%"
                  bg="var(--light-maroon-bg)"
                  color="var(--primary-maroon)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="14px"
                >
                  <LuUsers size={24} />
                </Box>

                <Text
                  color="var(--dark-text)"
                  fontSize="14px"
                  fontWeight="600"
                >
                  No eligible members found
                </Text>

                <Text
                  fontSize="12px"
                  color="var(--light-gray)"
                  mt="5px"
                >
                  All members may already be
                  heads or inactive.
                </Text>

                <Button
                  mt="18px"
                  bg="var(--primary-maroon)"
                  color="var(--white)"
                  fontSize="12px"
                  h="36px"
                  px="16px"
                  onClick={() =>
                    navigate(
                      "/family-heads"
                    )
                  }
                  _hover={{
                    bg:
                      "var(--primary-maroon)",
                    opacity: 0.9,
                  }}
                >
                  Return to Dashboard
                </Button>
              </Box>
            ) : (
              <>
                {/* ============================================
                    SELECT MEMBER
                ============================================= */}

                <Text
                  fontWeight="600"
                  color="var(--dark-text)"
                  fontSize="13px"
                  mb="12px"
                >
                  Select a member to promote:
                </Text>

                {/* ============================================
                    CHAKRA V3 RADIO GROUP
                ============================================= */}

                <RadioGroup.Root
                  value={
                    selectedMember
                      ? String(
                          selectedMember.id
                        )
                      : ""
                  }
                  onValueChange={(details) =>
                    handleSelectMember(
                      details.value
                    )
                  }
                >
                  <VStack
                    align="stretch"
                    gap="9px"
                  >
                    {members.map(
                      (member) => {
                        const isSelected =
                          Number(
                            selectedMember?.id
                          ) ===
                          Number(member.id);

                        return (
                          <Box
                            key={member.id}
                            p="13px"
                            border="2px solid"
                            borderColor={
                              isSelected
                                ? "var(--primary-maroon)"
                                : "var(--border-color)"
                            }
                            borderRadius="8px"
                            bg={
                              isSelected
                                ? "var(--light-maroon-bg)"
                                : "var(--white)"
                            }
                            cursor="pointer"
                            transition="all 0.18s ease"
                            _hover={{
                              borderColor:
                                "var(--primary-maroon)",
                              bg:
                                "var(--light-maroon-bg)",
                            }}
                            onClick={() =>
                              setSelectedMember(
                                member
                              )
                            }
                          >
                            <RadioGroup.Item
                              value={String(
                                member.id
                              )}
                            >
                              <RadioGroup.ItemHiddenInput />

                              <RadioGroup.ItemIndicator />

                              <RadioGroup.ItemText>
                                <Box
                                  ml="6px"
                                  minW="0"
                                >
                                  {/* NAME */}

                                  <Flex
                                    align="center"
                                    gap="8px"
                                    flexWrap="wrap"
                                  >
                                    <Text
                                      fontWeight="600"
                                      color="var(--dark-text)"
                                      fontSize="13px"
                                    >
                                      {member.name ||
                                        "Unnamed Member"}
                                    </Text>

                                    {member.is_active && (
                                      <Badge
                                        bg="var(--success-bg)"
                                        color="var(--success)"
                                        fontSize="8px"
                                        px="5px"
                                        py="2px"
                                        borderRadius="4px"
                                      >
                                        Active
                                      </Badge>
                                    )}
                                  </Flex>

                                  {/* MEMBER DETAILS */}

                                  <HStack
                                    gap="12px"
                                    mt="4px"
                                    flexWrap="wrap"
                                  >
                                    <Text
                                      fontSize="11px"
                                      color="var(--light-gray)"
                                    >
                                      {member.gender ||
                                        "N/A"}
                                    </Text>

                                    {member.age && (
                                      <Text
                                        fontSize="11px"
                                        color="var(--light-gray)"
                                      >
                                        Age:{" "}
                                        {
                                          member.age
                                        }
                                      </Text>
                                    )}

                                    {member.relationship
                                      ?.name && (
                                      <Text
                                        fontSize="11px"
                                        color="var(--light-gray)"
                                      >
                                        Relation:{" "}
                                        {
                                          member
                                            .relationship
                                            .name
                                        }
                                      </Text>
                                    )}

                                    {(member.mobile_no ||
                                      member.phone) && (
                                      <Text
                                        fontSize="11px"
                                        color="var(--light-gray)"
                                      >
                                        📱{" "}
                                        {member.mobile_no ||
                                          member.phone}
                                      </Text>
                                    )}
                                  </HStack>
                                </Box>
                              </RadioGroup.ItemText>
                            </RadioGroup.Item>
                          </Box>
                        );
                      }
                    )}
                  </VStack>
                </RadioGroup.Root>

                {/* ============================================
                    DIVIDER
                    Chakra v3 does not use Divider export
                ============================================= */}

                <Box
                  borderTop="1px solid"
                  borderColor="var(--divider-color)"
                  my="24px"
                  width="100%"
                />

                {/* ============================================
                    ACTION BUTTONS
                ============================================= */}

                <Flex
                  justify="flex-end"
                  gap="10px"
                  direction={{
                    base: "column-reverse",
                    sm: "row",
                  }}
                >
                  {/* CANCEL */}

                  <Button
                    variant="outline"
                    borderColor="var(--border-color)"
                    color="var(--dark-text)"
                    h="36px"
                    px="16px"
                    fontSize="12px"
                    onClick={() =>
                      navigate(
                        "/family-heads"
                      )
                    }
                    disabled={submitting}
                    _hover={{
                      bg: "var(--light-bg)",
                    }}
                  >
                    Cancel
                  </Button>

                  {/* PROMOTE */}

                  <Button
                    bg="var(--primary-maroon)"
                    color="var(--white)"
                    h="36px"
                    px="17px"
                    fontSize="12px"
                    onClick={handlePromote}
                    loading={submitting}
                    disabled={
                      !selectedMember ||
                      submitting
                    }
                    _hover={{
                      bg:
                        "var(--primary-maroon)",
                      opacity: 0.9,
                    }}
                  >
                    <LuUserPlus size={15} />

                    <Text ml="7px">
                      {submitting
                        ? "Promoting..."
                        : "Promote to Head"}
                    </Text>
                  </Button>
                </Flex>
              </>
            )}
          </Card.Body>
        </Card.Root>
      </Container>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />

      {/* ======================================================
          RESPONSIVE CSS
      ====================================================== */}

      <style>
        {`
          html,
          body,
          #root {
            max-width: 100%;
            overflow-x: hidden !important;
          }

          * {
            box-sizing: border-box;
          }

          @media (max-width: 600px) {
            body {
              overflow-x: hidden !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default HeadlessPromote;