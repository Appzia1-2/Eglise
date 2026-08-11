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
} from "react-icons/lu";
import { Country, State } from "country-state-city";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";
import ReactCountryFlag from "react-country-flag";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Country code to emoji flag mapping (fallback if ReactCountryFlag fails)
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Country Dropdown (no phone code, just country name)
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

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayValue = () => {
    if (selectedOption && selectedOption.value !== "") {
      return (
        <Flex align="center" gap={2} flex="1" overflow="hidden">
          <Text noOfLines={1} textAlign="left" fontWeight="500" fontSize="13px">
            {selectedOption.label}
          </Text>
        </Flex>
      );
    }
    return <Text color="gray.400" fontWeight="400" fontSize="13px">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      {label && (
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
          {label}
        </Text>
      )}
      
      <Box
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        cursor={isDisabled ? "not-allowed" : "pointer"}
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? "#ae2050" : "#e2e8f0"}
        borderRadius="md"
        height={height}
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={isDisabled ? "gray.50" : "white"}
        _hover={{ borderColor: isInvalid ? "#e53e3e" : "#cbd5e0" }}
        transition="all 0.2s"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getDisplayValue()}
        <LuChevronDown 
          size={14} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            color: isOpen ? '#ae2050' : '#718096',
            flexShrink: 0,
            marginLeft: '6px'
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
          <Box p={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
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
              <LuSearch size={14} color="#718096" />
              <Input
                ref={searchRef}
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                border="none"
                _focus={{ boxShadow: "none" }}
                bg="transparent"
                px={0}
                height="26px"
                fontSize="13px"
                _placeholder={{ color: "gray.400" }}
              />
              {searchTerm && (
                <Box
                  as="button"
                  onClick={() => setSearchTerm("")}
                  color="gray.400"
                  _hover={{ color: "gray.600" }}
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
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'gray.50' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
            }}
          >
            {filteredOptions.length === 0 ? (
              <Box px={4} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400">No countries found</Text>
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.value}
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleSelect(option)}
                  bg={option.value === value ? "purple.50" : "transparent"}
                  transition="all 0.15s"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                >
                  <Text 
                    fontSize="13px" 
                    color={option.value === value ? "#ae2050" : "gray.700"} 
                    fontWeight={option.value === value ? "600" : "400"}
                    noOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <LuCheck size={16} color="#ae2050" flexShrink={0} />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
      
      {error && (
        <Text fontSize="xs" color="red.500" mt={0.5}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Simple Dropdown for State
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
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
          {label}
        </Text>
      )}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        style={{
          width: "100%",
          height: height,
          fontSize: "13px",
          borderRadius: "6px",
          border: `1.5px solid ${isInvalid ? "#e53e3e" : "#e2e8f0"}`,
          padding: "0 10px",
          color: "#1a202c",
          background: isDisabled ? "#f7fafc" : "white",
          cursor: isDisabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!isDisabled) {
            e.target.style.borderColor = "#ae2050";
          }
        }}
        onBlur={(e) => {
          if (!isDisabled) {
            e.target.style.borderColor = isInvalid ? "#e53e3e" : "#e2e8f0";
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <Text fontSize="xs" color="red.500" mt={0.5}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Phone Input with Country Selection
const PhoneInputWithCountry = ({ value, onChange, placeholder, isInvalid, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Get all countries with flags
  const countryList = useMemo(() => {
    const countries = Country.getAllCountries();
    return countries.map((country) => ({
      value: country.isoCode,
      label: country.name,
      flag: country.isoCode,
      phoneCode: country.phonecode,
    }));
  }, []);

  // Set default country to US
  useEffect(() => {
    const defaultCountry = countryList.find(c => c.value === 'US') || countryList[0];
    if (defaultCountry) {
      setSelectedCountry(defaultCountry);
    }
  }, [countryList]);

  // Update phone number when country changes
  useEffect(() => {
    if (selectedCountry && !value) {
      const newNumber = `+${selectedCountry.phoneCode}`;
      setPhoneNumber(newNumber);
      onChange(newNumber);
    }
  }, [selectedCountry]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 100);
    }
  }, [isOpen]);

  const filteredCountries = searchTerm
    ? countryList.filter((c) =>
        c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneCode.includes(searchTerm)
      )
    : countryList;

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");
    const newNumber = `+${country.phoneCode}`;
    setPhoneNumber(newNumber);
    onChange(newNumber);
    setPhoneError("");
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    // Remove all non-digit characters except +
    let digits = rawValue.replace(/[^0-9+]/g, "");
    
    // If it starts with +, keep it, otherwise add country code
    if (!digits.startsWith('+') && selectedCountry) {
      digits = `+${selectedCountry.phoneCode}${digits}`;
    }
    
    setPhoneNumber(digits);
    onChange(digits);
    
    // Validate phone number
    if (digits.length > 3) { // At least country code + 1 digit
      try {
        const phone = parsePhoneNumberFromString(digits);
        if (phone && phone.isValid()) {
          setPhoneError("");
        } else {
          setPhoneError("Invalid phone number format");
        }
      } catch (err) {
        setPhoneError("Invalid phone number");
      }
    } else {
      setPhoneError("");
    }
  };

  const getDisplayValue = () => {
    if (!selectedCountry) {
      return <Text fontSize="12px" color="gray.400">Select</Text>;
    }

    return (
      <Flex align="center" gap={1.5}>
        <ReactCountryFlag
          countryCode={selectedCountry.value}
          svg
          style={{ width: "20px", height: "20px", borderRadius: "2px" }}
        />
        <Text fontSize="12px" fontWeight="600" color="gray.700">
          +{selectedCountry.phoneCode}
        </Text>
      </Flex>
    );
  };

  return (
    <Box width="100%">
      <Flex gap={2}>
        {/* Country Selector */}
        <Box ref={containerRef} position="relative" flexShrink={0}>
          <Box
            onClick={() => setIsOpen(!isOpen)}
            cursor="pointer"
            border="1.5px solid"
            borderColor={isInvalid || phoneError ? "#e53e3e" : isOpen ? "#ae2050" : "#e2e8f0"}
            borderRadius="md"
            height="36px"
            px={2.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="white"
            _hover={{ borderColor: isInvalid || phoneError ? "#e53e3e" : "#cbd5e0" }}
            transition="all 0.2s"
            minW="80px"
          >
            {getDisplayValue()}
            <LuChevronDown 
              size={12} 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
                color: isOpen ? '#ae2050' : '#718096',
                marginLeft: '4px'
              }} 
            />
          </Box>

          {isOpen && (
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
              maxHeight="320px"
              overflow="hidden"
              minW="240px"
            >
              <Box p={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
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
                  <LuSearch size={14} color="#718096" />
                  <Input
                    ref={searchRef}
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                    bg="transparent"
                    px={0}
                    height="26px"
                    fontSize="13px"
                    _placeholder={{ color: "gray.400" }}
                  />
                  {searchTerm && (
                    <Box
                      as="button"
                      onClick={() => setSearchTerm("")}
                      color="gray.400"
                      _hover={{ color: "gray.600" }}
                    >
                      <LuX size={12} />
                    </Box>
                  )}
                </Flex>
              </Box>

              <Box 
                maxHeight="230px" 
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-track': { background: 'gray.50' },
                  '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
                }}
              >
                {filteredCountries.length === 0 ? (
                  <Box px={4} py={6} textAlign="center">
                    <Text fontSize="sm" color="gray.400">No countries found</Text>
                  </Box>
                ) : (
                  filteredCountries.map((country) => (
                    <Box
                      key={country.value}
                      px={3}
                      py={2}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      onClick={() => handleCountrySelect(country)}
                      bg={country.value === selectedCountry?.value ? "purple.50" : "transparent"}
                      transition="all 0.15s"
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottom="1px solid"
                      borderColor="gray.50"
                    >
                      <Flex align="center" gap={2} flex="1" overflow="hidden">
                        <ReactCountryFlag
                          countryCode={country.value}
                          svg
                          style={{ width: "22px", height: "22px", borderRadius: "2px" }}
                        />
                        <Flex direction="column" flex="1" overflow="hidden">
                          <Text 
                            fontSize="13px" 
                            color={country.value === selectedCountry?.value ? "#ae2050" : "gray.700"} 
                            fontWeight={country.value === selectedCountry?.value ? "600" : "400"}
                            noOfLines={1}
                          >
                            {country.label}
                          </Text>
                          <Text fontSize="10px" color="gray.400">
                            +{country.phoneCode}
                          </Text>
                        </Flex>
                      </Flex>
                      {country.value === selectedCountry?.value && (
                        <LuCheck size={16} color="#ae2050" flexShrink={0} />
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Phone Number Input */}
        <Box flex="1">
          <Input
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder || "Enter phone number"}
            size="md"
            height="36px"
            fontSize="13px"
            borderColor={isInvalid || phoneError ? "red.500" : "gray.200"}
            borderWidth="1.5px"
            pl={2.5}
            _focus={{ borderColor: isInvalid || phoneError ? "red.500" : "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
            _hover={{ borderColor: isInvalid || phoneError ? "red.500" : "gray.300" }}
          />
          {(error || phoneError) && (
            <Text fontSize="xs" color="red.500" mt={0.5}>{error || phoneError}</Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

const DioceseAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [dioceseCount, setDioceseCount] = useState(0);

  const primaryMaroon = "#ae2050";

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countries = Country.getAllCountries();
        const options = countries.map((country) => ({
          value: country.isoCode,
          label: country.name,
        }));
        options.sort((a, b) => a.label.localeCompare(b.label));
        setCountryOptions(options);

        try {
          const response = await adminApi.getDioceses();
          setDioceseCount(response.data?.length || 0);
        } catch (error) {
          console.error("Error fetching diocese count:", error);
        }
      } catch (error) {
        console.error("Error loading countries:", error);
        toaster.create({
          title: "Error",
          description: "Failed to load countries. Please refresh the page.",
          type: "error",
          duration: 5000,
        });
      }
    };
    loadCountries();
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (formData.country) {
      setIsLoadingStates(true);
      try {
        const states = State.getStatesOfCountry(formData.country);
        if (states && states.length > 0) {
          const options = states.map((state) => ({
            value: state.isoCode || state.name,
            label: state.name,
          }));
          options.sort((a, b) => a.label.localeCompare(b.label));
          setStateOptions(options);
        } else {
          setStateOptions([]);
        }
        setFormData((prev) => ({ ...prev, state: "", city: "" }));
      } catch (error) {
        console.error("Error loading states:", error);
        setStateOptions([]);
        toaster.create({
          title: "Error",
          description: "Failed to load states for the selected country.",
          type: "error",
          duration: 4000,
        });
      } finally {
        setIsLoadingStates(false);
      }
    } else {
      setStateOptions([]);
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    }
  }, [formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone_number: value });
    if (errors.phone_number) {
      setErrors({ ...errors, phone_number: "" });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (name === "country") {
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
      setStateOptions([]);
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Diocese name is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.website && !/^https?:\/\/[^\s]+$/.test(formData.website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)";
    }
    
    // Phone validation
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else {
      try {
        const phone = parsePhoneNumberFromString(formData.phone_number);
        if (!phone || !phone.isValid()) {
          newErrors.phone_number = "Invalid phone number";
        }
      } catch (err) {
        newErrors.phone_number = "Invalid phone number format";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const code = `DIO-${String(dioceseCount + 1).padStart(3, '0')}`;
      
      const submitData = {
        name: formData.name.trim(),
        metropolitan_name: formData.metropolitan_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim(),
        city: formData.city.trim(),
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code.trim(),
        website: formData.website.trim(),
        code: code,
        is_active: formData.is_active,
      };

      await adminApi.createDiocese(submitData);
      toaster.create({
        title: "Success",
        description: `Diocese ${code} created successfully.`,
        type: "success",
        duration: 3000,
      });
      navigate("/admin/dioceses");
    } catch (error) {
      console.error("Error creating diocese:", error);
      let errorMsg = "Failed to create diocese.";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          const errs = [];
          Object.entries(error.response.data).forEach(([field, value]) => {
            if (field !== "status" && field !== "message") {
              errs.push(`${field}: ${Array.isArray(value) ? value.join(", ") : value}`);
            }
          });
          if (errs.length > 0) {
            errorMsg = errs.join("; ");
          } else if (error.response.data.message) {
            errorMsg = error.response.data.message;
          } else if (error.response.data.error) {
            errorMsg = error.response.data.error;
          } else if (error.response.data.detail) {
            errorMsg = error.response.data.detail;
          }
        } else if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        }
      }
      toaster.create({
        title: "Error",
        description: errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewCode = `DIO-${String(dioceseCount + 1).padStart(3, '0')}`;

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={0}>
        <Text fontSize="10px" color="gray.400" fontWeight="600" mb={0.5} textTransform="uppercase" letterSpacing="0.05em">
          Churches / Dioceses / Register Diocese
        </Text>

        <VStack align="start" spacing={0} mb={0.5}>
          <Text fontSize="10px" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Diocese Management
          </Text>
          <Heading fontSize="sm" fontWeight="800" color="#1a1a2e" mb={0}>
            Register New Diocese
          </Heading>
          <Text color="gray.500" fontSize="10px">
            Create a diocese profile with metropolitan, contact and address information.
          </Text>
        </VStack>

        <Box 
          bg="white" 
          borderRadius="md" 
          border="1px solid" 
          borderColor="gray.200" 
          p={2.5} 
          boxShadow="0 1px 3px rgba(0,0,0,0.05)"
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={2} align="stretch">
              {/* Row 1: Diocese Code and Name */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1.5fr" }} gap={2}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
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
                      <Icon as={LuHash} color="gray.400" boxSize={4} />
                      <Text fontSize="sm" fontWeight="600" color={primaryMaroon}>
                        {previewCode}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        (Auto)
                      </Text>
                    </HStack>
                  </Box>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Diocese Name <span style={{ color: '#e53e3e' }}>*</span>
                  </Text>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Archdiocese of Mumbai"
                    borderColor={errors.name ? "red.500" : "gray.200"}
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: !errors.name ? "gray.300" : "red.500" }}
                  />
                  {errors.name && <Text fontSize="xs" color="red.500" mt={0.5}>{errors.name}</Text>}
                </GridItem>
              </Grid>

              {/* Row 2: Metropolitan Name */}
              <Grid templateColumns={{ base: "1fr" }} gap={2}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Metropolitan Name
                  </Text>
                  <Input
                    name="metropolitan_name"
                    value={formData.metropolitan_name}
                    onChange={handleChange}
                    placeholder="e.g., Most Rev. Dr. John Mathew"
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: "gray.300" }}
                  />
                </GridItem>
              </Grid>

              {/* Row 3: Contact Section - Email, Website, Phone */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={2}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Email <span style={{ color: '#e53e3e' }}>*</span>
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
                      <LuMail color="#a0aec0" size={16} />
                    </Box>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="metropolitan@diocese.org"
                      borderColor={errors.email ? "red.500" : "gray.200"}
                      size="md"
                      height="36px"
                      fontSize="13px"
                      pl={9}
                      borderWidth="1.5px"
                      bg="white"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                      _hover={{ borderColor: !errors.email ? "gray.300" : "red.500" }}
                    />
                  </Box>
                  {errors.email && <Text fontSize="xs" color="red.500" mt={0.5}>{errors.email}</Text>}
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Website
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
                      <LuGlobe color="#a0aec0" size={16} />
                    </Box>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.diocese.org"
                      size="md"
                      height="36px"
                      fontSize="13px"
                      borderColor={errors.website ? "red.500" : "gray.200"}
                      pl={9}
                      borderWidth="1.5px"
                      bg="white"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                      _hover={{ borderColor: !errors.website ? "gray.300" : "red.500" }}
                    />
                  </Box>
                  {errors.website && <Text fontSize="xs" color="red.500" mt={0.5}>{errors.website}</Text>}
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Contact <span style={{ color: '#e53e3e' }}>*</span>
                  </Text>
                  <PhoneInputWithCountry
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                    isInvalid={!!errors.phone_number}
                    error={errors.phone_number}
                  />
                </GridItem>
              </Grid>

              {/* Address Section Header */}
              <Box pt={1}>
                <Heading size="sm" fontWeight="700" color="gray.800" mb={0.5}>
                  Address Information
                </Heading>
              </Box>

              {/* Address Line 1 & 2 */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={2}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Address Line 1
                  </Text>
                  <Input
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="Street address, building name"
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: "gray.300" }}
                  />
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Address Line 2
                  </Text>
                  <Input
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit"
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: "gray.300" }}
                  />
                </GridItem>
              </Grid>

              {/* City, State, Country, Postal */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={2.5}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    City
                  </Text>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: "gray.300" }}
                  />
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    State / Province
                  </Text>
                  {isLoadingStates ? (
                    <Flex align="center" gap={2} height="36px" bg="gray.50" px={3} borderRadius="md" border="1px solid" borderColor="gray.200">
                      <Spinner size="xs" color={primaryMaroon} />
                      <Text fontSize="xs" color="gray.500">Loading...</Text>
                    </Flex>
                  ) : stateOptions.length > 0 ? (
                    <SimpleDropdown
                      options={stateOptions}
                      value={formData.state}
                      onChange={(value) => handleSelectChange("state", value)}
                      placeholder={formData.country ? "Select State" : "Select country first"}
                      isDisabled={!formData.country}
                      isInvalid={!!errors.state}
                      error={errors.state}
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
                      <Text color="gray.500" fontSize="xs">
                        {formData.country ? "No states available" : "Select country first"}
                      </Text>
                    </Box>
                  )}
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Country <span style={{ color: '#e53e3e' }}>*</span>
                  </Text>
                  <CountryDropdown
                    options={countryOptions}
                    value={formData.country}
                    onChange={(value) => handleSelectChange("country", value)}
                    placeholder="Select Country"
                    isInvalid={!!errors.country}
                    error={errors.country}
                    height="36px"
                  />
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={0.5}>
                    Postal Code
                  </Text>
                  <Input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                    size="md"
                    height="36px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    bg="white"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px rgba(174,32,80,0.1)" }}
                    _hover={{ borderColor: "gray.300" }}
                  />
                </GridItem>
              </Grid>

              {/* Info Box */}
              <Box
                bg="rgba(174,32,80,0.04)"
                p={2.5}
                borderRadius="md"
                border="1px solid"
                borderColor="rgba(174,32,80,0.12)"
              >
                <Flex align="flex-start" gap={2}>
                  <Icon as={LuCircleHelp} boxSize={3.5} color={primaryMaroon} flexShrink={0} mt={0.5} />
                  <Text fontSize="xs" color="gray.700" lineHeight="1.4">
                    The diocese will be assigned code <strong>{previewCode}</strong> and can be assigned to churches after registration.
                  </Text>
                </Flex>
              </Box>

              {/* Actions */}
              <Flex gap={2} pt={2.5} borderTop="1px solid" borderColor="gray.100" justify="flex-end">
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#8a1a3e", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(174,32,80,0.3)" }}
                  _active={{ transform: "translateY(0)" }}
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Creating..."
                  size="md"
                  px={8}
                  fontSize="sm"
                  fontWeight="600"
                  leftIcon={<LuSave size={16} />}
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