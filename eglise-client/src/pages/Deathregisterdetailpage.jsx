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
  useDisclosure,
} from "@chakra-ui/react";

import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/tabs";

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

const BLUE = "#315AB5";

const LIGHT_BG = "#F8FAFC";

// ==========================================================
// ICONS
// ==========================================================

const BackIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const PdfIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h2a1.5 1.5 0 0 1 0 3H8v-3Z" />
    <path d="M13 16v-3h1.5a1.5 1.5 0 0 1 0 3H13Z" />
    <path d="M18 13h-2v3" />
    <path d="M16 15h2" />
  </svg>
);

const PrintIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const UserIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4.5 21c.7-4 3.2-6 7.5-6s6.8 2 7.5 6" />
  </svg>
);

const UsersIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.5 2.7-5.5 6.5-5.5s5.9 2 6.5 5.5" />

    <circle cx="17" cy="7" r="3" />
    <path d="M16 14.5c3.1.1 5 2 5.5 5.5" />
  </svg>
);

const CalendarIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M16 2v5" />
    <path d="M8 2v5" />
    <path d="M3 9h18" />
  </svg>
);

const FileIcon = ({ size = 23 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
);

const TombIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 21h14" />
    <path d="M7 21V8l5-4 5 4v13" />
    <path d="M10 21v-7h4v7" />
    <path d="M12 7v4" />
    <path d="M10 9h4" />
  </svg>
);

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const DeathRegisterDetailPage = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [death, setDeath] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ========================================================
  // LOAD DEATH RECORD
  // ========================================================

  useEffect(() => {
    const loadDeath = async () => {
      if (!id) {
        setError("Death record ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("Loading death record ID:", id);

        const response = await getDeath(id);

        console.log(
          "Death record response:",
          response?.data
        );

        setDeath(response?.data || null);
      } catch (err) {
        console.error(
          "Error loading death record:",
          err
        );

        console.error(
          "Status:",
          err?.response?.status
        );

        console.error(
          "Backend response:",
          err?.response?.data
        );

        const backendError =
          err?.response?.data;

        if (
          typeof backendError === "string"
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
    navigate("/death");
  };

  const handleEdit = () => {
    navigate(`/death/${id}/edit`);
  };

  const handlePrint = () => {
    onOpen();
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

  const formatDateTime = (dateValue) => {
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
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Container
          maxW="1600px"
          flex="1"
          py={12}
        >
          <Flex
            minH="400px"
            justify="center"
            align="center"
            direction="column"
          >
            <Spinner
              size="lg"
              thickness="3px"
              speed="0.65s"
              color={PRIMARY_RED}
            />

            <Text
              mt={4}
              fontSize="13px"
              color={SECONDARY_TEXT}
            >
              Loading death record...
            </Text>
          </Flex>
        </Container>

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
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Container
          maxW="1600px"
          flex="1"
          py={10}
        >
          <Box
            p={5}
            border="1px solid #FED7D7"
            bg="#FFF5F5"
            borderRadius="8px"
          >
            <Text
              fontSize="13px"
              color="red.600"
            >
              {error ||
                "Death record not found."}
            </Text>
          </Box>

          <Button
            mt={5}
            h="38px"
            px={5}
            fontSize="12px"
            variant="outline"
            borderColor={PRIMARY_RED}
            color={PRIMARY_RED}
            onClick={handleBack}
          >
            <BackIcon />

            <Box ml={2}>
              Back to Death Register
            </Box>
          </Button>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ========================================================
  // DATA
  // ========================================================

  const member =
    death?.member || {};

  const family =
    member?.family || {};

  const tombFee =
    death?.tomb_fee_details || {};

  const memberName =
    member?.name || "N/A";

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

  const familyName =
    family?.family_name ||
    family?.name ||
    "N/A";

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
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <Navbar />

      {/* ====================================================
          MAIN
      ==================================================== */}

      <Container
        maxW="1600px"
        px={{
          base: 4,
          md: 5,
          lg: 6,
        }}
        py={{
          base: 4,
          md: 4,
          lg: 5,
        }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          spacing={2}
          mb={4}
          fontSize="11px"
        >
          <Text color={BLUE}>
            Activities
          </Text>

          <Text color="#A5AFBD">
            /
          </Text>

          <Text color={BLUE}>
            Death Register
          </Text>

          <Text color="#A5AFBD">
            /
          </Text>

          <Text color={BLUE}>
            {death?.reg_no ||
              "Death Record"}
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Flex
          justify="space-between"
          align="flex-end"
          mb={4}
          gap={4}
          flexWrap="wrap"
        >
          <Box>
            <Text
              color={PRIMARY_RED}
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.2px"
              mb={1}
            >
              DEATH RECORD
            </Text>

            <Heading
              color={TEXT_COLOR}
              fontSize={{
                base: "24px",
                md: "27px",
              }}
              fontWeight="600"
              lineHeight="1.2"
            >
              Death Record Details
            </Heading>

            <Text
              color={SECONDARY_TEXT}
              fontSize="12px"
              mt={1}
            >
              View complete death, funeral and burial information.
            </Text>
          </Box>

          {/* ACTIONS */}

          <HStack
            spacing={2}
            flexWrap="wrap"
          >
            <Button
              h="40px"
              px={4}
              variant="outline"
              borderColor={PRIMARY_RED}
              color={TEXT_COLOR}
              fontSize="12px"
              fontWeight="500"
              onClick={handleBack}
              _hover={{
                bg: "#FFF5F7",
              }}
            >
              <BackIcon />

              <Box ml={2}>
                Back to Death Register
              </Box>
            </Button>

            <Button
              h="40px"
              px={4}
              variant="outline"
              borderColor={PRIMARY_RED}
              color={TEXT_COLOR}
              fontSize="12px"
              fontWeight="500"
              onClick={handlePrint}
              _hover={{
                bg: "#FFF5F7",
              }}
            >
              <PdfIcon />

              <Box ml={2}>
                Generate PDF
              </Box>
            </Button>

            <Button
              h="40px"
              px={4}
              variant="outline"
              borderColor={PRIMARY_RED}
              color={TEXT_COLOR}
              fontSize="12px"
              fontWeight="500"
              onClick={() =>
                window.print()
              }
              _hover={{
                bg: "#FFF5F7",
              }}
            >
              <PrintIcon />

              <Box ml={2}>
                Print
              </Box>
            </Button>

            <Button
              h="40px"
              px={5}
              bg={PRIMARY_RED}
              color="white"
              fontSize="12px"
              fontWeight="600"
              onClick={handleEdit}
              _hover={{
                bg: DARK_RED,
              }}
            >
              Edit Record
            </Button>
          </HStack>
        </Flex>

        {/* ==================================================
            MEMBER SUMMARY
        ================================================== */}

        <Box
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="9px"
          bg="white"
          mb={4}
          overflow="hidden"
        >
          <Flex
            minH="116px"
            align="center"
            px={{
              base: 4,
              md: 5,
            }}
            py={4}
            gap={4}
            flexWrap={{
              base: "wrap",
              lg: "nowrap",
            }}
          >
            {/* AVATAR */}

            <Box
              w="72px"
              h="72px"
              minW="72px"
              borderRadius="50%"
              bg="#FFE5E9"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                color={PRIMARY_RED}
                fontSize="22px"
                fontWeight="600"
              >
                {memberInitials ||
                  "DR"}
              </Text>
            </Box>

            {/* MEMBER INFORMATION */}

            <Box
              flex="1"
              minW="250px"
            >
              <Text
                color={TEXT_COLOR}
                fontSize="20px"
                fontWeight="600"
                mb={1}
              >
                {memberName
                  .toLowerCase()
                  .startsWith("mr.")
                  ? memberName
                  : `Mr. ${memberName}`}
              </Text>

              <HStack
                spacing={3}
                flexWrap="wrap"
              >
                <HStack spacing={1.5}>
                  <Box color={BLUE}>
                    <FileIcon
                      size={15}
                    />
                  </Box>

                  <Text
                    fontSize="11px"
                    color={SECONDARY_TEXT}
                  >
                    {death?.reg_no ||
                      "N/A"}
                  </Text>
                </HStack>

                <Text
                  color="#9AA4B3"
                  fontSize="12px"
                >
                  •
                </Text>

                <HStack spacing={1.5}>
                  <Box color={BLUE}>
                    <UserIcon
                      size={16}
                    />
                  </Box>

                  <Text
                    fontSize="11px"
                    color={SECONDARY_TEXT}
                  >
                    {member?.member_no ||
                      "N/A"}
                  </Text>
                </HStack>

                <Box
                  bg="#EDF0F4"
                  px={2}
                  py={1}
                  borderRadius="5px"
                >
                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                  >
                    Recorded
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* FAMILY */}

            <SummaryItem
              icon={<UsersIcon />}
              value={familyName}
              label="Family"
            />

            {/* DEATH DATE */}

            <SummaryItem
              icon={<CalendarIcon />}
              value={formatDate(
                death?.died_on
              )}
              label="Date of Death"
            />

            {/* FUNERAL DATE */}

            <SummaryItem
              icon={<CalendarIcon />}
              value={formatDate(
                death?.funeral_on
              )}
              label="Date of Funeral"
              borderRight={false}
            />
          </Flex>
        </Box>

        {/* ==================================================
            TABS
        ================================================== */}

        <Tabs
          variant="unstyled"
          defaultIndex={0}
        >
          <TabList
            borderBottom={`1px solid ${BORDER_COLOR}`}
            mb={4}
          >
            <Tab
              px={1}
              mr={5}
              pb={3}
              fontSize="12px"
              fontWeight="500"
              color={SECONDARY_TEXT}
              borderBottom="2px solid transparent"
              _selected={{
                color: PRIMARY_RED,
                borderBottomColor:
                  PRIMARY_RED,
              }}
            >
              Overview
            </Tab>

            <Tab
              px={1}
              mr={5}
              pb={3}
              fontSize="12px"
              fontWeight="500"
              color={SECONDARY_TEXT}
              borderBottom="2px solid transparent"
              _selected={{
                color: PRIMARY_RED,
                borderBottomColor:
                  PRIMARY_RED,
              }}
            >
              Funeral &amp; Burial
            </Tab>

            <Tab
              px={1}
              pb={3}
              fontSize="12px"
              fontWeight="500"
              color={SECONDARY_TEXT}
              borderBottom="2px solid transparent"
              _selected={{
                color: PRIMARY_RED,
                borderBottomColor:
                  PRIMARY_RED,
              }}
            >
              Record Activity
            </Tab>
          </TabList>

          <TabPanels>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <TabPanel p={0}>
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                spacing={4}
              >
                {/* MEMBER INFORMATION */}

                <InformationCard
                  icon={
                    <UserIcon
                      size={23}
                    />
                  }
                  title="Member Information"
                >
                  <InfoRow
                    label="Family"
                    value={familyName}
                  />

                  <InfoRow
                    label="Member Name"
                    value={member?.name}
                  />

                  <InfoRow
                    label="Member ID"
                    value={
                      member?.member_no
                    }
                  />

                  <InfoRow
                    label="Death Record ID"
                    value={
                      death?.reg_no
                    }
                  />
                </InformationCard>

                {/* DEATH INFORMATION */}

                <InformationCard
                  icon={
                    <CalendarIcon
                      size={24}
                    />
                  }
                  title="Death Information"
                  graphic
                >
                  <Box
                    width={{
                      base: "100%",
                      md: "60%",
                    }}
                    position="relative"
                    zIndex={2}
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
                        death?.reason_of_death
                      }
                    />

                    <Flex
                      align="center"
                      mt={2}
                      gap={4}
                    >
                      <Text
                        width={{
                          base: "135px",
                          md: "165px",
                        }}
                        flexShrink={0}
                        fontSize="11px"
                        color={
                          SECONDARY_TEXT
                        }
                      >
                        Status
                      </Text>

                      <Box
                        bg="#EEF1F4"
                        px={3}
                        py={1.5}
                        borderRadius="5px"
                      >
                        <Text
                          fontSize="10px"
                          fontWeight="600"
                          color={
                            TEXT_COLOR
                          }
                        >
                          Recorded
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </InformationCard>

                {/* FUNERAL & BURIAL */}

                <InformationCard
                  icon={
                    <TombIcon
                      size={23}
                    />
                  }
                  title="Funeral & Burial Information"
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
                      tombFee?.tomb_type_name
                    }
                  />

                  <InfoRow
                    label="Tomb Charge"
                    value={
                      tombFee?.tomb_fees
                        ? `₹ ${tombFee.tomb_fees}`
                        : "N/A"
                    }
                    highlight
                  />

                  <InfoRow
                    label="Remarks"
                    value={
                      death?.remarks
                    }
                  />
                </InformationCard>

                {/* RECORD INFORMATION */}

                <InformationCard
                  icon={
                    <FileIcon
                      size={22}
                    />
                  }
                  title="Record Information"
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
                </InformationCard>
              </SimpleGrid>
            </TabPanel>

            {/* =================================================
                FUNERAL & BURIAL TAB
            ================================================= */}

            <TabPanel p={0}>
              <SimpleGrid
                columns={{
                  base: 1,
                  lg: 2,
                }}
                spacing={4}
              >
                <InformationCard
                  icon={
                    <CalendarIcon
                      size={24}
                    />
                  }
                  title="Funeral Details"
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
                      tombFee?.tomb_type_name
                    }
                  />

                  <InfoRow
                    label="Tomb Charge"
                    value={
                      tombFee?.tomb_fees
                        ? `₹ ${tombFee.tomb_fees}`
                        : "N/A"
                    }
                    highlight
                  />
                </InformationCard>

                <InformationCard
                  icon={
                    <TombIcon
                      size={23}
                    />
                  }
                  title="Burial Details"
                >
                  <InfoRow
                    label="Tomb Indication"
                    value={
                      tombFee?.indication
                    }
                  />

                  <InfoRow
                    label="Specification"
                    value={
                      tombFee?.specification
                    }
                  />

                  <InfoRow
                    label="Tomb IDN"
                    value={
                      death?.tomb_idn
                    }
                  />
                </InformationCard>
              </SimpleGrid>

              {death?.remarks && (
                <Box
                  mt={4}
                  p={5}
                  border={`1px solid ${BORDER_COLOR}`}
                  borderRadius="8px"
                  bg="white"
                >
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={TEXT_COLOR}
                    mb={2}
                  >
                    Remarks
                  </Text>

                  <Text
                    fontSize="12px"
                    color={SECONDARY_TEXT}
                    lineHeight="1.6"
                  >
                    {death.remarks}
                  </Text>
                </Box>
              )}
            </TabPanel>

            {/* =================================================
                RECORD ACTIVITY
            ================================================= */}

            <TabPanel p={0}>
              <VStack
                align="stretch"
                spacing={4}
              >
                <ActivityCard
                  title="Record Created"
                  date={createdDate}
                  description="Death record was registered in the system."
                />

                <ActivityCard
                  title="Last Updated"
                  date={updatedDate}
                  description={`Record was last modified by ${updatedBy}.`}
                />
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

      </Container>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <Footer />

      {/* ====================================================
          PDF MODAL
      ==================================================== */}

      <DeathRegisterPrintModal
        isOpen={isOpen}
        onClose={onClose}
        death={death}
      />
    </Box>
  );
};

// ==========================================================
// SUMMARY ITEM
// ==========================================================

const SummaryItem = ({
  icon,
  value,
  label,
  borderRight = true,
}) => {
  return (
    <Flex
      minW={{
        base: "180px",
        lg: "205px",
      }}
      h="78px"
      align="center"
      justify="center"
      borderLeft={`1px solid ${BORDER_COLOR}`}
      borderRight={
        borderRight
          ? `1px solid ${BORDER_COLOR}`
          : "none"
      }
      px={5}
      flexShrink={0}
    >
      <VStack spacing={1}>
        <Box color={PRIMARY_RED}>
          {icon}
        </Box>

        <Text
          fontSize="12px"
          fontWeight="600"
          color={TEXT_COLOR}
          textAlign="center"
          whiteSpace="nowrap"
        >
          {value || "N/A"}
        </Text>

        <Text
          fontSize="10px"
          color={SECONDARY_TEXT}
        >
          {label}
        </Text>
      </VStack>
    </Flex>
  );
};

// ==========================================================
// INFORMATION CARD
// ==========================================================

const InformationCard = ({
  icon,
  title,
  children,
  graphic = false,
}) => {
  return (
    <Box
      position="relative"
      minH="198px"
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="8px"
      bg="white"
      px={4}
      py={4}
      overflow="hidden"
    >
      {/* TITLE */}

      <HStack
        spacing={3}
        mb={3}
      >
        <Box
          w="34px"
          h="34px"
          borderRadius="50%"
          bg="#FFF0F3"
          color={PRIMARY_RED}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {icon}
        </Box>

        <Heading
          fontSize="14px"
          fontWeight="600"
          color={TEXT_COLOR}
        >
          {title}
        </Heading>
      </HStack>

      {/* CONTENT */}

      <Box
        position="relative"
        zIndex={2}
      >
        {children}
      </Box>

      {/* CHURCH IMAGE */}

      {graphic && (
        <ChurchGraphic />
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
      align="flex-start"
      gap={4}
      mb={1.5}
      width="100%"
    >
      <Text
        width={{
          base: "135px",
          md: "165px",
        }}
        flexShrink={0}
        fontSize="11px"
        color={SECONDARY_TEXT}
        lineHeight="1.6"
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
          highlight
            ? "600"
            : "400"
        }
        lineHeight="1.6"
        whiteSpace="pre-wrap"
      >
        {value || "N/A"}
      </Text>
    </Flex>
  );
};

// ==========================================================
// CHURCH GRAPHIC IMAGE
// ==========================================================

const ChurchGraphic = () => {
  return (
    <Box
      position="absolute"
      right="8px"
      bottom="0px"
      width={{
        base: "150px",
        md: "210px",
        lg: "245px",
      }}
      height={{
        base: "120px",
        md: "155px",
        lg: "175px",
      }}
      display="flex"
      alignItems="flex-end"
      justifyContent="flex-end"
      zIndex={1}
      pointerEvents="none"
    >
      <Box
        as="img"
        src={logoImage}
        alt="Church illustration"
        width="100%"
        height="100%"
        objectFit="contain"
        objectPosition="right bottom"
      />
    </Box>
  );
};

// ==========================================================
// ACTIVITY CARD
// ==========================================================

const ActivityCard = ({
  title,
  date,
  description,
}) => {
  return (
    <Box
      p={5}
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="8px"
      bg="white"
    >
      <Flex
        justify="space-between"
        align="center"
        mb={2}
        gap={4}
        flexWrap="wrap"
      >
        <Text
          fontSize="13px"
          fontWeight="600"
          color={TEXT_COLOR}
        >
          {title}
        </Text>

        <Text
          fontSize="11px"
          color={SECONDARY_TEXT}
        >
          {date}
        </Text>
      </Flex>

      <Text
        fontSize="12px"
        color={SECONDARY_TEXT}
      >
        {description}
      </Text>
    </Box>
  );
};

export default DeathRegisterDetailPage;