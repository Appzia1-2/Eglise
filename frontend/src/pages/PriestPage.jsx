import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { LuUser } from "react-icons/lu";
import RegistryTable from "../components/RegistryTable";
import {
  listPriests,
  createPriest,
  updatePriest,
  deletePriest,
  listPriestsDropdown,
  listDesignations,
} from "../api/registryServices";

const PriestPage = () => {
  const [dropdownData, setDropdownData] = useState([]);
  const [designations, setDesignations] = useState([]);
  const primaryMaroon = "var(--primary-maroon)";

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dRes, desRes] = await Promise.all([
          listPriestsDropdown(),
          listDesignations(),
        ]);
        setDropdownData(dRes.data || []);
        setDesignations(desRes.data || []);
      } catch (err) {
        console.error("Error fetching priest options:", err);
      }
    };
    fetchOptions();
  }, []);

  const priestFields = [
    { name: "name", label: "Name", required: true },
    { name: "family_name", label: "Family Name" },
    { name: "phone_number", label: "Phone Number" },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      options: designations.map((d) => ({ value: d.id, label: d.name })),
      coerce: Number,
    },
    { name: "house_name", label: "House Name", required: true },
    { name: "address", label: "Address", type: "textarea", required: true },
  ];

  const priestColumns = [
    { header: "Family Name", key: "house_name" },
    { header: "Phone", key: "phone_number" },
  ];

  const listPriestsEnriched = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        listPriests(),
        listDesignations(),
      ]);
      const priests = pRes.data || [];
      const designationsLocal = dRes.data || [];

      const mapped = priests.map((p) => {
        const desObj = designationsLocal.find(
          (d) => d.id === (p.designation?.id || p.designation),
        );
        return {
          ...p,
          designation_name: p.designation?.name || desObj?.name || "—",
        };
      });
      return { ...pRes, data: mapped };
    } catch (error) {
      console.error("Error enriching priests:", error);
      return listPriests();
    }
  };

  const QuickView = (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 4px 20px -5px rgba(0,0,0,0.05)"
      mb={6}
      position="relative"
      overflow="hidden"
    >
      <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
        <HStack justify="space-between" gap={"10px"}>
          <VStack align="start" spacing={0}>
            <Heading
              size="sm"
              fontWeight="800"
              style={{
                background:
                  "linear-gradient(135deg, #7b0d1e 30%, #c0392b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Active Priest Panel
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              Quick access to current serving priests
            </Text>
          </VStack>
          <Badge
            bg="rgba(123,13,30,0.08)"
            color={primaryMaroon}
            px={3}
            py={1}
            borderRadius="full"
            variant="subtle"
            fontSize="10px"
            fontWeight="bold"
          >
            {dropdownData.length} PRIESTS
          </Badge>
        </HStack>

        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={4}
          gap={2}
        >
          {dropdownData.length > 0 ? (
            dropdownData.map((priest, index) => {
              const name = typeof priest === "string" ? priest : priest.name;
              const designation =
                typeof priest === "object"
                  ? priest.designation
                  : "Designated Priest";

              return (
                <HStack
                  key={index}
                  p={3}
                  bg="white"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.100"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 15px -5px rgba(123, 13, 30, 0.1)",
                    borderColor: "rgba(123, 13, 30, 0.2)",
                    bg: "rgba(123, 13, 30, 0.01)",
                  }}
                  role="group"
                >
                  <Box
                    p={2}
                    bg="rgba(123, 13, 30, 0.05)"
                    borderRadius="md"
                    transition="all 0.2s"
                    _groupHover={{ bg: primaryMaroon, color: "white" }}
                  >
                    <Icon
                      as={LuUser}
                      fontSize="14px"
                      color={primaryMaroon}
                      _groupHover={{ color: "white" }}
                    />
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text
                      fontSize="13px"
                      fontWeight="700"
                      color="gray.700"
                      noOfLines={1}
                    >
                      {name || "Unknown Priest"}
                    </Text>
                    <Text
                      fontSize="9px"
                      fontWeight="600"
                      color="gray.400"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                    >
                      {designation || "Designated Priest"}
                    </Text>
                  </VStack>
                </HStack>
              );
            })
          ) : (
            <Text
              fontSize="xs"
              color="gray.400"
              gridColumn="span 4"
              textAlign="center"
              py={4}
            >
              Fetching priest records...
            </Text>
          )}
        </SimpleGrid>
      </VStack>
    </Box>
  );

  return (
    <RegistryTable
      title="Priest Master"
      addLabel="Add Priest"
      nameKey="name"
      columns={priestColumns}
      emptyMessage="No priests found."
      listFn={listPriestsEnriched}
      createFn={createPriest}
      updateFn={updatePriest}
      deleteFn={deletePriest}
      fields={priestFields}
      topContent={QuickView}
      isMaster={true}
    />
  );
};

export default PriestPage;
