import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Flex,
  HStack,
  Icon,
  Table,
  SimpleGrid,
  Skeleton,
} from "@chakra-ui/react";
import { LuSearch, LuPrinter } from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listMemberAgeWise } from "../api/registryServices";
import apiClient from "../api/apiClient";

const MemberAgeWisePage = () => {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [churchName, setChurchName] = useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [order, setOrder] = useState("desc");

  const primaryMaroon = "var(--primary-maroon)";

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const params = { order };
      if (nameFilter) params.name = nameFilter;
      if (houseFilter) params.house = houseFilter;
      if (familyFilter) params.family = familyFilter;
      if (phoneFilter) params.phone = phoneFilter;
      if (ageMin) params.age_min = ageMin;
      if (ageMax) params.age_max = ageMax;

      const res = await listMemberAgeWise(params);
      setMembers(res.data.members || []);
      setTotalMembers(res.data.total_members || 0);
    } catch (err) {
      console.error("Error fetching age-wise list:", err);
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
    fetchList();
    fetchChurch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchList();
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
              Age Wise List
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
          <SimpleGrid columns={{ base: 2, md: 8 }} gap={2.5} alignItems="center">
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
              as="select"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              size="sm"
              bg="white"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              fontSize="sm"
              h="32px"
              px={2}
            >
              <option value="desc">Oldest first</option>
              <option value="asc">Youngest first</option>
            </Box>
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

        {/* Table — screen view */}
        <Box className="no-print" overflowX="auto">
          {isLoading ? (
            <Box>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="40px" mb={1} borderRadius="md" />
              ))}
            </Box>
          ) : members.length > 0 ? (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg="rgba(123,13,30,0.06)">
                  <Table.ColumnHeader color={primaryMaroon} fontSize="11px">
                    Name
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color={primaryMaroon} fontSize="11px">
                    Age
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color={primaryMaroon} fontSize="11px">
                    Family
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color={primaryMaroon} fontSize="11px">
                    House
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color={primaryMaroon} fontSize="11px">
                    Phone
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {members.map((m, index) => (
                  <Table.Row key={m.id} bg={index % 2 === 0 ? "gray.50" : "white"}>
                    <Table.Cell fontWeight="500" fontSize="sm">
                      {m.name}
                      {m.is_family_head && (
                        <Text as="span" fontSize="9px" color={primaryMaroon} ml={2}>
                          HEAD
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell fontSize="sm">{m.age ?? "—"}</Table.Cell>
                    <Table.Cell fontSize="xs" color="gray.600">
                      {m.family_name || "—"}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" color="gray.600">
                      {m.house_name || "—"}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" color="gray.600">
                      {m.mobile_no || m.phone_no || "—"}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
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
              Age Wise Member List
            </Text>
          </Box>

          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid black" }}>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Age</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Family</th>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px" }}>{m.name}</td>
                  <td style={{ padding: "4px" }}>{m.age ?? "—"}</td>
                  <td style={{ padding: "4px" }}>{m.family_name || "—"}</td>
                  <td style={{ padding: "4px" }}>
                    {m.mobile_no || m.phone_no || "—"}
                  </td>
                </tr>
              ))}
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

export default MemberAgeWisePage;