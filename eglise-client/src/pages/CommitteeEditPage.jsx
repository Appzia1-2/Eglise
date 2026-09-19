// src/pages/CommitteeEditPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NativeSelect,
  Text,
} from "@chakra-ui/react";
import {
  LuLock,
  LuCalendarDays,
  LuPlus,
  LuMinus,
  LuTriangleAlert,
  LuClock3,
  LuUserRound,
  LuArchive,
  LuUsers,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getCommittee,
  updateCommittee,
  deleteCommittee,
  listMembers,
  listDesignations,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
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

  if (data.members) {
    if (Array.isArray(data.members)) return data.members.join(" ");
    return String(data.members);
  }

  const messages = [];
  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) messages.push(`${field}: ${value.join(" ")}`);
    else if (value) messages.push(`${field}: ${value}`);
  });

  return messages.length
    ? messages.join(" | ")
    : "Unable to complete the request.";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(
    typeof value === "string" && value.length === 10
      ? `${value}T00:00:00`
      : value
  );
  if (Number.isNaN(date.getTime())) return "-";
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

// ==========================================================
// PAGE
// ==========================================================

const CommitteeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [committee, setCommittee] = useState(null);
  const [members, setMembers] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    committee_name: "",
    committee_from_date: "",
    committee_to_date: "",
  });

  const [originalForm, setOriginalForm] = useState(null);

  // Rows for members
  const [rows, setRows] = useState([
    { member: "", designation: "", phone: "" },
  ]);

  const [originalRows, setOriginalRows] = useState(null);

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [cRes, mRes, dRes] = await Promise.all([
          getCommittee(id),
          listMembers(),
          listDesignations(),
        ]);

        const cData = cRes?.data ?? cRes;
        setCommittee(cData);
        setMembers(getArrayData(mRes));
        setDesignations(getArrayData(dRes));

        const initialForm = {
          committee_name: cData.committee_name || "",
          committee_from_date: cData.committee_from_date || "",
          committee_to_date: cData.committee_to_date || "",
        };

        const initialRows =
          Array.isArray(cData.members) && cData.members.length > 0
            ? cData.members.map((m) => ({
                member: String(m.member ?? ""),
                designation: String(m.designation ?? ""),
                phone: m.phone || "",
              }))
            : [{ member: "", designation: "", phone: "" }];

        setForm(initialForm);
        setOriginalForm(initialForm);
        setRows(initialRows);
        setOriginalRows(initialRows);
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // ==========================================================
  // LOOKUPS
  // ==========================================================

  const getMemberName = (memberId) => {
    const m = members.find((x) => Number(x.id) === Number(memberId));
    if (!m) return "";
    return (
      m.name ||
      m.member_name ||
      m.full_name ||
      `${m.first_name || ""} ${m.last_name || ""}`.trim() ||
      ""
    );
  };

  const getDesignationName = (id) => {
    const d = designations.find((x) => Number(x.id) === Number(id));
    if (!d) return "";
    return d.designation_name || d.name || "";
  };

  const getMemberPhone = (memberId) => {
    const m = members.find((x) => Number(x.id) === Number(memberId));
    return m?.phone || m?.mobile || m?.phone_number || "";
  };

  // ==========================================================
  // DIRTY
  // ==========================================================

  const hasChanges = useMemo(() => {
    if (!originalForm || !originalRows) return false;
    return (
      JSON.stringify(form) !== JSON.stringify(originalForm) ||
      JSON.stringify(rows) !== JSON.stringify(originalRows)
    );
  }, [form, originalForm, rows, originalRows]);

  // Count modified fields
  const modifiedFieldCount = useMemo(() => {
    if (!originalForm || !originalRows) return 0;
    let count = 0;

    if (form.committee_name !== originalForm.committee_name) count++;
    if (form.committee_from_date !== originalForm.committee_from_date) count++;
    if (form.committee_to_date !== originalForm.committee_to_date) count++;

    if (JSON.stringify(rows) !== JSON.stringify(originalRows)) {
      count += 1; // count as 1 "fields modified" for the members section
    }

    return count;
  }, [form, originalForm, rows, originalRows]);

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Auto-fill phone when member changes
      if (field === "member" && value) {
        const phone = getMemberPhone(value);
        if (phone) next[index].phone = phone;
      }

      return next;
    });
    setError("");
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { member: "", designation: "", phone: "" },
    ]);
  };

  const handleRemoveRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!form.committee_name.trim()) {
      setError("Committee name is required.");
      return;
    }
    if (!form.committee_from_date) {
      setError("From date is required.");
      return;
    }
    if (!form.committee_to_date) {
      setError("To date is required.");
      return;
    }
    if (
      new Date(form.committee_to_date) < new Date(form.committee_from_date)
    ) {
      setError("To date cannot be before from date.");
      return;
    }

    const validRows = rows.filter((r) => r.member && r.designation);

    if (validRows.length === 0) {
      setError("Add at least one committee member.");
      return;
    }

    for (const r of validRows) {
      if (!r.phone || !String(r.phone).trim()) {
        setError("Phone number is required for every member.");
        return;
      }
    }

    const seen = new Set();
    for (const r of validRows) {
      const key = `${r.member}-${r.designation}`;
      if (seen.has(key)) {
        setError(
          "A member with the same designation is already added in another row."
        );
        return;
      }
      seen.add(key);
    }

    try {
      setSaving(true);
      setError("");

      await updateCommittee(id, {
        committee_name: form.committee_name.trim(),
        committee_from_date: form.committee_from_date,
        committee_to_date: form.committee_to_date,
        members: validRows.map((r) => ({
          member: Number(r.member),
          designation: Number(r.designation),
          phone: String(r.phone).trim(),
        })),
      });

      navigate(`/committees/${id}`);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // ARCHIVE / DELETE
  // ==========================================================

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this committee record?"
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      await deleteCommittee(id);
      navigate("/committees");
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate(`/committees/${id}`);
  };

  // ==========================================================
  // LOADING / ERROR
  // ==========================================================

  if (loading) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={5}>
          <Text color={MUTED} fontSize="13px">
            Loading committee...
          </Text>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (!committee) {
    return (
      <Box minH="100vh" bg="white" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1" px={6} py={5}>
          <Text color={RED} fontWeight="600" fontSize="13px" mb={3}>
            {error || "Committee record not found."}
          </Text>
          <Button
            variant="outline"
            borderColor={RED}
            color={RED}
            size="sm"
            onClick={() => navigate("/committees")}
          >
            Back to Committee List
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  const committeeCode =
    committee.committee_code ||
    `COM-${String(committee.id).padStart(3, "0")}`;

  const memberCount = Array.isArray(committee.members)
    ? committee.members.length
    : 0;

  const createdDate = formatDateISO(
    committee.created_at?.split?.("T")?.[0] || committee.created_at
  );

  const updatedDate = formatDateISO(
    committee.updated_at?.split?.("T")?.[0] || committee.updated_at
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      height="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Navbar />

      <Box flex="1" minH="0" overflowY="auto" overflowX="hidden">
        <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="12px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Committee List</Text>
            <Text>/</Text>
            <Text>{committeeCode}</Text>
            <Text>/</Text>
            <Text color={DARK}>Edit</Text>
          </HStack>

          {/* HEADER */}
          <Box mb={3}>
            <Heading
              color={DARK}
              fontSize={{ base: "22px", md: "26px" }}
              lineHeight="1.15"
              mb={1}
            >
              Edit Committee
            </Heading>
            <Text color={MUTED} fontSize="12px">
              Update committee information, term and members.
            </Text>
          </Box>

          {/* INFO CARD */}
          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            px={{ base: 4, md: 5 }}
            py={4}
            mb={3}
          >
            <Flex align="center" gap={4}>
              <Flex
                w="58px"
                h="58px"
                minW="58px"
                borderRadius="full"
                border="1px solid #F2B8C3"
                bg="#FFF8FA"
                align="center"
                justify="center"
                color={RED}
              >
                <LuUsers size={28} />
              </Flex>

              <Box>
                <Heading
                  color={DARK}
                  fontSize={{ base: "18px", md: "20px" }}
                  lineHeight="1.2"
                  mb={1}
                >
                  {committee.committee_name}
                </Heading>

                <HStack gap={3} flexWrap="wrap" fontSize="12px">
                  <Text color={MUTED}>{committeeCode}</Text>
                  <Text color={MUTED}>•</Text>
                  <Text color={MUTED}>
                    {formatDate(committee.committee_from_date)} —{" "}
                    {formatDate(committee.committee_to_date)}
                  </Text>
                  <Text color={MUTED}>•</Text>
                  <Box
                    px={2.5}
                    py="2px"
                    borderRadius="5px"
                    bg="#EAF8ED"
                    border="1px solid #B8E0BE"
                    color="#25803C"
                    fontSize="11px"
                    fontWeight="600"
                  >
                    {memberCount} Members
                  </Box>
                </HStack>
              </Box>
            </Flex>
          </Box>

          {/* TWO COLUMN LAYOUT */}
          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(280px, 1fr)",
            }}
            gap={{ base: 3, lg: 4 }}
            alignItems="start"
            pb={6}
          >
            {/* ================================================
                LEFT: FORM
            ================================================ */}
            <Box>
              <Box
                as="form"
                onSubmit={handleSave}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                overflow="hidden"
              >
                {/* TAB HEADER */}
                <Box
                  borderBottom="1px solid"
                  borderColor={BORDER}
                  position="relative"
                  px={{ base: 4, md: 5 }}
                  pt={3}
                >
                  <Text
                    color={RED}
                    fontSize="13px"
                    fontWeight="700"
                    pb={2.5}
                    borderBottom="3px solid"
                    borderColor={RED}
                    width="fit-content"
                  >
                    Committee Details
                  </Text>
                </Box>

                <Box px={{ base: 4, md: 5 }} py={4}>
                  {error && (
                    <Box
                      mb={4}
                      px={3}
                      py={2}
                      border="1px solid #FED7D7"
                      bg="#FFF5F5"
                      borderRadius="6px"
                    >
                      <Text color="#C53030" fontSize="11px">
                        {error}
                      </Text>
                    </Box>
                  )}

                  {/* COMMITTEE # + NAME */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={4}
                    mb={4}
                  >
                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={1.5}
                      >
                        Committee #{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>
                      <Flex
                        h="42px"
                        border="1px solid"
                        borderColor={BORDER}
                        borderRadius="7px"
                        bg="#F8F9FB"
                        align="center"
                        px={3}
                        gap={2}
                      >
                        <Text
                          flex="1"
                          fontSize="13px"
                          color={MUTED}
                          fontWeight="500"
                        >
                          {committeeCode}
                        </Text>
                        <Icon as={LuLock} boxSize={4} color={MUTED} />
                      </Flex>
                    </Box>

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={1.5}
                      >
                        Committee Name{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>
                      <Input
                        name="committee_name"
                        value={form.committee_name}
                        onChange={handleChange}
                        h="42px"
                        fontSize="13px"
                        borderColor={BORDER}
                        borderRadius="7px"
                        color={DARK}
                        _hover={{ borderColor: "#BFC7D4" }}
                        _focus={{
                          borderColor: PRIMARY_MAROON,
                          boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* DATES */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={4}
                    mb={4}
                  >
                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={1.5}
                      >
                        Date From{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>
                      <Box position="relative">
                        <Input
                          type="date"
                          name="committee_from_date"
                          value={form.committee_from_date}
                          onChange={handleChange}
                          h="42px"
                          fontSize="13px"
                          borderColor={BORDER}
                          borderRadius="7px"
                          color={DARK}
                          pr="42px"
                          _hover={{ borderColor: "#BFC7D4" }}
                          _focus={{
                            borderColor: PRIMARY_MAROON,
                            boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                          }}
                        />
                        <Icon
                          as={LuCalendarDays}
                          position="absolute"
                          right="12px"
                          top="50%"
                          transform="translateY(-50%)"
                          color={MUTED}
                          boxSize={4}
                          pointerEvents="none"
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={DARK}
                        mb={1.5}
                      >
                        Date To{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>
                      <Box position="relative">
                        <Input
                          type="date"
                          name="committee_to_date"
                          value={form.committee_to_date}
                          onChange={handleChange}
                          h="42px"
                          fontSize="13px"
                          borderColor={BORDER}
                          borderRadius="7px"
                          color={DARK}
                          pr="42px"
                          _hover={{ borderColor: "#BFC7D4" }}
                          _focus={{
                            borderColor: PRIMARY_MAROON,
                            boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                          }}
                        />
                        <Icon
                          as={LuCalendarDays}
                          position="absolute"
                          right="12px"
                          top="50%"
                          transform="translateY(-50%)"
                          color={MUTED}
                          boxSize={4}
                          pointerEvents="none"
                        />
                      </Box>
                    </Box>
                  </Grid>

                  {/* Divider */}
                  <Box
                    borderTop="1px solid"
                    borderColor="#E6EAF0"
                    my={4}
                  />

                  {/* MEMBERS */}
                  <Box>
                    <Heading
                      fontSize="14px"
                      fontWeight="700"
                      color={DARK}
                      mb={3}
                    >
                      2. Committee Members
                    </Heading>

                    {/* Column headers (desktop) */}
                    <Flex
                      gap={3}
                      mb={2}
                      display={{ base: "none", md: "flex" }}
                    >
                      <Box flex={2}>
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color={MUTED}
                        >
                          Committee Member{" "}
                          <Text as="span" color={RED}>
                            *
                          </Text>
                        </Text>
                      </Box>
                      <Box flex={2}>
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color={MUTED}
                        >
                          Designation{" "}
                          <Text as="span" color={RED}>
                            *
                          </Text>
                        </Text>
                      </Box>
                      <Box flex={2}>
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color={MUTED}
                        >
                          Phone{" "}
                          <Text as="span" color={RED}>
                            *
                          </Text>
                        </Text>
                      </Box>
                      <Box width="42px" />
                    </Flex>

                    {/* Rows */}
                    {rows.map((row, index) => (
                      <Flex
                        key={index}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                        mb={2.5}
                        align="stretch"
                      >
                        <Box flex={2}>
                          <Text
                            display={{ base: "block", md: "none" }}
                            fontSize="11px"
                            fontWeight="600"
                            color={MUTED}
                            mb={1}
                          >
                            Committee Member
                          </Text>
                          <NativeSelect.Root size="md" height="42px">
                            <NativeSelect.Field
                              value={row.member}
                              onChange={(e) =>
                                handleRowChange(
                                  index,
                                  "member",
                                  e.target.value
                                )
                              }
                              placeholder="Select member"
                              h="42px"
                              fontSize="13px"
                              borderColor={BORDER}
                              borderRadius="7px"
                            >
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {getMemberName(m.id) ||
                                    `Member #${m.id}`}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Box>

                        <Box flex={2}>
                          <Text
                            display={{ base: "block", md: "none" }}
                            fontSize="11px"
                            fontWeight="600"
                            color={MUTED}
                            mb={1}
                          >
                            Designation
                          </Text>
                          <NativeSelect.Root size="md" height="42px">
                            <NativeSelect.Field
                              value={row.designation}
                              onChange={(e) =>
                                handleRowChange(
                                  index,
                                  "designation",
                                  e.target.value
                                )
                              }
                              placeholder="Select designation"
                              h="42px"
                              fontSize="13px"
                              borderColor={BORDER}
                              borderRadius="7px"
                            >
                              {designations.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {getDesignationName(d.id)}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Box>

                        <Box flex={2}>
                          <Text
                            display={{ base: "block", md: "none" }}
                            fontSize="11px"
                            fontWeight="600"
                            color={MUTED}
                            mb={1}
                          >
                            Phone
                          </Text>
                          <Input
                            value={row.phone}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                "phone",
                                e.target.value
                              )
                            }
                            placeholder="Phone number"
                            h="42px"
                            fontSize="13px"
                            borderColor={BORDER}
                            borderRadius="7px"
                            color={DARK}
                            _hover={{ borderColor: "#BFC7D4" }}
                            _focus={{
                              borderColor: PRIMARY_MAROON,
                              boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                            }}
                          />
                        </Box>

                        {/* Add / Remove */}
                        <Flex width="42px" align="center" justify="center">
                          {index === 0 ? (
                            <IconButton
                              aria-label="Add member row"
                              type="button"
                              onClick={handleAddRow}
                              variant="ghost"
                              color={RED}
                              borderRadius="7px"
                              h="42px"
                              w="42px"
                              minW="42px"
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <LuPlus size={18} />
                            </IconButton>
                          ) : (
                            <IconButton
                              aria-label="Remove member row"
                              type="button"
                              onClick={() => handleRemoveRow(index)}
                              variant="ghost"
                              color={RED}
                              borderRadius="7px"
                              h="42px"
                              w="42px"
                              minW="42px"
                              _hover={{ bg: "#FFF0F4" }}
                            >
                              <LuMinus size={18} />
                            </IconButton>
                          )}
                        </Flex>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* ================================================
                RIGHT: SIDEBAR
            ================================================ */}
            <Box>
              {/* RECORD INFORMATION */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={4}
                mb={3}
              >
                <Heading
                  fontSize="15px"
                  fontWeight="700"
                  color={DARK}
                  mb={3}
                >
                  Record Information
                </Heading>

                <HStack align="flex-start" gap={3} mb={3}>
                  <Flex
                    w="26px"
                    h="26px"
                    minW="26px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuCalendarDays size={14} color={MUTED} />
                  </Flex>
                  <Box>
                    <Text fontSize="11px" color="#8290A4">
                      Created
                    </Text>
                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {createdDate}
                    </Text>
                  </Box>
                </HStack>

                <HStack align="flex-start" gap={3}>
                  <Flex
                    w="26px"
                    h="26px"
                    minW="26px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuUserRound size={14} color={MUTED} />
                  </Flex>
                  <Box>
                    <Text fontSize="11px" color="#8290A4">
                      Last updated
                    </Text>
                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {updatedDate}
                      {committee.updated_by_name || committee.updated_by
                        ? ` by ${
                            committee.updated_by_name ||
                            committee.updated_by
                          }`
                        : ""}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* UNSAVED CHANGES */}
              <Box
                border="1px solid"
                borderColor="#F2D9A6"
                bg="#FFFBEB"
                borderRadius="9px"
                p={4}
                mb={3}
              >
                <HStack gap={2} mb={2}>
                  <Box color="#D97706">
                    <LuTriangleAlert size={18} />
                  </Box>
                  <Heading
                    fontSize="15px"
                    fontWeight="700"
                    color="#D97706"
                  >
                    Unsaved Changes
                  </Heading>
                </HStack>

                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#B45309"
                  mb={1}
                >
                  {hasChanges
                    ? `${modifiedFieldCount} field${
                        modifiedFieldCount !== 1 ? "s" : ""
                      } modified`
                    : "No changes"}
                </Text>

                <Text fontSize="11px" color={MUTED} lineHeight="1.5">
                  {hasChanges
                    ? "Please review your changes before saving."
                    : "Make changes to the committee information."}
                </Text>
              </Box>

              {/* DANGER ZONE */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={4}
              >
                <Heading
                  fontSize="15px"
                  fontWeight="700"
                  color="#B5122F"
                  mb={3}
                >
                  Danger Zone
                </Heading>

                <Button
                  variant="ghost"
                  p={0}
                  height="auto"
                  color={RED}
                  fontSize="13px"
                  fontWeight="600"
                  justifyContent="flex-start"
                  onClick={handleArchive}
                  loading={deleting}
                  loadingText="Archiving..."
                  _hover={{
                    bg: "transparent",
                    color: "#A00D28",
                  }}
                >
                  <LuArchive
                    size={16}
                    style={{ marginRight: "8px" }}
                  />
                  Archive Committee Record
                </Button>

                <Text
                  color="#8290A4"
                  fontSize="11px"
                  mt={2}
                  ml={1}
                  lineHeight="1.5"
                >
                  This committee will remain in record history.
                </Text>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Box>

      {/* BOTTOM ACTION BAR */}
      <Box
        borderTop="1px solid"
        borderColor={BORDER}
        bg="white"
        px={{ base: 4, md: 6 }}
        py={3}
        flexShrink={0}
      >
        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            h="42px"
            minW="120px"
            borderColor={RED}
            color={RED}
            borderRadius="7px"
            fontSize="13px"
            fontWeight="600"
            onClick={handleCancel}
            _hover={{ bg: "#FFF5F7" }}
          >
            Cancel
          </Button>

          <Button
            h="42px"
            minW="160px"
            bg={hasChanges ? PRIMARY_MAROON : "#D9DCE1"}
            color={hasChanges ? "white" : "#8A929D"}
            borderRadius="7px"
            fontSize="13px"
            fontWeight="600"
            disabled={!hasChanges}
            loading={saving}
            loadingText="Saving..."
            onClick={handleSave}
            _hover={{
              bg: hasChanges ? "#650A18" : "#D9DCE1",
            }}
          >
            Save Changes
          </Button>
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

export default CommitteeEditPage;