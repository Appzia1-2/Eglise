// src/pages/LegacyBaptismEditPage.jsx
// Uses the SAME form components as LegacyBaptismAddPage.
// Difference: preloads the record and calls PATCH instead of POST.

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box, Button, Center, Flex, Heading, SimpleGrid,
  Spinner, Text, VStack,
} from "@chakra-ui/react";

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ---- copy FormField, FormSelect, FormTextarea, FieldError,
       inputProps, labelProps from LegacyBaptismAddPage.jsx ---- */

// (for brevity — same components)

const initialForm = {
  baptism_category: "PARISH", date_of_baptism: "", register_number: "",
  name: "", baptismal_name: "", gender: "", dob: "", place_of_birth: "",
  family_name: "", house_name: "", father_name: "", mother_name: "",
  god_father: "", god_mother: "", parish_of_baptism: "", panchayath: "",
  priest_name: "", address: "", remarks: "",
};

const LegacyBaptismEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const res = await apiClient.get(
          `/api/registry/legacy/baptisms/${id}/`
        );
        const r = res.data;
        setFormData({
          baptism_category: r.baptism_category || "PARISH",
          date_of_baptism: r.date_of_baptism || "",
          register_number: r.register_number || "",
          name: r.name || "",
          baptismal_name: r.baptismal_name || "",
          gender: r.gender || "",
          dob: r.dob || "",
          place_of_birth: r.place_of_birth || "",
          family_name: r.family_name || "",
          house_name: r.house_name || "",
          father_name: r.father_name || "",
          mother_name: r.mother_name || "",
          god_father: r.god_father || "",
          god_mother: r.god_mother || "",
          parish_of_baptism: r.parish_of_baptism || "",
          panchayath: r.panchayath || "",
          priest_name: r.priest_name || "",
          address: r.address || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(err?.response?.data?.detail ||
          "Unable to load legacy baptism record.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setFieldErrors({});
    try {
      const payload = { ...formData, dob: formData.dob || null };
      await apiClient.patch(
        `/api/registry/legacy/baptisms/${id}/`, payload
      );
      navigate(`/legacy/baptism/${id}`);
    } catch (err) {
      const rd = err?.response?.data;
      if (rd && typeof rd === "object") {
        const errors = {};
        Object.entries(rd).forEach(([k, v]) => {
          errors[k] = Array.isArray(v) ? v.join(", ") : String(v);
        });
        setFieldErrors(errors);
        setError(rd.detail || rd.non_field_errors?.[0] ||
                 "Please correct the highlighted fields.");
      } else {
        setError("Unable to update legacy baptism.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1"><Spinner size="lg" color="#E00000" /></Center>
        <Footer />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white">
      <Navbar />
      <Box maxW="1400px" mx="auto"
           px={{ base: "16px", md: "24px", lg: "30px" }}
           py={{ base: "14px", md: "16px" }}>

        <Flex align="center" gap="7px" mb="10px" flexWrap="wrap">
          <Text fontSize="11px" color="#3974D8">Masters</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#3974D8"
                cursor="pointer"
                onClick={() => navigate("/legacy/baptism")}>
            Legacy Baptism Register
          </Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">Edit</Text>
        </Flex>

        <Box mb="12px">
          <Text fontSize="10px" fontWeight="700" color="#E00000"
                textTransform="uppercase" letterSpacing="0.5px" mb="2px">
            Legacy Baptism Register
          </Text>
          <Heading fontSize={{ base: "22px", md: "25px" }}
                   fontWeight="600" color="#14265B" lineHeight="1.15">
            Edit Legacy Baptism
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical baptism details.
          </Text>
        </Box>

        {error && (
          <Box bg="#FFF5F5" border="1px solid #F3C4C4"
               borderRadius="6px" px="10px" py="8px" mb="10px">
            <Text fontSize="11px" color="#C00000" fontWeight="500">
              {error}
            </Text>
          </Box>
        )}

        <Box as="form" onSubmit={handleSubmit} bg="white"
             border="1px solid" borderColor="#DDE4EE"
             borderRadius="6px" overflow="hidden">
          <Box p={{ base: "14px", md: "16px" }}>
            <Text fontSize="14px" fontWeight="600" color="#14265B" mb="10px">
              Baptism Information
            </Text>

            {/* Same rows as Add page — copy the SimpleGrid blocks
                exactly from LegacyBaptismAddPage.jsx */}

          </Box>

          <Flex justify="flex-end" align="center" gap="8px"
                px={{ base: "14px", md: "16px" }} py="10px"
                borderTop="1px solid" borderColor="#DDE4EE"
                bg="white" flexWrap="wrap">
            <Button type="button" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px" variant="outline"
                    borderColor="#E00000" color="#E00000" bg="white"
                    onClick={() => navigate(`/legacy/baptism/${id}`)}
                    disabled={saving} _hover={{ bg: "#FFF5F5" }}>
              Cancel
            </Button>
            <Button type="submit" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px" bg="#E00000"
                    color="white" disabled={saving}
                    _hover={{ bg: "#C90000" }}>
              {saving ? (<><Spinner size="xs" mr="5px" />Saving...</>)
                      : (<><LuSave />Save Changes</>)}
            </Button>
          </Flex>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default LegacyBaptismEditPage;