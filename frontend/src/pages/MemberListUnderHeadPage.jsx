// MemberListUnderHeadPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  LuPlus,
  LuSearch,
  LuFilter,
  LuEye,
  LuPencil,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuUserCog,
} from "react-icons/lu";

import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";

import {
  getMember,
  listMembersByHead,
  listRelationships,
  transferAndPromoteHead,
} from "../api/registryServices";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   COLORS
============================================================ */

const RED = "#B40000";
const RED_DARK = "#970000";

const NAVY = "#14245B";
const NAVY_LIGHT = "#26396C";

const TEXT = "#26345A";
const MUTED = "#68758F";

const BORDER = "#E5EAF2";
const PAGE_BG = "#FBFCFE";

const PAGE_SIZE = 6;

/* ============================================================
   HELPERS
============================================================ */

const getArrayData = (response) => {
  const data = response?.data ?? response ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getNameFromObject = (value) => {
  if (!value) return "—";

  if (typeof value === "object") {
    return (
      value.name ||
      value.label ||
      value.title ||
      "—"
    );
  }

  return String(value);
};

/* ============================================================
   COMPONENT
============================================================ */

const MemberListUnderHeadPage = () => {
  const { headId } = useParams();
  const navigate = useNavigate();

  /* ==========================================================
     STATE
  ========================================================== */

  const [head, setHead] = useState(null);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [promoting, setPromoting] = useState(null);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    loadPageData();
  }, [headId]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        headResponse,
        membersResponse,
        relationshipsResponse,
      ] = await Promise.all([
        getMember(headId),
        listMembersByHead(headId),
        listRelationships(),
      ]);

      setHead(headResponse?.data || headResponse || null);
      setMembers(getArrayData(membersResponse));
      setRelationships(getArrayData(relationshipsResponse));
    } catch (err) {
      console.error("Unable to load dependent page:", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load dependents."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RELATIONSHIP
  ========================================================== */

  const getRelationship = (member) => {
    const relationship = member?.relationship;

    if (!relationship) {
      return "—";
    }

    if (typeof relationship === "object") {
      return getNameFromObject(relationship);
    }

    const found = relationships.find(
      (item) => Number(item?.id) === Number(relationship)
    );

    return found?.name || found?.label || found?.title || "—";
  };

  /* ==========================================================
     FAMILY NAME
  ========================================================== */

  const getFamilyName = (member) => {
    return (
      member?.family_name ||
      member?.family?.family_name ||
      member?.family?.name ||
      head?.family_name ||
      head?.family?.family_name ||
      head?.family?.name ||
      "—"
    );
  };

  /* ==========================================================
     FAMILY HEAD
  ========================================================== */

  const getFamilyHeadName = (member) => {
    return (
      member?.family_head_name ||
      member?.head_name ||
      member?.family_head?.name ||
      head?.name ||
      "—"
    );
  };

  /* ==========================================================
     PHONE
  ========================================================== */

  const getPhone = (member) => {
    return (
      member?.mobile_no ||
      member?.mobile ||
      member?.phone_number ||
      member?.phone ||
      "—"
    );
  };

  /* ==========================================================
     AGE
  ========================================================== */

  const getAge = (dob) => {
    if (!dob) {
      return "—";
    }

    const birthDate = new Date(dob);

    if (Number.isNaN(birthDate.getTime())) {
      return "—";
    }

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const month = today.getMonth() - birthDate.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : "—";
  };

  /* ==========================================================
     STATUS - FIXED to correctly identify inactive members
  ========================================================== */

  const getStatus = (member) => {
    // Check if member is explicitly inactive
    if (member?.is_active === false) {
      return "Inactive";
    }
    
    // Check if expired
    if (member?.expired === true) {
      return "Inactive";
    }
    
    // Check status field
    if (String(member?.status || "").toUpperCase() === "INACTIVE") {
      return "Inactive";
    }

    return "Active";
  };

  /* ==========================================================
     PROMOTE HANDLER - Shows house name in alerts
  ========================================================== */

  const handlePromote = async (memberId, memberName, member) => {
    // Ask for new house name
    const newHouseName = window.prompt(
      `Enter new house name for "${memberName}" to start their own household:\n\n` +
      `Example: Kunnath Cottage, Kunnath Villa, etc.`,
      `${memberName}'s House`
    );

    if (newHouseName === null) {
      return;
    }

    if (!newHouseName || newHouseName.trim() === "") {
      alert("House name is required to promote to a new house.");
      return;
    }

    const trimmedHouseName = newHouseName.trim();

    // Show the entered house name in confirmation
    if (!window.confirm(
      `Are you sure you want to promote "${memberName}" to Family Head of "${trimmedHouseName}"?\n\n` +
      `This will create a new household under the same family.`
    )) {
      return;
    }

    try {
      setPromoting(memberId);
      setError("");

      // Get family ID from head or member
      const familyId = head?.family?.id || head?.family_id || member?.family?.id || member?.family;

      if (!familyId) {
        throw new Error("Family ID not found. Please make sure the family head is properly set.");
      }

      await transferAndPromoteHead(memberId, {
        family: familyId,
        house_name: trimmedHouseName
      });

      await loadPageData();

      // Show success with the house name
      alert(
        `✅ "${memberName}" has been promoted to Family Head of "${trimmedHouseName}" successfully!\n\n` +
        `They now have their own household.`
      );
    } catch (err) {
      console.error("Promotion failed:", err);
      
      const errorMessage = err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to promote member. Please try again.";

      setError(errorMessage);
      
      alert(`❌ Promotion Failed:\n\n${errorMessage}`);
    } finally {
      setPromoting(null);
    }
  };

  /* ==========================================================
     RELATIONSHIP OPTIONS
  ========================================================== */

  const relationshipOptions = useMemo(() => {
    return relationships
      .map((item) => item?.name || item?.label || item?.title)
      .filter(Boolean);
  }, [relationships]);

  /* ==========================================================
     FILTER - FIXED to include inactive members
  ========================================================== */

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const name = String(member?.name || "").toLowerCase();
      const family = String(getFamilyName(member)).toLowerCase();
      const familyHead = String(getFamilyHeadName(member)).toLowerCase();
      const phone = String(getPhone(member)).toLowerCase();
      const relationship = getRelationship(member);
      const gender = String(member?.gender || "").toUpperCase();
      const status = getStatus(member);

      const matchesSearch =
        !query ||
        name.includes(query) ||
        family.includes(query) ||
        familyHead.includes(query) ||
        phone.includes(query);

      const matchesRelationship =
        !relationshipFilter || relationship === relationshipFilter;

      const matchesGender =
        !genderFilter || gender === genderFilter;

      const matchesStatus =
        !statusFilter || status === statusFilter;

      return (
        matchesSearch &&
        matchesRelationship &&
        matchesGender &&
        matchesStatus
      );
    });
  }, [members, search, relationshipFilter, genderFilter, statusFilter, relationships, head]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalItems = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleMembers = filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + visibleMembers.length, totalItems);

  /* ==========================================================
     RESET PAGE
  ========================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, relationshipFilter, genderFilter, statusFilter]);

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setRelationshipFilter("");
    setGenderFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(relationshipFilter) ||
    Boolean(genderFilter) ||
    Boolean(statusFilter);

  /* ==========================================================
     PAGE NUMBERS
  ========================================================== */

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];

    if (safePage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return [...new Set(pages)];
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        bg="white"
      >
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color={RED} />
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="white"
    >
      <Navbar />

      <Box
        flex="1"
        bg={PAGE_BG}
        px={{
          base: "18px",
          sm: "24px",
          md: "34px",
          lg: "42px",
          xl: "48px",
        }}
        pt={{
          base: "18px",
          md: "22px",
        }}
        pb="28px"
      >
        <Box maxW="1400px" mx="auto" width="100%">
          {/* BREADCRUMB */}
          <Flex align="center" gap="8px" mb="19px" fontSize="11px">
            <Text
              color="#7A8497"
              cursor="pointer"
              fontWeight="500"
              onClick={() => navigate("/family-heads")}
            >
              Masters
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text
              color="#7A8497"
              cursor="pointer"
              fontWeight="500"
              onClick={() => navigate("/family-heads")}
            >
              Family Head Master
            </Text>
            <Text color="#A3ADBE">/</Text>
            <Text color="#7A8497">Dependent Master</Text>
          </Flex>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            mb="24px"
            gap="20px"
            flexDirection={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                color={RED}
                fontSize="11px"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="0.2px"
                mb="5px"
              >
                Dependent Master
              </Text>

              <Heading
                color={NAVY}
                fontSize={{ base: "27px", md: "30px", lg: "32px" }}
                lineHeight="1.15"
                fontWeight="700"
                mb="7px"
              >
                Dependent Master Dashboard
              </Heading>

              <Text color="#667085" fontSize="12px">
                Manage dependents, relationships and linked family information.
              </Text>
            </Box>

            <Button
              bg={RED}
              color="white"
              h="38px"
              px="16px"
              borderRadius="4px"
              fontSize="11px"
              fontWeight="500"
              flexShrink="0"
              onClick={() => navigate(`/family-heads/${headId}/members/create`)}
              _hover={{ bg: RED_DARK }}
            >
              <LuPlus size={16} />
              <Text ml="6px">Add Dependent</Text>
            </Button>
          </Flex>

          {/* ERROR */}
          {error && (
            <Box
              mb="15px"
              px="13px"
              py="10px"
              bg="#FFF5F5"
              border="1px solid #F2C6C6"
              borderRadius="5px"
            >
              <Text fontSize="11px" color="#B42318">
                {error}
              </Text>
            </Box>
          )}

          {/* FILTER BAR */}
          <Box
            display="flex"
            alignItems="center"
            gap="10px"
            mb="18px"
            flexWrap={{ base: "wrap", xl: "nowrap" }}
          >
            {/* SEARCH */}
            <Box position="relative" flex="1.7" minW={{ base: "230px", xl: "280px" }}>
              <Box
                position="absolute"
                left="11px"
                top="50%"
                transform="translateY(-50%)"
                zIndex="1"
                color="#52627E"
              >
                <LuSearch size={16} />
              </Box>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dependent name, family or mobile"
                pl="34px"
                h="36px"
                bg="white"
                border="1px solid #D8DFE9"
                borderRadius="5px"
                fontSize="11px"
                color={TEXT}
                _placeholder={{ color: "#8B96A8" }}
                _focus={{ borderColor: "#C7CEDA", boxShadow: "none" }}
              />
            </Box>

            {/* RELATIONSHIP */}
            <Box position="relative" flex="0.9" minW="155px">
              <select
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: "100%",
                  height: "36px",
                  padding: "0 31px 0 11px",
                  background: "#FFFFFF",
                  border: "1px solid #D8DFE9",
                  borderRadius: "5px",
                  fontSize: "11px",
                  color: "#69758A",
                  outline: "none",
                }}
              >
                <option value="">All Relationships</option>
                {relationshipOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <LuChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "11px",
                  pointerEvents: "none",
                  color: "#65748C",
                }}
              />
            </Box>

            {/* GENDER */}
            <Box position="relative" flex="0.75" minW="125px">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: "100%",
                  height: "36px",
                  padding: "0 31px 0 11px",
                  background: "#FFFFFF",
                  border: "1px solid #D8DFE9",
                  borderRadius: "5px",
                  fontSize: "11px",
                  color: "#69758A",
                  outline: "none",
                }}
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <LuChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "11px",
                  pointerEvents: "none",
                  color: "#65748C",
                }}
              />
            </Box>

            {/* STATUS */}
            <Box position="relative" flex="0.75" minW="125px">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: "100%",
                  height: "36px",
                  padding: "0 31px 0 11px",
                  background: "#FFFFFF",
                  border: "1px solid #D8DFE9",
                  borderRadius: "5px",
                  fontSize: "11px",
                  color: "#69758A",
                  outline: "none",
                }}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <LuChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "11px",
                  pointerEvents: "none",
                  color: "#65748C",
                }}
              />
            </Box>

            <Button
              h="36px"
              minW="88px"
              px="14px"
              bg="white"
              color={RED}
              border="1px solid"
              borderColor={RED}
              borderRadius="5px"
              fontSize="11px"
              fontWeight="500"
              flexShrink="0"
              onClick={() => {
                if (hasFilters) {
                  clearFilters();
                }
              }}
              _hover={{ bg: "#FFF8F8" }}
            >
              <LuFilter size={15} />
              <Text ml="6px">{hasFilters ? "Clear" : "Filter"}</Text>
            </Button>
          </Box>

          {/* DIRECTORY TITLE */}
          <Box mb="11px">
            <Heading color={NAVY} fontSize="18px" fontWeight="700" lineHeight="1.2">
              Dependent Directory
            </Heading>
            <Text color="#68758F" fontSize="11px" mt="4px">
              Showing {showingFrom}-{showingTo} of {totalItems} dependents
            </Text>
          </Box>

          {/* EMPTY */}
          {visibleMembers.length === 0 ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="6px"
              py="80px"
              textAlign="center"
            >
              <Text fontSize="14px" fontWeight="600" color={TEXT}>
                No dependents found.
              </Text>
              <Text fontSize="11px" color={MUTED} mt="5px">
                No dependent matches the selected filters.
              </Text>
              {hasFilters && (
                <Button
                  mt="15px"
                  h="34px"
                  px="14px"
                  bg={RED}
                  color="white"
                  fontSize="11px"
                  borderRadius="4px"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          ) : (
            /* DEPENDENT CARDS */
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              }}
              gap="12px"
            >
              {visibleMembers.map((member) => {
                const name = member?.name || "Unnamed";
                const relation = getRelationship(member);
                const status = getStatus(member);
                const family = getFamilyName(member);
                const familyHead = getFamilyHeadName(member);
                const age = getAge(member?.dob);
                const phone = getPhone(member);

                const canPromote = member?.is_active && !member?.is_family_head;

                // Check if member is inactive
                const isInactive = status === "Inactive";

                return (
                  <Box
                    key={member.id}
                    bg="white"
                    border="1px solid"
                    borderColor={isInactive ? "#F5E6E6" : BORDER}
                    borderRadius="6px"
                    h="145px"
                    px="14px"
                    py="12px"
                    position="relative"
                    transition="all 0.15s ease"
                    opacity={isInactive ? 0.7 : 1}
                    _hover={{
                      borderColor: "#CBD4E1",
                      boxShadow: "0 3px 10px rgba(20,36,91,0.06)",
                    }}
                  >
                    {/* NAME / RELATIONSHIP / STATUS */}
                    <Flex align="center" justify="space-between" gap="8px">
                      <HStack gap="7px" minW="0" flex="1">
                        <Text
                          fontSize="14px"
                          fontWeight="700"
                          color={isInactive ? "#666666" : NAVY}
                          whiteSpace="nowrap"
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          {name}
                        </Text>

                        <Box
                          bg="#FFF1F3"
                          border="1px solid #F2CFD5"
                          color="#D6455D"
                          borderRadius="4px"
                          px="6px"
                          py="2px"
                          fontSize="10px"
                          lineHeight="12px"
                          fontWeight="500"
                          whiteSpace="nowrap"
                          flexShrink="0"
                        >
                          {relation}
                        </Box>

                        {/* Inactive Badge */}
                        {isInactive && (
                          <Box
                            bg="#FEE2E2"
                            border="1px solid #FECACA"
                            color="#DC2626"
                            borderRadius="4px"
                            px="6px"
                            py="2px"
                            fontSize="9px"
                            lineHeight="12px"
                            fontWeight="600"
                            whiteSpace="nowrap"
                            flexShrink="0"
                          >
                            INACTIVE
                          </Box>
                        )}
                      </HStack>

                      <Box
                        flexShrink="0"
                        bg={status === "Active" ? "#E4F5E8" : "#FEE2E2"}
                        border="1px solid"
                        borderColor={status === "Active" ? "#C8E6CF" : "#FECACA"}
                        color={status === "Active" ? "#25813B" : "#DC2626"}
                        borderRadius="4px"
                        px="7px"
                        py="3px"
                        fontSize="10px"
                        lineHeight="12px"
                        fontWeight="500"
                      >
                        {status}
                      </Box>
                    </Flex>

                    {/* FAMILY */}
                    <Text
                      mt="9px"
                      fontSize="11px"
                      fontWeight="600"
                      color={isInactive ? "#666666" : NAVY_LIGHT}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {family}
                    </Text>

                    {/* FAMILY HEAD */}
                    <Flex mt="5px" gap="4px" align="center">
                      <Text fontSize="10px" color={MUTED}>
                        Family Head:
                      </Text>
                      <Text
                        fontSize="10px"
                        fontWeight="600"
                        color={isInactive ? "#666666" : NAVY_LIGHT}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {familyHead}
                      </Text>
                    </Flex>

                    {/* AGE */}
                    <Text mt="5px" fontSize="10px" color={MUTED}>
                      {age !== "—" ? `${age} Years` : "—"}
                    </Text>

                    {/* PHONE */}
                    <Text mt="3px" fontSize="10px" color={MUTED}>
                      {phone}
                    </Text>

                    {/* ACTION BUTTONS */}
                    <Flex
                      position="absolute"
                      right="9px"
                      bottom="8px"
                      gap="3px"
                    >
                      {/* VIEW */}
                      <IconButton
                        aria-label="View dependent"
                        variant="ghost"
                        w="28px"
                        h="28px"
                        minW="28px"
                        color={isInactive ? "#666666" : RED}
                        borderRadius="4px"
                        onClick={() =>
                          navigate(`/family-heads/${headId}/members/${member.id}`)
                        }
                        _hover={{ bg: "#FFF2F3" }}
                      >
                        <LuEye size={17} />
                      </IconButton>

                      {/* PROMOTE - Only show for active members */}
                      {canPromote && !isInactive && (
                        <IconButton
                          aria-label="Promote to Family Head (New House)"
                          variant="ghost"
                          w="28px"
                          h="28px"
                          minW="28px"
                          color={RED}
                          borderRadius="4px"
                          isLoading={promoting === member.id}
                          onClick={() => handlePromote(member.id, name, member)}
                          _hover={{ bg: "#FFF2F3" }}
                          title="Promote to Family Head (Create New House)"
                        >
                          <LuUserCog size={17} />
                        </IconButton>
                      )}

                      {/* EDIT */}
                      <IconButton
                        aria-label="Edit dependent"
                        variant="ghost"
                        w="28px"
                        h="28px"
                        minW="28px"
                        color={isInactive ? "#666666" : RED}
                        borderRadius="4px"
                        onClick={() =>
                          navigate(`/family-heads/${headId}/members/${member.id}/edit`)
                        }
                        _hover={{ bg: "#FFF2F3" }}
                      >
                        <LuPencil size={17} />
                      </IconButton>
                    </Flex>
                  </Box>
                );
              })}
            </Grid>
          )}

          {/* PAGINATION */}
          <Flex
            justify="space-between"
            align="center"
            mt="16px"
            gap="15px"
            flexWrap="wrap"
          >
            <Text color="#68758F" fontSize="11px">
              Showing {showingFrom}-{showingTo} of {totalItems} dependents
            </Text>

            <HStack gap="5px">
              <Button
                h="28px"
                px="10px"
                bg="white"
                border="1px solid #E0E5EC"
                borderRadius="4px"
                color={safePage === 1 ? "#B7BFCC" : NAVY}
                fontSize="10px"
                fontWeight="400"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                _disabled={{ opacity: 1 }}
              >
                <LuChevronLeft size={12} />
                <Text ml="3px">Previous</Text>
              </Button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <Text key={`dots-${index}`} fontSize="11px" color="#77839A" px="3px">
                    ...
                  </Text>
                ) : (
                  <Button
                    key={page}
                    h="28px"
                    minW="28px"
                    px="5px"
                    bg={page === safePage ? RED : "white"}
                    color={page === safePage ? "white" : NAVY}
                    border="1px solid"
                    borderColor={page === safePage ? RED : "#E0E5EC"}
                    borderRadius="4px"
                    fontSize="10px"
                    fontWeight="500"
                    onClick={() => setCurrentPage(page)}
                    _hover={{
                      bg: page === safePage ? RED_DARK : "#F8F9FB",
                    }}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                h="28px"
                px="10px"
                bg="white"
                border="1px solid #E0E5EC"
                borderRadius="4px"
                color={safePage === totalPages ? "#B7BFCC" : NAVY}
                fontSize="10px"
                fontWeight="400"
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                _disabled={{ opacity: 1 }}
              >
                <Text mr="3px">Next</Text>
                <LuChevronRight size={12} />
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default MemberListUnderHeadPage;