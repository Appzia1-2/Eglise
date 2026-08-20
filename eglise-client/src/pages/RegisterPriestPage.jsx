import React, {
  useRef,
  useState,
} from "react";

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

import {
  LuUpload,
  LuUserRound,
} from "react-icons/lu";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createVicar,
} from "../api/registryServices";

const PRIMARY_MAROON =
  "var(--primary-maroon)";

// ============================================================
// INPUT STYLE
// ============================================================

const inputStyle = {
  borderColor: "#DCE2EA",
  borderRadius: "7px",
  height: "44px",
  fontSize: "14px",
  color: "#182338",

  _focus: {
    borderColor: PRIMARY_MAROON,
    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
  },
};

// ============================================================
// SELECT STYLE
// ============================================================

const selectStyle = {
  width: "100%",
  height: "44px",
  border: "1px solid #DCE2EA",
  borderRadius: "7px",
  padding: "0 12px",
  fontSize: "14px",
  background: "white",
  color: "#182338",
  outline: "none",
  cursor: "pointer",
};

// ============================================================
// FIELD
// ============================================================

const Field = ({
  label,
  name,
  required = false,
  error,
  children,
}) => {
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
          <Text
            as="span"
            color="#D7193F"
            ml={1}
          >
            *
          </Text>
        )}
      </Text>

      {children}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
          {Array.isArray(error)
            ? error[0]
            : error}
        </Text>
      )}
    </Box>
  );
};

// ============================================================
// REGISTER PRIEST PAGE
// ============================================================

