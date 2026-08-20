import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
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

        <Container
          maxW="container.xl"
          py={10}
          flex="1"
        >
          <Text color="#60708C">
            Loading family...
          </Text>
        </Container>

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

        <Container
          maxW="container.xl"
          py={10}
          flex="1"
        >
          <Text
            color="red.600"
            mb={5}
          >
            {error ||
              "Family record not found."}
          </Text>

          <Button
            onClick={() =>
              navigate("/family-master")
            }
          >
            Back to Family Master
          </Button>
        </Container>

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
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="container.xl"
        py={3}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={3}
          mb={2}
          fontSize="sm"
          color="#60708C"
          flexWrap="wrap"
        >
          <Text>Masters</Text>

          <Text>/</Text>

          <Text>Family Master</Text>

          <Text>/</Text>

          <Text>
            {family.family_name}
          </Text>

          <Text>/</Text>

          <Text>Edit</Text>
        </HStack>

        {/* ==================================================
            PAGE TITLE
        ================================================== */}

        <Box mb={3}>
          <Heading
            fontSize={{
              base: "28px",
              md: "32px",
            }}
            color="#182338"
            lineHeight="1.2"
            mb={1}
          >
            Edit Family
          </Heading>

          <Text
            color="#60708C"
            fontSize="sm"
          >
            Update family information, origin and history.
          </Text>
        </Box>

        {/* ==================================================
            FAMILY SUMMARY
        ================================================== */}

        <Box
          border="1px solid #DCE2EA"
          borderRadius="10px"
          p={{
            base: 4,
            md: 5,
          }}
          mb={4}
        >
          <Flex
            align="center"
            gap={4}
          >
            {/* CIRCLE */}

            <Box
              w={{
                base: "58px",
                md: "72px",
              }}
              h={{
                base: "58px",
                md: "72px",
              }}
              flexShrink={0}
              borderRadius="50%"
              border="1px solid #F0B8C5"
              bg="#FFF9FA"
            />

            <Box>
              <Heading
                fontSize={{
                  base: "22px",
                  md: "26px",
                }}
                color="#182338"
                mb={1}
              >
                {family.family_name}
              </Heading>

              <HStack
                gap={3}
                fontSize="sm"
                color="#60708C"
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
                  px={2.5}
                  py={1}
                  borderRadius="6px"
                  bg="#EAF8EC"
                  border="1px solid #B9E4BE"
                >
                  <Text
                    fontSize="xs"
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

        <SimpleGrid
          columns={{
            base: 1,
            lg: 3,
          }}
          gap={4}
          alignItems="start"
        >
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <Box
            gridColumn={{
              base: "span 1",
              lg: "span 2",
            }}
            border="1px solid #DCE2EA"
            borderRadius="10px"
            overflow="hidden"
          >
            {/* TAB */}

            <Box
              h="52px"
              borderBottom="1px solid #DCE2EA"
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize="sm"
                fontWeight="700"
                color="#D7193F"
              >
                Family Details
              </Text>

              <Box
                position="absolute"
                bottom="-1px"
                left="16px"
                width="50%"
                maxW="540px"
                h="2px"
                bg="#D7193F"
              />
            </Box>

            {/* FORM AREA */}

            <Box
              p={{
                base: 4,
                md: 5,
              }}
            >
              <Heading
                fontSize="17px"
                color="#182338"
                mb={5}
              >
                Family Information
              </Heading>

              {error && (
                <Box
                  mb={5}
                  p={3}
                  borderRadius="7px"
                  bg="#FFF5F5"
                  border="1px solid #FED7D7"
                >
                  <Text
                    color="red.600"
                    fontSize="sm"
                  >
                    {error}
                  </Text>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <VStack
                  align="stretch"
                  gap={5}
                >
                  {/* FAMILY NAME */}

                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="#182338"
                      mb={2}
                    >
                      Family Name{" "}
                      <Text
                        as="span"
                        color="#D7193F"
                      >
                        *
                      </Text>
                    </Text>

                    <Input
                      name="family_name"
                      value={form.family_name}
                      onChange={handleChange}
                      h="44px"
                      borderColor="#DCE2EA"
                      borderRadius="7px"
                      color="#344054"
                      _hover={{
                        borderColor:
                          "#B9C3D1",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow:
                          `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>

                  {/* ORIGIN */}

                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="#182338"
                      mb={2}
                    >
                      Origin
                    </Text>

                    <Input
                      name="origin"
                      value={form.origin}
                      onChange={handleChange}
                      h="44px"
                      borderColor="#DCE2EA"
                      borderRadius="7px"
                      color="#344054"
                      _hover={{
                        borderColor:
                          "#B9C3D1",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow:
                          `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>

                  {/* HISTORY */}

                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="#182338"
                      mb={2}
                    >
                      History
                    </Text>

                    <Textarea
                      name="history"
                      value={form.history}
                      onChange={handleChange}
                      rows={5}
                      resize="vertical"
                      borderColor="#DCE2EA"
                      borderRadius="7px"
                      color="#344054"
                      _hover={{
                        borderColor:
                          "#B9C3D1",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY_MAROON,
                        boxShadow:
                          `0 0 0 1px ${PRIMARY_MAROON}`,
                      }}
                    />
                  </Box>
                </VStack>
              </form>
            </Box>
          </Box>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <VStack
            align="stretch"
            gap={4}
          >
            {/* ==================================================
                RECORD INFORMATION
            ================================================== */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              p={5}
            >
              <HStack
                gap={3}
                mb={5}
              >
                <Box
                  p={2}
                  borderRadius="7px"
                  bg="#FFF0F4"
                  color="#D7193F"
                >
                  <LuFileText size={17} />
                </Box>

                <Heading
                  fontSize="16px"
                  color="#182338"
                >
                  Record Information
                </Heading>
              </HStack>

              {/* CREATED */}

              <HStack
                align="start"
                gap={3}
                mb={5}
              >
                <Box color="#60708C">
                  <LuCalendarDays size={17} />
                </Box>

                <Box>
                  <Text
                    fontSize="xs"
                    color="#7183A3"
                    mb={1}
                  >
                    Created
                  </Text>

                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                  >
                    {formatDate(
                      family.created_at
                    )}
                  </Text>
                </Box>
              </HStack>

              {/* LAST UPDATED */}

              <HStack
                align="start"
                gap={3}
              >
                <Box color="#60708C">
                  <LuUserRound size={17} />
                </Box>

                <Box>
                  <Text
                    fontSize="xs"
                    color="#7183A3"
                    mb={1}
                  >
                    Last updated
                  </Text>

                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                  >
                    {formatDate(
                      family.updated_at
                    )}
                  </Text>

                  <Text
                    fontSize="xs"
                    color="#7183A3"
                    mt={1}
                  >
                    by Parish Admin
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* ==================================================
                UNSAVED CHANGES

                ONLY SHOW WHEN THERE ARE CHANGES
            ================================================== */}

            {hasChanges && (
              <Box
                border="1px solid #DCE2EA"
                borderRadius="10px"
                p={5}
              >
                <HStack
                  gap={3}
                  mb={4}
                >
                  <Box color="#F97316">
                    <LuTriangleAlert
                      size={18}
                    />
                  </Box>

                  <Heading
                    fontSize="16px"
                    color="#F97316"
                  >
                    Unsaved Changes
                  </Heading>
                </HStack>

                <HStack
                  align="start"
                  gap={3}
                >
                  <Box color="#F97316">
                    <LuClock3 size={17} />
                  </Box>

                  <Box>
                    <Text
                      fontSize="sm"
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
                      fontSize="xs"
                      color="#7183A3"
                      mt={2}
                      lineHeight="1.6"
                    >
                      Please review your changes
                      before saving.
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}

            {/* ==================================================
                DANGER ZONE
            ================================================== */}

            <Box
              border="1px solid #DCE2EA"
              borderRadius="10px"
              p={5}
            >
              <HStack
                gap={3}
                mb={4}
              >
                <Box color="#D7193F">
                  <LuArchive size={18} />
                </Box>

                <Heading
                  fontSize="16px"
                  color="#D7193F"
                >
                  Danger Zone
                </Heading>
              </HStack>

              <Button
                variant="ghost"
                color="#D7193F"
                fontWeight="600"
                px={0}
                justifyContent="flex-start"
                _hover={{
                  bg: "transparent",
                }}
                type="button"
              >
                <LuArchive
                  style={{
                    marginRight: "10px",
                  }}
                />

                Archive Family Record
              </Button>

              <Text
                fontSize="xs"
                color="#7183A3"
                mt={2}
                lineHeight="1.6"
              >
                This family record will remain in
                history.
              </Text>
            </Box>
          </VStack>
        </SimpleGrid>
      </Container>

      {/* ======================================================
          BOTTOM ACTION BAR
      ====================================================== */}

      <Box
        borderTop="1px solid #DCE2EA"
        bg="white"
        mt={5}
      >
        <Container
          maxW="container.xl"
          py={4}
        >
          <Flex
            justify="flex-end"
            gap={4}
          >
            <Button
              type="button"
              variant="outline"
              h="42px"
              minW="145px"
              borderColor="#D7193F"
              color="#D7193F"
              borderRadius="7px"
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
              h="42px"
              minW="180px"
              bg={PRIMARY_MAROON}
              color="white"
              borderRadius="7px"
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
              Update
            </Button>
          </Flex>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default FamilyEditPage;