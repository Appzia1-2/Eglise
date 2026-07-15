import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import RegistryTable from "../components/RegistryTable";
import GenericFormModal from "../components/GenericFormModal";
import {
  listMarriages,
  createMarriage,
  updateMarriage,
  deleteMarriage,
  listFamilies,
  listMembers,
  listRelationships,
  listPreAnnouncements,
  getDheshaKuri,
} from "../api/registryServices";
import { LuFileText, LuX } from "react-icons/lu";
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
  DialogPositioner,
  VStack,
  Text,
  SimpleGrid,
  Box,
  Heading,
  Spinner,
  Flex,
  Icon,
} from "@chakra-ui/react";

const MARRIAGE_COLUMNS = [
  { header: "Reg No", key: "register_number" },
  { header: "Type", key: "marriage_type" },
  { header: "Groom", key: "groom_display_name" },
  { header: "Bride", key: "bride_display_name" },
  { header: "Family", key: "family_name" },
  { header: "Date", key: "date" },
];

const MarriageFormModal = ({
  isOpen,
  onClose,
  onSave,
  itemData,
  isLoading,
}) => {
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [preAnnouncements, setPreAnnouncements] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [fRes, mRes, rRes, pRes] = await Promise.all([
          listFamilies(),
          listMembers(),
          listRelationships(),
          listPreAnnouncements(),
        ]);
        setFamilies(fRes.data || []);
        setMembers(mRes.data || []);
        setRelationships(rRes.data || []);
        setPreAnnouncements(pRes.data || []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching options for Marriage form:", error);
      }
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const familiesOptions = families.map((f) => ({
    value: f.id,
    label: `${f.family_name} (${f.reg_no || f.id})`,
  }));
  const membersOptions = members
    .filter((m) => m.is_active !== false && m.expire !== true)
    .map((m) => ({
      value: m.id,
      label: `${m.name} (${m.family?.family_name || "N/A"})`,
    }));
  const relOptions = relationships.map((r) => ({
    value: r.id,
    label: r.name,
  }));
  const preAnnOptions = preAnnouncements.map((p) => ({
    value: p.id,
    label: `${p.groom_name} & ${p.bride_name} (${p.marriage_date})`,
  }));

  // Define dynamic fields
  const getFields = (formData) => {
    const type = formData.marriage_type;
    const isBase = [
      {
        name: "marriage_type",
        label: "Marriage Type",
        type: "select",
        required: true,
        options: [
          { value: "ADD_BRIDE", label: "Add Bride" },
          { value: "TRANSFER_BRIDE", label: "Transfer Bride" },
        ],
      },
      {
        name: "family",
        label: "Primary Family",
        type: "select",
        required: true,
        options: familiesOptions,
        coerce: Number,
      },
      { name: "date", label: "Marriage Date", type: "date", required: true },
    ];

    let dynamic = [];

    if (type === "ADD_BRIDE") {
      dynamic = [
        {
          name: "groom_member",
          label: "Groom (Member)",
          type: "select",
          required: true,
          options: membersOptions,
          coerce: Number,
        },
        {
          name: "relation_of_bride_with_main_member",
          label: "Bride's Relation with Head",
          type: "select",
          options: relOptions,
          coerce: Number,
        },
        {
          name: "vilich_chollu_kuri",
          label: "Pre-Announcement",
          type: "select",
          options: preAnnOptions,
          coerce: Number,
        },
        { name: "nationality_of_groom", label: "Groom Nationality" },
        { name: "nationality_of_bride", label: "Bride Nationality" },
      ];
    } else if (type === "TRANSFER_BRIDE") {
      dynamic = [
        {
          name: "bride_member",
          label: "Bride (Member)",
          type: "select",
          required: true,
          options: membersOptions,
          coerce: Number,
        },
        {
          name: "groom_is_internal",
          label: "Groom is Internal?",
          type: "select",
          options: [
            { value: "true", label: "Yes (Select Member)" },
            { value: "false", label: "No (External Groom)" },
          ],
        },
      ];

      if (formData.groom_is_internal === "true") {
        dynamic.push({
          name: "groom_member",
          label: "Groom (Member)",
          type: "select",
          options: membersOptions,
          coerce: Number,
        });
      } else {
        dynamic.push(
          { name: "groom_name", label: "Groom Name" },
          { name: "groom_dob", label: "Groom DOB", type: "date" },
          { name: "groom_house_name", label: "Groom House Name" },
          { name: "groom_family_name", label: "Groom Family Name" },
          { name: "groom_place", label: "Groom Place" },
        );
      }

      dynamic.push(
        { name: "groom_father", label: "Groom Father" },
        { name: "groom_mother", label: "Groom Mother" },
        { name: "bride_father", label: "Bride Father" },
        { name: "bride_mother", label: "Bride Mother" },
        { name: "transfer_to", label: "Transfer To (Church/Place)" },
        {
          name: "groom_confession_date",
          label: "Groom Confession Date",
          type: "date",
        },
        {
          name: "bride_confession_date",
          label: "Bride Confession Date",
          type: "date",
        },
        { name: "nationality_of_groom", label: "Groom Nationality" },
        { name: "nationality_of_bride", label: "Bride Nationality" },
      );
    }

    const common = [
      { name: "witness_groom_side", label: "Groom Side Witness" },
      { name: "witness_bride_side", label: "Bride Side Witness" },
      { name: "minister_of_marriage", label: "Minister" },
      { name: "other_priests", label: "Other Priests" },
      { name: "remarks", label: "Remarks", type: "textarea", fullWidth: true },
    ];

    return [...isBase, ...dynamic, ...common];
  };

  if (!isDataLoaded && isOpen) return null;

  return (
    <GenericFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      itemData={itemData}
      isLoading={isLoading}
      title="Marriage Register"
      fields={getFields} // GenericFormModal needs to support function for fields or we handle it here
      customFieldsLogic={getFields}
    />
  );
};

