import React, { useState } from "react";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import {
  LuArrowLeft,
  LuSave,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createWard } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const WardAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ward_name: "",
    ward_number: "",
    place: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    const wardName = formData.ward_name.trim();
    const wardNumber = String(formData.ward_number).trim();
    const place = formData.place.trim();

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!wardName) {
      setError("Ward name is required.");
      return;
    }

    if (!wardNumber) {
      setError("Ward number is required.");
      return;
    }

    const number = Number(wardNumber);

    if (!Number.isInteger(number) || number <= 0) {
      setError("Ward number must be a positive whole number.");
      return;
    }

    if (!place) {
      setError("Place is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createWard({
        ward_name: wardName,
        ward_number: number,
        place: place,
      });

      navigate("/ward");
    } catch (err) {
      console.error("Error creating ward:", err);

      const data = err?.response?.data;

      const apiError =
        data?.ward_number?.[0] ||
        data?.ward_name?.[0] ||
        data?.place?.[0] ||
        data?.detail ||
        "Unable to create ward.";

      setError(apiError);
    } finally {
      setSaving(false);
    }
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
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <Container
        maxW="container.xl"
        px={{ base: 4, md: 6 }}
        py={{ base: 4, md: 5 }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={5}
          fontSize="sm"
          color="#60708C"
          flexWrap="wrap"
        >
          <Text>Masters</Text>

          <Text>/</Text>

          <Text>Ward Master</Text>

          <Text>/</Text>

          <Text color="#344054">
            Add Ward
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Box mb={5}>
          <Text
            fontSize="13px"
            fontWeight="700"
            color="#D7193F"
            mb={1}
          >
            WARD MASTER
          </Text>

          <Heading
            color="#182338"
            fontSize={{
              base: "28px",
              md: "34px",
            }}
            lineHeight="1.2"
            mb={1}
          >
            Add Ward
          </Heading>

          <Text
            color="#60708C"
            fontSize="14px"
          >
            Create a ward record.
          </Text>
        </Box>

        {/* ==================================================
            FORM CARD
        ================================================== */}

        <Box
          border="1px solid #DCE2EA"
          borderRadius="10px"
          overflow="hidden"
          bg="white"
        >
          {/* =================================================
              CARD HEADER
          ================================================= */}

          <Box
            px={{ base: 4, md: 6 }}
            py={5}
            borderBottom="1px solid #E6EAF0"
          >
            <Heading
              fontSize={{
                base: "18px",
                md: "20px",
              }}
              color="#182338"
            >
              1. Ward Information
            </Heading>
          </Box>

          {/* =================================================
              FORM BODY
          ================================================= */}

          <Box
            p={{
              base: 4,
              md: 6,
            }}
          >
            <SimpleGrid
              columns={{
                base: 1,
                md: 3,
              }}
              gap={{
                base: 5,
                md: 6,
              }}
            >
              {/* =================================================
                  WARD NAME
              ================================================= */}

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#182338"
                  mb={2}
                >
                  Ward Name{" "}
                  <Text
                    as="span"
                    color="#D7193F"
                  >
                    *
                  </Text>
                </Text>

                <Input
                  value={formData.ward_name}
                  onChange={(e) =>
                    handleChange(
                      "ward_name",
                      e.target.value
                    )
                  }
                  placeholder="Enter ward name"
                  h="42px"
                  fontSize="13px"
                  borderColor="#DCE2EA"
                  borderRadius="6px"
                  color="#182338"
                  _placeholder={{
                    color: "#8B98AB",
                  }}
                  _hover={{
                    borderColor: "#B8C2D0",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              {/* =================================================
                  WARD NUMBER
              ================================================= */}

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#182338"
                  mb={2}
                >
                  Ward Number{" "}
                  <Text
                    as="span"
                    color="#D7193F"
                  >
                    *
                  </Text>
                </Text>

                <Input
                  type="number"
                  min="1"
                  value={formData.ward_number}
                  onChange={(e) =>
                    handleChange(
                      "ward_number",
                      e.target.value
                    )
                  }
                  placeholder="Enter ward number"
                  h="42px"
                  fontSize="13px"
                  borderColor="#DCE2EA"
                  borderRadius="6px"
                  color="#182338"
                  _placeholder={{
                    color: "#8B98AB",
                  }}
                  _hover={{
                    borderColor: "#B8C2D0",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>

              {/* =================================================
                  PLACE
              ================================================= */}

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#182338"
                  mb={2}
                >
                  Place{" "}
                  <Text
                    as="span"
                    color="#D7193F"
                  >
                    *
                  </Text>
                </Text>

                <Input
                  value={formData.place}
                  onChange={(e) =>
                    handleChange(
                      "place",
                      e.target.value
                    )
                  }
                  placeholder="Enter place"
                  h="42px"
                  fontSize="13px"
                  borderColor="#DCE2EA"
                  borderRadius="6px"
                  color="#182338"
                  _placeholder={{
                    color: "#8B98AB",
                  }}
                  _hover={{
                    borderColor: "#B8C2D0",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>
            </SimpleGrid>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <Box
                mt={5}
                px={4}
                py={3}
                border="1px solid #FED7D7"
                bg="#FFF5F5"
                borderRadius="6px"
              >
                <Text
                  color="#C53030"
                  fontSize="12px"
                  fontWeight="500"
                >
                  {error}
                </Text>
              </Box>
            )}

            {/* =================================================
                ACTIONS
            ================================================= */}

            <Flex
              justify="flex-end"
              gap={3}
              mt={7}
              pt={5}
              borderTop="1px solid #E6EAF0"
              direction={{
                base: "column-reverse",
                sm: "row",
              }}
            >
              {/* CANCEL */}

              <Button
                variant="outline"
                h="42px"
                minW={{
                  base: "100%",
                  sm: "130px",
                }}
                px={6}
                fontSize="13px"
                fontWeight="600"
                borderColor="#D7193F"
                color="#D7193F"
                borderRadius="6px"
                onClick={() => navigate("/ward")}
                _hover={{
                  bg: "#FFF5F7",
                }}
              >
                Cancel
              </Button>

              {/* SAVE */}

              <Button
                bg={PRIMARY_MAROON}
                color="white"
                h="42px"
                minW={{
                  base: "100%",
                  sm: "150px",
                }}
                px={6}
                fontSize="13px"
                fontWeight="600"
                borderRadius="6px"
                loading={saving}
                onClick={handleSave}
                _hover={{
                  bg: "#650A18",
                }}
              >
                {!saving && (
                  <LuSave
                    size={16}
                    style={{
                      marginRight: "8px",
                    }}
                  />
                )}

                {saving ? "Saving..." : "Save Ward"}
              </Button>
            </Flex>
          </Box>
        </Box>
      </Container>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />
    </Box>
  );
};

export default WardAddPage;