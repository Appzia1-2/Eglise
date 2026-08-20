// frontend/src/pages/MemberDetailPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Spinner,
  Center,
  Avatar,
  Badge,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuPencil,
  LuUser,
  LuPhone,
  LuCalendar,
  LuUsers,
  LuMapPin,
  LuInfo,
} from "react-icons/lu";

import { getMemberDetail } from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const COLORS = {
  navy: "#10235B",
  navyLight: "#1B2F6B",
  red: "#D71920",
  redDark: "#C8102E",
  redSoft: "#FFF0F2",
  blue: "#006BFF",
  green: "#16833B",
  greenSoft: "#E9F8ED",
  border: "#DCE4F0",
  muted: "#68758F",
  background: "#FFFFFF",
};


const SectionIcon = ({ children }) => (
  <Box
    w="42px"
    h="42px"
    minW="42px"
    borderRadius="50%"
    bg={COLORS.redSoft}
    display="flex"
    alignItems="center"
    justifyContent="center"
    color={COLORS.red}
  >
    {children}
  </Box>
);


const DetailRow = ({ label, value }) => (
  <HStack align="center" minH="38px" spacing={3}>
    <Text
      width={{ base: "120px", md: "105px", lg: "125px" }}
      flexShrink="0"
      fontSize="12px"
      fontWeight="700"
      color={COLORS.navy}
    >
      {label}
    </Text>
    <Text fontSize="13px" fontWeight="500" color={COLORS.navy} lineHeight="1.5">
      {value || "—"}
    </Text>
  </HStack>
);


const SectionCard = ({ icon, title, children }) => (
  <Box bg="white" border={`1px solid ${COLORS.border}`} borderRadius="10px" overflow="hidden">
    <Box p={{ base: 4, md: 5 }}>
      <HStack spacing={4} mb={4}>
        <SectionIcon>{icon}</SectionIcon>
        <Heading fontSize={{ base: "16px", md: "17px" }} fontWeight="700" color={COLORS.navy}>
          {title}
        </Heading>
      </HStack>
      {children}
    </Box>
  </Box>
);


