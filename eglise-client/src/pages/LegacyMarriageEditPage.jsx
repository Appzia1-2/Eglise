// src/pages/LegacyMarriageEditPage.jsx
// Same form components + layout as LegacyMarriageAddPage.
// Only difference: prefills from GET, submits PATCH.

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box, Button, Center, Flex, Heading, SimpleGrid,
  Spinner, Text,
} from "@chakra-ui/react";

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ---- copy FormField, FormSelect, FormTextarea, FieldError,
//      inputProps, labelProps from LegacyMarriageAddPage.jsx ----

const initialForm = {
  marriage_type: "ADD_BRIDE", date: "", register_number: "",
  groom_name: "", groom_dob: "", groom_house_name: "", groom_family_name: "",
  groom_address: "", groom_father: "", groom_mother: "", nationality_of_groom: "",
  bride_name: "", bride_dob: "", bride_house_name: "", bride_family_name: "",
  bride_address: "", bride_father: "", bride_mother: "", nationality_of_bride: "",
  witness_groom_side: "", witness_bride_side: "",
  minister_of_marriage: "", other_priests: "",
  transfer_to: "", remarks: "",
};

const LegacyMarriageEditPage = () => {
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
          `/api/registry/legacy/marriages/${id}/`
        );
        const r = res.data;
        setFormData({
          marriage_type: r.marriage_type || "ADD_BRIDE",
          date: r.date || "",
          register_number: r.register_number || "",
          groom_name: r.groom_name || "",
          groom_dob: r.groom_dob || "",
          groom_house_name: r.groom_house_name || "",
          groom_family_name: r.groom_family_name || "",
          groom_address: r.groom_address || "",
          groom_father: r.groom_father || "",
          groom_mother: r.groom_mother || "",
          nationality_of_groom: r.nationality_of_groom || "",
          bride_name: r.bride_name || "",
          bride_dob: r.bride_dob || "",
          bride_house_name: r.bride_house_name || "",
          bride_family_name: r.bride_family_name || "",
          bride_address: r.bride_address || "",
          bride_father: r.bride_father || "",
          bride_mother: r.bride_mother || "",
          nationality_of_bride: r.nationality_of_bride || "",
          witness_groom_side: r.witness_groom_side || "",
          witness_bride_side: r.witness_bride_side || "",
          minister_of_marriage: r.minister_of_marriage || "",
          other_priests: r.other_priests || "",
          transfer_to: r.transfer_to || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(err?.response?.data?.detail ||
          "Unable to load legacy marriage record.");
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
      const payload = {
        ...formData,
        groom_dob: formData.groom_dob || null,
        bride_dob: formData.bride_dob || null,
      };
      await apiClient.patch(
        `/api/registry/legacy/marriages/${id}/`, payload
      );
      navigate(`/legacy/marriage/${id}`);
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
        setError("Unable to update legacy marriage.");
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
          <Text fontSize="11px" color="#3974D8" cursor="pointer"
                onClick={() => navigate("/legacy/marriage")}>
            Legacy Marriage Register
          </Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">Edit</Text>
        </Flex>

        <Box mb="12px">
          <Text fontSize="10px" fontWeight="700" color="#E00000"
                textTransform="uppercase" letterSpacing="0.5px" mb="2px">
            Legacy Marriage Register
          </Text>
          <Heading fontSize={{ base: "22px", md: "25px" }} fontWeight="600"
                   color="#14265B" lineHeight="1.15">
            Edit Legacy Marriage
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical marriage details.
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
              Marriage Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="12px">
              {/* Same rows as Add page — paste here */}
            </SimpleGrid>

            {/* Groom / Bride / Witnesses / etc — copy from Add page */}

          </Box>

          <Flex justify="flex-end" align="center" gap="8px"
                px={{ base: "14px", md: "16px" }} py="10px"
                borderTop="1px solid" borderColor="#DDE4EE"
                bg="white" flexWrap="wrap">
            <Button type="button" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px" variant="outline"
                    borderColor="#E00000" color="#E00000" bg="white"
                    onClick={() => navigate(`/legacy/marriage/${id}`)}
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

export default LegacyMarriageEditPage;