const RegisterPriestPage = () => {
  const navigate = useNavigate();

  const fileRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [imagePreview, setImagePreview] =
    useState(null);

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

  const [errors, setErrors] =
    useState({});

  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

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

      date_to: !prev.is_active
        ? ""
        : prev.date_to,
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
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image:
          "Only JPG and PNG images are allowed.",
      }));

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setErrors((prev) => ({
        ...prev,
        image:
          "Image must be less than 2 MB.",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setImagePreview(
      URL.createObjectURL(file)
    );

    setErrors((prev) => ({
      ...prev,
      image: "",
    }));
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name =
        "Priest name is required.";
    }

    if (!form.family_name.trim()) {
      newErrors.family_name =
        "Family name is required.";
    }

    if (!form.phone_number.trim()) {
      newErrors.phone_number =
        "Phone number is required.";
    }

    if (!form.date_from) {
      newErrors.date_from =
        "Serving from date is required.";
    }

    // Previous priest must have serving-to date
    if (
      !form.is_active &&
      !form.date_to
    ) {
      newErrors.date_to =
        "Serving to date is required for a previous priest.";
    }

    if (
      form.date_to &&
      form.date_from &&
      form.date_to < form.date_from
    ) {
      newErrors.date_to =
        "Serving to date cannot be before serving from date.";
    }

    if (!form.address_line1.trim()) {
      newErrors.address_line1 =
        "Address Line 1 is required.";
    }

    if (!form.city.trim()) {
      newErrors.city =
        "City is required.";
    }

    if (!form.state.trim()) {
      newErrors.state =
        "State is required.";
    }

    if (!form.country.trim()) {
      newErrors.country =
        "Country is required.";
    }

    if (!form.postal_code.trim()) {
      newErrors.postal_code =
        "Postal code is required.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length ===
      0
    );
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

      const formData =
        new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "family_name",
        form.family_name.trim()
      );

      formData.append(
        "designation",
        form.designation
      );

      formData.append(
        "phone_number",
        form.phone_number.trim()
      );

      formData.append(
        "date_from",
        form.date_from
      );

      // Previous priest only
      if (
        !form.is_active &&
        form.date_to
      ) {
        formData.append(
          "date_to",
          form.date_to
        );
      }

      // IMPORTANT
      formData.append(
        "is_active",
        form.is_active
          ? "true"
          : "false"
      );

      formData.append(
        "address_line1",
        form.address_line1.trim()
      );

      formData.append(
        "address_line2",
        form.address_line2.trim()
      );

      formData.append(
        "city",
        form.city.trim()
      );

      formData.append(
        "state",
        form.state.trim()
      );

      formData.append(
        "country",
        form.country.trim()
      );

      formData.append(
        "postal_code",
        form.postal_code.trim()
      );

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      console.log(
        "REGISTER PRIEST DATA"
      );

      for (
        const [key, value]
        of formData.entries()
      ) {
        console.log(
          key,
          value
        );
      }

      await createVicar(
        formData
      );

      navigate(
        "/priest-master",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Error creating priest:",
        error
      );

      const responseData =
        error?.response?.data;

      if (
        responseData &&
        typeof responseData ===
          "object"
      ) {
        setErrors(
          responseData
        );
      } else {
        setErrors({
          detail:
            "Unable to register priest. Please try again.",
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
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Container
        maxW="none"
        px={{
          base: 4,
          md: 6,
          lg: 9,
        }}
        py={3}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={5}
          color="#60708C"
          fontSize="14px"
        >
          <Text>
            Masters
          </Text>

          <Text>/</Text>

          <Text>
            Priest Master
          </Text>

          <Text>/</Text>

          <Text>
            Register Priest
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Text
          fontSize="13px"
          fontWeight="700"
          color="#D7193F"
          mb={1}
        >
          PRIEST MASTER
        </Text>

        <Heading
          size="xl"
          color="#182338"
          mb={1}
        >
          Register New Priest
        </Heading>

        <Text
          color="#60708C"
          fontSize="14px"
          mb={5}
        >
          Create a priest profile with
          service and contact information.
        </Text>

        {/* ==================================================
            ERROR
        ================================================== */}

        {errors.detail && (
          <Box
            mb={4}
            p={3}
            borderRadius="8px"
            bg="#FFF5F5"
            border="1px solid #FED7D7"
          >
            <Text
              fontSize="sm"
              color="red.600"
            >
              {Array.isArray(
                errors.detail
              )
                ? errors.detail[0]
                : errors.detail}
            </Text>
          </Box>
        )}

        {/* ==================================================
            MAIN FORM CARD
        ================================================== */}

        <Box
          border="1px solid"
          borderColor="#DCE2EA"
          borderRadius="9px"
          px={{
            base: 4,
            md: 5,
            lg: 6,
          }}
          py={4}
          bg="white"
        >
          {/* ==================================================
              BASIC INFORMATION TITLE
          ================================================== */}

          <Heading
            size="md"
            color="#182338"
            mb={3}
          >
            1. Basic Information
          </Heading>

          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <SimpleGrid
            columns={{
              base: 1,
              lg: 3,
            }}
            gap={{
              base: 5,
              lg: 6,
            }}
          >
            {/* ==================================================
                PHOTO
            ================================================== */}

            <Box>
              <Box
                h={{
                  base: "235px",
                  lg: "235px",
                }}
                border="1px dashed"
                borderColor="#FF5A7D"
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                bg="#FFFBFC"
                onClick={() =>
                  fileRef.current?.click()
                }
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
                        color={
                          PRIMARY_MAROON
                        }
                      />
                    </Box>
                  )}

                  <Text
                    fontSize="13px"
                    fontWeight="600"
                    color="#182338"
                  >
                    Upload Priest Photo
                  </Text>

                  <Text
                    fontSize="12px"
                    color="#60708C"
                  >
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
                    <Icon
                      as={LuUpload}
                      mr={2}
                    />

                    Choose File
                  </Button>
                </VStack>
              </Box>

              <Input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                display="none"
                onChange={
                  handleImageChange
                }
              />

              {errors.image && (
                <Text
                  fontSize="xs"
                  color="red.500"
                  mt={1}
                >
                  {Array.isArray(
                    errors.image
                  )
                    ? errors.image[0]
                    : errors.image}
                </Text>
              )}
            </Box>

            {/* ==================================================
                MIDDLE COLUMN
            ================================================== */}

            <VStack
              align="stretch"
              gap={5}
            >
              <Field
                label="Priest Name"
                name="name"
                required
                error={errors.name}
              >
                <Input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Fr. Joseph Mathew"
                  {...inputStyle}
                />
              </Field>

              <Field
                label="Designation"
                name="designation"
                required
                error={
                  errors.designation
                }
              >
                <select
                  name="designation"
                  value={
                    form.designation
                  }
                  onChange={
                    handleChange
                  }
                  style={
                    selectStyle
                  }
                >
                  <option value="MAIN">
                    Vicar
                  </option>

                  <option value="ASSISTANT">
                    Assistant Vicar
                  </option>
                </select>
              </Field>

              <Field
                label="Serving From"
                name="date_from"
                required
                error={
                  errors.date_from
                }
              >
                <Input
                  type="date"
                  name="date_from"
                  value={
                    form.date_from
                  }
                  onChange={
                    handleChange
                  }
                  {...inputStyle}
                />
              </Field>
            </VStack>

            {/* ==================================================
                RIGHT COLUMN
            ================================================== */}

            <VStack
              align="stretch"
              gap={5}
            >
              <Field
                label="Family Name"
                name="family_name"
                required
                error={
                  errors.family_name
                }
              >
                <Input
                  name="family_name"
                  value={
                    form.family_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Mathew"
                  {...inputStyle}
                />
              </Field>

              <Field
                label="Phone Number"
                name="phone_number"
                required
                error={
                  errors.phone_number
                }
              >
                <Input
                  name="phone_number"
                  value={
                    form.phone_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="+91 98765 43210"
                  {...inputStyle}
                />
              </Field>

              {/* ==================================================
                  SERVING TO
              ================================================== */}

              <Box>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#182338"
                  mb={1.5}
                >
                  Serving To
                </Text>

                <Flex
                  align="center"
                  gap={3}
                  h="44px"
                >
                  {!form.is_active ? (
                    <Input
                      type="date"
                      name="date_to"
                      value={
                        form.date_to
                      }
                      onChange={
                        handleChange
                      }
                      {...inputStyle}
                      flex="1"
                    />
                  ) : null}

                  {/* RED TOGGLE */}

                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    flexShrink={0}
                    onClick={
                      handleStatusToggle
                    }
                  >
                    <Box
                      position="relative"
                      w="48px"
                      h="27px"
                      borderRadius="full"
                      bg={
                        form.is_active
                          ? "#D7193F"
                          : "#C7CFDA"
                      }
                      transition="background .2s"
                    >
                      <Box
                        position="absolute"
                        top="3px"
                        left={
                          form.is_active
                            ? "24px"
                            : "3px"
                        }
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
                      {form.is_active
                        ? "Currently Serving"
                        : "Not Serving"}
                    </Text>
                  </Flex>
                </Flex>

                {!form.is_active &&
                  errors.date_to && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={1}
                    >
                      {Array.isArray(
                        errors.date_to
                      )
                        ? errors.date_to[0]
                        : errors.date_to}
                    </Text>
                  )}
              </Box>
            </VStack>
          </SimpleGrid>

          {/* ==================================================
              ADDRESS SEPARATOR
          ================================================== */}

          <Box
            mt={4}
            pt={4}
            borderTop="1px solid"
            borderColor="#E6EAF0"
          >
            {/* ==================================================
                ADDRESS TITLE
            ================================================== */}

            <Heading
              size="md"
              color="#182338"
              mb={3}
            >
              2. Address
            </Heading>

            {/* ==================================================
                ADDRESS LINE 1 + 2
            ================================================== */}

            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
              }}
              gap={5}
            >
              <Field
                label="Address Line 1"
                name="address_line1"
                required
                error={
                  errors.address_line1
                }
              >
                <Input
                  name="address_line1"
                  value={
                    form.address_line1
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Parish House, 24 Hill Road"
                  {...inputStyle}
                />
              </Field>

              <Field
                label="Address Line 2"
                name="address_line2"
                error={
                  errors.address_line2
                }
              >
                <Input
                  name="address_line2"
                  value={
                    form.address_line2
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Bandra West"
                  {...inputStyle}
                />
              </Field>
            </SimpleGrid>

            {/* ==================================================
                CITY / STATE / COUNTRY / POSTAL
            ================================================== */}

            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
                xl: 4,
              }}
              gap={5}
              mt={4}
            >
              <Field
                label="City"
                name="city"
                required
                error={errors.city}
              >
                <Input
                  name="city"
                  value={form.city}
                  onChange={
                    handleChange
                  }
                  placeholder="Mumbai"
                  {...inputStyle}
                />
              </Field>

              <Field
                label="State"
                name="state"
                required
                error={errors.state}
              >
                <Input
                  name="state"
                  value={form.state}
                  onChange={
                    handleChange
                  }
                  placeholder="Maharashtra"
                  {...inputStyle}
                />
              </Field>

              <Field
                label="Country"
                name="country"
                required
                error={
                  errors.country
                }
              >
                <select
                  name="country"
                  value={
                    form.country
                  }
                  onChange={
                    handleChange
                  }
                  style={
                    selectStyle
                  }
                >
                  <option value="India">
                    India
                  </option>

                  <option value="Oman">
                    Oman
                  </option>

                  <option value="United Arab Emirates">
                    United Arab Emirates
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>
                </select>
              </Field>

              <Field
                label="Postal Code"
                name="postal_code"
                required
                error={
                  errors.postal_code
                }
              >
                <Input
                  name="postal_code"
                  value={
                    form.postal_code
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="400050"
                  {...inputStyle}
                />
              </Field>
            </SimpleGrid>
          </Box>

          {/* ==================================================
              REGISTER BUTTON
          ================================================== */}

          <Flex
            justify="flex-end"
            mt={5}
          >
            <Button
              type="button"
              bg={PRIMARY_MAROON}
              color="white"
              px={6}
              h="42px"
              minW="145px"
              borderRadius="6px"
              loading={loading}
              onClick={
                handleSubmit
              }
              _hover={{
                bg: "#650A18",
              }}
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