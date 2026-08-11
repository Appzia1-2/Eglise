import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Button,
  Input,
  Icon,
  Image,
  Spinner,
  Badge,
} from "@chakra-ui/react";

import {
  LuUpload,
  LuUserRound,
  LuCalendarDays,
  LuBan,
  LuChevronDown,
  LuSave,
  LuTriangleAlert,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getPriestMaster,
  updateVicar,
} from "../api/registryServices";


// ============================================================
// COLORS
// ============================================================

const PRIMARY_MAROON = "var(--primary-maroon)";

const COLORS = {
  text: "#182338",
  secondary: "#60708C",
  muted: "#7A8699",
  border: "#E1E6ED",
  lightBorder: "#E8ECF1",
  red: "#D7193F",
  green: "#16803A",
};


// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (url) => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const cleanBase = apiBase.replace(/\/+$/, "");
  const cleanUrl = url.replace(/^\/+/, "");

  return `${cleanBase}/${cleanUrl}`;
};


// ============================================================
// DATE FORMAT
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


// ============================================================
// DATE INPUT FORMAT
// ============================================================

const formatDateForInput = (date) => {
  if (!date) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};


// ============================================================
// ACTIVE STATUS
// ============================================================

const isActivePriest = (priest) => {
  return (
    priest?.is_active === true ||
    priest?.is_active === 1 ||
    priest?.is_active === "true" ||
    priest?.is_active === "1"
  );
};


// ============================================================
// DESIGNATION
// ============================================================

const getDesignation = (priest) => {
  if (priest?.designation_label) {
    return priest.designation_label;
  }

  if (priest?.designation === "ASSISTANT") {
    return "Assistant Vicar";
  }

  return "Vicar";
};


// ============================================================
// FIELD
// ============================================================

