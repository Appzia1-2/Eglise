import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
  Spinner,
} from "@chakra-ui/react";
import { LuArrowLeft, LuSave, LuCircleHelp } from "react-icons/lu";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const DioceseEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
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

  const primaryMaroon = "#ae2050";

  const countryOptions = [
    { value: "", label: "Select Country" },
    { value: "IN", label: "🇮🇳 India" },
    { value: "US", label: "🇺🇸 United States" },
    { value: "GB", label: "🇬🇧 United Kingdom" },
    { value: "CA", label: "🇨🇦 Canada" },
    { value: "AU", label: "🇦🇺 Australia" },
    { value: "AE", label: "🇦🇪 United Arab Emirates" },
    { value: "SA", label: "🇸🇦 Saudi Arabia" },
    { value: "SG", label: "🇸🇬 Singapore" },
    { value: "MY", label: "🇲🇾 Malaysia" },
    { value: "DE", label: "🇩🇪 Germany" },
    { value: "FR", label: "🇫🇷 France" },
    { value: "IT", label: "🇮🇹 Italy" },
    { value: "ES", label: "🇪🇸 Spain" },
    { value: "PT", label: "🇵🇹 Portugal" },
    { value: "NL", label: "🇳🇱 Netherlands" },
    { value: "BE", label: "🇧🇪 Belgium" },
    { value: "CH", label: "🇨🇭 Switzerland" },
    { value: "SE", label: "🇸🇪 Sweden" },
    { value: "NO", label: "🇳🇴 Norway" },
    { value: "DK", label: "🇩🇰 Denmark" },
    { value: "FI", label: "🇫🇮 Finland" },
    { value: "JP", label: "🇯🇵 Japan" },
    { value: "KR", label: "🇰🇷 South Korea" },
    { value: "CN", label: "🇨🇳 China" },
    { value: "NZ", label: "🇳🇿 New Zealand" },
    { value: "ZA", label: "🇿🇦 South Africa" },
    { value: "BR", label: "🇧🇷 Brazil" },
    { value: "AR", label: "🇦🇷 Argentina" },
    { value: "MX", label: "🇲🇽 Mexico" },
    { value: "EG", label: "🇪🇬 Egypt" },
    { value: "NG", label: "🇳🇬 Nigeria" },
    { value: "KE", label: "🇰🇪 Kenya" },
    { value: "GH", label: "🇬🇭 Ghana" },
  ];

  const stateOptions = [
    { value: "", label: "Select State" },
    { value: "Kerala", label: "Kerala" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Delhi", label: "Delhi" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "West Bengal", label: "West Bengal" },
    { value: "Telangana", label: "Telangana" },
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Bihar", label: "Bihar" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Punjab", label: "Punjab" },
    { value: "Haryana", label: "Haryana" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Assam", label: "Assam" },
    { value: "Odisha", label: "Odisha" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "Goa", label: "Goa" },
  ];

  const cityOptions = [
    { value: "", label: "Select City" },
    { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "Kochi", label: "Kochi" },
    { value: "Kozhikode", label: "Kozhikode" },
    { value: "Mumbai", label: "Mumbai" },
    { value: "Delhi", label: "Delhi" },
    { value: "Bangalore", label: "Bangalore" },
    { value: "Chennai", label: "Chennai" },
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Kolkata", label: "Kolkata" },
    { value: "Pune", label: "Pune" },
    { value: "Ahmedabad", label: "Ahmedabad" },
    { value: "Jaipur", label: "Jaipur" },
    { value: "Lucknow", label: "Lucknow" },
    { value: "Nagpur", label: "Nagpur" },
    { value: "Indore", label: "Indore" },
    { value: "Bhopal", label: "Bhopal" },
    { value: "Visakhapatnam", label: "Visakhapatnam" },
    { value: "Patna", label: "Patna" },
    { value: "Chandigarh", label: "Chandigarh" },
    { value: "Dehradun", label: "Dehradun" },
  ];

  useEffect(() => {
    if (location.state?.diocese) {
      const diocese = location.state.diocese;
      setFormData({
        id: diocese.id,
        name: diocese.name || "",
        metropolitan_name: diocese.metropolitan_name || "",
        email: diocese.email || "",
        phone_number: diocese.phone_number || "",
        address_line1: diocese.address_line1 || "",
        address_line2: diocese.address_line2 || "",
        city: diocese.city || "",
        state: diocese.state || "",
        country: diocese.country || "",
        postal_code: diocese.postal_code || "",
        website: diocese.website || "",
        is_active: diocese.is_active !== false,
      });
      setIsFetching(false);
    } else if (id) {
      fetchDiocese(id);
    } else {
      navigate("/admin/dioceses");
    }
  }, [location, id, navigate]);

  const fetchDiocese = async (dioceseId) => {
    setIsFetching(true);
    try {
      const response = await adminApi.getDioceseDetail(dioceseId);
      const diocese = response.data;
      setFormData({
        id: diocese.id,
        name: diocese.name || "",
        metropolitan_name: diocese.metropolitan_name || "",
        email: diocese.email || "",
        phone_number: diocese.phone_number || "",
        address_line1: diocese.address_line1 || "",
        address_line2: diocese.address_line2 || "",
        city: diocese.city || "",
        state: diocese.state || "",
        country: diocese.country || "",
        postal_code: diocese.postal_code || "",
        website: diocese.website || "",
        is_active: diocese.is_active !== false,
      });
    } catch (error) {
      console.error("Error fetching diocese:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load diocese details.",
        type: "error",
        duration: 5000,
      });
      navigate("/admin/dioceses");
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleToggleActive = () => {
    setFormData({ ...formData, is_active: !formData.is_active });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Diocese name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
        metropolitan_name: formData.metropolitan_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim(),
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code.trim(),
        website: formData.website.trim(),
        is_active: formData.is_active,
      };

      console.log("Updating diocese data:", submitData);

      await adminApi.updateDiocese(formData.id, submitData);
      toaster.create({
        title: "Success",
        description: "Diocese updated successfully.",
        type: "success",
        duration: 3000,
      });
      navigate("/admin/dioceses");
    } catch (error) {
      console.error("Error updating diocese:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMsg = "Failed to update diocese.";
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = [];
          Object.entries(error.response.data).forEach(([field, value]) => {
            if (field !== 'status' && field !== 'message') {
              errors.push(`${field}: ${Array.isArray(value) ? value.join(', ') : value}`);
            }
          });
          if (errors.length > 0) {
            errorMsg = errors.join('; ');
          } else if (error.response.data.message) {
            errorMsg = error.response.data.message;
          } else if (error.response.data.error) {
            errorMsg = error.response.data.error;
          } else if (error.response.data.detail) {
            errorMsg = error.response.data.detail;
          }
        } else if (typeof error.response.data === 'string') {
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

  if (isFetching) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="xl" color={primaryMaroon} />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              leftIcon={<LuArrowLeft />}
              onClick={() => navigate("/admin/dioceses")}
            >
              Back
            </Button>
            <VStack align="start" spacing={1}>
              <Heading fontSize="2xl" fontWeight="800" color="#333">
                Edit Diocese
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Update diocese details
              </Text>
            </VStack>
          </HStack>
          <Button
            bg={primaryMaroon}
            color="white"
            _hover={{ bg: "#6b0f1a" }}
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<LuSave />}
          >
            Update Diocese
          </Button>
        </Flex>

        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          p={6}
          boxShadow="sm"
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Row 1: Diocese Name & Metropolitan */}
              <Flex gap={6} wrap="wrap">
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Diocese Name *
                  </Text>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter diocese name"
                    borderColor={errors.name ? "red.500" : "gray.200"}
                    size="lg"
                    height="48px"
                  />
                  {errors.name && (
                    <Text fontSize="xs" color="red.500" mt={1}>{errors.name}</Text>
                  )}
                </Box>
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Metropolitan Name
                  </Text>
                  <Input
                    name="metropolitan_name"
                    value={formData.metropolitan_name}
                    onChange={handleChange}
                    placeholder="Enter metropolitan name"
                    size="lg"
                    height="48px"
                  />
                </Box>
              </Flex>

              {/* Row 2: Email & Phone */}
              <Flex gap={6} wrap="wrap">
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Email *
                  </Text>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    borderColor={errors.email ? "red.500" : "gray.200"}
                    size="lg"
                    height="48px"
                  />
                  {errors.email && (
                    <Text fontSize="xs" color="red.500" mt={1}>{errors.email}</Text>
                  )}
                </Box>
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Phone Number
                  </Text>
                  <Input
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter phone number with country code"
                    size="lg"
                    height="48px"
                  />
                </Box>
              </Flex>

              {/* Row 3: Website */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                  Website
                </Text>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  size="lg"
                  height="48px"
                  borderColor={errors.website ? "red.500" : "gray.200"}
                />
                {errors.website && (
                  <Text fontSize="xs" color="red.500" mt={1}>{errors.website}</Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Include http:// or https://
                </Text>
              </Box>

              {/* Address Section */}
              <Box>
                <Heading size="sm" fontWeight="700" color="gray.700" mb={3}>
                  Address Information
                </Heading>

                {/* Address Line 1 */}
                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Address Line 1
                  </Text>
                  <Input
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="Street address, building name"
                    size="lg"
                    height="48px"
                  />
                </Box>

                {/* Address Line 2 */}
                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Address Line 2
                  </Text>
                  <Input
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit"
                    size="lg"
                    height="48px"
                  />
                </Box>

                {/* City, State, Country */}
                <Flex gap={6} wrap="wrap">
                  <Box flex="1" minW="200px">
  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
    City
  </Text>
  <Input
    name="city"
    value={formData.city}
    onChange={handleChange}
    placeholder="Enter city name"
    size="lg"
    height="48px"
  />
</Box>
                  <Box flex="1" minW="200px">
                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                      State
                    </Text>
                    <Box
                      as="select"
                      value={formData.state}
                      onChange={(e) => handleSelectChange("state", e.target.value)}
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      {stateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Box>
                  </Box>
                  <Box flex="1" minW="200px">
                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                      Country
                    </Text>
                    <Box
                      as="select"
                      value={formData.country}
                      onChange={(e) => handleSelectChange("country", e.target.value)}
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      {countryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Box>
                  </Box>
                </Flex>

                {/* Postal Code */}
                <Box maxW="250px" mt={4}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Postal Code
                  </Text>
                  <Input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                    size="lg"
                    height="48px"
                  />
                </Box>
              </Box>

              {/* Active Status */}
              <Box>
                <Flex align="center" gap={3}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={0}>
                    Status
                  </Text>
                  <Box
                    as="button"
                    type="button"
                    onClick={handleToggleActive}
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                    px={4}
                    py={2}
                    borderRadius="full"
                    bg={formData.is_active ? "green.500" : "gray.300"}
                    color="white"
                    fontWeight="600"
                    fontSize="sm"
                    _hover={{ opacity: 0.8 }}
                    transition="all 0.2s"
                    minW="80px"
                    justifyContent="center"
                  >
                    {formData.is_active ? "Active" : "Inactive"}
                  </Box>
                </Flex>
              </Box>

              {/* Info Box */}
              <Box
                bg="blue.50"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="blue.100"
                mt={2}
              >
                <Flex align="center" gap={3}>
                  <LuCircleHelp size={20} color="#3182ce" />
                  <Text fontSize="sm" color="blue.700">
                    The diocese can be assigned to churches after registration.
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

export default DioceseEdit;