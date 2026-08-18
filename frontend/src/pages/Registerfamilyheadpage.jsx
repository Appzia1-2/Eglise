import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Field,
  Input,
  NativeSelect,
  Avatar,
} from "@chakra-ui/react";

import {
  LuHouse,
  LuUpload,
  LuInfo,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createHead,
  listFamilies,
  listWards,
  listGrades,
} from "../api/registryServices";

// ============================================================
// CONSTANTS
// ============================================================

const PRIMARY = "var(--primary-maroon)";

// ============================================================
// STEP 1 INITIAL VALUES
// ============================================================

const step1InitialValues = {
  family: "",
  ward: "",
  grade: "",
  house_name: "",
  name: "",
  baptismal_name: "",
  gender: "",
  email: "",
  dob: "",
  mobile_no: "",
  phone_no: "",
  blood_group: "",
  marital_status: "",
  spouse_name: "",
  father_name: "",
  mother_name: "",
  address: "",
};

// ============================================================
// STEP 2 INITIAL VALUES
// ============================================================

const step2InitialValues = {
  date_of_baptism: "",
  parish_of_baptism: "",
  educational_qualification: "",
  sunday_school_qualification: "",
  profession: "",
  joining_date: "",
  transferred_from: "",
};

// ============================================================
// STEP 1 VALIDATION
// ============================================================

const step1ValidationSchema = Yup.object({
  family: Yup.number()
    .typeError("Family is required")
    .required("Family is required"),

  ward: Yup.number()
    .typeError("Ward is required")
    .required("Ward is required"),

  grade: Yup.number()
    .typeError("Grade is required")
    .required("Grade is required"),

  house_name: Yup.string()
    .trim()
    .required("House name is required"),

  name: Yup.string()
    .trim()
    .required("Name is required"),

  gender: Yup.string()
    .required("Gender is required"),

  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),

  dob: Yup.date()
    .typeError("Invalid date of birth")
    .required("Date of birth is required"),

  mobile_no: Yup.string()
    .trim()
    .required("Mobile number is required"),

  marital_status: Yup.string()
    .required("Marital status is required"),

  address: Yup.string()
    .trim()
    .required("Address is required"),
});

// ============================================================
// STEP 2 VALIDATION
// ============================================================

const step2ValidationSchema = Yup.object({
  date_of_baptism: Yup.date()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? null : value
    ),

  parish_of_baptism: Yup.string(),

  educational_qualification: Yup.string(),

  sunday_school_qualification: Yup.string(),

  profession: Yup.string(),

  joining_date: Yup.date()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? null : value
    ),

  transferred_from: Yup.string(),
});

// ============================================================
// MAIN COMPONENT
// ============================================================

