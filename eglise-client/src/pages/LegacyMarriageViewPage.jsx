// src/pages/LegacyMarriageViewPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box, Button, Center, Flex, Grid, Heading, HStack,
  Spinner, Text, VStack,
} from "@chakra-ui/react";

import {
  LuArrowLeft, LuCalendarDays, LuChurch, LuFileDown, LuFileText,
  LuHeart, LuInfo, LuMapPin, LuPencil, LuPrinter, LuUser, LuUsers,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

const RED = "#B40000";
const RED_DARK = "#970000";
const NAVY = "#14245B";
const TEXT = "#26345A";
const MUTED = "#68758F";
const BORDER = "#DCE3EE";

const displayValue = (v) => {
  if (v === null || v === undefined || v === "" ||
      v === "null" || v === "undefined") return "—";
  if (typeof v === "object") return v.name || v.id || "—";
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

const InfoRow = ({ icon, label, value, width = "150px", isRequired = false }) => (
  <Flex align="center" gap="10px" minW="0" py="2px">
    {icon && <Box color={RED} flexShrink="0">{icon}</Box>}
    <Text fontSize="11px" color={TEXT} minW={width} flexShrink="0">
      {label}
      {isRequired && <Text as="span" color={RED}>*</Text>}
    </Text>
    <Text fontSize="11px" color={NAVY} fontWeight="500" minW="0"
          overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
      {displayValue(value)}
    </Text>
  </Flex>
);

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

const LegacyMarriageViewPage = () => {
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
          `/api/registry/legacy/marriages/${id}/`
        );
        setRecord(res.data);
      } catch (err) {
        setError(err?.response?.data?.detail ||
          "Unable to load legacy marriage record.");
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
                    onClick={() => navigate("/legacy/marriage")}
                    _hover={{ bg: "#FFF8F8" }}>
              <LuArrowLeft size={17} />
              <Text ml="6px">Back to Legacy Marriage Register</Text>
            </Button>
          </Box>
        </Center>
        <Footer />
      </Box>
    );
  }

  const isTransfer = record.marriage_type === "TRANSFER_BRIDE";
  const typeLabel = isTransfer ? "Transfer Bride" : "Add Bride";

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
                  onClick={() => navigate("/legacy/marriage")}>
              Legacy Marriage Register
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#667085">{typeLabel}</Text>
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
                Legacy Marriage Details – {typeLabel}
              </Heading>
              <Text color="#667085" fontSize="11px" mt="5px">
                Back-filled historical marriage record.
              </Text>
            </Box>
            <HStack gap="10px" flexWrap="wrap">
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => navigate("/legacy/marriage")}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuArrowLeft size={17} /><Text ml="6px">Back</Text>
              </Button>
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => window.print()}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuPrinter size={17} /><Text ml="6px">Print</Text>
              </Button>
              <Button h="40px" px="18px" bg="white" color={RED}
                      border="1px solid" borderColor={RED}
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => window.print()}
                      _hover={{ bg: "#FFF8F8" }}>
                <LuFileDown size={17} /><Text ml="6px">Generate PDF</Text>
              </Button>
              <Button h="40px" px="18px" bg={RED} color="white"
                      borderRadius="5px" fontSize="11px" fontWeight="500"
                      onClick={() => navigate(`/legacy/marriage/${id}/edit`)}
                      _hover={{ bg: RED_DARK }}>
                <LuPencil size={17} /><Text ml="6px">Edit</Text>
              </Button>
            </HStack>
          </Flex>

          {/* TWO COLUMN */}
          <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }}
                gap={{ base: "14px", lg: "26px" }} alignItems="start">

            {/* LEFT */}
            <Box bg="white" border="1px solid" borderColor={BORDER}
                 borderRadius="8px" px="28px" py="16px">
              <VStack gap="7px" align="flex-start">
                <Heading color={NAVY} fontSize="24px" lineHeight="1.15"
                         fontWeight="700" textAlign="left">
                  {displayValue(record.groom_name)}
                </Heading>
                <Flex align="center" gap="8px" color="#62708B"
                      fontSize="13px" flexWrap="wrap">
                  <LuHeart size={15} color={RED} />
                  <Text fontWeight="500" color={NAVY}>
                    {displayValue(record.bride_name)}
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
                <InfoRow icon={<LuCalendarDays size={22} />}
                         label="Date"
                         value={formatDate(record.date)}
                         width="92px" />
                <InfoRow icon={<LuChurch size={22} />}
                         label="Minister"
                         value={record.minister_of_marriage}
                         width="92px" />
                <InfoRow icon={<LuMapPin size={22} />}
                         label="Transfer To"
                         value={record.transfer_to}
                         width="92px" />
              </VStack>
            </Box>

            {/* RIGHT */}
            <VStack align="stretch" gap="8px">

              <SectionCard title="Marriage Details"
                           icon={<LuHeart size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Old Register No."
                               value={record.register_number} width="92px" />
                      <InfoRow label="Date"
                               value={formatDate(record.date)}
                               width="92px" isRequired />
                      <InfoRow label="Marriage Type"
                               value={typeLabel} width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Transfer To"
                               value={record.transfer_to} width="92px" />
                      <InfoRow label="Remarks"
                               value={record.remarks} width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Groom Details"
                           icon={<LuUser size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Name"
                               value={record.groom_name}
                               width="92px" isRequired />
                      <InfoRow label="Date of Birth"
                               value={formatDate(record.groom_dob)}
                               width="92px" />
                      <InfoRow label="House Name"
                               value={record.groom_house_name}
                               width="92px" />
                      <InfoRow label="Family Name"
                               value={record.groom_family_name}
                               width="92px" />
                      <InfoRow label="Nationality"
                               value={record.nationality_of_groom}
                               width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Father Name"
                               value={record.groom_father}
                               width="92px" />
                      <InfoRow label="Mother Name"
                               value={record.groom_mother}
                               width="92px" />
                      <InfoRow label="Address"
                               value={record.groom_address}
                               width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Bride Details"
                           icon={<LuUser size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Name"
                               value={record.bride_name}
                               width="92px" isRequired />
                      <InfoRow label="Date of Birth"
                               value={formatDate(record.bride_dob)}
                               width="92px" />
                      <InfoRow label="House Name"
                               value={record.bride_house_name}
                               width="92px" />
                      <InfoRow label="Family Name"
                               value={record.bride_family_name}
                               width="92px" />
                      <InfoRow label="Nationality"
                               value={record.nationality_of_bride}
                               width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Father Name"
                               value={record.bride_father}
                               width="92px" />
                      <InfoRow label="Mother Name"
                               value={record.bride_mother}
                               width="92px" />
                      <InfoRow label="Address"
                               value={record.bride_address}
                               width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

              <SectionCard title="Witnesses & Ministers"
                           icon={<LuUsers size={21} />}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
                  <Box pr={{ md: "22px" }} borderRight={{ md: "1px solid #E0E6EF" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Witness (Groom)"
                               value={record.witness_groom_side}
                               width="92px" />
                      <InfoRow label="Witness (Bride)"
                               value={record.witness_bride_side}
                               width="92px" />
                    </VStack>
                  </Box>
                  <Box pl={{ md: "22px" }} mt={{ base: "10px", md: "0" }}>
                    <VStack align="stretch" gap="7px">
                      <InfoRow label="Minister"
                               value={record.minister_of_marriage}
                               width="92px" />
                      <InfoRow label="Other Priests"
                               value={record.other_priests}
                               width="92px" />
                    </VStack>
                  </Box>
                </Grid>
              </SectionCard>

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

export default LegacyMarriageViewPage;