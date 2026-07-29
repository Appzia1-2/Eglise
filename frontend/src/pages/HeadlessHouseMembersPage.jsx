import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  HStack,
  VStack,
  Avatar,
  Icon,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { LuArrowLeft, LuCrown } from "react-icons/lu";
import {
  listMembersByHouse,
  promoteToHead,
} from "../api/registryServices";

const HeadlessHouseMembersPage = () => {
  const { familyId, houseName } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotingId, setPromotingId] = useState(null);
  const decodedHouseName = decodeURIComponent(houseName);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await listMembersByHouse(familyId, decodedHouseName);
      setMembers(res.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [familyId, houseName]);

  const handlePromote = async (item) => {
    if (
      !window.confirm(
        `Promote ${item.name} to head of ${decodedHouseName}? This will give them full family head privileges.`,
      )
    )
      return;

    setPromotingId(item.id);
    try {
      await promoteToHead(item.id);
      window.alert(`${item.name} has been promoted to head.`);
      navigate("/members");
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to promote member.";
      window.alert(msg);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <Box p={6} maxW="900px" mx="auto">
      <HStack mb={2} spacing={3}>
        <Icon
          as={LuArrowLeft}
          boxSize={5}
          cursor="pointer"
          color="gray.500"
          _hover={{ color: "var(--primary-maroon)" }}
          onClick={() => navigate("/members")}
        />
        <Text fontSize="sm" color="gray.500">
          Back to Members
        </Text>
      </HStack>

      <VStack align="start" spacing={1} mb={6}>
        <HStack>
          <Heading size="lg" color="gray.800">
            {decodedHouseName}
          </Heading>
          <Badge colorScheme="red" fontSize="0.75em" px={2} py={0.5} borderRadius="full">
            No Active Head
          </Badge>
        </HStack>
        <Text color="gray.500" fontSize="sm">
          This house currently has no living head. Select a member below to
          promote them.
        </Text>
      </VStack>

      {isLoading ? (
        <Center py={16}>
          <Spinner color="var(--primary-maroon)" thickness="3px" size="lg" />
        </Center>
      ) : members.length === 0 ? (
        <Center
          py={16}
          borderRadius="lg"
          bg="gray.50"
          border="1px dashed"
          borderColor="gray.200"
        >
          <Text color="gray.500">No members found in this house.</Text>
        </Center>
      ) : (
        <Box
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          boxShadow="sm"
        >
          <Table.Root>
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Member</Table.ColumnHeader>
                <Table.ColumnHeader>Relationship</Table.ColumnHeader>
                <Table.ColumnHeader>Gender</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {members.map((m) => (
                <Table.Row key={m.id} _hover={{ bg: "gray.50" }}>
                  <Table.Cell>
                    <HStack spacing={3}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback name={m.name} />
                      </Avatar.Root>
                      <Text fontWeight="medium">{m.name}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="gray.600">
                      {m.relationship?.name || "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="gray.600">{m.gender || "—"}</Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Button
                      size="sm"
                      bg="var(--primary-maroon)"
                      color="white"
                      _hover={{ opacity: 0.9 }}
                      loading={promotingId === m.id}
                      onClick={() => handlePromote(m)}
                    >
                      <Icon as={LuCrown} mr={2} />
                      Promote to Head
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
};

export default HeadlessHouseMembersPage;