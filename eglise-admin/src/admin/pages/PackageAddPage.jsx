// src/admin/pages/PackageAddPage.jsx
import React, { useState } from "react";
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
  Switch,
  Circle,
} from "@chakra-ui/react";
import {
  LuSave,
  LuCircleHelp,
  LuHash,
  LuUsers,
  LuIndianRupee,
  LuBox,
} from "react-icons/lu";
// Use the SAME import path as DioceseAdd
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const PackageAddPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    member_limit: "",
    rate_per_member_monthly: "",
    rate_per_member_yearly: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [packageCount, setPackageCount] = useState(0);

  const primaryMaroon = "#ae2050";

  // Fetch package count on mount
  React.useEffect(() => {
    const fetchPackageCount = async () => {
      try {
        const response = await adminApi.getPackages();
        setPackageCount(response?.count || response?.results?.length || 0);
      } catch (error) {
        console.error("Error fetching package count:", error);
      }
    };
    fetchPackageCount();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
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
    if (!formData.name.trim()) newErrors.name = "Package name is required";
    if (!formData.rate_per_member_monthly || parseFloat(formData.rate_per_member_monthly) <= 0) {
      newErrors.rate_per_member_monthly = "Monthly rate is required and must be greater than 0";
    }
    if (!formData.rate_per_member_yearly || parseFloat(formData.rate_per_member_yearly) <= 0) {
      newErrors.rate_per_member_yearly = "Yearly rate is required and must be greater than 0";
    }
    if (formData.member_limit && parseInt(formData.member_limit) < 0) {
      newErrors.member_limit = "Member limit cannot be negative";
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
        name: formData.name.trim(),
        member_limit: formData.member_limit ? parseInt(formData.member_limit) : null,
        rate_per_member_monthly: parseFloat(formData.rate_per_member_monthly) || 0,
        rate_per_member_yearly: parseFloat(formData.rate_per_member_yearly) || 0,
        is_active: formData.is_active,
      };

      await adminApi.createPackage(data);

      toaster.create({
        title: "Success",
        description: `Package "${formData.name}" created successfully.`,
        type: "success",
        duration: 3000,
      });

      navigate("/admin/packages");
    } catch (error) {
      console.error("Error creating package:", error);
      let errorMsg = "Failed to create package.";
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
      setIsSubmitting(false);
    }
  };

  const previewCode = `PKG-${String(packageCount + 1).padStart(3, "0")}`;

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={4}>
        <Text fontSize="xs" color="gray.400" fontWeight="600" mb={2}>
          Packages / Create Package
        </Text>

        <VStack align="start" spacing={1} mb={4}>
          <Text fontSize="xs" fontWeight="700" color={primaryMaroon} textTransform="uppercase" letterSpacing="0.08em">
            Package Management
          </Text>
          <Heading fontSize="2xl" fontWeight="800" color="#1a1a2e">
            Create New Package
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Define package pricing, member capacity and availability.
          </Text>
        </VStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
          {/* Section header with icon, matching reference */}
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="rgba(174,32,80,0.08)" color={primaryMaroon}>
              <Icon as={LuBox} boxSize={5} />
            </Circle>
            <Heading fontSize="lg" fontWeight="700" color="#1a1a2e">
              Package Information
            </Heading>
          </HStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              {/* Row 1: Package Code and Package Name */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Package Code *
                  </Text>
                  <Box
                    bg="gray.50"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    border="1.5px solid"
                    borderColor="gray.200"
                    height="40px"
                    display="flex"
                    alignItems="center"
                  >
                    <HStack spacing={1.5}>
                      <Icon as={LuHash} color="gray.400" boxSize={3.5} />
                      <Text fontSize="sm" fontWeight="600" color={primaryMaroon}>
                        {previewCode}
                      </Text>
                      <Text fontSize="xs" color="gray.400" ml={1}>
                        (Auto)
                      </Text>
                    </HStack>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Auto-generated code for this package
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Package Name *
                  </Text>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter package name (e.g., Basic, Premium)"
                    borderColor={errors.name ? "red.500" : "gray.200"}
                    size="md"
                    height="40px"
                    fontSize="13px"
                    borderWidth="1.5px"
                    _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                  />
                  {errors.name && <Text fontSize="xs" color="red.500" mt={1}>{errors.name}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    This name will be displayed to churches.
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 2: Monthly Rate and Yearly Rate */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Rate per Member (Monthly) *
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuIndianRupee color="#a0aec0" size={15} />
                    </Box>
                    <Input
                      type="number"
                      name="rate_per_member_monthly"
                      value={formData.rate_per_member_monthly}
                      onChange={handleChange}
                      placeholder="0.00"
                      borderColor={errors.rate_per_member_monthly ? "red.500" : "gray.200"}
                      size="md"
                      height="40px"
                      fontSize="13px"
                      pl={8}
                      borderWidth="1.5px"
                      step="0.01"
                      min="0"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                    />
                  </Box>
                  {errors.rate_per_member_monthly && <Text fontSize="xs" color="red.500" mt={1}>{errors.rate_per_member_monthly}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Per member / month
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Rate per Member (Yearly) *
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuIndianRupee color="#a0aec0" size={15} />
                    </Box>
                    <Input
                      type="number"
                      name="rate_per_member_yearly"
                      value={formData.rate_per_member_yearly}
                      onChange={handleChange}
                      placeholder="0.00"
                      borderColor={errors.rate_per_member_yearly ? "red.500" : "gray.200"}
                      size="md"
                      height="40px"
                      fontSize="13px"
                      pl={8}
                      borderWidth="1.5px"
                      step="0.01"
                      min="0"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                    />
                  </Box>
                  {errors.rate_per_member_yearly && <Text fontSize="xs" color="red.500" mt={1}>{errors.rate_per_member_yearly}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Per member / year
                  </Text>
                </GridItem>
              </Grid>

              {/* Row 3: Member Limit and Status */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Member Limit *
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" zIndex={1}>
                      <LuUsers color="#a0aec0" size={15} />
                    </Box>
                    <Input
                      type="number"
                      name="member_limit"
                      value={formData.member_limit}
                      onChange={handleChange}
                      placeholder="Maximum active members allowed"
                      borderColor={errors.member_limit ? "red.500" : "gray.200"}
                      size="md"
                      height="40px"
                      fontSize="13px"
                      pl={8}
                      borderWidth="1.5px"
                      min="0"
                      _focus={{ borderColor: "#ae2050", boxShadow: "0 0 0 1px #ae2050" }}
                    />
                  </Box>
                  {errors.member_limit && <Text fontSize="xs" color="red.500" mt={1}>{errors.member_limit}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Maximum active members allowed
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Status *
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
                </GridItem>
              </Grid>

              {/* Info Box + Submit button, side by side like reference */}
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
                      Rates are calculated based on the church's active member count.
                    </Text>
                  </Flex>
                </Box>

                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#8a1a3e" }}
                  type="submit"
                  loading={isSubmitting}
                  loadingText="Creating..."
                  size="lg"
                  px={8}
                  flexShrink={0}
                >
                  <Icon as={LuSave} boxSize={4} /> Create Package
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default PackageAddPage;