const MemberDetailPage = () => {
  const { headId, memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMemberDetail(memberId);
      let memberData = response?.data || response;

      // Handle nested responses
      if (memberData?.member) memberData = memberData.member;
      if (memberData?.result) memberData = memberData.result;
      if (memberData?.data) memberData = memberData.data;

      console.log("✅ Member Data:", memberData);
      console.log("✅ Relationship:", memberData?.relationship);
      console.log("✅ Family:", memberData?.family);
      console.log("✅ Ward:", memberData?.ward);
      console.log("✅ Grade:", memberData?.grade);

      setMember(memberData);
    } catch (err) {
      console.error("Error fetching member:", err);
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to load member details."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Center minH="70vh">
          <VStack spacing={3}>
            <Spinner size="lg" color={COLORS.red} />
            <Text fontSize="13px" color={COLORS.muted}>Loading member details...</Text>
          </VStack>
        </Center>
        <Footer />
      </>
    );
  }

  if (error || !member) {
    return (
      <>
        <Navbar />
        <Center minH="70vh">
          <VStack spacing={4}>
            <Text color={COLORS.red} fontSize="14px" fontWeight="600">
              {error || "Member not found"}
            </Text>
            <Button
              bg={COLORS.red}
              color="white"
              size="sm"
              onClick={() => navigate(`/family-heads/${headId}/members`)}
              _hover={{ bg: COLORS.redDark }}
            >
              <LuArrowLeft size={15} style={{ marginRight: "7px" }} />
              Back to Members
            </Button>
          </VStack>
        </Center>
        <Footer />
      </>
    );
  }

  // ================================================================
  // DATA EXTRACTION - Using nested objects from the API
  // ================================================================

  const memberName = member.name || "Unnamed Member";
  const baptismName = member.baptismal_name || "—";

  // These now come from the nested objects
  const relationship = member.relationship?.name || "—";
  const familyName = member.family?.family_name || member.family_name || "—";
  const familyHeadName = member.family_head_name || "—";
  const wardName = member.ward?.ward_name || member.ward_name || "—";
  const gradeName = member.grade?.name || member.grade_name || "—";

  // Simple fields
  const gender = member.gender || "—";
  const dateOfBirth = member.dob || "—";
  const age = member.age !== undefined && member.age !== null && member.age !== ""
    ? `${member.age} Years`
    : "—";
  const maritalStatus = member.marital_status || "—";
  const spouse = member.spouse_name || member.spouse?.name || "—";
  const bloodGroup = member.blood_group || "—";
  const email = member.email || "—";
  const mobile = member.mobile_no || "—";
  const phone = member.phone_no || "—";
  const fatherName = member.father_name || "—";
  const motherName = member.mother_name || "—";
  const houseName = member.house_name || "—";
  const dateOfBaptism = member.date_of_baptism || "—";
  const parishOfBaptism = member.parish_of_baptism || "—";
  const educationalQualification = member.educational_qualification || "—";
  const sundaySchoolQualification = member.sunday_school_qualification || "—";
  const profession = member.profession || "—";
  const joiningDate = member.joining_date || "—";

  const imageUrl = member.family_image_url || member.family_image || "";
  const createdDate = member.created_at ? member.created_at.split("T")[0] : "—";
  const updatedDate = member.updated_at ? member.updated_at.split("T")[0] : "—";
  const isActive = member.is_active !== false;
  const isFamilyHead = member.is_family_head === true;

  return (
    <>
      <Navbar />
      <Box
        bg={COLORS.background}
        minH="calc(100vh - 140px)"
        px={{ base: 4, md: 7, lg: 7 }}
        py={{ base: 4, md: 5 }}
      >
        <Box maxW="1600px" mx="auto">
          {/* Breadcrumb */}
          <HStack spacing={3} flexWrap="wrap" mb={3} fontSize="12px" color={COLORS.blue}>
            <Text>Masters</Text>
            <Text color="#A2AABC">/</Text>
            <Text>Family Head Master</Text>
            <Text color="#A2AABC">/</Text>
            <Text>{familyHeadName}</Text>
            <Text color="#A2AABC">/</Text>
            <Text>{memberName}</Text>
            <Text color="#A2AABC">/</Text>
            <Text>Details</Text>
          </HStack>

          {/* Page Header */}
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={4} mb={3}>
            <Box>
              <Text fontSize="11px" fontWeight="700" color={COLORS.red} mb={1} textTransform="uppercase">
                Dependent Management
              </Text>
              <Heading fontSize={{ base: "24px", md: "27px" }} lineHeight="1.2" color={COLORS.navy} fontWeight="700">
                Dependent Details
              </Heading>
              <Text mt={1} fontSize="12px" color={COLORS.muted}>
                View dependent, relationship and parish information.
              </Text>
            </Box>

            <HStack spacing={3} flexShrink="0">
              <Button
                h="44px"
                minW="130px"
                bg="white"
                color={COLORS.red}
                border={`1px solid ${COLORS.red}`}
                borderRadius="6px"
                fontSize="13px"
                fontWeight="500"
                onClick={() => navigate(`/family-heads/${headId}/members`)}
                _hover={{ bg: COLORS.redSoft }}
              >
                <LuArrowLeft size={18} style={{ marginRight: "9px" }} />
                Back
              </Button>

              <Button
                h="44px"
                minW="180px"
                bg={COLORS.red}
                color="white"
                borderRadius="6px"
                fontSize="13px"
                fontWeight="600"
                onClick={() => navigate(`/family-heads/${headId}/members/${memberId}/edit`)}
                _hover={{ bg: COLORS.redDark }}
              >
                <LuPencil size={18} style={{ marginRight: "9px" }} />
                Edit Dependent
              </Button>
            </HStack>
          </HStack>

          {/* Main Content */}
          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", xl: "373px 1fr" }}
            gap={{ base: 4, xl: 6 }}
          >
            {/* Left Profile Card */}
            <Box bg="white" border={`1px solid ${COLORS.border}`} borderRadius="10px" overflow="hidden">
              <VStack align="stretch" spacing={0} p={{ base: 5, md: 6 }}>
                <VStack spacing={2} textAlign="center">
                  <Avatar.Root size="2xl" mb={1}>
                    {imageUrl && <Avatar.Image src={imageUrl} alt={memberName} />}
                    <Avatar.Fallback bg="#FFF1F3" color={COLORS.red} fontSize="42px">
                      {memberName.charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>

                  <Heading fontSize="26px" color={COLORS.navy} fontWeight="700" mt={1}>
                    {memberName}
                  </Heading>

                  {baptismName !== "—" && (
                    <HStack spacing={3} color={COLORS.muted} fontSize="13px" justify="center" minH="22px">
                      <Text>Baptism Name</Text>
                      <Text>•</Text>
                      <Text>{baptismName}</Text>
                    </HStack>
                  )}

                  <HStack spacing={3} mt={2} flexWrap="wrap" justify="center">
                    <Badge bg={COLORS.redSoft} color={COLORS.red} borderRadius="5px" px={3} py={1.5} fontSize="11px" fontWeight="600">
                      <HStack spacing={1.5}>
                        <LuUser size={13} />
                        <Text>{relationship}</Text>
                      </HStack>
                    </Badge>

                    {isFamilyHead && (
                      <Badge bg={COLORS.navy} color="white" borderRadius="5px" px={3} py={1.5} fontSize="11px" fontWeight="600">
                        Family Head
                      </Badge>
                    )}

                    <Badge
                      bg={isActive ? COLORS.greenSoft : "#F1F1F1"}
                      color={isActive ? COLORS.green : "#666"}
                      borderRadius="5px"
                      px={3}
                      py={1.5}
                      fontSize="11px"
                      fontWeight="600"
                    >
                      <HStack spacing={1.5}>
                        <Box w="9px" h="9px" borderRadius="50%" bg={isActive ? "#16923D" : "#777"} />
                        <Text>{isActive ? "Active" : "Inactive"}</Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  <HStack spacing={2} mt={4} color={COLORS.navy}>
                    <LuCalendar size={19} />
                    <Text fontSize="13px" fontWeight="500">{age}</Text>
                  </HStack>

                  {houseName !== "—" && (
                    <HStack spacing={2} mt={1} color={COLORS.navy}>
                      <LuMapPin size={16} />
                      <Text fontSize="12px" color={COLORS.muted}>House: {houseName}</Text>
                    </HStack>
                  )}
                </VStack>

                <Box borderTop={`1px solid ${COLORS.border}`} my={5} />

                <Box>
                  <HStack spacing={4} mb={5}>
                    <SectionIcon><LuUsers size={21} /></SectionIcon>
                    <Heading fontSize="17px" color={COLORS.navy} fontWeight="700">
                      {familyName}
                    </Heading>
                  </HStack>

                  {/* Family Head */}
                  <HStack spacing={4} mb={4} align="center">
                    <Box w="40px" minW="40px" display="flex" alignItems="center" justifyContent="center">
                      <LuUser size={19} color={COLORS.navy} />
                    </Box>
                    <Text width="82px" flexShrink="0" fontSize="11px" fontWeight="700" color={COLORS.navy}>
                      Family Head
                    </Text>
                    <Text fontSize="12px" fontWeight="500" color={COLORS.navy}>
                      {familyHeadName}
                    </Text>
                  </HStack>

                  {/* Ward */}
                  <HStack spacing={4} align="center">
                    <Box w="40px" minW="40px" display="flex" alignItems="center" justifyContent="center">
                      <LuMapPin size={19} color={COLORS.navy} />
                    </Box>
                    <Text width="82px" flexShrink="0" fontSize="11px" fontWeight="700" color={COLORS.navy}>
                      Ward
                    </Text>
                    <Text fontSize="12px" fontWeight="500" color={COLORS.navy}>
                      {wardName}
                    </Text>
                  </HStack>

                  {/* Grade */}
                  {gradeName !== "—" && (
                    <HStack spacing={4} align="center" mt={4}>
                      <Box w="40px" minW="40px" display="flex" alignItems="center" justifyContent="center">
                        <LuUsers size={19} color={COLORS.navy} />
                      </Box>
                      <Text width="82px" flexShrink="0" fontSize="11px" fontWeight="700" color={COLORS.navy}>
                        Grade
                      </Text>
                      <Text fontSize="12px" fontWeight="500" color={COLORS.navy}>
                        {gradeName}
                      </Text>
                    </HStack>
                  )}

                  <Button
                    variant="ghost"
                    color={COLORS.red}
                    fontSize="13px"
                    fontWeight="500"
                    mt={4}
                    ml="72px"
                    p={0}
                    h="auto"
                    _hover={{ bg: "transparent", color: COLORS.redDark }}
                    onClick={() => navigate(`/family-heads/${headId}`)}
                  >
                    View Family
                    <Text fontSize="23px" lineHeight="1" ml={2}>→</Text>
                  </Button>
                </Box>
              </VStack>
            </Box>

            {/* Right Content */}
            <VStack align="stretch" spacing={3}>
              {/* Personal & Relationship */}
              <SectionCard icon={<LuUser size={22} />} title="Personal & Relationship">
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}>
                  <Box pr={{ md: 5 }} borderRight={{ md: `1px solid ${COLORS.border}` }} mb={{ base: 4, md: 0 }}>
                    <DetailRow label="Name" value={memberName} />
                    <DetailRow label="Baptism Name" value={baptismName} />
                    <DetailRow label="Relationship" value={relationship} />
                  </Box>
                  <Box px={{ md: 5 }} borderRight={{ md: `1px solid ${COLORS.border}` }} mb={{ base: 4, md: 0 }}>
                    <DetailRow label="Gender" value={gender} />
                    <DetailRow label="Date of Birth" value={dateOfBirth} />
                    <DetailRow label="Age" value={age} />
                  </Box>
                  <Box pl={{ md: 5 }}>
                    <DetailRow label="Marital Status" value={maritalStatus} />
                    <DetailRow label="Spouse" value={spouse} />
                    <DetailRow label="Blood Group" value={bloodGroup} />
                  </Box>
                </Box>
              </SectionCard>

              {/* Contact & Family */}
              <SectionCard icon={<LuPhone size={22} />} title="Contact & Family">
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}>
                  <Box pr={{ md: 5 }} borderRight={{ md: `1px solid ${COLORS.border}` }}>
                    <DetailRow label="Email" value={email} />
                    <DetailRow label="Mobile Number" value={mobile} />
                    <DetailRow label="Phone Number" value={phone} />
                  </Box>
                  <Box pl={{ md: 5 }} mt={{ base: 4, md: 0 }}>
                    <DetailRow label="Father Name" value={fatherName} />
                    <DetailRow label="Mother Name" value={motherName} />
                    <DetailRow label="House Name" value={houseName} />
                  </Box>
                </Box>
              </SectionCard>

              {/* Sacraments, Education & Parish */}
              <SectionCard icon={<LuUsers size={22} />} title="Sacraments, Education & Parish">
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}>
                  <Box pr={{ md: 5 }} borderRight={{ md: `1px solid ${COLORS.border}` }}>
                    <DetailRow label="Date of Baptism" value={dateOfBaptism} />
                    <DetailRow label="Parish of Baptism" value={parishOfBaptism} />
                    <DetailRow label="Educational Qualification" value={educationalQualification} />
                  </Box>
                  <Box pl={{ md: 5 }} mt={{ base: 4, md: 0 }}>
                    <DetailRow label="Sunday School Qualification" value={sundaySchoolQualification} />
                    <DetailRow label="Profession" value={profession} />
                    <DetailRow label="Joining Date" value={joiningDate} />
                  </Box>
                </Box>
              </SectionCard>
            </VStack>
          </Box>

          {/* Record Information */}
          <Box mt={4} bg="white" border={`1px solid ${COLORS.border}`} borderRadius="10px" px={{ base: 4, md: 6 }} py={3}>
            <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} alignItems="center">
              <HStack spacing={4} py={2} borderRight={{ md: `1px solid ${COLORS.border}` }}>
                <LuInfo size={24} color={COLORS.blue} />
                <Text fontSize="13px" fontWeight="600" color={COLORS.navy}>Record Information</Text>
              </HStack>
              <HStack spacing={4} px={{ md: 6 }} py={2} borderRight={{ md: `1px solid ${COLORS.border}` }}>
                <LuCalendar size={24} color={COLORS.navy} />
                <Text fontSize="13px" color={COLORS.navy}>
                  Created on <Text as="span" fontWeight="600">{createdDate}</Text>
                </Text>
              </HStack>
              <HStack spacing={4} px={{ md: 6 }} py={2}>
                <LuUser size={24} color={COLORS.navy} />
                <Text fontSize="13px" color={COLORS.navy}>
                  Last updated <Text as="span" fontWeight="600">{updatedDate}</Text>
                </Text>
              </HStack>
            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default MemberDetailPage;