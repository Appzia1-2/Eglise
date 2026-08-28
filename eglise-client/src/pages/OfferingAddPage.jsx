// src/pages/OfferingAddPage.jsx

import React, { useState, useEffect } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  HStack,
  SimpleGrid,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createOffering,
  listEvents,
  listMembers,
} from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

const OfferingAddPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    event: "",
    member: "",
    amount: "",
    narration: "",
  });

  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  // ==========================================================
  // FETCH OPTIONS
  // ==========================================================

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        const [eRes, mRes] = await Promise.all([
          listEvents(),
          listMembers(),
        ]);

        const eventsData = eRes?.data ?? eRes;
        const membersData = mRes?.data ?? mRes;

        const eventsList = Array.isArray(eventsData)
          ? eventsData
          : eventsData?.results || [];

        const membersList = Array.isArray(membersData)
          ? membersData
          : membersData?.results || [];

        setEvents(eventsList);
        setMembers(membersList);
      } catch (err) {
        console.error("Error fetching options:", err);
        setError("Unable to load events or members.");
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchOptions();
  }, []);

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

    if (!form.event) {
      setError("Please select an event.");
      return;
    }

    if (!form.member) {
      setError("Please select a member.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createOffering({
        event: parseInt(form.event),
        member: parseInt(form.member),
        amount: parseFloat(form.amount),
        narration: form.narration.trim(),
        // is_cancelled defaults to false on backend
      });

      navigate("/offerings", {
        replace: true,
      });
    } catch (err) {
      console.error("Create offering error:", err);

      const data = err?.response?.data;

      if (data?.event) {
        setError(
          Array.isArray(data.event)
            ? data.event[0]
            : data.event
        );
      } else if (data?.member) {
        setError(
          Array.isArray(data.member)
            ? data.member[0]
            : data.member
        );
      } else if (data?.amount) {
        setError(
          Array.isArray(data.amount)
            ? data.amount[0]
            : data.amount
        );
      } else if (data?.detail) {
        setError(
          Array.isArray(data.detail)
            ? data.detail[0]
            : data.detail
        );
      } else {
        setError("Unable to create offering.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  if (fetchingOptions) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />
        <Container maxW="container.xl" py={4} flex="1">
          <Text color="#60708C" fontSize="sm">
            Loading options...
          </Text>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      height="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Navbar />

      <Box
        flex="1"
        minH="0"
        overflow="hidden"
      >
        <Container
          maxW="container.xl"
          height="100%"
          py={2}
          overflow="auto"
        >
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap={3}
            mb={3}
            fontSize="sm"
            color="#52627A"
          >
            <Text>Offerings</Text>
            <Text>/</Text>
            <Text>Member Offerings</Text>
            <Text>/</Text>
            <Text>Add Offering</Text>
          </HStack>

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <Box mb={3}>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="#D7193F"
              mb={1}
            >
              OFFERING MASTER
            </Text>

            <Heading
              fontSize={{
                base: "24px",
                md: "28px",
              }}
              lineHeight="1.2"
              color="#182338"
              mb={1}
            >
              Add Offering
            </Heading>

            <Text
              color="#60708C"
              fontSize="sm"
            >
              Create a new member offering record.
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
              md: 6,
            }}
            py={{
              base: 4,
              md: 5,
            }}
          >
            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <Box
                mb={4}
                p={3}
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
                  base: "18px",
                  md: "20px",
                }}
                color="#182338"
                mb={4}
              >
                1. Offering Information
              </Heading>

              {/* ==================================================
                  EVENT + MEMBER
              ================================================== */}

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2,
                }}
                gap={{
                  base: 4,
                  md: 5,
                }}
                mb={4}
              >
                {/* EVENT */}

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                    mb={1.5}
                  >
                    Event{" "}
                    <Text
                      as="span"
                      color="#D7193F"
                    >
                      *
                    </Text>
                  </Text>

                  <select
                    name="event"
                    value={form.event}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "44px",
                      fontSize: "14px",
                      border: "1px solid #DCE2EA",
                      borderRadius: "7px",
                      padding: "0 14px",
                      color: "#344054",
                      backgroundColor: "white",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PRIMARY_MAROON;
                      e.target.style.boxShadow = `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#DCE2EA";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select event</option>
                    {events && events.length > 0 ? (
                      events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No events available</option>
                    )}
                  </select>
                </Box>

                {/* MEMBER */}

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                    mb={1.5}
                  >
                    Member{" "}
                    <Text
                      as="span"
                      color="#D7193F"
                    >
                      *
                    </Text>
                  </Text>

                  <select
                    name="member"
                    value={form.member}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "44px",
                      fontSize: "14px",
                      border: "1px solid #DCE2EA",
                      borderRadius: "7px",
                      padding: "0 14px",
                      color: "#344054",
                      backgroundColor: "white",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PRIMARY_MAROON;
                      e.target.style.boxShadow = `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#DCE2EA";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select member</option>
                    {members && members.length > 0 ? (
                      members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No members available</option>
                    )}
                  </select>
                </Box>
              </SimpleGrid>

              {/* ==================================================
                  AMOUNT + NARRATION
              ================================================== */}

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2,
                }}
                gap={{
                  base: 4,
                  md: 5,
                }}
                mb={4}
              >
                {/* AMOUNT */}

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                    mb={1.5}
                  >
                    Amount{" "}
                    <Text
                      as="span"
                      color="#D7193F"
                    >
                      *
                    </Text>
                  </Text>

                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    h="44px"
                    fontSize="14px"
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

                {/* NARRATION */}

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="#182338"
                    mb={1.5}
                  >
                    Narration
                  </Text>

                  <Input
                    name="narration"
                    value={form.narration}
                    onChange={handleChange}
                    placeholder="Enter narration (optional)"
                    h="44px"
                    fontSize="14px"
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
                  DIVIDER
              ================================================== */}

              <Box
                borderTop="1px solid"
                borderColor="#DCE2EA"
                mt={4}
                pt={4}
              >
                {/* ==================================================
                    BUTTONS
                ================================================== */}

                <HStack
                  justify="flex-end"
                  gap={3}
                >
                  {/* CANCEL */}

                  <Button
                    type="button"
                    variant="outline"
                    h="40px"
                    minW={{
                      base: "100px",
                      md: "140px",
                    }}
                    borderColor="#D7193F"
                    color="#D7193F"
                    borderRadius="7px"
                    fontWeight="600"
                    fontSize="14px"
                    onClick={() =>
                      navigate("/offerings")
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
                    h="40px"
                    minW={{
                      base: "100px",
                      md: "140px",
                    }}
                    bg={PRIMARY_MAROON}
                    color="white"
                    borderRadius="7px"
                    fontWeight="600"
                    fontSize="14px"
                    isLoading={loading}
                    loadingText="Saving..."
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
      </Box>

      <Footer />
    </Box>
  );
};

export default OfferingAddPage;