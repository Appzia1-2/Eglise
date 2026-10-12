import React, { useRef, useState } from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  HStack,
  VStack,
  Button,
  Input,
  Icon,
  Image,
} from "@chakra-ui/react";

import { LuUpload, LuUserRound } from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";

import { createVicar } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";

// ============================================================
// TOAST HELPER
// ============================================================

const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};

// ============================================================
// FIELD LABELS (for toast messages)
// ============================================================

const FIELD_LABELS = {
  name: "Priest Name",
  family_name: "Family Name",
  designation: "Designation",
  phone_number: "Phone Number",
  date_from: "Serving From",
  date_to: "Serving To",
  is_active: "Serving Status",
  address_line1: "Address Line 1",
  address_line2: "Address Line 2",
  city: "City",
  state: "State",
  country: "Country",
  postal_code: "Postal Code",
  image: "Photo",
};

// ============================================================
// ERROR BORDER COLOR
// ============================================================

const ERROR_BORDER = "#F3C4C4";

// ============================================================
// INPUT STYLE
// ============================================================

const getInputStyle = (hasError) => ({
  borderColor: hasError ? ERROR_BORDER : "#DCE2EA",
  borderRadius: "7px",
  height: "44px",
  fontSize: "14px",
  color: "#182338",

  _hover: {
    borderColor: hasError ? ERROR_BORDER : "#C4CDD9",
  },

  _focus: {
    borderColor: hasError ? ERROR_BORDER : PRIMARY_MAROON,
    boxShadow: `0 0 0 1px ${hasError ? ERROR_BORDER : PRIMARY_MAROON}`,
  },
});

// ============================================================
// SELECT STYLE
// ============================================================

const getSelectStyle = (hasError) => ({
  width: "100%",
  height: "44px",
  border: `1px solid ${hasError ? ERROR_BORDER : "#DCE2EA"}`,
  borderRadius: "7px",
  padding: "0 12px",
  fontSize: "14px",
  background: "white",
  color: "#182338",
  outline: "none",
  cursor: "pointer",
});

// ============================================================
// FIELD
// (no inline error text — error shows via red border only)
// ============================================================

const Field = ({ label, required = false, children }) => {
  return (
    <Box>
      <Text
        fontSize="13px"
        fontWeight="600"
        color="#182338"
        mb={1.5}
        lineHeight="1.2"
      >
        {label}

        {required && (
          <Text as="span" color="#D7193F" ml={1}>
            *
          </Text>
        )}
      </Text>

      {children}
    </Box>
  );
};

// ============================================================
// REGISTER PRIEST PAGE
// ============================================================

