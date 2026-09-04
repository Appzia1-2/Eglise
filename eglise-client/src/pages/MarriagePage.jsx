import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFileText,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuUserRound,
  LuUsersRound,
  LuHeart,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listMarriages,
  deleteMarriage,
  listFamilies,
  listMembers,
  listRelationships,
  getDheshaKuri,
} from "../api/registryServices";

/* ============================================================
   COLORS
============================================================ */

const PRIMARY_RED = "#C90016";
const DARK_RED = "#A90012";
const PRIMARY_BLUE = "#111F52";
const TEXT_COLOR = "#172554";
const SECONDARY_TEXT = "#667085";
const BORDER_COLOR = "#DCE3EE";
const LIGHT_RED_BG = "#FFF5F7";
const LIGHT_BLUE_BG = "#F5F7FF";

const PAGE_SIZE = 8;

/* ============================================================
   HELPERS
============================================================ */

const getGroomName = (marriage) => {
  return (
    marriage?.groom_member?.name ||
    marriage?.groom_name ||
    "Unknown"
  );
};

const getBrideName = (marriage) => {
  return (
    marriage?.bride_member?.name ||
    marriage?.bride_name ||
    "Unknown"
  );
};

const getFamilyName = (marriage, families) => {
  const groomFamily = marriage?.groom_member?.family;
  const brideFamily = marriage?.bride_member?.family;
  
  const familyId = groomFamily?.id ?? brideFamily?.id ?? groomFamily ?? brideFamily;
  
  const family = families.find(
    (f) => String(f.id) === String(familyId)
  );
  
  return (
    family?.family_name ||
    marriage?.groom_member?.family_name ||
    marriage?.bride_member?.family_name ||
    "N/A"
  );
};

const getBrideType = (marriage) => {
  if (marriage?.marriage_type === "TRANSFER_BRIDE") {
    return "TRANSFER";
  }
  return marriage?.bride_member ? "SAME_PARISH" : "OTHER_PARISH";
};

