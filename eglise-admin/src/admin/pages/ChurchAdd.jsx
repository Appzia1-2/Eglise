
// src/admin/pages/ChurchAdd.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
  Image,
} from "@chakra-ui/react";

import {
  LuSave,
  LuCircleHelp,
  LuMail,
  LuGlobe,
  LuChevronDown,
  LuX,
  LuCheck,
  LuSearch,
  LuPhone,
  LuChurch,
  LuUpload,
  LuCalendar,
} from "react-icons/lu";

import {
  Country,
  State,
} from "country-state-city";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

import ReactCountryFlag from "react-country-flag";

import {
  parsePhoneNumberFromString,
} from "libphonenumber-js";

const primaryMaroon = "#ae2050";
const lightGray = "#718096";

/* =======================================================
   PHONE INPUT WITH COUNTRY SELECTION

   IMPORTANT:
   Country code is shown ONLY in country selector.
   It is NOT shown inside the phone input.

   Example:
   Country selector: 🇮🇳 +91
   Phone input:      9876543210

   Backend receives:
   +919876543210
======================================================= */

const PhoneInputWithCountry = ({
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const [selectedCountry, setSelectedCountry] =
    useState(null);

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [phoneError, setPhoneError] =
    useState("");

  /* -----------------------------------------------------
     COUNTRY LIST
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     GET LOCAL NUMBER FROM FULL NUMBER

     +919876543210 -> 9876543210
  ----------------------------------------------------- */

  const getLocalNumber = (
    fullNumber,
    country
  ) => {
    if (!fullNumber) return "";

    const digits = String(fullNumber).replace(
      /\D/g,
      ""
    );

    if (!country?.phoneCode) {
      return digits;
    }

    const code = String(country.phoneCode);

    if (digits.startsWith(code)) {
      return digits.slice(code.length);
    }

    return digits;
  };

  /* -----------------------------------------------------
     INITIALIZE COUNTRY

     Do NOT add country code to input.
  ----------------------------------------------------- */

  useEffect(() => {
    if (!countryList.length) return;

    let defaultCountry =
      countryList.find(
        (country) =>
          country.value === "IN"
      ) || countryList[0];

    /*
     * If existing value contains +countrycode,
     * try to detect the country automatically.
     */
    if (value) {
      const parsed =
        parsePhoneNumberFromString(
          String(value)
        );

      if (parsed?.country) {
        const detected =
          countryList.find(
            (country) =>
              country.value ===
              parsed.country
          );

        if (detected) {
          defaultCountry = detected;
        }
      }
    }

    setSelectedCountry(
      defaultCountry
    );

    /*
     * Only local number goes into input.
     */
    const localNumber =
      getLocalNumber(
        value,
        defaultCountry
      );

    setPhoneNumber(localNumber);
  }, [countryList]);

  /* -----------------------------------------------------
     SYNC VALUE FROM PARENT
  ----------------------------------------------------- */

  useEffect(() => {
    if (!selectedCountry) return;

    const localNumber =
      getLocalNumber(
        value,
        selectedCountry
      );

    /*
     * Avoid changing the input while user is typing
     * unnecessarily.
     */
    if (localNumber !== phoneNumber) {
      setPhoneNumber(localNumber);
    }
  }, [value, selectedCountry]);

  /* -----------------------------------------------------
     CLOSE OUTSIDE
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     FOCUS SEARCH
  ----------------------------------------------------- */

  useEffect(() => {
    if (
      isOpen &&
      searchRef.current
    ) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /* -----------------------------------------------------
     FILTER COUNTRIES
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     COUNTRY SELECT
  ----------------------------------------------------- */

  const handleCountrySelect = (
    country
  ) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");

    /*
     * Clear local number when changing country.
     * Country code is NOT inserted into input.
     */
    setPhoneNumber("");
    setPhoneError("");

    if (onChange) {
      onChange("");
    }
  };

  /* -----------------------------------------------------
     PHONE CHANGE
  ----------------------------------------------------- */

  const handlePhoneChange = (
    e
  ) => {
    /*
     * Only digits are allowed.
     * No +91 / +1 etc. in the visible input.
     */
    const cleaned =
      e.target.value.replace(
        /\D/g,
        ""
      );

    setPhoneNumber(cleaned);

    /*
     * Send ONLY local number to parent.
     * Country code is added during submit.
     */
    if (onChange) {
      onChange(cleaned);
    }

    if (cleaned.length >= 4) {
      try {
        if (!selectedCountry) {
          setPhoneError("");
          return;
        }

        const fullNumber =
          `+${selectedCountry.phoneCode}${cleaned}`;

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
            "Invalid phone number format"
          );
        }
      } catch {
        setPhoneError(
          "Invalid phone number"
        );
      }
    } else {
      setPhoneError("");
    }
  };

  /* -----------------------------------------------------
     COUNTRY SELECTOR DISPLAY
  ----------------------------------------------------- */

  const getDisplayValue = () => {
    if (!selectedCountry) {
      return (
        <Text
          fontSize="12px"
          color="gray.400"
        >
          Select
        </Text>
      );
    }

    return (
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
            width: "18px",
            height: "18px",
            borderRadius: "2px",
          }}
        />

        <Text
          fontSize="12px"
          fontWeight="600"
          color="gray.700"
        >
          +{selectedCountry.phoneCode}
        </Text>
      </Flex>
    );
  };

  return (
    <Box width="100%">
      {label && (
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.700"
          mb={1}
        >
          {label}
        </Text>
      )}

      <Flex gap={2}>
        {/* COUNTRY CODE SELECTOR */}

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
                ? primaryMaroon
                : "#e2e8f0"
            }
            borderRadius="md"
            height="42px"
            px={3}
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
            {getDisplayValue()}

            <LuChevronDown
              size={12}
              style={{
                transform: isOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition:
                  "transform 0.25s ease",
                color: isOpen
                  ? primaryMaroon
                  : "#718096",
                marginLeft: "4px",
              }}
            />
          </Box>

          {/* COUNTRY SEARCH DROPDOWN */}

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
              maxHeight="320px"
              overflow="hidden"
              minW="250px"
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
                  px={3}
                  py={1.5}
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
                      boxShadow: "none",
                    }}
                    bg="transparent"
                    px={0}
                    height="28px"
                    fontSize="14px"
                  />

                  {searchTerm && (
                    <Box
                      as="button"
                      type="button"
                      onClick={() =>
                        setSearchTerm("")
                      }
                      color="gray.400"
                    >
                      <LuX size={14} />
                    </Box>
                  )}
                </Flex>
              </Box>

              <Box
                maxHeight="230px"
                overflowY="auto"
                css={{
                  "&::-webkit-scrollbar":
                    {
                      width: "4px",
                    },
                  "&::-webkit-scrollbar-track":
                    {
                      background:
                        "#f7fafc",
                    },
                  "&::-webkit-scrollbar-thumb":
                    {
                      background:
                        "#cbd5e0",
                      borderRadius:
                        "24px",
                    },
                }}
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
                        px={4}
                        py={2.5}
                        cursor="pointer"
                        _hover={{
                          bg: "gray.50",
                        }}
                        onClick={() =>
                          handleCountrySelect(
                            country
                          )
                        }
                        bg={
                          country.value ===
                          selectedCountry?.value
                            ? "purple.50"
                            : "transparent"
                        }
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Flex
                          align="center"
                          gap={2}
                          flex="1"
                        >
                          <ReactCountryFlag
                            countryCode={
                              country.value
                            }
                            svg
                            style={{
                              width:
                                "20px",
                              height:
                                "20px",
                              borderRadius:
                                "2px",
                            }}
                          />

                          <Box>
                            <Text
                              fontSize="14px"
                              color={
                                country.value ===
                                selectedCountry?.value
                                  ? primaryMaroon
                                  : "gray.700"
                              }
                              fontWeight={
                                country.value ===
                                selectedCountry?.value
                                  ? "600"
                                  : "400"
                              }
                            >
                              {
                                country.label
                              }
                            </Text>

                            <Text
                              fontSize="11px"
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
                            color={
                              primaryMaroon
                            }
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

        {/* PHONE INPUT */}

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
            height="42px"
            fontSize="14px"
            borderColor={
              isInvalid ||
              phoneError
                ? "red.500"
                : "gray.200"
            }
            borderWidth="1.5px"
            pl={3}
            _focus={{
              borderColor:
                isInvalid ||
                phoneError
                  ? "red.500"
                  : primaryMaroon,
              boxShadow: `0 0 0 1px ${primaryMaroon}`,
            }}
          />

          {(error ||
            phoneError) && (
            <Text
              fontSize="xs"
              color="red.500"
              mt={1}
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

/* =======================================================
   SEARCHABLE DROPDOWN
======================================================= */

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isInvalid = false,
  height = "42px",
  label,
  error,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const containerRef =
    useRef(null);

  const searchRef =
    useRef(null);

  const selectedOption =
    options.find(
      (option) =>
        String(option.value) ===
        String(value)
    );

  const filteredOptions =
    searchTerm
      ? options.filter((option) =>
          String(option.label)
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )
        )
      : options;

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

  useEffect(() => {
    if (
      isOpen &&
      searchRef.current
    ) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (
    option
  ) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
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
          mb={1}
        >
          {label}
        </Text>
      )}

      <Box
        onClick={() =>
          !isDisabled &&
          setIsOpen(!isOpen)
        }
        cursor={
          isDisabled
            ? "not-allowed"
            : "pointer"
        }
        border="1.5px solid"
        borderColor={
          isInvalid
            ? "#e53e3e"
            : isOpen
            ? primaryMaroon
            : "#e2e8f0"
        }
        borderRadius="md"
        height={height}
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={
          isDisabled
            ? "gray.50"
            : "white"
        }
        opacity={
          isDisabled ? 0.7 : 1
        }
      >
        <Text
          noOfLines={1}
          textAlign="left"
          fontWeight={
            selectedOption
              ? "500"
              : "400"
          }
          fontSize="14px"
          color={
            selectedOption
              ? "gray.700"
              : "gray.400"
          }
        >
          {selectedOption
            ? selectedOption.label
            : placeholder}
        </Text>

        <LuChevronDown
          size={16}
          style={{
            transform: isOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition:
              "transform 0.25s ease",
            color: isOpen
              ? primaryMaroon
              : "#718096",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        />
      </Box>

      {isOpen &&
        !isDisabled && (
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
            {/* SEARCH */}

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
                px={3}
                py={1.5}
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
                  placeholder={
                    searchPlaceholder
                  }
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  border="none"
                  _focus={{
                    boxShadow: "none",
                  }}
                  bg="transparent"
                  px={0}
                  height="28px"
                  fontSize="14px"
                />

                {searchTerm && (
                  <Box
                    as="button"
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                    color="gray.400"
                  >
                    <LuX size={14} />
                  </Box>
                )}
              </Flex>
            </Box>

            {/* OPTIONS */}

            <Box
              maxHeight="220px"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar":
                  {
                    width: "4px",
                  },
                "&::-webkit-scrollbar-track":
                  {
                    background:
                      "#f7fafc",
                  },
                "&::-webkit-scrollbar-thumb":
                  {
                    background:
                      "#cbd5e0",
                    borderRadius:
                      "24px",
                  },
              }}
            >
              {filteredOptions.length ===
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
                    No results found
                  </Text>
                </Box>
              ) : (
                filteredOptions.map(
                  (option) => (
                    <Box
                      key={String(
                        option.value
                      )}
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      _hover={{
                        bg: "gray.50",
                      }}
                      onClick={() =>
                        handleSelect(
                          option
                        )
                      }
                      bg={
                        String(
                          option.value
                        ) ===
                        String(value)
                          ? "purple.50"
                          : "transparent"
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottom="1px solid"
                      borderColor="gray.50"
                    >
                      <Text
                        fontSize="14px"
                        color={
                          String(
                            option.value
                          ) ===
                          String(value)
                            ? primaryMaroon
                            : "gray.700"
                        }
                        fontWeight={
                          String(
                            option.value
                          ) ===
                          String(value)
                            ? "600"
                            : "400"
                        }
                        noOfLines={1}
                      >
                        {
                          option.label
                        }
                      </Text>

                      {String(
                        option.value
                      ) ===
                        String(
                          value
                        ) && (
                        <LuCheck
                          size={16}
                          color={
                            primaryMaroon
                          }
                        />
                      )}
                    </Box>
                  )
                )
              )}
            </Box>
          </Box>
        )}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

/* =======================================================
   YEAR OPTIONS
======================================================= */

const getYearOptions = () => {
  const currentYear =
    new Date().getFullYear();

  const years = [];

  for (
    let year = currentYear;
    year >= 1900;
    year--
  ) {
    years.push({
      value: year.toString(),
      label: year.toString(),
    });
  }

  return years;
};

/* =======================================================
   WEBSITE HELPERS
======================================================= */

const normalizeWebsite = (
  website
) => {
  if (!website) return "";

  let value =
    website.trim();

  if (!value) return "";

  /*
   * Add protocol automatically.
   */
  if (
    !/^https?:\/\//i.test(
      value
    )
  ) {
    value = `https://${value}`;
  }

  return value;
};

