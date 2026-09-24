// src/pages/LegacyDeathEditPage.jsx
// Same form components + layout as LegacyDeathAddPage.
// Prefills from GET, submits PATCH.

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
//      inputProps, labelProps from LegacyDeathAddPage.jsx ----

const initialForm = {
  reg_no: "", name: "", gender: "", dob: "", age_at_death: "",
  family_name: "", house_name: "", father_name: "", mother_name: "",
  marital_status: "", died_on: "", funeral_on: "",
  reason_of_death: "", place_of_death: "",
  tomb_type_name: "", tomb_idn: "", tomb_charge: "",
  priest_name: "", remarks: "",
};

const LegacyDeathEditPage = () => {
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
          `/api/registry/legacy/deaths/${id}/`
        );
        const r = res.data;
        setFormData({
          reg_no: r.reg_no || "",
          name: r.name || "",
          gender: r.gender || "",
          dob: r.dob || "",
          age_at_death: r.age_at_death ?? "",
          family_name: r.family_name || "",
          house_name: r.house_name || "",
          father_name: r.father_name || "",
          mother_name: r.mother_name || "",
          marital_status: r.marital_status || "",
          died_on: r.died_on || "",
          funeral_on: r.funeral_on || "",
          reason_of_death: r.reason_of_death || "",
          place_of_death: r.place_of_death || "",
          tomb_type_name: r.tomb_type_name || "",
          tomb_idn: r.tomb_idn || "",
          tomb_charge: r.tomb_charge ?? "",
          priest_name: r.priest_name || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(err?.response?.data?.detail ||
          "Unable to load legacy death record.");
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
        dob: formData.dob || null,
        funeral_on: formData.funeral_on || null,
        age_at_death: formData.age_at_death
          ? Number(formData.age_at_death) : null,
        tomb_charge: formData.tomb_charge
          ? Number(formData.tomb_charge) : null,
      };
      await apiClient.patch(
        `/api/registry/legacy/deaths/${id}/`, payload
      );
      navigate(`/legacy/death/${id}`);
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
        setError("Unable to update legacy death record.");
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
                onClick={() => navigate("/legacy/death")}>
            Legacy Death Register
          </Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">Edit</Text>
        </Flex>

        <Box mb="12px">
          <Text fontSize="10px" fontWeight="700" color="#E00000"
                textTransform="uppercase" letterSpacing="0.5px" mb="2px">
            Legacy Death Register
          </Text>
          <Heading fontSize={{ base: "22px", md: "25px" }} fontWeight="600"
                   color="#14265B" lineHeight="1.15">
            Edit Legacy Death
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical death details.
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
              Death Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="12px">
              {/* Same rows as Add page — paste here */}
            </SimpleGrid>

            {/* Person / Tomb / Notes — copy from Add page */}

          </Box>

          <Flex justify="flex-end" align="center" gap="8px"
                px={{ base: "14px", md: "16px" }} py="10px"
                borderTop="1px solid" borderColor="#DDE4EE"
                bg="white" flexWrap="wrap">
            <Button type="button" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px" variant="outline"
                    borderColor="#E00000" color="#E00000" bg="white"
                    onClick={() => navigate(`/legacy/death/${id}`)}
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

export default LegacyDeathEditPage;