// Simplified dynamic field support for GenericFormModal by passing fields directly if it doesn't support fns
// Wait, GenericFormModal is a component I can't easily change to support a function for fields without editing it.
// Let's just manage the field array in state here.

const MarriagePage = () => {
  const location = useLocation();
  const preAnnouncement = location.state?.preAnnouncement;

  // Dhesha Kuri State
  const [isDheshaKuriOpen, setIsDheshaKuriOpen] = useState(false);
  const [dheshaKuriData, setDheshaKuriData] = useState(null);
  const [isDheshaKuriLoading, setIsDheshaKuriLoading] = useState(false);

  const handleViewDheshaKuri = async (marriageId) => {
    setIsDheshaKuriLoading(true);
    setIsDheshaKuriOpen(true);
    setDheshaKuriData(null);
    try {
      const res = await getDheshaKuri(marriageId);
      setDheshaKuriData(res.data);
    } catch (error) {
      console.error("Error fetching Dhesha Kuri:", error);
    } finally {
      setIsDheshaKuriLoading(false);
    }
  };

  const extraActions = [
    {
      icon: LuFileText,
      title: "Dhesha Kuri",
      color: "teal.500",
      hoverColor: "teal.700",
      showIf: (item) => item.marriage_type === "TRANSFER_BRIDE",
      onClick: (item) => handleViewDheshaKuri(item.id),
    },
  ];

  const listMarriagesWithNames = async () => {
    try {
      const [mRes, fRes] = await Promise.all([listMarriages(), listFamilies()]);
      const marriages = mRes.data || [];
      const families = fRes.data || [];

      if (marriages) {
        const mappedData = marriages.map((m) => {
          const famObj = families.find(
            (f) => f.id === (m.family?.id || m.family),
          );
          return {
            ...m,
            groom_display_name: m.groom_member?.name || m.groom_name || "N/A",
            bride_display_name: m.bride_member?.name || m.bride_name || "N/A",
            family_name: m.family?.family_name || famObj?.family_name || "N/A",
          };
        });
        return { ...mRes, data: mappedData };
      }
      return mRes;
    } catch (error) {
      console.error("Error fetching and enriching marriages:", error);
      return listMarriages();
    }
  };

  // Improved MarriageFormModal that handles state itself
  const CustomMarriageForm = (props) => {
    const [families, setFamilies] = useState([]);
    const [members, setMembers] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [preAnnouncements, setPreAnnouncements] = useState([]);
    const [localItemData, setLocalItemData] = useState(props.itemData);

    useEffect(() => {
      if (!props.itemData && preAnnouncement) {
        // Pre-fill from pre-announcement
        setLocalItemData({
          marriage_type: "ADD_BRIDE",
          vilich_chollu_kuri: preAnnouncement.id,
          date: preAnnouncement.marriage_date,
          groom_name: preAnnouncement.groom_name,
          bride_name: preAnnouncement.bride_name,
          // Add more mappings if needed
        });
      }
    }, [preAnnouncement, props.itemData]);

    useEffect(() => {
      const fetchOptions = async () => {
        try {
          const [fRes, mRes, rRes, pRes] = await Promise.all([
            listFamilies(),
            listMembers(),
            listRelationships(),
            listPreAnnouncements(),
          ]);
          setFamilies(fRes.data || []);
          setMembers(mRes.data || []);
          setRelationships(rRes.data || []);
          setPreAnnouncements(pRes.data || []);
        } catch (error) {
          console.error("Error fetching options:", error);
        }
      };
      if (props.isOpen) fetchOptions();
    }, [props.isOpen]);

    const getDynamicFields = (currentFormData) => {
      const familiesOptions = families.map((f) => ({
        value: f.id,
        label: `${f.family_name} (${f.reg_no || f.id})`,
      }));
      const membersOptions = members
        .filter((m) => m.is_active !== false && m.expire !== true)
        .map((m) => ({
          value: m.id,
          label: `${m.name} (${m.family?.family_name || "N/A"})`,
        }));
      const relOptions = relationships.map((r) => ({
        value: r.id,
        label: r.name,
      }));
      const preAnnOptions = preAnnouncements.map((p) => ({
        value: p.id,
        label: `${p.groom_name} & ${p.bride_name} (${p.marriage_date})`,
      }));

      const type = currentFormData?.marriage_type || "ADD_BRIDE";

      let fields = [
        {
          name: "marriage_type",
          label: "Marriage Type",
          type: "select",
          required: true,
          options: [
            { value: "ADD_BRIDE", label: "Add Bride" },
            { value: "TRANSFER_BRIDE", label: "Transfer Bride" },
          ],
        },
        {
          name: "family",
          label: "Family",
          type: "select",
          required: true,
          options: familiesOptions,
          coerce: Number,
        },
        { name: "date", label: "Marriage Date", type: "date", required: true },
      ];

      if (type === "ADD_BRIDE") {
        fields.push(
          {
            name: "groom_member",
            label: "Groom (Member)",
            type: "select",
            options: membersOptions,
            coerce: Number,
            required: true,
          },
          {
            name: "relation_of_bride_with_main_member",
            label: "Bride's Relation",
            type: "select",
            options: relOptions,
            coerce: Number,
          },
          {
            name: "vilich_chollu_kuri",
            label: "Pre-Announcement",
            type: "select",
            options: preAnnOptions,
            coerce: Number,
          },
          { name: "nationality_of_groom", label: "Groom Nationality" },
          { name: "nationality_of_bride", label: "Bride Nationality" },
        );
      } else {
        fields.push(
          {
            name: "bride_member",
            label: "Bride (Member)",
            type: "select",
            options: membersOptions,
            coerce: Number,
            required: true,
          },
          {
            name: "groom_is_internal",
            label: "Groom Type",
            type: "select",
            options: [
              { value: "true", label: "Church Member" },
              { value: "false", label: "External / Non-Member" },
            ],
          },
        );

        if (currentFormData.groom_is_internal === "true") {
          fields.push({
            name: "groom_member",
            label: "Groom (Member)",
            type: "select",
            options: membersOptions,
            coerce: Number,
          });
        } else {
          fields.push(
            { name: "groom_name", label: "Groom Name" },
            { name: "groom_dob", label: "Groom DOB", type: "date" },
            { name: "groom_house_name", label: "Groom House Name" },
            { name: "groom_family_name", label: "Groom Family Name" },
            { name: "groom_place", label: "Groom Place" },
          );
        }

        fields.push(
          { name: "groom_father", label: "Groom Father" },
          { name: "groom_mother", label: "Groom Mother" },
          { name: "bride_father", label: "Bride Father" },
          { name: "bride_mother", label: "Bride Mother" },
          { name: "transfer_to", label: "Transfer To" },
          {
            name: "groom_confession_date",
            label: "Groom Confession Date",
            type: "date",
          },
          {
            name: "bride_confession_date",
            label: "Bride Confession Date",
            type: "date",
          },
          { name: "nationality_of_groom", label: "Groom Nationality" },
          { name: "nationality_of_bride", label: "Bride Nationality" },
        );
      }

      fields.push(
        { name: "witness_groom_side", label: "Groom Witness" },
        { name: "witness_bride_side", label: "Bride Witness" },
        { name: "minister_of_marriage", label: "Minister" },
        { name: "other_priests", label: "Other Priests" },
        {
          name: "remarks",
          label: "Remarks",
          type: "textarea",
          fullWidth: true,
        },
      );

      return fields;
    };

    // We need to pass a wrapping component that updates GenericFormModal on state changes
    // But RegistryTable just instantiates it.
    // Let's modify GenericFormModal slightly if needed, or better,
    // handle the fields internally in a way that respects the current form data.

    // Actually, GenericFormModal is already built. To make it truly dynamic,
    // I need it to call a function or I need to manage its 'fields' prop based on its internal state.
    // Since GenericFormModal doesn't expose its state to the fields prop easily,
    // I'll create a slightly more tailored modal here.

    return (
      <GenericFormModal
        {...props}
        itemData={localItemData}
        title="Marriage Register"
        fields={getDynamicFields(props.itemData || localItemData || {})}
      />
    );
  };

  return (
    <>
      <RegistryTable
        title="Marriage Register"
        addLabel="Add Record"
        nameKey="date"
        columns={MARRIAGE_COLUMNS}
        columnLabel="Marriage Date"
        emptyMessage="No marriage records found."
        listFn={listMarriagesWithNames}
        createFn={createMarriage}
        updateFn={updateMarriage}
        deleteFn={deleteMarriage}
        FormModal={CustomMarriageForm}
        extraActions={extraActions}
      />

      <DialogRoot
        open={isDheshaKuriOpen}
        onOpenChange={(e) => !e.open && setIsDheshaKuriOpen(false)}
        size="xl"
        placement="center"
      >
        <DialogBackdrop bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <DialogPositioner alignItems="center">
          <DialogContent borderRadius="xl" overflow="hidden" boxShadow="2xl">
            <DialogHeader
              bg="var(--primary-maroon)"
              color="white"
              py={4}
              fontSize="xl"
              fontWeight="bold"
              position="relative"
            >
              Dhesha Kuri Details
              <DialogCloseTrigger
                position="absolute"
                right={4}
                top="50%"
                transform="translateY(-50%)"
                color="white"
                bg="whiteAlpha.200"
                borderRadius="full"
                _hover={{ bg: "whiteAlpha.400" }}
                p={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={LuX} fontSize="20px" />
              </DialogCloseTrigger>
            </DialogHeader>

            <DialogBody p={6} bg="gray.50">
              {isDheshaKuriLoading ? (
                <Flex justify="center" align="center" py={10}>
                  <Spinner
                    color="var(--primary-maroon)"
                    size="xl"
                    thickness="4px"
                  />
                </Flex>
              ) : dheshaKuriData ? (
                <VStack align="stretch" spacing={6}>
                  <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                    <Heading size="sm" color="var(--primary-maroon)" mb={3}>
                      General Information
                    </Heading>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                          CHURCH NAME
                        </Text>
                        <Text fontWeight="medium">
                          {dheshaKuriData.church_name}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="bold">
                          TRANSFER TO
                        </Text>
                        <Text fontWeight="medium">
                          {dheshaKuriData.transfer_to}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    spacing={6}
                    gap={"10px"}
                  >
                    <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                      <Heading size="sm" color="var(--primary-maroon)" mb={3}>
                        Groom Details
                      </Heading>
                      <VStack align="stretch" spacing={2} fontSize="sm">
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Name
                          </Text>
                          <Text fontWeight="bold">
                            {dheshaKuriData.groom_name}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Age / DOB
                          </Text>
                          <Text>
                            {dheshaKuriData.groom_age} years (
                            {dheshaKuriData.groom_dob})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Family / House
                          </Text>
                          <Text>
                            {dheshaKuriData.groom_family_name} (
                            {dheshaKuriData.groom_house_name})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Parents
                          </Text>
                          <Text>
                            F: {dheshaKuriData.groom_father} | M:{" "}
                            {dheshaKuriData.groom_mother}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Confession Date
                          </Text>
                          <Text>{dheshaKuriData.groom_confession_date}</Text>
                        </Box>
                      </VStack>
                    </Box>

                    <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                      <Heading size="sm" color="var(--primary-maroon)" mb={3}>
                        Bride Details
                      </Heading>
                      <VStack align="stretch" spacing={2} fontSize="sm">
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Name
                          </Text>
                          <Text fontWeight="bold">
                            {dheshaKuriData.bride_name}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Age / DOB
                          </Text>
                          <Text>
                            {dheshaKuriData.bride_age} years (
                            {dheshaKuriData.bride_dob})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Family / House
                          </Text>
                          <Text>
                            {dheshaKuriData.bride_family_name} (
                            {dheshaKuriData.bride_house_name})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Parents
                          </Text>
                          <Text>
                            F: {dheshaKuriData.bride_father} | M:{" "}
                            {dheshaKuriData.bride_mother}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Confession Date
                          </Text>
                          <Text>{dheshaKuriData.bride_confession_date}</Text>
                        </Box>
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </VStack>
              ) : (
                <Text textAlign="center" py={10}>
                  No data available.
                </Text>
              )}
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  );
};

export default MarriagePage;
