// src/admin/pages/ChurchEdit.jsx
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
import PhoneInput from "../../components/PhoneInput";

const ChurchEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [dioceses, setDioceses] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    city: "",
    diocese: "",
    email: "",
    phone_number: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const primaryMaroon = "#ae2050";

  useEffect(() => {
    fetchDioceses();
  }, []);

  const fetchDioceses = async () => {
    try {
      const response = await adminApi.getDioceses();
      setDioceses(response.data || []);
    } catch (error) {
      console.error("Error fetching dioceses:", error);
    }
  };

  // Fetch church data once dioceses are loaded
  useEffect(() => {
    if (dioceses.length > 0) {
      if (location.state?.church) {
        const church = location.state.church;
        setFormData({
          id: church.id,
          name: church.name || "",
          address: church.address || "",
          city: church.city || "",
          diocese: church.diocese_id || church.diocese || "",
          email: church.email || "",
          phone_number: church.phone_number || "",
          is_active: church.is_active !== false,
        });
        setIsFetching(false);
      } else if (id) {
        fetchChurch(id);
      } else {
        navigate("/admin/churches");
      }
    }
  }, [dioceses, location, id, navigate]);

  const fetchChurch = async (churchId) => {
    setIsFetching(true);
    try {
      const response = await adminApi.getChurchDetail(churchId);
      const church = response.data;
      
      setFormData({
        id: church.id,
        name: church.name || "",
        address: church.address || "",
        city: church.city || "",
        diocese: church.diocese?.id || church.diocese_id || "",
        email: church.email || "",
        phone_number: church.phone_number || "",
        is_active: church.is_active !== false,
      });
    } catch (error) {
      console.error("Error fetching church:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load church details.",
        type: "error",
        duration: 5000,
      });
      navigate("/admin/churches");
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

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone_number: value });
    if (errors.phone_number) {
      setErrors({ ...errors, phone_number: "" });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Church name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
        address: formData.address ? formData.address.trim() : "",
        city: formData.city ? formData.city.trim() : "",
        email: formData.email.trim(),
        phone_number: formData.phone_number || "",
        is_active: formData.is_active,
      };

      // Add diocese ID if selected
      if (formData.diocese) {
        submitData.diocese = parseInt(formData.diocese);
      }

      console.log("Updating church data:", submitData);
      console.log("Church ID:", formData.id);

      // Use PUT method (not PATCH)
      await adminApi.updateChurch(formData.id, submitData);
      
      toaster.create({
        title: "Success",
        description: "Church updated successfully.",
        type: "success",
        duration: 3000,
      });
      navigate("/admin/churches");
    } catch (error) {
      console.error("Error updating church:", error);
      console.error("Error response data:", error.response?.data);
      
      let errorMsg = "Failed to update church.";
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = [];
          Object.entries(error.response.data).forEach(([field, value]) => {
            if (field !== 'status' && field !== 'message' && field !== 'error') {
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
        {/* Breadcrumb */}
        <HStack spacing={2} mb={4}>
          <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.5px">
            Churches / Edit Church
          </Text>
        </HStack>

        {/* Header */}
        <Flex justify="space-between" align="center" mb={2}>
          <VStack align="start" spacing={1}>
            <Heading fontSize="2xl" fontWeight="800" color="#333">
              Edit Church
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Update church profile information.
            </Text>
          </VStack>
        </Flex>

        <Box borderBottom="1px solid" borderColor="gray.200" mb={6} />

        {/* Form */}
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
              {/* Row 1: Church Name & Diocese */}
              <Flex gap={6} wrap="wrap">
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Church Name *
                  </Text>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter church name"
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
                    Diocese
                  </Text>
                  <Box
                    as="select"
                    value={formData.diocese}
                    onChange={(e) => handleSelectChange("diocese", e.target.value)}
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
                    <option value="">Select Diocese</option>
                    {dioceses.map((diocese) => (
                      <option key={diocese.id} value={diocese.id}>
                        {diocese.name}
                      </option>
                    ))}
                  </Box>
                  {dioceses.length === 0 && (
                    <Text fontSize="xs" color="orange.500" mt={1}>
                      No dioceses available. Please add a diocese first.
                    </Text>
                  )}
                </Box>
              </Flex>

              {/* Row 2: Address & City */}
              <Flex gap={6} wrap="wrap">
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    Address
                  </Text>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    size="lg"
                    height="48px"
                  />
                </Box>
                <Box flex="1" minW="250px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                    City
                  </Text>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    size="lg"
                    height="48px"
                  />
                </Box>
              </Flex>

              {/* Row 3: Email & Phone */}
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
                  <PhoneInput
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    isInvalid={!!errors.phone_number}
                  />
                  {errors.phone_number && (
                    <Text fontSize="xs" color="red.500" mt={1}>{errors.phone_number}</Text>
                  )}
                </Box>
              </Flex>

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
                    The church can be assigned to a diocese after registration.
                  </Text>
                </Flex>
              </Box>

              {/* Actions */}
              <Flex gap={4} mt={4}>
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/churches")}
                  size="lg"
                  px={8}
                >
                  Cancel
                </Button>
                <Button
                  bg={primaryMaroon}
                  color="white"
                  _hover={{ bg: "#6b0f1a" }}
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  leftIcon={<LuSave />}
                  size="lg"
                  px={8}
                >
                  Update Church
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default ChurchEdit;