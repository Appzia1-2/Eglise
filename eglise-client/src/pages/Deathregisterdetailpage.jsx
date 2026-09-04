import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Badge,
  Icon,
  Image,
  Tabs as ChakraTabs,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuUserRound,
  LuCalendarDays,
  LuMapPin,
  LuPencil,
  LuUsersRound,
  LuFileText,
  LuClock,
  LuCross,
  LuPrinter,
  LuFile,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getDeath } from "../api/registryServices";

import DeathRegisterPrintModal from "../components/DeathRegisterPrintModal";

// ==========================================================
// CHURCH IMAGE
// ==========================================================

import logoImage from "../assets/priest2.png";

// ==========================================================
// COLORS
// ==========================================================

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#A50F2E";

const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";

const BORDER_COLOR = "#DCE2EA";

const LIGHT_BG = "#F8FAFC";

// ==========================================================
// SECTION CARD
// ==========================================================

const SectionCard = ({
  title,
  icon,
  children,
  minH,
  graphic = false,
}) => {
  return (
    <Box
      position="relative"
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="8px"
      bg="#FFFFFF"
      overflow="hidden"
      minH={minH || "auto"}
    >
      {/* HEADER */}

      <HStack
        px="14px"
        py="8px"
        gap="8px"
        borderBottom={`1px solid ${BORDER_COLOR}`}
        position="relative"
        zIndex={2}
        bg="#F8FAFC"
      >
        <Box
          boxSize="24px"
          borderRadius="full"
          bg="#FFF1F4"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon
            as={icon}
            boxSize="12px"
            color={PRIMARY_RED}
          />
        </Box>

        <Heading
          fontSize="14px"
          fontWeight="700"
          color={TEXT_COLOR}
        >
          {title}
        </Heading>
      </HStack>

      {/* CONTENT */}

      <Box
        px="14px"
        py="12px"
        position="relative"
        zIndex={2}
        maxW={graphic ? "72%" : "100%"}
      >
        {children}
      </Box>

      {/* CHURCH ILLUSTRATION */}

      {graphic && (
        <Box
          position="absolute"
          right="0"
          bottom="0"
          width={{
            base: "0",
            md: "45%",
            lg: "40%",
          }}
          height="100%"
          display={{
            base: "none",
            md: "flex",
          }}
          alignItems="center"
          justifyContent="flex-end"
          pointerEvents="none"
          overflow="hidden"
        >
          <Image
            src={logoImage}
            alt="Church illustration"
            width="100%"
            height="80%"
            objectFit="contain"
            objectPosition="right center"
          />
        </Box>
      )}
    </Box>
  );
};

// ==========================================================
// INFO ROW
// ==========================================================

