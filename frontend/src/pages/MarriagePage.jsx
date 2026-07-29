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

// ============================================================
// MARRIAGE FORM MODAL
// ============================================================
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [formData, setFormData] = useState(itemData || {});

  // Fetch options when modal opens
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [fRes, mRes, rRes] = await Promise.all([
          listFamilies(),
          listMembers(),
          listRelationships(),
        ]);
        setFamilies(fRes.data || []);
        setMembers(mRes.data || []);
        setRelationships(rRes.data || []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching options for Marriage form:", error);
      }
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  // Reset form data when itemData changes
  useEffect(() => {
    if (itemData) {
      setFormData(itemData);
    } else {
      setFormData({
        marriage_type: "ADD_BRIDE",
        date: "",
        groom_family: null,
        groom_member: null,
        bride_family: null,
        bride_member: null,
        bride_is_internal: true,
        groom_is_internal: true,
      });
    }
  }, [itemData]);

  // ============================================================
  // GET AVAILABLE GROOMS - SUPPORTS SINGLE, WIDOWED, DIVORCED
  // ============================================================
  const getAvailableGrooms = (familyId) => {
    if (!familyId) {
      return [];
    }

    const familyIdInt = typeof familyId === "string" ? parseInt(familyId) : familyId;

    const filtered = members
      .filter((m) => {
        const memberFamilyId = m.family?.id || m.family;
        const matchesFamily = memberFamilyId === familyIdInt;
        const isEligible =
          m.is_active !== false &&
          m.expired !== true &&
          m.gender !== "FEMALE" &&
          m.marital_status !== "MARRIED" &&
          m.marital_status !== "Married" &&
          m.marital_status !== "" &&
          !m.spouse &&
          !m.is_family_head; // 🔥 heads must not appear as selectable grooms
        return isEligible && matchesFamily;
      })
      .map((m) => ({
        value: m.id,
        label: `${m.name} (${m.family?.family_name || "N/A"})`,
      }));

    return filtered;
  };

  // ============================================================
  // GET AVAILABLE BRIDES - SUPPORTS SINGLE, WIDOWED, DIVORCED
  // ============================================================
  const getAvailableBrides = (familyId) => {
    if (!familyId) {
      return [];
    }

    const familyIdInt = typeof familyId === "string" ? parseInt(familyId) : familyId;

    const filtered = members
      .filter((m) => {
        const memberFamilyId = m.family?.id || m.family;
        const matchesFamily = memberFamilyId === familyIdInt;
        const isEligible =
          m.is_active !== false &&
          m.expired !== true &&
          m.gender === "FEMALE" &&
          m.marital_status !== "MARRIED" &&
          m.marital_status !== "Married" &&
          m.marital_status !== "" &&
          !m.spouse;
        return isEligible && matchesFamily;
      })
      .map((m) => ({
        value: m.id,
        label: `${m.name} (${m.family?.family_name || "N/A"})`,
      }));

    return filtered;
  };

  const familiesOptions = families.map((f) => ({
    value: f.id,
    label: `${f.family_name} (${f.reg_no || f.id})`,
  }));

  const relOptions = relationships.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  // Get current values
  const type = formData?.marriage_type || "ADD_BRIDE";
  const selectedGroomFamily = formData?.groom_family;
  const selectedBrideFamily = formData?.bride_family;
  const groomIsInternal = formData?.groom_is_internal === true || formData?.groom_is_internal === "true";
  const brideIsInternal = formData?.bride_is_internal === true || formData?.bride_is_internal === "true";

  // Generate options
  const groomOptions = getAvailableGrooms(selectedGroomFamily);
  const brideOptions = getAvailableBrides(selectedBrideFamily);

  // ============================================================
  // GET DYNAMIC FIELDS
  // ============================================================
  const getFields = () => {
    let fields = [];

    // ============================================================
    // SECTION 1: BASIC INFORMATION
    // ============================================================
    fields.push(
      {
        name: "marriage_type",
        label: "1. Marriage Type",
        type: "select",
        required: true,
        options: [
          { value: "ADD_BRIDE", label: "Add Bride to Parish" },
          { value: "TRANSFER_BRIDE", label: "Transfer Bride from Parish" },
        ],
        placeholder: "Select marriage type",
        onChange: (value) => {
          setFormData((prev) => ({
            ...prev,
            marriage_type: value,
            bride_is_internal: true,
            groom_is_internal: true,
            groom_family: null,
            bride_family: null,
            groom_member: null,
            bride_member: null,
          }));
        }
      },
      {
        name: "date",
        label: "2. Marriage Date",
        type: "date",
        required: true,
      },
    );

    // ============================================================
    // SECTION 2: ADD BRIDE FIELDS
    // ============================================================
    if (type === "ADD_BRIDE") {
      fields.push(
        {
          name: "groom_family",
          label: "3. Groom's Family",
          type: "select",
          required: true,
          options: familiesOptions,
          coerce: Number,
          placeholder: "Select groom's family",
          onChange: (value) => {
            setFormData((prev) => ({
              ...prev,
              groom_family: value,
              groom_member: null,
            }));
          }
        },
        {
          name: "groom_member",
          label: "4. Select Groom",
          type: "select",
          required: true,
          options: groomOptions,
          coerce: Number,
          placeholder: selectedGroomFamily ? "Select groom (SINGLE, WIDOWED, DIVORCED)" : "Select a family first",
          disabled: !selectedGroomFamily,
          helpText: !selectedGroomFamily ? "Please select a family first" : `Showing ${groomOptions.length} eligible grooms`,
          onChange: (value) => {
            setFormData((prev) => ({ ...prev, groom_member: value }));
          }
        },
        {
          name: "bride_is_internal",
          label: "5. Bride Type",
          type: "select",
          required: true,
          options: [
            { value: true, label: "Internal Bride (Church Member)" },
            { value: false, label: "External Bride (Non-Member)" },
          ],
          onChange: (value) => {
            const boolValue = value === true || value === "true";
            setFormData((prev) => ({
              ...prev,
              bride_is_internal: boolValue,
              bride_member: null,
              bride_family: null,
              bride_name: "",
              bride_dob: "",
              bride_father: "",
              bride_mother: "",
              bride_address: "",
            }));
          }
        },
      );

      // Internal Bride fields
      if (brideIsInternal) {
        fields.push(
          {
            name: "bride_family",
            label: "6. Bride's Family",
            type: "select",
            required: true,
            options: familiesOptions,
            coerce: Number,
            placeholder: "Select bride's family",
            onChange: (value) => {
              setFormData((prev) => ({
                ...prev,
                bride_family: value,
                bride_member: null,
              }));
            }
          },
          {
            name: "bride_member",
            label: "7. Select Bride",
            type: "select",
            required: true,
            options: brideOptions,
            coerce: Number,
            placeholder: selectedBrideFamily ? "Select bride (SINGLE, WIDOWED, DIVORCED)" : "Select a family first",
            disabled: !selectedBrideFamily,
            helpText: !selectedBrideFamily ? "Please select a family first" : `Showing ${brideOptions.length} eligible brides`,
            onChange: (value) => {
              setFormData((prev) => ({ ...prev, bride_member: value }));
            }
          }
        );
        var nextNum = 8;
      } else {
        // External Bride fields
        fields.push(
          {
            name: "bride_name",
            label: "6. Bride Full Name",
            type: "text",
            required: true,
            placeholder: "Enter bride's full name",
          },
          {
            name: "bride_dob",
            label: "7. Bride Date of Birth",
            type: "date",
            placeholder: "Select date of birth",
          },
          {
            name: "bride_father",
            label: "8. Bride Father's Name",
            type: "text",
            placeholder: "Enter father's name",
          },
          {
            name: "bride_mother",
            label: "9. Bride Mother's Name",
            type: "text",
            placeholder: "Enter mother's name",
          },
          {
            name: "bride_address",
            label: "10. Bride Address",
            type: "textarea",
            fullWidth: true,
            rows: 2,
            placeholder: "Enter bride's address",
          },
          {
            name: "relation_of_bride_with_main_member",
            label: "11. Bride's Relation with Head",
            type: "select",
            options: relOptions,
            coerce: Number,
            placeholder: "Select relation",
          }
        );
        var nextNum = 12;
      }

      // Common ADD_BRIDE fields
      fields.push(
        {
          name: "family",
          label: `${nextNum}. Primary Family (Groom's Family)`,
          type: "select",
          required: true,
          options: familiesOptions,
          coerce: Number,
          placeholder: "Select family",
        },
        {
          name: "nationality_of_groom",
          label: `${nextNum + 1}. Groom Nationality`,
          type: "text",
          required: true,
          placeholder: "Enter groom's nationality",
        },
        {
          name: "nationality_of_bride",
          label: `${nextNum + 2}. Bride Nationality`,
          type: "text",
          required: true,
          placeholder: "Enter bride's nationality",
        }
      );
      var witnessStart = nextNum + 3;
    }

    // ============================================================
    // SECTION 3: TRANSFER BRIDE FIELDS
    // ============================================================
    else if (type === "TRANSFER_BRIDE") {
      fields.push(
        {
          name: "bride_family",
          label: "3. Bride's Family",
          type: "select",
          required: true,
          options: familiesOptions,
          coerce: Number,
          placeholder: "Select bride's family",
          onChange: (value) => {
            setFormData((prev) => ({
              ...prev,
              bride_family: value,
              bride_member: null,
            }));
          }
        },
        {
          name: "bride_member",
          label: "4. Select Bride",
          type: "select",
          required: true,
          options: brideOptions,
          coerce: Number,
          placeholder: selectedBrideFamily ? "Select bride (SINGLE, WIDOWED, DIVORCED)" : "Select a family first",
          disabled: !selectedBrideFamily,
          helpText: !selectedBrideFamily ? "Please select a family first" : `Showing ${brideOptions.length} eligible brides`,
          onChange: (value) => {
            setFormData((prev) => ({ ...prev, bride_member: value }));
          }
        },
        {
          name: "groom_is_internal",
          label: "5. Groom Type",
          type: "select",
          required: true,
          options: [
            { value: true, label: "Internal Groom (Church Member)" },
            { value: false, label: "External Groom (Non-Member)" },
          ],
          onChange: (value) => {
            const boolValue = value === true || value === "true";
            setFormData((prev) => ({
              ...prev,
              groom_is_internal: boolValue,
              groom_family: null,
              groom_member: null,
              groom_name: "",
              groom_dob: "",
              groom_house_name: "",
              groom_family_name: "",
              groom_address: "",
              groom_father: "",
              groom_mother: "",
            }));
          }
        },
      );

      // Internal Groom fields
      if (groomIsInternal) {
        fields.push(
          {
            name: "groom_family",
            label: "6. Groom's Family",
            type: "select",
            required: true,
            options: familiesOptions,
            coerce: Number,
            placeholder: "Select groom's family",
            onChange: (value) => {
              setFormData((prev) => ({
                ...prev,
                groom_family: value,
                groom_member: null,
              }));
            }
          },
          {
            name: "groom_member",
            label: "7. Select Groom",
            type: "select",
            required: true,
            options: groomOptions,
            coerce: Number,
            placeholder: selectedGroomFamily ? "Select groom (SINGLE, WIDOWED, DIVORCED)" : "Select a family first",
            disabled: !selectedGroomFamily,
            helpText: !selectedGroomFamily ? "Please select a family first" : `Showing ${groomOptions.length} eligible grooms`,
            onChange: (value) => {
              setFormData((prev) => ({ ...prev, groom_member: value }));
            }
          }
        );
        var nextNum = 8;
      } else {
        // External Groom fields
        fields.push(
          {
            name: "groom_name",
            label: "6. Groom Full Name",
            type: "text",
            required: true,
            placeholder: "Enter groom's full name",
          },
          {
            name: "groom_dob",
            label: "7. Groom Date of Birth",
            type: "date",
            placeholder: "Select date of birth",
          },
          {
            name: "groom_house_name",
            label: "8. Groom House Name",
            type: "text",
            placeholder: "Enter house name",
          },
          {
            name: "groom_family_name",
            label: "9. Groom Family Name",
            type: "text",
            placeholder: "Enter family name",
          },
          {
            name: "groom_address",
            label: "10. Groom Address",
            type: "textarea",
            fullWidth: true,
            rows: 2,
            placeholder: "Enter groom's address",
          },
          {
            name: "groom_father",
            label: "11. Groom Father's Name",
            type: "text",
            placeholder: "Enter father's name",
          },
          {
            name: "groom_mother",
            label: "12. Groom Mother's Name",
            type: "text",
            placeholder: "Enter mother's name",
          }
        );
        var nextNum = 13;
      }

      // Common TRANSFER_BRIDE fields
      fields.push(
        {
          name: "family",
          label: `${nextNum}. Primary Family (Bride's Family)`,
          type: "select",
          required: true,
          options: familiesOptions,
          coerce: Number,
          placeholder: "Select family",
        },
        {
          name: "transfer_to",
          label: `${nextNum + 1}. Transfer To (Church/Place)`,
          type: "text",
          required: true,
          placeholder: "Enter transfer destination",
        },
        {
          name: "groom_confession_date",
          label: `${nextNum + 2}. Groom Confession Date`,
          type: "date",
          required: true,
          placeholder: "Select confession date",
        },
        {
          name: "bride_confession_date",
          label: `${nextNum + 3}. Bride Confession Date`,
          type: "date",
          required: true,
          placeholder: "Select confession date",
        },
        {
          name: "nationality_of_groom",
          label: `${nextNum + 4}. Groom Nationality`,
          type: "text",
          required: true,
          placeholder: "Enter groom's nationality",
        },
        {
          name: "nationality_of_bride",
          label: `${nextNum + 5}. Bride Nationality`,
          type: "text",
          required: true,
          placeholder: "Enter bride's nationality",
        },
        {
          name: "bride_father",
          label: `${nextNum + 6}. Bride Father's Name`,
          type: "text",
          placeholder: "Enter father's name",
        },
        {
          name: "bride_mother",
          label: `${nextNum + 7}. Bride Mother's Name`,
          type: "text",
          placeholder: "Enter mother's name",
        }
      );
      var witnessStart = nextNum + 8;
    }

    // ============================================================
    // SECTION 4: WITNESSES & MINISTERS (Common for all)
    // ============================================================
    if (type) {
      fields.push(
        {
          name: "witness_groom_side",
          label: `${witnessStart}. Groom Side Witness`,
          type: "text",
          required: true,
          placeholder: "Enter witness name",
        },
        {
          name: "witness_bride_side",
          label: `${witnessStart + 1}. Bride Side Witness`,
          type: "text",
          required: true,
          placeholder: "Enter witness name",
        },
        {
          name: "minister_of_marriage",
          label: `${witnessStart + 2}. Minister of Marriage`,
          type: "text",
          required: true,
          placeholder: "Enter minister's name",
        },
        {
          name: "other_priests",
          label: `${witnessStart + 3}. Other Priests (Optional)`,
          type: "text",
          placeholder: "Enter other priests' names",
        },
        {
          name: "remarks",
          label: `${witnessStart + 4}. Remarks (Optional)`,
          type: "textarea",
          fullWidth: true,
          rows: 3,
          placeholder: "Additional remarks (optional)",
        }
      );
    }

    return fields;
  };

  // ============================================================
  // HANDLE SAVE
  // ============================================================
  const handleSave = async (data) => {
    try {
      const submitData = { ...data };

      if (submitData.groom_is_internal === "true") submitData.groom_is_internal = true;
      if (submitData.groom_is_internal === "false") submitData.groom_is_internal = false;
      if (submitData.bride_is_internal === "true") submitData.bride_is_internal = true;
      if (submitData.bride_is_internal === "false") submitData.bride_is_internal = false;

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      if (error.response?.data) {
        alert(JSON.stringify(error.response.data, null, 2));
      }
    }
  };

  if (!isDataLoaded && isOpen) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner color="var(--primary-maroon)" size="xl" />
      </Flex>
    );
  }

  return (
    <GenericFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      itemData={formData}
      isLoading={isLoading}
      title="Marriage Registration"
      fields={getFields()}
      customFieldsLogic={getFields}
      onChange={(field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }}
    />
  );
};

