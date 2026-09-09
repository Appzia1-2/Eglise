// src/admin/pages/ChurchEdit.jsx

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
  Textarea,
} from "@chakra-ui/react";

import {
  LuUpload,
  LuCalendarDays,
  LuBan,
  LuChevronDown,
  LuSave,
  LuTriangleAlert,
  LuPhone,
  LuChurch,
  LuArrowLeft,
  LuUserRound,
} from "react-icons/lu";

import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";
import PhoneInput from "../../components/PhoneInput";

import {
  Country,
  State,
} from "country-state-city";

// ============================================================
// COLORS
// ============================================================

const PRIMARY_MAROON = "#ae2050";

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

  if (
    cleanUrl.startsWith("media/") ||
    cleanUrl.startsWith("uploads/")
  ) {
    return `${cleanBase}/${cleanUrl}`;
  }

  return `${cleanBase}/media/${cleanUrl}`;
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
// FIELD COMPONENT
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
// EDIT CHURCH PAGE
// ============================================================

const ChurchEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [churchId, setChurchId] = useState(null);

  const [errors, setErrors] = useState({});

  const [activeTab, setActiveTab] = useState("details");

  const [dioceses, setDioceses] = useState([]);

  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);

  const [recordInfo, setRecordInfo] = useState({
    created: null,
    updated: null,
    updatedBy: "",
  });

  const [form, setForm] = useState({
    id: null,
    name: "",
    code: "",
    diocese: "",
    diocese_id: null,
    established_year: "",
    registration_number: "",
    currency: "",

    address: "",
    address_line1: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",

    email: "",
    phone_number: "",
    alternate_phone: "",
    website: "",

    is_active: true,

    logo: null,
  });

  const [originalForm, setOriginalForm] = useState(null);

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

  const textareaStyle = {
    width: "100%",
    minHeight: "60px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "7px",
    padding: "10px 12px",
    fontSize: "14px",
    color: COLORS.text,
    background: "#FFFFFF",
    outline: "none",
    boxShadow: "none",
    resize: "vertical",
  };

  // ==========================================================
  // FETCH COUNTRIES
  // ==========================================================

  useEffect(() => {
    try {
      const countries = Country.getAllCountries()
        .map((country) => ({
          value: country.isoCode,
          label: country.name,
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        );

      setCountryOptions(countries);
    } catch (error) {
      console.error(
        "Error loading countries:",
        error
      );
    }
  }, []);

  // ==========================================================
  // FETCH DIOCESES
  // ==========================================================

  useEffect(() => {
    const fetchDioceses = async () => {
      try {
        const response =
          await adminApi.getDioceses();

        setDioceses(response.data || []);
      } catch (error) {
        console.error(
          "Error fetching dioceses:",
          error
        );
      }
    };

    fetchDioceses();
  }, []);

  // ==========================================================
  // LOAD STATES BASED ON COUNTRY
  // ==========================================================

  useEffect(() => {
    if (!form.country) {
      setStateOptions([]);
      return;
    }

    const allCountries =
      Country.getAllCountries();

    const selectedCountry =
      allCountries.find(
        (country) =>
          country.name === form.country ||
          country.isoCode === form.country
      );

    if (!selectedCountry) {
      setStateOptions([]);
      return;
    }

    setIsLoadingStates(true);

    try {
      const states =
        State.getStatesOfCountry(
          selectedCountry.isoCode
        )
          .map((state) => ({
            value:
              state.isoCode ||
              state.name,
            label: state.name,
          }))
          .sort((a, b) =>
            a.label.localeCompare(b.label)
          );

      setStateOptions(states);
    } catch (error) {
      console.error(
        "Error loading states:",
        error
      );

      setStateOptions([]);
    } finally {
      setIsLoadingStates(false);
    }
  }, [form.country]);

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,

      ...(name === "country"
        ? {
            state: "",
          }
        : {}),
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",

      ...(name === "country"
        ? {
            state: "",
          }
        : {}),

      detail: "",
    }));
  };

  // ==========================================================
  // PHONE CHANGE
  // ==========================================================

  const handlePhoneChange = (value) => {
    setForm((prev) => ({
      ...prev,
      phone_number: value,
    }));

    setErrors((prev) => ({
      ...prev,
      phone_number: "",
    }));
  };

  // ==========================================================
  // STATUS TOGGLE
  // ==========================================================

  const handleStatusToggle = () => {
    setForm((prev) => ({
      ...prev,
      is_active: !prev.is_active,
    }));

    setErrors((prev) => ({
      ...prev,
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
      logo: file,
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
  // LOAD CHURCH
  // ==========================================================

  useEffect(() => {
    const loadChurch = async () => {
      try {
        setLoading(true);

        const response =
          await adminApi.getChurchDetail(id);

        let church =
          response?.data?.data ||
          response?.data ||
          response;

        if (
          Array.isArray(church) &&
          church.length > 0
        ) {
          church = church[0];
        }

        console.log(
          "Church data:",
          church
        );

        if (!church || !church.id) {
          toaster.create({
            title: "Error",
            description:
              "Church record could not be found.",
            type: "error",
            duration: 5000,
          });

          navigate("/admin/churches");
          return;
        }

        setChurchId(church.id);

        const loadedForm = {
          id: church.id,

          name: church.name || "",

          code: church.code || "",

          diocese:
            church.diocese?.id ||
            church.diocese_id ||
            "",

          diocese_id:
            church.diocese?.id ||
            church.diocese_id ||
            null,

          established_year:
            church.established_year ||
            "",

          registration_number:
            church.registration_number ||
            "",

          currency:
            church.currency || "",

          address:
            church.address || "",

          address_line1:
            church.address_line1 || "",

          city:
            church.city || "",

          state:
            church.state || "",

          country:
            church.country || "India",

          postal_code:
            church.postal_code || "",

          email:
            church.email || "",

          phone_number:
            church.phone_number || "",

          alternate_phone:
            church.alternate_phone || "",

          website:
            church.website || "",

          is_active:
            church.is_active !== undefined
              ? church.is_active
              : true,

          logo: null,
        };

        setForm(loadedForm);
        setOriginalForm({
          ...loadedForm,
        });

        // ======================================================
        // LOGO
        // ======================================================

        let imageUrl = null;

        if (
          church.logo_url &&
          typeof church.logo_url ===
            "string" &&
          church.logo_url.trim()
        ) {
          imageUrl =
            church.logo_url;
        } else if (
          church.logo &&
          typeof church.logo ===
            "string" &&
          church.logo.trim()
        ) {
          imageUrl = church.logo;
        }

        if (imageUrl) {
          if (
            imageUrl.startsWith(
              "http://"
            ) ||
            imageUrl.startsWith(
              "https://"
            )
          ) {
            setImagePreview(
              imageUrl
            );
          } else {
            setImagePreview(
              getImageUrl(imageUrl)
            );
          }
        } else {
          setImagePreview(null);
        }

        // ======================================================
        // RECORD INFORMATION
        // ======================================================

        setRecordInfo({
          created:
            church.created_at ||
            church.created ||
            null,

          updated:
            church.updated_at ||
            church.updated ||
            null,

          updatedBy:
            church.updated_by_name ||
            church.updated_by ||
            "",
        });
      } catch (error) {
        console.error(
          "ERROR LOADING CHURCH:",
          error
        );

        toaster.create({
          title: "Error",
          description:
            "Unable to load church details.",
          type: "error",
          duration: 5000,
        });

        navigate("/admin/churches");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadChurch();
    }
  }, [id, navigate]);

  // ==========================================================
  // UNSAVED CHANGES
  // ==========================================================

  const getModifiedFields = () => {
    if (!originalForm) {
      return [];
    }

    const fields = [
      "name",
      "diocese",
      "established_year",
      "registration_number",
      "currency",
      "address",
      "address_line1",
      "city",
      "state",
      "country",
      "postal_code",
      "email",
      "phone_number",
      "alternate_phone",
      "website",
      "is_active",
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
    Boolean(form.logo);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name =
        "Church name is required.";
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

    if (!form.email.trim()) {
      newErrors.email =
        "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }

    if (
      form.website &&
      !/^https?:\/\/\S+/.test(
        form.website
      )
    ) {
      newErrors.website =
        "Please enter a valid URL (include http:// or https://)";
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
      setSaving(true);

      const churchIdToUpdate =
        churchId || id;

      const formData =
        new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "address",
        form.address
          ? form.address.trim()
          : ""
      );

      formData.append(
        "address_line1",
        form.address_line1
          ? form.address_line1.trim()
          : ""
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
        form.postal_code
          ? form.postal_code.trim()
          : ""
      );

      formData.append(
        "email",
        form.email.trim()
      );

      formData.append(
        "phone_number",
        form.phone_number || ""
      );

      formData.append(
        "alternate_phone",
        form.alternate_phone || ""
      );

      formData.append(
        "website",
        form.website
          ? form.website.trim()
          : ""
      );

      formData.append(
        "established_year",
        form.established_year
          ? String(
              parseInt(
                form.established_year,
                10
              )
            )
          : ""
      );

      formData.append(
        "registration_number",
        form.registration_number
          ? form.registration_number.trim()
          : ""
      );

      formData.append(
        "currency",
        form.currency || ""
      );

      formData.append(
        "is_active",
        form.is_active
          ? "true"
          : "false"
      );

      if (form.diocese) {
        formData.append(
          "diocese",
          String(
            parseInt(
              form.diocese,
              10
            )
          )
        );
      }

      if (
        form.logo &&
        form.logo instanceof File
      ) {
        formData.append(
          "logo",
          form.logo
        );
      }

      console.log(
        "Sending FormData:"
      );

      for (
        const [key, value] of
        formData.entries()
      ) {
        console.log(
          key,
          value
        );
      }

      await adminApi.updateChurch(
        churchIdToUpdate,
        formData
      );

      toaster.create({
        title: "Success",
        description:
          "Church updated successfully.",
        type: "success",
        duration: 3000,
      });

      navigate("/admin/churches");
    } catch (error) {
      console.error(
        "ERROR UPDATING CHURCH:",
        error
      );

      console.error(
        "Error response data:",
        error.response?.data
      );

      let errorMsg =
        "Unable to update church. Please try again.";

      if (error.response?.data) {
        if (
          typeof error.response.data ===
          "object"
        ) {
          const errorsList = [];

          Object.entries(
            error.response.data
          ).forEach(
            ([field, value]) => {
              if (
                field !== "status" &&
                field !== "message" &&
                field !== "error" &&
                field !== "detail"
              ) {
                errorsList.push(
                  `${field}: ${
                    Array.isArray(value)
                      ? value.join(", ")
                      : value
                  }`
                );
              }
            }
          );

          if (
            errorsList.length > 0
          ) {
            errorMsg =
              errorsList.join("; ");
          } else if (
            error.response.data
              .message
          ) {
            errorMsg =
              error.response.data
                .message;
          } else if (
            error.response.data
              .detail
          ) {
            errorMsg =
              error.response.data
                .detail;
          }
        } else if (
          typeof error.response.data ===
          "string"
        ) {
          errorMsg =
            error.response.data;
        }
      }

      toaster.create({
        title: "Error",
        description: errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // ARCHIVE
  // ==========================================================

  const handleArchive = async () => {
    const confirmed =
      window.confirm(
        `Archive "${form.name}" church record?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const churchIdToDelete =
        churchId || id;

      await adminApi.deleteChurch(
        churchIdToDelete
      );

      toaster.create({
        title: "Success",
        description:
          "Church archived successfully.",
        type: "success",
        duration: 3000,
      });

      navigate("/admin/churches");
    } catch (error) {
      console.error(
        "ERROR ARCHIVING CHURCH:",
        error
      );

      toaster.create({
        title: "Error",
        description:
          "Unable to archive church record. Please try again.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <AdminLayout>
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
              Loading church details...
            </Text>
          </VStack>
        </Box>
      </AdminLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AdminLayout>
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
            <Button
              variant="plain"
              size="xs"
              p="0"
              minW="auto"
              color={COLORS.secondary}
              _hover={{
                color: PRIMARY_MAROON,
              }}
              onClick={() =>
                navigate(
                  "/admin/churches"
                )
              }
            >
              <Icon
                as={LuArrowLeft}
                boxSize="14px"
                mr="4px"
              />
              Back
            </Button>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text>
              Churches
            </Text>

            <Text color="#9AA4B2">
              /
            </Text>

            <Text>
              {form.name ||
                "Church"}
            </Text>

            <Text color="#9AA4B2">
              /
            </Text>

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
            Edit Church
          </Heading>

          <Text
            fontSize="13px"
            color={COLORS.secondary}
            mb="12px"
          >
            Update church information,
            address and contact details.
          </Text>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <Box
            display="grid"
            gridTemplateColumns={{
              base: "1fr",
              lg:
                "minmax(0, 3fr) minmax(320px, 1fr)",
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
                  CHURCH SUMMARY
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
                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='76'%3E%3Crect width='76' height='76' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
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
                        as={LuChurch}
                        boxSize="30px"
                        color={
                          PRIMARY_MAROON
                        }
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
                        "Unnamed Church"}
                    </Heading>

                    <HStack
                      gap="11px"
                      flexWrap="wrap"
                    >
                      <Text
                        fontSize="13px"
                        color={
                          COLORS.secondary
                        }
                      >
                        {form.code ||
                          "CH-001"}
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
                        {form.city ||
                          "City not set"}
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
                          ? "Active"
                          : "Inactive"}
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
                      activeTab ===
                      "details"
                        ? `3px solid ${PRIMARY_MAROON}`
                        : "3px solid transparent"
                    }
                    color={
                      activeTab ===
                      "details"
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
                      setActiveTab(
                        "details"
                      )
                    }
                  >
                    Church Details
                  </Button>

                  <Button
                    variant="plain"
                    flex="1"
                    height="50px"
                    borderRadius="0"
                    borderBottom={
                      activeTab ===
                      "contact"
                        ? `3px solid ${PRIMARY_MAROON}`
                        : "3px solid transparent"
                    }
                    color={
                      activeTab ===
                      "contact"
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
                      setActiveTab(
                        "contact"
                      )
                    }
                  >
                    <HStack gap="9px">
                      <Icon
                        as={LuPhone}
                        boxSize="17px"
                      />

                      <Text>
                        Contact & Location
                      </Text>
                    </HStack>
                  </Button>
                </Flex>

                {/* =================================================
                    CHURCH DETAILS
                ================================================= */}

                {activeTab ===
                  "details" && (
                  <Box
                    px="20px"
                    py="19px"
                  >
                    <Heading
                      fontSize="16px"
                      lineHeight="20px"
                      fontWeight="700"
                      color={
                        COLORS.text
                      }
                      mb="18px"
                    >
                      Basic Information
                    </Heading>

                    {/* BASIC INFORMATION */}

                    <Box
                      display="grid"
                      gridTemplateColumns={{
                        base: "1fr",
                        md:
                          "repeat(2, minmax(0, 1fr))",
                        xl:
                          "repeat(3, minmax(0, 1fr))",
                      }}
                      gap="18px 24px"
                    >
                      <Field
                        label="Church Name"
                        required
                        error={
                          errors.name
                        }
                      >
                        <Input
                          name="name"
                          value={
                            form.name
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      <Field
                        label="Church Code"
                        error={
                          errors.code
                        }
                      >
                        <Input
                          name="code"
                          value={
                            form.code
                          }
                          style={
                            inputStyle
                          }
                          readOnly
                          bg="#F8F9FA"
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      <Field
                        label="Diocese"
                        error={
                          errors.diocese
                        }
                      >
                        <Box
                          position="relative"
                          width="100%"
                        >
                          <select
                            name="diocese"
                            value={
                              form.diocese
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
                            <option value="">
                              Select Diocese
                            </option>

                            {dioceses.map(
                              (
                                diocese
                              ) => (
                                <option
                                  key={
                                    diocese.id
                                  }
                                  value={
                                    diocese.id
                                  }
                                >
                                  {
                                    diocese.name
                                  }
                                </option>
                              )
                            )}
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
                        label="Established Year"
                        error={
                          errors.established_year
                        }
                      >
                        <Input
                          type="number"
                          name="established_year"
                          value={
                            form.established_year
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          placeholder="e.g., 1950"
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      <Field
                        label="Registration Number"
                        error={
                          errors.registration_number
                        }
                      >
                        <Input
                          name="registration_number"
                          value={
                            form.registration_number
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      <Field
                        label="Currency"
                        error={
                          errors.currency
                        }
                      >
                        <Box
                          position="relative"
                          width="100%"
                        >
                          <select
                            name="currency"
                            value={
                              form.currency
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
                            <option value="">
                              Select Currency
                            </option>

                            <option value="INR">
                              INR - Indian Rupee
                            </option>

                            <option value="USD">
                              USD - US Dollar
                            </option>

                            <option value="EUR">
                              EUR - Euro
                            </option>

                            <option value="GBP">
                              GBP - British Pound
                            </option>

                            <option value="AED">
                              AED - UAE Dirham
                            </option>

                            <option value="OMR">
                              OMR - Omani Rial
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
                    </Box>

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
                        color={
                          COLORS.text
                        }
                        mb="18px"
                      >
                        Address
                      </Heading>

                      {/* ADDRESS LINE 1 */}

                      <Field
                        label="Address Line 1"
                        error={
                          errors.address
                        }
                      >
                        <Textarea
                          name="address"
                          value={
                            form.address
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            textareaStyle
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      {/* ADDRESS LINE 2 + CITY */}

                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          base: "1fr",
                          md:
                            "repeat(2, minmax(0, 1fr))",
                        }}
                        gap="18px 24px"
                        mt="18px"
                      >
                        <Field
                          label="Address Line 2"
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
                            style={
                              inputStyle
                            }
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow:
                                "none",
                            }}
                          />
                        </Field>

                        <Field
                          label="City"
                          required
                          error={
                            errors.city
                          }
                        >
                          <Input
                            name="city"
                            value={
                              form.city
                            }
                            onChange={
                              handleChange
                            }
                            style={
                              inputStyle
                            }
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow:
                                "none",
                            }}
                          />
                        </Field>
                      </Box>

                      {/* STATE + COUNTRY + POSTAL */}

                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          base: "1fr",
                          md:
                            "repeat(2, minmax(0, 1fr))",
                          xl:
                            "repeat(3, minmax(0, 1fr))",
                        }}
                        gap="18px 24px"
                        mt="18px"
                      >
                        {/* STATE */}

                        <Field
                          label="State"
                          required
                          error={
                            errors.state
                          }
                        >
                          <Box
                            position="relative"
                            width="100%"
                          >
                            <select
                              name="state"
                              value={
                                form.state
                              }
                              onChange={
                                handleChange
                              }
                              disabled={
                                isLoadingStates ||
                                !form.country
                              }
                              style={{
                                ...inputStyle,
                                appearance:
                                  "none",
                                paddingRight:
                                  "36px",
                                cursor:
                                  isLoadingStates ||
                                  !form.country
                                    ? "not-allowed"
                                    : "pointer",
                                background:
                                  isLoadingStates ||
                                  !form.country
                                    ? "#F8F9FA"
                                    : "#FFFFFF",
                              }}
                            >
                              <option value="">
                                {isLoadingStates
                                  ? "Loading states..."
                                  : !form.country
                                  ? "Select Country First"
                                  : "Select State"}
                              </option>

                              {stateOptions.map(
                                (
                                  state
                                ) => (
                                  <option
                                    key={
                                      state.value
                                    }
                                    value={
                                      state.value
                                    }
                                  >
                                    {
                                      state.label
                                    }
                                  </option>
                                )
                              )}
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

                        {/* COUNTRY */}

                        <Field
                          label="Country"
                          required
                          error={
                            errors.country
                          }
                        >
                          <Box
                            position="relative"
                            width="100%"
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
                              <option value="">
                                Select Country
                              </option>

                              {countryOptions.map(
                                (
                                  country
                                ) => (
                                  <option
                                    key={
                                      country.value
                                    }
                                    value={
                                      country.value
                                    }
                                  >
                                    {
                                      country.label
                                    }
                                  </option>
                                )
                              )}
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

                        {/* POSTAL CODE */}

                        <Field
                          label="Postal Code"
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
                            style={
                              inputStyle
                            }
                            _focus={{
                              borderColor:
                                PRIMARY_MAROON,
                              boxShadow:
                                "none",
                            }}
                          />
                        </Field>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* =================================================
                    CONTACT
                ================================================= */}

                {activeTab ===
                  "contact" && (
                  <Box
                    px="20px"
                    py="19px"
                  >
                    <Heading
                      fontSize="16px"
                      lineHeight="20px"
                      fontWeight="700"
                      color={
                        COLORS.text
                      }
                      mb="18px"
                    >
                      Contact Information
                    </Heading>

                    <Box
                      display="grid"
                      gridTemplateColumns={{
                        base: "1fr",
                        md:
                          "repeat(2, minmax(0, 1fr))",
                      }}
                      gap="18px 24px"
                    >
                      {/* EMAIL */}

                      <Field
                        label="Email"
                        required
                        error={
                          errors.email
                        }
                      >
                        <Input
                          type="email"
                          name="email"
                          value={
                            form.email
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      {/* PHONE */}

                      <Field
                        label="Phone Number"
                        error={
                          errors.phone_number
                        }
                      >
                        <PhoneInput
                          value={
                            form.phone_number
                          }
                          onChange={
                            handlePhoneChange
                          }
                        />
                      </Field>

                      {/* ALTERNATE PHONE */}

                      <Field
                        label="Alternate Phone"
                        error={
                          errors.alternate_phone
                        }
                      >
                        <Input
                          name="alternate_phone"
                          value={
                            form.alternate_phone
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>

                      {/* WEBSITE */}

                      <Field
                        label="Website"
                        error={
                          errors.website
                        }
                      >
                        <Input
                          name="website"
                          value={
                            form.website
                          }
                          onChange={
                            handleChange
                          }
                          style={
                            inputStyle
                          }
                          placeholder="https://example.com"
                          _focus={{
                            borderColor:
                              PRIMARY_MAROON,
                            boxShadow:
                              "none",
                          }}
                        />
                      </Field>
                    </Box>

                    {/* STATUS */}

                    <Box
                      mt="24px"
                      pt="18px"
                      borderTop="1px solid #E6EAF0"
                    >
                      <Flex
                        justify="flex-end"
                        align="center"
                      >
                        <HStack gap="10px">
                          <Text
                            fontSize="13px"
                            fontWeight="600"
                            color={
                              COLORS.text
                            }
                          >
                            Church Status
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
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </HStack>
                      </Flex>
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
                  CHURCH LOGO
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
                  Church Logo
                </Heading>

                <VStack gap="9px">
                  {imagePreview ? (
                    <Image
                      src={
                        imagePreview
                      }
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
                        as={LuChurch}
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

                    Replace Logo
                  </Button>

                  <Text
                    fontSize="11px"
                    color={
                      COLORS.muted
                    }
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
                  color={
                    COLORS.text
                  }
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
                      as={
                        LuCalendarDays
                      }
                      boxSize="21px"
                      color={
                        COLORS.secondary
                      }
                      mt="1px"
                    />

                    <Box>
                      <Text
                        fontSize="12px"
                        color={
                          COLORS.secondary
                        }
                        mb="2px"
                      >
                        Created
                      </Text>

                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color={
                          COLORS.text
                        }
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
                      as={
                        LuUserRound
                      }
                      boxSize="21px"
                      color={
                        COLORS.secondary
                      }
                      mt="1px"
                    />

                    <Box>
                      <Text
                        fontSize="12px"
                        color={
                          COLORS.secondary
                        }
                        mb="2px"
                      >
                        Last updated
                      </Text>

                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color={
                          COLORS.text
                        }
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
                      as={
                        LuTriangleAlert
                      }
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
                          form.logo
                            ? 1
                            : 0
                        )}{" "}
                        {Math.max(
                          modifiedFields.length,
                          form.logo
                            ? 1
                            : 0
                        ) === 1
                          ? "field"
                          : "fields"}{" "}
                        modified
                      </Text>

                      <Text
                        fontSize="11px"
                        color={
                          COLORS.muted
                        }
                        mt="2px"
                      >
                        Please review your
                        changes before
                        saving.
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

                <Button
                  variant="outline"
                  height="38px"
                  width="100%"
                  borderColor="#D7193F"
                  color="#D7193F"
                  bg="#FFFFFF"
                  borderWidth="1px"
                  borderRadius="7px"
                  fontSize="13px"
                  fontWeight="600"
                  _hover={{
                    bg: "#FEF2F2",
                  }}
                  onClick={
                    handleArchive
                  }
                  disabled={saving}
                  loading={saving}
                >
                  <Icon
                    as={LuBan}
                    mr="8px"
                    boxSize="16px"
                  />

                  Archive Church Record
                </Button>

                <Text
                  fontSize="11px"
                  color={
                    COLORS.muted
                  }
                  mt="8px"
                >
                  This church will be
                  permanently archived.
                </Text>
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
                color={
                  PRIMARY_MAROON
                }
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                bg="#FFFFFF"
                _hover={{
                  bg: "#FFF5F7",
                }}
                onClick={() =>
                  navigate(
                    "/admin/churches"
                  )
                }
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                height="41px"
                minW="183px"
                bg={
                  PRIMARY_MAROON
                }
                color="#FFFFFF"
                borderRadius="7px"
                fontSize="13px"
                fontWeight="600"
                _hover={{
                  bg: "#650A18",
                }}
                loading={saving}
                onClick={
                  handleSubmit
                }
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
    </AdminLayout>
  );
};

export default ChurchEdit;