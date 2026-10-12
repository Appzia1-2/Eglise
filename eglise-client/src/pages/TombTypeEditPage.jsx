// src/pages/TombTypeEditPage.jsx

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
} from "@chakra-ui/react";

import {
  LuSave,
  LuCalendarDays,
  LuUserRound,
  LuTriangleAlert,
  LuClock3,
  LuArchive,
  LuFileText,
} from "react-icons/lu";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  listTombTypes,
  updateTombType,
  deleteTombType,
} from "../api/registryServices";

import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";

const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";


// ============================================================
// TOAST HELPER
// ============================================================

const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};


const TombTypeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");

  const [tombType, setTombType] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // LOAD TOMB TYPE
  // ==========================================================

  useEffect(() => {
    fetchTombType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTombType = async () => {
    try {
      setLoading(true);

      const response = await listTombTypes();

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.results || [];

      const found = items.find(
        (item) => String(item.id) === String(id)
      );

      if (!found) {
        showToast({
          title: "Tomb type not found",
          description:
            "The requested tomb type record could not be found.",
          type: "error",
          duration: 6000,
        });
        return;
      }

      setTombType(found);

      const tombTypeName = found.name || "";

      setName(tombTypeName);
      setOriginalName(tombTypeName);
    } catch (err) {
      console.error("Error fetching tomb type:", err);

      showToast({
        title: "Failed to load record",
        description:
          err?.response?.data?.detail ||
          "Unable to load tomb type. Please try again.",
        type: "error",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const hasChanges = name.trim() !== originalName.trim();

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleUpdate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFieldErrors({ name: "Tomb type name is required." });
      showToast({
        title: "Please fix the form",
        description: "Tomb Type Name is required.",
        type: "warning",
        duration: 5000,
      });
      return;
    }

    if (!hasChanges) {
      showToast({
        title: "No changes to save",
        description:
          "Please modify the tomb type name before updating.",
        type: "info",
        duration: 4000,
      });
      return;
    }

    try {
      setUpdating(true);
      setFieldErrors({});

      await updateTombType(id, {
        name: trimmedName,
      });

      showToast({
        title: "Changes saved",
        description: "The tomb type record was updated successfully.",
        type: "success",
        duration: 4000,
      });

      navigate(`/tomb-type/${id}`);
    } catch (err) {
      console.error("Error updating tomb type:", err);

      const responseData = err?.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        const errors = {};

        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) errors[key] = value.join(", ");
          else if (typeof value === "string") errors[key] = value;
          else errors[key] = JSON.stringify(value);
        });

        setFieldErrors(errors);

        const generalError =
          responseData.detail || responseData.non_field_errors?.[0];

        const fieldMessages = Object.values(errors).filter(Boolean);
        const onlyOneFieldError =
          fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not save changes",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : "Unable to update tomb type. Please try again."),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not save changes",
          description: "Unable to update tomb type. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================================
  // ARCHIVE
  // ==========================================================

  const handleArchive = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this tomb type?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);

      await deleteTombType(id);

      showToast({
        title: "Record archived",
        description: "The tomb type record was archived successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/tomb-type");
    } catch (err) {
      console.error("Error archiving tomb type:", err);

      showToast({
        title: "Could not archive record",
        description:
          err?.response?.data?.detail ||
          "Unable to archive tomb type. Please try again.",
        type: "error",
        duration: 7000,
      });
    } finally {
      setArchiving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate(`/tomb-type/${id}`);
  };

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================================
  // DATA
  // ==========================================================

  const createdDate =
    tombType?.created_at || tombType?.created || tombType?.created_on;

  const updatedDate =
    tombType?.updated_at || tombType?.updated || tombType?.updated_on;

  const tombTypeCode = `TT-${String(
    tombType?.id || "0001"
  ).padStart(4, "0")}`;

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
            Loading tomb type...
          </Text>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <Box
      minH="100vh"
      height="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Box flexShrink={0}>
        <Navbar />
      </Box>

      <Box flex="1" minH="0" overflow="hidden">
        <Container
          maxW="none"
          height="100%"
          px={{ base: 4, md: 6 }}
          py={{ base: 2, md: 3 }}
        >
          {/* BREADCRUMB */}
          <HStack
            gap={2}
            mb={2}
            color={MUTED}
            fontSize="12px"
          >
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Tomb Type Master</Text>
            <Text>/</Text>
            <Text>{tombType?.name || "Tomb Type"}</Text>
            <Text>/</Text>
            <Text>Edit</Text>
          </HStack>

          {/* PAGE HEADER */}
          <Box mb={3}>
            <Heading
              color={DARK}
              fontSize={{ base: "22px", md: "26px" }}
              lineHeight="1.15"
              mb={1}
            >
              Edit Tomb Type
            </Heading>

            <Text color={MUTED} fontSize="12px">
              Update tomb type information.
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
          >
            {/* LEFT COLUMN */}
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
                      {(tombType?.name || "T")
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
                      {tombType?.name || "-"}
                    </Heading>

                    <HStack
                      gap={3}
                      color={MUTED}
                      fontSize="12px"
                    >
                      <Text>{tombTypeCode}</Text>
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
                    Tomb Type Details
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
                  px={{ base: 3, md: 4 }}
                  py={3}
                  minH="250px"
                >
                  <Text
                    fontSize="14px"
                    fontWeight="700"
                    color={DARK}
                    mb={3}
                  >
                    Tomb Type Information
                  </Text>

                  {/* NAME */}
                  <Box>
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      color={DARK}
                      mb={2}
                    >
                      Tomb Type Name{" "}
                      <Text as="span" color={RED}>
                        *
                      </Text>
                    </Text>

                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFieldErrors((prev) =>
                          prev.name ? { ...prev, name: "" } : prev
                        );
                      }}
                      placeholder="Enter tomb type name"
                      height="38px"
                      fontSize="12px"
                      borderColor={
                        fieldErrors.name
                          ? "#F3C4C4"
                          : hasChanges
                          ? RED
                          : BORDER
                      }
                      borderRadius="6px"
                      color={DARK}
                      _placeholder={{ color: "#8B98AB" }}
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* RIGHT COLUMN */}
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
                    <LuCalendarDays size={13} color={MUTED} />
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
                      {formatDate(createdDate)}
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
                      {formatDate(updatedDate)}
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
                    <LuTriangleAlert size={14} color="#F26B00" />
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
                        ? "1 field modified"
                        : "No changes"}
                    </Text>

                    <Text color={MUTED} fontSize="10px" mt={1}>
                      {hasChanges
                        ? "Please review your changes before saving."
                        : "Make changes to the tomb type information."}
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
                  onClick={handleArchive}
                  loading={archiving}
                  _hover={{
                    bg: "transparent",
                    color: "#A00D28",
                  }}
                >
                  <LuArchive
                    size={14}
                    style={{ marginRight: "8px" }}
                  />
                  Archive Tomb Type Record
                </Button>

                <Text
                  color="#8290A4"
                  fontSize="10px"
                  mt={2}
                  ml={1}
                >
                  This tomb type record will remain in history.
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
          {/* CANCEL */}
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

          {/* UPDATE */}
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

      <Box flexShrink={0}>
        <Footer />
      </Box>
    </Box>
  );
};

export default TombTypeEditPage;