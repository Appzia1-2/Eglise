// src/pages/LegacyDeathListPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box, Button, Container, Flex, Heading, HStack, Input,
  SimpleGrid, Text, VStack,
} from "@chakra-ui/react";

import {
  LuCalendarDays, LuChevronLeft, LuChevronRight, LuEye,
  LuPencil, LuPlus, LuSearch, LuFilter, LuUser, LuUsers,
  LuArchive, LuFlower,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";
const PRIMARY_BLUE = "#1F3A7D";
const SECONDARY_BLUE = "#315AB5";
const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const LIGHT_RED_BG = "#FFF5F7";

const PAGE_SIZE = 8;

const LegacyDeathListPage = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    search: "", gender: "ALL", year: "ALL", date: "",
  });

  const loadData = async () => {
    try {
      setLoading(true); setError("");
      const res = await apiClient.get("/api/registry/legacy/deaths/");
      const data = res?.data?.results ?? res?.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading legacy deaths:", err);
      setError(err?.response?.data?.detail ||
        "Unable to load legacy death records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getYear = (r) => {
    const d = r?.died_on ? new Date(r.died_on) : null;
    return d && !Number.isNaN(d.getTime()) ? d.getFullYear() : null;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const normalizeDate = (v) => {
    if (!v) return "";
    const s = String(v);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  };

  const yearOptions = useMemo(() => {
    const set = new Set();
    records.forEach((r) => {
      const y = getYear(r);
      if (y) set.add(y);
    });
    return [...set].sort((a, b) => b - a);
  }, [records]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: search.trim(),
      gender: selectedGender,
      year: selectedYear,
      date: selectedDate,
    });
    setPage(1);
  };

  const filtered = useMemo(() => {
    const kw = appliedFilters.search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !kw ||
        String(r?.name || "").toLowerCase().includes(kw) ||
        String(r?.reg_no || "").toLowerCase().includes(kw) ||
        String(r?.family_name || "").toLowerCase().includes(kw) ||
        String(r?.house_name || "").toLowerCase().includes(kw) ||
        String(r?.tomb_type_name || "").toLowerCase().includes(kw);

      if (!matchesSearch) return false;

      if (appliedFilters.gender !== "ALL" &&
          String(r?.gender || "").toUpperCase() !== appliedFilters.gender)
        return false;

      if (appliedFilters.year !== "ALL" &&
          String(getYear(r)) !== String(appliedFilters.year)) return false;

      if (appliedFilters.date &&
          normalizeDate(r?.died_on) !== appliedFilters.date) return false;

      return true;
    });
  }, [records, appliedFilters]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const maleCount = records.filter((r) =>
    String(r?.gender || "").toUpperCase() === "MALE").length;
  const femaleCount = records.filter((r) =>
    String(r?.gender || "").toUpperCase() === "FEMALE").length;

  const thisMonth = records.filter((r) => {
    if (!r?.died_on) return false;
    const d = new Date(r.died_on);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, "...", totalPages];
    if (safePage >= totalPages - 2)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safePage, "...", totalPages];
  };

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="1400px" px={{ base: 3, md: 4, lg: 5 }}
                 pt={{ base: 2, md: 3 }} pb={{ base: 4, md: 5 }} flex="1">

        <HStack gap={1.5} mb={0} color={SECONDARY_BLUE} fontSize="11px">
          <Text>Masters</Text>
          <Text>/</Text>
          <Text fontWeight="500">Legacy Death Register</Text>
        </HStack>

        <Flex justify="space-between" align="center"
              direction={{ base: "column", md: "row" }} gap={2} mb={3}>
          <Box flex="1">
            <Text fontSize="9px" fontWeight="700" color={PRIMARY_RED}
                  mb={0.5} letterSpacing="0.5px">
              LEGACY DEATH REGISTER
            </Text>
            <Heading color={PRIMARY_BLUE}
                     fontSize={{ base: "22px", md: "25px" }}
                     fontWeight="700" lineHeight="1.15" mb={0.5}>
              Historical Death Records
            </Heading>
            <Text color={SECONDARY_TEXT} fontSize="11px">
              Back-filled deaths from old register books. Not linked to members.
            </Text>
          </Box>
          <Button bg={PRIMARY_RED} color="white" px={4} h="34px"
                  fontSize="11px" fontWeight="600" borderRadius="5px"
                  onClick={() => navigate("/legacy/death/add")}
                  _hover={{ bg: DARK_RED }} flexShrink={0}>
            <LuPlus size={15} style={{ marginRight: "6px" }} />
            Add Legacy Death
          </Button>
        </Flex>

        <Flex bg="white" border={`1px solid ${BORDER_COLOR}`}
              borderRadius="7px" mb={3} align="stretch" px={1} py={1}
              direction={{ base: "column", md: "row" }}
              minH={{ base: "auto", md: "68px" }}>
          <HorizontalStatItem icon={<LuArchive size={23} color={PRIMARY_RED} />}
                              value={records.length} label="Total Records" />
          <Divider />
          <HorizontalStatItem icon={<LuUser size={23} color={PRIMARY_RED} />}
                              value={maleCount} label="Male" />
          <Divider />
          <HorizontalStatItem icon={<LuUser size={23} color={PRIMARY_RED} />}
                              value={femaleCount} label="Female" />
          <Divider />
          <HorizontalStatItem icon={<LuCalendarDays size={23} color={PRIMARY_RED} />}
                              value={thisMonth} label="This Month" />
        </Flex>

        <Flex align="center" gap={2} mb={3}
              direction={{ base: "column", lg: "row" }}>
          <Box position="relative" flex="1" minW="0"
               w={{ base: "100%", lg: "auto" }}>
            <Box position="absolute" left="10px" top="50%"
                 transform="translateY(-50%)" color={SECONDARY_TEXT} zIndex={1}>
              <LuSearch size={14} />
            </Box>
            <Input value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                   placeholder="Search name, reg no., family, house or tomb type"
                   pl="32px" h="34px" fontSize="11px"
                   borderColor={BORDER_COLOR} borderRadius="5px"
                   color={TEXT_COLOR}
                   _placeholder={{ color: "#8B98AB" }}
                   _focus={{ borderColor: PRIMARY_RED,
                             boxShadow: `0 0 0 1px ${PRIMARY_RED}` }} />
          </Box>

          <HStack gap={2} flexShrink={0} flexWrap="wrap"
                  justify={{ base: "stretch", lg: "flex-end" }}>
            <select value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    style={selectStyle}>
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>

            <select value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={selectStyle}>
              <option value="ALL">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <Box position="relative">
              <Box position="absolute" left="9px" top="50%"
                   transform="translateY(-50%)" zIndex={1}
                   pointerEvents="none" color={SECONDARY_TEXT}>
                <LuCalendarDays size={13} />
              </Box>
              <Input type="date" value={selectedDate}
                     onChange={(e) => setSelectedDate(e.target.value)}
                     h="34px" w="145px" pl="29px" fontSize="11px"
                     borderColor={BORDER_COLOR} borderRadius="5px" />
            </Box>

            <Button
              bg={appliedFilters.search !== search.trim() ||
                  appliedFilters.gender !== selectedGender ||
                  appliedFilters.year !== selectedYear ||
                  appliedFilters.date !== selectedDate
                    ? PRIMARY_RED : "white"}
              color={appliedFilters.search !== search.trim() ||
                     appliedFilters.gender !== selectedGender ||
                     appliedFilters.year !== selectedYear ||
                     appliedFilters.date !== selectedDate
                       ? "white" : PRIMARY_RED}
              border="1px solid" borderColor={PRIMARY_RED}
              h="34px" px={3} fontSize="11px" fontWeight="600"
              borderRadius="5px" onClick={handleApplyFilters}
              _hover={{ bg: DARK_RED, color: "white", borderColor: DARK_RED }}>
              <LuFilter size={14} style={{ marginRight: "5px" }} />
              Filter
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Box mb={3} p={2} borderRadius="5px" bg="#FFF5F5"
               border="1px solid #FED7D7">
            <Text color="red.600" fontSize="10px">{error}</Text>
          </Box>
        )}

        <HStack gap={2} mb={2}>
          <Heading color={PRIMARY_BLUE} fontSize="16px" fontWeight="700">
            Legacy Death Records
          </Heading>
          <Text fontSize="10px" color={SECONDARY_TEXT}>
            Showing {totalItems === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + paginated.length, totalItems)} of {totalItems} records
          </Text>
        </HStack>

        {loading && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
               py={10} textAlign="center">
            <Text color={SECONDARY_TEXT} fontSize="11px">
              Loading legacy death records...
            </Text>
          </Box>
        )}

        {!loading && filtered.length === 0 && (
          <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
               py={10} textAlign="center">
            <LuFlower size={34} color="#C8CFD9"
                      style={{ margin: "0 auto 8px" }} />
            <Text color={TEXT_COLOR} fontSize="13px" fontWeight="600">
              No legacy death records found
            </Text>
            <Text color={SECONDARY_TEXT} fontSize="10px" mt={1}>
              Try changing your search or filter options.
            </Text>
            <Button mt={3} bg={PRIMARY_RED} color="white"
                    fontSize="10px" h="30px"
                    onClick={() => navigate("/legacy/death/add")}
                    _hover={{ bg: DARK_RED }}>
              <LuPlus size={13} style={{ marginRight: "5px" }} />
              Add Legacy Death
            </Button>
          </Box>
        )}

        {!loading && paginated.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                      gap={{ base: 2.5, md: 3 }} mb={3}>
            {paginated.map((r) => (
              <LegacyDeathCard key={r.id} record={r}
                name={r?.name || "-"}
                formatDate={formatDate}
                onView={() => navigate(`/legacy/death/${r.id}`)}
                onEdit={() => navigate(`/legacy/death/${r.id}/edit`)} />
            ))}
          </SimpleGrid>
        )}

        {!loading && filtered.length > 0 && (
          <Flex align="center" justify="flex-end" gap={3} mt={1} mb={1}>
            <Text fontSize="10px" color={SECONDARY_TEXT} whiteSpace="nowrap">
              Showing{" "}
              <Text as="span" fontWeight="600" color={TEXT_COLOR}>
                {totalItems === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + paginated.length, totalItems)}
              </Text>{" "}
              of{" "}
              <Text as="span" fontWeight="600" color={TEXT_COLOR}>
                {totalItems}
              </Text>{" "}
              records
            </Text>

            <HStack gap={1} flexWrap="wrap" justify="flex-end">
              <Button variant="outline" h="29px" minW="29px" px={2}
                      borderColor={BORDER_COLOR} color={SECONDARY_TEXT}
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      _hover={{ bg: LIGHT_RED_BG, borderColor: PRIMARY_RED,
                                color: PRIMARY_RED }}
                      _disabled={{ opacity: 0.4, cursor: "not-allowed" }}>
                <LuChevronLeft size={14} />
              </Button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <Text key={`d-${i}`} px="4px" fontSize="10px"
                        color={SECONDARY_TEXT}>...</Text>
                ) : (
                  <Button key={p} h="29px" minW="29px" px={1}
                          border="1px solid"
                          borderColor={safePage === p ? PRIMARY_RED : BORDER_COLOR}
                          bg={safePage === p ? PRIMARY_RED : "white"}
                          color={safePage === p ? "white" : SECONDARY_TEXT}
                          onClick={() => setPage(p)}
                          _hover={{ bg: safePage === p ? DARK_RED : LIGHT_RED_BG,
                                    borderColor: PRIMARY_RED,
                                    color: safePage === p ? "white" : PRIMARY_RED }}
                          fontSize="10px" fontWeight="600" borderRadius="4px">
                    {p}
                  </Button>
                )
              )}

              <Button variant="outline" h="29px" minW="29px" px={2}
                      borderColor={BORDER_COLOR} color={SECONDARY_TEXT}
                      disabled={safePage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      _hover={{ bg: LIGHT_RED_BG, borderColor: PRIMARY_RED,
                                color: PRIMARY_RED }}
                      _disabled={{ opacity: 0.4, cursor: "not-allowed" }}>
                <LuChevronRight size={14} />
              </Button>
            </HStack>
          </Flex>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

const selectStyle = {
  height: "34px", minWidth: "145px",
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: "5px", padding: "0 28px 0 9px",
  fontSize: "11px", color: TEXT_COLOR,
  background: "white", outline: "none",
};

const Divider = () => (
  <Box display={{ base: "none", md: "block" }}
       width="1px" height="42px" bg={BORDER_COLOR} alignSelf="center" />
);

const HorizontalStatItem = ({ icon, value, label }) => (
  <Flex flex="1" align="center" justify="flex-start" gap={3}
        px={{ base: 3, md: 4 }} py={{ base: 2.5, md: 2.5 }}
        direction={{ base: "column", md: "row" }}
        textAlign={{ base: "center", md: "left" }}>
    <Box flexShrink={0}>{icon}</Box>
    <VStack align={{ base: "center", md: "flex-start" }} gap={0}>
      <Text fontSize="9px" color={SECONDARY_BLUE} fontWeight="500"
            letterSpacing="0.2px">
        {label}
      </Text>
      <Text fontSize="21px" fontWeight="700" color={PRIMARY_BLUE}
            lineHeight="1.05" mt="1px">
        {value}
      </Text>
    </VStack>
  </Flex>
);

const LegacyDeathCard = ({ record, name, formatDate, onView, onEdit }) => (
  <Box border={`1px solid ${BORDER_COLOR}`} borderRadius="6px"
       bg="white" display="flex" flexDirection="column"
       transition="all 0.2s ease" overflow="hidden" minH="0"
       _hover={{ boxShadow: "0 4px 12px rgba(24,35,56,0.1)",
                 borderColor: "#B8C2D2" }}>
    <Flex px={3} pt={2.5} pb={1.5} justify="space-between"
          align="flex-start" gap={2}>
      <Text color={PRIMARY_BLUE} fontSize="12px" fontWeight="700"
            lineHeight="1.3" flex="1" minW={0} noOfLines={1}>
        {name}
      </Text>
      <Box flexShrink={0} bg={LIGHT_RED_BG} color={PRIMARY_RED}
           border="1px solid #F4A3B2" px="6px" py="1.5px"
           borderRadius="3px" whiteSpace="nowrap">
        <Text fontSize="8px" fontWeight="700" letterSpacing="0.2px">
          LEGACY
        </Text>
      </Box>
    </Flex>

    <Flex px={3} gap={3} mb={1.5}>
      <Box flex="1" minW={0}>
        <Text fontSize="8px" color={TEXT_COLOR} fontWeight="700"
              mb="1px" letterSpacing="0.2px">
          Reg No.
        </Text>
        <Text fontSize="10px" color={PRIMARY_BLUE} fontWeight="600"
              noOfLines={1}>
          {record?.reg_no || "-"}
        </Text>
      </Box>
      <Box flex="1" minW={0}>
        <Text fontSize="8px" color={TEXT_COLOR} fontWeight="700"
              mb="1px" letterSpacing="0.2px">
          Died On
        </Text>
        <Text fontSize="10px" color={TEXT_COLOR} noOfLines={1}>
          {formatDate(record?.died_on)}
        </Text>
      </Box>
    </Flex>

    <Flex px={3} gap={3} mb={1.5}>
      <Box flex="1" minW={0}>
        <Text fontSize="8px" color={TEXT_COLOR} fontWeight="700"
              mb="1px" letterSpacing="0.2px">
          Age at Death
        </Text>
        <Text fontSize="10px" color={TEXT_COLOR} noOfLines={1}>
          {record?.age_at_death ?? "-"}
        </Text>
      </Box>
      <Box flex="1" minW={0}>
        <Text fontSize="8px" color={TEXT_COLOR} fontWeight="700"
              mb="1px" letterSpacing="0.2px">
          Tomb Type
        </Text>
        <Text fontSize="10px" color={TEXT_COLOR} noOfLines={1}>
          {record?.tomb_type_name || "-"}
        </Text>
      </Box>
    </Flex>

    <Flex px={3} py={1.5} justify="flex-end" align="center" gap={1}>
      <Button variant="ghost" size="sm" h="24px" minW="24px" p={0}
              color={PRIMARY_RED} borderRadius="3px" onClick={onView}
              title="View" _hover={{ bg: LIGHT_RED_BG }}>
        <LuEye size={14} strokeWidth={1.5} />
      </Button>
      <Button variant="ghost" size="sm" h="24px" minW="24px" p={0}
              color={PRIMARY_RED} borderRadius="3px" onClick={onEdit}
              title="Edit" _hover={{ bg: LIGHT_RED_BG }}>
        <LuPencil size={14} strokeWidth={1.5} />
      </Button>
    </Flex>
  </Box>
);

export default LegacyDeathListPage;