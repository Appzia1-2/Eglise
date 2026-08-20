// src/components/PhoneInput.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuChevronDown, LuSearch, LuCheck } from "react-icons/lu";

const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India" },
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia" },
  { code: "+81", country: "JP", flag: "🇯🇵", label: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", label: "China" },
  { code: "+49", country: "DE", flag: "🇩🇪", label: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", label: "France" },
  { code: "+39", country: "IT", flag: "🇮🇹", label: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", label: "Spain" },
  { code: "+55", country: "BR", flag: "🇧🇷", label: "Brazil" },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa" },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "UAE" },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia" },
  { code: "+65", country: "SG", flag: "🇸🇬", label: "Singapore" },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia" },
  { code: "+64", country: "NZ", flag: "🇳🇿", label: "New Zealand" },
  { code: "+31", country: "NL", flag: "🇳🇱", label: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", label: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", label: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", label: "Denmark" },
  { code: "+358", country: "FI", flag: "🇫🇮", label: "Finland" },
  { code: "+353", country: "IE", flag: "🇮🇪", label: "Ireland" },
  { code: "+32", country: "BE", flag: "🇧🇪", label: "Belgium" },
  { code: "+41", country: "CH", flag: "🇨🇭", label: "Switzerland" },
  { code: "+43", country: "AT", flag: "🇦🇹", label: "Austria" },
  { code: "+30", country: "GR", flag: "🇬🇷", label: "Greece" },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey" },
  { code: "+234", country: "NG", flag: "🇳🇬", label: "Nigeria" },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya" },
  { code: "+256", country: "UG", flag: "🇺🇬", label: "Uganda" },
  { code: "+233", country: "GH", flag: "🇬🇭", label: "Ghana" },
  { code: "+52", country: "MX", flag: "🇲🇽", label: "Mexico" },
  { code: "+54", country: "AR", flag: "🇦🇷", label: "Argentina" },
  { code: "+56", country: "CL", flag: "🇨🇱", label: "Chile" },
  { code: "+57", country: "CO", flag: "🇨🇴", label: "Colombia" },
  { code: "+82", country: "KR", flag: "🇰🇷", label: "South Korea" },
  { code: "+62", country: "ID", flag: "🇮🇩", label: "Indonesia" },
  { code: "+63", country: "PH", flag: "🇵🇭", label: "Philippines" },
  { code: "+66", country: "TH", flag: "🇹🇭", label: "Thailand" },
  { code: "+84", country: "VN", flag: "🇻🇳", label: "Vietnam" },
  { code: "+20", country: "EG", flag: "🇪🇬", label: "Egypt" },
  { code: "+212", country: "MA", flag: "🇲🇦", label: "Morocco" },
  { code: "+216", country: "TN", flag: "🇹🇳", label: "Tunisia" },
];

const PhoneInput = ({
  value,
  onChange,
  placeholder = "Enter phone number",
  isInvalid = false,
  label,
  error,
  ...rest
}) => {
  const [selectedCountry, setSelectedCountry] = useState(
    countryCodes.find((c) => c.code === "+91") || countryCodes[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (value) {
      const matched = countryCodes.find((c) => value.startsWith(c.code));
      if (matched) {
        setSelectedCountry(matched);
        setPhoneNumber(value.replace(matched.code, ""));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

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
      setTimeout(() => {
        searchRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");
    const fullNumber = country.code + phoneNumber;
    onChange(fullNumber);
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setPhoneNumber(rawValue);
    const fullNumber = selectedCountry.code + rawValue;
    onChange(fullNumber);
  };

  const filteredCountries = searchTerm
    ? countryCodes.filter(
        (c) =>
          c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.includes(searchTerm) ||
          c.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : countryCodes;

  return (
    <Box ref={containerRef} position="relative" width="100%" {...rest}>
      {label && (
        <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
          {label}
        </Text>
      )}
      
      <Flex
        width="100%"
        border="2px solid"
        borderColor={isInvalid ? "red.500" : "gray.200"}
        borderRadius="md"
        bg="white"
        _focusWithin={{
          borderColor: isInvalid ? "red.500" : "#ae2050",
          boxShadow: "0 0 0 3px rgba(174,32,80,0.1)",
        }}
        transition="all 0.2s"
        overflow="hidden"
        height="48px"
      >
        {/* Country Code Selector */}
        <Box
          as="button"
          type="button"
          display="flex"
          alignItems="center"
          gap={1.5}
          px={3}
          borderRight="1px solid"
          borderColor="gray.200"
          bg="transparent"
          cursor="pointer"
          _hover={{ bg: "gray.50" }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm("");
          }}
          flexShrink={0}
          minW="90px"
          height="100%"
        >
          <Text fontSize="lg" lineHeight="1">
            {selectedCountry.flag}
          </Text>
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            {selectedCountry.code}
          </Text>
          <LuChevronDown 
            size={14} 
            color="gray.500"
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </Box>

        {/* Phone Number Input */}
        <Input
          type="tel"
          placeholder={placeholder}
          value={phoneNumber}
          onChange={handlePhoneChange}
          border="none"
          borderRadius="none"
          _focus={{ boxShadow: "none" }}
          fontSize="14px"
          height="100%"
          bg="transparent"
          px={3}
          _placeholder={{ color: "gray.400" }}
          flex="1"
        />

        {/* Country Dropdown */}
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
            boxShadow="lg"
            zIndex={1000}
            maxHeight="300px"
            overflow="hidden"
          >
            {/* Search */}
            <Box p={3} borderBottom="1px solid" borderColor="gray.100">
              <Flex align="center" gap={2} bg="gray.50" px={3} py={1.5} borderRadius="md" border="1px solid" borderColor="gray.100">
                <LuSearch size={16} color="gray.400" />
                <Input
                  ref={searchRef}
                  placeholder="Search country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  border="none"
                  _focus={{ boxShadow: "none" }}
                  bg="transparent"
                  px={0}
                  height="30px"
                  fontSize="14px"
                />
              </Flex>
            </Box>

            {/* Country List */}
            <Box maxHeight="220px" overflowY="auto" css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '4px',
                background: 'gray.50',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.300',
                borderRadius: '24px',
              },
            }}>
              {filteredCountries.length === 0 ? (
                <Box px={4} py={6} textAlign="center">
                  <Text fontSize="sm" color="gray.400">No countries found</Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {filteredCountries.map((country) => (
                    <Box
                      key={country.code + country.country}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      onClick={() => handleCountrySelect(country)}
                      bg={
                        selectedCountry.code === country.code &&
                        selectedCountry.country === country.country
                          ? "purple.50"
                          : "transparent"
                      }
                      transition="background 0.15s"
                    >
                      <Flex align="center" gap={3}>
                        <Text fontSize="20px" lineHeight="1">
                          {country.flag}
                        </Text>
                        <Text fontSize="14px" fontWeight="500" color="gray.700">
                          {country.label}
                        </Text>
                        <Text fontSize="13px" color="gray.400" ml={1}>
                          {country.code}
                        </Text>
                      </Flex>
                      {selectedCountry.code === country.code &&
                        selectedCountry.country === country.country && (
                          <LuCheck size={18} color="#ae2050" />
                        )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        )}
      </Flex>
      
      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

export default PhoneInput;