// src/components/CustomSelect.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Flex,
  Portal,
} from "@chakra-ui/react";
import { LuChevronDown, LuSearch, LuX, LuCheck } from "react-icons/lu";

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isInvalid = false,
  height = "48px",
  label,
  error,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Define filteredOptions BEFORE any useEffect that uses it
  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.phoneCode && opt.phoneCode.includes(searchTerm))
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
      setTimeout(() => {
        searchRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
      
      if (event.key === "Enter" && filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!isDisabled) {
      setIsOpen(!isOpen);
      if (!isOpen) setSearchTerm("");
    }
  };

  const getDisplayValue = () => {
    if (selectedOption && selectedOption.value !== "") {
      return (
        <Flex align="center" gap={2} flex="1" overflow="hidden">
          {selectedOption.flag && (
            <Text fontSize="20px" flexShrink={0}>{selectedOption.flag}</Text>
          )}
          <Text noOfLines={1} textAlign="left" fontWeight="500">
            {selectedOption.label}
          </Text>
          {selectedOption.phoneCode && (
            <Text fontSize="sm" color="gray.500" flexShrink={0} ml="auto">
              +{selectedOption.phoneCode}
            </Text>
          )}
        </Flex>
      );
    }
    return <Text color="gray.400" fontWeight="400">{placeholder}</Text>;
  };

  return (
    <Box ref={containerRef} position="relative" width="100%" {...rest}>
      {label && (
        <Text 
          fontSize="sm" 
          fontWeight="600" 
          color="gray.700" 
          mb={1.5}
        >
          {label}
        </Text>
      )}
      
      <Button
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        width="100%"
        height={height}
        justifyContent="space-between"
        bg="white"
        border="2px solid"
        borderColor={
          isInvalid ? "red.500" : 
          isOpen ? "#ae2050" : 
          "gray.200"
        }
        borderRadius="lg"
        _hover={{ 
          borderColor: isInvalid ? "red.500" : "gray.300",
          bg: "white"
        }}
        _focus={{ 
          borderColor: "#ae2050", 
          boxShadow: "0 0 0 3px rgba(174,32,80,0.1)",
          outline: "none"
        }}
        _active={{ 
          borderColor: "#ae2050",
          bg: "white"
        }}
        isDisabled={isDisabled}
        fontSize="14px"
        fontWeight="400"
        color="gray.800"
        px={4}
        py={0}
        transition="all 0.2s"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || "Select dropdown"}
      >
        {getDisplayValue()}
        
        <Flex align="center" gap={1} ml={2} flexShrink={0}>
          {value && value !== "" && (
            <Box
              as="span"
              onClick={handleClear}
              color="gray.400"
              _hover={{ color: "gray.600" }}
              p={1}
              borderRadius="full"
              _hover={{ bg: "gray.100" }}
              aria-label="Clear selection"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
            >
              <LuX size={14} />
            </Box>
          )}
          <LuChevronDown 
            size={18} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
              color: isOpen ? '#ae2050' : '#718096'
            }} 
          />
        </Flex>
      </Button>

      {isOpen && !isDisabled && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={999}
            onClick={() => {
              setIsOpen(false);
              setSearchTerm("");
            }}
          />
          <Box
            ref={dropdownRef}
            position="absolute"
            left="0"
            right="0"
            top="calc(100% + 6px)"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="xl"
            zIndex={1000}
            maxHeight="360px"
            overflow="hidden"
            animation="slideDown 0.2s ease"
            sx={{
              '@keyframes slideDown': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-8px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              }
            }}
          >
            {/* Search Header */}
            <Box p={3} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
              <Flex 
                align="center" 
                gap={2} 
                bg="white" 
                px={3} 
                py={1.5} 
                borderRadius="md" 
                border="1px solid" 
                borderColor="gray.200"
                transition="border-color 0.2s"
                _focusWithin={{
                  borderColor: "#ae2050",
                  boxShadow: "0 0 0 2px rgba(174,32,80,0.1)"
                }}
              >
                <LuSearch size={16} color="#718096" flexShrink={0} />
                <Input
                  ref={searchRef}
                  placeholder="Search by name or dial code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  border="none"
                  _focus={{ 
                    boxShadow: "none",
                    border: "none"
                  }}
                  bg="transparent"
                  px={0}
                  height="32px"
                  fontSize="14px"
                  _placeholder={{ color: "gray.400" }}
                  aria-label="Search options"
                />
                {searchTerm && (
                  <Box
                    as="button"
                    onClick={() => setSearchTerm("")}
                    color="gray.400"
                    _hover={{ color: "gray.600" }}
                    flexShrink={0}
                    p={1}
                  >
                    <LuX size={14} />
                  </Box>
                )}
              </Flex>
            </Box>

            {/* Options List */}
            <Box 
              maxHeight="260px" 
              overflowY="auto"
              role="listbox"
              aria-label="Options"
              css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'gray.50',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e0',
                  borderRadius: '24px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#a0aec0',
                },
              }}
            >
              {filteredOptions.length === 0 ? (
                <Box px={4} py={8} textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    No options found
                  </Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {filteredOptions.map((option, index) => (
                    <Box
                      key={option.value}
                      role="option"
                      aria-selected={option.value === value}
                      tabIndex={0}
                      px={4}
                      py={3}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      _focus={{ 
                        bg: "gray.50",
                        outline: "2px solid #ae2050",
                        outlineOffset: "-2px"
                      }}
                      onClick={() => handleSelect(option)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(option);
                        }
                      }}
                      bg={option.value === value ? "purple.50" : "transparent"}
                      transition="all 0.15s"
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottom={index < filteredOptions.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.50"
                    >
                      <Flex align="center" gap={3} flex="1" overflow="hidden">
                        {option.flag && (
                          <Text fontSize="22px" flexShrink={0}>{option.flag}</Text>
                        )}
                        <Flex direction="column" flex="1" overflow="hidden">
                          <Text 
                            fontSize="14px" 
                            color={option.value === value ? "#ae2050" : "gray.700"} 
                            fontWeight={option.value === value ? "600" : "400"}
                            noOfLines={1}
                          >
                            {option.label}
                          </Text>
                          {option.phoneCode && (
                            <Text fontSize="11px" color="gray.400" fontWeight="400">
                              +{option.phoneCode}
                            </Text>
                          )}
                        </Flex>
                      </Flex>
                      {option.value === value && (
                        <LuCheck size={18} color="#ae2050" flexShrink={0} />
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Footer with count */}
            {filteredOptions.length > 0 && (
              <Box 
                px={4} 
                py={2} 
                borderTop="1px solid" 
                borderColor="gray.100"
                bg="gray.50"
              >
                <Text fontSize="xs" color="gray.400">
                  {filteredOptions.length} option{filteredOptions.length > 1 ? 's' : ''} available
                </Text>
              </Box>
            )}
          </Box>
        </Portal>
      )}
      
      {error && (
        <Text fontSize="xs" color="red.500" mt={1.5}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// ✅ Make sure this is a default export
export default CustomSelect;