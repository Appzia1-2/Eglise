import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Skeleton,
  Input,
  Flex,
} from "@chakra-ui/react";
import { LuUsers, LuCalendar, LuHash, LuSearch } from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listCommittees } from "../api/registryServices";

const CommitteeListReportPage = () => {
  const [committees, setCommittees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const primaryMaroon = "var(--primary-maroon)";

  useEffect(() => {
    const fetchCommittees = async () => {
      setIsLoading(true);
      try {
        const res = await listCommittees();
        setCommittees(res.data || []);
      } catch (err) {
        console.error("Error fetching committees:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommittees();
  }, []);

  const filteredCommittees = searchQuery.trim()
    ? committees.filter((c) =>
        String(c.committee_name ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : committees;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Box bg="white" minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="container.xl" flex="1" py={5}>
        <Box
          border="1px"
          borderColor="gray.200"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="sm"
          bg="white"
        >
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={4}
            borderBottom="2px"
            borderColor={primaryMaroon}
            bg="white"
            flexWrap="wrap"
            gap={3}
          >
            <HStack spacing={3} align="center">
              <Box
                w="4px"
                h="26px"
                borderRadius="full"
                bg="linear-gradient(180deg, #9b1b30 0%, #6b0f1a 100%)"
                flexShrink={0}
              />
              <Heading
                size="md"
                fontWeight="800"
                letterSpacing="tight"
                style={{
                  background:
                    "linear-gradient(135deg, #7b0d1e 30%, #c0392b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                List of Committee
              </Heading>
              <Box
                px={2}
                py="1px"
                borderRadius="full"
                bg="rgba(123,13,30,0.08)"
                border="1px solid rgba(123,13,30,0.15)"
              >
                <Text fontSize="10px" fontWeight="700" color={primaryMaroon}>
                  {filteredCommittees.length}
                </Text>
              </Box>
            </HStack>

            <Box position="relative" w={{ base: "full", md: "300px" }}>
              <Input
                placeholder="Search committee..."
                size="sm"
                borderRadius="lg"
                bg="rgba(174,32,80,0.03)"
                borderWidth="1px"
                borderColor="rgba(174,32,80,0.1)"
                fontSize="xs"
                pl={9}
                h="34px"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                _focus={{ bg: "white", borderColor: primaryMaroon }}
              />
              <Box
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
                pointerEvents="none"
              >
                <Icon as={LuSearch} fontSize="14px" />
              </Box>
            </Box>
          </Flex>

          {/* List */}
          <Box px={5} py={6}>
            {isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={`skeleton-${i}`}
                    p={5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg="white"
                    boxShadow="sm"
                  >
                    <VStack align="start" spacing={3}>
                      <Skeleton height="18px" width="70%" borderRadius="md" />
                      <Skeleton height="12px" width="50%" borderRadius="md" />
                      <Skeleton height="12px" width="60%" borderRadius="md" />
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            ) : filteredCommittees.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
                {filteredCommittees.map((c) => (
                  <Box
                    key={c.id}
                    p={5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg="white"
                    boxShadow="0 4px 20px -10px rgba(0,0,0,0.08)"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: "translateY(-4px)",
                      boxShadow:
                        "0 16px 30px -12px rgba(123, 13, 30, 0.15)",
                      borderColor: "rgba(123, 13, 30, 0.15)",
                    }}
                  >
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize="16px"
                          fontWeight="700"
                          color="gray.800"
                          noOfLines={1}
                        >
                          {c.committee_name}
                        </Text>
                        <HStack
                          spacing={1}
                          bg="rgba(123,13,30,0.06)"
                          px={2}
                          py="2px"
                          borderRadius="full"
                        >
                          <Icon as={LuHash} fontSize="10px" color={primaryMaroon} />
                          <Text fontSize="10px" fontWeight="700" color={primaryMaroon}>
                            {c.committee_code}
                          </Text>
                        </HStack>
                      </HStack>

                      <Box w="full" h="1px" bg="gray.50" />

                      <HStack spacing={2} color="gray.500">
                        <Icon as={LuCalendar} fontSize="13px" />
                        <Text fontSize="xs" fontWeight="500">
                          {formatDate(c.committee_from_date)} — {formatDate(c.committee_to_date)}
                        </Text>
                      </HStack>

                      {c.member_count !== undefined && (
                        <HStack spacing={2} color="gray.500">
                          <Icon as={LuUsers} fontSize="13px" />
                          <Text fontSize="xs" fontWeight="500">
                            {c.member_count} members
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" py={20} bg="gray.50" borderRadius="xl">
                <Text color="gray.400" fontSize="md" fontWeight="500">
                  {searchQuery.trim()
                    ? `No results for "${searchQuery}".`
                    : "No committees found."}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default CommitteeListReportPage;