const Field = ({
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <Box width="100%">
      <Text
        fontSize="13px"
        fontWeight="600"
        color={COLORS.text}
        mb="8px"
        lineHeight="18px"
      >
        {label}

        {required && (
          <Text
            as="span"
            color={COLORS.red}
            ml="3px"
          >
            *
          </Text>
        )}
      </Text>

      {children}

      {error && (
        <Text
          fontSize="11px"
          color="#D92D20"
          mt="5px"
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
// EDIT PRIEST PAGE
// ============================================================

const EditPriestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [errors, setErrors] = useState({});

  const [activeTab, setActiveTab] =
    useState("details");

  const [recordInfo, setRecordInfo] = useState({
    created: null,
    updated: null,
    updatedBy: "",
  });

  const [form, setForm] = useState({
    name: "",
    family_name: "",
    designation: "MAIN",
    phone_number: "",

    date_from: "",
    date_to: "",

    is_active: true,

    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",

    image: null,
  });

  const [originalForm, setOriginalForm] =
    useState(null);


  // ==========================================================
  // INPUT STYLE
  // ==========================================================

  const inputStyle = {
    width: "100%",
    height: "40px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "7px",
    padding: "0 12px",
    fontSize: "14px",
    color: COLORS.text,
    background: "#FFFFFF",
    outline: "none",
    boxShadow: "none",
  };


  // ==========================================================
  // HANDLE CHANGE
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
  // STATUS TOGGLE
  // ==========================================================

  const handleStatusToggle = () => {
    setForm((prev) => {
      const newActive = !prev.is_active;

      return {
        ...prev,
        is_active: newActive,
        date_to: newActive
          ? ""
          : prev.date_to,
      };
    });

    setErrors((prev) => ({
      ...prev,
      date_to: "",
      is_active: "",
      detail: "",
    }));
  };


  // ==========================================================
  // IMAGE CHANGE
  // ==========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

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

    if (file.size > 2 * 1024 * 1024) {
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
  // LOAD PRIEST
  // ==========================================================

  useEffect(() => {
    const loadPriest = async () => {
      try {
        setLoading(true);

        const response =
          await getPriestMaster();

        let result = response?.data;

        if (
          result &&
          !Array.isArray(result)
        ) {
          if (
            Array.isArray(result.results)
          ) {
            result = result.results;
          } else if (
            Array.isArray(result.data)
          ) {
            result = result.data;
          } else if (
            Array.isArray(result.priests)
          ) {
            result = result.priests;
          } else if (
            Array.isArray(result.current) ||
            Array.isArray(result.previous)
          ) {
            result = [
              ...(result.current || []),
              ...(result.previous || []),
            ];
          }
        }

        if (!Array.isArray(result)) {
          result = [];
        }

        const priest = result.find(
          (item) =>
            String(item.id) === String(id)
        );

        if (!priest) {
          setErrors({
            detail:
              "Priest record could not be found.",
          });

          setLoading(false);
          return;
        }

        const active =
          isActivePriest(priest);

        const loadedForm = {
          name:
            priest.name || "",

          family_name:
            priest.family_name || "",

          designation:
            priest.designation || "MAIN",

          phone_number:
            priest.phone_number || "",

          date_from:
            formatDateForInput(
              priest.date_from ||
                priest.serving_from
            ),

          date_to:
            formatDateForInput(
              priest.date_to ||
                priest.serving_to
            ),

          is_active: active,

          address_line1:
            priest.address_line1 || "",

          address_line2:
            priest.address_line2 || "",

          city:
            priest.city || "",

          state:
            priest.state || "",

          country:
            priest.country || "India",

          postal_code:
            priest.postal_code || "",

          image: null,
        };

        setForm(loadedForm);

        setOriginalForm({
          ...loadedForm,
        });

        const existingImage =
          priest.image_url ||
          priest.image ||
          priest.photo_url ||
          priest.photo;

        if (existingImage) {
          setImagePreview(
            getImageUrl(existingImage)
          );
        }

        setRecordInfo({
          created:
            priest.created_at ||
            priest.created ||
            priest.date_created ||
            null,

          updated:
            priest.updated_at ||
            priest.updated ||
            priest.last_updated ||
            null,

          updatedBy:
            priest.updated_by_name ||
            priest.updated_by ||
            "",
        });
      } catch (error) {
        console.error(
          "ERROR LOADING PRIEST:",
          error
        );

        setErrors({
          detail:
            "Unable to load priest details.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPriest();
    }
  }, [id]);


  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const getModifiedFields = () => {
    if (!originalForm) {
      return [];
    }

    const fields = [
      "name",
      "family_name",
      "designation",
      "phone_number",
      "date_from",
      "date_to",
      "is_active",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "country",
      "postal_code",
    ];

    return fields.filter(
      (field) =>
        form[field] !==
        originalForm[field]
    );
  };

  const modifiedFields =
    getModifiedFields();

  const hasUnsavedChanges =
    modifiedFields.length > 0 ||
    Boolean(form.image);


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name =
        "Vicar name is required.";
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

    if (
      !form.is_active &&
      !form.date_to
    ) {
      newErrors.date_to =
        "Serving to date is required.";
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
      Object.keys(newErrors).length === 0
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
      setSaving(true);

      const formData = new FormData();

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

      formData.append(
        "date_to",
        form.is_active
          ? ""
          : form.date_to
      );

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

      await updateVicar(
        id,
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
        "ERROR UPDATING PRIEST:",
        error
      );

      const responseData =
        error?.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        setErrors(responseData);
      } else {
        setErrors({
          detail:
            "Unable to update vicar. Please try again.",
        });
      }
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <Box
          minH="calc(100vh - 140px)"
          bg="#FFFFFF"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap={3}>
            <Spinner
              size="lg"
              color={PRIMARY_MAROON}
            />

            <Text
              fontSize="13px"
              color={COLORS.secondary}
            >
              Loading priest details...
            </Text>
          </VStack>
        </Box>

        <Footer />
      </>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <Navbar />

      <Box
        bg="#FFFFFF"
        minH="calc(100vh - 74px)"
      >

        <Container
          maxW="none"
          px={{
            base: 4,
            md: 6,
            xl: "25px",
          }}
          py="15px"
        >

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <HStack
            gap="9px"
            mb="5px"
            fontSize="12px"
            color={COLORS.secondary}
            height="18px"
          >
            <Text>Masters</Text>

            <Text color="#9AA4B2">/</Text>

            <Text>Priest Master</Text>

            <Text color="#9AA4B2">/</Text>

            <Text>
              {form.name || "Priest"}
            </Text>

            <Text color="#9AA4B2">/</Text>

            <Text color="#344054">
              Edit
            </Text>
          </HStack>


          {/* ==================================================
              TITLE
          ================================================== */}

          <Heading
            fontSize="28px"
            lineHeight="34px"
            fontWeight="700"
            color={COLORS.text}
            mb="2px"
          >
            Edit Priest
          </Heading>

          <Text
            fontSize="13px"
            color={COLORS.secondary}
            mb="12px"
          >
            Update priest information,
            address and service details.
          </Text>


          {/* ==================================================
              MAIN DESKTOP GRID
          ================================================== */}

          <Box
            display="grid"
            gridTemplateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(320px, 1fr)",
            }}
            gap="22px"
            alignItems="start"
          >

            {/* =================================================
                LEFT COLUMN
            ================================================= */}

            <VStack
              align="stretch"
              gap="14px"
              minW="0"
            >

              {/* =================================================
                  PRIEST SUMMARY
              ================================================= */}

              <Box
                border="1px solid #E0E5EC"
                borderRadius="8px"
                bg="#FFFFFF"
                minH="108px"
                px="16px"
                py="16px"
                display="flex"
                alignItems="center"
              >
                <HStack gap="20px">

                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      boxSize="76px"
                      borderRadius="full"
                      objectFit="cover"
                      border="1px solid #E5E7EB"
                      flexShrink={0}
                    />
                  ) : (
                    <Box
                      boxSize="76px"
                      borderRadius="full"
                      bg="#FFF1F4"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={LuUserRound}
                        boxSize="30px"
                        color={PRIMARY_MAROON}
                      />
                    </Box>
                  )}

                  <Box>
                    <Heading
                      fontSize="23px"
                      lineHeight="28px"
                      fontWeight="700"
                      color={COLORS.text}
                      mb="8px"
                    >
                      {form.name ||
                        "Unnamed Priest"}
                    </Heading>

                    <HStack
                      gap="11px"
                      flexWrap="wrap"
                    >
                      <Text
                        fontSize="13px"
                        color={COLORS.secondary}
                      >
                        PR-
                        {String(id).padStart(
                          4,
                          "0"
                        )}
                      </Text>

                      <Text
                        color="#98A2B3"
                        fontSize="13px"
                      >
                        •
                      </Text>

                      <Text
                        fontSize="13px"
                        color="#52627A"
                      >
                        {getDesignation({
                          designation:
                            form.designation,
                        })}
                      </Text>

                      <Badge
                        bg={
                          form.is_active
                            ? "#EAF7ED"
                            : "#F2F4F7"
                        }
                        color={
                          form.is_active
                            ? COLORS.green
                            : "#52627A"
                        }
                        borderRadius="5px"
                        px="9px"
                        py="4px"
                        fontSize="11px"
                        fontWeight="600"
                      >
                        {form.is_active
                          ? "Currently Serving"
                          : "Previous"}
                      </Badge>
                    </HStack>
                  </Box>
                </HStack>
              </Box>


              {/* =================================================
                  DETAILS CARD
              ================================================= */}

              <Box
                border="1px solid #E0E5EC"
                borderRadius="8px"
                bg="#FFFFFF"
                overflow="hidden"
              >

                {/* TABS */}

                <Flex
                  height="50px"
                  borderBottom="1px solid #E1E6ED"
                  px="16px"
                >

                  <Button
                    variant="plain"
                    flex="1"
                    height="50px"
                    borderRadius="0"
                    borderBottom={
                      activeTab === "details"
                        ? `3px solid ${PRIMARY_MAROON}`
                        : "3px solid transparent"
                    }
                    color={
                      activeTab === "details"
                        ? PRIMARY_MAROON
                        : "#60708C"
                    }
                    fontSize="13px"
                    fontWeight="600"
                    bg="transparent"
                    _hover={{
                      bg: "transparent",
                    }}
                    onClick={() =>
                      setActiveTab("details")
                    }
                  >
                    Priest Details
                  </Button>


                  <Button
                    variant="plain"
                    flex="1"
                    height="50px"
                    borderRadius="0"
                    borderBottom={
                      activeTab === "history"
                        ? `3px solid ${PRIMARY_MAROON}`
                        : "3px solid transparent"
                    }
                    color={
                      activeTab === "history"
                        ? PRIMARY_MAROON
                        : "#60708C"
                    }
                    fontSize="13px"
                    fontWeight="600"
                    bg="transparent"
                    _hover={{
                      bg: "transparent",
                    }}
                    onClick={() =>
                      setActiveTab("history")
                    }
                  >
                    <HStack gap="9px">
                      <Icon
                        as={LuUserRound}
                        boxSize="17px"
                      />

                      <Text>
                        Service History
                      </Text>
                    </HStack>
                  </Button>

                </Flex>


                {/* =================================================
                    PRIEST DETAILS
                ================================================= */}

                {activeTab === "details" && (
                  <Box
                    px="20px"
                    py="19px"
                  >

                    <Heading
                      fontSize="16px"
                      lineHeight="20px"
                      fontWeight="700"
                      color={COLORS.text}
                      mb="18px"
                    >
                      Basic Information
                    </Heading>


                    {/* BASIC INFORMATION */}

                    <Box
                      display="grid"
                      gridTemplateColumns={{
                        base: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                        xl: "repeat(3, minmax(0, 1fr))",
                      }}
                      gap="18px 24px"
                    >

                      <Field
                        label="Priest Name"
                        required
                        error={errors.name}
                      >
                        <Input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          style={inputStyle}
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow: "none",
                          }}
                        />
                      </Field>


                      <Field
                        label="Family Name"
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
                          style={inputStyle}
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow: "none",
                          }}
                        />
                      </Field>


                      <Field
                        label="Designation"
                        required
                        error={
                          errors.designation
                        }
                      >
                        <Box
                          position="relative"
                        >
                          <select
                            name="designation"
                            value={
                              form.designation
                            }
                            onChange={
                              handleChange
                            }
                            style={{
                              ...inputStyle,
                              appearance:
                                "none",
                              paddingRight:
                                "36px",
                              cursor:
                                "pointer",
                            }}
                          >
                            <option value="MAIN">
                              Vicar
                            </option>

                            <option value="ASSISTANT">
                              Assistant Vicar
                            </option>
                          </select>

                          <Icon
                            as={LuChevronDown}
                            position="absolute"
                            right="12px"
                            top="12px"
                            boxSize="16px"
                            color="#667085"
                            pointerEvents="none"
                          />
                        </Box>
                      </Field>


                      <Field
                        label="Phone Number"
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
                          style={inputStyle}
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow: "none",
                          }}
                        />
                      </Field>


                      <Field
                        label="Serving From"
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
                          style={inputStyle}
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow: "none",
                          }}
                        />
                      </Field>


                      <Field
                        label="Serving To"
                        error={
                          errors.date_to
                        }
                      >
                        <Input
                          type="date"
                          name="date_to"
                          value={
                            form.date_to
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            form.is_active
                          }
                          style={{
                            ...inputStyle,
                            background:
                              form.is_active
                                ? "#F8F9FA"
                                : "#FFFFFF",
                            color:
                              form.is_active
                                ? "#98A2B3"
                                : COLORS.text,
                          }}
                        />
                      </Field>

                    </Box>


                    {/* CURRENTLY SERVING */}

                    <Flex
                      justify="flex-end"
                      align="center"
                      mt="8px"
                      mb="2px"
                    >
                      <HStack gap="10px">

                        <Text
                          fontSize="13px"
                          fontWeight="600"
                          color={COLORS.text}
                        >
                          Currently Serving
                        </Text>

                        <Box
                          width="50px"
                          height="25px"
                          borderRadius="999px"
                          bg={
                            form.is_active
                              ? PRIMARY_MAROON
                              : "#C9D0D9"
                          }
                          position="relative"
                          cursor="pointer"
                          transition="all .2s"
                          onClick={
                            handleStatusToggle
                          }
                        >
                          <Box
                            position="absolute"
                            top="3px"
                            left={
                              form.is_active
                                ? "27px"
                                : "3px"
                            }
                            width="19px"
                            height="19px"
                            borderRadius="full"
                            bg="#FFFFFF"
                            transition="left .2s"
                            boxShadow="0 1px 3px rgba(0,0,0,.25)"
                          />
                        </Box>

                      </HStack>
                    </Flex>


                    {/* ADDRESS */}

                    <Box
                      mt="18px"
                      pt="18px"
                      borderTop="1px solid #E6EAF0"
                    >

                      <Heading
                        fontSize="16px"
                        lineHeight="20px"
                        fontWeight="700"
                        color={COLORS.text}
                        mb="18px"
                      >
                        Address
                      </Heading>


                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          base: "1fr",
                          md: "repeat(2, minmax(0, 1fr))",
                        }}
                        gap="18px 24px"
                      >

                        <Field
                          label="Address Line 1"
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
                            style={inputStyle}
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow: "none",
                            }}
                          />
                        </Field>


                        <Field
                          label="Address Line 2"
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
                            style={inputStyle}
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow: "none",
                            }}
                          />
                        </Field>

                      </Box>


                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          base: "1fr",
                          md: "repeat(2, minmax(0, 1fr))",
                          xl: "repeat(4, minmax(0, 1fr))",
                        }}
                        gap="18px 24px"
                        mt="18px"
                      >

                        <Field
                          label="City"
                          required
                          error={errors.city}
                        >
                          <Input
                            name="city"
                            value={form.city}
                            onChange={
                              handleChange
                            }
                            style={inputStyle}
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow: "none",
                            }}
                          />
                        </Field>


                        <Field
                          label="State"
                          required
                          error={errors.state}
                        >
                          <Input
                            name="state"
                            value={form.state}
                            onChange={
                              handleChange
                            }
                            style={inputStyle}
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow: "none",
                            }}
                          />
                        </Field>


                        <Field
                          label="Country"
                          required
                          error={
                            errors.country
                          }
                        >
                          <Box
                            position="relative"
                          >
                            <select
                              name="country"
                              value={
                                form.country
                              }
                              onChange={
                                handleChange
                              }
                              style={{
                                ...inputStyle,
                                appearance:
                                  "none",
                                paddingRight:
                                  "36px",
                                cursor:
                                  "pointer",
                              }}
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

                            <Icon
                              as={
                                LuChevronDown
                              }
                              position="absolute"
                              right="12px"
                              top="12px"
                              boxSize="16px"
                              color="#667085"
                              pointerEvents="none"
                            />
                          </Box>
                        </Field>


                        <Field
                          label="Postal Code"
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
                            style={inputStyle}
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow: "none",
                            }}
                          />
                        </Field>

                      </Box>

                    </Box>

                  </Box>
                )}


                {/* =================================================
                    SERVICE HISTORY
                ================================================= */}

                {activeTab === "history" && (
                  <Box p="20px">

                    <Heading
                      fontSize="16px"
                      color={COLORS.text}
                      mb="18px"
                    >
                      Service History
                    </Heading>

                    <Box
                      border="1px solid #E0E5EC"
                      borderRadius="8px"
                      p="18px"
                    >
                      <HStack
                        align="start"
                        gap="15px"
                      >

                        <Box
                          boxSize="42px"
                          borderRadius="full"
                          bg="#FFF1F4"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon
                            as={LuCalendarDays}
                            color={
                              PRIMARY_MAROON
                            }
                            boxSize="20px"
                          />
                        </Box>

                        <Box>

                          <Text
                            fontSize="14px"
                            fontWeight="600"
                            color={COLORS.text}
                          >
                            {getDesignation({
                              designation:
                                form.designation,
                            })}
                          </Text>

                          <Text
                            fontSize="13px"
                            color={
                              COLORS.secondary
                            }
                            mt="4px"
                          >
                            {formatDate(
                              form.date_from
                            )}{" "}
                            -{" "}
                            {form.is_active
                              ? "Present"
                              : formatDate(
                                  form.date_to
                                )}
                          </Text>

                          <Badge
                            mt="10px"
                            bg={
                              form.is_active
                                ? "#EAF7ED"
                                : "#F2F4F7"
                            }
                            color={
                              form.is_active
                                ? COLORS.green
                                : "#52627A"
                            }
                            fontSize="11px"
                            px="8px"
                            py="3px"
                            borderRadius="5px"
                          >
                            {form.is_active
                              ? "Currently Serving"
                              : "Previous"}
                          </Badge>

                        </Box>

                      </HStack>
                    </Box>

                  </Box>
                )}

              </Box>

            </VStack>


            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <VStack
              align="stretch"
              gap="10px"
              width="100%"
              minW="0"
            >

              {/* =================================================
                  PRIEST PHOTO
              ================================================= */}

              <Box
                border="1px solid #E0E5EC"
                borderRadius="8px"
                bg="#FFFFFF"
                p="18px"
                minH="220px"
              >

                <Heading
                  fontSize="16px"
                  lineHeight="20px"
                  fontWeight="700"
                  color={COLORS.text}
                  mb="10px"
                >
                  Priest Photo
                </Heading>

                <VStack gap="9px">

                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      boxSize="115px"
                      borderRadius="full"
                      objectFit="cover"
                      border="1px solid #E4E7EC"
                    />
                  ) : (
                    <Box
                      boxSize="115px"
                      borderRadius="full"
                      bg="#FFF1F4"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={LuUserRound}
                        boxSize="40px"
                        color={
                          PRIMARY_MAROON
                        }
                      />
                    </Box>
                  )}

                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    display="none"
                    onChange={
                      handleImageChange
                    }
                  />

                  <Button
                    variant="outline"
                    width="175px"
                    height="31px"
                    borderColor={
                      PRIMARY_MAROON
                    }
                    borderWidth="1px"
                    color={
                      PRIMARY_MAROON
                    }
                    borderRadius="6px"
                    fontSize="12px"
                    fontWeight="600"
                    bg="#FFFFFF"
                    _hover={{
                      bg: "#FFF5F7",
                    }}
                    onClick={() =>
                      fileRef.current?.click()
                    }
                  >
                    <Icon
                      as={LuUpload}
                      mr="8px"
                      boxSize="15px"
                    />

                    Replace Photo
                  </Button>

                  <Text
                    fontSize="11px"
                    color={COLORS.muted}
                  >
                    JPG, PNG up to 2MB
                  </Text>

                  {errors.image && (
                    <Text
                      fontSize="11px"
                      color="#D92D20"
                      textAlign="center"
                    >
                      {Array.isArray(
                        errors.image
                      )
                        ? errors.image[0]
                        : errors.image}
                    </Text>
                  )}

                </VStack>

              </Box>


              {/* =================================================
                  RECORD INFORMATION
              ================================================= */}

              <Box
                border="1px solid #E0E5EC"
                borderRadius="8px"
                bg="#FFFFFF"
                p="18px"
                minH="140px"
              >

                <Heading
                  fontSize="16px"
                  lineHeight="20px"
                  fontWeight="700"
                  color={COLORS.text}
                  mb="17px"
                >
                  Record Information
                </Heading>

                <VStack
                  align="stretch"
                  gap="15px"
                >

                  <HStack
                    align="start"
                    gap="14px"
                  >
                    <Icon
                      as={LuCalendarDays}
                      boxSize="21px"
                      color={COLORS.secondary}
                      mt="1px"
                    />

                    <Box>
                      <Text
                        fontSize="12px"
                        color={COLORS.secondary}
                        mb="2px"
                      >
                        Created
                      </Text>

                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color={COLORS.text}
                      >
                        {recordInfo.created
                          ? formatDate(
                              recordInfo.created
                            )
                          : "-"}
                      </Text>
                    </Box>
                  </HStack>


                  <HStack
                    align="start"
                    gap="14px"
                  >
                    <Icon
                      as={LuUserRound}
                      boxSize="21px"
                      color={COLORS.secondary}
                      mt="1px"
                    />

                    <Box>
                      <Text
                        fontSize="12px"
                        color={COLORS.secondary}
                        mb="2px"
                      >
                        Last updated
                      </Text>

                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color={COLORS.text}
                      >
                        {recordInfo.updated
                          ? formatDate(
                              recordInfo.updated
                            )
                          : "-"}
                      </Text>

                      {recordInfo.updatedBy && (
                        <Text
                          fontSize="11px"
                          color={
                            COLORS.secondary
                          }
                          mt="1px"
                        >
                          by{" "}
                          {
                            recordInfo.updatedBy
                          }
                        </Text>
                      )}
                    </Box>
                  </HStack>

                </VStack>

              </Box>


              {/* =================================================
                  UNSAVED CHANGES
              ================================================= */}

              {hasUnsavedChanges && (
                <Box
                  border="1px solid #F0E1C2"
                  borderRadius="8px"
                  bg="#FFFBF2"
                  p="16px"
                  minH="96px"
                >

                  <HStack
                    align="start"
                    gap="13px"
                  >

                    <Icon
                      as={LuTriangleAlert}
                      boxSize="21px"
                      color="#F79009"
                      flexShrink={0}
                      mt="1px"
                    />

                    <Box>

                      <Text
                        fontSize="14px"
                        fontWeight="600"
                        color="#D97706"
                        lineHeight="18px"
                      >
                        Unsaved Changes
                      </Text>

                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color="#F79009"
                        mt="7px"
                      >
                        {Math.max(
                          modifiedFields.length,
                          form.image ? 1 : 0
                        )}{" "}
                        {Math.max(
                          modifiedFields.length,
                          form.image ? 1 : 0
                        ) === 1
                          ? "field"
                          : "fields"}{" "}
                        modified
                      </Text>

                      <Text
                        fontSize="11px"
                        color={COLORS.muted}
                        mt="2px"
                      >
                        Please review your
                        changes before saving.
                      </Text>

                    </Box>

                  </HStack>

                </Box>
              )}


              {/* =================================================
                  DANGER ZONE
              ================================================= */}

              <Box
                border="1px solid #E0E5EC"
                borderRadius="8px"
                bg="#FFFFFF"
                p="17px"
                minH="112px"
              >

                <Text
                  fontSize="15px"
                  lineHeight="20px"
                  fontWeight="600"
                  color="#991B1B"
                  mb="15px"
                >
                  Danger Zone
                </Text>

                <HStack
                  align="start"
                  gap="14px"
                >

                  <Icon
                    as={LuBan}
                    boxSize="21px"
                    color="#D7193F"
                    mt="1px"
                  />

                  <Box>

                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="#D7193F"
                    >
                      Archive Priest Record
                    </Text>

                    <Text
                      fontSize="11px"
                      color={COLORS.muted}
                      mt="4px"
                      lineHeight="16px"
                    >
                      This priest will remain
                      in service history.
                    </Text>

                  </Box>

                </HStack>

              </Box>

            </VStack>

          </Box>

        </Container>


        {/* =====================================================
            BOTTOM ACTION BAR
        ===================================================== */}

        <Box
          borderTop="1px solid #E0E5EC"
          bg="#FFFFFF"
          position="sticky"
          bottom="0"
          zIndex="20"
          mt="0"
        >

          <Container
            maxW="none"
            px={{
              base: 4,
              md: 6,
              xl: "25px",
            }}
            py="10px"
          >

            <Flex
              justify="flex-end"
              align="center"
              gap="16px"
            >

              <Button
                variant="outline"
                height="41px"
                minW="148px"
                borderColor={
                  PRIMARY_MAROON
                }
                color={PRIMARY_MAROON}
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                bg="#FFFFFF"
                _hover={{
                  bg: "#FFF5F7",
                }}
                onClick={() =>
                  navigate(
                    "/priest-master"
                  )
                }
                disabled={saving}
              >
                Cancel
              </Button>


              <Button
                height="41px"
                minW="183px"
                bg={PRIMARY_MAROON}
                color="#FFFFFF"
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                _hover={{
                  bg: "#650A18",
                }}
                loading={saving}
                onClick={handleSubmit}
              >
                <Icon
                  as={LuSave}
                  mr="8px"
                  boxSize="16px"
                />

                Save Changes
              </Button>

            </Flex>

          </Container>

        </Box>

      </Box>

      <Footer />
    </>
  );
};

export default EditPriestPage;