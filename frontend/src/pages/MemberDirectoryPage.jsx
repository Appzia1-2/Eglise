import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Flex,
  HStack,
  VStack,
  Icon,
  SimpleGrid,
  Skeleton,
} from "@chakra-ui/react";
import { LuSearch, LuPhone, LuPrinter } from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listMemberDirectory } from "../api/registryServices";
import apiClient from "../api/apiClient";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const MemberDirectoryPage = () => {
  const [households, setHouseholds] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [churchName, setChurchName] = useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  const primaryMaroon = "var(--primary-maroon)";

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (nameFilter) params.name = nameFilter;
      if (houseFilter) params.house = houseFilter;
      if (familyFilter) params.family = familyFilter;
      if (phoneFilter) params.phone = phoneFilter;
      if (ageMin) params.age_min = ageMin;
      if (ageMax) params.age_max = ageMax;

      const res = await listMemberDirectory(params);
      setHouseholds(res.data.households || []);
      setTotalMembers(res.data.total_members || 0);
    } catch (err) {
      console.error("Error fetching member directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurch = async () => {
    try {
      const res = await apiClient.get("/api/registry/my-church/");
      setChurchName(res.data?.name || "");
    } catch (err) {
      console.error("Error fetching church name:", err);
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchChurch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDirectory();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box bg="white" minH="100vh" display="flex" flexDirection="column">
      <Box className="no-print">
        <Navbar />
      </Box>

      <Container maxW="container.md" flex="1" py={6}>
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          mb={5}
          flexWrap="wrap"
          gap={3}
          className="no-print"
        >
          <HStack spacing={3}>
            <Box
              w="4px"
              h="26px"
              borderRadius="full"
              bg="linear-gradient(180deg, #9b1b30 0%, #6b0f1a 100%)"
            />
            <Heading
              size="md"
              fontWeight="800"
              style={{
                background:
                  "linear-gradient(135deg, #7b0d1e 30%, #c0392b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Member Directory
            </Heading>
            <Box
              px={2}
              py="1px"
              borderRadius="full"
              bg="rgba(123,13,30,0.08)"
              border="1px solid rgba(123,13,30,0.15)"
            >
              <Text fontSize="10px" fontWeight="700" color={primaryMaroon}>
                {totalMembers} members
              </Text>
            </Box>
          </HStack>

          <Box
            as="button"
            onClick={handlePrint}
            border="1px solid"
            borderColor="gray.200"
            color="gray.600"
            px={4}
            py={2}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            _hover={{ bg: "gray.50", borderColor: "gray.300" }}
          >
            <Icon as={LuPrinter} fontSize="14px" />
            Print
          </Box>
        </Flex>

        {/* Filters */}
        <Box
          as="form"
          onSubmit={handleSearch}
          mb={6}
          p={4}
          bg="gray.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.100"
          className="no-print"
        >
          <SimpleGrid columns={{ base: 2, md: 7 }} gap={2.5} alignItems="center">
            <Input
              placeholder="Member name"
              size="sm"
              bg="white"
              borderRadius="md"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <Input
              placeholder="Family name"
              size="sm"
              bg="white"
              borderRadius="md"
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
            />
            <Input
              placeholder="House name"
              size="sm"
              bg="white"
              borderRadius="md"
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
            />
            <Input
              placeholder="Phone number"
              size="sm"
              bg="white"
              borderRadius="md"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
            />
            <Input
              placeholder="Min age"
              size="sm"
              bg="white"
              borderRadius="md"
              type="number"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
            />
            <Input
              placeholder="Max age"
              size="sm"
              bg="white"
              borderRadius="md"
              type="number"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
            />
            <Box
              as="button"
              type="submit"
              bg={primaryMaroon}
              color="white"
              px={4}
              h="32px"
              borderRadius="md"
              fontSize="xs"
              fontWeight="bold"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              gap={1.5}
              _hover={{ bg: "#6b0f1a" }}
            >
              <Icon as={LuSearch} fontSize="12px" />
              Search
            </Box>
          </SimpleGrid>
        </Box>

        {/* Household cards (screen view) */}
        <Box className="no-print">
          {isLoading ? (
            <VStack align="stretch" spacing={4}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="120px" borderRadius="xl" />
              ))}
            </VStack>
          ) : households.length > 0 ? (
            <VStack align="stretch" spacing={4}>
              {households.map((household) => {
                const head =
                  household.members.find((m) => m.is_family_head) ||
                  household.members[0];
                const otherMembers = household.members
                  .filter((m) => m.id !== head?.id)
                  .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));

                const key = `${household.family_name}-${household.house_name}`;

                return (
                  <Box
                    key={key}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.100"
                    borderRadius="xl"
                    overflow="hidden"
                    boxShadow="0 2px 10px -4px rgba(0,0,0,0.06)"
                  >
                    {/* Family + House name header */}
                    <Flex
                      justify="space-between"
                      align="center"
                      px={5}
                      py={3}
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <Box>
                        <Text fontWeight="700" fontSize="15px" color="gray.800">
                          {household.family_name}
                        </Text>
                        <Text fontSize="11px" color="gray.400" fontWeight="500">
                          
                        </Text>
                      </Box>
                      <Text fontSize="xs" color="gray.400" fontWeight="500">
                        {household.members.length} members
                      </Text>
                    </Flex>

                    {/* Head row */}
                    <HStack px={5} py={3} spacing={3} bg="rgba(123,13,30,0.03)">
                      <Box
                        w="36px"
                        h="36px"
                        borderRadius="full"
                        bg="rgba(123,13,30,0.1)"
                        color={primaryMaroon}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="13px"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        {getInitials(head?.name)}
                      </Box>
                      <Box flex={1} minW={0}>
                        <HStack spacing={2}>
                          <Text fontWeight="700" fontSize="sm" color="gray.800">
                            {head?.name || "—"}
                          </Text>
                          <Box
                            px={2}
                            py="1px"
                            bg="rgba(123,13,30,0.1)"
                            borderRadius="full"
                          >
                            <Text
                              fontSize="9px"
                              fontWeight="700"
                              color={primaryMaroon}
                            >
                              HEAD
                            </Text>
                          </Box>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {head?.age ? `${head.age} yrs` : "Age N/A"}
                        </Text>
                      </Box>
                      <HStack spacing={1} color="gray.500">
                        <Icon as={LuPhone} fontSize="12px" />
                        <Text fontSize="xs" fontWeight="500">
                          {head?.mobile_no || head?.phone_no || "—"}
                        </Text>
                      </HStack>
                    </HStack>

                    {/* Other members */}
                    {otherMembers.length > 0 && (
                      <VStack align="stretch" spacing={0}>
                        {otherMembers.map((m, index) => (
                          <Flex
                            key={m.id}
                            px={5}
                            pl="72px"
                            py={2.5}
                            borderTop="1px solid"
                            borderColor="gray.50"
                            bg={index % 2 === 0 ? "gray.50" : "white"}
                            align="center"
                          >
                            <Box flex="1.2" minW={0}>
                              <Text
                                fontSize="sm"
                                color="gray.700"
                                fontWeight="500"
                              >
                                {m.name}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {m.age ? `${m.age} yrs` : "Age N/A"}
                              </Text>
                            </Box>

                            <Box flex="1" textAlign="center">
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="500"
                              >
                                {m.relationship || "—"}
                              </Text>
                            </Box>

                            <Box flex="1" textAlign="right">
                              <Text fontSize="xs" color="gray.500">
                                {m.mobile_no || m.phone_no || "—"}
                              </Text>
                            </Box>
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <Box textAlign="center" py={20} bg="gray.50" borderRadius="xl">
              <Text color="gray.400">No members found.</Text>
            </Box>
          )}
        </Box>

        {/* PRINT-ONLY VIEW */}
        <Box className="print-only" display="none">
          <Box textAlign="center" mb={4} borderBottom="2px solid black" pb={2}>
            <Text fontSize="18px" fontWeight="700">
              {churchName || "Church Name"}
            </Text>
            <Text fontSize="12px" color="gray.600">
              Member Directory
            </Text>
          </Box>

          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid black" }}>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Family</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Age</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Relation</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {households.map((household) => {
                const head =
                  household.members.find((m) => m.is_family_head) ||
                  household.members[0];
                const otherMembers = household.members
                  .filter((m) => m.id !== head?.id)
                  .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));

                return (
                  <React.Fragment
                    key={`${household.family_name}-${household.house_name}`}
                  >
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <td style={{ padding: "4px", fontWeight: "bold" }}>
                        {household.family_name}
                      </td>
                      <td style={{ padding: "4px", fontWeight: "bold" }}>
                        {head?.name || "—"} (Head)
                      </td>
                      <td style={{ padding: "4px" }}>{head?.age ?? "—"}</td>
                      <td style={{ padding: "4px" }}>—</td>
                      <td style={{ padding: "4px" }}>
                        {head?.mobile_no || head?.phone_no || "—"}
                      </td>
                    </tr>
                    {otherMembers.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "4px" }}></td>
                        <td style={{ padding: "4px" }}>{m.name}</td>
                        <td style={{ padding: "4px" }}>{m.age ?? "—"}</td>
                        <td style={{ padding: "4px" }}>
                          {m.relationship || "—"}
                        </td>
                        <td style={{ padding: "4px" }}>
                          {m.mobile_no || m.phone_no || "—"}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Container>

      <Box className="no-print">
        <Footer />
      </Box>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </Box>
  );
};

export default MemberDirectoryPage;