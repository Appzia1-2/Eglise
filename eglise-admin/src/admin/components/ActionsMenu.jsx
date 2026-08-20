import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "@chakra-ui/react";

// Simple text-based three dots
const ThreeDots = () => (
  <span style={{ fontSize: "20px", fontWeight: "bold", lineHeight: "1" }}>
    ⋮
  </span>
);

const ActionsMenu = ({ onView, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <Box position="relative" ref={menuRef}>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Actions"
        icon={<ThreeDots />}
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ bg: "gray.100" }}
        sx={{
          "&:focus": {
            boxShadow: "none",
          },
        }}
      />

      {isOpen && (
        <Box
          position="absolute"
          right={0}
          mt={1}
          minW="160px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={100}
          py={1}
          sx={{
            "& > *": {
              cursor: "pointer",
            },
          }}
        >
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={4}
            py={2.5}
            fontSize="sm"
            color="gray.700"
            transition="all 0.15s"
            _hover={{ bg: "gray.50" }}
            onClick={() => handleAction(onView)}
            sx={{
              border: "none",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <span style={{ marginRight: "10px", fontSize: "16px" }}>👁️</span>
            View Details
          </Box>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={4}
            py={2.5}
            fontSize="sm"
            color="gray.700"
            transition="all 0.15s"
            _hover={{ bg: "gray.50" }}
            onClick={() => handleAction(onEdit)}
            sx={{
              border: "none",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <span style={{ marginRight: "10px", fontSize: "16px" }}>✏️</span>
            Edit
          </Box>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            width="full"
            px={4}
            py={2.5}
            fontSize="sm"
            color="red.500"
            transition="all 0.15s"
            _hover={{ bg: "red.50" }}
            onClick={() => handleAction(onDelete)}
            sx={{
              border: "none",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <span style={{ marginRight: "10px", fontSize: "16px" }}>🗑️</span>
            Delete
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ActionsMenu;