const InfoRow = ({
  label,
  value,
  highlight = false,
}) => {
  return (
    <Flex
      align="center"
      gap={{
        base: "8px",
        md: "16px",
      }}
      minH="20px"
      width="100%"
    >
      <Text
        fontSize="11px"
        color={SECONDARY_TEXT}
        fontWeight="500"
        flex={{
          base: "0 0 100px",
          sm: "0 0 120px",
          md: "0 0 150px",
          lg: "0 0 160px",
        }}
      >
        {label}
      </Text>

      <Text
        fontSize="11px"
        color={
          highlight
            ? PRIMARY_RED
            : TEXT_COLOR
        }
        fontWeight={
          highlight ? "600" : "500"
        }
        textAlign="left"
        flex="1"
        minW="0"
      >
        {value || "N/A"}
      </Text>
    </Flex>
  );
};

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const DeathRegisterDetailPage = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  // ✅ FIXED: Use useState instead of useDisclosure
  const [isOpen, setIsOpen] = useState(false);

  const [death, setDeath] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState("overview");

  // ========================================================
  // LOAD DEATH RECORD
  // ========================================================

  useEffect(() => {
    const loadDeath = async () => {
      if (!id) {
        setError(
          "Death record ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        console.log(
          "Loading death record ID:",
          id
        );

        const response =
          await getDeath(id);

        console.log(
          "Death record response:",
          response?.data
        );

        setDeath(
          response?.data || null
        );
      } catch (err) {
        console.error(
          "Error loading death record:",
          err
        );

        const backendError =
          err?.response?.data;

        if (
          typeof backendError ===
          "string"
        ) {
          setError(backendError);
        } else if (
          backendError?.detail
        ) {
          setError(
            backendError.detail
          );
        } else if (
          backendError?.error
        ) {
          setError(
            backendError.error
          );
        } else {
          setError(
            "Unable to load death record."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDeath();
  }, [id]);

  // ========================================================
  // HANDLERS
  // ========================================================

  const handleBack = () => {
    navigate("/death-register");
  };

  const handleEdit = () => {
    navigate(`/death/${id}/edit`);
  };

  const handlePDF = () => {
    console.log("📄 Opening PDF preview modal");
    setIsOpen(true);
  };

  const handlePrint = () => {
    console.log("🖨️ Opening Print preview modal");
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    console.log("❌ Closing modal");
    setIsOpen(false);
  };

  // ========================================================
  // DATE FORMAT
  // ========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    try {
      return new Date(
        dateValue
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return dateValue;
    }
  };

  const formatDateTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "N/A";
    }

    try {
      return new Date(
        dateValue
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return dateValue;
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        height="100vh"
        overflow="hidden"
      >
        <Navbar />

        <Box
          flex="1"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="#FFFFFF"
        >
          <VStack gap="10px">
            <Spinner
              size="lg"
              color={PRIMARY_RED}
            />

            <Text
              fontSize="13px"
              color={SECONDARY_TEXT}
            >
              Loading death record...
            </Text>
          </VStack>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ========================================================
  // ERROR
  // ========================================================

  if (error || !death) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        height="100vh"
        overflow="hidden"
      >
        <Navbar />

        <Box
          flex="1"
          bg="#FFFFFF"
          px="25px"
          py="30px"
          overflowY="auto"
        >
          <Button
            variant="outline"
            borderColor={PRIMARY_RED}
            color={PRIMARY_RED}
            onClick={handleBack}
          >
            <Icon
              as={LuArrowLeft}
              mr="8px"
            />

            Back to Death Register
          </Button>

          <Box
            mt="30px"
            textAlign="center"
          >
            <Text
              fontSize="16px"
              fontWeight="600"
              color={TEXT_COLOR}
            >
              {error ||
                "Death record not found."}
            </Text>
          </Box>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ========================================================
  // DATA EXTRACTION
  // ========================================================

  const regNo =
    death?.reg_no || "N/A";

  const memberName =
    death?.member_name ||
    death?.member?.name ||
    "N/A";

  const familyName =
    death?.family_name ||
    death?.member?.family_name ||
    "N/A";

  const houseName =
    death?.house_name ||
    death?.member?.house_name ||
    death?.member?.house_no ||
    "N/A";

  const memberId =
    death?.member ||
    death?.member_id ||
    death?.member?.id ||
    null;

  const tombFee =
    death?.tomb_fee_details || {};

  const memberInitials =
    memberName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("");

  const createdDate =
    death?.created_at
      ? formatDateTime(
          death.created_at
        )
      : "N/A";

  const updatedDate =
    death?.updated_at
      ? formatDateTime(
          death.updated_at
        )
      : death?.created_at
      ? formatDateTime(
          death.created_at
        )
      : "N/A";

  const updatedBy =
    death?.updated_by?.name ||
    death?.updated_by?.email ||
    "Parish Admin";

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      overflow="hidden"
    >
      <Navbar />

      <Box
        flex="1"
        bg="#FFFFFF"
        overflowY="auto"
        minHeight="0"
      >
        <Container
          maxW="none"
          px={{
            base: 3,
            md: 5,
            xl: "20px",
          }}
          py="6px"
        >
          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <HStack
            gap="6px"
            mb="2px"
            fontSize="11px"
            color={SECONDARY_TEXT}
            h="16px"
          >
            <Text>
              Activities
            </Text>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text>
              Death Register
            </Text>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text color="#344054">
              {regNo}
            </Text>
          </HStack>

          {/* =================================================
              PAGE HEADER
          ================================================= */}

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
            gap="12px"
            mb="9px"
          >
            <Box>
              <Text
                color={PRIMARY_RED}
                fontSize="10px"
                fontWeight="700"
                mb="0px"
              >
                DEATH RECORD
              </Text>

              <Heading
                fontSize="20px"
                lineHeight="24px"
                fontWeight="700"
                color={TEXT_COLOR}
              >
                Death Record Details
              </Heading>

              <Text
                fontSize="11px"
                color={SECONDARY_TEXT}
                mt="0px"
              >
                View complete death,
                funeral and burial
                information.
              </Text>
            </Box>

            <HStack
              gap="10px"
              flexWrap="wrap"
            >
              {/* BACK */}

              <Button
                h="34px"
                px="14px"
                variant="outline"
                borderColor={
                  PRIMARY_RED
                }
                color={PRIMARY_RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={handleBack}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <Icon
                  as={LuArrowLeft}
                  mr="6px"
                  boxSize="13px"
                />

                Back to Death Register
              </Button>

              {/* PDF */}

              <Button
                h="34px"
                px="14px"
                variant="outline"
                borderColor={
                  PRIMARY_RED
                }
                color={PRIMARY_RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={handlePDF}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <Icon
                  as={LuFile}
                  mr="6px"
                  boxSize="13px"
                />

                PDF
              </Button>

              {/* PRINT */}

              <Button
                h="34px"
                px="14px"
                variant="outline"
                borderColor={
                  PRIMARY_RED
                }
                color={PRIMARY_RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={handlePrint}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                <Icon
                  as={LuPrinter}
                  mr="6px"
                  boxSize="13px"
                />

                Print
              </Button>

              {/* EDIT */}

              <Button
                h="34px"
                px="14px"
                bg={PRIMARY_RED}
                color="#FFFFFF"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="600"
                onClick={handleEdit}
                _hover={{
                  bg: DARK_RED,
                }}
              >
                <Icon
                  as={LuPencil}
                  mr="5px"
                  boxSize="13px"
                />

                Edit
              </Button>
            </HStack>
          </Flex>

          {/* =================================================
              DEATH SUMMARY
          ================================================= */}

          <Box
            border={`1px solid ${BORDER_COLOR}`}
            borderRadius="7px"
            bg="#FFFFFF"
            mb="6px"
            overflow="hidden"
          >
            <Flex
              minH={{
                base: "auto",
                lg: "10px",
              }}
              align="stretch"
              direction={{
                base: "column",
                lg: "row",
              }}
            >
              {/* PROFILE */}

              <Box
                flex="1.65"
                px={{
                  base: "14px",
                  md: "16px",
                }}
                py="8px"
                display="flex"
                alignItems="center"
              >
                <HStack
                  gap={{
                    base: "14px",
                    md: "16px",
                  }}
                  align="center"
                >
                  <Box
                    boxSize={{
                      base: "60px",
                      md: "68px",
                    }}
                    borderRadius="full"
                    bg="#FFF1F4"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text
                      fontSize="22px"
                      fontWeight="600"
                      color={PRIMARY_RED}
                    >
                      {memberInitials ||
                        "DR"}
                    </Text>
                  </Box>

                  <Box>
                    <Heading
                      fontSize={{
                        base: "16px",
                        md: "18px",
                      }}
                      lineHeight="20px"
                      fontWeight="700"
                      color={TEXT_COLOR}
                      mb="3px"
                    >
                      {memberName
                        .toLowerCase()
                        .startsWith("mr.")
                        ? memberName
                        : `Mr. ${memberName}`}
                    </Heading>

                    <HStack
                      gap="7px"
                      flexWrap="wrap"
                      fontSize="10px"
                    >
                      <HStack gap="4px">
                        <Icon
                          as={LuFileText}
                          boxSize="12px"
                          color={
                            PRIMARY_RED
                          }
                        />

                        <Text color={SECONDARY_TEXT}>
                          {regNo}
                        </Text>
                      </HStack>

                      <Text color="#98A2B3">
                        •
                      </Text>

                      <HStack gap="4px">
                        <Icon
                          as={LuUserRound}
                          boxSize="12px"
                          color={
                            PRIMARY_RED
                          }
                        />

                        <Text color={SECONDARY_TEXT}>
                          {memberId
                            ? `Member #${memberId}`
                            : "N/A"}
                        </Text>
                      </HStack>

                      <Text color="#98A2B3">
                        •
                      </Text>

                      <HStack gap="4px">
                        <Icon
                          as={LuCalendarDays}
                          boxSize="12px"
                          color={
                            PRIMARY_RED
                          }
                        />

                        <Text color={SECONDARY_TEXT}>
                          {formatDate(
                            death?.died_on
                          )}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack
                      mt="4px"
                      gap="5px"
                    >
                      <Badge
                        bg="#F2F4F7"
                        color="#52627A"
                        borderRadius="4px"
                        px="7px"
                        py="2px"
                        fontSize="9px"
                        fontWeight="600"
                      >
                        {death?.tomb_type_name ||
                          tombFee?.tomb_type_name ||
                          "N/A"}
                      </Badge>

                      <Badge
                        bg="#EAF7ED"
                        color="#16803A"
                        borderRadius="4px"
                        px="7px"
                        py="2px"
                        fontSize="9px"
                        fontWeight="600"
                      >
                        Recorded
                      </Badge>
                    </HStack>
                  </Box>
                </HStack>
              </Box>

              {/* FAMILY */}

              <Box
                flex="0.8"
                borderLeft={{
                  base: "none",
                  lg: `1px solid ${BORDER_COLOR}`,
                }}
                borderTop={{
                  base: `1px solid ${BORDER_COLOR}`,
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuUsersRound}
                    boxSize="18px"
                    color={PRIMARY_RED}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                    textAlign="center"
                  >
                    {familyName}
                    {" "}
                    Family
                  </Text>
                </VStack>
              </Box>

              {/* HOUSE */}

              <Box
                flex="0.85"
                borderLeft={{
                  base: "none",
                  lg: `1px solid ${BORDER_COLOR}`,
                }}
                borderTop={{
                  base: `1px solid ${BORDER_COLOR}`,
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuMapPin}
                    boxSize="18px"
                    color={PRIMARY_RED}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                    textAlign="center"
                  >
                    {houseName ||
                      "N/A"}
                  </Text>
                </VStack>
              </Box>

              {/* FUNERAL DATE */}

              <Box
                flex="0.95"
                borderLeft={{
                  base: "none",
                  lg: `1px solid ${BORDER_COLOR}`,
                }}
                borderTop={{
                  base: `1px solid ${BORDER_COLOR}`,
                  lg: "none",
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="12px"
                py="6px"
              >
                <VStack gap="3px">
                  <Icon
                    as={LuCalendarDays}
                    boxSize="18px"
                    color={PRIMARY_RED}
                  />

                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                    textAlign="center"
                  >
                    {formatDate(
                      death?.funeral_on
                    )}
                  </Text>
                </VStack>
              </Box>
            </Flex>
          </Box>

          {/* =================================================
              TABS
          ================================================= */}

          <ChakraTabs.Root
            value={activeTab}
            onValueChange={(details) =>
              setActiveTab(
                details.value
              )
            }
            variant="line"
          >
            <ChakraTabs.List
              borderBottom={`1px solid ${BORDER_COLOR}`}
              mb="8px"
            >
              <ChakraTabs.Trigger
                value="overview"
                px="16px"
                py="6px"
                fontSize="12px"
                color={SECONDARY_TEXT}
                _selected={{
                  color: PRIMARY_RED,
                  borderColor:
                    PRIMARY_RED,
                  fontWeight: "600",
                }}
              >
                Overview
              </ChakraTabs.Trigger>

              <ChakraTabs.Trigger
                value="funeral"
                px="16px"
                py="6px"
                fontSize="12px"
                color={SECONDARY_TEXT}
                _selected={{
                  color: PRIMARY_RED,
                  borderColor:
                    PRIMARY_RED,
                  fontWeight: "600",
                }}
              >
                Funeral & Burial
              </ChakraTabs.Trigger>

              <ChakraTabs.Trigger
                value="activity"
                px="16px"
                py="6px"
                fontSize="12px"
                color={SECONDARY_TEXT}
                _selected={{
                  color: PRIMARY_RED,
                  borderColor:
                    PRIMARY_RED,
                  fontWeight: "600",
                }}
              >
                Record Activity
              </ChakraTabs.Trigger>
            </ChakraTabs.List>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <ChakraTabs.Content
              value="overview"
            >
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                gap="10px"
                pb="10px"
              >
                {/* MEMBER INFORMATION */}

                <SectionCard
                  title="Member Information"
                  icon={LuUserRound}
                  minH="130px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Family"
                      value={
                        familyName
                      }
                    />

                    <InfoRow
                      label="Member Name"
                      value={
                        memberName
                      }
                    />

                    <InfoRow
                      label="Member ID"
                      value={
                        memberId ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Death Record ID"
                      value={regNo}
                    />
                  </VStack>
                </SectionCard>

                {/* DEATH INFORMATION */}

                <SectionCard
                  title="Death Information"
                  icon={LuCalendarDays}
                  minH="130px"
                  graphic
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Date of Death"
                      value={formatDate(
                        death?.died_on
                      )}
                    />

                    <InfoRow
                      label="Reason of Death"
                      value={
                        death?.reason_of_death ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Status"
                      value="Recorded"
                      highlight
                    />
                  </VStack>
                </SectionCard>

                {/* FUNERAL & BURIAL */}

                <SectionCard
                  title="Funeral & Burial Information"
                  icon={LuCross}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Date of Funeral"
                      value={formatDate(
                        death?.funeral_on
                      )}
                    />

                    <InfoRow
                      label="Tomb Type"
                      value={
                        death?.tomb_type_name ||
                        tombFee?.tomb_type_name ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Tomb Charge"
                      value={
                        death?.tomb_charge
                          ? `₹ ${death.tomb_charge}`
                          : "N/A"
                      }
                      highlight
                    />

                    <InfoRow
                      label="Tomb IDN"
                      value={
                        death?.tomb_idn ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Remarks"
                      value={
                        death?.remarks ||
                        "N/A"
                      }
                    />
                  </VStack>
                </SectionCard>

                {/* RECORD INFORMATION */}

                <SectionCard
                  title="Record Information"
                  icon={LuFileText}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Created"
                      value={
                        createdDate
                      }
                    />

                    <InfoRow
                      label="Last Updated"
                      value={
                        updatedDate
                      }
                    />

                    <InfoRow
                      label="Updated By"
                      value={
                        updatedBy
                      }
                    />
                  </VStack>
                </SectionCard>
              </SimpleGrid>
            </ChakraTabs.Content>

            {/* =================================================
                FUNERAL & BURIAL
            ================================================= */}

            <ChakraTabs.Content
              value="funeral"
            >
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                gap="10px"
                pb="10px"
              >
                <SectionCard
                  title="Funeral Details"
                  icon={LuCalendarDays}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Date of Funeral"
                      value={formatDate(
                        death?.funeral_on
                      )}
                    />

                    <InfoRow
                      label="Tomb Type"
                      value={
                        death?.tomb_type_name ||
                        tombFee?.tomb_type_name ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Tomb Charge"
                      value={
                        death?.tomb_charge
                          ? `₹ ${death.tomb_charge}`
                          : "N/A"
                      }
                      highlight
                    />
                  </VStack>
                </SectionCard>

                <SectionCard
                  title="Burial Details"
                  icon={LuCross}
                  minH="120px"
                >
                  <VStack
                    align="stretch"
                    gap="3px"
                  >
                    <InfoRow
                      label="Tomb Indication"
                      value={
                        tombFee?.indication ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Specification"
                      value={
                        tombFee?.specification ||
                        "N/A"
                      }
                    />

                    <InfoRow
                      label="Tomb IDN"
                      value={
                        death?.tomb_idn ||
                        "N/A"
                      }
                    />
                  </VStack>
                </SectionCard>
              </SimpleGrid>

              {death?.remarks && (
                <Box
                  mt="4px"
                  border={`1px solid ${BORDER_COLOR}`}
                  borderRadius="8px"
                  bg="#FFFFFF"
                  p="14px"
                >
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                    mb="4px"
                  >
                    Remarks
                  </Text>

                  <Text
                    fontSize="11px"
                    color={SECONDARY_TEXT}
                    lineHeight="1.6"
                  >
                    {death.remarks}
                  </Text>
                </Box>
              )}
            </ChakraTabs.Content>

            {/* =================================================
                RECORD ACTIVITY
            ================================================= */}

            <ChakraTabs.Content
              value="activity"
            >
              <SectionCard
                title="Record Activity"
                icon={LuClock}
                minH="120px"
              >
                <VStack
                  align="stretch"
                  gap="3px"
                >
                  <InfoRow
                    label="Record Created"
                    value={
                      createdDate
                    }
                  />

                  <InfoRow
                    label="Last Updated"
                    value={
                      updatedDate
                    }
                  />

                  <InfoRow
                    label="Updated By"
                    value={
                      updatedBy
                    }
                  />
                </VStack>
              </SectionCard>
            </ChakraTabs.Content>
          </ChakraTabs.Root>
        </Container>
      </Box>

      <Footer />

      {/* ====================================================
          CERTIFICATE PRINT/PDF PREVIEW
      ==================================================== */}

      <DeathRegisterPrintModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        death={death}
      />
    </Box>
  );
};

export default DeathRegisterDetailPage;