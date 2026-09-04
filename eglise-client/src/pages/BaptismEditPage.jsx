import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  Badge,
  Spinner,
  Center,
  Avatar,
} from "@chakra-ui/react";

import {
  LuSave,
  LuUser,
  LuMapPin,
  LuPhone,
  LuChurch,
  LuCalendarDays,
  LuPencil,
  LuUsers,
} from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getBaptism, updateBaptism } from "../api/registryServices";

/* ============================================================
   COLORS
============================================================ */

const RED = "#C90016";
const RED_DARK = "#A90012";
const NAVY = "#111F52";
const MUTED = "#667085";
const BORDER = "#DCE3EE";

/* ============================================================
   HELPERS
============================================================ */

const getResponseData = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return data || [];
};

const getValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value.id ?? "";
  return value;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "BM";
  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/* ============================================================
   FORM FIELD
============================================================ */

const FormField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  error,
  touched,
  children,
  required = false,
  disabled = false,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={NAVY} mb="2px">
        {label}
        {required && <Text as="span" color={RED} ml="1px">*</Text>}
      </Text>

      {children ? (
        children
      ) : (
        <Box
          as="input"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          h="28px"
          minH="28px"
          px="8px"
          border="1px solid"
          borderColor={invalid ? RED : "#D7DFEA"}
          borderRadius="4px"
          fontSize="11px"
          color={NAVY}
          bg={disabled ? "#F5F6FA" : "white"}
          w="100%"
          outline="none"
          boxSizing="border-box"
          cursor={disabled ? "not-allowed" : "text"}
          opacity={disabled ? 0.7 : 1}
          _hover={{
            borderColor: invalid ? RED : "#B8C3D4",
          }}
          _focus={{
            borderColor: RED,
            boxShadow: `0 0 0 1px ${RED}`,
          }}
          _placeholder={{ color: "#98A2B3" }}
        />
      )}

      {invalid && (
        <Text fontSize="8px" color={RED} mt="1px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ============================================================
   SELECT FIELD
============================================================ */

const SelectField = ({
  name,
  value,
  onChange,
  onBlur,
  children,
  disabled = false,
  invalid = false,
}) => {
  return (
    <Box position="relative">
      <Box
        as="select"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        h="28px"
        minH="28px"
        px="8px"
        pr="24px"
        border="1px solid"
        borderColor={invalid ? RED : "#D7DFEA"}
        borderRadius="4px"
        fontSize="11px"
        color={NAVY}
        bg={disabled ? "#F5F6FA" : "white"}
        w="100%"
        outline="none"
        boxSizing="border-box"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.7 : 1}
        appearance="none"
        _hover={{
          borderColor: disabled ? "#D7DFEA" : invalid ? RED : "#B8C3D4",
        }}
        _focus={{
          borderColor: RED,
          boxShadow: `0 0 0 1px ${RED}`,
        }}
      >
        {children}
      </Box>
      <Box
        position="absolute"
        right="8px"
        top="50%"
        transform="translateY(-50%)"
        pointerEvents="none"
        color={NAVY}
        fontSize="10px"
      >
        ▼
      </Box>
    </Box>
  );
};

/* ============================================================
   TEXTAREA FIELD
============================================================ */

const TextareaField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  error,
  touched,
  required = false,
  rows = 2,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={NAVY} mb="2px">
        {label}
        {required && <Text as="span" color={RED} ml="1px">*</Text>}
      </Text>

      <Box
        as="textarea"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        w="100%"
        px="8px"
        py="5px"
        border="1px solid"
        borderColor={invalid ? RED : "#D7DFEA"}
        borderRadius="4px"
        bg="white"
        color={NAVY}
        fontSize="11px"
        resize="vertical"
        outline="none"
        boxSizing="border-box"
        _hover={{
          borderColor: invalid ? RED : "#B8C3D4",
        }}
        _focus={{
          borderColor: RED,
          boxShadow: `0 0 0 1px ${RED}`,
        }}
        _placeholder={{ color: "#98A2B3" }}
      />

      {invalid && (
        <Text fontSize="8px" color={RED} mt="1px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ============================================================
   CONTEXT INFO BOX
============================================================ */

const ContextInfoBox = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <Flex align="center" gap="8px" py="4px">
      <Box color={NAVY} fontSize="16px">
        {icon}
      </Box>
      <Box>
        <Text fontSize="9px" color={MUTED} fontWeight="500">
          {label}
        </Text>
        <Text fontSize="11px" color={NAVY} fontWeight="600">
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

/* ============================================================
   INITIAL FORM
============================================================ */

const initialForm = {
  baptism_category: "PARISH",
  date_of_baptism: "",
  name: "",
  baptismal_name: "",
  gender: "",
  dob: "",
  place_of_birth: "",
  parish_of_baptism: "",
  panchayath: "",
  priest_name: "",
  god_father: "",
  god_mother: "",
  father_name: "",
  mother_name: "",
  family: "",
  main_member: "",
  relation_with_main_member: "",
  email: "",
  mobile_number: "",
  present_address: "",
  permanent_address: "",
  same_as_present: false,
  remarks: "",
};

/* ============================================================
   BAPTISM EDIT PAGE
============================================================ */

const BaptismEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [baptism, setBaptism] = useState(null);

  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    setLoading(true);
    setError("");

    try {
      const [baptismResponse, familiesResponse, membersResponse, relationshipsResponse] =
        await Promise.all([
          getBaptism(id),
          apiClient.get("/api/registry/families/"),
          apiClient.get("/api/registry/members/"),
          apiClient.get("/api/registry/relationships/"),
        ]);

      const record = baptismResponse.data;
      setBaptism(record);

      setFamilies(getResponseData(familiesResponse));
      setMembers(getResponseData(membersResponse));
      setRelationships(getResponseData(relationshipsResponse));

      setFormData({
        baptism_category: record.baptism_category || "PARISH",
        date_of_baptism: record.date_of_baptism || "",
        name: record.name || "",
        baptismal_name: record.baptismal_name || "",
        gender: record.gender || "",
        dob: record.dob || "",
        place_of_birth: record.place_of_birth || "",
        parish_of_baptism: record.parish_of_baptism || "",
        panchayath: record.panchayath || "",
        priest_name: record.priest_name || "",
        god_father: record.god_father || "",
        god_mother: record.god_mother || "",
        father_name: record.father_name || "",
        mother_name: record.mother_name || "",
        family: getValue(record.family),
        main_member: getValue(record.main_member),
        relation_with_main_member: getValue(record.relation_with_main_member),
        email: record.email || "",
        mobile_number: record.mobile_number || "",
        present_address: record.present_address || record.address || "",
        permanent_address: record.permanent_address || "",
        same_as_present: false,
        remarks: record.remarks || "",
      });
    } catch (err) {
      console.error("Error loading baptism:", err);
      setError(err?.response?.data?.detail || "Unable to load baptism record.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     STATE
  ========================================================== */

  const memberAlreadyCreated = Boolean(baptism?.member);
  const isParish = formData.baptism_category === "PARISH";

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setError("");
  };

  const handleBlur = () => {};

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      baptism_category: value,
      family: value === "PARISH" ? prev.family : "",
      main_member: value === "PARISH" ? prev.main_member : "",
      relation_with_main_member: value === "PARISH" ? prev.relation_with_main_member : "",
    }));
    setFieldErrors({});
    setError("");
  };

  const handleFamilyChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      family: value,
      main_member: "",
      relation_with_main_member: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      family: undefined,
      main_member: undefined,
      relation_with_main_member: undefined,
    }));
  };

  const handlePresentAddressChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      present_address: value,
      permanent_address: prev.same_as_present ? value : prev.permanent_address,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      present_address: undefined,
      permanent_address: undefined,
    }));
    setError("");
  };

  const handleSameAddress = (event) => {
    const checked = event.target.checked;
    setFormData((prev) => ({
      ...prev,
      same_as_present: checked,
      permanent_address: checked ? prev.present_address : "",
    }));
  };

  /* ==========================================================
     OPTIONS
  ========================================================== */

  const familyMembers = useMemo(() => {
    if (!formData.family) return [];
    return members.filter((member) => {
      const memberFamily = member.family ?? member.family_id;
      const familyId = typeof memberFamily === "object" ? memberFamily?.id : memberFamily;
      return (
        String(familyId) === String(formData.family) &&
        (member.is_family_head === true || member.is_family_head === 1)
      );
    });
  }, [members, formData.family]);

  const familyOptions = families.map((family) => ({
    value: family.id,
    label: family.family_name || family.name || `Family #${family.id}`,
  }));

  const memberOptions = familyMembers.map((member) => ({
    value: member.id,
    label: member.name || `Member #${member.id}`,
  }));

  const relationshipOptions = relationships.map((relationship) => ({
    value: relationship.id,
    label: relationship.name || relationship.relationship_name || relationship.relation_name || `Relationship #${relationship.id}`,
  }));

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        baptism_category: formData.baptism_category,
        date_of_baptism: formData.date_of_baptism,
        name: formData.name,
        baptismal_name: formData.baptismal_name,
        gender: formData.gender,
        dob: formData.dob || null,
        place_of_birth: formData.place_of_birth,
        parish_of_baptism: formData.parish_of_baptism,
        panchayath: formData.panchayath,
        priest_name: formData.priest_name,
        god_father: formData.god_father,
        god_mother: formData.god_mother,
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        address: formData.present_address || formData.parish_of_baptism || "",
      };

      if (formData.baptism_category === "PARISH") {
        payload.family = formData.family ? Number(formData.family) : null;
        payload.main_member = formData.main_member ? Number(formData.main_member) : null;
        payload.relation_with_main_member = formData.relation_with_main_member
          ? Number(formData.relation_with_main_member)
          : null;
      }

      if (formData.baptism_category === "OTHER") {
        payload.email = formData.email;
        payload.mobile_number = formData.mobile_number;
        payload.present_address = formData.present_address;
        payload.permanent_address = formData.permanent_address;
        payload.remarks = formData.remarks;
      }

      await updateBaptism(id, payload);
      navigate(`/baptism/${id}`);
    } catch (err) {
      console.error("Error updating baptism:", err);
      const responseData = err?.response?.data;

      if (responseData && typeof responseData === "object") {
        const errors = {};
        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            errors[key] = value.join(", ");
          } else if (typeof value === "string") {
            errors[key] = value;
          } else {
            errors[key] = JSON.stringify(value);
          }
        });
        setFieldErrors(errors);
        setError(
          responseData.detail ||
            responseData.non_field_errors?.[0] ||
            "Please correct the highlighted fields."
        );
      } else {
        setError("Unable to update baptism record.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color={RED} />
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!baptism) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Text color={NAVY}>Baptism record not found.</Text>
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     VALUES FOR TOP BAR
  ========================================================== */

  const familyName = baptism?.family_name || baptism?.family?.family_name || null;
  const parishName = formData.parish_of_baptism || baptism?.parish_of_baptism || null;
  const wardName = baptism?.ward_name || "—";

  const image = baptism?.image_url || baptism?.image || null;
  const age = baptism?.age || "—";

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box
        flex="1"
        px={{ base: "16px", md: "20px", lg: "24px" }}
        pt={{ base: "10px", md: "12px" }}
        pb="10px"
      >
        <Box maxW="1540px" mx="auto" width="100%">
          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <Flex align="center" gap="6px" mb="8px" flexWrap="wrap">
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate("/")}>
              Masters
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate("/baptism")}>
              Baptism Register
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate(`/baptism/${id}`)}>
              {formData.name || "Record"}
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9">Edit</Text>
          </Flex>

          {/* ==================================================
              PAGE TITLE
          ================================================== */}

          <Flex align="center" justify="space-between" flexWrap="wrap" gap="8px" mb="8px">
            <Box>
              <Text fontSize="9px" fontWeight="800" color={RED} letterSpacing="0.25px" mb="1px">
                BAPTISM REGISTER
              </Text>
              <Heading fontSize={{ base: "18px", md: "20px" }} fontWeight="700" color={NAVY} lineHeight="1.1">
                {isParish ? "Edit Baptism" : "Edit Baptism – Other Parish Member"}
              </Heading>
              <Text fontSize="10px" color={MUTED} mt="2px">
                {isParish
                  ? "Update baptism details for a parish member."
                  : "Update baptism details for a member from another parish."}
              </Text>
            </Box>
          </Flex>

          {/* ==================================================
              GENERAL ERROR
          ================================================== */}

          {error && (
            <Box bg="#FFF8FA" border="1px solid #FECACA" borderRadius="4px" px="10px" py="6px" mb="8px">
              <Text fontSize="10px" color={RED} fontWeight="500">
                {error}
              </Text>
            </Box>
          )}

          {/* ==================================================
              BAPTISM SUMMARY
          ================================================== */}

          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="6px"
            px={{ base: "14px", md: "18px" }}
            py="8px"
            mb="8px"
          >
            <Grid
              templateColumns={{
                base: "1fr",
                lg: "1.3fr 1.1fr 0.9fr 0.8fr auto",
              }}
              alignItems="center"
              gap="8px"
            >
              <Flex align="center" gap="14px">
                <Avatar.Root width="48px" height="48px" flexShrink="0">
                  {image ? (
                    <Avatar.Image src={image} alt={formData.name} />
                  ) : null}
                  <Avatar.Fallback
                    bg="#FFE8EB"
                    color={RED}
                    fontWeight="700"
                    fontSize="14px"
                    name={formData.name}
                  >
                    {getInitials(formData.name)}
                  </Avatar.Fallback>
                </Avatar.Root>

                <Box>
                  <Text fontSize="15px" fontWeight="700" color={NAVY} lineHeight="1.2">
                    {formData.name || "Baptism Record"}
                  </Text>
                  <Text fontSize="11px" color={NAVY} mt="2px">
                    {formData.baptismal_name || "—"}
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuChurch size="16" />
                </Box>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={NAVY}>
                    {isParish ? familyName || "—" : parishName || "—"}
                  </Text>
                  <Text fontSize="9px" color={MUTED}>Family</Text>
                </Box>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuCalendarDays size="16" />
                </Box>
                <Text fontSize="11px" fontWeight="500" color={NAVY}>
                  {formatDate(formData.date_of_baptism)}
                </Text>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuUser size="16" />
                </Box>
                <Text fontSize="11px" fontWeight="600" color={NAVY}>
                  {age !== "—" ? `${age} Years` : "—"}
                </Text>
              </Flex>

              <Badge
                px="8px"
                py="3px"
                borderRadius="4px"
                bg="#EAF8EE"
                border="1px solid"
                borderColor="#C4E8CC"
                color="#24913E"
                fontSize="9px"
                fontWeight="500"
              >
                Active
              </Badge>
            </Grid>
          </Box>

          {/* ==================================================
              CONTENT AREA
          ================================================== */}

          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(220px, 1fr)",
            }}
            gap="14px"
            alignItems="start"
          >
            {/* =================================================
                LEFT FORM
            ================================================= */}

            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="6px"
            >
              <Box
                px={{ base: "12px", md: "14px" }}
                py="6px"
                bg="#F8FAFC"
                borderBottom="1px solid"
                borderBottomColor={BORDER}
              >
                <Text fontSize="10px" color={MUTED} fontWeight="500">
                  {baptism?.register_number && (
                    <>
                      Reg No: <Text as="span" color={NAVY} fontWeight="600">{baptism.register_number}</Text>
                    </>
                  )}
                </Text>
              </Box>

              <Box p={{ base: "12px", md: "14px" }}>
                {isParish ? (
                  /* ===== PARISH FORM ===== */
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                    gap={{ base: "8px", md: "8px 14px" }}
                  >
                    <FormField
                      label="Reg No."
                      value={baptism?.register_number || ""}
                      disabled
                    />

                    <FormField
                      label="Baptism Category"
                      name="baptism_category"
                      value={formData.baptism_category}
                      onChange={handleCategoryChange}
                      onBlur={handleBlur}
                      required
                      disabled={memberAlreadyCreated}
                      error={fieldErrors.baptism_category}
                      touched={fieldErrors.baptism_category}
                    >
                      <SelectField
                        name="baptism_category"
                        value={formData.baptism_category}
                        onChange={handleCategoryChange}
                        onBlur={handleBlur}
                        disabled={memberAlreadyCreated}
                        invalid={Boolean(fieldErrors.baptism_category)}
                      >
                        <option value="PARISH">Infant Baptism</option>
                        <option value="OTHER">Other / Outsider</option>
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Parish of Baptism"
                      name="parish_of_baptism"
                      value={formData.parish_of_baptism}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.parish_of_baptism}
                      touched={fieldErrors.parish_of_baptism}
                    />

                    <FormField
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.gender}
                      touched={fieldErrors.gender}
                    >
                      <SelectField
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={Boolean(fieldErrors.gender)}
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Date of Baptism"
                      name="date_of_baptism"
                      type="date"
                      value={formData.date_of_baptism}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.date_of_baptism}
                      touched={fieldErrors.date_of_baptism}
                    />

                    <FormField
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.name}
                      touched={fieldErrors.name}
                    />

                    <FormField
                      label="Baptism Name"
                      name="baptismal_name"
                      value={formData.baptismal_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.baptismal_name}
                      touched={fieldErrors.baptismal_name}
                    />

                    <FormField
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.dob}
                      touched={fieldErrors.dob}
                    />

                    <FormField
                      label="Place of Birth"
                      name="place_of_birth"
                      value={formData.place_of_birth}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.place_of_birth}
                      touched={fieldErrors.place_of_birth}
                    />

                    <FormField
                      label="God Father"
                      name="god_father"
                      value={formData.god_father}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.god_father}
                      touched={fieldErrors.god_father}
                    />

                    <FormField
                      label="God Mother"
                      name="god_mother"
                      value={formData.god_mother}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.god_mother}
                      touched={fieldErrors.god_mother}
                    />

                    <FormField
                      label="Father Name"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.father_name}
                      touched={fieldErrors.father_name}
                    />

                    <FormField
                      label="Mother Name"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.mother_name}
                      touched={fieldErrors.mother_name}
                    />

                    <FormField
                      label="Panchayath"
                      name="panchayath"
                      value={formData.panchayath}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.panchayath}
                      touched={fieldErrors.panchayath}
                    />

                    <FormField
                      label="Priest Name"
                      name="priest_name"
                      value={formData.priest_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.priest_name}
                      touched={fieldErrors.priest_name}
                    />

                    <FormField
                      label="Relationship"
                      name="relation_with_main_member"
                      value={formData.relation_with_main_member}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      disabled={memberAlreadyCreated}
                      error={fieldErrors.relation_with_main_member}
                      touched={fieldErrors.relation_with_main_member}
                    >
                      <SelectField
                        name="relation_with_main_member"
                        value={formData.relation_with_main_member}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={memberAlreadyCreated}
                        invalid={Boolean(fieldErrors.relation_with_main_member)}
                      >
                        <option value="">Select</option>
                        {relationshipOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Family Name"
                      name="family"
                      value={formData.family}
                      onChange={handleFamilyChange}
                      onBlur={handleBlur}
                      required
                      disabled={memberAlreadyCreated}
                      error={fieldErrors.family}
                      touched={fieldErrors.family}
                    >
                      <SelectField
                        name="family"
                        value={formData.family}
                        onChange={handleFamilyChange}
                        onBlur={handleBlur}
                        disabled={memberAlreadyCreated}
                        invalid={Boolean(fieldErrors.family)}
                      >
                        <option value="">Select</option>
                        {familyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Main Member"
                      name="main_member"
                      value={formData.main_member}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      disabled={memberAlreadyCreated || !formData.family}
                      error={fieldErrors.main_member}
                      touched={fieldErrors.main_member}
                    >
                      <SelectField
                        name="main_member"
                        value={formData.main_member}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={memberAlreadyCreated || !formData.family}
                        invalid={Boolean(fieldErrors.main_member)}
                      >
                        <option value="">Select</option>
                        {memberOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>

                    {memberAlreadyCreated && (
                      <Box gridColumn="1 / -1">
                        <Text fontSize="9px" color={MUTED}>
                          Family, main member, relationship and category cannot be changed.
                        </Text>
                      </Box>
                    )}
                  </Grid>
                ) : (
                  /* ===== OTHER FORM ===== */
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                    gap={{ base: "8px", md: "8px 14px" }}
                  >
                    <FormField
                      label="Reg No."
                      value={baptism?.register_number || ""}
                      disabled
                    />

                    <FormField
                      label="Date of Baptism"
                      name="date_of_baptism"
                      type="date"
                      value={formData.date_of_baptism}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.date_of_baptism}
                      touched={fieldErrors.date_of_baptism}
                    />

                    <FormField
                      label="Baptism Category"
                      name="baptism_category"
                      value={formData.baptism_category}
                      onChange={handleCategoryChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.baptism_category}
                      touched={fieldErrors.baptism_category}
                    >
                      <SelectField
                        name="baptism_category"
                        value={formData.baptism_category}
                        onChange={handleCategoryChange}
                        onBlur={handleBlur}
                        invalid={Boolean(fieldErrors.baptism_category)}
                      >
                        <option value="PARISH">Parish Member</option>
                        <option value="OTHER">Other / Outsider</option>
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.gender}
                      touched={fieldErrors.gender}
                    >
                      <SelectField
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={Boolean(fieldErrors.gender)}
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </SelectField>
                    </FormField>

                    <FormField
                      label="Baptism Name"
                      name="baptismal_name"
                      value={formData.baptismal_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.baptismal_name}
                      touched={fieldErrors.baptismal_name}
                    />

                    <FormField
                      label="Parish of Baptism"
                      name="parish_of_baptism"
                      value={formData.parish_of_baptism}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.parish_of_baptism}
                      touched={fieldErrors.parish_of_baptism}
                    />

                    <FormField
                      label="Place of Birth"
                      name="place_of_birth"
                      value={formData.place_of_birth}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.place_of_birth}
                      touched={fieldErrors.place_of_birth}
                    />

                    <FormField
                      label="Priest Name"
                      name="priest_name"
                      value={formData.priest_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.priest_name}
                      touched={fieldErrors.priest_name}
                    />

                    <FormField
                      label="God Father"
                      name="god_father"
                      value={formData.god_father}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.god_father}
                      touched={fieldErrors.god_father}
                    />

                    <FormField
                      label="God Mother"
                      name="god_mother"
                      value={formData.god_mother}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.god_mother}
                      touched={fieldErrors.god_mother}
                    />

                    <FormField
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.name}
                      touched={fieldErrors.name}
                    />

                    <FormField
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.dob}
                      touched={fieldErrors.dob}
                    />

                    <FormField
                      label="Panchayath"
                      name="panchayath"
                      value={formData.panchayath}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.panchayath}
                      touched={fieldErrors.panchayath}
                    />

                    <FormField
                      label="Father Name"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.father_name}
                      touched={fieldErrors.father_name}
                    />

                    <FormField
                      label="Mother Name"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.mother_name}
                      touched={fieldErrors.mother_name}
                    />

                    <FormField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.email}
                      touched={fieldErrors.email}
                    />

                    <FormField
                      label="Mobile"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.mobile_number}
                      touched={fieldErrors.mobile_number}
                    />

                    <Box gridColumn="1 / -1">
                      <TextareaField
                        label="Present Address"
                        name="present_address"
                        value={formData.present_address}
                        onChange={handlePresentAddressChange}
                        onBlur={handleBlur}
                        required
                        error={fieldErrors.present_address || fieldErrors.address}
                        touched={fieldErrors.present_address || fieldErrors.address}
                        rows={2}
                      />
                    </Box>

                    <Box gridColumn="1 / -1">
                      <TextareaField
                        label="Permanent Address"
                        name="permanent_address"
                        value={formData.permanent_address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        error={fieldErrors.permanent_address}
                        touched={fieldErrors.permanent_address}
                        rows={2}
                      />
                      <Flex align="center" gap="4px" mt="4px">
                        <Box
                          as="input"
                          type="checkbox"
                          checked={formData.same_as_present}
                          onChange={handleSameAddress}
                          w="12px"
                          h="12px"
                          accentColor={RED}
                        />
                        <Text fontSize="9px" color={NAVY}>Same as Present Address</Text>
                      </Flex>
                    </Box>

                    <Box gridColumn="1 / -1">
                      <TextareaField
                        label="Remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.remarks}
                        touched={fieldErrors.remarks}
                        rows={2}
                      />
                    </Box>
                  </Grid>
                )}
              </Box>

              {/* =============================================
                  FORM FOOTER
              ============================================= */}

              <Flex
                justify="flex-end"
                gap="10px"
                px={{ base: "12px", md: "14px" }}
                py="10px"
                borderTop="1px solid"
                borderTopColor={BORDER}
              >
                <Button
                  type="button"
                  h="30px"
                  minW="100px"
                  bg="white"
                  color={RED}
                  border="1px solid"
                  borderColor={RED}
                  borderRadius="4px"
                  fontSize="10px"
                  fontWeight="600"
                  onClick={() => navigate(`/baptism/${id}`)}
                  _hover={{ bg: "#FFF7F8" }}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  h="30px"
                  minW="120px"
                  bg={RED}
                  color="white"
                  borderRadius="4px"
                  fontSize="10px"
                  fontWeight="600"
                  _hover={{ bg: RED_DARK }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="xs" mr="4px" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <LuSave size="14" />
                      Save Changes
                    </>
                  )}
                </Button>
              </Flex>
            </Box>

            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <VStack align="stretch" gap="10px">
              {/* RECORD INFORMATION */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                p="12px"
              >
                <Text fontSize="12px" fontWeight="700" color={NAVY} mb="12px">
                  Record Information
                </Text>

                <Flex align="flex-start" gap="10px" pb="12px" borderBottom="1px solid" borderColor="#E5EAF1">
                  <Box color={NAVY} mt="1px">
                    <LuCalendarDays size="16" />
                  </Box>
                  <Box>
                    <Text fontSize="9px" color={NAVY} fontWeight="700">
                      Created
                    </Text>
                    <Text fontSize="10px" color={NAVY} mt="3px">
                      {baptism?.created_at ? formatDate(baptism.created_at) : "—"}
                    </Text>
                  </Box>
                </Flex>

                <Flex align="flex-start" gap="10px" pt="12px">
                  <Box color={NAVY} mt="1px">
                    <LuPencil size="16" />
                  </Box>
                  <Box>
                    <Text fontSize="9px" color={NAVY} fontWeight="700">
                      Last updated
                    </Text>
                    <Text fontSize="10px" color={NAVY} mt="3px">
                      {baptism?.updated_at ? formatDate(baptism.updated_at) : "—"}
                    </Text>
                    {baptism?.updated_by && (
                      <Text fontSize="8px" color={MUTED} mt="2px">
                        by {baptism.updated_by}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </Box>

              {/* CONTEXT INFORMATION */}

              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                p="12px"
              >
                <Text fontSize="12px" fontWeight="700" color={NAVY} mb="10px">
                  {isParish ? "Parish Member Context" : "Other Parish Member Context"}
                </Text>

                {isParish ? (
                  <VStack align="stretch" gap="2px">
                    <ContextInfoBox
                      icon={<LuUsers size="16" />}
                      label="Family"
                      value={familyName}
                    />
                    <ContextInfoBox
                      icon={<LuUser size="16" />}
                      label="Main Member"
                      value={baptism?.main_member_name || baptism?.main_member}
                    />
                    <ContextInfoBox
                      icon={<LuMapPin size="16" />}
                      label="Ward"
                      value={wardName}
                    />
                    <Button
                      variant="ghost"
                      p="0"
                      mt="8px"
                      height="auto"
                      color={RED}
                      fontSize="10px"
                      fontWeight="700"
                      onClick={() => navigate(`/members/${baptism?.member}`)}
                      _hover={{ bg: "transparent", color: RED_DARK }}
                      disabled={!baptism?.member}
                    >
                      View Member →
                    </Button>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap="2px">
                    <ContextInfoBox
                      icon={<LuChurch size="16" />}
                      label="Parish"
                      value={parishName}
                    />
                    <ContextInfoBox
                      icon={<LuMapPin size="16" />}
                      label="Place"
                      value={formData.place_of_birth}
                    />
                    <ContextInfoBox
                      icon={<LuMapPin size="16" />}
                      label="Panchayath"
                      value={formData.panchayath}
                    />
                    <ContextInfoBox
                      icon={<LuPhone size="16" />}
                      label="Mobile"
                      value={formData.mobile_number ? `+91 ${formData.mobile_number}` : null}
                    />
                    <Button
                      variant="ghost"
                      p="0"
                      mt="8px"
                      height="auto"
                      color={RED}
                      fontSize="10px"
                      fontWeight="700"
                      onClick={() => navigate(`/baptism/${id}`)}
                      _hover={{ bg: "transparent", color: RED_DARK }}
                    >
                      View Record →
                    </Button>
                  </VStack>
                )}
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default BaptismEditPage;