const isValidWebsite = (
  website
) => {
  if (!website) return true;

  let value =
    website.trim();

  if (!value) return true;

  /*
   * Allow:
   * example.com
   * www.example.com
   * http://example.com
   * https://example.com
   */
  if (
    !/^https?:\/\//i.test(
      value
    )
  ) {
    value = `https://${value}`;
  }

  try {
    const url =
      new URL(value);

    return (
      ["http:", "https:"].includes(
        url.protocol
      ) &&
      url.hostname.includes(".") &&
      !url.hostname.startsWith(".") &&
      !url.hostname.endsWith(".") &&
      !url.hostname.includes(" ")
    );
  } catch {
    return false;
  }
};

/* =======================================================
   COMPONENT
======================================================= */

const ChurchAdd = () => {
  const navigate =
    useNavigate();

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isLoadingStates,
    setIsLoadingStates,
  ] = useState(false);

  const [
    dioceses,
    setDioceses,
  ] = useState([]);

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    code: "",
    diocese: "",
    established_year: "",
    registration_number: "",
    currency: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    email: "",
    phone: "",
    alternate_phone: "",
    website: "",
    logo: null,
    is_active: true,
  });

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    countryOptions,
    setCountryOptions,
  ] = useState([]);

  const [
    stateOptions,
    setStateOptions,
  ] = useState([]);

  const [
    previewCode,
    setPreviewCode,
  ] = useState("CH-001");

  const [
    logoPreview,
    setLogoPreview,
  ] = useState(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const fileInputRef =
    useRef(null);

  /* =====================================================
     CURRENCY OPTIONS
  ===================================================== */

  const currencyOptions = [
    {
      value: "USD",
      label: "USD ($) — US Dollar",
    },
    {
      value: "EUR",
      label: "EUR (€) — Euro",
    },
    {
      value: "GBP",
      label: "GBP (£) — British Pound",
    },
    {
      value: "INR",
      label: "INR (₹) — Indian Rupee",
    },
    {
      value: "AED",
      label: "AED (د.إ) — UAE Dirham",
    },
    {
      value: "SAR",
      label: "SAR (﷼) — Saudi Riyal",
    },
    {
      value: "SGD",
      label: "SGD (S$) — Singapore Dollar",
    },
    {
      value: "MYR",
      label: "MYR (RM) — Malaysian Ringgit",
    },
    {
      value: "AUD",
      label: "AUD (A$) — Australian Dollar",
    },
    {
      value: "CAD",
      label: "CAD (C$) — Canadian Dollar",
    },
  ];

  const yearOptions =
    useMemo(
      () => getYearOptions(),
      []
    );

  /* =====================================================
     LOAD COUNTRIES + DIOCESES + CHURCH CODE
  ===================================================== */

  useEffect(() => {
    const loadData =
      async () => {
        try {
          /* COUNTRIES */

          const countries =
            Country.getAllCountries();

          const options =
            countries
              .map(
                (country) => ({
                  value:
                    country.isoCode,
                  label:
                    country.name,
                })
              )
              .sort((a, b) =>
                a.label.localeCompare(
                  b.label
                )
              );

          setCountryOptions(
            options
          );

          /* DIOCESES */

          try {
            const response =
              await adminApi.getDioceses();

            setDioceses(
              response.data || []
            );
          } catch (error) {
            console.error(
              "Error fetching dioceses:",
              error
            );
          }

          /* CHURCH CODE */

          try {
            const response =
              await adminApi.getChurches();

            const count =
              response.data
                ?.length || 0;

            const code = `CH-${String(
              count + 1
            ).padStart(
              3,
              "0"
            )}`;

            setPreviewCode(
              code
            );

            setFormData(
              (prev) => ({
                ...prev,
                code,
              })
            );
          } catch (error) {
            console.error(
              "Error fetching church count:",
              error
            );

            setPreviewCode(
              "CH-001"
            );

            setFormData(
              (prev) => ({
                ...prev,
                code: "CH-001",
              })
            );
          }
        } catch (error) {
          console.error(
            "Error loading data:",
            error
          );

          toaster.create({
            title: "Error",
            description:
              "Failed to load necessary data. Please refresh.",
            type: "error",
            duration: 5000,
          });
        }
      };

    loadData();
  }, []);

  /* =====================================================
     LOAD STATES WHEN COUNTRY CHANGES
  ===================================================== */

  useEffect(() => {
    if (!formData.country) {
      setStateOptions([]);

      return;
    }

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
            .map(
              (state) => ({
                value:
                  state.isoCode ||
                  state.name,
                label:
                  state.name,
              })
            )
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
    } catch (error) {
      console.error(
        "Error loading states:",
        error
      );

      setStateOptions([]);
    } finally {
      setIsLoadingStates(
        false
      );
    }
  }, [
    formData.country,
  ]);

  /* =====================================================
     NORMAL INPUT CHANGE
  ===================================================== */

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );

    if (errors[name]) {
      setErrors(
        (prev) => ({
          ...prev,
          [name]: "",
        })
      );
    }
  };

  /* =====================================================
     PHONE CHANGE
  ===================================================== */

  const handlePhoneChange = (
    field,
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,
        [field]: value,
      })
    );

    if (errors[field]) {
      setErrors(
        (prev) => ({
          ...prev,
          [field]: "",
        })
      );
    }
  };

  /* =====================================================
     SELECT CHANGE
  ===================================================== */

  const handleSelectChange = (
    name,
    value
  ) => {
    if (
      name === "country"
    ) {
      setFormData(
        (prev) => ({
          ...prev,
          country: value,
          state: "",
        })
      );

      setStateOptions([]);

      setErrors(
        (prev) => ({
          ...prev,
          country: "",
          state: "",
        })
      );

      return;
    }

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );

    if (errors[name]) {
      setErrors(
        (prev) => ({
          ...prev,
          [name]: "",
        })
      );
    }
  };

  /* =====================================================
     FILE CHANGE
  ===================================================== */

  const handleFileChange = (
    file
  ) => {
    if (!file) return;

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      toaster.create({
        title: "Error",
        description:
          "File size should be less than 2MB",
        type: "error",
        duration: 4000,
      });

      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toaster.create({
        title: "Error",
        description:
          "Please upload an image file",
        type: "error",
        duration: 4000,
      });

      return;
    }

    setFormData(
      (prev) => ({
        ...prev,
        logo: file,
      })
    );

    const reader =
      new FileReader();

    reader.onloadend = () => {
      setLogoPreview(
        reader.result
      );
    };

    reader.readAsDataURL(file);
  };

  const handleLogoChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    handleFileChange(file);
  };

  const handleDrop = (
    e
  ) => {
    e.preventDefault();

    setIsDragging(false);

    const file =
      e.dataTransfer.files?.[0];

    handleFileChange(file);
  };

  const handleDragOver = (
    e
  ) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    e
  ) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validate = () => {
    const newErrors = {};

    if (
      !formData.name.trim()
    ) {
      newErrors.name =
        "Church name is required";
    }

    if (!formData.diocese) {
      newErrors.diocese =
        "Diocese is required";
    }

    if (
      !formData.email.trim()
    ) {
      newErrors.email =
        "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Invalid email format";
    }

    if (
      !formData.phone ||
      formData.phone.length < 4
    ) {
      newErrors.phone =
        "Valid phone number is required";
    }

    /*
     * Website:
     * Accept:
     * example.com
     * www.example.com
     * http://example.com
     * https://example.com
     */
    if (
      formData.website &&
      !isValidWebsite(
        formData.website
      )
    ) {
      newErrors.website =
        "Please enter a valid website";
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      /*
       * PHONE
       *
       * formData.phone contains ONLY local number.
       *
       * Example:
       * Country = IN
       * Phone = 9876543210
       *
       * Backend receives:
       * +919876543210
       */

      const selectedCountry =
        countryOptions.find(
          (country) =>
            country.value ===
            formData.country
        );

      const callingCode =
        selectedCountry
          ? Country.getCountryByCode(
              selectedCountry.value
            )?.phonecode
          : "";

      const localPhone =
        String(
          formData.phone || ""
        ).replace(
          /\D/g,
          ""
        );

      const internationalPhone =
        callingCode
          ? `+${callingCode}${localPhone}`
          : localPhone;

      /* WEBSITE */

      const website =
        normalizeWebsite(
          formData.website
        );

      const submitData = {
        name:
          formData.name.trim(),

        diocese:
          formData.diocese,

        established_year:
          formData.established_year
            ? parseInt(
                formData.established_year,
                10
              )
            : null,

        registration_number:
          formData.registration_number.trim() ||
          "",

        currency:
          formData.currency ||
          "",

        /*
         * Backend model mapping
         */
        address:
          formData.address_line1.trim() ||
          "",

        address_line1:
          formData.address_line2.trim() ||
          "",

        city:
          formData.city.trim() ||
          "",

        state:
          formData.state ||
          "",

        country:
          formData.country ||
          "",

        postal_code:
          formData.postal_code.trim() ||
          "",

        email:
          formData.email.trim(),

        phone_number:
          internationalPhone,

        alternate_phone:
          formData.alternate_phone ||
          "",

        website,

        is_active:
          formData.is_active,
      };

      console.log(
        "Submitting church data:",
        submitData
      );

      await adminApi.createChurch(
        submitData
      );

      toaster.create({
        title: "Success",
        description: `Church ${formData.code} created successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate(
        "/admin/churches"
      );
    } catch (error) {
      console.error(
        "Error creating church:",
        error
      );

      let errorMsg =
        "Failed to create church.";

      if (
        error.response?.data
      ) {
        const responseData =
          error.response.data;

        if (
          typeof responseData ===
          "object"
        ) {
          const errs = [];

          Object.entries(
            responseData
          ).forEach(
            ([field, value]) => {
              if (
                field !==
                  "status" &&
                field !==
                  "message"
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

          if (
            errs.length > 0
          ) {
            errorMsg =
              errs.join("; ");
          } else if (
            responseData.message
          ) {
            errorMsg =
              responseData.message;
          } else if (
            responseData.error
          ) {
            errorMsg =
              responseData.error;
          } else if (
            responseData.detail
          ) {
            errorMsg =
              responseData.detail;
          }
        } else if (
          typeof responseData ===
          "string"
        ) {
          errorMsg =
            responseData;
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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <AdminLayout>
      <Container
        maxW="container.xl"
        py={6}
      >
        {/* BREADCRUMB */}

        <Text
          fontSize="xs"
          color="gray.400"
          fontWeight="600"
          mb={2}
        >
          Churches / Register Church
        </Text>

        {/* HEADER */}

        <VStack
          align="start"
          spacing={1}
          mb={6}
        >
          <Text
            fontSize="xs"
            fontWeight="700"
            color={
              primaryMaroon
            }
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Church Management
          </Text>

          <Heading
            fontSize="3xl"
            fontWeight="800"
            color="#1a1a2e"
          >
            Register New Church
          </Heading>

          <Text
            color={lightGray}
            fontSize="sm"
          >
            Create a church profile with its
            address and contact information.
          </Text>
        </VStack>

        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          p={6}
          boxShadow="sm"
        >
          <form
            onSubmit={
              handleSubmit
            }
          >
            <VStack
              spacing={8}
              align="stretch"
            >
              {/* =================================================
                  1. BASIC INFORMATION
              ================================================= */}

              <Box>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="gray.800"
                  mb={4}
                >
                  1. Basic Information
                </Text>

                <Flex
                  gap={6}
                  mb={4}
                  direction={{
                    base: "column",
                    md: "row",
                  }}
                >
                  {/* LOGO */}

                  <Box flexShrink={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
                    >
                      Church Logo
                    </Text>

                    <Box
                      border={`2px dashed ${primaryMaroon}`}
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                      bg={
                        isDragging
                          ? "rgba(174,32,80,0.05)"
                          : "gray.50"
                      }
                      transition="all 0.2s"
                      w="180px"
                      h="180px"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      onDrop={
                        handleDrop
                      }
                      onDragOver={
                        handleDragOver
                      }
                      onDragLeave={
                        handleDragLeave
                      }
                      cursor="pointer"
                      onClick={() =>
                        document
                          .getElementById(
                            "church-logo-input"
                          )
                          ?.click()
                      }
                      position="relative"
                    >
                      {logoPreview ? (
                        <Image
                          src={
                            logoPreview
                          }
                          alt="Church Logo"
                          objectFit="cover"
                          w="100%"
                          h="100%"
                          borderRadius="md"
                        />
                      ) : (
                        <>
                          <Icon
                            as={
                              LuUpload
                            }
                            boxSize={8}
                            color={
                              primaryMaroon
                            }
                            mb={2}
                          />

                          <Icon
                            as={
                              LuChurch
                            }
                            boxSize={10}
                            color={
                              primaryMaroon
                            }
                            mb={2}
                          />

                          <Text
                            fontSize="xs"
                            color="gray.500"
                          >
                            Drop or Click
                          </Text>

                          <Text
                            fontSize="xs"
                            color="gray.400"
                          >
                            PNG/JPG up to 2MB
                          </Text>
                        </>
                      )}

                      <Input
                        id="church-logo-input"
                        type="file"
                        accept="image/*"
                        onChange={
                          handleLogoChange
                        }
                        display="none"
                      />

                      {logoPreview && (
                        <Button
                          size="xs"
                          position="absolute"
                          top="4px"
                          right="4px"
                          borderRadius="full"
                          bg="red.500"
                          color="white"
                          _hover={{
                            bg: "red.600",
                          }}
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            setLogoPreview(
                              null
                            );

                            setFormData(
                              (prev) => ({
                                ...prev,
                                logo: null,
                              })
                            );

                            const input =
                              document.getElementById(
                                "church-logo-input"
                              );

                            if (
                              input
                            ) {
                              input.value =
                                "";
                            }
                          }}
                        >
                          <LuX
                            size={12}
                          />
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* NAME + CODE */}

                  <Box flex="1">
                    {/* ROW 1 */}

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "1fr 1fr",
                      }}
                      gap={4}
                    >
                      <GridItem>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.700"
                          mb={1}
                        >
                          Church Name{" "}
                          <Text
                            as="span"
                            color={
                              primaryMaroon
                            }
                          >
                            *
                          </Text>
                        </Text>

                        <Input
                          name="name"
                          value={
                            formData.name
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter church name"
                          borderColor={
                            errors.name
                              ? "red.500"
                              : "gray.200"
                          }
                          size="lg"
                          height="42px"
                          fontSize="14px"
                          borderWidth="1.5px"
                          _focus={{
                            borderColor:
                              primaryMaroon,
                            boxShadow: `0 0 0 1px ${primaryMaroon}`,
                          }}
                        />

                        {errors.name && (
                          <Text
                            fontSize="xs"
                            color="red.500"
                            mt={1}
                          >
                            {
                              errors.name
                            }
                          </Text>
                        )}
                      </GridItem>

                      <GridItem>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.700"
                          mb={1}
                        >
                          Church Code
                        </Text>

                        <Box
                          bg="gray.50"
                          px={4}
                          py={1.5}
                          borderRadius="md"
                          border={`1.5px solid ${primaryMaroon}`}
                          height="42px"
                          display="flex"
                          alignItems="center"
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color={
                              primaryMaroon
                            }
                          >
                            {
                              previewCode
                            }
                          </Text>

                          <Text
                            fontSize="xs"
                            color="gray.400"
                            ml={2}
                          >
                            (Auto)
                          </Text>
                        </Box>
                      </GridItem>
                    </Grid>

                    {/* ROW 2 */}

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "1fr 1fr",
                      }}
                      gap={4}
                      mt={4}
                    >
                      <GridItem>
                        <SearchableDropdown
                          label={
                            <>
                              Diocese{" "}
                              <Text
                                as="span"
                                color={
                                  primaryMaroon
                                }
                              >
                                *
                              </Text>
                            </>
                          }
                          options={dioceses.map(
                            (d) => ({
                              value:
                                d.id,
                              label:
                                d.name,
                            })
                          )}
                          value={
                            formData.diocese
                          }
                          onChange={(
                            value
                          ) =>
                            handleSelectChange(
                              "diocese",
                              value
                            )
                          }
                          placeholder="Select Diocese"
                          searchPlaceholder="Search diocese..."
                          isInvalid={
                            !!errors.diocese
                          }
                          error={
                            errors.diocese
                          }
                        />
                      </GridItem>

                      <GridItem>
                        <SearchableDropdown
                          label="Established Year"
                          options={
                            yearOptions
                          }
                          value={
                            formData.established_year
                          }
                          onChange={(
                            value
                          ) =>
                            handleSelectChange(
                              "established_year",
                              value
                            )
                          }
                          placeholder="Select Year"
                          searchPlaceholder="Search year..."
                        />
                      </GridItem>
                    </Grid>

                    {/* ROW 3 */}

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "1fr 1fr",
                      }}
                      gap={4}
                      mt={4}
                    >
                      <GridItem>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.700"
                          mb={1}
                        >
                          Registration Number
                        </Text>

                        <Input
                          name="registration_number"
                          value={
                            formData.registration_number
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="REG-1998-0456"
                          size="lg"
                          height="42px"
                          fontSize="14px"
                          borderWidth="1.5px"
                          _focus={{
                            borderColor:
                              primaryMaroon,
                            boxShadow: `0 0 0 1px ${primaryMaroon}`,
                          }}
                        />
                      </GridItem>

                      <GridItem>
                        <SearchableDropdown
                          label="Currency"
                          options={
                            currencyOptions
                          }
                          value={
                            formData.currency
                          }
                          onChange={(
                            value
                          ) =>
                            handleSelectChange(
                              "currency",
                              value
                            )
                          }
                          placeholder="Select Currency"
                          searchPlaceholder="Search currency..."
                        />
                      </GridItem>
                    </Grid>
                  </Box>
                </Flex>
              </Box>

              {/* =================================================
                  2. ADDRESS
                  CITY -> COUNTRY -> STATE -> POSTAL
              ================================================= */}

              <Box>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="gray.800"
                  mb={4}
                >
                  2. Address
                </Text>

                {/* ADDRESS LINES */}

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr",
                  }}
                  gap={4}
                >
                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
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
                      placeholder="24 Hill Road"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{
                        borderColor:
                          primaryMaroon,
                        boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      }}
                    />
                  </GridItem>

                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
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
                      placeholder="Bandra West"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{
                        borderColor:
                          primaryMaroon,
                        boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      }}
                    />
                  </GridItem>
                </Grid>

                {/* CITY -> COUNTRY -> STATE -> POSTAL */}

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr 1fr 1fr",
                  }}
                  gap={4}
                  mt={4}
                >
                  {/* CITY */}

                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
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
                      placeholder="Mumbai"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{
                        borderColor:
                          primaryMaroon,
                        boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      }}
                    />
                  </GridItem>

                  {/* COUNTRY */}

                  <GridItem>
                    <CountryDropdown
                      label="Country"
                      options={
                        countryOptions
                      }
                      value={
                        formData.country
                      }
                      onChange={(
                        value
                      ) =>
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
                      height="42px"
                      searchPlaceholder="Search country..."
                    />
                  </GridItem>

                  {/* STATE */}

                  <GridItem>
                    {isLoadingStates ? (
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.700"
                          mb={1}
                        >
                          State
                        </Text>

                        <Flex
                          align="center"
                          gap={2}
                          height="42px"
                          bg="gray.50"
                          px={4}
                          borderRadius="md"
                          border="1.5px solid"
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
                      </Box>
                    ) : (
                      <SearchableDropdown
                        label="State"
                        options={
                          stateOptions
                        }
                        value={
                          formData.state
                        }
                        onChange={(
                          value
                        ) =>
                          handleSelectChange(
                            "state",
                            value
                          )
                        }
                        placeholder={
                          formData.country
                            ? "Select State"
                            : "Select Country First"
                        }
                        searchPlaceholder="Search state..."
                        isDisabled={
                          !formData.country
                        }
                        isInvalid={
                          !!errors.state
                        }
                        error={
                          errors.state
                        }
                      />
                    )}
                  </GridItem>

                  {/* POSTAL CODE */}

                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
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
                      placeholder="400050"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{
                        borderColor:
                          primaryMaroon,
                        boxShadow: `0 0 0 1px ${primaryMaroon}`,
                      }}
                    />
                  </GridItem>
                </Grid>
              </Box>

              {/* =================================================
                  3. PRIMARY CONTACT
              ================================================= */}

              <Box>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="gray.800"
                  mb={4}
                >
                  3. Primary Contact
                </Text>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr",
                  }}
                  gap={4}
                >
                  {/* EMAIL */}

                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
                    >
                      Email Address{" "}
                      <Text
                        as="span"
                        color={
                          primaryMaroon
                        }
                      >
                        *
                      </Text>
                    </Text>

                    <Box position="relative">
                      <Box
                        position="absolute"
                        left={3}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={1}
                        pointerEvents="none"
                      >
                        <LuMail
                          color="#a0aec0"
                          size={18}
                        />
                      </Box>

                      <Input
                        name="email"
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="contact@stmaryschurch.in"
                        borderColor={
                          errors.email
                            ? "red.500"
                            : "gray.200"
                        }
                        size="lg"
                        height="42px"
                        fontSize="14px"
                        pl={10}
                        borderWidth="1.5px"
                        _focus={{
                          borderColor:
                            primaryMaroon,
                          boxShadow: `0 0 0 1px ${primaryMaroon}`,
                        }}
                      />
                    </Box>

                    {errors.email && (
                      <Text
                        fontSize="xs"
                        color="red.500"
                        mt={1}
                      >
                        {
                          errors.email
                        }
                      </Text>
                    )}
                  </GridItem>

                  {/* PHONE */}

                  <GridItem>
                    <PhoneInputWithCountry
                      label={
                        <>
                          Phone Number{" "}
                          <Text
                            as="span"
                            color={
                              primaryMaroon
                            }
                          >
                            *
                          </Text>
                        </>
                      }
                      value={
                        formData.phone
                      }
                      onChange={(
                        value
                      ) =>
                        handlePhoneChange(
                          "phone",
                          value
                        )
                      }
                      placeholder="Enter phone number"
                      isInvalid={
                        !!errors.phone
                      }
                      error={
                        errors.phone
                      }
                    />
                  </GridItem>
                </Grid>

                {/* ALTERNATE + WEBSITE */}

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "1fr 1fr",
                  }}
                  gap={4}
                  mt={4}
                >
                  {/* ALTERNATE PHONE */}

                  <GridItem>
                    <PhoneInputWithCountry
                      label="Alternate Phone"
                      value={
                        formData.alternate_phone
                      }
                      onChange={(
                        value
                      ) =>
                        handlePhoneChange(
                          "alternate_phone",
                          value
                        )
                      }
                      placeholder="Enter alternate phone"
                      isInvalid={
                        !!errors.alternate_phone
                      }
                      error={
                        errors.alternate_phone
                      }
                    />
                  </GridItem>

                  {/* WEBSITE */}

                  <GridItem>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      mb={1}
                    >
                      Website
                    </Text>

                    <Box position="relative">
                      <Box
                        position="absolute"
                        left={3}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={1}
                        pointerEvents="none"
                      >
                        <LuGlobe
                          color="#a0aec0"
                          size={18}
                        />
                      </Box>

                      <Input
                        name="website"
                        value={
                          formData.website
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="www.stmaryschurch.in"
                        size="lg"
                        height="42px"
                        fontSize="14px"
                        borderColor={
                          errors.website
                            ? "red.500"
                            : "gray.200"
                        }
                        pl={10}
                        borderWidth="1.5px"
                        _focus={{
                          borderColor:
                            primaryMaroon,
                          boxShadow: `0 0 0 1px ${primaryMaroon}`,
                        }}
                      />
                    </Box>

                    {errors.website && (
                      <Text
                        fontSize="xs"
                        color="red.500"
                        mt={1}
                      >
                        {
                          errors.website
                        }
                      </Text>
                    )}
                  </GridItem>
                </Grid>
              </Box>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <Flex
                gap={4}
                pt={4}
                borderTop="1px solid"
                borderColor="gray.100"
                justify="flex-end"
                flexWrap="wrap"
              >
                <Button
                  bg={
                    primaryMaroon
                  }
                  color="white"
                  _hover={{
                    bg: "#8a1a3e",
                  }}
                  type="submit"
                  isLoading={
                    isLoading
                  }
                  loadingText="Registering..."
                  size="lg"
                  px={8}
                >
                  <LuSave
                    size={18}
                    style={{
                      marginRight:
                        "8px",
                    }}
                  />
                  Register Church
                </Button>
              </Flex>

              {/* =================================================
                  INFO BOX
              ================================================= */}

              <Box
                bg="rgba(174,32,80,0.06)"
                p={4}
                borderRadius="lg"
                border={`1px solid ${primaryMaroon}`}
              >
                <Flex
                  align="center"
                  gap={3}
                >
                  <Icon
                    as={
                      LuCircleHelp
                    }
                    boxSize={5}
                    color={
                      primaryMaroon
                    }
                  />

                  <Text
                    fontSize="sm"
                    color="#333"
                  >
                    The church will be assigned
                    code{" "}
                    <strong
                      style={{
                        color:
                          primaryMaroon,
                      }}
                    >
                      {previewCode}
                    </strong>{" "}
                    and can be assigned to a
                    diocese.
                  </Text>
                </Flex>
              </Box>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

/* =======================================================
   COUNTRY DROPDOWN

   Kept separate because country has no need to
   display flags in the current address selector.
======================================================= */

const CountryDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isInvalid = false,
  height = "42px",
  label,
  error,
  searchPlaceholder = "Search country...",
}) => {
  const [isOpen, setIsOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const containerRef =
    useRef(null);

  const searchRef =
    useRef(null);

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  const filteredOptions =
    searchTerm
      ? options.filter((option) =>
          option.label
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )
        )
      : options;

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

  useEffect(() => {
    if (
      isOpen &&
      searchRef.current
    ) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (
    option
  ) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
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
          mb={1}
        >
          {label}
        </Text>
      )}

      <Box
        onClick={() =>
          !isDisabled &&
          setIsOpen(!isOpen)
        }
        cursor={
          isDisabled
            ? "not-allowed"
            : "pointer"
        }
        border="1.5px solid"
        borderColor={
          isInvalid
            ? "#e53e3e"
            : isOpen
            ? primaryMaroon
            : "#e2e8f0"
        }
        borderRadius="md"
        height={height}
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={
          isDisabled
            ? "gray.50"
            : "white"
        }
        transition="all 0.2s"
      >
        <Text
          noOfLines={1}
          textAlign="left"
          fontWeight={
            selectedOption
              ? "500"
              : "400"
          }
          fontSize="14px"
          color={
            selectedOption
              ? "gray.700"
              : "gray.400"
          }
        >
          {selectedOption
            ? selectedOption.label
            : placeholder}
        </Text>

        <LuChevronDown
          size={16}
          style={{
            transform: isOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition:
              "transform 0.25s ease",
            color: isOpen
              ? primaryMaroon
              : "#718096",
            flexShrink: 0,
          }}
        />
      </Box>

      {isOpen &&
        !isDisabled && (
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
                px={3}
                py={1.5}
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
                  placeholder={
                    searchPlaceholder
                  }
                  value={
                    searchTerm
                  }
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
                  bg="transparent"
                  px={0}
                  height="28px"
                  fontSize="14px"
                />

                {searchTerm && (
                  <Box
                    as="button"
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                    color="gray.400"
                  >
                    <LuX
                      size={14}
                    />
                  </Box>
                )}
              </Flex>
            </Box>

            <Box
              maxHeight="220px"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar":
                  {
                    width: "4px",
                  },
                "&::-webkit-scrollbar-track":
                  {
                    background:
                      "#f7fafc",
                  },
                "&::-webkit-scrollbar-thumb":
                  {
                    background:
                      "#cbd5e0",
                    borderRadius:
                      "24px",
                  },
              }}
            >
              {filteredOptions.length ===
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
                filteredOptions.map(
                  (option) => (
                    <Box
                      key={
                        option.value
                      }
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      _hover={{
                        bg: "gray.50",
                      }}
                      onClick={() =>
                        handleSelect(
                          option
                        )
                      }
                      bg={
                        option.value ===
                        value
                          ? "purple.50"
                          : "transparent"
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottom="1px solid"
                      borderColor="gray.50"
                    >
                      <Text
                        fontSize="14px"
                        color={
                          option.value ===
                          value
                            ? primaryMaroon
                            : "gray.700"
                        }
                        fontWeight={
                          option.value ===
                          value
                            ? "600"
                            : "400"
                        }
                        noOfLines={1}
                      >
                        {
                          option.label
                        }
                      </Text>

                      {option.value ===
                        value && (
                        <LuCheck
                          size={16}
                          color={
                            primaryMaroon
                          }
                        />
                      )}
                    </Box>
                  )
                )
              )}
            </Box>
          </Box>
        )}

      {error && (
        <Text
          fontSize="xs"
          color="red.500"
          mt={1}
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

export default ChurchAdd;

