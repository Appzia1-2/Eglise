import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  LuFileText,
  LuCalendarDays,
  LuUserRound,
  LuArchive,
  LuTriangleAlert,
  LuClock3,
} from "react-icons/lu";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getFamily,
  updateFamily,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const FamilyEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // ORIGINAL FAMILY DATA
  // ==========================================================

  const [originalForm, setOriginalForm] = useState({
    family_name: "",
    origin: "",
    history: "",
  });

  // ==========================================================
  // CURRENT FORM DATA
  // ==========================================================

  const [form, setForm] = useState({
    family_name: "",
    origin: "",
    history: "",
  });

  const [family, setFamily] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD FAMILY
  // ==========================================================

  useEffect(() => {
    const loadFamily = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getFamily(id);

        const data = response?.data ?? response;

        if (!data) {
          setError("Family record not found.");
          return;
        }

        const initialData = {
          family_name: data.family_name || "",
          origin: data.origin || "",
          history: data.history || "",
        };

        setFamily(data);

        setForm(initialData);
        setOriginalForm(initialData);
      } catch (err) {
        console.error("Load family error:", err);

        const data = err?.response?.data;

        if (data?.detail) {
          setError(
            Array.isArray(data.detail)
              ? data.detail[0]
              : data.detail
          );
        } else {
          setError("Unable to load family.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFamily();
    }
  }, [id]);

  // ==========================================================
  // FIND MODIFIED FIELDS
  // ==========================================================

  const modifiedFields = useMemo(() => {
    const fields = [];

    if (
      form.family_name !==
      originalForm.family_name
    ) {
      fields.push("Family Name");
    }

    if (
      form.origin !==
      originalForm.origin
    ) {
      fields.push("Origin");
    }

    if (
      form.history !==
      originalForm.history
    ) {
      fields.push("History");
    }

    return fields;
  }, [form, originalForm]);

  const hasChanges =
    modifiedFields.length > 0;

  // ==========================================================
  // HANDLE CHANGE
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
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/family-master");
  };

  // ==========================================================
  // UPDATE
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges) {
      return;
    }

    if (!form.family_name.trim()) {
      setError("Family name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await updateFamily(id, {
        family_name: form.family_name.trim(),
        origin: form.origin.trim(),
        history: form.history.trim(),
      });

      const updatedFamily =
        response?.data ?? response;

      if (updatedFamily) {
        setFamily((prev) => ({
          ...prev,
          ...updatedFamily,
        }));
      }

      const updatedForm = {
        family_name: form.family_name.trim(),
        origin: form.origin.trim(),
        history: form.history.trim(),
      };

      setForm(updatedForm);
      setOriginalForm(updatedForm);

      navigate("/family-master", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Update family error:",
        err
      );

      const data = err?.response?.data;

      if (data?.family_name) {
        setError(
          Array.isArray(data.family_name)
            ? data.family_name[0]
            : data.family_name
        );
      } else if (data?.detail) {
        setError(
          Array.isArray(data.detail)
            ? data.detail[0]
            : data.detail
        );
      } else {
        setError(
          "Unable to update family."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================================
  // INPUT STYLE
  // ==========================================================

  const inputStyle = {
    h: "30px",
    fontSize: "11px",
    borderColor: BORDER,
    borderRadius: "5px",
    color: DARK,
    bg: "white",

    _placeholder: {
      color: "#98A2B3",
      fontSize: "10px",
    },

    _hover: {
      borderColor: "#BFC7D4",
    },

    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  // ==========================================================
  // LABEL
  // ==========================================================

  const FieldLabel = ({
    children,
    required = true,
  }) => (
    <Text
      fontSize="10px"
      fontWeight="600"
      color={DARK}
      mb="4px"
    >
      {children}

      {required && (
        <Text
          as="span"
          color={RED}
          ml="1px"
        >
          *
        </Text>
      )}
    </Text>
  );

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

        <Box flex="1" w="100%" px={4} py={4}>
          <Text color={MUTED} fontSize="10px">
            Loading family...
          </Text>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (!family) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Box flex="1" w="100%" px={4} py={4}>
          <Text
            color="red.600"
            fontSize="11px"
            mb={3}
          >
            {error ||
              "Family record not found."}
          </Text>

          <Button
            h="28px"
            px={4}
            bg={PRIMARY_MAROON}
            color="white"
            borderRadius="5px"
            fontSize="10px"
            fontWeight="600"
            onClick={() =>
              navigate("/family-master")
            }
            _hover={{
              bg: "#650A18",
            }}
          >
            Back to Family Master
          </Button>
        </Box>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="#FFFFFF"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" w="100%">
        <Box
          w="100%"
          px={{
            base: 2,
            md: 3,
          }}
          py={{
            base: 2,
            md: 3,
          }}
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={1.5}
            mb={1.5}
            color={MUTED}
            fontSize="10px"
          >
            <Text>Masters</Text>

            <Text>/</Text>

            <Text>Family Master</Text>

            <Text>/</Text>

            <Text>
              {family.family_name}
            </Text>

            <Text>/</Text>

            <Text color={DARK}>
              Edit
            </Text>
          </HStack>

          {/* ==================================================
              PAGE TITLE
          ================================================== */}

          <Flex
            justify="space-between"
            align={{
              base: "flex-start",
              md: "center",
            }}
            gap={2}
            mb={2}
            direction={{
              base: "column",
              md: "row",
            }}
          >
            <Box>
              <Text
                fontSize="9px"
                fontWeight="700"
                color={RED}
                mb={0.5}
              >
                FAMILY MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{
                  base: "18px",
                  md: "22px",
                }}
                lineHeight="1.1"
                mb={0.5}
              >
                Edit Family
              </Heading>

              <Text
                color={MUTED}
                fontSize="10px"
              >
                Update family information, origin and history.
              </Text>
            </Box>
          </Flex>

          {/* ==================================================
              FAMILY SUMMARY
          ================================================== */}

          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="6px"
            p={{
              base: 2.5,
              md: 3,
            }}
            mb={2.5}
            bg="white"
            boxShadow="0 1px 2px rgba(16, 24, 40, 0.02)"
          >
            <Flex
              align="center"
              gap={2.5}
            >
              <Box
                w={{
                  base: "40px",
                  md: "48px",
                }}
                h={{
                  base: "40px",
                  md: "48px",
                }}
                flexShrink={0}
                borderRadius="50%"
                border="1px solid #F0B8C5"
                bg="#FFF9FA"
              />

              <Box>
                <Heading
                  fontSize={{
                    base: "18px",
                    md: "20px",
                  }}
                  color={DARK}
                  mb={0.5}
                >
                  {family.family_name}
                </Heading>

                <HStack
                  gap={1.5}
                  fontSize="10px"
                  color={MUTED}
                  flexWrap="wrap"
                >
                  <Text>
                    FM-
                    {String(family.id).padStart(
                      4,
                      "0"
                    )}
                  </Text>

                  <Text>•</Text>

                  <Text>
                    {family.origin || "-"}
                  </Text>

                  <Box
                    px={1.5}
                    py={0.5}
                    borderRadius="3px"
                    bg="#EAF8EC"
                    border="1px solid #B9E4BE"
                  >
                    <Text
                      fontSize="8px"
                      fontWeight="600"
                      color="#258A32"
                    >
                      Active
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Flex>
          </Box>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "2fr 1fr",
            }}
            gap={2.5}
          >
            {/* ==================================================
                LEFT SIDE - FORM
            ================================================== */}

            <Box
              border="1px solid"
              borderColor={BORDER}
              borderRadius="6px"
              bg="white"
              p={{
                base: 2.5,
                md: 3,
              }}
              boxShadow="0 1px 2px rgba(16, 24, 40, 0.02)"
            >
              {/* CARD HEADER */}

              <Box mb={2.5}>
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  color={RED}
                  pb="4px"
                  borderBottom="2px solid"
                  borderColor={RED}
                  display="inline-block"
                >
                  Family Details
                </Text>
              </Box>
             
              {error && (
                <Box
                  mb={2.5}
                  px={2.5}
                  py={1.5}
                  border="1px solid #FED7D7"
                  bg="#FFF5F5"
                  borderRadius="5px"
                >
                  <Text
                    color="#C53030"
                    fontSize="10px"
                    fontWeight="500"
                  >
                    {error}
                  </Text>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <VStack align="stretch" gap={2.5}>
                  {/* FAMILY NAME */}

                  <Box>
                    <FieldLabel>
                      Family Name
                    </FieldLabel>

                    <Input
                      name="family_name"
                      value={form.family_name}
                      onChange={handleChange}
                      placeholder="Enter family name"
                      {...inputStyle}
                    />
                  </Box>

                  {/* ORIGIN */}

                  <Box>
                    <FieldLabel required={false}>
                      Origin
                    </FieldLabel>

                    <Input
                      name="origin"
                      value={form.origin}
                      onChange={handleChange}
                      placeholder="Enter place of origin"
                      {...inputStyle}
                    />
                  </Box>

                  {/* HISTORY */}

                  <Box>
                    <FieldLabel required={false}>
                      History
                    </FieldLabel>

                    <Textarea
                      name="history"
                      value={form.history}
                      onChange={handleChange}
                      placeholder="Enter family history"
                      minH="60px"
                      maxH="60px"
                      resize="none"
                      fontSize="11px"
                      borderColor={BORDER}
                      borderRadius="5px"
                      color={DARK}
                      bg="white"
                      _placeholder={{
                        color: "#98A2B3",
                        fontSize: "10px",
                      }}
                      _hover={{
                        borderColor: "#BFC7D4",
                      }}
                      _focus={{
                        borderColor: PRIMARY_MAROON,
                        boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />

                    <Text
                      fontSize="9px"
                      color={MUTED}
                      mt={1}
                    >
                      Add background, migration, heritage, or other
                      relevant family details.
                    </Text>
                  </Box>
                </VStack>
              </form>
            </Box>

            {/* ==================================================
                RIGHT SIDEBAR
            ================================================== */}

            <VStack align="stretch" gap={2.5}>
              {/* RECORD INFORMATION */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                bg="white"
                p={3}
                boxShadow="0 1px 2px rgba(16, 24, 40, 0.02)"
              >
                <HStack gap={2} mb={2.5}>
                  <Box
                    p={0.5}
                    borderRadius="3px"
                    bg="#FFF0F4"
                    color={RED}
                  >
                    <LuFileText size={12} />
                  </Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={DARK}
                  >
                    Record Information
                  </Text>
                </HStack>

                {/* CREATED */}

                <HStack align="start" gap={2} mb={2.5}>
                  <Box color={MUTED}>
                    <LuCalendarDays size={12} />
                  </Box>

                  <Box>
                    <Text
                      fontSize="8px"
                      color="#7183A3"
                      mb={0.5}
                      textTransform="uppercase"
                      letterSpacing="0.3px"
                    >
                      Created
                    </Text>

                    <Text
                      fontSize="10px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {formatDate(
                        family.created_at
                      )}
                    </Text>
                  </Box>
                </HStack>

                {/* LAST UPDATED */}

                <HStack align="start" gap={2}>
                  <Box color={MUTED}>
                    <LuUserRound size={12} />
                  </Box>

                  <Box>
                    <Text
                      fontSize="8px"
                      color="#7183A3"
                      mb={0.5}
                      textTransform="uppercase"
                      letterSpacing="0.3px"
                    >
                      Last updated
                    </Text>

                    <Text
                      fontSize="10px"
                      fontWeight="600"
                      color={DARK}
                    >
                      {formatDate(
                        family.updated_at
                      )}
                    </Text>

                    <Text
                      fontSize="8px"
                      color="#7183A3"
                      mt={0.5}
                    >
                      by Parish Admin
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* UNSAVED CHANGES */}

              {hasChanges && (
                <Box
                  border="1px solid"
                  borderColor="#FED7D7"
                  borderRadius="6px"
                  bg="#FFF5F5"
                  p={3}
                >
                  <HStack gap={2} mb={1.5}>
                    <Box color="#F97316">
                      <LuTriangleAlert
                        size={13}
                      />
                    </Box>

                    <Text
                      fontSize="11px"
                      fontWeight="700"
                      color="#F97316"
                    >
                      Unsaved Changes
                    </Text>
                  </HStack>

                  <HStack align="start" gap={2}>
                    <Box color="#F97316">
                      <LuClock3 size={12} />
                    </Box>

                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="600"
                        color="#F97316"
                      >
                        {modifiedFields.length}{" "}
                        {modifiedFields.length === 1
                          ? "field"
                          : "fields"}{" "}
                        modified
                      </Text>

                      <Text
                        fontSize="8px"
                        color="#7183A3"
                        mt={1}
                        lineHeight="1.4"
                      >
                        Please review your changes
                        before saving.
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              )}

              {/* DANGER ZONE */}

              <Box
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                bg="white"
                p={3}
                boxShadow="0 1px 2px rgba(16, 24, 40, 0.02)"
              >
                <HStack gap={2} mb={1.5}>
                  <Box color={RED}>
                    <LuArchive size={13} />
                  </Box>

                  <Text
                    fontSize="11px"
                    fontWeight="700"
                    color={RED}
                  >
                    Danger Zone
                  </Text>
                </HStack>

                <Button
                  variant="ghost"
                  color={RED}
                  fontWeight="600"
                  fontSize="10px"
                  px={0}
                  h="auto"
                  justifyContent="flex-start"
                  _hover={{
                    bg: "transparent",
                    color: "#650A18",
                  }}
                  type="button"
                >
                  <LuArchive
                    style={{
                      marginRight: "6px",
                      fontSize: "11px",
                    }}
                  />

                  Archive Family Record
                </Button>

                <Text
                  fontSize="8px"
                  color="#7183A3"
                  mt={1}
                  lineHeight="1.4"
                >
                  This family record will remain in
                  history.
                </Text>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      {/* ======================================================
          BOTTOM ACTION BAR
      ====================================================== */}

      <Box
        borderTop="1px solid"
        borderColor={BORDER}
        bg="white"
      >
        <Box
          w="100%"
          px={{
            base: 2,
            md: 3,
          }}
          py={2}
        >
          <Flex
            justify="flex-end"
            align="center"
            gap={1.5}
          >
            <Button
              type="button"
              variant="outline"
              borderColor={RED}
              color={RED}
              h="28px"
              px={4}
              borderRadius="5px"
              fontSize="10px"
              fontWeight="600"
              onClick={handleCancel}
              disabled={saving}
              _hover={{
                bg: "#FFF5F7",
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              h="28px"
              px={5}
              bg={PRIMARY_MAROON}
              color="white"
              borderRadius="5px"
              fontSize="10px"
              fontWeight="600"
              loading={saving}
              disabled={!hasChanges || saving}
              onClick={handleSubmit}
              _hover={{
                bg: "#650A18",
              }}
              _disabled={{
                opacity: 0.55,
                cursor: "not-allowed",
              }}
            >
              Update Family
            </Button>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default FamilyEditPage;