const RegisterFamilyHeadPage = () => {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [wards, setWards] = useState([]);
  const [grades, setGrades] = useState([]);

  const [activeStep, setActiveStep] = useState(0);

  // ----------------------------------------------------------
  // PHOTO
  // ----------------------------------------------------------

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // ----------------------------------------------------------
  // DRAFT DATA
  // ----------------------------------------------------------

  const [step1Data, setStep1Data] = useState(
    step1InitialValues
  );

  const [step2Data, setStep2Data] = useState(
    step2InitialValues
  );

  const [optionsLoading, setOptionsLoading] =
    useState(true);

  // ==========================================================
  // LOAD OPTIONS
  // ==========================================================

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);

        const [
          fRes,
          wRes,
          gRes,
        ] = await Promise.all([
          listFamilies(),
          listWards(),
          listGrades(),
        ]);

        const familiesData =
          fRes?.data ?? fRes;

        const wardsData =
          wRes?.data ?? wRes;

        const gradesData =
          gRes?.data ?? gRes;

        setFamilies(
          Array.isArray(familiesData)
            ? familiesData
            : familiesData?.results || []
        );

        setWards(
          Array.isArray(wardsData)
            ? wardsData
            : wardsData?.results || []
        );

        setGrades(
          Array.isArray(gradesData)
            ? gradesData
            : gradesData?.results || []
        );
      } catch (error) {
        console.error(
          "Error fetching registration options:",
          error
        );

        window.alert(
          "Unable to load family, ward or grade information."
        );
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // ==========================================================
  // STEP 1 SUBMIT
  // ==========================================================

  const handleStep1Submit = (values) => {
    // Save Step 1 as draft
    setStep1Data(values);

    // Move to Step 2
    setActiveStep(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // PHOTO CHANGE
  // ==========================================================

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // --------------------------------------------------------
    // IMAGE TYPE
    // --------------------------------------------------------

    if (!file.type.startsWith("image/")) {
      window.alert(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    // --------------------------------------------------------
    // MAXIMUM 2 MB
    // --------------------------------------------------------

    if (file.size > 2 * 1024 * 1024) {
      window.alert(
        "Photo must be less than 2 MB."
      );

      event.target.value = "";
      return;
    }

    // --------------------------------------------------------
    // SAVE FILE
    // --------------------------------------------------------

    setPhotoFile(file);

    // --------------------------------------------------------
    // PREVIEW
    // --------------------------------------------------------

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ==========================================================
  // STEP 2 SUBMIT
  // ==========================================================

  const handleStep2Submit = async (
    values,
    { setSubmitting }
  ) => {
    try {
      // ------------------------------------------------------
      // SAVE STEP 2 DRAFT
      // ------------------------------------------------------

      setStep2Data(values);

      // ------------------------------------------------------
      // CREATE MULTIPART FORM DATA
      // ------------------------------------------------------

      const formData = new FormData();

      // ------------------------------------------------------
      // STEP 1 DATA
      // ------------------------------------------------------

      Object.entries(step1Data).forEach(
        ([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            formData.append(
              key,
              String(value)
            );
          }
        }
      );

      // ------------------------------------------------------
      // STEP 2 DATA
      // ------------------------------------------------------

      Object.entries(values).forEach(
        ([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            formData.append(
              key,
              String(value)
            );
          }
        }
      );

      // ------------------------------------------------------
      // FAMILY PHOTO
      // ------------------------------------------------------

      if (photoFile instanceof File) {
        formData.append(
          "family_image",
          photoFile,
          photoFile.name
        );
      }

      // ------------------------------------------------------
      // DEBUG
      // ------------------------------------------------------

      console.log(
        "========== FAMILY HEAD FORM DATA =========="
      );

      for (const [
        key,
        value,
      ] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            key,
            "FILE:",
            value.name,
            value.type,
            value.size
          );
        } else {
          console.log(
            key,
            ":",
            value
          );
        }
      }

      console.log(
        "=========================================="
      );

      // ------------------------------------------------------
      // API
      // ------------------------------------------------------

      const response = await createHead(
        formData
      );

      console.log(
        "Family head created:",
        response
      );

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      window.alert(
        "Family head created successfully!"
      );

      navigate("/family-heads");
    } catch (error) {
      console.error(
        "Error creating family head:",
        error
      );

      console.error(
        "Backend response:",
        error?.response?.data
      );

      const responseData =
        error?.response?.data;

      let message =
        "Failed to create family head.";

      if (
        typeof responseData === "string"
      ) {
        message = responseData;
      } else if (
        responseData?.error
      ) {
        message =
          responseData.error;
      } else if (
        responseData?.detail
      ) {
        message =
          responseData.detail;
      } else if (
        responseData &&
        typeof responseData === "object"
      ) {
        const entries =
          Object.entries(
            responseData
          );

        if (entries.length > 0) {
          const [
            field,
            messages,
          ] = entries[0];

          const errorMessage =
            Array.isArray(messages)
              ? messages.join(", ")
              : String(messages);

          message =
            `${field}: ${errorMessage}`;
        }
      }

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // BACK TO STEP 1
  // ==========================================================

  const handleBack = (values) => {
    // --------------------------------------------------------
    // IMPORTANT:
    // Save current Step 2 values before going back.
    // Nothing is discarded.
    // --------------------------------------------------------

    setStep2Data(values);

    setActiveStep(0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="#FFFFFF"
      display="flex"
      flexDirection="column"
    >
      {/* HEADER */}

      <Navbar />

      {/* MAIN */}

      <Box
        flex="1"
        bg="#FFFFFF"
        px={{
          base: 4,
          md: 6,
          lg: 8,
        }}
        pt={{
          base: 5,
          md: 6,
        }}
        pb={8}
      >
        <Box
          maxW="1600px"
          mx="auto"
        >
          {/* BREADCRUMB */}

          <HStack
            gap={2}
            mb={4}
            fontSize="13px"
            color="#60708C"
            flexWrap="wrap"
          >
            <Text>
              Masters
            </Text>

            <Text>/</Text>

            <Text>
              Family Head Master
            </Text>

            <Text>/</Text>

            <Text>
              Register Family Head
            </Text>
          </HStack>

          {/* TITLE */}

          <Box mb={4}>
            <Text
              fontSize="13px"
              fontWeight="700"
              color={PRIMARY}
              letterSpacing="0.2px"
              textTransform="uppercase"
              mb={1}
            >
              Family Head Master
            </Text>

            <Heading
              fontSize={{
                base: "27px",
                md: "32px",
              }}
              lineHeight="1.15"
              color="#182338"
              fontWeight="700"
            >
              Register Family Head
            </Heading>

            <Text
              mt={1}
              fontSize="14px"
              color="#60708C"
            >
              Create a family head profile with
              personal, contact and address
              information.
            </Text>
          </Box>

          {/* FORM */}

          {activeStep === 0 ? (
            <Step1Form
              families={families}
              wards={wards}
              grades={grades}
              optionsLoading={
                optionsLoading
              }
              photoPreview={
                photoPreview
              }
              handlePhotoChange={
                handlePhotoChange
              }
              initialValues={
                step1Data
              }
              onSubmit={
                handleStep1Submit
              }
              navigate={navigate}
            />
          ) : (
            <Step2Form
              step1Data={step1Data}
              families={families}
              wards={wards}
              grades={grades}
              initialValues={
                step2Data
              }
              onBack={
                handleBack
              }
              onSubmit={
                handleStep2Submit
              }
            />
          )}
        </Box>
      </Box>

      {/* FOOTER */}

      <Footer />
    </Box>
  );
};

// ============================================================
// STEP 1 FORM
// ============================================================

const Step1Form = ({
  families,
  wards,
  grades,
  optionsLoading,
  photoPreview,
  handlePhotoChange,
  initialValues,
  onSubmit,
  navigate,
}) => {
  return (
    <Formik
      initialValues={
        initialValues ||
        step1InitialValues
      }
      enableReinitialize
      validationSchema={
        step1ValidationSchema
      }
      onSubmit={onSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
      }) => (
        <Form>
          <Box
            bg="white"
            border="1px solid #CDD6E2"
            borderRadius="10px"
            overflow="hidden"
          >
            {/* TABS */}

            <StepTabs
              activeStep={0}
            />

            {/* TITLE */}

            <Box
              px={{
                base: 5,
                md: 6,
              }}
              pt={5}
              pb={3}
            >
              <Heading
                fontSize={{
                  base: "18px",
                  md: "20px",
                }}
                color="#182338"
              >
                1. Family & Personal
                Information
              </Heading>
            </Box>

            {/* CONTENT */}

            <Box
              px={{
                base: 5,
                md: 6,
              }}
              pb={5}
            >
              <Box
                display="grid"
                gridTemplateColumns={{
                  base: "1fr",
                  lg: "335px 1fr 1fr 1fr",
                }}
                gap={{
                  base: 5,
                  lg: 4,
                }}
                alignItems="start"
              >
                {/* ==================================================
                    PHOTO
                    ================================================== */}

                <Box
                  gridRow={{
                    lg: "span 6",
                  }}
                >
                  <Box
                    border="2px dashed"
                    borderColor={
                      PRIMARY
                    }
                    borderRadius="10px"
                    minH={{
                      base: "260px",
                      lg: "270px",
                    }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="#FFFDFD"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      bg: "#FFF7F8",
                    }}
                    onClick={() =>
                      document
                        .getElementById(
                          "family-photo-input"
                        )
                        ?.click()
                    }
                  >
                    {photoPreview ? (
                      <VStack gap={3}>
                        <Avatar.Root
                          size="2xl"
                        >
                          <Avatar.Image
                            src={
                              photoPreview
                            }
                          />

                          <Avatar.Fallback>
                            Photo
                          </Avatar.Fallback>
                        </Avatar.Root>

                        <Text
                          fontSize="13px"
                          fontWeight="600"
                          color="#344054"
                        >
                          Family Photo
                        </Text>

                        <Text
                          fontSize="11px"
                          color="#8491A5"
                        >
                          Click to change
                          photo
                        </Text>
                      </VStack>
                    ) : (
                      <VStack gap={2}>
                        <Box
                          w="90px"
                          h="90px"
                          borderRadius="full"
                          bg="#FFF0F3"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <LuHouse
                            size={48}
                            color={
                              PRIMARY
                            }
                          />
                        </Box>

                        <Text
                          fontSize="14px"
                          fontWeight="600"
                          color="#182338"
                        >
                          Upload Family
                          Photo
                        </Text>

                        <Text
                          fontSize="12px"
                          color="#8491A5"
                        >
                          PNG/JPG up to
                          2 MB
                        </Text>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          borderColor={
                            PRIMARY
                          }
                          color={
                            PRIMARY
                          }
                          mt={1}
                          onClick={(e) => {
                            e.stopPropagation();

                            document
                              .getElementById(
                                "family-photo-input"
                              )
                              ?.click();
                          }}
                        >
                          <LuUpload />
                          Choose File
                        </Button>
                      </VStack>
                    )}
                  </Box>

                  <Input
                    id="family-photo-input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    display="none"
                    onChange={
                      handlePhotoChange
                    }
                  />
                </Box>

                {/* ==================================================
                    ROW 1
                    FAMILY | WARD | GRADE
                    ================================================== */}

                <SelectField
                  label="Family Name"
                  name="family"
                  value={
                    values.family
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.family &&
                    errors.family
                  }
                  disabled={
                    optionsLoading
                  }
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading families..."
                      : "Select family name"}
                  </option>

                  {families.map(
                    (family) => (
                      <option
                        key={
                          family.id
                        }
                        value={
                          family.id
                        }
                      >
                        {
                          family.family_name
                        }
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Ward"
                  name="ward"
                  value={
                    values.ward
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.ward &&
                    errors.ward
                  }
                  disabled={
                    optionsLoading
                  }
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading wards..."
                      : "Select ward"}
                  </option>

                  {wards.map(
                    (ward) => (
                      <option
                        key={
                          ward.id
                        }
                        value={
                          ward.id
                        }
                      >
                        {
                          ward.ward_name
                        }
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Grade"
                  name="grade"
                  value={
                    values.grade
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.grade &&
                    errors.grade
                  }
                  disabled={
                    optionsLoading
                  }
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading grades..."
                      : "Select grade"}
                  </option>

                  {grades.map(
                    (grade) => (
                      <option
                        key={
                          grade.id
                        }
                        value={
                          grade.id
                        }
                      >
                        {
                          grade.name
                        }
                      </option>
                    )
                  )}
                </SelectField>

                {/* ==================================================
                    ROW 2
                    HOUSE | NAME | BAPTISM NAME
                    ================================================== */}

                <InputField
                  label="House Name"
                  name="house_name"
                  value={
                    values.house_name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter house name"
                  required
                  error={
                    touched.house_name &&
                    errors.house_name
                  }
                />

                <InputField
                  label="Name"
                  name="name"
                  value={
                    values.name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter full name"
                  required
                  error={
                    touched.name &&
                    errors.name
                  }
                />

                <InputField
                  label="Baptism Name"
                  name="baptismal_name"
                  value={
                    values.baptismal_name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter baptism name"
                />

                {/* ==================================================
                    ROW 3
                    GENDER | DOB | BLOOD GROUP
                    ================================================== */}

                <SelectField
                  label="Gender"
                  name="gender"
                  value={
                    values.gender
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.gender &&
                    errors.gender
                  }
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="MALE">
                    Male
                  </option>

                  <option value="FEMALE">
                    Female
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </SelectField>

                <InputField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={
                    values.dob
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.dob &&
                    errors.dob
                  }
                />

                <SelectField
                  label="Blood Group"
                  name="blood_group"
                  value={
                    values.blood_group
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                >
                  <option value="">
                    Select blood group
                  </option>

                  <option value="O+">
                    O+
                  </option>

                  <option value="O-">
                    O-
                  </option>

                  <option value="A+">
                    A+
                  </option>

                  <option value="A-">
                    A-
                  </option>

                  <option value="B+">
                    B+
                  </option>

                  <option value="B-">
                    B-
                  </option>

                  <option value="AB+">
                    AB+
                  </option>

                  <option value="AB-">
                    AB-
                  </option>
                </SelectField>

                {/* ==================================================
                    ROW 4
                    EMAIL | MOBILE | PHONE
                    ================================================== */}

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={
                    values.email
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter email address"
                  required
                  error={
                    touched.email &&
                    errors.email
                  }
                />

                <InputField
                  label="Mobile Number"
                  name="mobile_no"
                  value={
                    values.mobile_no
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter mobile number"
                  required
                  error={
                    touched.mobile_no &&
                    errors.mobile_no
                  }
                />

                <InputField
                  label="Phone Number"
                  name="phone_no"
                  value={
                    values.phone_no
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter phone number"
                />

                {/* ==================================================
                    ROW 5
                    MARITAL | SPOUSE | FATHER
                    ================================================== */}

                <SelectField
                  label="Marital Status"
                  name="marital_status"
                  value={
                    values.marital_status
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  required
                  error={
                    touched.marital_status &&
                    errors.marital_status
                  }
                >
                  <option value="">
                    Select marital status
                  </option>

                  <option value="SINGLE">
                    Single
                  </option>

                  <option value="MARRIED">
                    Married
                  </option>

                  <option value="WIDOWED">
                    Widowed
                  </option>

                  <option value="DIVORCED">
                    Divorced
                  </option>
                </SelectField>

                <InputField
                  label="Spouse Name"
                  name="spouse_name"
                  value={
                    values.spouse_name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter spouse name"
                />

                <InputField
                  label="Father Name"
                  name="father_name"
                  value={
                    values.father_name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter father name"
                />

                {/* ==================================================
                    ROW 6
                    MOTHER | ADDRESS
                    ================================================== */}

                <InputField
                  label="Mother Name"
                  name="mother_name"
                  value={
                    values.mother_name
                  }
                  onChange={
                    handleChange
                  }
                  onBlur={
                    handleBlur
                  }
                  placeholder="Enter mother name"
                />

                <Box
                  gridColumn={{
                    base: "auto",
                    lg: "span 2",
                  }}
                >
                  <Field.Root
                    invalid={Boolean(
                      touched.address &&
                      errors.address
                    )}
                  >
                    <Field.Label
                      fontSize="12px"
                      fontWeight="600"
                      color="#182338"
                      mb={1.5}
                    >
                      Address

                      <Text
                        as="span"
                        color={
                          PRIMARY
                        }
                        ml={1}
                      >
                        *
                      </Text>
                    </Field.Label>

                    <Input
                      name="address"
                      value={
                        values.address ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter complete address"
                      height="40px"
                      borderColor="#D5DDE8"
                      bg="white"
                      fontSize="13px"
                      color="#182338"
                      _placeholder={{
                        color:
                          "#9AA7B9",
                      }}
                      _focus={{
                        borderColor:
                          PRIMARY,
                        boxShadow: `0 0 0 1px ${PRIMARY}`,
                      }}
                    />

                    {touched.address &&
                      errors.address && (
                        <Field.ErrorText>
                          {
                            errors.address
                          }
                        </Field.ErrorText>
                      )}
                  </Field.Root>
                </Box>
              </Box>

              {/* ==================================================
                  BUTTONS
                  ================================================== */}

              <Box
                mt={6}
                pt={4}
                borderTop="1px solid #E6EAF0"
              >
                <HStack
                  justify="flex-end"
                  gap={3}
                >
                  <Button
                    type="button"
                    variant="outline"
                    borderColor="#C7CFDA"
                    color="#344054"
                    px={7}
                    onClick={() =>
                      navigate(
                        "/family-heads"
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    bg={PRIMARY}
                    color="white"
                    px={8}
                    _hover={{
                      opacity: 0.9,
                    }}
                  >
                    Save & Continue
                  </Button>

                  <Text
                    ml={3}
                    fontSize="12px"
                    color="#60708C"
                    display={{
                      base: "none",
                      md: "block",
                    }}
                  >
                    Step 1 of 2
                  </Text>
                </HStack>
              </Box>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

// ============================================================
// STEP 2 FORM
// ============================================================

const Step2Form = ({
  step1Data,
  families,
  wards,
  grades,
  initialValues,
  onBack,
  onSubmit,
}) => {
  return (
    <Formik
      initialValues={
        initialValues ||
        step2InitialValues
      }
      enableReinitialize
      validationSchema={
        step2ValidationSchema
      }
      onSubmit={onSubmit}
    >
      {({
        values,
        handleChange,
        handleBlur,
        isSubmitting,
      }) => (
        <Form>
          <Box
            bg="white"
            border="1px solid #CDD6E2"
            borderRadius="10px"
            overflow="hidden"
          >
            {/* TABS */}

            <StepTabs
              activeStep={1}
            />

            <Box
              px={{
                base: 5,
                md: 6,
              }}
              pt={5}
              pb={5}
            >
              <Box
                display="grid"
                gridTemplateColumns={{
                  base: "1fr",
                  lg: "1.55fr 1fr",
                }}
                gap={6}
              >
                {/* ==================================================
                    LEFT
                    ================================================== */}

                <Box>
                  <Heading
                    fontSize={{
                      base: "18px",
                      md: "20px",
                    }}
                    color="#182338"
                    mb={5}
                  >
                    2. Sacraments &
                    Education
                  </Heading>

                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      base: "1fr",
                      md: "1fr 1fr",
                    }}
                    gap={4}
                  >
                    <InputField
                      label="Date of Baptism"
                      name="date_of_baptism"
                      type="date"
                      value={
                        values.date_of_baptism
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                    />

                    <InputField
                      label="Parish of Baptism"
                      name="parish_of_baptism"
                      value={
                        values.parish_of_baptism
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter parish of baptism"
                    />

                    <InputField
                      label="Educational Qualification"
                      name="educational_qualification"
                      value={
                        values.educational_qualification
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter educational qualification"
                    />

                    <InputField
                      label="Sunday School Qualification"
                      name="sunday_school_qualification"
                      value={
                        values.sunday_school_qualification
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter Sunday school qualification"
                    />
                  </Box>

                  <Box
                    mt={4}
                    maxW={{
                      base: "100%",
                      md: "calc(50% - 8px)",
                    }}
                  >
                    <InputField
                      label="Profession"
                      name="profession"
                      value={
                        values.profession
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter profession"
                    />
                  </Box>
                </Box>

                {/* ==================================================
                    RIGHT
                    ================================================== */}

                <Box
                  borderLeft={{
                    base: "none",
                    lg: "1px solid #DCE2EA",
                  }}
                  pl={{
                    base: 0,
                    lg: 5,
                  }}
                >
                  <Heading
                    fontSize={{
                      base: "18px",
                      md: "20px",
                    }}
                    color="#182338"
                    mb={5}
                  >
                    3. Parish Membership
                  </Heading>

                  <InputField
                    label="Joining Date"
                    name="joining_date"
                    type="date"
                    value={
                      values.joining_date
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  <Box mt={4}>
                    <InputField
                      label="Transferred From"
                      name="transferred_from"
                      value={
                        values.transferred_from
                      }
                      onChange={
                        handleChange
                      }
                      onBlur={
                        handleBlur
                      }
                      placeholder="Enter previous parish"
                    />
                  </Box>

                  {/* ==================================================
                      ASSIGNMENT
                      ================================================== */}

                  <Box
                    mt={4}
                    border="1px solid #CBD5E1"
                    borderRadius="9px"
                    p={4}
                  >
                    <Heading
                      fontSize="16px"
                      color="#182338"
                      mb={3}
                    >
                      Family Assignment
                    </Heading>

                    <AssignmentRow
                      label="Family Name"
                      value={getFamilyValue(
                        step1Data,
                        families
                      )}
                    />

                    <AssignmentRow
                      label="Ward"
                      value={getWardValue(
                        step1Data,
                        wards
                      )}
                    />

                    <AssignmentRow
                      label="Grade"
                      value={getGradeValue(
                        step1Data,
                        grades
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              {/* ==================================================
                  INFO
                  ================================================== */}

              <Box
                mt={5}
                border="1px solid #BFD5F5"
                bg="#F5F9FF"
                borderRadius="8px"
                px={4}
                py={3}
                display="flex"
                alignItems="center"
                gap={3}
              >
                <LuInfo
                  size={22}
                  color="#2864B0"
                />

                <Text
                  fontSize="12px"
                  color="#526581"
                >
                  You can review Family &
                  Personal information by
                  returning to the previous
                  step.
                </Text>
              </Box>

              {/* ==================================================
                  BUTTONS
                  ================================================== */}

              <Box
                mt={5}
                pt={4}
                borderTop="1px solid #E6EAF0"
              >
                <HStack
                  justify="flex-end"
                  gap={3}
                >
                  <Button
                    type="button"
                    variant="outline"
                    borderColor={PRIMARY}
                    color={PRIMARY}
                    px={7}
                    onClick={() =>
                      onBack(values)
                    }
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    bg={PRIMARY}
                    color="white"
                    px={8}
                    loading={
                      isSubmitting
                    }
                    loadingText="Registering..."
                    _hover={{
                      opacity: 0.9,
                    }}
                  >
                    Register Family Head
                  </Button>

                  <Text
                    ml={3}
                    fontSize="12px"
                    color="#60708C"
                    display={{
                      base: "none",
                      md: "block",
                    }}
                  >
                    Step 2 of 2
                  </Text>
                </HStack>
              </Box>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

// ============================================================
// STEP TABS
// ============================================================

const StepTabs = ({
  activeStep,
}) => {
  return (
    <Box
      px={{
        base: 4,
        md: 5,
      }}
      borderBottom="1px solid #CDD6E2"
    >
      <Box
        display="grid"
        gridTemplateColumns={{
          base: "1fr",
          md: "1fr 1fr",
        }}
      >
        {/* STEP 1 */}

        <Box
          py={3}
          px={4}
          borderBottom={
            activeStep === 0
              ? `2px solid ${PRIMARY}`
              : "2px solid transparent"
          }
        >
          <Text
            fontSize="14px"
            fontWeight="700"
            color={
              activeStep === 0
                ? PRIMARY
                : "#182338"
            }
          >
            Family & Personal
          </Text>

          <Text
            mt={0.5}
            fontSize="11px"
            color="#60708C"
          >
            Basic family and personal
            information
          </Text>
        </Box>

        {/* STEP 2 */}

        <Box
          py={3}
          px={4}
          borderBottom={
            activeStep === 1
              ? `2px solid ${PRIMARY}`
              : "2px solid transparent"
          }
        >
          <Text
            fontSize="14px"
            fontWeight="700"
            color={
              activeStep === 1
                ? PRIMARY
                : "#182338"
            }
          >
            Sacraments, Education &
            Parish
          </Text>

          <Text
            mt={0.5}
            fontSize="11px"
            color="#60708C"
          >
            Faith life, education and
            parish details
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================
// INPUT FIELD
// ============================================================

const InputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  required = false,
  error,
}) => {
  return (
    <Field.Root
      invalid={Boolean(error)}
    >
      <Field.Label
        fontSize="12px"
        fontWeight="600"
        color="#182338"
        mb={1.5}
      >
        {label}

        {required && (
          <Text
            as="span"
            color={PRIMARY}
            ml={1}
          >
            *
          </Text>
        )}
      </Field.Label>

      <Input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        height="40px"
        borderColor="#D5DDE8"
        bg="white"
        fontSize="13px"
        color="#182338"
        _placeholder={{
          color: "#9AA7B9",
        }}
        _focus={{
          borderColor: PRIMARY,
          boxShadow: `0 0 0 1px ${PRIMARY}`,
        }}
      />

      {error && (
        <Field.ErrorText>
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

// ============================================================
// SELECT FIELD
// ============================================================

const SelectField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  children,
  required = false,
  error,
  disabled = false,
}) => {
  return (
    <Field.Root
      invalid={Boolean(error)}
    >
      <Field.Label
        fontSize="12px"
        fontWeight="600"
        color="#182338"
        mb={1.5}
      >
        {label}

        {required && (
          <Text
            as="span"
            color={PRIMARY}
            ml={1}
          >
            *
          </Text>
        )}
      </Field.Label>

      <NativeSelect.Root>
        <NativeSelect.Field
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          height="40px"
          borderColor="#D5DDE8"
          bg="white"
          fontSize="13px"
          color={
            value
              ? "#182338"
              : "#9AA7B9"
          }
          _focus={{
            borderColor: PRIMARY,
            boxShadow: `0 0 0 1px ${PRIMARY}`,
          }}
        >
          {children}
        </NativeSelect.Field>
      </NativeSelect.Root>

      {error && (
        <Field.ErrorText>
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

// ============================================================
// ASSIGNMENT ROW
// ============================================================

const AssignmentRow = ({
  label,
  value,
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        base: "130px 1fr",
        md: "170px 1fr",
      }}
      gap={2}
      py={1}
    >
      <Text
        fontSize="12px"
        color="#526581"
      >
        {label}
      </Text>

      <Text
        fontSize="12px"
        color="#182338"
        fontWeight="500"
      >
        {value ||
          "Selected in previous step"}
      </Text>
    </Box>
  );
};

// ============================================================
// GET FAMILY NAME
// ============================================================

const getFamilyValue = (
  data,
  families
) => {
  if (!data?.family) {
    return "Selected in previous step";
  }

  const family = families.find(
    (item) =>
      String(item.id) ===
      String(data.family)
  );

  return (
    family?.family_name ||
    "Selected in previous step"
  );
};

// ============================================================
// GET WARD NAME
// ============================================================

const getWardValue = (
  data,
  wards
) => {
  if (!data?.ward) {
    return "Selected in previous step";
  }

  const ward = wards.find(
    (item) =>
      String(item.id) ===
      String(data.ward)
  );

  return (
    ward?.ward_name ||
    "Selected in previous step"
  );
};

// ============================================================
// GET GRADE NAME
// ============================================================

const getGradeValue = (
  data,
  grades
) => {
  if (!data?.grade) {
    return "Selected in previous step";
  }

  const grade = grades.find(
    (item) =>
      String(item.id) ===
      String(data.grade)
  );

  return (
    grade?.name ||
    "Selected in previous step"
  );
};

// ============================================================
// EXPORT
// ============================================================

export default RegisterFamilyHeadPage;