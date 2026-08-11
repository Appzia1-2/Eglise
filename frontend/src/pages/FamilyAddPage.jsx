import React, { useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  HStack,
  SimpleGrid,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createFamily } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const FamilyAddPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    family_name: "",
    origin: "",
    history: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.family_name.trim()) {
      setError("Family name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createFamily({
        family_name: form.family_name.trim(),
        origin: form.origin.trim(),
        history: form.history.trim(),
      });

      navigate("/family", {
        replace: true,
      });
    } catch (err) {
      console.error("Create family error:", err);

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
        setError("Unable to create family.");
      }
    } finally {
      setLoading(false);
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
      <Navbar />

      <Container
        maxW="container.xl"
        py={4}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={3}
          mb={6}
          fontSize="sm"
          color="#52627A"
        >
          <Text>Masters</Text>

          <Text>/</Text>

          <Text>Family Master</Text>

          <Text>/</Text>

          <Text>Add Family</Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="700"
            color="#D7193F"
            mb={2}
          >
            FAMILY MASTER
          </Text>

          <Heading
            fontSize={{
              base: "28px",
              md: "36px",
            }}
            lineHeight="1.2"
            color="#182338"
            mb={2}
          >
            Add Family Details
          </Heading>

          <Text
            color="#60708C"
            fontSize="sm"
          >
            Create a family record with origin and history
            information.
          </Text>
        </Box>

        {/* ==================================================
            MAIN CARD
        ================================================== */}

        <Box
          border="1px solid"
          borderColor="#DCE2EA"
          borderRadius="10px"
          px={{
            base: 4,
            md: 7,
          }}
          py={{
            base: 5,
            md: 6,
          }}
        >
          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <Box
              mb={6}
              p={4}
              borderRadius="8px"
              bg="#FFF5F5"
              border="1px solid"
              borderColor="#FED7D7"
            >
              <Text
                color="red.600"
                fontSize="sm"
                fontWeight="500"
              >
                {error}
              </Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            {/* ==================================================
                SECTION TITLE
            ================================================== */}

            <Heading
              fontSize={{
                base: "20px",
                md: "22px",
              }}
              color="#182338"
              mb={6}
            >
              1. Family Information
            </Heading>

            {/* ==================================================
                FAMILY NAME + ORIGIN
            ================================================== */}

            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
              }}
              gap={{
                base: 5,
                md: 6,
              }}
              mb={6}
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
                  placeholder="Enter family name"
                  h="54px"
                  fontSize="15px"
                  borderColor="#DCE2EA"
                  borderRadius="7px"
                  color="#344054"
                  _placeholder={{
                    color: "#7183A3",
                  }}
                  _hover={{
                    borderColor: "#B9C3D1",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
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
                  placeholder="Enter place of origin"
                  h="54px"
                  fontSize="15px"
                  borderColor="#DCE2EA"
                  borderRadius="7px"
                  color="#344054"
                  _placeholder={{
                    color: "#7183A3",
                  }}
                  _hover={{
                    borderColor: "#B9C3D1",
                  }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Box>
            </SimpleGrid>

            {/* ==================================================
                HISTORY
            ================================================== */}

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
                placeholder="Enter family history"
                rows={6}
                resize="vertical"
                fontSize="15px"
                borderColor="#DCE2EA"
                borderRadius="7px"
                color="#344054"
                _placeholder={{
                  color: "#7183A3",
                }}
                _hover={{
                  borderColor: "#B9C3D1",
                }}
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />

              <Text
                fontSize="sm"
                color="#52627A"
                mt={3}
              >
                Add background, migration, heritage, or other
                relevant family details.
              </Text>
            </Box>

            {/* ==================================================
                DIVIDER
            ================================================== */}

            <Box
              borderTop="1px solid"
              borderColor="#DCE2EA"
              mt={7}
              pt={6}
            >
              {/* ==================================================
                  BUTTONS
              ================================================== */}

              <HStack
                justify="flex-end"
                gap={4}
              >
                {/* CANCEL */}

                <Button
                  type="button"
                  variant="outline"
                  h="50px"
                  minW={{
                    base: "120px",
                    md: "170px",
                  }}
                  borderColor="#D7193F"
                  color="#D7193F"
                  borderRadius="7px"
                  fontWeight="600"
                  fontSize="15px"
                  onClick={() =>
                    navigate("/family")
                  }
                  disabled={loading}
                  _hover={{
                    bg: "#FFF5F7",
                  }}
                >
                  Cancel
                </Button>

                {/* SAVE */}

                <Button
                  type="submit"
                  h="50px"
                  minW={{
                    base: "120px",
                    md: "170px",
                  }}
                  bg={PRIMARY_MAROON}
                  color="white"
                  borderRadius="7px"
                  fontWeight="600"
                  fontSize="15px"
                  loading={loading}
                  _hover={{
                    bg: "#650A18",
                  }}
                >
                  Save
                </Button>
              </HStack>
            </Box>
          </form>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default FamilyAddPage;