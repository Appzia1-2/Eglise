import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

import {
  LuArrowLeft,
  LuCrown,
} from "react-icons/lu";

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

  // Decode house name from URL
  const decodedHouseName = decodeURIComponent(houseName || "");


  // ============================================================
  // FETCH MEMBERS
  // ============================================================

  const fetchMembers = async () => {
    setIsLoading(true);

    try {
      const response = await listMembersByHouse(
        familyId,
        decodedHouseName
      );

      setMembers(response.data || []);
    } catch (error) {
      console.error(
        "Error fetching members:",
        error
      );

      window.alert(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Failed to load members."
      );
    } finally {
      setIsLoading(false);
    }
  };


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    if (familyId && houseName) {
      fetchMembers();
    }
  }, [familyId, houseName]);


  // ============================================================
  // PROMOTE MEMBER TO HEAD
  // ============================================================

  const handlePromote = async (member) => {
    const confirmed = window.confirm(
      `Promote ${member.name} to head of ${decodedHouseName}?\n\n` +
      `This will give them full family head privileges.`
    );

    if (!confirmed) {
      return;
    }

    setPromotingId(member.id);

    try {
      await promoteToHead(member.id);

      window.alert(
        `${member.name} has been promoted to head successfully.`
      );

      /*
       * IMPORTANT:
       *
       * /members does NOT exist in your App.jsx.
       *
       * After promotion, go back to the family head dashboard.
       */
      navigate("/family-heads");
    } catch (error) {
      console.error(
        "Error promoting member:",
        error
      );

      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to promote member.";

      window.alert(message);
    } finally {
      setPromotingId(null);
    }
  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    navigate("/family-heads");
  };


  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <Center minH="60vh">
        <VStack gap={3}>
          <Spinner
            color="var(--primary-maroon)"
            thickness="3px"
            size="lg"
          />

          <Text color="gray.500">
            Loading members...
          </Text>
        </VStack>
      </Center>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <Box
      p={{ base: 4, md: 6 }}
      maxW="1100px"
      mx="auto"
    >

      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <HStack
        mb={5}
        gap={2}
        cursor="pointer"
        width="fit-content"
        onClick={handleBack}
        color="gray.500"
        _hover={{
          color: "var(--primary-maroon)",
        }}
      >
        <Icon
          as={LuArrowLeft}
          boxSize={5}
        />

        <Text fontSize="sm">
          Back to Family Heads
        </Text>
      </HStack>


      {/* ======================================================
          HEADER
      ====================================================== */}

      <VStack
        align="start"
        gap={1}
        mb={6}
      >

        <HStack
          gap={3}
          flexWrap="wrap"
        >

          <Heading
            size="lg"
            color="gray.800"
          >
            {decodedHouseName}
          </Heading>

          <Badge
            colorPalette="red"
            fontSize="0.75em"
            px={2}
            py={1}
            borderRadius="full"
          >
            No Active Head
          </Badge>

        </HStack>


        <Text
          color="gray.500"
          fontSize="sm"
        >
          This house currently has no living head.
          Select a member below to promote them.
        </Text>

      </VStack>


      {/* ======================================================
          NO MEMBERS
      ====================================================== */}

      {members.length === 0 ? (

        <Center
          py={16}
          px={6}
          borderRadius="lg"
          bg="gray.50"
          border="1px dashed"
          borderColor="gray.200"
        >

          <VStack gap={2}>

            <Text
              color="gray.600"
              fontWeight="medium"
            >
              No members found in this house.
            </Text>

            <Text
              color="gray.500"
              fontSize="sm"
            >
              Add a member first before promoting
              someone to family head.
            </Text>

          </VStack>

        </Center>

      ) : (

        /* ======================================================
           MEMBERS TABLE
        ====================================================== */

        <Box
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          boxShadow="sm"
          bg="white"
        >

          <Table.Root
            variant="outline"
            size="md"
          >

            <Table.Header>

              <Table.Row bg="gray.50">

                <Table.ColumnHeader>
                  Member
                </Table.ColumnHeader>

                <Table.ColumnHeader>
                  Relationship
                </Table.ColumnHeader>

                <Table.ColumnHeader>
                  Gender
                </Table.ColumnHeader>

                <Table.ColumnHeader textAlign="right">
                  Action
                </Table.ColumnHeader>

              </Table.Row>

            </Table.Header>


            <Table.Body>

              {members.map((member) => (

                <Table.Row
                  key={member.id}
                  _hover={{
                    bg: "gray.50",
                  }}
                >

                  {/* MEMBER */}

                  <Table.Cell>

                    <HStack gap={3}>

                      <Avatar.Root size="sm">

                        <Avatar.Fallback
                          name={member.name}
                        />

                      </Avatar.Root>


                      <VStack
                        align="start"
                        gap={0}
                      >

                        <Text
                          fontWeight="medium"
                          color="gray.800"
                        >
                          {member.name}
                        </Text>

                        {member.mobile_no && (
                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            {member.mobile_no}
                          </Text>
                        )}

                      </VStack>

                    </HStack>

                  </Table.Cell>


                  {/* RELATIONSHIP */}

                  <Table.Cell>

                    <Text color="gray.600">

                      {typeof member.relationship === "object"
                        ? member.relationship?.name || "—"
                        : member.relationship || "—"}

                    </Text>

                  </Table.Cell>


                  {/* GENDER */}

                  <Table.Cell>

                    <Text color="gray.600">

                      {member.gender
                        ? member.gender.charAt(0) +
                          member.gender
                            .slice(1)
                            .toLowerCase()
                        : "—"}

                    </Text>

                  </Table.Cell>


                  {/* ACTION */}

                  <Table.Cell textAlign="right">

                    <Button
                      size="sm"
                      bg="var(--primary-maroon)"
                      color="white"
                      loading={
                        promotingId === member.id
                      }
                      loadingText="Promoting..."
                      disabled={
                        promotingId !== null &&
                        promotingId !== member.id
                      }
                      _hover={{
                        opacity: 0.9,
                      }}
                      onClick={() =>
                        handlePromote(member)
                      }
                    >

                      <Icon
                        as={LuCrown}
                        mr={2}
                      />

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