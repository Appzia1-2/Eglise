import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Button,
  Text,
  Flex,
  Input,
  Textarea,
  Icon,
  SimpleGrid,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogCloseTrigger,
  DialogPositioner,
} from "@chakra-ui/react";
import { LuSave, LuPlus, LuX } from "react-icons/lu";
import {
  listFamilies,
  listMembers,
  listRelationships,
} from "../api/registryServices";

const BaptismFormModal = ({ isOpen, onClose, onSave, itemData, isLoading }) => {
  const primaryMaroon = "var(--primary-maroon)";

  const [formData, setFormData] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});

  // Options states
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

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
      } catch (error) {
        console.error("Error fetching baptism form options:", error);
      }
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (itemData) {
      // Create a copy and handle nested objects for select fields
      const cleanedData = {
        priest_name: "",
        panchayath: "",
        ...itemData,
      };
      if (cleanedData.family && typeof cleanedData.family === "object") {
        cleanedData.family = cleanedData.family.id;
      }
      if (
        cleanedData.main_member &&
        typeof cleanedData.main_member === "object"
      ) {
        cleanedData.main_member = cleanedData.main_member.id;
      }
      if (
        cleanedData.relation_with_main_member &&
        typeof cleanedData.relation_with_main_member === "object"
      ) {
        cleanedData.relation_with_main_member =
          cleanedData.relation_with_main_member.id;
      }
      setFormData(cleanedData);
    } else {
      setFormData({
        baptism_category: "PARISH",
        gender: "MALE",
        date_of_baptism: "",
        register_number: "",
        place_of_birth: "",
        name: "",
        baptismal_name: "",
        dob: "",
        address: "",
        parish_of_baptism: "",
        god_father: "",
        god_mother: "",
        father_name: "",
        mother_name: "",
        priest_name: "",
        panchayath: "",
        house_name: "",
        remarks: "",
        family: "",
        main_member: "",
        relation_with_main_member: "",
      });
    }
  }, [itemData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const requiredFields = [
      "baptism_category",
      "date_of_baptism",
      "place_of_birth",
      "name",
      "gender",
      "dob",
      "father_name",
      "mother_name",
    ];
    if (formData.baptism_category === "PARISH") {
      requiredFields.push("family", "main_member", "relation_with_main_member");
    }

    const newErrors = {};
    requiredFields.forEach((field) => {
      const val = formData[field];
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      ) {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus the first invalid field
      const firstErrorField = requiredFields.find((f) => newErrors[f]);
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0];
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    // Process and coerce
    const submissionData = { ...formData };

    // Ensure strings are not null/undefined
    const stringFields = [
      "name",
      "baptismal_name",
      "father_name",
      "mother_name",
      "priest_name",
      "panchayath",
      "place_of_birth",
      "address",
      "parish_of_baptism",
      "god_father",
      "god_mother",
      "remarks",
    ];
    stringFields.forEach((field) => {
      if (
        submissionData[field] === null ||
        submissionData[field] === undefined
      ) {
        submissionData[field] = "";
      }
    });

    // Remove immutable fields if editing (Server prohibits modification)
    if (isEditing) {
      delete submissionData.baptism_category;
      delete submissionData.family;
      delete submissionData.main_member;
      delete submissionData.relation_with_main_member;
    } else {
      // Coerce numbers if present (only for creation)
      if (submissionData.family)
        submissionData.family = Number(submissionData.family);
      if (submissionData.main_member)
        submissionData.main_member = Number(submissionData.main_member);
      if (submissionData.relation_with_main_member)
        submissionData.relation_with_main_member = Number(
          submissionData.relation_with_main_member,
        );
    }

    // Clean up if category is OTHER
    if (submissionData.baptism_category === "OTHER") {
      delete submissionData.family;
      delete submissionData.main_member;
      delete submissionData.relation_with_main_member;
    }

    onSave(submissionData);
  };

  const isEditing = Boolean(itemData);
  const isParish = formData.baptism_category === "PARISH";

  const renderField = (
    name,
    label,
    type = "text",
    options = null,
    fullWidth = false,
    required = false,
  ) => {
    const hasValue = String(formData[name] || "").length > 0;
    const isFocused = focusedField === name;
    const shouldFloat =
      isFocused || hasValue || type === "select" || type === "date";

    return (
      <Box
        key={name}
        w="full"
        position="relative"
        gridColumn={fullWidth ? "span 3" : "auto"}
      >
        <Text
          as="label"
          position="absolute"
          left={shouldFloat ? "10px" : "12px"}
          top={shouldFloat ? "0" : "50%"}
          transform={
            shouldFloat ? "translateY(-50%) scale(0.85)" : "translateY(-50%)"
          }
          transformOrigin="left top"
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          color={isFocused ? primaryMaroon : "gray.500"}
          bg="white"
          px={1}
          zIndex={2}
          fontSize="sm"
          fontWeight={shouldFloat ? "700" : "500"}
          pointerEvents="none"
          letterSpacing="0.3px"
        >
          {label}
          {required && (
            <Text as="span" color="red.500" ml={1}>
              *
            </Text>
          )}
        </Text>

        {type === "select" ? (
          <Box
            as="select"
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField(null)}
            required={required}
            style={{
              width: "100%",
              height: "38px",
              borderRadius: "8px",
              borderWidth: "1px",
              borderColor: errors[name]
                ? "var(--chakra-colors-red-500)"
                : "var(--chakra-colors-gray-200)",
              fontSize: "var(--chakra-fontSizes-sm)",
              paddingLeft: "12px",
              paddingRight: "30px",
              display: "flex",
              alignItems: "center",
              background: "white",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              boxShadow: errors[name]
                ? "0 0 0 1px var(--chakra-colors-red-500)"
                : "none",
            }}
          >
            <option value="">Select {label}</option>
            {options?.map((opt, i) => (
              <option key={i} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Box>
        ) : type === "textarea" ? (
          <Textarea
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField(null)}
            rows={3}
            borderRadius="8px"
            borderColor="gray.200"
            fontSize="sm"
            pt={3}
            _focus={{
              borderColor: primaryMaroon,
              boxShadow: "none",
              borderWidth: "1px",
            }}
          />
        ) : (
          <Input
            name={name}
            type={type}
            value={formData[name] || ""}
            onChange={handleChange}
            onBlur={() => setFocusedField(null)}
            required={required}
            borderRadius="8px"
            borderColor={errors[name] ? "red.500" : "gray.200"}
            boxShadow={
              errors[name] ? "0 0 0 1px var(--chakra-colors-red-500)" : "none"
            }
            h="38px"
            fontSize="sm"
            _focus={{
              borderColor: primaryMaroon,
              boxShadow: "none",
              borderWidth: "1px",
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      size="xl"
    >
      <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <DialogPositioner alignItems="center">
        <DialogContent
          borderRadius="14px"
          overflow="hidden"
          boxShadow="2xl"
          h="95vh"
          maxH="95vh"
          display="flex"
          flexDirection="column"
        >
          <DialogHeader
            bg={primaryMaroon}
            color="white"
            fontSize="md"
            py={4}
            px={8}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="relative"
            borderBottom="1px solid rgba(255,255,255,0.1)"
          >
            <Text fontWeight="600" letterSpacing="0.5px" fontSize="md">
              {isEditing ? "EDIT BAPTISM RECORD" : "ADD BAPTISM RECORD"}
            </Text>
            <DialogCloseTrigger
              position="absolute"
              right={3}
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
              <Icon as={LuX} fontSize="18px" />
            </DialogCloseTrigger>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <DialogBody
              py={8}
              px={8}
              bg="white"
              flex="1"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(0,0,0,0.1)",
                  borderRadius: "10px",
                },
              }}
            >
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {renderField(
                  "baptism_category",
                  "Baptism Category",
                  "select",
                  [
                    { value: "PARISH", label: "Parish" },
                    { value: "OTHER", label: "Other" },
                  ],
                  false,
                  true,
                )}
                {renderField(
                  "date_of_baptism",
                  "Date of Baptism",
                  "date",
                  null,
                  false,
                  true,
                )}
                {renderField(
                  "place_of_birth",
                  "Place of Birth",
                  "text",
                  null,
                  false,
                  true,
                )}
                {renderField("name", "Name", "text", null, false, true)}
                {renderField("baptismal_name", "Baptismal Name")}
                {renderField(
                  "gender",
                  "Gender",
                  "select",
                  [
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                    { value: "OTHER", label: "Other" },
                  ],
                  false,
                  true,
                )}
                {renderField("dob", "Date of Birth", "date", null, false, true)}
                {renderField("parish_of_baptism", "Parish of Baptism")}
                {renderField("priest_name", "Priest Name")}
                {renderField("panchayath", "Panchayath")}
                {renderField("god_father", "God Father")}
                {renderField("god_mother", "God Mother")}
                {renderField(
                  "father_name",
                  "Father Name",
                  "text",
                  null,
                  false,
                  true,
                )}
                {renderField(
                  "mother_name",
                  "Mother Name",
                  "text",
                  null,
                  false,
                  true,
                )}

                {isParish && (
                  <>
                    <Box
                      gridColumn="span 3"
                      borderBottom="1px solid"
                      borderColor="gray.100"
                      my={1}
                    />
                    <Text
                      gridColumn="span 3"
                      fontSize="sm"
                      fontWeight="bold"
                      color={primaryMaroon}
                    >
                      Parish Details
                    </Text>
                    {renderField(
                      "family",
                      "Family",
                      "select",
                      families.map((f) => ({
                        value: f.id,
                        label: `${f.family_name} (${f.reg_no || f.id})`,
                      })),
                      false,
                      true,
                    )}
                    {renderField(
                      "main_member",
                      "Main Member",
                      "select",
                      members.map((m) => ({ value: m.id, label: m.name })),
                      false,
                      true,
                    )}
                    {renderField(
                      "relation_with_main_member",
                      "Relationship",
                      "select",
                      relationships.map((r) => ({
                        value: r.id,
                        label: r.name,
                      })),
                      false,
                      true,
                    )}
                  </>
                )}

                {renderField("address", "Address", "textarea", null, true)}
                {isParish &&
                  renderField("remarks", "Remarks", "textarea", null, true)}
              </SimpleGrid>
            </DialogBody>

            <DialogFooter
              px={8}
              pb={6}
              pt={2}
              bg="white"
              display="flex"
              justifyContent="flex-end"
            >
              <Button
                type="submit"
                bg={primaryMaroon}
                color="white"
                borderRadius="lg"
                h="40px"
                px={4}
                fontSize="md"
                fontWeight="bold"
                _hover={{
                  bg: "#6b0f1a",
                  boxShadow: "md",
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0)" }}
                loading={isLoading}
                display="flex"
                alignItems="center"
                gap={1.5}
                transition="all 0.2s"
              >
                <Icon as={isEditing ? LuSave : LuPlus} fontSize="14px" />
                {isEditing ? "Save Changes" : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default BaptismFormModal;
