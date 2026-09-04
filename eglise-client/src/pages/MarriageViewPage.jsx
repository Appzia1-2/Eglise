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
  LuCalendarDays,
  LuFileDown,
  LuInfo,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPrinter,
  LuUser,
  LuUsers,
  LuHeart,
  LuChurch,
  LuMail,
  LuUserRound,
  LuUserPlus,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMarriage } from "../api/registryServices";

/* ============================================================
   COLORS
============================================================ */

const RED = "#B40000";
const RED_DARK = "#970000";
const NAVY = "#14245B";
const NAVY_LIGHT = "#26396C";
const TEXT = "#26345A";
const MUTED = "#68758F";
const BORDER = "#DCE4EF";
const PAGE_BG = "#FFFFFF";

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "M";
  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getGroomName = (marriage) => {
  return marriage?.groom_member?.name || marriage?.groom_name || "—";
};

const getBrideName = (marriage) => {
  return marriage?.bride_member?.name || marriage?.bride_name || "—";
};

const getMarriageTypeLabel = (marriage) => {
  if (marriage?.marriage_type === "TRANSFER_BRIDE") return "Transfer";
  return "Sacramental";
};

const getBrideTypeLabel = (marriage) => {
  if (marriage?.marriage_type === "TRANSFER_BRIDE") return "Transfer Bride";
  if (marriage?.bride_member) return "Same Parish Bride";
  return "Other Parish Bride";
};

/* ============================================================
   INFO ROW
============================================================ */

const InfoRow = ({ icon, label, value, width = "140px", mb = 0 }) => {
  if (!value && value !== 0) return null;

  return (
    <Flex align="center" gap="10px" minW="0" mb={mb}>
      {icon && (
        <Box color={NAVY} flexShrink="0" fontSize="18px">
          {icon}
        </Box>
      )}
      <Text fontSize="11px" color={MUTED} minW={width} flexShrink="0">
        {label}
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
        {value || "—"}
      </Text>
    </Flex>
  );
};

/* ============================================================
   SECTION CARD
============================================================ */

const SectionCard = ({ title, icon, children }) => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="7px"
      px={{ base: "14px", md: "18px" }}
      py="12px"
      width="100%"
    >
      <Flex align="center" gap="9px" mb="8px">
        <Box color={RED}>{icon}</Box>
        <Text color={NAVY} fontSize="16px" fontWeight="700">
          {title}
        </Text>
      </Flex>
      {children}
    </Box>
  );
};

/* ============================================================
   MARRIAGE VIEW PAGE
============================================================ */

const MarriageViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [marriage, setMarriage] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getMarriage(id);
      setMarriage(response.data);
    } catch (error) {
      console.error("Error fetching marriage:", error);
      window.alert("Failed to load marriage details.");
      navigate("/marriage");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color={RED} />
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!marriage) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Navbar />
        <Center flex="1">
          <Text color={TEXT}>Marriage record not found.</Text>
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     DATA
  ========================================================== */

  const groomName = getGroomName(marriage);
  const brideName = getBrideName(marriage);
  const marriageType = getMarriageTypeLabel(marriage);
  const brideType = getBrideTypeLabel(marriage);
  const isTransfer = marriage?.marriage_type === "TRANSFER_BRIDE";

  const familyName =
    marriage?.family?.family_name ||
    marriage?.family_name ||
    marriage?.groom_member?.family?.family_name ||
    marriage?.bride_member?.family?.family_name ||
    "—";

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={PAGE_BG}>
      <Navbar />

      <Box
        flex="1"
        px={{ base: "18px", sm: "24px", md: "30px", lg: "42px", xl: "48px" }}
        pt={{ base: "18px", md: "20px" }}
        pb="20px"
      >
        <Box maxW="1580px" mx="auto" width="100%">
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex align="center" gap="8px" mb="10px" fontSize="11px">
            <Text
              color="#667085"
              cursor="pointer"
              onClick={() => navigate("/marriage")}
            >
              Masters
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text
              color="#667085"
              cursor="pointer"
              onClick={() => navigate("/marriage")}
            >
              Marriage Register
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085">Marriage Details</Text>
          </Flex>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap="15px"
            mb="12px"
            flexDirection={{ base: "column", md: "row" }}
          >
            <Box>
              <Heading
                color={NAVY}
                fontSize={{ base: "25px", md: "29px", lg: "31px" }}
                lineHeight="1.15"
                fontWeight="700"
              >
                Marriage Details
              </Heading>
              <Text color="#667085" fontSize="11px" mt="5px">
                View marriage details, groom and bride information, and
                ceremony details.
              </Text>
            </Box>

            <HStack gap="10px" flexWrap="wrap">
              <Button
                h="40px"
                px="18px"
                bg="white"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() => navigate("/marriage")}
                _hover={{ bg: "#FFF8F8" }}
              >
                <LuArrowLeft size={17} />
                <Text ml="6px">Back</Text>
              </Button>

              <Button
                h="40px"
                px="18px"
                bg="white"
                color={RED}
                border="1px solid"
                borderColor={RED}
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() => window.print()}
                _hover={{ bg: "#FFF8F8" }}
              >
                <LuFileDown size={17} />
                <Text ml="6px">Print</Text>
              </Button>

              <Button
                h="40px"
                px="18px"
                bg={RED}
                color="white"
                borderRadius="5px"
                fontSize="11px"
                fontWeight="500"
                onClick={() => navigate(`/marriage/${id}/edit`)}
                _hover={{ bg: RED_DARK }}
              >
                <LuPencil size={17} />
                <Text ml="6px">Edit Marriage</Text>
              </Button>
            </HStack>
          </Flex>

          {/* ==================================================
              MAIN TWO COLUMN AREA
          ================================================== */}

          <Grid
            templateColumns={{ base: "1fr", lg: "380px 1fr" }}
            gap={{ base: "14px", lg: "26px" }}
            alignItems="start"
          >
            {/* =================================================
                LEFT PROFILE CARD
            ================================================= */}

            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="8px"
              px="24px"
              py="16px"
            >
              <VStack gap="7px" align="center">
                <Avatar.Root size="2xl">
                  <Avatar.Fallback bg="#FFE8EB" color={RED} fontSize="28px" fontWeight="700">
                    <LuHeart size={40} />
                  </Avatar.Fallback>
                </Avatar.Root>

                <Heading
                  color={NAVY}
                  fontSize="22px"
                  lineHeight="1.1"
                  fontWeight="700"
                  textAlign="center"
                >
                  {groomName} & {brideName}
                </Heading>

                <Flex align="center" justify="center" gap="8px" color="#62708B" fontSize="13px" flexWrap="wrap" textAlign="center">
                  <Text>{marriageType}</Text>
                  <Text>•</Text>
                  <Text>{formatDate(marriage?.date)}</Text>
                </Flex>

                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap="7px"
                  px="12px"
                  py="6px"
                  bg="#E9F8ED"
                  border="1px solid"
                  borderColor="#B9E7C4"
                  color="#25813B"
                  borderRadius="5px"
                  fontSize="11px"
                  fontWeight="500"
                  mt="2px"
                >
                  <Box w="10px" h="10px" borderRadius="full" bg="#16A34A" />
                  Active
                </Badge>
              </VStack>

              <Box h="1px" bg="#E4E9F1" my="14px" />

              <VStack align="stretch" gap="13px">
                <InfoRow
                  icon={<LuHeart size={22} />}
                  label="Bride Type"
                  value={brideType}
                  width="92px"
                />

                <InfoRow
                  icon={<LuChurch size={22} />}
                  label="Register No."
                  value={marriage?.register_number || "—"}
                  width="92px"
                />

                <InfoRow
                  icon={<LuUsers size={22} />}
                  label="Family"
                  value={familyName}
                  width="92px"
                />

                {isTransfer && (
                  <InfoRow
                    icon={<LuMapPin size={22} />}
                    label="Transfer To"
                    value={marriage?.transfer_to || "—"}
                    width="92px"
                  />
                )}
              </VStack>
            </Box>

            {/* =================================================
                RIGHT CONTENT
            ================================================= */}

            <VStack align="stretch" gap="8px">
              {/* =================================================
                  GROOM & BRIDE
              ================================================= */}

              <SectionCard title="Groom & Bride" icon={<LuUsers size={21} />}>
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap="0"
                >
                  {/* Groom */}
                  <Box
                    pr={{ md: "22px" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                  >
                    <Text fontSize="12px" fontWeight="700" color={NAVY} mb="8px">
                      <LuUser style={{ display: "inline", marginRight: "6px" }} />
                      Groom
                    </Text>
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        label="Name"
                        value={groomName}
                        width="100px"
                      />
                      <InfoRow
                        label="Father"
                        value={marriage?.groom_father || marriage?.groom_member?.father_name || "—"}
                        width="100px"
                      />
                      <InfoRow
                        label="Mother"
                        value={marriage?.groom_mother || marriage?.groom_member?.mother_name || "—"}
                        width="100px"
                      />
                      <InfoRow
                        label="Nationality"
                        value={marriage?.groom_nationality || "—"}
                        width="100px"
                      />
                      {isTransfer && (
                        <InfoRow
                          label="Confession Date"
                          value={marriage?.groom_confession_date ? formatDate(marriage.groom_confession_date) : "—"}
                          width="100px"
                        />
                      )}
                      {isTransfer && (
                        <InfoRow
                          label="Phone"
                          value={marriage?.groom_phone || "—"}
                          width="100px"
                        />
                      )}
                    </VStack>
                  </Box>

                  {/* Bride */}
                  <Box
                    pl={{ md: "22px" }}
                    mt={{ base: "10px", md: "0" }}
                    pt={{ base: "10px", md: "0" }}
                    borderTop={{ base: "1px solid #E0E6EF", md: "none" }}
                  >
                    <Text fontSize="12px" fontWeight="700" color={NAVY} mb="8px">
                      <LuUser style={{ display: "inline", marginRight: "6px" }} />
                      Bride
                    </Text>
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        label="Name"
                        value={brideName}
                        width="100px"
                      />
                      <InfoRow
                        label="Father"
                        value={marriage?.bride_father || marriage?.bride_member?.father_name || "—"}
                        width="100px"
                      />
                      <InfoRow
                        label="Mother"
                        value={marriage?.bride_mother || marriage?.bride_member?.mother_name || "—"}
                        width="100px"
                      />
                      <InfoRow
                        label="Nationality"
                        value={marriage?.bride_nationality || "—"}
                        width="100px"
                      />
                      {isTransfer && (
                        <InfoRow
                          label="Confession Date"
                          value={marriage?.bride_confession_date ? formatDate(marriage.bride_confession_date) : "—"}
                          width="100px"
                        />
                      )}
                      {isTransfer && (
                        <InfoRow
                          label="Phone"
                          value={marriage?.bride_phone || "—"}
                          width="100px"
                        />
                      )}
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  MARRIAGE DETAILS
              ================================================= */}

              <SectionCard
                title="Marriage Details"
                icon={<LuCalendarDays size={21} />}
              >
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap="0"
                >
                  <Box
                    pr={{ md: "18px" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        icon={<LuCalendarDays size={18} />}
                        label="Marriage Date"
                        value={formatDate(marriage?.date)}
                        width="100px"
                      />
                      <InfoRow
                        icon={<LuHeart size={18} />}
                        label="Marriage Type"
                        value={marriageType}
                        width="100px"
                      />
                    </VStack>
                  </Box>

                  <Box
                    px={{ md: "18px" }}
                    py={{ base: "10px", md: "0" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                    borderTop={{ base: "1px solid #E0E6EF", md: "none" }}
                    borderBottom={{ base: "1px solid #E0E6EF", md: "none" }}
                    my={{ base: "9px", md: "0" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        icon={<LuUserPlus size={18} />}
                        label="Bride Type"
                        value={brideType}
                        width="100px"
                      />
                      <InfoRow
                        icon={<LuUsers size={18} />}
                        label="Family"
                        value={familyName}
                        width="100px"
                      />
                    </VStack>
                  </Box>

                  <Box pl={{ md: "18px" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        icon={<LuUser size={18} />}
                        label="Minister"
                        value={marriage?.minister_of_marriage || "—"}
                        width="100px"
                      />
                      <InfoRow
                        icon={<LuUserPlus size={18} />}
                        label="Other Priests"
                        value={marriage?.other_priests || "—"}
                        width="100px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  WITNESSES
              ================================================= */}

              <SectionCard
                title="Witnesses"
                icon={<LuUsers size={21} />}
              >
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap="0"
                >
                  <Box
                    pr={{ md: "22px" }}
                    borderRight={{ md: "1px solid #E0E6EF" }}
                  >
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        icon={<LuUser size={18} />}
                        label="Groom Side"
                        value={marriage?.witness_groom_side || "—"}
                        width="100px"
                      />
                    </VStack>
                  </Box>

                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow
                        icon={<LuUser size={18} />}
                        label="Bride Side"
                        value={marriage?.witness_bride_side || "—"}
                        width="100px"
                      />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {/* =================================================
                  REMARKS
              ================================================= */}

              {marriage?.remarks && (
                <SectionCard
                  title="Remarks"
                  icon={<LuInfo size={21} />}
                >
                  <Box>
                    <Text
                      fontSize="11px"
                      color={NAVY}
                      fontWeight="500"
                      lineHeight="1.5"
                    >
                      {marriage.remarks}
                    </Text>
                  </Box>
                </SectionCard>
              )}

              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px="14px"
                py="9px"
              >
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  alignItems="center"
                  gap="10px"
                >
                  <Flex align="center" gap="10px">
                    <Box color="#175CD3">
                      <LuInfo size={22} />
                    </Box>
                    <Text fontSize="12px" fontWeight="700" color={NAVY}>
                      Record Information
                    </Text>
                  </Flex>

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{ md: "1px solid #DDE4EE" }}
                    pl={{ md: "24px" }}
                  >
                    <Box color={NAVY}>
                      <LuCalendarDays size={20} />
                    </Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Created on</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">
                        {marriage?.created_at ? formatDate(marriage.created_at) : "—"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex
                    align="center"
                    gap="9px"
                    borderLeft={{ md: "1px solid #DDE4EE" }}
                    pl={{ md: "24px" }}
                  >
                    <Box color={NAVY}>
                      <LuUser size={20} />
                    </Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Last updated</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">
                        {marriage?.updated_at ? formatDate(marriage.updated_at) : "Never"}
                      </Text>
                    </Box>
                  </Flex>
                </Grid>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default MarriageViewPage;