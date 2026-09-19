// src/pages/VisitorEditPage.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuArchive,
  LuCalendarDays,
  LuClock3,
  LuFileText,
  LuSave,
  LuTriangleAlert,
  LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getVisitor,
  listVisitors,
  updateVisitor,
  deleteVisitor,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

// ==========================================================
// HELPERS
// ==========================================================

const getArray = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VisitorEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visitor, setVisitor] = useState(null);

  const [form, setForm] = useState({
    visitor_name: "",
    visitor_date: "",
    reason_to_visit: "",
    visitor_address: "",
    remarks: "",
  });

  const [originalForm, setOriginalForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {
    const loadVisitor = async () => {
      try {
        setLoading(true);
        setError("");

        let data = null;

        try {
          const response = await getVisitor(id);
          data = response?.data ?? response;
        } catch (detailError) {
          const response = await listVisitors();
          const visitors = getArray(response);

          data = visitors.find(
            (item) => String(item.id) === String(id)
          );
        }

        if (!data) {
          setError("Visitor record not found.");
          return;
        }

        setVisitor(data);

        const initialForm = {
          visitor_name: data.visitor_name || "",
          visitor_date: data.visitor_date || "",
          reason_to_visit: data.reason_to_visit || "",
          visitor_address: data.visitor_address || "",
          remarks: data.remarks || "",
        };

        setForm(initialForm);
        setOriginalForm(initialForm);
      } catch (err) {
        console.error("Error loading visitor:", err);
        setError(
          err?.response?.data?.detail ||
            "Unable to load visitor record."
        );
      } finally {
        setLoading(false);
      }
    };

    loadVisitor();
  }, [id]);

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================================
  // DIRTY
  // ==========================================================

  const hasChanges =
    originalForm &&
    JSON.stringify(form) !== JSON.stringify(originalForm);

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();

    const visitorName = form.visitor_name.trim();

    if (!visitorName) {
      setError("Visitor name is required.");
      return;
    }

    if (!form.visitor_date) {
      setError("Visit date is required.");
      return;
    }

    if (!hasChanges) return;

    try {
      setUpdating(true);
      setError("");

      const payload = {
        visitor_name: visitorName,
        visitor_date: form.visitor_date,
        reason_to_visit: form.reason_to_visit.trim(),
        visitor_address: form.visitor_address.trim(),
        remarks: form.remarks.trim(),
      };

      await updateVisitor(id, payload);

      // ✅ Redirect to the View page after successful update
      navigate(`/visitors/${id}`);
    } catch (err) {
      console.error("Update visitor error:", err);

      const data = err?.response?.data;

      if (typeof data === "object" && data !== null) {
        const firstError = Object.values(data)?.[0];

        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else if (typeof firstError === "string") {
          setError(firstError);
        } else {
          setError("Unable to update visitor record.");
        }
      } else {
        setError("Unable to update visitor record.");
      }
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this visitor record? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await deleteVisitor(id);

      navigate("/visitors");
    } catch (err) {
      console.error("Delete visitor error:", err);
      setError(
        err?.response?.data?.detail ||
          "Unable to delete visitor record."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/visitors");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box flex="1" px={6} py={5}>
          <Text color={MUTED} fontSize="13px">
            Loading visitor record...
          </Text>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (!visitor) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box flex="1" px={6} py={5}>
          <Text
            color={RED}
            fontSize="13px"
            fontWeight="600"
            mb={3}
          >
            {error || "Visitor record not found."}
          </Text>

          <Button
            size="sm"
            variant="outline"
            borderColor={RED}
            color={RED}
            onClick={() => navigate("/visitors")}
          >
            Back to Visitor Register
          </Button>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // SHARED INPUT PROPS
  // ==========================================================

  const inputProps = {
    h: "36px",
    fontSize: "12px",
    borderColor: BORDER,
    borderRadius: "6px",
    color: DARK,
    bg: "white",
    _placeholder: { color: "#8B98AB" },
    _hover: { borderColor: "#BFC7D4" },
    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  const textareaProps = {
    fontSize: "12px",
    borderColor: BORDER,
    borderRadius: "6px",
    color: DARK,
    bg: "white",
    resize: "none",
    _placeholder: { color: "#8B98AB" },
    _hover: { borderColor: "#BFC7D4" },
    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
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
      {/* NAVBAR (fixed height) */}
      <Box flexShrink={0}>
        <Navbar />
      </Box>

      {/* SCROLLABLE MAIN CONTENT */}
      <Box
        flex="1"
        minH="0"
        overflowY="auto"
        overflowX="hidden"
      >
        <Container
          maxW="none"
          px={{ base: 4, md: 6 }}
          py={{ base: 2, md: 3 }}
        >
          {/* BREADCRUMB */}
          <HStack gap={2} mb={2} color={MUTED} fontSize="12px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Visitor Register</Text>
            <Text>/</Text>
            <Text>{visitor?.visitor_name || "Visitor"}</Text>
            <Text>/</Text>
            <Text color={DARK}>Edit</Text>
          </HStack>

          {/* PAGE HEADER */}
          <Box mb={3}>
            <Heading
              color={DARK}
              fontSize={{ base: "22px", md: "26px" }}
              lineHeight="1.15"
              mb={1}
            >
              Edit Visitor
            </Heading>

            <Text color={MUTED} fontSize="12px">
              Update visitor information and visit details.
            </Text>
          </Box>

          {/* TWO COLUMN LAYOUT */}
          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(280px, 1fr)",
            }}
            gap={{ base: 3, lg: 4 }}
            alignItems="start"
            pb={4}
          >
            {/* =================================================
                LEFT COLUMN
            ================================================= */}
            <Box>
              {/* HEADER CARD */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                px={{ base: 3, md: 4 }}
                py={3}
                mb={3}
              >
                <Flex align="center" gap={4}>
                  <Flex
                    width="58px"
                    height="58px"
                    minW="58px"
                    borderRadius="50%"
                    border="1px solid #F2B8C3"
                    bg="#FFF8FA"
                    align="center"
                    justify="center"
                  >
                    <Text
                      fontSize="21px"
                      fontWeight="600"
                      color={RED}
                    >
                      {(visitor?.visitor_name || "V")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </Flex>

                  <Box>
                    <Heading
                      color={DARK}
                      fontSize={{ base: "20px", md: "22px" }}
                      lineHeight="1.2"
                      mb={1}
                    >
                      {visitor?.visitor_name || "-"}
                    </Heading>

                    <HStack gap={3} color={MUTED} fontSize="12px">
                      <Text>
                        VS-
                        {String(visitor?.id || "0001").padStart(
                          4,
                          "0"
                        )}
                      </Text>

                      <Text>•</Text>

                      <Box
                        px={2}
                        py="2px"
                        borderRadius="5px"
                        bg="#EAF8EA"
                        border="1px solid #B7DFB7"
                        color="#238B2D"
                        fontSize="11px"
                        fontWeight="600"
                      >
                        Active
                      </Box>
                    </HStack>
                  </Box>
                </Flex>
              </Box>

              {/* DETAILS CARD */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                overflow="hidden"
              >
                {/* TAB HEADER */}
                <Box
                  height="42px"
                  borderBottom="1px solid"
                  borderColor={BORDER}
                  position="relative"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={RED}
                    fontSize="13px"
                    fontWeight="700"
                  >
                    Visitor Details
                  </Text>

                  <Box
                    position="absolute"
                    bottom="-1px"
                    left="16px"
                    width="46%"
                    maxW="520px"
                    height="2px"
                    bg={RED}
                  />
                </Box>

                {/* FORM */}
                <Box
                  as="form"
                  onSubmit={handleUpdate}
                  px={{ base: 3, md: 4 }}
                  py={3}
                >
                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color={DARK}
                    mb={3}
                  >
                    Visitor Information
                  </Text>

                  {error && (
                    <Box
                      mb={3}
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

                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(2, 1fr)",
                    }}
                    gap={3}
                  >
                    {/* Visit Date */}
                    <Box>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color={DARK}
                        mb="4px"
                      >
                        Visit Date{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>

                      <Box position="relative">
                        <Input
                          name="visitor_date"
                          type="date"
                          value={form.visitor_date}
                          onChange={handleChange}
                          pr="36px"
                          {...inputProps}
                        />

                        <Box
                          position="absolute"
                          right="10px"
                          top="50%"
                          transform="translateY(-50%)"
                          color={MUTED}
                          pointerEvents="none"
                        >
                          <LuCalendarDays size={14} />
                        </Box>
                      </Box>
                    </Box>

                    {/* Visitor Name */}
                    <Box>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color={DARK}
                        mb="4px"
                      >
                        Visitor Name{" "}
                        <Text as="span" color={RED}>
                          *
                        </Text>
                      </Text>

                      <Input
                        name="visitor_name"
                        value={form.visitor_name}
                        onChange={handleChange}
                        placeholder="Enter visitor name"
                        {...inputProps}
                      />
                    </Box>

                    {/* Address */}
                    <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color={DARK}
                        mb="4px"
                      >
                        Address
                      </Text>

                      <Textarea
                        name="visitor_address"
                        value={form.visitor_address}
                        onChange={handleChange}
                        placeholder="Enter visitor address"
                        rows={2}
                        {...textareaProps}
                      />
                    </Box>

                    {/* Reason to Visit */}
                    <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color={DARK}
                        mb="4px"
                      >
                        Reason to Visit
                      </Text>

                      <Textarea
                        name="reason_to_visit"
                        value={form.reason_to_visit}
                        onChange={handleChange}
                        placeholder="Enter reason for visit"
                        rows={2}
                        {...textareaProps}
                      />
                    </Box>

                    {/* Remarks */}
                    <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color={DARK}
                        mb="4px"
                      >
                        Remarks
                      </Text>

                      <Textarea
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        placeholder="Enter remarks"
                        rows={2}
                        {...textareaProps}
                      />
                    </Box>
                  </Grid>
                </Box>
              </Box>
            </Box>

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}
            <Box>
              {/* RECORD INFORMATION */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
                mb={2}
              >
                <HStack gap={2} mb={3}>
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF0F4"
                    align="center"
                    justify="center"
                  >
                    <LuFileText size={14} color={RED} />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color={DARK}
                  >
                    Record Information
                  </Text>
                </HStack>

                {/* VISIT DATE */}
                <HStack align="flex-start" gap={2} mb={3}>
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuCalendarDays size={13} color={MUTED} />
                  </Flex>

                  <Box>
                    <Text color="#8290A4" fontSize="10px">
                      Visit date
                    </Text>
                    <Text
                      color={DARK}
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formatDate(visitor.visitor_date)}
                    </Text>
                  </Box>
                </HStack>

                {/* CREATED */}
                <HStack align="flex-start" gap={2} mb={3}>
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuClock3 size={13} color={MUTED} />
                  </Flex>

                  <Box>
                    <Text color="#8290A4" fontSize="10px">
                      Created
                    </Text>
                    <Text
                      color={DARK}
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formatDateTime(visitor.created_at)}
                    </Text>
                  </Box>
                </HStack>

                {/* UPDATED */}
                <HStack align="flex-start" gap={2}>
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#F4F7FA"
                    align="center"
                    justify="center"
                  >
                    <LuUserRound size={13} color={MUTED} />
                  </Flex>

                  <Box>
                    <Text color="#8290A4" fontSize="10px">
                      Last updated
                    </Text>
                    <Text
                      color={DARK}
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formatDateTime(visitor.updated_at)}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* UNSAVED CHANGES */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
                mb={2}
              >
                <HStack gap={2} mb={3}>
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF6E8"
                    align="center"
                    justify="center"
                  >
                    <LuTriangleAlert
                      size={14}
                      color="#F26B00"
                    />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color="#F26B00"
                  >
                    Unsaved Changes
                  </Text>
                </HStack>

                <HStack align="flex-start" gap={2}>
                  <Flex
                    width="25px"
                    height="25px"
                    borderRadius="5px"
                    bg="#FFF8EE"
                    align="center"
                    justify="center"
                  >
                    <LuClock3 size={13} color="#F26B00" />
                  </Flex>

                  <Box>
                    <Text
                      color="#F26B00"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {hasChanges
                        ? "You have unsaved changes"
                        : "No changes"}
                    </Text>
                    <Text
                      color={MUTED}
                      fontSize="10px"
                      mt={1}
                    >
                      {hasChanges
                        ? "Please review your changes before saving."
                        : "Make changes to the visitor information."}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* DANGER ZONE */}
              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="9px"
                p={3}
              >
                <HStack gap={2} mb={3}>
                  <Flex
                    width="26px"
                    height="26px"
                    borderRadius="5px"
                    bg="#FFF0F0"
                    align="center"
                    justify="center"
                  >
                    <LuArchive size={14} color={RED} />
                  </Flex>

                  <Text
                    fontSize="13px"
                    fontWeight="700"
                    color="#B5122F"
                  >
                    Danger Zone
                  </Text>
                </HStack>

                <Button
                  variant="ghost"
                  p={0}
                  height="auto"
                  color={RED}
                  fontSize="12px"
                  fontWeight="600"
                  justifyContent="flex-start"
                  onClick={handleDelete}
                  loading={deleting}
                  loadingText="Deleting..."
                  _hover={{
                    bg: "transparent",
                    color: "#A00D28",
                  }}
                >
                  <LuArchive
                    size={14}
                    style={{ marginRight: "8px" }}
                  />
                  Delete Visitor Record
                </Button>

                <Text
                  color="#8290A4"
                  fontSize="10px"
                  mt={2}
                  ml={1}
                >
                  This action cannot be undone.
                </Text>
              </Box>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* BOTTOM ACTION BAR */}
      <Box
        borderTop="1px solid"
        borderColor={BORDER}
        bg="white"
        px={{ base: 4, md: 6 }}
        py={2}
        flexShrink={0}
      >
        <Flex justify="flex-end" gap={2}>
          <Button
            variant="outline"
            height="36px"
            minW="125px"
            borderColor={RED}
            color={RED}
            borderRadius="6px"
            fontSize="12px"
            onClick={handleCancel}
            _hover={{ bg: "#FFF5F7" }}
          >
            Cancel
          </Button>

          <Button
            height="36px"
            minW="150px"
            bg={hasChanges ? PRIMARY_MAROON : "#D9DCE1"}
            color={hasChanges ? "white" : "#8A929D"}
            borderRadius="6px"
            fontSize="12px"
            disabled={!hasChanges}
            loading={updating}
            onClick={handleUpdate}
            _hover={{
              bg: hasChanges ? "#650A18" : "#D9DCE1",
            }}
          >
            <LuSave
              size={14}
              style={{ marginRight: "7px" }}
            />
            Update
          </Button>
        </Flex>
      </Box>

      {/* FOOTER */}
      <Box flexShrink={0}>
        <Footer />
      </Box>
    </Box>
  );
};

export default VisitorEditPage;