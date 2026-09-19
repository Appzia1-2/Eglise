// src/pages/CommitteeAddPage.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  NativeSelect,
  Text,
  IconButton,
} from "@chakra-ui/react";
import {
  LuLock,
  LuCalendarDays,
  LuPlus,
  LuMinus,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createCommittee,
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

// ==========================================================
// PAGE
// ==========================================================

const CommitteeAddPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    committee_name: "",
    committee_from_date: "",
    committee_to_date: "",
  });

  // Row-based members: [{ member, designation, phone }]
  const [rows, setRows] = useState([
    { member: "", designation: "", phone: "" },
  ]);

  // ==========================================================
  // LOAD LISTS
  // ==========================================================

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, dRes] = await Promise.all([
          listMembers(),
          listDesignations(),
        ]);
        setMembers(getArrayData(mRes));
        setDesignations(getArrayData(dRes));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

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

  const getMemberLabel = (member) => {
    const name = getMemberName(member.id);
    const code =
      member.member_code ||
      member.code ||
      `MEM-${String(member.id).padStart(4, "0")}`;
    return `${name} (${code})`;
  };

  const getMemberPhone = (memberId) => {
    const m = members.find((x) => Number(x.id) === Number(memberId));
    return m?.phone || m?.mobile || m?.phone_number || "";
  };

  const getDesignationName = (id) => {
    const d = designations.find((x) => Number(x.id) === Number(id));
    if (!d) return "";
    return d.designation_name || d.name || "";
  };

  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  // ==========================================================
  // ROW CHANGE
  // ==========================================================

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
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    // Filter out empty rows (member + designation required)
    const validRows = rows.filter((r) => r.member && r.designation);

    if (validRows.length === 0) {
      setError("Add at least one committee member.");
      return;
    }

    // ✅ Validate phone on every valid row
    for (const r of validRows) {
      if (!r.phone || !String(r.phone).trim()) {
        setError("Phone number is required for every member.");
        return;
      }
    }

    // Check duplicates
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

      await createCommittee({
        committee_name: form.committee_name.trim(),
        committee_from_date: form.committee_from_date,
        committee_to_date: form.committee_to_date,
        members: validRows.map((r) => ({
          member: Number(r.member),
          designation: Number(r.designation),
          phone: String(r.phone).trim(), // ✅ phone now sent to backend
        })),
      });

      navigate("/committees");
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/committees");
  };

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
            <Text>Committees</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Committee</Text>
          </HStack>

          {/* HEADER */}
          <Box mb={3}>
            <Text
              fontSize="11px"
              fontWeight="700"
              color={RED}
              mb={1}
              letterSpacing="0.4px"
            >
              COMMITTEES
            </Text>

            <Heading
              color={DARK}
              fontSize={{ base: "22px", md: "26px" }}
              lineHeight="1.15"
              mb={1}
            >
              Create New Committee
            </Heading>

            <Text color={MUTED} fontSize="12px">
              Create a committee and assign members with their
              designations.
            </Text>
          </Box>

          {/* FORM CARD */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            bg="white"
            p={{ base: 4, md: 6 }}
            boxShadow="0 1px 3px rgba(16, 24, 40, 0.04)"
          >
            {/* ERROR */}
            {error && (
              <Box
                mb={4}
                px={4}
                py={2.5}
                border="1px solid #FED7D7"
                bg="#FFF5F5"
                borderRadius="7px"
              >
                <Text color="#C53030" fontSize="12px" fontWeight="500">
                  {error}
                </Text>
              </Box>
            )}

            {/* ==================================================
                SECTION 1: COMMITTEE INFORMATION
            ================================================== */}
            <Box mb={6}>
              <Heading
                fontSize="15px"
                fontWeight="700"
                color={DARK}
                mb={4}
              >
                1. Committee Information
              </Heading>

              <Flex
                direction={{ base: "column", md: "row" }}
                gap={5}
              >
                {/* Committee # */}
                <Box flex={1}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                    mb="8px"
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
                    bg="#F1F3F6"
                    align="center"
                    px={3}
                    gap={2}
                  >
                    <Text
                      flex="1"
                      fontSize="13px"
                      color={DARK}
                      fontWeight="600"
                    >
                      COM-2026-0012
                    </Text>

                    <Icon
                      as={LuLock}
                      boxSize={4}
                      color={MUTED}
                    />

                    <Text fontSize="12px" color={MUTED}>
                      Auto-generated
                    </Text>
                  </Flex>
                </Box>

                {/* Committee Name */}
                <Box flex={1}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                    mb="8px"
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
                    placeholder="Enter committee name"
                    h="42px"
                    fontSize="13px"
                    borderColor={BORDER}
                    borderRadius="7px"
                    color={DARK}
                    _placeholder={{ color: "#98A2B3" }}
                    _hover={{ borderColor: "#BFC7D4" }}
                    _focus={{
                      borderColor: PRIMARY_MAROON,
                      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                    }}
                  />
                </Box>
              </Flex>

              <Flex
                direction={{ base: "column", md: "row" }}
                gap={5}
                mt={4}
              >
                {/* Date From */}
                <Box flex={1}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                    mb="8px"
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

                {/* Date To */}
                <Box flex={1}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                    mb="8px"
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
              </Flex>
            </Box>

            {/* Divider */}
            <Box
              borderTop="1px dashed"
              borderColor="#E6EAF0"
              mb={6}
            />

            {/* ==================================================
                SECTION 2: COMMITTEE MEMBERS
            ================================================== */}
            <Box mb={6}>
              <Heading
                fontSize="15px"
                fontWeight="700"
                color={DARK}
                mb={4}
              >
                2. Committee Members
              </Heading>

              {/* Column Headers */}
              <Flex
                direction={{ base: "column", md: "row" }}
                gap={3}
                mb={3}
                display={{ base: "none", md: "flex" }}
              >
                <Box flex={2}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                  >
                    Committee Member{" "}
                    <Text as="span" color={RED}>
                      *
                    </Text>
                  </Text>
                </Box>
                <Box flex={2}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                  >
                    Designation{" "}
                    <Text as="span" color={RED}>
                      *
                    </Text>
                  </Text>
                </Box>
                <Box flex={2}>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color={DARK}
                  >
                    Phone{" "}
                    <Text as="span" color={RED}>
                      *
                    </Text>
                  </Text>
                </Box>
                <Box width="48px" />
              </Flex>

              {/* Rows */}
              {rows.map((row, index) => (
                <Flex
                  key={index}
                  direction={{ base: "column", md: "row" }}
                  gap={3}
                  mb={3}
                  align="stretch"
                >
                  {/* Member */}
                  <Box flex={2}>
                    <Text
                      display={{ base: "block", md: "none" }}
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Committee Member{" "}
                      <Text as="span" color={RED}>
                        *
                      </Text>
                    </Text>

                    <NativeSelect.Root size="md" height="42px">
                      <NativeSelect.Field
                        value={row.member}
                        onChange={(e) =>
                          handleRowChange(index, "member", e.target.value)
                        }
                        placeholder="Select committee member"
                        h="42px"
                        fontSize="13px"
                        borderColor={BORDER}
                        borderRadius="7px"
                      >
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {getMemberLabel(member)}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>

                  {/* Designation */}
                  <Box flex={2}>
                    <Text
                      display={{ base: "block", md: "none" }}
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Designation{" "}
                      <Text as="span" color={RED}>
                        *
                      </Text>
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

                  {/* Phone (auto-filled, editable) */}
                  <Box flex={2}>
                    <Text
                      display={{ base: "block", md: "none" }}
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Phone{" "}
                      <Text as="span" color={RED}>
                        *
                      </Text>
                    </Text>

                    <Input
                      value={row.phone}
                      onChange={(e) =>
                        handleRowChange(index, "phone", e.target.value)
                      }
                      placeholder="Phone number"
                      h="42px"
                      fontSize="13px"
                      borderColor={BORDER}
                      borderRadius="7px"
                      color={DARK}
                      bg="white"
                      _placeholder={{ color: "#98A2B3" }}
                      _hover={{ borderColor: "#BFC7D4" }}
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>

                  {/* Add / Remove button */}
                  <Flex width="48px" align="center" justify="center">
                    {index === 0 ? (
                      <IconButton
                        aria-label="Add member row"
                        type="button"
                        onClick={handleAddRow}
                        bg={PRIMARY_MAROON}
                        color="white"
                        borderRadius="7px"
                        h="42px"
                        w="42px"
                        minW="42px"
                        _hover={{ bg: "#650A18" }}
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

            {/* ==================================================
                BUTTONS
            ================================================== */}
            <Flex
              justify="flex-end"
              align="center"
              gap={3}
              pt={4}
              borderTop="1px solid"
              borderColor="#E6EAF0"
            >
              <Button
                type="button"
                variant="outline"
                borderColor={RED}
                color={RED}
                h="42px"
                px={8}
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                onClick={handleCancel}
                disabled={saving}
                _hover={{ bg: "#FFF5F7" }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                h="42px"
                px={8}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                loading={saving}
                loadingText="Saving..."
                _hover={{ bg: "#650A18" }}
              >
                Save Committee
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default CommitteeAddPage;