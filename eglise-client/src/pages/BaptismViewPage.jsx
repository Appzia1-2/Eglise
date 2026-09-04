// src/pages/BaptismViewPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuBaby,
  LuCalendarDays,
  LuChurch,
  LuFileDown,
  LuInfo,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPrinter,
  LuUser,
  LuUsers,
  LuBuilding2,
  LuFileText,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getBaptism } from "../api/registryServices";

// ============================================================
// COLORS
// ============================================================

const RED = "#B40000";
const RED_DARK = "#970000";

const NAVY = "#14245B";
const NAVY_LIGHT = "#26396C";

const TEXT = "#26345A";
const MUTED = "#68758F";

const BORDER = "var(--border-color)";
const PAGE_BG = "var(--white)";

// ============================================================
// HELPERS
// ============================================================

const displayValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "undefined"
  ) {
    return "—";
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.family_name ||
      value.relationship_name ||
      value.relation_name ||
      value.house_name ||
      value.id ||
      "—"
    );
  }

  return value;
};

const formatDate = (date) => {
  if (!date) return "—";

  try {
    const parts = String(date).split("-");

    if (parts.length === 3) {
      const [year, month, day] = parts;

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      return `${day} ${months[Number(month) - 1] || month} ${year}`;
    }

    return date;
  } catch {
    return date;
  }
};

