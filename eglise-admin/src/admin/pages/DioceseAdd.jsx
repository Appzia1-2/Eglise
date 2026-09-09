// src/admin/pages/DioceseAdd.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Flex,
  Grid,
  GridItem,
  Icon,
  Spinner,
} from "@chakra-ui/react";

import {
  LuSave,
  LuCircleHelp,
  LuMail,
  LuGlobe,
  LuChevronDown,
  LuCheck,
  LuX,
  LuSearch,
  LuHash,
  LuArrowLeft,
} from "react-icons/lu";

import { Country, State } from "country-state-city";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";
import ReactCountryFlag from "react-country-flag";
import { parsePhoneNumberFromString } from "libphonenumber-js";

/* =========================================================
   COUNTRY DROPDOWN
========================================================= */

const CountryDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isInvalid = false,
  height = "40px",
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selectedOption = options.find(
    (opt) => opt.value === value
  );

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => {
        searchRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayValue = () => {
    if (
      selectedOption &&
      selectedOption.value !== ""
    ) {
      return (
        <Flex
          align="center"
          gap={2}
          flex="1"
          overflow="hidden"
        >
          <Text
            noOfLines={1}
            textAlign="left"
            fontWeight="500"
            fontSize="13px"
          >
            {selectedOption.label}
          </Text>
        </Flex>
      );
    }

    return (
      <Text
        color="gray.400"
        fontWeight="400"
        fontSize="13px"
      >
        {placeholder}
      </Text>
    );
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
    >
      {label && (
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.700"
          mb={0.5}
        >
          {label}
        </Text>
      )}

      <Box
        onClick={() =>
          !isDisabled && setIsOpen(!isOpen)
        }
        cursor={
          isDisabled ? "not-allowed" : "pointer"
        }
        border="1.5px solid"
        borderColor={
          isInvalid
            ? "#e53e3e"
            : isOpen
            ? "#ae2050"
            : "#e2e8f0"
        }
        borderRadius="md"
        height={height}
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={isDisabled ? "gray.50" : "white"}
        _hover={{
          borderColor: isInvalid
            ? "#e53e3e"
            : "#cbd5e0",
        }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}

        <LuChevronDown
          size={14}
          style={{
            transform: isOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition:
              "transform 0.25s ease",
            color: isOpen
              ? "#ae2050"
              : "#718096",
            flexShrink: 0,
            marginLeft: "6px",
          }}
        />
      </Box>

      {isOpen && !isDisabled && (
        <Box
          position="absolute"
          left="0"
          right="0"
          top="calc(100% + 4px)"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          maxHeight="300px"
          overflow="hidden"
        >
          <Box
            p={2}
            borderBottom="1px solid"
            borderColor="gray.100"
            bg="gray.50"
          >
            <Flex
              align="center"
              gap={2}
              bg="white"
              px={2}
              py={1}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <LuSearch
                size={14}
                color="#718096"
              />

              <Input
                ref={searchRef}
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                border="none"
                _focus={{
                  boxShadow: "none",
                }}
                bg="transparent"
                px={0}
                height="26px"
                fontSize="13px"
                _placeholder={{
                  color: "gray.400",
                }}
              />

              {searchTerm && (
                <Box
                  as="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  color="gray.400"
                  _hover={{
                    color: "gray.600",
                  }}
                >
                  <LuX size={12} />
                </Box>
              )}
            </Flex>
          </Box>

          <Box
            maxHeight="220px"
            overflowY="auto"
            css={{
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "gray.50",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e0",
                borderRadius: "24px",
              },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box
                px={4}
                py={6}
                textAlign="center"
              >
                <Text
                  fontSize="sm"
                  color="gray.400"
                >
                  No countries found
                </Text>
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.value}
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{
                    bg: "gray.50",
                  }}
                  onClick={() =>
                    handleSelect(option)
                  }
                  bg={
                    option.value === value
                      ? "purple.50"
                      : "transparent"
                  }
                  transition="all 0.15s"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                >
                  <Text
                    fontSize="13px"
                    color={
                      option.value === value
                        ? "#ae2050"
                        : "gray.700"
                    }
                    fontWeight={
                      option.value === value
                        ? "600"
                        : "400"
                    }
                    noOfLines={1}
                  >
                    {option.label}
                  </Text>

                  {option.value === value && (
                    <LuCheck
                      size={16}
                      color="#ae2050"
                      flexShrink={0}
                    />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={0.5}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

/* =========================================================
   SIMPLE STATE DROPDOWN
========================================================= */

const SimpleDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isInvalid = false,
  height = "40px",
  label,
  error,
}) => {
  return (
    <Box width="100%">
      {label && (
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.700"
          mb={0.5}
        >
          {label}
        </Text>
      )}

      <select
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={isDisabled}
        style={{
          width: "100%",
          height: height,
          fontSize: "13px",
          borderRadius: "6px",
          border: `1.5px solid ${
            isInvalid
              ? "#e53e3e"
              : "#e2e8f0"
          }`,
          padding: "0 10px",
          color: "#1a202c",
          background: isDisabled
            ? "#f7fafc"
            : "white",
          cursor: isDisabled
            ? "not-allowed"
            : "pointer",
          outline: "none",
          transition:
            "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!isDisabled) {
            e.target.style.borderColor =
              "#ae2050";
          }
        }}
        onBlur={(e) => {
          if (!isDisabled) {
            e.target.style.borderColor =
              isInvalid
                ? "#e53e3e"
                : "#e2e8f0";
          }
        }}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={0.5}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

/* =========================================================
   PHONE INPUT
========================================================= */

const PhoneInputWithCountry = ({
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
}) => {
  const [isOpen, setIsOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const [selectedCountry, setSelectedCountry] =
    useState(null);

  // IMPORTANT:
  // This contains ONLY the local phone number.
  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [phoneError, setPhoneError] =
    useState("");

  /* ---------------------------------------------------------
     Countries
  --------------------------------------------------------- */

  const countryList = useMemo(() => {
    const countries =
      Country.getAllCountries();

    return countries
      .map((country) => ({
        value: country.isoCode,
        label: country.name,
        flag: country.isoCode,
        phoneCode: country.phonecode,
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label)
      );
  }, []);

  /* ---------------------------------------------------------
     Default country
  --------------------------------------------------------- */

  useEffect(() => {
    const defaultCountry =
      countryList.find(
        (c) => c.value === "IN"
      ) || countryList[0];

    if (
      defaultCountry &&
      !selectedCountry
    ) {
      setSelectedCountry(defaultCountry);
    }
  }, [
    countryList,
    selectedCountry,
  ]);

  /* ---------------------------------------------------------
     Existing phone value
     Convert +919876543210
     to 9876543210 in visible input
  --------------------------------------------------------- */

  useEffect(() => {
    if (!value) {
      setPhoneNumber("");
      return;
    }

    try {
      const parsed =
        parsePhoneNumberFromString(value);

      if (parsed) {
        const country =
          countryList.find(
            (c) =>
              c.value === parsed.country
          );

        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(
            parsed.nationalNumber || ""
          );
          return;
        }
      }
    } catch (err) {
      // Ignore parsing errors while typing
    }

    setPhoneNumber(
      value.replace(/\D/g, "")
    );
  }, [value, countryList]);

  /* ---------------------------------------------------------
     Close dropdown
  --------------------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  /* ---------------------------------------------------------
     Search focus
  --------------------------------------------------------- */

  useEffect(() => {
    if (
      isOpen &&
      searchRef.current
    ) {
      setTimeout(() => {
        searchRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  /* ---------------------------------------------------------
     Filter countries
  --------------------------------------------------------- */

  const filteredCountries =
    searchTerm
      ? countryList.filter(
          (country) =>
            country.label
              .toLowerCase()
              .includes(
                searchTerm.toLowerCase()
              ) ||
            country.phoneCode.includes(
              searchTerm
            )
        )
      : countryList;

  /* ---------------------------------------------------------
     Country selection
  --------------------------------------------------------- */

  const handleCountrySelect = (
    country
  ) => {
    setSelectedCountry(country);

    setIsOpen(false);
    setSearchTerm("");
    setPhoneError("");

    const cleanNumber =
      phoneNumber.replace(/\D/g, "");

    setPhoneNumber(cleanNumber);

    if (cleanNumber) {
      onChange(
        `+${country.phoneCode}${cleanNumber}`
      );
    } else {
      onChange("");
    }
  };

  /* ---------------------------------------------------------
     Phone change
  --------------------------------------------------------- */

  const handlePhoneChange = (e) => {
    const localNumber =
      e.target.value.replace(
        /\D/g,
        ""
      );

    setPhoneNumber(localNumber);
    setPhoneError("");

    if (!selectedCountry) {
      onChange(localNumber);
      return;
    }

    const fullNumber = localNumber
      ? `+${selectedCountry.phoneCode}${localNumber}`
      : "";

    // Backend receives complete number
    onChange(fullNumber);

    if (localNumber.length >= 4) {
      try {
        const phone =
          parsePhoneNumberFromString(
            fullNumber
          );

        if (
          phone &&
          phone.isValid()
        ) {
          setPhoneError("");
        } else {
          setPhoneError(
            "Invalid phone number"
          );
        }
      } catch (err) {
        setPhoneError(
          "Invalid phone number"
        );
      }
    }
  };

  return (
    <Box width="100%">
      <Flex gap={2}>

        {/* COUNTRY SELECTOR */}

        <Box
          ref={containerRef}
          position="relative"
          flexShrink={0}
        >
          <Box
            onClick={() =>
              setIsOpen(!isOpen)
            }
            cursor="pointer"
            border="1.5px solid"
            borderColor={
              isInvalid ||
              phoneError
                ? "#e53e3e"
                : isOpen
                ? "#ae2050"
                : "#e2e8f0"
            }
            borderRadius="md"
            height="36px"
            px={2.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="white"
            minW="90px"
            _hover={{
              borderColor:
                isInvalid ||
                phoneError
                  ? "#e53e3e"
                  : "#cbd5e0",
            }}
            transition="all 0.2s"
          >
            {selectedCountry && (
              <Flex
                align="center"
                gap={1.5}
              >
                <ReactCountryFlag
                  countryCode={
                    selectedCountry.value
                  }
                  svg
                  style={{
                    width: "20px",
                    height: "15px",
                    objectFit: "cover",
                    borderRadius:
                      "2px",
                  }}
                />

                <Text
                  fontSize="12px"
                  fontWeight="600"
                  color="gray.700"
                >
                  +
                  {
                    selectedCountry.phoneCode
                  }
                </Text>

                <LuChevronDown
                  size={12}
                  color={
                    isOpen
                      ? "#ae2050"
                      : "#718096"
                  }
                  style={{
                    transform:
                      isOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition:
                      "transform 0.2s ease",
                  }}
                />
              </Flex>
            )}
          </Box>

          {/* COUNTRY MENU */}

          {isOpen && (
            <Box
              position="absolute"
              left="0"
              top="calc(100% + 4px)"
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="xl"
              zIndex={1000}
              width="260px"
              maxHeight="320px"
              overflow="hidden"
            >
              <Box
                p={2}
                borderBottom="1px solid"
                borderColor="gray.100"
                bg="gray.50"
              >
                <Flex
                  align="center"
                  gap={2}
                  bg="white"
                  px={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <LuSearch
                    size={14}
                    color="#718096"
                  />

                  <Input
                    ref={searchRef}
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    border="none"
                    _focus={{
                      boxShadow:
                        "none",
                    }}
                    height="28px"
                    fontSize="13px"
                    px={0}
                  />
                </Flex>
              </Box>

              <Box
                maxHeight="230px"
                overflowY="auto"
              >
                {filteredCountries.length ===
                0 ? (
                  <Box
                    px={4}
                    py={6}
                    textAlign="center"
                  >
                    <Text
                      fontSize="sm"
                      color="gray.400"
                    >
                      No countries found
                    </Text>
                  </Box>
                ) : (
                  filteredCountries.map(
                    (country) => (
                      <Box
                        key={
                          country.value
                        }
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{
                          bg: "gray.50",
                        }}
                        onClick={() =>
                          handleCountrySelect(
                            country
                          )
                        }
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Flex
                          align="center"
                          gap={2}
                        >
                          <ReactCountryFlag
                            countryCode={
                              country.value
                            }
                            svg
                            style={{
                              width:
                                "22px",
                              height:
                                "16px",
                              objectFit:
                                "cover",
                              borderRadius:
                                "2px",
                            }}
                          />

                          <Box>
                            <Text fontSize="13px">
                              {
                                country.label
                              }
                            </Text>

                            <Text
                              fontSize="10px"
                              color="gray.400"
                            >
                              +
                              {
                                country.phoneCode
                              }
                            </Text>
                          </Box>
                        </Flex>

                        {country.value ===
                          selectedCountry?.value && (
                          <LuCheck
                            size={16}
                            color="#ae2050"
                          />
                        )}
                      </Box>
                    )
                  )
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* PHONE INPUT ONLY LOCAL NUMBER */}

        <Box flex="1">
          <Input
            value={phoneNumber}
            onChange={
              handlePhoneChange
            }
            placeholder={
              placeholder ||
              "Enter phone number"
            }
            height="36px"
            fontSize="13px"
            borderColor={
              isInvalid ||
              phoneError
                ? "red.500"
                : "gray.200"
            }
            borderWidth="1.5px"
            pl={2.5}
            _focus={{
              borderColor:
                isInvalid ||
                phoneError
                  ? "red.500"
                  : "#ae2050",
              boxShadow:
                "0 0 0 1px rgba(174,32,80,0.15)",
            }}
          />

          {(error ||
            phoneError) && (
            <Text
              fontSize="xs"
              color="red.500"
              mt={0.5}
            >
              {error ||
                phoneError}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

/* =========================================================
   DIOCESE ADD
========================================================= */

const DioceseAdd = () => {
  const navigate =
    useNavigate();

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isLoadingStates,
    setIsLoadingStates,
  ] = useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      metropolitan_name: "",
      email: "",
      phone_number: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      website: "",
      is_active: true,
    });

  const [errors, setErrors] =
    useState({});

  const [countryOptions, setCountryOptions] =
    useState([]);

  const [stateOptions, setStateOptions] =
    useState([]);

  const [dioceseCount, setDioceseCount] =
    useState(0);

  const primaryMaroon =
    "#ae2050";

  /* =========================================================
     LOAD COUNTRIES
  ========================================================= */

  useEffect(() => {
    const loadCountries =
      async () => {
        try {
          const countries =
            Country.getAllCountries();

          const options =
            countries
              .map((country) => ({
                value:
                  country.isoCode,
                label:
                  country.name,
              }))
              .sort((a, b) =>
                a.label.localeCompare(
                  b.label
                )
              );

          setCountryOptions(
            options
          );

          try {
            const response =
              await adminApi.getDioceses();

            setDioceseCount(
              response.data
                ?.length || 0
            );
          } catch (error) {
            console.error(
              "Error fetching diocese count:",
              error
            );
          }
        } catch (error) {
          console.error(
            "Error loading countries:",
            error
          );

          toaster.create({
            title: "Error",
            description:
              "Failed to load countries. Please refresh the page.",
            type: "error",
            duration: 5000,
          });
        }
      };

    loadCountries();
  }, []);

  /* =========================================================
     LOAD STATES WHEN COUNTRY CHANGES
  ========================================================= */

  useEffect(() => {
    if (formData.country) {
      setIsLoadingStates(
        true
      );

      try {
        const states =
          State.getStatesOfCountry(
            formData.country
          );

        if (
          states &&
          states.length > 0
        ) {
          const options =
            states
              .map((state) => ({
                value:
                  state.isoCode ||
                  state.name,
                label:
                  state.name,
              }))
              .sort((a, b) =>
                a.label.localeCompare(
                  b.label
                )
              );

          setStateOptions(
            options
          );
        } else {
          setStateOptions([]);
        }

        setFormData((prev) => ({
          ...prev,
          state: "",
          city: "",
        }));
      } catch (error) {
        console.error(
          "Error loading states:",
          error
        );

        setStateOptions([]);

        toaster.create({
          title: "Error",
          description:
            "Failed to load states for the selected country.",
          type: "error",
          duration: 4000,
        });
      } finally {
        setIsLoadingStates(
          false
        );
      }
    } else {
      setStateOptions([]);

      setFormData((prev) => ({
        ...prev,
        state: "",
        city: "",
      }));
    }
  }, [formData.country]);

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* =========================================================
     PHONE CHANGE
  ========================================================= */

  const handlePhoneChange = (
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      phone_number: value,
    }));

    if (errors.phone_number) {
      setErrors((prev) => ({
        ...prev,
        phone_number: "",
      }));
    }
  };

  /* =========================================================
     DROPDOWN CHANGE
  ========================================================= */

  const handleSelectChange = (
    name,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
        state: "",
        city: "",
      }));

      setStateOptions([]);
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validate = () => {
    const newErrors = {};

    /* Diocese name */

    if (!formData.name.trim()) {
      newErrors.name =
        "Diocese name is required";
    }

    /* Country */

    if (!formData.country) {
      newErrors.country =
        "Country is required";
    }

    /* Email */

    if (!formData.email.trim()) {
      newErrors.email =
        "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email =
        "Invalid email format";
    }

    /* Website */

    if (
      formData.website.trim()
    ) {
      let website =
        formData.website.trim();

      if (
        !/^https?:\/\//i.test(
          website
        )
      ) {
        website =
          `https://${website}`;
      }

      try {
        const url =
          new URL(website);

        if (
          !url.hostname ||
          !url.hostname.includes(".")
        ) {
          newErrors.website =
            "Please enter a valid website URL";
        }
      } catch (error) {
        newErrors.website =
          "Please enter a valid website URL";
      }
    }

    /* Phone */

    if (!formData.phone_number) {
      newErrors.phone_number =
        "Phone number is required";
    } else {
      try {
        const phone =
          parsePhoneNumberFromString(
            formData.phone_number
          );

        if (
          !phone ||
          !phone.isValid()
        ) {
          newErrors.phone_number =
            "Invalid phone number";
        }
      } catch (error) {
        newErrors.phone_number =
          "Invalid phone number format";
      }
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const code = `DIO-${String(
        dioceseCount + 1
      ).padStart(3, "0")}`;

      /* Normalize website */

      let website =
        formData.website.trim();

      if (
        website &&
        !/^https?:\/\//i.test(
          website
        )
      ) {
        website =
          `https://${website}`;
      }

      const submitData = {
        name:
          formData.name.trim(),

        metropolitan_name:
          formData.metropolitan_name.trim(),

        email:
          formData.email.trim(),

        phone_number:
          formData.phone_number,

        address_line1:
          formData.address_line1.trim(),

        address_line2:
          formData.address_line2.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state,

        country:
          formData.country,

        postal_code:
          formData.postal_code.trim(),

        website:
          website,

        code:
          code,

        is_active:
          formData.is_active,
      };

      await adminApi.createDiocese(
        submitData
      );

      toaster.create({
        title: "Success",
        description:
          `Diocese ${code} created successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate(
        "/admin/dioceses"
      );
    } catch (error) {
      console.error(
        "Error creating diocese:",
        error
      );

      let errorMsg =
        "Failed to create diocese.";

      if (
        error.response?.data
      ) {
        if (
          typeof error.response
            .data === "object"
        ) {
          const errs = [];

          Object.entries(
            error.response.data
          ).forEach(
            ([field, value]) => {
              if (
                field !== "status" &&
                field !== "message"
              ) {
                errs.push(
                  `${field}: ${
                    Array.isArray(
                      value
                    )
                      ? value.join(
                          ", "
                        )
                      : value
                  }`
                );
              }
            }
          );

          if (errs.length > 0) {
            errorMsg =
              errs.join("; ");
          } else if (
            error.response.data
              .message
          ) {
            errorMsg =
              error.response.data
                .message;
          } else if (
            error.response.data
              .error
          ) {
            errorMsg =
              error.response.data
                .error;
          } else if (
            error.response.data
              .detail
          ) {
            errorMsg =
              error.response.data
                .detail;
          }
        } else if (
          typeof error.response
            .data === "string"
        ) {
          errorMsg =
            error.response.data;
        }
      }

      toaster.create({
        title: "Error",
        description:
          errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     PREVIEW CODE
  ========================================================= */

  const previewCode =
    `DIO-${String(
      dioceseCount + 1
    ).padStart(3, "0")}`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AdminLayout>
      <Container
        maxW="container.xl"
        py={0}
      >
        {/* Breadcrumb */}

        <Text
          fontSize="10px"
          color="gray.400"
          fontWeight="600"
          mb={0.5}
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          Churches / Dioceses /
          Register Diocese
        </Text>

        {/* Page Header */}

        <VStack
          align="start"
          spacing={0}
          mb={0.5}
        >
          <Text
            fontSize="10px"
            fontWeight="700"
            color={
              primaryMaroon
            }
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Diocese Management
          </Text>

          <Heading
            fontSize="sm"
            fontWeight="800"
            color="#1a1a2e"
            mb={0}
          >
            Register New Diocese
          </Heading>

          <Text
            color="gray.500"
            fontSize="10px"
          >
            Create a diocese profile
            with metropolitan,
            contact and address
            information.
          </Text>
        </VStack>

        {/* Main Card */}

        <Box
          bg="white"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          p={2.5}
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <form
            onSubmit={handleSubmit}
          >
            <VStack
              spacing={2}
              align="stretch"
            >

              {/* =====================================================
                  ROW 1
              ===================================================== */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1.5fr",
                }}
                gap={2}
              >
                {/* Diocese Code */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Diocese Code
                  </Text>

                  <Box
                    bg="gray.50"
                    px={3}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    height="36px"
                    display="flex"
                    alignItems="center"
                  >
                    <HStack spacing={2}>
                      <Icon
                        as={LuHash}
                        color="gray.400"
                        boxSize={4}
                      />

                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={
                          primaryMaroon
                        }
                      >
                        {previewCode}
                      </Text>

                      <Text
                        fontSize="xs"
                        color="gray.400"
                      >
                        (Auto)
                      </Text>
                    </HStack>
                  </Box>
                </GridItem>

                {/* Diocese Name */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Diocese Name{" "}
                    <span
                      style={{
                        color:
                          "#e53e3e",
                      }}
                    >
                      *
                    </span>
                  </Text>

                  <Input
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g., Archdiocese of Mumbai"
                    borderColor={
                      errors.name
                        ? "red.500"
                        : "gray.200"
                    }
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />

                  {errors.name && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.name}
                    </Text>
                  )}
                </GridItem>
              </Grid>

              {/* =====================================================
                  METROPOLITAN
              ===================================================== */}

              <Grid
                templateColumns={{
                  base: "1fr",
                }}
                gap={2}
              >
                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Metropolitan Name
                  </Text>

                  <Input
                    name="metropolitan_name"
                    value={
                      formData.metropolitan_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g., Most Rev. Dr. John Mathew"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />
                </GridItem>
              </Grid>

              {/* =====================================================
                  CONTACT
              ===================================================== */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr 1fr",
                }}
                gap={2}
              >
                {/* EMAIL */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Email{" "}
                    <span
                      style={{
                        color:
                          "#e53e3e",
                      }}
                    >
                      *
                    </span>
                  </Text>

                  <Box
                    position="relative"
                  >
                    <Icon
                      as={LuMail}
                      position="absolute"
                      left="10px"
                      top="50%"
                      transform="translateY(-50%)"
                      boxSize="16px"
                      color="gray.400"
                      zIndex={1}
                      pointerEvents="none"
                    />

                    <Input
                      name="email"
                      type="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="metropolitan@diocese.org"
                      borderColor={
                        errors.email
                          ? "red.500"
                          : "gray.200"
                      }
                      height="36px"
                      fontSize="13px"
                      pl="34px"
                      borderWidth="1.5px"
                      bg="white"
                      _focus={{
                        borderColor:
                          "#ae2050",
                        boxShadow:
                          "0 0 0 1px rgba(174,32,80,0.1)",
                      }}
                    />
                  </Box>

                  {errors.email && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.email}
                    </Text>
                  )}
                </GridItem>

                {/* WEBSITE */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Website
                  </Text>

                  <Box
                    position="relative"
                  >
                    <Icon
                      as={LuGlobe}
                      position="absolute"
                      left="10px"
                      top="50%"
                      transform="translateY(-50%)"
                      boxSize="16px"
                      color="gray.400"
                      zIndex={1}
                      pointerEvents="none"
                    />

                    <Input
                      name="website"
                      type="text"
                      value={
                        formData.website
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://www.diocese.org"
                      borderColor={
                        errors.website
                          ? "red.500"
                          : "gray.200"
                      }
                      height="36px"
                      fontSize="13px"
                      pl="34px"
                      borderWidth="1.5px"
                      bg="white"
                      _focus={{
                        borderColor:
                          "#ae2050",
                        boxShadow:
                          "0 0 0 1px rgba(174,32,80,0.1)",
                      }}
                    />
                  </Box>

                  {errors.website && (
                    <Text
                      fontSize="xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {
                        errors.website
                      }
                    </Text>
                  )}
                </GridItem>

                {/* PHONE */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Contact{" "}
                    <span
                      style={{
                        color:
                          "#e53e3e",
                      }}
                    >
                      *
                    </span>
                  </Text>

                  <PhoneInputWithCountry
                    value={
                      formData.phone_number
                    }
                    onChange={
                      handlePhoneChange
                    }
                    placeholder="Phone number"
                    isInvalid={
                      !!errors.phone_number
                    }
                    error={
                      errors.phone_number
                    }
                  />
                </GridItem>
              </Grid>

              {/* =====================================================
                  ADDRESS HEADER
              ===================================================== */}

              <Box pt={1}>
                <Heading
                  size="sm"
                  fontWeight="700"
                  color="gray.800"
                  mb={0.5}
                >
                  Address Information
                </Heading>
              </Box>

              {/* =====================================================
                  ADDRESS LINES
              ===================================================== */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr",
                }}
                gap={2}
              >
                {/* Address Line 1 */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Address Line 1
                  </Text>

                  <Input
                    name="address_line1"
                    value={
                      formData.address_line1
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Street address, building name"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />
                </GridItem>

                {/* Address Line 2 */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Address Line 2
                  </Text>

                  <Input
                    name="address_line2"
                    value={
                      formData.address_line2
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Apartment, suite, unit"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />
                </GridItem>
              </Grid>

              {/* =====================================================
                  CITY | COUNTRY | STATE | POSTAL
              ===================================================== */}

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "1fr 1fr 1fr 1fr",
                }}
                gap={2.5}
              >
                {/* CITY */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    City
                  </Text>

                  <Input
                    name="city"
                    value={
                      formData.city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter city"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />
                </GridItem>

                {/* COUNTRY */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Country{" "}
                    <span
                      style={{
                        color:
                          "#e53e3e",
                      }}
                    >
                      *
                    </span>
                  </Text>

                  <CountryDropdown
                    options={
                      countryOptions
                    }
                    value={
                      formData.country
                    }
                    onChange={(value) =>
                      handleSelectChange(
                        "country",
                        value
                      )
                    }
                    placeholder="Select Country"
                    isInvalid={
                      !!errors.country
                    }
                    error={
                      errors.country
                    }
                    height="36px"
                  />
                </GridItem>

                {/* STATE */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    State / Province
                  </Text>

                  {isLoadingStates ? (
                    <Flex
                      align="center"
                      gap={2}
                      height="36px"
                      bg="gray.50"
                      px={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Spinner
                        size="xs"
                        color={
                          primaryMaroon
                        }
                      />

                      <Text
                        fontSize="xs"
                        color="gray.500"
                      >
                        Loading...
                      </Text>
                    </Flex>
                  ) : stateOptions.length >
                    0 ? (
                    <SimpleDropdown
                      options={
                        stateOptions
                      }
                      value={
                        formData.state
                      }
                      onChange={(value) =>
                        handleSelectChange(
                          "state",
                          value
                        )
                      }
                      placeholder="Select State"
                      isDisabled={
                        !formData.country
                      }
                      isInvalid={
                        !!errors.state
                      }
                      error={
                        errors.state
                      }
                      height="36px"
                    />
                  ) : (
                    <Box
                      bg="gray.50"
                      px={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      height="36px"
                      display="flex"
                      alignItems="center"
                    >
                      <Text
                        color="gray.500"
                        fontSize="xs"
                      >
                        {formData.country
                          ? "No states available"
                          : "Select country first"}
                      </Text>
                    </Box>
                  )}
                </GridItem>

                {/* POSTAL CODE */}

                <GridItem>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.700"
                    mb={0.5}
                  >
                    Postal Code
                  </Text>

                  <Input
                    name="postal_code"
                    value={
                      formData.postal_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter postal code"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{
                      borderColor:
                        "#ae2050",
                      boxShadow:
                        "0 0 0 1px rgba(174,32,80,0.1)",
                    }}
                  />
                </GridItem>
              </Grid>

              {/* =====================================================
                  INFO BOX
              ===================================================== */}

              <Box
                bg="rgba(174,32,80,0.04)"
                p={2.5}
                borderRadius="md"
                border="1px solid"
                borderColor="rgba(174,32,80,0.12)"
              >
                <Flex
                  align="flex-start"
                  gap={2}
                >
                  <Icon
                    as={LuCircleHelp}
                    boxSize={3.5}
                    color={
                      primaryMaroon
                    }
                    flexShrink={0}
                    mt={0.5}
                  />

                  <Text
                    fontSize="xs"
                    color="gray.700"
                    lineHeight="1.4"
                  >
                    The diocese will be
                    assigned code{" "}
                    <strong>
                      {previewCode}
                    </strong>{" "}
                    and can be assigned
                    to churches after
                    registration.
                  </Text>
                </Flex>
              </Box>

              {/* =====================================================
                  ACTIONS
              ===================================================== */}

              <Flex
                gap={2}
                pt={2.5}
                borderTop="1px solid"
                borderColor="gray.100"
                justify="space-between"
              >
                {/* BACK BUTTON */}

                <Button
                  type="button"
                  variant="outline"
                  borderColor="gray.300"
                  color="gray.700"
                  height="36px"
                  px={5}
                  fontSize="sm"
                  fontWeight="600"
                  onClick={() =>
                    navigate(
                      "/admin/dioceses"
                    )
                  }
                  _hover={{
                    bg: "gray.50",
                    borderColor:
                      "gray.400",
                  }}
                  leftIcon={
                    <LuArrowLeft
                      size={15}
                    />
                  }
                >
                  Back
                </Button>

                {/* REGISTER */}

                <Button
                  bg={
                    primaryMaroon
                  }
                  color="white"
                  _hover={{
                    bg: "#8a1a3e",
                    transform:
                      "translateY(-1px)",
                    boxShadow:
                      "0 4px 12px rgba(174,32,80,0.3)",
                  }}
                  _active={{
                    transform:
                      "translateY(0)",
                  }}
                  type="submit"
                  isLoading={
                    isLoading
                  }
                  loadingText="Creating..."
                  height="36px"
                  px={8}
                  fontSize="sm"
                  fontWeight="600"
                  leftIcon={
                    <LuSave
                      size={16}
                    />
                  }
                  transition="all 0.2s"
                >
                  Register Diocese
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default DioceseAdd;