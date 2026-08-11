// src/admin/pages/TaxTypeEditPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  Circle,
  Switch,
  Spinner,
} from "@chakra-ui/react";
import {
  LuSave,
  LuCircleHelp,
  LuTags,
  LuGlobe,
  LuArrowLeft,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

// Country list for dropdown
const countries = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
  { code: "RU", name: "Russia" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "NL", name: "Netherlands" },
];

const TaxTypeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tax_type_code: "",
    tax_type_name: "",
    country: "",
    is_active: true,
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if data was passed via state
    if (location.state?.taxType) {
      const taxType = location.state.taxType;
      setFormData({
        tax_type_code: taxType.tax_type_code || "",
        tax_type_name: taxType.tax_type_name || "",
        country: taxType.country || "",
        is_active: taxType.is_active !== undefined ? taxType.is_active : true,
        description: taxType.description || "",
      });
      setIsLoading(false);
    } else {
      fetchTaxType();
    }
  }, [id]);

  const fetchTaxType = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTaxTypeDetail(id);
      const taxType = response.data || response;
      setFormData({
        tax_type_code: taxType.tax_type_code || "",
        tax_type_name: taxType.tax_type_name || "",
        country: taxType.country || "",
        is_active: taxType.is_active !== undefined ? taxType.is_active : true,
        description: taxType.description || "",
      });
    } catch (error) {
      console.error("Error fetching tax type:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load tax type details.",
        type: "error",
        duration: 4000,
      });
      navigate("/admin/tax-types");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleActiveToggle = (details) => {
    setFormData({
      ...formData,
      is_active: details.checked === true,
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.tax_type_code.trim()) {
      newErrors.tax_type_code = "Tax type code is required";
    } else if (!/^[A-Z0-9_]+$/.test(formData.tax_type_code.trim())) {
      newErrors.tax_type_code = "Only uppercase letters, numbers, and underscores allowed";
    }
    if (!formData.tax_type_name.trim()) {
      newErrors.tax_type_name = "Tax type name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = {
        tax_type_code: formData.tax_type_code.trim().toUpperCase(),
        tax_type_name: formData.tax_type_name.trim(),
        country: formData.country || null,
        is_active: formData.is_active,
        description: formData.description.trim(),
      };

      await adminApi.updateTaxType(id, data);

      toaster.create({
        title: "Success",
        description: `Tax type "${data.tax_type_name}" updated successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate("/admin/tax-types");
    } catch (error) {
      console.error("Error updating tax type:", error);
      let errorMsg = "Failed to update tax type.";
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      toaster.create({
        title: "Error",
        description: errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/tax-types")}
          mb={4}
          leftIcon={<LuArrowLeft />}
          color="gray.600"
        >
          Back to Tax Types
        </Button>

        <VStack align="start" spacing={1} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Tax Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Edit Tax Type
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Update tax type details.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuTags} boxSize={5} />
            </Circle>
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              Edit Tax Type
            </Heading>
          </HStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Type Code *
                  </Text>
                  <Input
                    name="tax_type_code"
                    value={formData.tax_type_code}
                    onChange={handleChange}
                    placeholder="e.g., GST, VAT, ST"
                    borderColor={errors.tax_type_code ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    textTransform="uppercase"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.tax_type_code && <Text fontSize="xs" color="red.500" mt={1}>{errors.tax_type_code}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Unique identifier for this tax type
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Type Name *
                  </Text>
                  <Input
                    name="tax_type_name"
                    value={formData.tax_type_name}
                    onChange={handleChange}
                    placeholder="e.g., Goods and Services Tax"
                    borderColor={errors.tax_type_name ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.tax_type_name && <Text fontSize="xs" color="red.500" mt={1}>{errors.tax_type_name}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Full name of the tax type
                  </Text>
                </GridItem>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Country
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuGlobe color="#a0aec0" size={15} />
                    </Box>
                    <Box
                      as="select"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 32px",
                        borderRadius: "6px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "13px",
                        height: "40px",
                        background: "white",
                        outline: "none",
                        appearance: "auto"
                      }}
                      onFocus={(e) => e.target.style.borderColor = primaryMaroon}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    >
                      <option value="">Select Country (Global)</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </Box>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Country where this tax type is applicable
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Status
                  </Text>
                  <Flex align="center" gap={3} border="1.5px solid" borderColor="gray.200" borderRadius="md" px={3} height="40px">
                    <Switch.Root
                      checked={formData.is_active}
                      onCheckedChange={handleActiveToggle}
                      colorPalette="green"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm" color="gray.600">
                      {formData.is_active ? "Active" : "Inactive"}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Toggle to activate or deactivate this tax type
                  </Text>
                </GridItem>
              </Grid>

              <Grid templateColumns="1fr" gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Description
                  </Text>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional description or notes about this tax type"
                    size="md"
                    height="40px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Optional description for this tax type
                  </Text>
                </GridItem>
              </Grid>

              <Flex gap={4} align="center" flexWrap="wrap" pt={2}>
                <Box
                  flex="1"
                  minW="260px"
                  bg="rgba(174,32,80,0.06)"
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="rgba(174,32,80,0.15)"
                >
                  <Flex align="center" gap={2.5}>
                    <Icon as={LuCircleHelp} boxSize={4} color={primaryMaroon} />
                    <Text fontSize="xs" color="#333">
                      Tax types are used to categorize taxes applied during billing.
                    </Text>
                  </Flex>
                </Box>

                <HStack spacing={3}>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/tax-types")}
                    size="lg"
                    px={6}
                  >
                    Cancel
                  </Button>
                  <Button
                    bg={primaryMaroon}
                    color="white"
                    _hover={{ bg: "#8a1a3e" }}
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Updating..."
                    size="lg"
                    px={8}
                  >
                    <Icon as={LuSave} boxSize={4} /> Update Tax Type
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default TaxTypeEditPage;