// src/pages/CommitteePage.jsx

import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuCalendarDays,
  LuCircleCheck,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listCommittees,
  deleteCommittee,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const GREEN = "#1E9E4A";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ==========================================================
// HELPERS
// ==========================================================

const getArrayData = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) return error?.message || "Something went wrong.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  const messages = [];
  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      messages.push(`${field}: ${value.join(" ")}`);
    } else if (value) {
      messages.push(`${field}: ${value}`);
    }
  });

  return messages.length
    ? messages.join(" | ")
    : "Unable to complete the request.";
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateISO = (value) => {
  if (!value) return "-";

  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCommitteeStatus = (committee) => {
  if (!committee?.committee_from_date || !committee?.committee_to_date) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  const today = new Date(`${getTodayString()}T00:00:00`);
  const from = new Date(`${committee.committee_from_date}T00:00:00`);
  const to = new Date(`${committee.committee_to_date}T00:00:00`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  if (today < from) return { key: "UPCOMING", label: "Upcoming" };
  if (today > to) return { key: "COMPLETED", label: "Completed" };
  return { key: "ACTIVE", label: "Active" };
};

const StatusBadge = ({ status }) => {
  const palette = {
    ACTIVE: { bg: "#E7F7EE", color: "#1E9E4A", border: "#B7E4C7" },
    UPCOMING: { bg: "#EAF2FE", color: "#2C5EC9", border: "#B7CEF6" },
    COMPLETED: { bg: "#EEF1F5", color: "#4B5A70", border: "#D6DCE4" },
    UNKNOWN: { bg: "#FFF5E5", color: "#B7791F", border: "#F2D9A6" },
  };

  const c = palette[status.key] || palette.UNKNOWN;

  return (
    <Box
      as="span"
      px={2}
      py="2px"
      borderRadius="5px"
      bg={c.bg}
      border={`1px solid ${c.border}`}
      color={c.color}
      fontSize="11px"
      fontWeight="600"
      display="inline-block"
      whiteSpace="nowrap"
    >
      {status.label}
    </Box>
  );
};

// ==========================================================
// STAT CARD
// ==========================================================

const StatCard = ({ icon, title, value, color }) => (
  <Box
    border="1px solid #DCE2EA"
    borderRadius="8px"
    h="78px"
    px={4}
    bg="white"
    display="flex"
    alignItems="center"
  >
    <Flex align="center" width="100%" height="100%">
      <Box
        width="65px"
        height="100%"
        borderRight="1px solid #DCE2EA"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon
          as={icon}
          boxSize={8}
          color={color || RED}
          strokeWidth={1.6}
        />
      </Box>

      <Box pl={4}>
        <Text
          fontSize="12px"
          color={DARK}
          mb={1}
          fontWeight="600"
        >
          {title}
        </Text>

        <Text
          fontSize="24px"
          fontWeight="700"
          color={DARK}
          lineHeight="1"
        >
          {value}
        </Text>
      </Box>
    </Flex>
  </Box>
);

// ==========================================================
// PAGE
// ==========================================================

const CommitteePage = () => {
  const navigate = useNavigate();

  const [committees, setCommittees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const committeeResponse = await listCommittees();

      setCommittees(getArrayData(committeeResponse));
    } catch (error) {
      console.error("Committee loading error:", error);
      window.alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = useMemo(() => {
    const total = committees.length;

    let active = 0;
    let upcoming = 0;
    let totalMembers = 0;

    committees.forEach((c) => {
      const s = getCommitteeStatus(c).key;
      if (s === "ACTIVE") active++;
      else if (s === "UPCOMING") upcoming++;

      totalMembers += Array.isArray(c.members) ? c.members.length : 0;
    });

    return { total, active, upcoming, totalMembers };
  }, [committees]);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredCommittees = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let result = [...committees];

    if (keyword) {
      result = result.filter((committee) => {
        return (
          String(committee.committee_code || "")
            .toLowerCase()
            .includes(keyword) ||
          String(committee.committee_name || "")
            .toLowerCase()
            .includes(keyword)
        );
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (c) => getCommitteeStatus(c).key === statusFilter
      );
    }

    return result;
  }, [committees, search, statusFilter]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCommittees.length / pageSize)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const paginatedCommittees = filteredCommittees.slice(
    startIndex,
    startIndex + pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleAdd = () => {
    navigate("/committees/add");
  };

  const handleEdit = (committee) => {
    navigate(`/committees/${committee.id}/edit`);
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (committee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${committee.committee_name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteCommittee(committee.id);
      await loadData();
    } catch (error) {
      console.error("Committee delete error:", error);
      window.alert(getErrorMessage(error));
    }
  };

  // ==========================================================
  // PHONE LABEL
  // Shows phones stored inside committee.members (JSON),
  // e.g. "+91 98765 43210  +1 more"
  // ==========================================================

  const getCommitteePhones = (committee) => {
    const membersList = Array.isArray(committee?.members)
      ? committee.members
      : [];

    const phones = membersList
      .map((m) => (m?.phone ? String(m.phone).trim() : ""))
      .filter(Boolean);

    return phones;
  };

  const getPhoneLabel = (phones) => {
    if (phones.length === 0) return "-";
    if (phones.length === 1) return phones[0];
    return `${phones[0]}  +${phones.length - 1} more`;
  };

  // ==========================================================
  // PAGINATION NUMBERS
  // ==========================================================

  const renderPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" w="100%">
        <Box
          w="100%"
          px={{ base: 3, md: 4 }}
          py={{ base: 3, md: 4 }}
        >
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="11px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Committee List</Text>
          </HStack>

          {/* HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={3}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={1}
                letterSpacing="0.4px"
              >
                COMMITTEE MANAGEMENT
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "22px", md: "26px" }}
                lineHeight="1.1"
                mb={1}
              >
                Committee Master
              </Heading>

              <Text color={MUTED} fontSize="11px">
                Manage parish committees, terms and committee members.
              </Text>
            </Box>

            <Button
              bg={PRIMARY_MAROON}
              color="white"
              px={5}
              h="38px"
              fontSize="12px"
              borderRadius="6px"
              onClick={handleAdd}
              _hover={{ bg: "#650A18" }}
              flexShrink={0}
            >
              <Icon as={LuPlus} mr={2} boxSize={4} />
              Add Committee
            </Button>
          </Flex>

          {/* STAT CARDS */}
          <SimpleGrid
            columns={{ base: 1, md: 4 }}
            gap={3}
            mb={3}
          >
            <StatCard
              icon={LuUsers}
              title="Total Committees"
              value={stats.total}
              color={RED}
            />
            <StatCard
              icon={LuCircleCheck}
              title="Active Committees"
              value={stats.active}
              color={GREEN}
            />
            <StatCard
              icon={LuCalendarDays}
              title="Upcoming"
              value={stats.upcoming}
              color={RED}
            />
            <StatCard
              icon={LuUsers}
              title="Total Members"
              value={stats.totalMembers}
              color={RED}
            />
          </SimpleGrid>

          {/* TABLE CARD */}
          <Box
            border="1px solid #DCE2EA"
            borderRadius="8px"
            p={3}
            bg="white"
            w="100%"
          >
            {/* SEARCH / FILTER */}
            <Flex
              gap={3}
              mb={3}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
            >
              <Box
                position="relative"
                maxW={{ base: "100%", md: "380px" }}
                flex="1"
              >
                <Icon
                  as={LuSearch}
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={MUTED}
                  zIndex={1}
                  boxSize={4}
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search committee # or name"
                  pl="38px"
                  h="38px"
                  borderColor={BORDER}
                  borderRadius="6px"
                  fontSize="12px"
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              <Box
                position="relative"
                width={{ base: "100%", md: "180px" }}
              >
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid #DCE2EA",
                    borderRadius: "6px",
                    padding: "0 35px 0 11px",
                    fontSize: "12px",
                    background: "white",
                    color: DARK,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <Icon
                  as={LuChevronRight}
                  position="absolute"
                  right="11px"
                  top="50%"
                  transform="translateY(-50%) rotate(90deg)"
                  pointerEvents="none"
                  color={DARK}
                  boxSize={4}
                />
              </Box>

              <Button
                variant="outline"
                h="38px"
                borderColor="#FF5A7D"
                color={RED}
                borderRadius="6px"
                px={4}
                fontSize="12px"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
              >
                <Icon as={LuFilter} mr={2} boxSize={4} />
                Filter
              </Button>
            </Flex>

            {/* TABLE */}
            <Box
              overflowX="auto"
              overflowY="hidden"
              border="1px solid #E6EAF0"
              borderRadius="6px"
              width="100%"
            >
              <Box
                as="table"
                width="100%"
                minW="1100px"
                borderCollapse="collapse"
              >
                <Box as="thead">
                  <Box as="tr" height="42px">
                    {[
                      "Committee #",
                      "Committee Name",
                      "Date From",
                      "Date To",
                      "Members",
                      "Member Phones",
                      "Status",
                      "Last Updated",
                      "Actions",
                    ].map((heading) => (
                      <Box
                        as="th"
                        key={heading}
                        textAlign="left"
                        px={4}
                        py={2}
                        fontSize="11px"
                        fontWeight="700"
                        color={DARK}
                        borderBottom="1px solid #E6EAF0"
                        whiteSpace="nowrap"
                        bg="white"
                      >
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box as="tbody">
                  {loading ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={9}
                        textAlign="center"
                        height="60px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        Loading committees...
                      </Box>
                    </Box>
                  ) : paginatedCommittees.length === 0 ? (
                    <Box as="tr">
                      <Box
                        as="td"
                        colSpan={9}
                        textAlign="center"
                        height="60px"
                        color={MUTED}
                        fontSize="12px"
                      >
                        No committees found.
                      </Box>
                    </Box>
                  ) : (
                    paginatedCommittees.map((committee) => {
                      const status = getCommitteeStatus(committee);
                      const membersList = Array.isArray(committee.members)
                        ? committee.members
                        : [];

                      // ✅ Phones now come from the stored committee members JSON
                      const phones = getCommitteePhones(committee);
                      const phoneLabel = getPhoneLabel(phones);

                      return (
                        <Box
                          as="tr"
                          key={committee.id}
                          height="52px"
                          _hover={{ bg: "#FFFBFC" }}
                        >
                          {/* CODE */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            fontWeight="700"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {committee.committee_code ||
                              `COM-${String(committee.id).padStart(3, "0")}`}
                          </Box>

                          {/* NAME */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color={DARK}
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {committee.committee_name || "-"}
                          </Box>

                          {/* FROM */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {formatDate(committee.committee_from_date)}
                          </Box>

                          {/* TO */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {formatDate(committee.committee_to_date)}
                          </Box>

                          {/* MEMBERS COUNT */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                          >
                            {membersList.length}
                          </Box>

                          {/* PHONES */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {phoneLabel}
                          </Box>

                          {/* STATUS */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <StatusBadge status={status} />
                          </Box>

                          {/* LAST UPDATED */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            fontSize="12px"
                            color="#344054"
                            borderBottom="1px solid #E6EAF0"
                            whiteSpace="nowrap"
                          >
                            {formatDateISO(
                              committee.updated_at?.split?.("T")?.[0] ||
                                committee.updated_at
                            )}
                          </Box>

                          {/* ACTIONS */}
                          <Box
                            as="td"
                            px={4}
                            py={1}
                            borderBottom="1px solid #E6EAF0"
                          >
                            <HStack gap={2}>
                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() =>
                                  navigate(`/committees/${committee.id}`)
                                }
                                _hover={{ bg: "#FFF0F4" }}
                              >
                                <Icon as={LuEye} boxSize={3.5} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() => handleEdit(committee)}
                                _hover={{ bg: "#FFF0F4" }}
                              >
                                <Icon as={LuPencil} boxSize={3.5} />
                              </Button>

                              {/* <Button
                                variant="ghost"
                                size="sm"
                                h="30px"
                                color={RED}
                                px={2}
                                fontSize="11px"
                                onClick={() => handleDelete(committee)}
                                _hover={{ bg: "#FFF0F4" }}
                              >
                                <Icon as={LuTrash2} boxSize={3.5} />
                              </Button> */}
                            </HStack>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            </Box>

            {/* PAGINATION */}
            <Flex
              justify="space-between"
              align="center"
              mt={3}
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <Text fontSize="11px" color={MUTED}>
                {filteredCommittees.length === 0
                  ? "Showing 0 committees"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + paginatedCommittees.length,
                      filteredCommittees.length
                    )} of ${filteredCommittees.length} committees`}
              </Text>

              <HStack gap={1}>
                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor={BORDER}
                  color={MUTED}
                  disabled={safePage === 1}
                  onClick={() =>
                    setCurrentPage(Math.max(1, safePage - 1))
                  }
                >
                  <Icon as={LuChevronLeft} boxSize={3.5} />
                  Previous
                </Button>

                {renderPages().map((page, index) =>
                  page === "..." ? (
                    <Text
                      key={`dots-${index}`}
                      px={1.5}
                      fontSize="11px"
                      color={MUTED}
                    >
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      size="xs"
                      h="30px"
                      minW="30px"
                      variant={page === safePage ? "solid" : "outline"}
                      bg={page === safePage ? PRIMARY_MAROON : "white"}
                      color={page === safePage ? "white" : "#344054"}
                      borderColor={
                        page === safePage ? PRIMARY_MAROON : BORDER
                      }
                      onClick={() => setCurrentPage(page)}
                      _hover={{
                        bg: page === safePage ? "#650A18" : "#FFF0F4",
                      }}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  size="xs"
                  h="30px"
                  variant="outline"
                  borderColor="#FF5A7D"
                  color={RED}
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, safePage + 1))
                  }
                >
                  Next
                  <Icon as={LuChevronRight} ml={1} boxSize={3.5} />
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default CommitteePage;