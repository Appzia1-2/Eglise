// src/admin/pages/ChurchAdd.jsx
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
  LuHash,
  LuPhone,
  LuChurch,
  LuUpload,
  LuCalendar,
  LuBuilding2,
} from "react-icons/lu";
import { Country, State } from "country-state-city";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";
import ReactCountryFlag from "react-country-flag";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const primaryMaroon = "#ae2050";

// Phone Input with Country Selection
const PhoneInputWithCountry = ({ value, onChange, placeholder, isInvalid, error, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const countryList = useMemo(() => {
    const countries = Country.getAllCountries();
    return countries.map((country) => ({
      value: country.isoCode,
      label: country.name,
      flag: country.isoCode,
      phoneCode: country.phonecode,
    }));
  }, []);

  useEffect(() => {
    const defaultCountry = countryList.find(c => c.value === 'US') || countryList[0];
    if (defaultCountry) {
      setSelectedCountry(defaultCountry);
      const initialNumber = `+${defaultCountry.phoneCode}`;
      setPhoneNumber(initialNumber);
      if (onChange) {
        onChange(initialNumber);
      }
    }
  }, [countryList]);

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
    if (onChange) {
      onChange(newNumber);
    }
    setPhoneError("");
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    let cleaned = rawValue.replace(/[^0-9+\- ]/g, "");
    
    if (selectedCountry && !cleaned.startsWith('+')) {
      const digitsOnly = cleaned.replace(/[^0-9]/g, '');
      if (digitsOnly) {
        cleaned = `+${selectedCountry.phoneCode}${digitsOnly}`;
      } else {
        cleaned = `+${selectedCountry.phoneCode}`;
      }
    }
    
    setPhoneNumber(cleaned);
    if (onChange) {
      onChange(cleaned);
    }
    
    if (cleaned.length > 3) {
      try {
        const phone = parsePhoneNumberFromString(cleaned);
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
          style={{ width: "18px", height: "18px", borderRadius: "2px" }}
        />
        <Text fontSize="12px" fontWeight="600" color="gray.700">
          +{selectedCountry.phoneCode}
        </Text>
      </Flex>
    );
  };

  return (
    <Box width="100%">
      {label && (
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
          {label}
        </Text>
      )}
      <Flex gap={2}>
        <Box ref={containerRef} position="relative" flexShrink={0}>
          <Box
            onClick={() => setIsOpen(!isOpen)}
            cursor="pointer"
            border="1.5px solid"
            borderColor={isInvalid || phoneError ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
            borderRadius="md"
            height="42px"
            px={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="white"
            _hover={{ borderColor: isInvalid || phoneError ? "#e53e3e" : "#cbd5e0" }}
            transition="all 0.2s"
            minW="90px"
          >
            {getDisplayValue()}
            <LuChevronDown 
              size={12} 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
                color: isOpen ? primaryMaroon : '#718096',
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
                  px={3} 
                  py={1.5} 
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
                    height="28px"
                    fontSize="14px"
                    _placeholder={{ color: "gray.400" }}
                  />
                  {searchTerm && (
                    <Box
                      as="button"
                      onClick={() => setSearchTerm("")}
                      color="gray.400"
                      _hover={{ color: "gray.600" }}
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
                      px={4}
                      py={2.5}
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
                          style={{ width: "20px", height: "20px", borderRadius: "2px" }}
                        />
                        <Flex direction="column" flex="1" overflow="hidden">
                          <Text 
                            fontSize="14px" 
                            color={country.value === selectedCountry?.value ? primaryMaroon : "gray.700"} 
                            fontWeight={country.value === selectedCountry?.value ? "600" : "400"}
                            noOfLines={1}
                          >
                            {country.label}
                          </Text>
                          <Text fontSize="11px" color="gray.400">
                            +{country.phoneCode}
                          </Text>
                        </Flex>
                      </Flex>
                      {country.value === selectedCountry?.value && (
                        <LuCheck size={16} color={primaryMaroon} flexShrink={0} />
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Box flex="1">
          <Input
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder || "Enter phone number"}
            size="lg"
            height="42px"
            fontSize="14px"
            borderColor={isInvalid || phoneError ? "red.500" : "gray.200"}
            borderWidth="1.5px"
            pl={3}
            _focus={{ borderColor: isInvalid || phoneError ? "red.500" : primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
            _hover={{ borderColor: isInvalid || phoneError ? "red.500" : "gray.300" }}
          />
          {(error || phoneError) && (
            <Text fontSize="xs" color="red.500" mt={1}>{error || phoneError}</Text>
          )}
        </Box>
      </Flex>
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
  height = "42px",
  label,
  error,
}) => {
  return (
    <Box width="100%">
      {label && (
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
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
          fontSize: "14px",
          borderRadius: "8px",
          border: `1.5px solid ${isInvalid ? "#e53e3e" : "#e2e8f0"}`,
          padding: "0 14px",
          color: "#1a202c",
          background: isDisabled ? "#f7fafc" : "white",
          cursor: isDisabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!isDisabled) {
            e.target.style.borderColor = primaryMaroon;
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
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Country Dropdown
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
          <Text noOfLines={1} textAlign="left" fontWeight="500" fontSize="14px">
            {selectedOption.label}
          </Text>
        </Flex>
      );
    }
    return <Text color="gray.400" fontWeight="400" fontSize="14px">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      {label && (
        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
          {label}
        </Text>
      )}
      
      <Box
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        cursor={isDisabled ? "not-allowed" : "pointer"}
        border="1.5px solid"
        borderColor={isInvalid ? "#e53e3e" : isOpen ? primaryMaroon : "#e2e8f0"}
        borderRadius="md"
        height={height}
        px={4}
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
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            color: isOpen ? primaryMaroon : '#718096',
            flexShrink: 0,
            marginLeft: '8px'
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
              px={3} 
              py={1.5} 
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
                height="28px"
                fontSize="14px"
                _placeholder={{ color: "gray.400" }}
              />
              {searchTerm && (
                <Box
                  as="button"
                  onClick={() => setSearchTerm("")}
                  color="gray.400"
                  _hover={{ color: "gray.600" }}
                >
                  <LuX size={14} />
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
                  px={4}
                  py={2.5}
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
                    fontSize="14px" 
                    color={option.value === value ? primaryMaroon : "gray.700"} 
                    fontWeight={option.value === value ? "600" : "400"}
                    noOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <LuCheck size={16} color={primaryMaroon} flexShrink={0} />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
      
      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Year dropdown options
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1900; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

const ChurchAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [dioceses, setDioceses] = useState([]);
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [previewCode, setPreviewCode] = useState("CH-001");
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const lightGray = "#718096";

  // Currency options
  const currencyOptions = [
    { value: "USD", label: "USD ($) — US Dollar" },
    { value: "EUR", label: "EUR (€) — Euro" },
    { value: "GBP", label: "GBP (£) — British Pound" },
    { value: "INR", label: "INR (₹) — Indian Rupee" },
    { value: "AED", label: "AED (د.إ) — UAE Dirham" },
    { value: "SAR", label: "SAR (﷼) — Saudi Riyal" },
    { value: "SGD", label: "SGD (S$) — Singapore Dollar" },
    { value: "MYR", label: "MYR (RM) — Malaysian Ringgit" },
    { value: "AUD", label: "AUD (A$) — Australian Dollar" },
    { value: "CAD", label: "CAD (C$) — Canadian Dollar" },
  ];

  const yearOptions = getYearOptions();

  // Load countries and dioceses on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load countries
        const countries = Country.getAllCountries();
        const options = countries.map((country) => ({
          value: country.isoCode,
          label: country.name,
        }));
        options.sort((a, b) => a.label.localeCompare(b.label));
        setCountryOptions(options);

        // Load dioceses
        try {
          const response = await adminApi.getDioceses();
          setDioceses(response.data || []);
        } catch (error) {
          console.error("Error fetching dioceses:", error);
        }

        // Get church count for code generation - CH-XXX format
        try {
          const response = await adminApi.getChurches();
          const count = response.data?.length || 0;
          const code = `CH-${String(count + 1).padStart(3, '0')}`;
          setPreviewCode(code);
          setFormData(prev => ({ ...prev, code: code }));
        } catch (error) {
          console.error("Error fetching church count:", error);
          const code = "CH-001";
          setPreviewCode(code);
          setFormData(prev => ({ ...prev, code: code }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toaster.create({
          title: "Error",
          description: "Failed to load necessary data. Please refresh.",
          type: "error",
          duration: 5000,
        });
      }
    };
    loadData();
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
        setFormData((prev) => ({ ...prev, state: "" }));
      } catch (error) {
        console.error("Error loading states:", error);
        setStateOptions([]);
      } finally {
        setIsLoadingStates(false);
      }
    } else {
      setStateOptions([]);
      setFormData((prev) => ({ ...prev, state: "" }));
    }
  }, [formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handlePhoneChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (name === "country") {
      setFormData((prev) => ({ ...prev, state: "" }));
      setStateOptions([]);
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toaster.create({
          title: "Error",
          description: "File size should be less than 2MB",
          type: "error",
          duration: 4000,
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toaster.create({
          title: "Error",
          description: "Please upload an image file",
          type: "error",
          duration: 4000,
        });
        return;
      }
      
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Church name is required";
    if (!formData.diocese) newErrors.diocese = "Diocese is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone || formData.phone.length < 4) {
      newErrors.phone = "Valid phone number is required";
    }
    if (formData.website && !/^https?:\/\/[^\s]+$/.test(formData.website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        diocese: formData.diocese,
        established_year: formData.established_year ? parseInt(formData.established_year) : null,
        registration_number: formData.registration_number.trim() || "",
        currency: formData.currency || "",
        // 🔥 model field is `address` (Line 1) + `address_line1` (Line 2)
        address: formData.address_line1.trim() || "",
        address_line1: formData.address_line2.trim() || "",
        city: formData.city.trim() || "",
        state: formData.state || "",
        country: formData.country || "",
        postal_code: formData.postal_code.trim() || "",
        email: formData.email.trim(),
        // 🔥 backend expects `phone_number`, not `phone`
        phone_number: formData.phone || "",
        alternate_phone: formData.alternate_phone || "",
        website: formData.website.trim() || "",
        is_active: formData.is_active,
      };

      console.log("Submitting church data:", submitData);

      const response = await adminApi.createChurch(submitData);

      toaster.create({
        title: "Success",
        description: `Church ${formData.code} created successfully.`,
        type: "success",
        duration: 3000,
      });
      navigate("/admin/churches");
    } catch (error) {
      console.error("Error creating church:", error);
      let errorMsg = "Failed to create church.";
      
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

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        {/* Breadcrumb */}
        <Text fontSize="xs" color="gray.400" fontWeight="600" mb={2}>
          Churches / Register Church
        </Text>

        {/* Header */}
        <VStack align="start" spacing={1} mb={6}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Church Management
          </Text>
          <Heading fontSize="3xl" fontWeight="800" color="#1a1a2e">
            Register New Church
          </Heading>
          <Text color={lightGray} fontSize="sm">
            Create a church profile with its address and contact information.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={6} boxShadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={8} align="stretch">
              {/* 1. Basic Information */}
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>
                  1. Basic Information
                </Text>

                <Flex gap={6} mb={4} direction={{ base: "column", md: "row" }}>
                  {/* Logo Upload Area */}
                  <Box flexShrink={0}>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Church Logo
                    </Text>
                    <Box
                      ref={dropRef}
                      border={`2px dashed ${isDragging ? primaryMaroon : primaryMaroon}`}
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                      bg={isDragging ? `rgba(174,32,80,0.05)` : "gray.50"}
                      transition="all 0.2s"
                      w="180px"
                      h="180px"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      cursor="pointer"
                      onClick={() => fileInputRef.current?.click()}
                      position="relative"
                      borderColor={primaryMaroon}
                    >
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Church Logo"
                          objectFit="cover"
                          w="100%"
                          h="100%"
                          borderRadius="md"
                        />
                      ) : (
                        <>
                          <Icon as={LuUpload} boxSize={8} color={primaryMaroon} mb={2} />
                          <Icon as={LuChurch} boxSize={10} color={primaryMaroon} mb={2} />
                          <Text fontSize="xs" color="gray.500">Drop or Click</Text>
                          <Text fontSize="xs" color="gray.400">PNG/JPG up to 2MB</Text>
                        </>
                      )}
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
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
                          _hover={{ bg: "red.600" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoPreview(null);
                            setFormData({ ...formData, logo: null });
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <LuX size={12} />
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Church Name and Code */}
                  <Box flex="1">
                    {/* Row 1: Church Name + Church Code */}
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                          Church Name <Text as="span" color={primaryMaroon}>*</Text>
                        </Text>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter church name"
                          borderColor={errors.name ? "red.500" : "gray.200"}
                          size="lg"
                          height="42px"
                          fontSize="14px"
                          borderWidth="1.5px"
                          _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                        />
                        {errors.name && <Text fontSize="xs" color="red.500" mt={1}>{errors.name}</Text>}
                      </GridItem>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
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
                          <Text fontSize="sm" fontWeight="600" color={primaryMaroon}>
                            {previewCode}
                          </Text>
                          <Text fontSize="xs" color="gray.400" ml={2}>
                            (Auto)
                          </Text>
                        </Box>
                      </GridItem>
                    </Grid>

                    {/* Row 2: Diocese + Established Year with Calendar Icon */}
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mt={4}>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                          Diocese <Text as="span" color={primaryMaroon}>*</Text>
                        </Text>
                        <select
                          value={formData.diocese}
                          onChange={(e) => handleSelectChange("diocese", e.target.value)}
                          style={{
                            width: "100%",
                            height: "42px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            border: `1.5px solid ${errors.diocese ? "#e53e3e" : "#e2e8f0"}`,
                            padding: "0 14px",
                            color: "#1a202c",
                            background: "white",
                            cursor: "pointer",
                            outline: "none",
                          }}
                          onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                          onBlur={(e) => e.target.style.borderColor = errors.diocese ? "#e53e3e" : "#e2e8f0"}
                        >
                          <option value="">Select Diocese</option>
                          {dioceses.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        {errors.diocese && <Text fontSize="xs" color="red.500" mt={1}>{errors.diocese}</Text>}
                      </GridItem>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                          Established Year
                        </Text>
                        <Box position="relative">
                          <select
                            value={formData.established_year}
                            onChange={(e) => handleSelectChange("established_year", e.target.value)}
                            style={{
                              width: "100%",
                              height: "42px",
                              fontSize: "14px",
                              borderRadius: "8px",
                              border: `1.5px solid ${errors.established_year ? "#e53e3e" : "#e2e8f0"}`,
                              padding: "0 14px",
                              color: "#1a202c",
                              background: "white",
                              cursor: "pointer",
                              outline: "none",
                              appearance: "none",
                              WebkitAppearance: "none",
                              paddingRight: "40px",
                            }}
                            onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                            onBlur={(e) => e.target.style.borderColor = errors.established_year ? "#e53e3e" : "#e2e8f0"}
                          >
                            <option value="">Select Year</option>
                            {yearOptions.map((year) => (
                              <option key={year.value} value={year.value}>{year.label}</option>
                            ))}
                          </select>
                          <Box
                            position="absolute"
                            right="12px"
                            top="50%"
                            transform="translateY(-50%)"
                            color="gray.400"
                            pointerEvents="none"
                          >
                            <Icon as={LuCalendar} boxSize={5} />
                          </Box>
                        </Box>
                        {errors.established_year && <Text fontSize="xs" color="red.500" mt={1}>{errors.established_year}</Text>}
                      </GridItem>
                    </Grid>

                    {/* Row 3: Registration Number + Currency */}
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mt={4}>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                          Registration Number
                        </Text>
                        <Input
                          name="registration_number"
                          value={formData.registration_number}
                          onChange={handleChange}
                          placeholder="REG-1998-0456"
                          size="lg"
                          height="42px"
                          fontSize="14px"
                          borderWidth="1.5px"
                          _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                        />
                      </GridItem>
                      <GridItem>
                        <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                          Currency
                        </Text>
                        <select
                          value={formData.currency}
                          onChange={(e) => handleSelectChange("currency", e.target.value)}
                          style={{
                            width: "100%",
                            height: "42px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            border: `1.5px solid ${errors.currency ? "#e53e3e" : "#e2e8f0"}`,
                            padding: "0 14px",
                            color: "#1a202c",
                            background: "white",
                            cursor: "pointer",
                            outline: "none",
                          }}
                          onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                          onBlur={(e) => e.target.style.borderColor = errors.currency ? "#e53e3e" : "#e2e8f0"}
                        >
                          <option value="">Select Currency</option>
                          {currencyOptions.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </GridItem>
                    </Grid>
                  </Box>
                </Flex>
              </Box>

              {/* 2. Address */}
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>
                  2. Address
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Address Line 1
                    </Text>
                    <Input
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      placeholder="24 Hill Road"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                    />
                  </GridItem>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Address Line 2
                    </Text>
                    <Input
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      placeholder="Bandra West"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                    />
                  </GridItem>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={4} mt={4}>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      City
                    </Text>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                    />
                  </GridItem>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      State
                    </Text>
                    {isLoadingStates ? (
                      <Flex align="center" gap={2} height="42px" bg="gray.50" px={4} borderRadius="md" border="1.5px solid" borderColor="gray.200">
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
                        height="42px"
                      />
                    ) : (
                      <Box
                        bg="gray.50"
                        px={4}
                        borderRadius="md"
                        border="1.5px solid"
                        borderColor="gray.200"
                        height="42px"
                        display="flex"
                        alignItems="center"
                      >
                        <Text color="gray.500" fontSize="sm">
                          {formData.country ? "No states" : "Select country first"}
                        </Text>
                      </Box>
                    )}
                  </GridItem>
                  <GridItem>
                    <CountryDropdown
                      label="Country"
                      options={countryOptions}
                      value={formData.country}
                      onChange={(value) => handleSelectChange("country", value)}
                      placeholder="Select Country"
                      isInvalid={!!errors.country}
                      error={errors.country}
                      height="42px"
                    />
                  </GridItem>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Postal Code
                    </Text>
                    <Input
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="400050"
                      size="lg"
                      height="42px"
                      fontSize="14px"
                      borderWidth="1.5px"
                      _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                    />
                  </GridItem>
                </Grid>
              </Box>

              {/* 3. Primary Contact */}
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>
                  3. Primary Contact
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Email Address <Text as="span" color={primaryMaroon}>*</Text>
                    </Text>
                    <Box position="relative">
                      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                        <LuMail color="#a0aec0" size={18} />
                      </Box>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contact@stmaryschurch.in"
                        borderColor={errors.email ? "red.500" : "gray.200"}
                        size="lg"
                        height="42px"
                        fontSize="14px"
                        pl={10}
                        borderWidth="1.5px"
                        _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                      />
                    </Box>
                    {errors.email && <Text fontSize="xs" color="red.500" mt={1}>{errors.email}</Text>}
                  </GridItem>
                  <GridItem>
                    <PhoneInputWithCountry
                      label="Phone Number *"
                      value={formData.phone}
                      onChange={(value) => handlePhoneChange("phone", value)}
                      placeholder="Enter phone number"
                      isInvalid={!!errors.phone}
                      error={errors.phone}
                    />
                  </GridItem>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mt={4}>
                  <GridItem>
                    <PhoneInputWithCountry
                      label="Alternate Phone"
                      value={formData.alternate_phone}
                      onChange={(value) => handlePhoneChange("alternate_phone", value)}
                      placeholder="Enter alternate phone"
                      isInvalid={!!errors.alternate_phone}
                      error={errors.alternate_phone}
                    />
                  </GridItem>
                  <GridItem>
                    <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                      Website
                    </Text>
                    <Box position="relative">
                      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                        <LuGlobe color="#a0aec0" size={18} />
                      </Box>
                      <Input
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="www.stmaryschurch.in"
                        size="lg"
                        height="42px"
                        fontSize="14px"
                        borderColor={errors.website ? "red.500" : "gray.200"}
                        pl={10}
                        borderWidth="1.5px"
                        _focus={{ borderColor: primaryMaroon, boxShadow: `0 0 0 1px ${primaryMaroon}` }}
                      />
                    </Box>
                    {errors.website && <Text fontSize="xs" color="red.500" mt={1}>{errors.website}</Text>}
                  </GridItem>
                </Grid>
              </Box>

             

              {/* Actions */}
              <Flex gap={4} pt={4} borderTop="1px solid" borderColor="gray.100" justify="flex-end" flexWrap="wrap">
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#8a1a3e" }}
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Registering..."
                  size="lg"
                  px={8}
                  leftIcon={<LuSave size={18} />}
                >
                  Register Church
                </Button>
              </Flex>
               {/* Info Box */}
              <Box
                bg="rgba(174,32,80,0.06)"
                p={4}
                borderRadius="lg"
                border={`1px solid ${primaryMaroon}`}
              >
                <Flex align="center" gap={3}>
                  <Icon as={LuCircleHelp} boxSize={5} color={primaryMaroon} />
                  <Text fontSize="sm" color="#333">
                    The church will be assigned code <strong style={{ color: primaryMaroon }}>{previewCode}</strong> and can be assigned to a diocese.
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

export default ChurchAdd;