const RegisterPriestPage = () => {
  const navigate = useNavigate();

  const fileRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState({
    name: "",
    family_name: "",
    designation: "MAIN",

    phone_number: "",

    date_from: "",
    date_to: "",

    // TRUE  = Currently Serving
    // FALSE = Previous / Not Serving
    is_active: true,

    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",

    image: null,
  });

  const [errors, setErrors] = useState({});

  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      detail: "",
    }));
  };

  // ==========================================================
  // SERVING STATUS TOGGLE
  // ==========================================================

  const handleStatusToggle = () => {
    setForm((prev) => ({
      ...prev,

      is_active: !prev.is_active,

      date_to: !prev.is_active ? "" : prev.date_to,
    }));

    setErrors((prev) => ({
      ...prev,
      date_to: "",
      is_active: "",
      detail: "",
    }));
  };

  // ==========================================================
  // IMAGE
  // ==========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Only JPG and PNG images are allowed.",
      }));

      showToast({
        title: "Invalid image",
        description: "Only JPG and PNG images are allowed.",
        type: "warning",
        duration: 4000,
      });

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Image must be less than 2 MB.",
      }));

      showToast({
        title: "Image too large",
        description: "Image must be less than 2 MB.",
        type: "warning",
        duration: 4000,
      });

      return;
    }

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setImagePreview(URL.createObjectURL(file));

    setErrors((prev) => ({
      ...prev,
      image: "",
      detail: "",
    }));
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!form.name.trim()) {
      newErrors.name = "Priest name is required.";
      missing.push(FIELD_LABELS.name);
    }

    if (!form.family_name.trim()) {
      newErrors.family_name = "Family name is required.";
      missing.push(FIELD_LABELS.family_name);
    }

    if (!form.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required.";
      missing.push(FIELD_LABELS.phone_number);
    }

    if (!form.date_from) {
      newErrors.date_from = "Serving from date is required.";
      missing.push(FIELD_LABELS.date_from);
    }

    // Previous priest must have serving-to date
    if (!form.is_active && !form.date_to) {
      newErrors.date_to =
        "Serving to date is required for a previous priest.";
      missing.push(FIELD_LABELS.date_to);
    }

    if (form.date_to && form.date_from && form.date_to < form.date_from) {
      newErrors.date_to =
        "Serving to date cannot be before serving from date.";
    }

    if (!form.address_line1.trim()) {
      newErrors.address_line1 = "Address Line 1 is required.";
      missing.push(FIELD_LABELS.address_line1);
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required.";
      missing.push(FIELD_LABELS.city);
    }

    if (!form.state.trim()) {
      newErrors.state = "State is required.";
      missing.push(FIELD_LABELS.state);
    }

    if (!form.country.trim()) {
      newErrors.country = "Country is required.";
      missing.push(FIELD_LABELS.country);
    }

    if (!form.postal_code.trim()) {
      newErrors.postal_code = "Postal code is required.";
      missing.push(FIELD_LABELS.postal_code);
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;

    // ---- Toast on validation failure ----
    if (!isValid) {
      const explicitMessages = Object.entries(newErrors)
        .filter(([key]) => !missing.includes(FIELD_LABELS[key]))
        .map(([, msg]) => msg);

      let description;

      if (explicitMessages.length > 0) {
        description = explicitMessages.join("\n");
      } else if (missing.length === 1) {
        description = `${missing[0]} is required.`;
      } else {
        description = `Please fill: ${missing.join(", ")}.`;
      }

      showToast({
        title: "Please fix the form",
        description,
        type: "warning",
        duration: 5000,
      });
    }

    return isValid;
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("family_name", form.family_name.trim());
      formData.append("designation", form.designation);
      formData.append("phone_number", form.phone_number.trim());
      formData.append("date_from", form.date_from);

      if (!form.is_active && form.date_to) {
        formData.append("date_to", form.date_to);
      }

      formData.append("is_active", form.is_active ? "true" : "false");

      formData.append("address_line1", form.address_line1.trim());
      formData.append("address_line2", form.address_line2.trim());
      formData.append("city", form.city.trim());
      formData.append("state", form.state.trim());
      formData.append("country", form.country.trim());
      formData.append("postal_code", form.postal_code.trim());

      if (form.image) {
        formData.append("image", form.image);
      }

      await createVicar(formData);

      showToast({
        title: "Priest registered",
        description: "The priest profile was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/priest-master", { replace: true });
    } catch (error) {
      console.error("Error creating priest:", error);

      const responseData = error?.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        const fieldErrors = {};

        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) fieldErrors[key] = value.join(", ");
          else if (typeof value === "string") fieldErrors[key] = value;
          else fieldErrors[key] = JSON.stringify(value);
        });

        setErrors(fieldErrors);

        const generalError =
          responseData.detail || responseData.non_field_errors?.[0];

        const fieldMessages = Object.values(fieldErrors).filter(Boolean);
        const onlyOneFieldError =
          fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not register priest",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : `Please check: ${Object.keys(fieldErrors)
                  .map((k) => FIELD_LABELS[k] || k)
                  .join(", ")}`),
          type: "error",
          duration: 7000,
        });
      } else {
        setErrors({
          detail: "Unable to register priest. Please try again.",
        });

        showToast({
          title: "Could not register priest",
          description: "Unable to register priest. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Container
        maxW="none"
        px={{ base: 4, md: 6, lg: 9 }}
        py={3}
        flex="1"
      >
        {/* BREADCRUMB */}
        <HStack gap={2} mb={5} color="#60708C" fontSize="14px">
          <Text>Masters</Text>
          <Text>/</Text>
          <Text>Priest Master</Text>
          <Text>/</Text>
          <Text>Register Priest</Text>
        </HStack>

        {/* PAGE HEADER */}
        <Text fontSize="13px" fontWeight="700" color="#D7193F" mb={1}>
          PRIEST MASTER
        </Text>

        <Heading size="xl" color="#182338" mb={1}>
          Register New Priest
        </Heading>

        <Text color="#60708C" fontSize="14px" mb={5}>
          Create a priest profile with service and contact information.
        </Text>

        {/* ERROR BANNER (general / non-field errors only) */}
        {errors.detail && (
          <Box
            mb={4}
            p={3}
            borderRadius="8px"
            bg="#FFF5F5"
            border="1px solid #FED7D7"
          >
            <Text fontSize="sm" color="red.600">
              {Array.isArray(errors.detail)
                ? errors.detail[0]
                : errors.detail}
            </Text>
          </Box>
        )}

        {/* MAIN FORM CARD */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          border="1px solid"
          borderColor="#DCE2EA"
          borderRadius="9px"
          px={{ base: 4, md: 5, lg: 6 }}
          py={4}
          bg="white"
        >
          <Heading size="md" color="#182338" mb={3}>
            1. Basic Information
          </Heading>

          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 5, lg: 6 }}>
            {/* PHOTO */}
            <Box>
              <Box
                h="235px"
                border="1px dashed"
                borderColor={errors.image ? ERROR_BORDER : "#FF5A7D"}
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                bg="#FFFBFC"
                onClick={() => fileRef.current?.click()}
              >
                <VStack gap={2}>
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      boxSize="88px"
                      borderRadius="full"
                      objectFit="cover"
                      border="2px solid #F3D2DA"
                    />
                  ) : (
                    <Box
                      boxSize="62px"
                      borderRadius="full"
                      bg="#FFF0F4"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={LuUserRound}
                        boxSize={8}
                        color={PRIMARY_MAROON}
                      />
                    </Box>
                  )}

                  <Text fontSize="13px" fontWeight="600" color="#182338">
                    Upload Priest Photo
                  </Text>

                  <Text fontSize="12px" color="#60708C">
                    PNG/JPG up to 2 MB
                  </Text>

                  <Button
                    type="button"
                    size="sm"
                    h="35px"
                    px={4}
                    variant="outline"
                    borderColor="#FF5A7D"
                    color="#D7193F"
                    pointerEvents="none"
                  >
                    <Icon as={LuUpload} mr={2} />
                    Choose File
                  </Button>
                </VStack>
              </Box>

              <Input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                display="none"
                onChange={handleImageChange}
              />
            </Box>

            {/* MIDDLE COLUMN */}
            <VStack align="stretch" gap={5}>
              <Field label="Priest Name" required>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Fr. Joseph Mathew"
                  {...getInputStyle(Boolean(errors.name))}
                />
              </Field>

              <Field label="Designation" required>
                <select
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  style={getSelectStyle(Boolean(errors.designation))}
                >
                  <option value="MAIN">Vicar</option>
                  <option value="ASSISTANT">Assistant Vicar</option>
                </select>
              </Field>

              <Field label="Serving From" required>
                <Input
                  type="date"
                  name="date_from"
                  value={form.date_from}
                  onChange={handleChange}
                  {...getInputStyle(Boolean(errors.date_from))}
                />
              </Field>
            </VStack>

            {/* RIGHT COLUMN */}
            <VStack align="stretch" gap={5}>
              <Field label="Family Name" required>
                <Input
                  name="family_name"
                  value={form.family_name}
                  onChange={handleChange}
                  placeholder="Mathew"
                  {...getInputStyle(Boolean(errors.family_name))}
                />
              </Field>

              <Field label="Phone Number" required>
                <Input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  {...getInputStyle(Boolean(errors.phone_number))}
                />
              </Field>

              {/* SERVING TO */}
              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#182338"
                  mb={1.5}
                >
                  Serving To
                </Text>

                <Flex align="center" gap={3} h="44px">
                  {!form.is_active ? (
                    <Input
                      type="date"
                      name="date_to"
                      value={form.date_to}
                      onChange={handleChange}
                      {...getInputStyle(Boolean(errors.date_to))}
                      flex="1"
                    />
                  ) : null}

                  {/* RED TOGGLE */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    flexShrink={0}
                    onClick={handleStatusToggle}
                  >
                    <Box
                      position="relative"
                      w="48px"
                      h="27px"
                      borderRadius="full"
                      bg={form.is_active ? "#D7193F" : "#C7CFDA"}
                      transition="background .2s"
                    >
                      <Box
                        position="absolute"
                        top="3px"
                        left={form.is_active ? "24px" : "3px"}
                        boxSize="21px"
                        borderRadius="full"
                        bg="white"
                        boxShadow="0 1px 3px rgba(0,0,0,0.18)"
                        transition="left .2s"
                      />
                    </Box>

                    <Text
                      fontSize="13px"
                      color="#344054"
                      whiteSpace="nowrap"
                    >
                      {form.is_active ? "Currently Serving" : "Not Serving"}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </VStack>
          </SimpleGrid>

          {/* ADDRESS SEPARATOR */}
          <Box mt={4} pt={4} borderTop="1px solid" borderColor="#E6EAF0">
            <Heading size="md" color="#182338" mb={3}>
              2. Address
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
              <Field label="Address Line 1" required>
                <Input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  placeholder="Parish House, 24 Hill Road"
                  {...getInputStyle(Boolean(errors.address_line1))}
                />
              </Field>

              <Field label="Address Line 2">
                <Input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={handleChange}
                  placeholder="Bandra West"
                  {...getInputStyle(Boolean(errors.address_line2))}
                />
              </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={5} mt={4}>
              <Field label="City" required>
                <Input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  {...getInputStyle(Boolean(errors.city))}
                />
              </Field>

              <Field label="State" required>
                <Input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  {...getInputStyle(Boolean(errors.state))}
                />
              </Field>

              <Field label="Country" required>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  style={getSelectStyle(Boolean(errors.country))}
                >
                  <option value="India">India</option>
                  <option value="Oman">Oman</option>
                  <option value="United Arab Emirates">
                    United Arab Emirates
                  </option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </Field>

              <Field label="Postal Code" required>
                <Input
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  placeholder="400050"
                  {...getInputStyle(Boolean(errors.postal_code))}
                />
              </Field>
            </SimpleGrid>
          </Box>

          {/* REGISTER BUTTON */}
          <Flex justify="flex-end" mt={5}>
            <Button
              type="submit"
              bg={PRIMARY_MAROON}
              color="white"
              px={6}
              h="42px"
              minW="145px"
              borderRadius="6px"
              loading={loading}
              _hover={{ bg: "#650A18" }}
            >
              Register Priest
            </Button>
          </Flex>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default RegisterPriestPage;