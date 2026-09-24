// src/pages/LegacyBaptismViewPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box, Button, Center, Flex, Grid, Heading, HStack,
  Spinner, Text, VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft, LuBaby, LuCalendarDays, LuChurch, LuFileDown,
  LuFileText, LuInfo, LuMapPin, LuPencil, LuPrinter, LuUser,
  LuUsers, LuBuilding2, LuArchive,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

/* ---------- COLORS ---------- */
const RED = "#B40000";
const RED_DARK = "#970000";
const NAVY = "#14245B";
const TEXT = "#26345A";
const MUTED = "#68758F";
const BORDER = "#DCE3EE";

/* ---------- HELPERS ---------- */
const displayValue = (v) => {
  if (v === null || v === undefined || v === "" ||
      v === "null" || v === "undefined") return "—";
  if (typeof v === "object")
    return v.name || v.family_name || v.id || "—";
  return v;
};

const formatDate = (date) => {
  if (!date) return "—";
  try {
    const parts = String(date).split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const months = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${d} ${months[Number(m) - 1] || m} ${y}`;
    }
    return date;
  } catch { return date; }
};

const formatDateTime = (date) => {
  if (!date) return "—";
  try {
    const v = new Date(date);
    if (Number.isNaN(v.getTime())) return formatDate(date);
    return v.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return formatDate(date); }
};

const InfoRow = ({ icon, label, value, width = "150px", isRequired = false }) => {
  const displayVal = displayValue(value);
  return (
    <Flex align="center" gap="10px" minW="0" py="2px">
      {icon && <Box color={RED} flexShrink="0">{icon}</Box>}
      <Text fontSize="11px" color={TEXT} minW={width} flexShrink="0">
        {label}
        {isRequired && <Text as="span" color={RED}>*</Text>}
      </Text>
      <Text fontSize="11px" color={NAVY} fontWeight="500" minW="0"
            overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {displayVal}
      </Text>
    </Flex>
  );
};

const SectionCard = ({ title, icon, children }) => (
  <Box bg="white" border="1px solid" borderColor={BORDER}
       borderRadius="7px" px={{ base: "14px", md: "18px" }}
       py="12px" width="100%">
    <Flex align="center" gap="9px" mb="8px">
      <Box color={RED}>{icon}</Box>
      <Text color={NAVY} fontSize="16px" fontWeight="700">{title}</Text>
    </Flex>
    {children}
  </Box>
);

/* ---------- PAGE ---------- */
const LegacyBaptismViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const res = await apiClient.get(
          `/api/registry/legacy/baptisms/${id}/`
        );
        setRecord(res.data);
      } catch (err) {
        setError(err?.response?.data?.detail ||
          "Unable to load legacy baptism record.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1"><Spinner size="lg" color={RED} /></Center>
        <Footer />
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Box textAlign="center">
            <Text color={RED} fontSize="18px" fontWeight="600" mb="12px">
              {error || "Record not found."}
            </Text>
            <Button h="40px" px="18px" bg="white" color={RED}
                    border="1px solid" borderColor={RED}
                    borderRadius="5px" fontSize="11px" fontWeight="500"
                    onClick={() => navigate("/legacy/baptism")}
                    _hover={{ bg: "#FFF8F8" }}>
              <LuArrowLeft size={17} />
              <Text ml="6px">Back to Legacy Baptism Register</Text>
            </Button>
          </Box>
        </Center>
        <Footer />
      </Box>
    );
  }

  const isParish = record.baptism_category === "PARISH";
  const categoryLabel = isParish ? "Parish Member" : "Other Parish Member";

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="white">
      <Navbar />

      <Box flex="1"
           px={{ base: "18px", sm: "24px", md: "30px", lg: "42px", xl: "48px" }}
           pt={{ base: "18px", md: "20px" }} pb="20px">
        <Box maxW="1580px" mx="auto" width="100%">

          {/* BREADCRUMB */}
          <Flex align="center" gap="8px" mb="10px" fontSize="11px">
            <Text color="#667085" cursor="pointer"
                  onClick={() => navigate("/masters")}>Masters</Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085" cursor="pointer"
                  onClick={() => navigate("/legacy/baptism")}>
              Legacy Baptism Register
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085">{categoryLabel}</Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085">Details</Text>
          </Flex>

          {/* HEADER */}
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }}
                gap="15px" mb="12px"
                flexDirection={{ base: "column", md: "row" }}>
            <Box>
              <Heading color={NAVY}
                       fontSize={{ base: "25px", md: "29px", lg: "31px" }}
                       lineHeight="1.15" fontWeight="700">
                Legacy Baptism Details{!isParish && ` – ${categoryLabel}`}
              </Heading>
              <Text color="#667085" fontSize="11px" mt="5px">
                Back-filled historical baptism record.
              </Text>
            </Box>

            <HStack gap="10px" flexWrap="wrap">
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => navigate("/legacy/baptism")}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuArrowLeft size={17} />
                <Text ml="6px">Back</Text>
              </Button>
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => window.print()}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuPrinter size={17} />
                <Text ml="6px">Print</Text>
              </Button>
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => window.print()}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuFileDown size={17} />
                <Text ml="6px">Generate PDF</Text>
              </Button>
              <Button h="40px" px="18px" bg={RED} color="white"
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => navigate(`/legacy/baptism/${id}/edit`)}
                      _hover={{ bg: RED_DARK }}>
                <LuPencil size={17} />
                <Text ml="6px">Edit</Text>
              </Button>
            </HStack>
          </Flex>

          {/* TWO COLUMN */}
          <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }}
                gap={{ base: "14px", lg: "26px" }} alignItems="start">

            {/* LEFT PROFILE */}
            <Box bg="white" border="1px solid" borderColor={BORDER}
                 borderRadius="8px" px="28px" py="16px">
              <VStack gap="7px" align="flex-start">
                <Heading color={NAVY} fontSize="28px" lineHeight="1.1"
                         fontWeight="700" textAlign="left">
                  {displayValue(record.name)}
                </Heading>
                <Flex align="center" gap="8px" color="#62708B"
                      fontSize="13px" flexWrap="wrap">
                  <Text>Baptism Name</Text>
                  <Text fontWeight="500" color={NAVY}>
                    {displayValue(record.baptismal_name)}
                  </Text>
                </Flex>
                <Box px="10px" py="4px" borderRadius="4px"
                     bg="#FFF4E5" border="1px solid #F5CDA0"
                     color="#B45309" fontSize="10px" fontWeight="600">
                  LEGACY / BACK-FILLED
                </Box>
              </VStack>

              <Box h="1px" bg="#E4E9F1" my="14px" />

              <VStack align="stretch" gap="13px">
                <InfoRow icon={<LuChurch size={22} />} label="Parish"
                         value={record.parish_of_baptism} width="92px" />
                <InfoRow icon={<LuMapPin size={22} />} label="Place"
                         value={record.place_of_birth} width="92px" />
                <InfoRow icon={<LuBuilding2 size={22} />} label="Panchayath"
                         value={record.panchayath} width="92px" />
                <InfoRow icon={<LuUsers size={22} />} label="Family"
                         value={record.family_name} width="92px" />
                <InfoRow icon={<LuUser size={22} />} label="House"
                         value={record.house_name} width="92px" />
              </VStack>
            </Box>

            {/* RIGHT */}
            <VStack align="stretch" gap="8px">

              <SectionCard title="Baptism & Birth Information"
                           icon={<LuBaby size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Old Register No."
                               value={record.register_number} width="92px" />
                      <InfoRow label="Date of Baptism"
                               value={formatDate(record.date_of_baptism)}
                               width="92px" isRequired />
                      <InfoRow label="Parish of Baptism"
                               value={record.parish_of_baptism}
                               width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Name" value={record.name} width="92px" />
                      <InfoRow label="Baptism Name"
                               value={record.baptismal_name} width="92px" />
                      <InfoRow label="Gender" value={record.gender}
                               width="92px" />
                    </VStack>
                  </Box>
                </Grid>

                <Box h="1px" bg="#E4E9F1" my="10px" />

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <InfoRow label="Date of Birth"
                             value={formatDate(record.dob)} width="92px" />
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <InfoRow label="Place of Birth"
                             value={record.place_of_birth} width="92px" />
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Ceremony Information"
                           icon={<LuChurch size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Priest Name"
                               value={record.priest_name} width="92px" />
                      <InfoRow label="Panchayath"
                               value={record.panchayath} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="God Father"
                               value={record.god_father} width="92px" />
                      <InfoRow label="God Mother"
                               value={record.god_mother} width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Family & Parents"
                           icon={<LuUsers size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Family Name"
                               value={record.family_name} width="92px" />
                      <InfoRow label="House Name"
                               value={record.house_name} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Father Name"
                               value={record.father_name} width="92px" />
                      <InfoRow label="Mother Name"
                               value={record.mother_name} width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              {(record.address || record.remarks) && (
                <SectionCard title="Address & Notes"
                             icon={<LuMapPin size={21} />}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                    <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                      <InfoRow label="Address" value={record.address}
                               width="92px" />
                    </Box>
                    <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                      <InfoRow label="Remarks" value={record.remarks}
                               width="92px" />
                    </Box>
                  </Grid>
                </SectionCard>
              )}

              {/* RECORD INFO */}
              <Box bg="white" border="1px solid" borderColor={BORDER}
                   borderRadius="7px" px="14px" py="9px">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
                      alignItems="center" gap="10px">
                  <Flex align="center" gap="10px">
                    <Box color="#175CD3"><LuInfo size={22} /></Box>
                    <Text fontSize="12px" fontWeight="700" color={NAVY}>
                      Record Information
                    </Text>
                  </Flex>
                  <Flex align="center" gap="9px"
                        borderLeft={{ md: "1px solid #DDE4EE" }}
                        pl={{ md: "24px" }}>
                    <Box color={NAVY}><LuCalendarDays size={20} /></Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Created on</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">
                        {record.created_at
                          ? formatDateTime(record.created_at) : "—"}
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap="9px"
                        borderLeft={{ md: "1px solid #DDE4EE" }}
                        pl={{ md: "24px" }}>
                    <Box color={NAVY}><LuFileText size={20} /></Box>
                    <Box>
                      <Text fontSize="9px" color={MUTED}>Record ID</Text>
                      <Text fontSize="10px" color={NAVY} fontWeight="500">
                        #{id}
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

export default LegacyBaptismViewPage;