const getMarriageTypeName = (marriage) => {
  return marriage?.marriage_type === "TRANSFER_BRIDE" ? "TRANSFER" : "SACRAMENTAL";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeDate = (value) => {
  if (!value) return "";
  const stringValue = String(value);
  if (stringValue.includes("T")) return stringValue.split("T")[0];
  if (stringValue.includes(" ")) return stringValue.split(" ")[0];
  return stringValue;
};

/* ============================================================
   STAT ITEM
============================================================ */

const MarriageStatItem = ({ icon, value, label }) => {
  return (
    <Flex
      flex="1"
      align="center"
      gap={3}
      px={{ base: 3, md: 4 }}
      py={2}
      minW={0}
    >
      <Flex
        w="42px"
        h="42px"
        align="center"
        justify="center"
        flexShrink={0}
      >
        {icon}
      </Flex>

      <Box minW={0}>
        <Text
          fontSize="22px"
          lineHeight="1"
          fontWeight="700"
          color={PRIMARY_BLUE}
        >
          {value}
        </Text>
        <Text mt={1} fontSize="10px" color={SECONDARY_TEXT} whiteSpace="nowrap">
          {label}
        </Text>
      </Box>
    </Flex>
  );
};

/* ============================================================
   MARRIAGE CARD
============================================================ */

const MarriageCard = ({
  marriage,
  families,
  onView,
  onEdit,
  onDelete,
  onDheshaKuri,
}) => {
  const isTransfer = marriage?.marriage_type === "TRANSFER_BRIDE";
  const groomName = getGroomName(marriage);
  const brideName = getBrideName(marriage);
  const marriageType = marriage?.marriage_type === "ADD_BRIDE" ? "Sacramental" : "Transfer";
  const brideType = getBrideType(marriage);
  
  const brideTypeLabel = 
    brideType === "SAME_PARISH" ? "Same Parish Bride" :
    brideType === "OTHER_PARISH" ? "Other Parish Bride" :
    "Transfer Bride";

  return (
    <Box
      bg="white"
      border={`1px solid ${BORDER_COLOR}`}
      borderRadius="6px"
      px={3}
      py={2.5}
      minH="150px"
      transition="all 0.2s"
      _hover={{
        boxShadow: "sm",
        borderColor: "#C9D1DD",
      }}
    >
      {/* TOP ROW */}
      <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
        <Text
          color={PRIMARY_BLUE}
          fontSize="13px"
          fontWeight="700"
          lineHeight="1.2"
          noOfLines={1}
        >
          {groomName} & {brideName}
        </Text>

        <Box
          flexShrink={0}
          border={`1px solid ${PRIMARY_RED}`}
          color={PRIMARY_RED}
          bg="white"
          borderRadius="4px"
          px={2}
          py="2px"
          fontSize="8px"
          fontWeight="600"
          whiteSpace="nowrap"
        >
          {brideTypeLabel}
        </Box>
      </Flex>

      {/* DETAILS */}
      <SimpleGrid columns={2} columnGap={3} rowGap={1.5}>
        <Box>
          <Text fontSize="8px" fontWeight="700" color={PRIMARY_BLUE}>
            REG NO.
          </Text>
          <Text fontSize="10px" color={PRIMARY_BLUE} mt="2px">
            {marriage?.register_number || "-"}
          </Text>
        </Box>

        <Box>
          <Text fontSize="8px" fontWeight="700" color={PRIMARY_BLUE}>
            MARRIAGE TYPE
          </Text>
          <Text fontSize="10px" color={PRIMARY_BLUE} mt="2px">
            {marriageType}
          </Text>
        </Box>

        <Box>
          <Text fontSize="8px" fontWeight="700" color={PRIMARY_BLUE}>
            GROOM NAME
          </Text>
          <Text fontSize="10px" color={PRIMARY_BLUE} mt="2px" noOfLines={1}>
            {groomName}
          </Text>
        </Box>

        <Box>
          <Text fontSize="8px" fontWeight="700" color={PRIMARY_BLUE}>
            MARRIAGE DATE
          </Text>
          <Text fontSize="10px" color={PRIMARY_BLUE} mt="2px">
            {formatDate(marriage?.date)}
          </Text>
        </Box>

        <Box>
          <Text fontSize="8px" fontWeight="700" color={PRIMARY_BLUE}>
            BRIDE NAME
          </Text>
          <Text fontSize="10px" color={PRIMARY_BLUE} mt="2px" noOfLines={1}>
            {brideName}
          </Text>
        </Box>
      </SimpleGrid>

      {/* ACTIONS */}
      <Flex justify="flex-end" align="center" gap={3} mt={2}>
        {isTransfer && (
          <Icon
            as={LuFileText}
            boxSize="16px"
            color="teal.500"
            cursor="pointer"
            title="Dhesha Kuri"
            onClick={() => onDheshaKuri(marriage)}
            _hover={{ color: "teal.700" }}
          />
        )}

        <Icon
          as={LuEye}
          boxSize="16px"
          color={PRIMARY_RED}
          cursor="pointer"
          title="View Marriage"
          onClick={() => onView(marriage)}
          _hover={{ transform: "scale(1.1)" }}
        />

        <Icon
          as={LuPencil}
          boxSize="16px"
          color={PRIMARY_RED}
          cursor="pointer"
          title="Edit Marriage"
          onClick={() => onEdit(marriage)}
          _hover={{ transform: "scale(1.1)" }}
        />
      </Flex>
    </Box>
  );
};

/* ============================================================
   MARRIAGE PAGE
============================================================ */

const MarriagePage = () => {
  const navigate = useNavigate();
  
  const [marriages, setMarriages] = useState([]);
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedBrideType, setSelectedBrideType] = useState("ALL");
  const [selectedMarriageType, setSelectedMarriageType] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  const [page, setPage] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    brideType: "ALL",
    marriageType: "ALL",
    date: "",
  });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewMarriage, setViewMarriage] = useState(null);

  const [isDheshaKuriOpen, setIsDheshaKuriOpen] = useState(false);
  const [dheshaKuriData, setDheshaKuriData] = useState(null);
  const [isDheshaKuriLoading, setIsDheshaKuriLoading] = useState(false);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [marriageRes, familyRes, membersRes, relationshipsRes] = await Promise.all([
        listMarriages(),
        listFamilies(),
        listMembers(),
        listRelationships(),
      ]);

      const marriageData = marriageRes?.data?.results ?? marriageRes?.data ?? [];
      const familyData = familyRes?.data?.results ?? familyRes?.data ?? [];
      const membersData = membersRes?.data?.results ?? membersRes?.data ?? [];
      const relationshipsData = relationshipsRes?.data?.results ?? relationshipsRes?.data ?? [];

      setMarriages(Array.isArray(marriageData) ? marriageData : []);
      setFamilies(Array.isArray(familyData) ? familyData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setRelationships(Array.isArray(relationshipsData) ? relationshipsData : []);
    } catch (err) {
      console.error("Error loading marriage register:", err);
      setError(err?.response?.data?.detail || "Unable to load marriage register records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ==========================================================
     FILTER
  ========================================================== */

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: search.trim(),
      brideType: selectedBrideType,
      marriageType: selectedMarriageType,
      date: selectedDate,
    });
    setPage(1);
  };

  const filteredMarriages = useMemo(() => {
    const keyword = appliedFilters.search.trim().toLowerCase();

    return marriages.filter((marriage) => {
      const groom = getGroomName(marriage).toLowerCase();
      const bride = getBrideName(marriage).toLowerCase();
      const registerNumber = String(marriage?.register_number || "").toLowerCase();
      const familyName = getFamilyName(marriage, families).toLowerCase();

      const matchesSearch =
        !keyword ||
        groom.includes(keyword) ||
        bride.includes(keyword) ||
        registerNumber.includes(keyword) ||
        familyName.includes(keyword);

      if (!matchesSearch) return false;

      if (appliedFilters.brideType !== "ALL" && getBrideType(marriage) !== appliedFilters.brideType) {
        return false;
      }

      if (appliedFilters.marriageType !== "ALL" && getMarriageTypeName(marriage) !== appliedFilters.marriageType) {
        return false;
      }

      if (appliedFilters.date && normalizeDate(marriage?.date) !== appliedFilters.date) {
        return false;
      }

      return true;
    });
  }, [marriages, families, appliedFilters]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const totalMarriages = marriages.length;
  const sameParishBrides = marriages.filter(
    (marriage) => marriage?.marriage_type === "ADD_BRIDE" && !!marriage?.bride_member
  ).length;
  const otherParishBrides = marriages.filter(
    (marriage) => marriage?.marriage_type === "ADD_BRIDE" && !marriage?.bride_member
  ).length;
  const transferBrides = marriages.filter(
    (marriage) => marriage?.marriage_type === "TRANSFER_BRIDE"
  ).length;

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalItems = filteredMarriages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedMarriages = filteredMarriages.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", safePage, "...", totalPages];
  };

  /* ==========================================================
     ACTIONS - NAVIGATION
  ========================================================== */

  // Navigate to Add page
  const handleAdd = () => {
    navigate("/marriage/add");
  };

  // Navigate to Edit page
  const handleEdit = (marriage) => {
    navigate(`/marriage/${marriage.id}/edit`);
  };

  /* ==========================================================
     VIEW
  ========================================================== */

  const handleView = (marriage) => {
    setViewMarriage(marriage);
    setIsViewOpen(true);
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async (marriage) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete marriage ${marriage?.register_number || ""}?`
    );
    if (!confirmed) return;

    try {
      await deleteMarriage(marriage.id);
      await loadData();
    } catch (err) {
      console.error("Error deleting marriage:", err);
      alert(err?.response?.data?.detail || JSON.stringify(err?.response?.data || "Unable to delete marriage."));
    }
  };

  /* ==========================================================
     DHESHA KURI
  ========================================================== */

  const handleViewDheshaKuri = async (marriageId) => {
    setIsDheshaKuriLoading(true);
    setIsDheshaKuriOpen(true);
    setDheshaKuriData(null);

    try {
      const res = await getDheshaKuri(marriageId);
      setDheshaKuriData(res.data);
    } catch (error) {
      console.error("Error fetching Dhesha Kuri:", error);
    } finally {
      setIsDheshaKuriLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container
        maxW="1400px"
        px={{ base: 3, md: 4, lg: 5 }}
        pt={{ base: 2, md: 3 }}
        pb={{ base: 4, md: 5 }}
        flex="1"
      >
        {/* BREADCRUMB */}
        <HStack gap={1.5} mb={0} color="#315AB5" fontSize="11px">
          <Text>Masters</Text>
          <Text>/</Text>
          <Text fontWeight="500">Marriage Register</Text>
        </HStack>

        {/* HEADER */}
        <Flex
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={2}
          mb={3}
        >
          <Box flex="1">
            <Text fontSize="9px" fontWeight="700" color={PRIMARY_RED} mb={0.5} letterSpacing="0.5px">
              MARRIAGE REGISTER
            </Text>
            <Heading
              color={PRIMARY_BLUE}
              fontSize={{ base: "22px", md: "25px" }}
              fontWeight="700"
              lineHeight="1.15"
              mb={0.5}
            >
              Marriage Register Dashboard
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="11px">
              Manage parish marriage registrations, other parish brides and transfer bride records.
            </Text>
          </Box>

          <Button
            bg={PRIMARY_RED}
            color="white"
            px={4}
            h="34px"
            fontSize="11px"
            fontWeight="600"
            borderRadius="5px"
            onClick={handleAdd}
            _hover={{ bg: DARK_RED }}
            flexShrink={0}
          >
            <LuPlus size={15} style={{ marginRight: "6px" }} />
            Add Marriage
          </Button>
        </Flex>

        {/* STATISTICS */}
        <Flex
          bg="white"
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="7px"
          mb={3}
          align="stretch"
          px={1}
          py={1}
          gap={0}
          direction={{ base: "column", md: "row" }}
          minH={{ base: "auto", md: "68px" }}
        >
          <MarriageStatItem
            icon={<LuHeart size={27} color={PRIMARY_RED} />}
            value={totalMarriages}
            label="Total Marriages"
          />

          <Box display={{ base: "none", md: "block" }} width="1px" height="42px" bg={BORDER_COLOR} alignSelf="center" />

          <MarriageStatItem
            icon={<LuUsersRound size={27} color={PRIMARY_RED} />}
            value={sameParishBrides}
            label="Same Parish Brides"
          />

          <Box display={{ base: "none", md: "block" }} width="1px" height="42px" bg={BORDER_COLOR} alignSelf="center" />

          <MarriageStatItem
            icon={<LuUserRound size={27} color={PRIMARY_RED} />}
            value={otherParishBrides}
            label="Other Parish Brides"
          />

          <Box display={{ base: "none", md: "block" }} width="1px" height="42px" bg={BORDER_COLOR} alignSelf="center" />

          <MarriageStatItem
            icon={<LuCalendarDays size={27} color={PRIMARY_RED} />}
            value={transferBrides}
            label="Transfer Brides"
          />
        </Flex>

        {/* SEARCH & FILTER */}
        <Flex align="center" gap={2} mb={3} direction={{ base: "column", lg: "row" }}>
          <Box position="relative" flex="1" minW="0" w={{ base: "100%", lg: "auto" }}>
            <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" color={SECONDARY_TEXT} zIndex={1}>
              <LuSearch size={14} />
            </Box>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyFilters();
              }}
              placeholder="Search groom, bride, reg no. or family"
              pl="32px"
              h="34px"
              fontSize="11px"
              borderColor={BORDER_COLOR}
              borderRadius="5px"
              color={TEXT_COLOR}
              _placeholder={{ color: "#8B98AB" }}
              _focus={{ borderColor: PRIMARY_RED, boxShadow: `0 0 0 1px ${PRIMARY_RED}` }}
            />
          </Box>

          <HStack gap={2} flexShrink={0} flexWrap="wrap" justify={{ base: "stretch", lg: "flex-end" }}>
            <select
              value={selectedBrideType}
              onChange={(e) => setSelectedBrideType(e.target.value)}
              style={{
                height: "34px",
                minWidth: "145px",
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: "5px",
                padding: "0 28px 0 9px",
                fontSize: "11px",
                color: TEXT_COLOR,
                background: "white",
                outline: "none",
              }}
            >
              <option value="ALL">All Bride Types</option>
              <option value="SAME_PARISH">Same Parish Bride</option>
              <option value="OTHER_PARISH">Other Parish Bride</option>
              <option value="TRANSFER">Transfer Bride</option>
            </select>

            <select
              value={selectedMarriageType}
              onChange={(e) => setSelectedMarriageType(e.target.value)}
              style={{
                height: "34px",
                minWidth: "145px",
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: "5px",
                padding: "0 28px 0 9px",
                fontSize: "11px",
                color: TEXT_COLOR,
                background: "white",
                outline: "none",
              }}
            >
              <option value="ALL">All Marriage Types</option>
              <option value="SACRAMENTAL">Sacramental</option>
              <option value="TRANSFER">Transfer</option>
            </select>

            <Box position="relative">
              <Box position="absolute" left="9px" top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none" color={SECONDARY_TEXT}>
                <LuCalendarDays size={13} />
              </Box>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                h="34px"
                w="145px"
                pl="29px"
                fontSize="11px"
                borderColor={BORDER_COLOR}
                borderRadius="5px"
              />
            </Box>

            <Button
              bg={
                appliedFilters.search !== search.trim() ||
                appliedFilters.brideType !== selectedBrideType ||
                appliedFilters.marriageType !== selectedMarriageType ||
                appliedFilters.date !== selectedDate
                  ? PRIMARY_RED
                  : "white"
              }
              color={
                appliedFilters.search !== search.trim() ||
                appliedFilters.brideType !== selectedBrideType ||
                appliedFilters.marriageType !== selectedMarriageType ||
                appliedFilters.date !== selectedDate
                  ? "white"
                  : PRIMARY_RED
              }
              border="1px solid"
              borderColor={PRIMARY_RED}
              h="34px"
              px={3}
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              onClick={handleApplyFilters}
              _hover={{ bg: DARK_RED, color: "white", borderColor: DARK_RED }}
            >
              <LuFilter size={14} style={{ marginRight: "5px" }} />
              Filter
            </Button>
          </HStack>
        </Flex>

        {/* ERROR */}
        {error && (
          <Box mb={3} p={2} borderRadius="5px" bg="#FFF5F5" border="1px solid #FED7D7">
            <Text color="red.600" fontSize="10px">
              {error}
            </Text>
          </Box>
        )}

        {/* RECORD TITLE */}
        <HStack gap={2} mb={2}>
          <Heading color={PRIMARY_BLUE} fontSize="16px" fontWeight="700">
            Marriage Records
          </Heading>
          <Text fontSize="10px" color={SECONDARY_TEXT}>
            Showing {totalItems === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + paginatedMarriages.length, totalItems)} of {totalItems} records
          </Text>
        </HStack>

        {/* LOADING */}
        {loading && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" py={10} textAlign="center">
            <Spinner color={PRIMARY_RED} size="lg" />
            <Text color={SECONDARY_TEXT} fontSize="11px" mt={2}>
              Loading marriage records...
            </Text>
          </Box>
        )}

        {/* EMPTY */}
        {!loading && filteredMarriages.length === 0 && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px" py={10} textAlign="center">
            <LuHeart size={34} color="#C8CFD9" style={{ margin: "0 auto 8px" }} />
            <Text color={TEXT_COLOR} fontSize="13px" fontWeight="600">
              No marriage records found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="10px" mt={1}>
              Try changing your search or filter options.
            </Text>
          </Box>
        )}

        {/* MARRIAGE CARDS */}
        {!loading && paginatedMarriages.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
            {paginatedMarriages.map((marriage) => (
              <MarriageCard
                key={marriage.id}
                marriage={marriage}
                families={families}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDheshaKuri={(item) => handleViewDheshaKuri(item.id)}
              />
            ))}
          </SimpleGrid>
        )}

        {/* PAGINATION */}
        {!loading && totalItems > 0 && (
          <Flex justify="space-between" align="center" mt={3} flexWrap="wrap" gap={2}>
            <Text fontSize="10px" color={SECONDARY_TEXT}>
              Showing {startIndex + 1}-{Math.min(startIndex + paginatedMarriages.length, totalItems)} of {totalItems} records
            </Text>

            <HStack gap={1}>
              <Button
                h="30px"
                minW="62px"
                px={2}
                fontSize="10px"
                fontWeight="500"
                border="1px solid"
                borderColor={BORDER_COLOR}
                bg="white"
                color={PRIMARY_BLUE}
                borderRadius="5px"
                disabled={safePage === 1}
                onClick={() => setPage(Math.max(1, safePage - 1))}
                _hover={{ bg: LIGHT_BLUE_BG }}
              >
                <LuChevronLeft size={13} />
                Previous
              </Button>

              {getPageNumbers().map((number, index) =>
                number === "..." ? (
                  <Text key={`dots-${index}`} px={2} color={PRIMARY_BLUE} fontWeight="700" fontSize="11px">
                    ...
                  </Text>
                ) : (
                  <Button
                    key={number}
                    h="30px"
                    minW="32px"
                    px={2}
                    fontSize="10px"
                    borderRadius="5px"
                    bg={safePage === number ? PRIMARY_RED : "white"}
                    color={safePage === number ? "white" : PRIMARY_BLUE}
                    border="1px solid"
                    borderColor={safePage === number ? PRIMARY_RED : BORDER_COLOR}
                    onClick={() => setPage(number)}
                    _hover={{ bg: safePage === number ? DARK_RED : LIGHT_BLUE_BG }}
                  >
                    {number}
                  </Button>
                )
              )}

              <Button
                h="30px"
                minW="52px"
                px={2}
                fontSize="10px"
                fontWeight="500"
                border="1px solid"
                borderColor={BORDER_COLOR}
                bg="white"
                color={PRIMARY_RED}
                borderRadius="5px"
                disabled={safePage === totalPages}
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                _hover={{ bg: LIGHT_RED_BG }}
              >
                Next
                <LuChevronRight size={13} />
              </Button>
            </HStack>
          </Flex>
        )}
      </Container>

      {/* VIEW MARRIAGE */}
      {isViewOpen && viewMarriage && (
        <Box
          position="fixed"
          inset="0"
          bg="blackAlpha.500"
          zIndex={1400}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={() => setIsViewOpen(false)}
        >
          <Box
            bg="white"
            borderRadius="10px"
            w="100%"
            maxW="650px"
            maxH="90vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex bg={PRIMARY_RED} color="white" px={5} py={3} justify="space-between" align="center">
              <Box>
                <Text fontSize="15px" fontWeight="700">Marriage Details</Text>
                <Text fontSize="9px" opacity={0.9}>{viewMarriage.register_number}</Text>
              </Box>
              <Button variant="ghost" color="white" onClick={() => setIsViewOpen(false)} _hover={{ bg: "whiteAlpha.200" }}>
                ✕
              </Button>
            </Flex>

            <Box p={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">REGISTER NUMBER</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE} fontWeight="600">
                    {viewMarriage.register_number || "-"}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">MARRIAGE DATE</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>{formatDate(viewMarriage.date)}</Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">GROOM</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE} fontWeight="600">
                    {getGroomName(viewMarriage)}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">BRIDE</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE} fontWeight="600">
                    {getBrideName(viewMarriage)}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">MARRIAGE TYPE</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>{getMarriageTypeName(viewMarriage)}</Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">FAMILY</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>{getFamilyName(viewMarriage, families)}</Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">GROOM FATHER</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>
                    {viewMarriage.groom_father || viewMarriage.groom_member?.father_name || "-"}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">BRIDE FATHER</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>
                    {viewMarriage.bride_father || viewMarriage.bride_member?.father_name || "-"}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">GROOM MOTHER</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>
                    {viewMarriage.groom_mother || viewMarriage.groom_member?.mother_name || "-"}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="9px" color={SECONDARY_TEXT} fontWeight="700">BRIDE MOTHER</Text>
                  <Text fontSize="12px" color={PRIMARY_BLUE}>
                    {viewMarriage.bride_mother || viewMarriage.bride_member?.mother_name || "-"}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </Box>
        </Box>
      )}

      {/* DHESHA KURI DIALOG */}
      {isDheshaKuriOpen && (
        <Box
          position="fixed"
          inset="0"
          bg="blackAlpha.500"
          zIndex={1500}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={() => setIsDheshaKuriOpen(false)}
        >
          <Box
            bg="white"
            borderRadius="10px"
            w="100%"
            maxW="750px"
            maxH="90vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex bg={PRIMARY_RED} color="white" px={5} py={3} justify="space-between" align="center">
              <Text fontSize="15px" fontWeight="700">Dhesha Kuri Details</Text>
              <Button variant="ghost" color="white" onClick={() => setIsDheshaKuriOpen(false)} _hover={{ bg: "whiteAlpha.200" }}>
                ✕
              </Button>
            </Flex>

            <Box p={5} bg="gray.50">
              {isDheshaKuriLoading ? (
                <Flex justify="center" align="center" py={10}>
                  <Spinner color={PRIMARY_RED} size="xl" />
                </Flex>
              ) : dheshaKuriData ? (
                <VStack align="stretch" gap={4}>
                  <Box bg="white" p={4} borderRadius="7px" border={`1px solid ${BORDER_COLOR}`}>
                    <Heading fontSize="13px" color={PRIMARY_RED} mb={3}>
                      General Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      <Box>
                        <Text fontSize="8px" color={SECONDARY_TEXT} fontWeight="700">CHURCH NAME</Text>
                        <Text fontSize="11px" fontWeight="600">{dheshaKuriData.church_name}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="8px" color={SECONDARY_TEXT} fontWeight="700">TRANSFER TO</Text>
                        <Text fontSize="11px" fontWeight="600">{dheshaKuriData.transfer_to}</Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box bg="white" p={4} borderRadius="7px" border={`1px solid ${BORDER_COLOR}`}>
                      <Heading fontSize="13px" color={PRIMARY_RED} mb={3}>
                        Groom Details
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Name</Text>
                          <Text fontSize="11px" fontWeight="600">{dheshaKuriData.groom_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Age / DOB</Text>
                          <Text fontSize="11px">{dheshaKuriData.groom_age} years ({dheshaKuriData.groom_dob})</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Family / House</Text>
                          <Text fontSize="11px">{dheshaKuriData.groom_family_name} ({dheshaKuriData.groom_house_name})</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Parents</Text>
                          <Text fontSize="11px">F: {dheshaKuriData.groom_father} | M: {dheshaKuriData.groom_mother}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Confession Date</Text>
                          <Text fontSize="11px">{dheshaKuriData.groom_confession_date}</Text>
                        </Box>
                      </VStack>
                    </Box>

                    <Box bg="white" p={4} borderRadius="7px" border={`1px solid ${BORDER_COLOR}`}>
                      <Heading fontSize="13px" color={PRIMARY_RED} mb={3}>
                        Bride Details
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Name</Text>
                          <Text fontSize="11px" fontWeight="600">{dheshaKuriData.bride_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Age / DOB</Text>
                          <Text fontSize="11px">{dheshaKuriData.bride_age} years ({dheshaKuriData.bride_dob})</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Family / House</Text>
                          <Text fontSize="11px">{dheshaKuriData.bride_family_name} ({dheshaKuriData.bride_house_name})</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Parents</Text>
                          <Text fontSize="11px">F: {dheshaKuriData.bride_father} | M: {dheshaKuriData.bride_mother}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="8px" color={SECONDARY_TEXT}>Confession Date</Text>
                          <Text fontSize="11px">{dheshaKuriData.bride_confession_date}</Text>
                        </Box>
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </VStack>
              ) : (
                <Text textAlign="center" py={10} fontSize="12px" color={SECONDARY_TEXT}>
                  No data available.
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Footer />
    </Box>
  );
};

export default MarriagePage;