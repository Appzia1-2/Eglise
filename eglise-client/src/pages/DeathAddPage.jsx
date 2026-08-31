import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
} from "@chakra-ui/react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  createDeathRecord,
  listFamilies,
  listMembers,
} from "../api/registryServices";

import {
  listTombTypes,
  listTombFees,
} from "../api/churchServices";

const PRIMARY_RED = "#D7193F";
const DARK_RED = "#650A18";

const TEXT_COLOR = "#182338";
const SECONDARY_TEXT = "#60708C";
const BORDER_COLOR = "#DCE2EA";
const BLUE = "#315AB5";

const DeathAddPage = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [tombTypes, setTombTypes] = useState([]);
  const [tombFees, setTombFees] = useState([]);

  const [loadingFees, setLoadingFees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    family: "",
    member: "",
    died_on: "",
    funeral_on: "",
    tomb_type: "",
    tomb_fee: "",
    tomb_idn: "",
    reason_of_death: "",
    remarks: "",
  });

  // ==========================================================
  // LOAD OPTIONS
  // ==========================================================

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        setPageError("");

        const [
          familyResponse,
          memberResponse,
          tombResponse,
        ] = await Promise.all([
          listFamilies(),
          listMembers(),
          listTombTypes(),
        ]);

        const familyData =
          familyResponse?.data?.results ??
          familyResponse?.data ??
          [];

        const memberData =
          memberResponse?.data?.results ??
          memberResponse?.data ??
          [];

        const tombData =
          tombResponse?.data?.results ??
          tombResponse?.data ??
          [];

        setFamilies(
          Array.isArray(familyData)
            ? familyData
            : []
        );

        const activeMembers = (
          Array.isArray(memberData)
            ? memberData
            : []
        ).filter(
          (member) =>
            member?.is_active !== false &&
            member?.expired !== true
        );

        setMembers(activeMembers);

        setTombTypes(
          Array.isArray(tombData)
            ? tombData
            : []
        );
      } catch (error) {
        console.error(
          "Error loading death registration options:",
          error
        );

        setPageError(
          getApiErrorMessage(
            error,
            "Unable to load registration data."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // ==========================================================
  // LOAD TOMB FEES WHEN TOMB TYPE CHANGES
  // ==========================================================

  useEffect(() => {
    const loadTombFees = async () => {
      if (!formData.tomb_type) {
        setTombFees([]);

        setFormData((previous) => ({
          ...previous,
          tomb_fee: "",
        }));

        return;
      }

      try {
        setLoadingFees(true);

        const response = await listTombFees(
          formData.tomb_type
        );

        const feeData =
          response?.data?.results ??
          response?.data ??
          [];

        setTombFees(
          Array.isArray(feeData)
            ? feeData
            : []
        );

        setFormData((previous) => ({
          ...previous,
          tomb_fee: "",
        }));
      } catch (error) {
        console.error(
          "Error loading tomb fees:",
          error
        );

        setTombFees([]);

        setFormData((previous) => ({
          ...previous,
          tomb_fee: "",
        }));
      } finally {
        setLoadingFees(false);
      }
    };

    loadTombFees();
  }, [formData.tomb_type]);

  // ==========================================================
  // MEMBERS FOR SELECTED FAMILY
  // ==========================================================

  const familyMembers = useMemo(() => {
    if (!formData.family) {
      return members;
    }

    return members.filter((member) => {
      const memberFamilyId =
        member?.family?.id ??
        member?.family_id ??
        member?.family;

      return (
        String(memberFamilyId) ===
        String(formData.family)
      );
    });
  }, [members, formData.family]);

  // ==========================================================
  // SELECTED TOMB FEE
  // ==========================================================

  const selectedTombFee = useMemo(() => {
    if (
      !formData.tomb_fee ||
      tombFees.length === 0
    ) {
      return null;
    }

    return tombFees.find(
      (fee) =>
        String(fee.id) ===
        String(formData.tomb_fee)
    );
  }, [formData.tomb_fee, tombFees]);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getFamilyName = (family) => {
    return (
      family?.family_name ||
      family?.name ||
      "Unnamed Family"
    );
  };

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setPageError("");
  };

  // ==========================================================
  // FAMILY CHANGE
  // ==========================================================

  const handleFamilyChange = (event) => {
    const familyId =
      event.target.value;

    setFormData((previous) => ({
      ...previous,
      family: familyId,
      member: "",
    }));

    setFieldErrors((previous) => ({
      ...previous,
      family: undefined,
      member: undefined,
    }));

    setPageError("");
  };

  // ==========================================================
  // TOMB TYPE CHANGE
  // ==========================================================

  const handleTombTypeChange = (event) => {
    const tombTypeId =
      event.target.value;

    setFormData((previous) => ({
      ...previous,
      tomb_type: tombTypeId,
      tomb_fee: "",
    }));

    setFieldErrors((previous) => ({
      ...previous,
      tomb_type: undefined,
      tomb_fee: undefined,
    }));

    setPageError("");
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const errors = {};

    if (!formData.family) {
      errors.family =
        "Please select a family.";
    }

    if (!formData.member) {
      errors.member =
        "Please select a member.";
    }

    if (!formData.died_on) {
      errors.died_on =
        "Date of death is required.";
    }

    if (!formData.funeral_on) {
      errors.funeral_on =
        "Date of funeral is required.";
    }

    if (
      formData.died_on &&
      formData.funeral_on &&
      formData.funeral_on <
        formData.died_on
    ) {
      errors.funeral_on =
        "Funeral date cannot be before death date.";
    }

    if (!formData.tomb_type) {
      errors.tomb_type =
        "Tomb type is required.";
    }

    if (!formData.tomb_fee) {
      errors.tomb_fee =
        "Tomb fee selection is required.";
    }

    if (
      !formData.reason_of_death.trim()
    ) {
      errors.reason_of_death =
        "Reason of death is required.";
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setPageError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Send both tomb_type and tomb_fee.
       *
       * tomb_type = selected TombType ID
       * tomb_fee  = selected TombFee ID
       */

      const payload = {
        member: Number(formData.member),

        died_on:
          formData.died_on,

        funeral_on:
          formData.funeral_on,

        tomb_type:
          Number(formData.tomb_type),

        tomb_fee:
          Number(formData.tomb_fee),

        tomb_idn:
          formData.tomb_idn || "",

        reason_of_death:
          formData.reason_of_death.trim(),

        remarks:
          formData.remarks.trim(),
      };

      console.log(
        "Death registration payload:",
        payload
      );

      await createDeathRecord(payload);

      navigate("/death", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error registering death:",
        error
      );

      const responseData =
        error?.response?.data;

      console.error(
        "HTTP status:",
        error?.response?.status
      );

      console.error(
        "Backend response:",
        responseData
      );

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const normalizedErrors = {};

        Object.entries(
          responseData
        ).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            normalizedErrors[key] =
              value.join(" ");
          } else if (
            typeof value === "string"
          ) {
            normalizedErrors[key] =
              value;
          } else {
            normalizedErrors[key] =
              JSON.stringify(value);
          }
        });

        setFieldErrors(
          normalizedErrors
        );

        const messages =
          Object.entries(
            normalizedErrors
          )
            .map(
              ([key, value]) =>
                `${key}: ${value}`
            )
            .join("\n");

        setPageError(
          messages ||
            "Unable to register death record."
        );
      } else {
        setPageError(
          getApiErrorMessage(
            error,
            "Unable to register death record."
          )
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/death-register")
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />

        <Container
          maxW="1400px"
          flex="1"
          py={5}
        >
          <Text
            color={SECONDARY_TEXT}
            fontSize="13px"
          >
            Loading registration form...
          </Text>
        </Container>

        <Footer />
      </Box>
    );
  }

  // ==========================================================
  // PAGE
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
        maxW="1400px"
        px={{
          base: 4,
          md: 5,
        }}
        pt={{
          base: 3,
          md: 3,
        }}
        pb={{
          base: 3,
          md: 3,
        }}
        flex="1"
      >
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <HStack
          gap={2}
          mb={2}
          fontSize="11px"
        >
          <Text color={BLUE}>
            Activities
          </Text>

          <Text color="#A2ACBB">
            /
          </Text>

          <Text color={BLUE}>
            Death Register
          </Text>

          <Text color="#A2ACBB">
            /
          </Text>

          <Text color={SECONDARY_TEXT}>
            Register Death
          </Text>
        </HStack>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <Box mb={4}>
          <Text
            color={PRIMARY_RED}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.3px"
            mb={0.5}
          >
            DEATH REGISTER
          </Text>

          <Heading
            color={TEXT_COLOR}
            fontSize={{
              base: "23px",
              md: "27px",
            }}
            fontWeight="600"
            lineHeight="1.1"
          >
            Register Death Record
          </Heading>

          <Text
            color={SECONDARY_TEXT}
            fontSize="12px"
            mt={0.5}
          >
            Record death, funeral and burial
            details for a parish member.
          </Text>
        </Box>

        {/* ==================================================
            FORM CARD
        ================================================== */}

        <Box
          bg="white"
          px={{
            base: 4,
            md: 5,
          }}
          py={{
            base: 4,
            md: 4,
          }}
          border={`1px solid ${BORDER_COLOR}`}
          borderRadius="6px"
        >
          <form onSubmit={handleSubmit}>

            {/* PAGE ERROR */}

            {pageError && (
              <Box
                mb={3}
                p={2.5}
                borderRadius="6px"
                bg="#FFF5F5"
                border="1px solid #FED7D7"
              >
                <Text
                  color="red.600"
                  fontSize="11px"
                  whiteSpace="pre-line"
                >
                  {pageError}
                </Text>
              </Box>
            )}

            {/* ==================================================
                1. MEMBER INFORMATION
            ================================================== */}

            <SectionTitle>
              1. Member Information
            </SectionTitle>

            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
              }}
              gap={3}
              mb={2.5}
            >

              {/* FAMILY */}

              <FormField
                label="Family"
                required
                error={fieldErrors.family}
              >
                <SelectField
                  name="family"
                  value={formData.family}
                  onChange={
                    handleFamilyChange
                  }
                  error={fieldErrors.family}
                >
                  <option value="">
                    Select Family
                  </option>

                  {families.map(
                    (family) => (
                      <option
                        key={family.id}
                        value={family.id}
                      >
                        {getFamilyName(
                          family
                        )}

                        {family.family_no
                          ? ` (${family.family_no})`
                          : family.code
                          ? ` (${family.code})`
                          : ""}
                      </option>
                    )
                  )}
                </SelectField>
              </FormField>

              {/* MEMBER */}

              <FormField
                label="Member Name"
                required
                error={fieldErrors.member}
              >
                <SelectField
                  name="member"
                  value={formData.member}
                  onChange={handleChange}
                  error={fieldErrors.member}
                  disabled={!formData.family}
                >
                  <option value="">
                    {!formData.family
                      ? "Select Family First"
                      : familyMembers.length === 0
                      ? "No active members"
                      : "Select Member"}
                  </option>

                  {familyMembers.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.name}

                        {member.member_no
                          ? ` (${member.member_no})`
                          : member.reg_no
                          ? ` (${member.reg_no})`
                          : ""}
                      </option>
                    )
                  )}
                </SelectField>
              </FormField>

            </SimpleGrid>

            {/* DIVIDER */}

            <Box
              borderTop={`1px solid ${BORDER_COLOR}`}
              my={2.5}
            />

            {/* ==================================================
                2. DEATH & FUNERAL DETAILS
            ================================================== */}

            <SectionTitle>
              2. Death & Funeral Details
            </SectionTitle>

            <SimpleGrid
              columns={{
                base: 1,
                md: 2,
              }}
              gap={3}
              mb={2.5}
            >

              {/* DATE OF DEATH */}

              <FormField
                label="Date of Death"
                required
                error={fieldErrors.died_on}
              >
                <DateInput
                  name="died_on"
                  value={formData.died_on}
                  onChange={handleChange}
                  error={fieldErrors.died_on}
                />
              </FormField>

              {/* DATE OF FUNERAL */}

              <FormField
                label="Date of Funeral"
                required
                error={
                  fieldErrors.funeral_on
                }
              >
                <DateInput
                  name="funeral_on"
                  value={
                    formData.funeral_on
                  }
                  onChange={handleChange}
                  error={
                    fieldErrors.funeral_on
                  }
                />
              </FormField>

              {/* TOMB TYPE */}

              <FormField
                label="Tomb Type"
                required
                error={
                  fieldErrors.tomb_type
                }
              >
                <SelectField
                  name="tomb_type"
                  value={formData.tomb_type}
                  onChange={
                    handleTombTypeChange
                  }
                  error={
                    fieldErrors.tomb_type
                  }
                >
                  <option value="">
                    Select Tomb Type
                  </option>

                  {tombTypes.map(
                    (tomb) => (
                      <option
                        key={tomb.id}
                        value={tomb.id}
                      >
                        {tomb.name}
                      </option>
                    )
                  )}
                </SelectField>
              </FormField>

              {/* TOMB FEE */}

              <FormField
                label="Tomb Fee"
                required
                error={
                  fieldErrors.tomb_fee
                }
              >
                <SelectField
                  name="tomb_fee"
                  value={formData.tomb_fee}
                  onChange={handleChange}
                  error={
                    fieldErrors.tomb_fee
                  }
                  disabled={
                    !formData.tomb_type ||
                    loadingFees ||
                    tombFees.length === 0
                  }
                >
                  <option value="">
                    {!formData.tomb_type
                      ? "Select Tomb Type First"
                      : loadingFees
                      ? "Loading fees..."
                      : tombFees.length === 0
                      ? "No fees available"
                      : "Select Tomb Fee"}
                  </option>

                  {tombFees.map(
                    (fee) => (
                      <option
                        key={fee.id}
                        value={fee.id}
                      >
                        {fee.indication} - ₹
                        {fee.tomb_fees}
                      </option>
                    )
                  )}
                </SelectField>
              </FormField>

              {/* TOMB IDN */}

              <FormField
                label="Tomb IDN"
                error={
                  fieldErrors.tomb_idn
                }
              >
                <Input
                  name="tomb_idn"
                  value={
                    formData.tomb_idn
                  }
                  onChange={handleChange}
                  placeholder="Enter tomb IDN"
                  h="32px"
                  borderColor={
                    fieldErrors.tomb_idn
                      ? "red.400"
                      : BORDER_COLOR
                  }
                  borderRadius="6px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  _focus={{
                    borderColor:
                      PRIMARY_RED,
                    boxShadow:
                      `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>

            </SimpleGrid>

           

            {/* ==================================================
                REASON
            ================================================== */}

            <Box mb={2.5}>
              <FormField
                label="Reason of Death"
                required
                error={
                  fieldErrors.reason_of_death
                }
              >
                <Textarea
                  name="reason_of_death"
                  value={
                    formData.reason_of_death
                  }
                  onChange={handleChange}
                  placeholder="Enter reason of death"
                  minH="45px"
                  h="45px"
                  resize="none"
                  borderColor={
                    fieldErrors.reason_of_death
                      ? "red.400"
                      : BORDER_COLOR
                  }
                  borderRadius="6px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  py={1.5}
                  _focus={{
                    borderColor:
                      PRIMARY_RED,
                    boxShadow:
                      `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>
            </Box>

            {/* ==================================================
                REMARKS
            ================================================== */}

            <Box mb={3}>
              <FormField
                label="Remarks"
                error={
                  fieldErrors.remarks
                }
              >
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter additional remarks"
                  minH="45px"
                  h="45px"
                  resize="none"
                  borderColor={
                    fieldErrors.remarks
                      ? "red.400"
                      : BORDER_COLOR
                  }
                  borderRadius="6px"
                  fontSize="12px"
                  color={TEXT_COLOR}
                  py={1.5}
                  _focus={{
                    borderColor:
                      PRIMARY_RED,
                    boxShadow:
                      `0 0 0 1px ${PRIMARY_RED}`,
                  }}
                />
              </FormField>
            </Box>

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <Flex
              justify="flex-end"
              gap={2.5}
            >
              <Button
                type="button"
                variant="outline"
                h="34px"
                px={5}
                fontSize="11px"
                fontWeight="500"
                borderColor={BORDER_COLOR}
                color={SECONDARY_TEXT}
                borderRadius="6px"
                onClick={handleCancel}
                disabled={saving}
                _hover={{
                  bg: "#F7F9FB",
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                bg={PRIMARY_RED}
                color="white"
                h="34px"
                px={6}
                minW="140px"
                fontSize="11px"
                fontWeight="600"
                borderRadius="6px"
                loading={saving}
                loadingText="Registering..."
                _hover={{
                  bg: DARK_RED,
                }}
              >
                Register Death
              </Button>
            </Flex>

          </form>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

// ==========================================================
// SECTION TITLE
// ==========================================================

const SectionTitle = ({
  children,
}) => {
  return (
    <Heading
      fontSize="14px"
      fontWeight="600"
      color={TEXT_COLOR}
      mb={2}
    >
      {children}
    </Heading>
  );
};

// ==========================================================
// FORM FIELD
// ==========================================================

const FormField = ({
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <Box>
      <Text
        color={TEXT_COLOR}
        fontSize="10px"
        fontWeight="600"
        mb={0.5}
      >
        {label}

        {required && (
          <Text
            as="span"
            color={PRIMARY_RED}
            ml="3px"
          >
            *
          </Text>
        )}
      </Text>

      {children}

      {error && (
        <Text
          color="red.500"
          fontSize="9px"
          mt={0.5}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

// ==========================================================
// SELECT FIELD
// Chakra UI v3 compatible
// ==========================================================

const SelectField = ({
  children,
  name,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  return (
    <Box
      position="relative"
      width="100%"
    >
      <Box
        as="select"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        width="100%"
        height="32px"
        fontSize="12px"
        color={
          value
            ? TEXT_COLOR
            : SECONDARY_TEXT
        }
        border={`1px solid ${
          error
            ? "#F56565"
            : BORDER_COLOR
        }`}
        borderRadius="6px"
        bg="white"
        appearance="none"
        paddingLeft="10px"
        paddingRight="32px"
        outline="none"
        cursor={
          disabled
            ? "not-allowed"
            : "pointer"
        }
        _focus={{
          borderColor:
            PRIMARY_RED,
          boxShadow:
            `0 0 0 1px ${PRIMARY_RED}`,
        }}
        _disabled={{
          bg: "#F7F9FB",
          color: "#9AA4B2",
          cursor: "not-allowed",
        }}
      >
        {children}
      </Box>

      {/* Simple dropdown arrow */}

      <Box
        position="absolute"
        right="11px"
        top="50%"
        transform="translateY(-50%)"
        pointerEvents="none"
        color={SECONDARY_TEXT}
        fontSize="10px"
        lineHeight="1"
      >
        ▼
      </Box>
    </Box>
  );
};

// ==========================================================
// DATE INPUT
// ==========================================================

const DateInput = ({
  name,
  value,
  onChange,
  error,
}) => {
  return (
    <Input
      name={name}
      type="date"
      value={value}
      onChange={onChange}
      h="32px"
      fontSize="12px"
      color={TEXT_COLOR}
      borderColor={
        error
          ? "red.400"
          : BORDER_COLOR
      }
      borderRadius="6px"
      _focus={{
        borderColor:
          PRIMARY_RED,
        boxShadow:
          `0 0 0 1px ${PRIMARY_RED}`,
      }}
    />
  );
};

// ==========================================================
// API ERROR HELPER
// ==========================================================

const getApiErrorMessage = (
  error,
  fallback
) => {
  const data =
    error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.error) {
    return data.error;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.non_field_errors) {
    return Array.isArray(
      data.non_field_errors
    )
      ? data.non_field_errors.join(" ")
      : data.non_field_errors;
  }

  return fallback;
};

export default DeathAddPage;