// ============================================================
// MARRIAGE PAGE
// ============================================================
const MarriagePage = () => {
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
            (f) => f.id === (m.family?.id || m.family)
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
        FormModal={MarriageFormModal}
        extraActions={extraActions}
      />

      {/* Dhesha Kuri Dialog */}
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

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Groom Details */}
                    <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                      <Heading size="sm" color="var(--primary-maroon)" mb={3}>
                        Groom Details
                      </Heading>
                      <VStack align="stretch" spacing={2} fontSize="sm">
                        <Box>
                          <Text fontSize="xs" color="gray.500">Name</Text>
                          <Text fontWeight="bold">{dheshaKuriData.groom_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Age / DOB</Text>
                          <Text>
                            {dheshaKuriData.groom_age} years ({dheshaKuriData.groom_dob})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Family / House</Text>
                          <Text>
                            {dheshaKuriData.groom_family_name} ({dheshaKuriData.groom_house_name})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Parents</Text>
                          <Text>
                            F: {dheshaKuriData.groom_father} | M: {dheshaKuriData.groom_mother}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Confession Date</Text>
                          <Text>{dheshaKuriData.groom_confession_date}</Text>
                        </Box>
                      </VStack>
                    </Box>

                    {/* Bride Details */}
                    <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                      <Heading size="sm" color="var(--primary-maroon)" mb={3}>
                        Bride Details
                      </Heading>
                      <VStack align="stretch" spacing={2} fontSize="sm">
                        <Box>
                          <Text fontSize="xs" color="gray.500">Name</Text>
                          <Text fontWeight="bold">{dheshaKuriData.bride_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Age / DOB</Text>
                          <Text>
                            {dheshaKuriData.bride_age} years ({dheshaKuriData.bride_dob})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Family / House</Text>
                          <Text>
                            {dheshaKuriData.bride_family_name} ({dheshaKuriData.bride_house_name})
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Parents</Text>
                          <Text>
                            F: {dheshaKuriData.bride_father} | M: {dheshaKuriData.bride_mother}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Confession Date</Text>
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