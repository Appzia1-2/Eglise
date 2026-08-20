// src/admin/pages/TaxRateEditPage.jsx
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
  LuPercent,
  LuCalendar,
  LuArrowLeft,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

const TaxRateEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxTypes, setTaxTypes] = useState([]);
  const [formData, setFormData] = useState({
    tax_rate_code: "",
    tax_rate_name: "",
    tax_type_id: "",
    rate_percentage: "",
    effective_from: "",
    effective_until: "",
    is_active: true,
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tax types and tax rate detail in parallel
      const [taxTypesRes, taxRateRes] = await Promise.all([
        adminApi.getTaxTypes(),
        adminApi.getTaxRateDetail(id),
      ]);

      // Set tax types
      let taxTypesData = [];
      if (taxTypesRes && taxTypesRes.data) {
        taxTypesData = taxTypesRes.data;
      } else if (Array.isArray(taxTypesRes)) {
        taxTypesData = taxTypesRes;
      }
      setTaxTypes(taxTypesData);

      // Set form data from tax rate detail
      const taxRate = taxRateRes.data || taxRateRes;
      setFormData({
        tax_rate_code: taxRate.tax_rate_code || "",
        tax_rate_name: taxRate.tax_rate_name || "",
        tax_type_id: taxRate.tax_type_id || "",
        rate_percentage: taxRate.rate_percentage || "",
        effective_from: taxRate.effective_from || "",
        effective_until: taxRate.effective_until || "",
        is_active: taxRate.is_active !== undefined ? taxRate.is_active : true,
        description: taxRate.description || "",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load tax rate details.",
        type: "error",
        duration: 4000,
      });
      navigate("/admin/tax-rates");
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
    if (!formData.tax_rate_code.trim()) {
      newErrors.tax_rate_code = "Tax rate code is required";
    }
    if (!formData.tax_rate_name.trim()) {
      newErrors.tax_rate_name = "Tax rate name is required";
    }
    if (!formData.tax_type_id) {
      newErrors.tax_type_id = "Tax type is required";
    }
    if (!formData.rate_percentage) {
      newErrors.rate_percentage = "Rate percentage is required";
    } else if (parseFloat(formData.rate_percentage) < 0) {
      newErrors.rate_percentage = "Rate percentage cannot be negative";
    }
    if (!formData.effective_from) {
      newErrors.effective_from = "Effective from date is required";
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
        tax_rate_code: formData.tax_rate_code.trim().toUpperCase(),
        tax_rate_name: formData.tax_rate_name.trim(),
        tax_type_id: parseInt(formData.tax_type_id),
        rate_percentage: parseFloat(formData.rate_percentage),
        effective_from: formData.effective_from,
        effective_until: formData.effective_until || null,
        is_active: formData.is_active,
        description: formData.description.trim(),
      };

      await adminApi.updateTaxRate(id, data);

      toaster.create({
        title: "Success",
        description: `Tax rate "${data.tax_rate_name}" updated successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate("/admin/tax-rates");
    } catch (error) {
      console.error("Error updating tax rate:", error);
      let errorMsg = "Failed to update tax rate.";
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
          onClick={() => navigate("/admin/tax-rates")}
          mb={4}
          leftIcon={<LuArrowLeft />}
          color="gray.600"
        >
          Back to Tax Rates
        </Button>

        <VStack align="start" spacing={1} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Tax Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Edit Tax Rate
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Update tax rate details.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuPercent} boxSize={5} />
            </Circle>
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              Edit Tax Rate
            </Heading>
          </HStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Rate Code *
                  </Text>
                  <Input
                    name="tax_rate_code"
                    value={formData.tax_rate_code}
                    onChange={handleChange}
                    placeholder="e.g., GST-18, VAT-12"
                    borderColor={errors.tax_rate_code ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    textTransform="uppercase"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.tax_rate_code && <Text fontSize="xs" color="red.500" mt={1}>{errors.tax_rate_code}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Unique identifier for this tax rate
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Rate Name *
                  </Text>
                  <Input
                    name="tax_rate_name"
                    value={formData.tax_rate_name}
                    onChange={handleChange}
                    placeholder="e.g., GST @ 18%, VAT @ 12%"
                    borderColor={errors.tax_rate_name ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.tax_rate_name && <Text fontSize="xs" color="red.500" mt={1}>{errors.tax_rate_name}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Display name for this tax rate
                  </Text>
                </GridItem>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Tax Type *
                  </Text>
                  <Box
                    as="select"
                    name="tax_type_id"
                    value={formData.tax_type_id}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
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
                    <option value="">Select Tax Type</option>
                    {taxTypes.filter(t => t.is_active).map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.tax_type_code} - {type.tax_type_name}
                      </option>
                    ))}
                  </Box>
                  {errors.tax_type_id && <Text fontSize="xs" color="red.500" mt={1}>{errors.tax_type_id}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Tax type this rate belongs to
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Rate Percentage *
                  </Text>
                  <Input
                    type="number"
                    name="rate_percentage"
                    value={formData.rate_percentage}
                    onChange={handleChange}
                    placeholder="e.g., 18.00"
                    borderColor={errors.rate_percentage ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    step="0.01"
                    min="0"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.rate_percentage && <Text fontSize="xs" color="red.500" mt={1}>{errors.rate_percentage}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Tax rate percentage (e.g., 18 for 18%)
                  </Text>
                </GridItem>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Effective From *
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuCalendar color="#a0aec0" size={15} />
                    </Box>
                    <Input
                      type="date"
                      name="effective_from"
                      value={formData.effective_from}
                      onChange={handleChange}
                      borderColor={errors.effective_from ? "red.500" : "gray.200"}
                      size="md"
                      height="40px"
                      fontSize="13px"
                      pl={8}
                      borderWidth="1.5px"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                    />
                  </Box>
                  {errors.effective_from && <Text fontSize="xs" color="red.500" mt={1}>{errors.effective_from}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Date from which this rate is effective
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Effective Until
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuCalendar color="#a0aec0" size={15} />
                    </Box>
                    <Input
                      type="date"
                      name="effective_until"
                      value={formData.effective_until}
                      onChange={handleChange}
                      borderColor="gray.200"
                      size="md"
                      height="40px"
                      fontSize="13px"
                      pl={8}
                      borderWidth="1.5px"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                    />
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Date until which this rate is effective (leave blank for no expiry)
                  </Text>
                </GridItem>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
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
                    Toggle to activate or deactivate this tax rate
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Description
                  </Text>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional description or notes"
                    size="md"
                    height="40px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Optional description for this tax rate
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
                      Tax rates are used to calculate tax amounts during billing.
                    </Text>
                  </Flex>
                </Box>

                <HStack spacing={3}>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/tax-rates")}
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
                    <Icon as={LuSave} boxSize={4} /> Update Tax Rate
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

export default TaxRateEditPage;