const formatDateTime = (date) => {
  if (!date) return "—";

  try {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return formatDate(date);
    }

    return value.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return formatDate(date);
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = String(name).split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({
  icon,
  label,
  value,
  width = "150px",
  isRequired = false,
}) => {
  const displayVal = displayValue(value);

  return (
    <Flex
      align="center"
      gap="10px"
      minW="0"
      py="2px"
    >
      {icon && (
        <Box
          color={RED}
          flexShrink="0"
        >
          {icon}
        </Box>
      )}

      <Text
        fontSize="11px"
        color={TEXT}
        minW={width}
        flexShrink="0"
      >
        {label}
        {isRequired && (
          <Text as="span" color={RED}>*</Text>
        )}
      </Text>

      <Text
        fontSize="11px"
        color={NAVY}
        fontWeight="500"
        minW="0"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {displayVal}
      </Text>
    </Flex>
  );
};

// ============================================================
// SECTION CARD
// ============================================================

const SectionCard = ({
  title,
  icon,
  children,
}) => {
  return (
    <Box
      bg="var(--white)"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="7px"
      px={{
        base: "14px",
        md: "18px",
      }}
      py="12px"
      width="100%"
    >
      <Flex
        align="center"
        gap="9px"
        mb="8px"
      >
        <Box color={RED}>
          {icon}
        </Box>

        <Text
          color={NAVY}
          fontSize="16px"
          fontWeight="700"
        >
          {title}
        </Text>
      </Flex>

      {children}
    </Box>
  );
};

// ============================================================
// STATUS BADGE - FIXED
// ============================================================

const StatusBadge = ({ status }) => {
  // Check multiple possible status formats
  const isActive = 
    status === "ACTIVE" || 
    status === "Active" || 
    status === true || 
    status === "true" ||
    status === 1 ||
    status === "1" ||
    status?.toUpperCase?.() === "ACTIVE";

  console.log("StatusBadge received:", status, "isActive:", isActive);

  return (
    <Badge
      display="inline-flex"
      alignItems="center"
      gap="7px"
      px="12px"
      py="6px"
      bg={isActive ? "#E9F8ED" : "#FEE2E2"}
      border="1px solid"
      borderColor={isActive ? "#B9E7C4" : "#FECACA"}
      color={isActive ? "#25813B" : "#DC2626"}
      borderRadius="5px"
      fontSize="11px"
      fontWeight="500"
    >
      <Box
        w="10px"
        h="10px"
        borderRadius="full"
        bg={isActive ? "#16A34A" : "#DC2626"}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

// ============================================================
// PAGE
// ============================================================

const BaptismViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [baptism, setBaptism] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    loadBaptism();
  }, [id]);

  const loadBaptism = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getBaptism(id);
      console.log("Baptism detail response:", response.data);
      setBaptism(response.data);
    } catch (err) {
      console.error("Error loading baptism:", err);
      setError(
        err?.response?.data?.detail ||
        "Unable to load baptism record."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleEdit = () => {
    navigate(`/baptism/${id}/edit`);
  };

  const handlePrint = () => {
    window.print();
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
        bg={PAGE_BG}
      >
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color={RED} />
        </Center>
        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !baptism) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg={PAGE_BG}
      >
        <Navbar />
        <Center flex="1">
          <Box textAlign="center">
            <Text color={RED} fontSize="18px" fontWeight="600" mb="12px">
              {error || "Baptism record not found."}
            </Text>
            <Button
              h="40px"
              px="18px"
              bg="var(--white)"
              color={RED}
              border="1px solid"
              borderColor={RED}
              borderRadius="5px"
              fontSize="11px"
              fontWeight="500"
              onClick={() => navigate("/baptism")}
              _hover={{ bg: "#FFF8F8" }}
            >
              <LuArrowLeft size={17} />
              <Text ml="6px">Back to Baptism Register</Text>
            </Button>
          </Box>
        </Center>
        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // CATEGORY
  // ==========================================================

  const isParish = baptism.baptism_category === "PARISH";
  const categoryLabel = isParish ? "Parish Member" : "Other Parish Member";
  
  // FIXED: Check multiple possible status fields
  const status = 
    baptism.status || 
    baptism.is_active || 
    baptism.active ||
    (baptism.member?.is_active) ||
    (baptism.member?.status) ||
    "ACTIVE"; // Default to ACTIVE if not specified

  console.log("Baptism status:", status);

  // ==========================================================
  // VALUES
  // ==========================================================

  const familyName = baptism.family_name || baptism.family;
  const mainMember = baptism.main_member_name || baptism.main_member;
  const relationship = baptism.relation_with_main_member_name || baptism.relation_with_main_member;
  const houseName = baptism.house_name || baptism.member?.house_name;

  const mobile = baptism.mobile_number || baptism.phone_number || baptism.member?.mobile_number || baptism.member?.phone_number;
  const email = baptism.email || baptism.member?.email;

  const address = baptism.address || baptism.member?.address;
  const permanentAddress = baptism.permanent_address || baptism.address || baptism.member?.permanent_address;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg={PAGE_BG}
    >
      <Navbar />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <Box
        flex="1"
        px={{
          base: "18px",
          sm: "24px",
          md: "30px",
          lg: "42px",
          xl: "48px",
        }}
        pt={{
          base: "18px",
          md: "20px",
        }}
        pb="20px"
      >
        <Box
          maxW="1580px"
          mx="auto"
          width="100%"
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex
            align="center"
            gap="8px"
            mb="10px"
            fontSize="11px"
          >
            <Text
              color="#667085"
              cursor="pointer"
              onClick={() => navigate("/masters")}
            >
              Masters
            </Text>

            <Text color="#A3ADBE">/</Text>

            <Text
              color="#667085"
              cursor="pointer"
              onClick={() => navigate("/baptism")}
            >
              Baptism Register
            </Text>

            <Text color="#A3ADBE">/</Text>

            <Text color="#667085">{categoryLabel}</Text>

            <Text color="#A3ADBE">/</Text>

            <Text color="#667085">Details</Text>
          </Flex>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap="15px"
            mb="12px"
            flexDirection={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Heading
                color={NAVY}
                fontSize={{
                  base: "25px",
                  md: "29px",
                  lg: "31px",
                }}
                lineHeight="1.15"
                fontWeight="700"
              >
                Baptism Details{!isParish && ` – ${categoryLabel}`}
              </Heading>

              <Text
                color="#667085"
                fontSize="11px"
                mt="5px"
              >
                {isParish
                  ? "View baptism record and parish member information."
                  : "View baptism record and member information."}
              </Text>
            </Box>

            <HStack
              gap="10px"
              flexWrap="wrap"
            >
              {/* BACK */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() => navigate("/baptism")}
                _hover={{ bg: "#FFF8F8" }}
              >
                <LuArrowLeft size={17} />
                <Text ml="6px">Back</Text>
              </Button>

              {/* PRINT */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={handlePrint}
                _hover={{ bg: "#FFF8F8" }}
              >
                <LuPrinter size={17} />
                <Text ml="6px">Print</Text>
              </Button>

              {/* PDF */}

              <Button
                h="40px"
                px="18px"
                bg="var(--white)"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={handlePrint}
                _hover={{ bg: "#FFF8F8" }}
              >
                <LuFileDown size={17} />
                <Text ml="6px">Generate PDF</Text>
              </Button>

              {/* EDIT */}

              <Button
                h="40px"
                px="18px"
                bg={RED}
                color="var(--white)"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={handleEdit}
                _hover={{ bg: RED_DARK }}
              >
                <LuPencil size={17} />
                <Text ml="6px">Edit Baptism</Text>
              </Button>
            </HStack>
          </Flex>

          {/* ==================================================
              MAIN TWO COLUMN AREA
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "380px 1fr",
            }}
            gap={{
              base: "14px",
              lg: "26px",
            }}
            alignItems="start"
          >
            {/* =================================================
                LEFT PROFILE CARD
            ================================================= */}

            <Box
              bg="var(--white)"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="8px"
              px="28px"
              py="16px"
            >
              {/* PROFILE */}

              <VStack
  gap="7px"
  align="flex-start"
>
  <Heading
    color={NAVY}
    fontSize="28px"
    lineHeight="1.1"
    fontWeight="700"
    textAlign="left"
  >
    {displayValue(baptism.name)}
  </Heading>

  {/* BAPTISM NAME */}
  <Flex
    align="center"
    justify="flex-start"
    gap="8px"
    color="#62708B"
    fontSize="13px"
    flexWrap="wrap"
    textAlign="left"
  >
    <Text>Baptism Name</Text>
    <Text fontWeight="500" color={NAVY}>
      {displayValue(baptism.baptismal_name)}
    </Text>
  </Flex>

  {/* ACTIVE STATUS */}
  <StatusBadge status={status} />

  
</VStack>

              {/* DIVIDER */}

              <Box
                h="1px"
                bg="#E4E9F1"
                my="14px"
              />

              {/* LEFT INFORMATION */}

              <VStack
                align="stretch"
                gap="13px"
              >
                {!isParish ? (
                  <>
                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color={NAVY}
                      mb="4px"
                    >
                      Other Parish Member
                    </Text>

                    <InfoRow
                      icon={<LuChurch size={22} />}
                      label="Parish"
                      value={baptism.parish_of_baptism}
                      width="92px"
                    />

                    <InfoRow
                      icon={<LuMapPin size={22} />}
                      label="Place"
                      value={baptism.place_of_birth}
                      width="92px"
                    />

                    <InfoRow
                      icon={<LuBuilding2 size={22} />}
                      label="Panchayath"
                      value={baptism.panchayath}
                      width="92px"
                    />

                    {mobile && (
                      <InfoRow
                        icon={<LuPhone size={22} />}
                        label="Mobile"
                        value={mobile}
                        width="92px"
                      />
                    )}

                    {email && (
                      <InfoRow
                        icon={<LuMail size={22} />}
                        label="Email"
                        value={email}
                        width="92px"
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Flex
                      align="center"
                      gap="8px"
                      mb="6px"
                    >
                      <LuUsers size={20} color={RED} />
                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color={NAVY}
                      >
                        Joseph Family
                      </Text>
                    </Flex>

                    <InfoRow
                      icon={<LuUser size={22} />}
                      label="Main Member"
                      value={mainMember}
                      width="92px"
                    />

                    <InfoRow
                      label="Relationship"
                      value={relationship}
                      width="92px"
                    />

                    <InfoRow
                      icon={<LuMapPin size={22} />}
                      label="Ward"
                      value={baptism.ward_name || baptism.ward}
                      width="92px"
                    />

                    {houseName && (
                      <InfoRow
                        icon={<LuUsers size={22} />}
                        label="House"
                        value={houseName}
                        width="92px"
                      />
                    )}

                    {/* VIEW MEMBER LINK */}
                    <Flex
                      align="center"
                      gap="8px"
                      mt="6px"
                      cursor="pointer"
                      color={RED}
                      fontSize="12px"
                      fontWeight="600"
                      _hover={{ opacity: 0.8 }}
                    >
                      <Text>View Member</Text>
                      <LuArrowLeft size={15} style={{ transform: "rotate(180deg)" }} />
                    </Flex>
                  </>
                )}
              </VStack>
            </Box>

            {/* =================================================
                RIGHT CONTENT
            ================================================= */}

            <VStack
              align="stretch"
              gap="8px"
            >
              {/* =================================================
                  BAPTISM & BIRTH INFORMATION
              ================================================= */}

              <SectionCard
                title="Baptism & Birth Information"
                icon={<LuBaby size={21} />}
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{ md: "22px" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        label="Reg No."
                        value={baptism.register_number}
                        width="92px"
                        isRequired
                      />
                      <InfoRow
                        label="Date of Baptism"
                        value={formatDate(baptism.date_of_baptism)}
                        width="92px"
                        isRequired
                      />
                      <InfoRow
                        label="Parish of Baptism"
                        value={baptism.parish_of_baptism}
                        width="92px"
                        isRequired
                      />
                    </VStack>
                  </Box>

                  <Box
                    pl={{ md: "22px" }}
                    mt={{ base: "10px", md: "0" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        label="Name"
                        value={baptism.name}
                        width="92px"
                        isRequired
                      />
                      <InfoRow
                        label="Baptism Name"
                        value={baptism.baptismal_name}
                        width="92px"
                        isRequired
                      />
                      <InfoRow
                        label="Gender"
                        value={baptism.gender}
                        width="92px"
                        isRequired
                      />
                    </VStack>
                  </Box>
                </Grid>

                {/* DIVIDER */}
                <Box
                  h="1px"
                  bg="#E4E9F1"
                  my="10px"
                />

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr",
                  }}
                  gap="0"
                >
                  <Box
                    pr={{ md: "22px" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        label="Date of Birth"
                        value={formatDate(baptism.dob)}
                        width="92px"
                      />
                      
                    </VStack>
                  </Box>

                  <Box
                    pl={{ md: "22px" }}
                    mt={{ base: "10px", md: "0" }}
                  >
                    <InfoRow
                        label="Place of Birth"
                        value={baptism.place_of_birth}
                        width="92px"
                      />
                    {/* Placeholder for layout alignment */}
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  FOR OTHER PARISH MEMBERS - CEREMONY & PARENT
              ================================================= */}

              {!isParish && (
                <SectionCard
                  title="Ceremony & Parent Information"
                  icon={<LuChurch size={21} />}
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap="0"
                  >
                    <Box
                      pr={{ md: "22px" }}
                      borderRight={{ md: "1px solid #E0E6EF" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="Priest Name"
                          value={baptism.priest_name}
                          width="92px"
                        />
                        <InfoRow
                          label="Panchayath"
                          value={baptism.panchayath}
                          width="92px"
                        />
                      </VStack>
                    </Box>

                    <Box
                      pl={{ md: "22px" }}
                      mt={{ base: "10px", md: "0" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="God Father"
                          value={baptism.god_father}
                          width="92px"
                        />
                        <InfoRow
                          label="God Mother"
                          value={baptism.god_mother}
                          width="92px"
                        />
                        <InfoRow
                          label="Father Name"
                          value={baptism.father_name}
                          width="92px"
                          isRequired
                        />
                        <InfoRow
                          label="Mother Name"
                          value={baptism.mother_name}
                          width="92px"
                          isRequired
                        />
                      </VStack>
                    </Box>
                  </Grid>
                </SectionCard>
              )}

              {/* =================================================
                  FOR OTHER PARISH MEMBERS - CONTACT & ADDRESS
              ================================================= */}

              {!isParish && (
                <SectionCard
                  title="Contact & Address Information"
                  icon={<LuUsers size={21} />}
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap="0"
                  >
                    <Box
                      pr={{ md: "22px" }}
                      borderRight={{ md: "1px solid #E0E6EF" }}
                    >
                      <VStack align="stretch" gap="7px">
                        {email && (
                          <InfoRow
                            label="Email"
                            value={email}
                            width="92px"
                          />
                        )}
                        {mobile && (
                          <InfoRow
                            label="Mobile Number"
                            value={mobile}
                            width="92px"
                          />
                        )}
                        <InfoRow
                          label="Present Address"
                          value={address}
                          width="92px"
                        />
                      </VStack>
                    </Box>

                    <Box
                      pl={{ md: "22px" }}
                      mt={{ base: "10px", md: "0" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="Permanent Address"
                          value={permanentAddress}
                          width="92px"
                        />
                        <InfoRow
                          label="Remarks"
                          value={baptism.remarks}
                          width="92px"
                        />
                      </VStack>
                    </Box>
                  </Grid>
                </SectionCard>
              )}

              {/* =================================================
                  FOR PARISH MEMBERS - CEREMONY INFORMATION
              ================================================= */}

              {isParish && (
                <SectionCard
                  title="Ceremony Information"
                  icon={<LuChurch size={21} />}
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap="0"
                  >
                    <Box
                      pr={{ md: "22px" }}
                      borderRight={{ md: "1px solid #E0E6EF" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="Priest Name"
                          value={baptism.priest_name}
                          width="92px"
                        />
                        <InfoRow
                          label="Panchayath"
                          value={baptism.panchayath}
                          width="92px"
                        />
                      </VStack>
                    </Box>

                    <Box
                      pl={{ md: "22px" }}
                      mt={{ base: "10px", md: "0" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="God Father"
                          value={baptism.god_father}
                          width="92px"
                        />
                        <InfoRow
                          label="God Mother"
                          value={baptism.god_mother}
                          width="92px"
                        />
                      </VStack>
                    </Box>
                  </Grid>
                </SectionCard>
              )}

              {/* =================================================
                  FOR PARISH MEMBERS - FAMILY INFORMATION
              ================================================= */}

              {isParish && (
                <SectionCard
                  title="Family Information"
                  icon={<LuUsers size={21} />}
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap="0"
                  >
                    <Box
                      pr={{ md: "22px" }}
                      borderRight={{ md: "1px solid #E0E6EF" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="Family Name"
                          value={familyName}
                          width="92px"
                          isRequired
                        />
                        <InfoRow
                          label="Main Member (Head)"
                          value={mainMember}
                          width="92px"
                          isRequired
                        />
                      </VStack>
                    </Box>

                    <Box
                      pl={{ md: "22px" }}
                      mt={{ base: "10px", md: "0" }}
                    >
                      <VStack align="stretch" gap="7px">
                        <InfoRow
                          label="Relationship"
                          value={relationship}
                          width="92px"
                          isRequired
                        />
                        <InfoRow
                          label="Father Name"
                          value={baptism.father_name}
                          width="92px"
                          isRequired
                        />
                        <InfoRow
                          label="Mother Name"
                          value={baptism.mother_name}
                          width="92px"
                          isRequired
                        />
                      </VStack>
                    </Box>
                  </Grid>
                </SectionCard>
              )}

              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <Box
                bg="var(--white)"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="14px"
                py="9px"
              >
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr 1fr",
                  }}
                  alignItems="center"
                  gap="10px"
                >
                  {/* TITLE */}

                  <Flex
                    align="center"
                    gap="10px"
                  >
                    <Box color="#175CD3">
                      <LuInfo size={22} />
                    </Box>

                    <Text
                      fontSize="12px"
                      fontWeight="700"
                      color={NAVY}
                    >
                      Record Information
                    </Text>
                  </Flex>

                  {/* CREATED */}

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuCalendarDays size={20} />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Created on
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        {baptism.created_at
                          ? formatDateTime(baptism.created_at)
                          : "—"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* RECORD ID */}

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{
                      md: "1px solid #DDE4EE",
                    }}
                    pl={{
                      md: "24px",
                    }}
                  >
                    <Box color={NAVY}>
                      <LuFileText size={20} />
                    </Box>

                    <Box>
                      <Text
                        fontSize="9px"
                        color={MUTED}
                      >
                        Record ID
                      </Text>

                      <Text
                        fontSize="10px"
                        color={NAVY}
                        fontWeight="500"
                      >
                        #{id}
                      </Text>
                    </Box>
                  </Flex>
                </Grid>

                {/* LAST UPDATED */}

                <Box
                  h="1px"
                  bg="#E4E9F1"
                  my="10px"
                />

                <Flex
                  justify="flex-end"
                  gap="16px"
                  fontSize="10px"
                  color={MUTED}
                  flexWrap="wrap"
                >
                  <Text>
                    Last updated:{" "}
                    <Text as="span" fontWeight="500" color={NAVY}>
                      {baptism.updated_at
                        ? formatDateTime(baptism.updated_at)
                        : formatDateTime(baptism.created_at)}
                    </Text>
                  </Text>

                  <Text>
                    Version:{" "}
                    <Text as="span" fontWeight="500" color={NAVY}>
                      1.0.0
                    </Text>
                  </Text>
                </Flex>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default BaptismViewPage;