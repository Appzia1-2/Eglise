import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Button,
  Text,
  Flex,
  Input,
  Textarea,
  Icon,
  SimpleGrid,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogCloseTrigger,
  DialogPositioner,
} from "@chakra-ui/react";
import {
  LuSave,
  LuPlus,
  LuX,
  LuUpload,
  LuImage,
  LuTrash2,
  LuChevronDown,
} from "react-icons/lu";

const GenericFormModal = ({
  isOpen,
  onClose,
  onSave,
  itemData,
  isLoading,
  fields = [],
  title = "",
}) => {
  const primaryMaroon = "var(--primary-maroon)";
  const buildEmpty = () => {
    const initialFields =
      typeof fields === "function" ? fields({}, itemData) : fields;
    return Object.fromEntries(initialFields.map((f) => [f.name, ""]));
  };

  const [formData, setFormData] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({});
  const [openSelect, setOpenSelect] = useState(null);
  const [selectSearch, setSelectSearch] = useState("");

  const searchRef = React.useRef(null);
  const selectContainerRef = React.useRef({});

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && searchRef.current.contains(e.target)) return;

      const currentContainer = selectContainerRef.current[openSelect];
      if (currentContainer && currentContainer.contains(e.target)) return;

      setOpenSelect(null);
      setSelectSearch("");
    };
    if (openSelect) {
      window.addEventListener("mousedown", handleOutsideClick);
      setTimeout(() => {
        if (searchRef.current) searchRef.current.focus();
      }, 50);
    }
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [openSelect]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (itemData) {
      const initialFields =
        typeof fields === "function" ? fields(itemData, itemData) : fields;

      const newPreviews = {};
      const newFormData = Object.fromEntries(
        initialFields.map((f) => {
          let val = itemData[f.name];

          if (f.type === "file" && val && typeof val === "string") {
            let url = val;
            if (!url.startsWith("http") && !url.startsWith("data:")) {
              const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
              url = `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
            }
            newPreviews[f.name] = url;
          }

          if (val && typeof val === "object" && val.id !== undefined) {
            val = val.id;
          }
          return [f.name, val ?? ""];
        }),
      );

      setFormData(newFormData);
      setPreviews(newPreviews);
    } else {
      setFormData(buildEmpty());
      setPreviews({});
    }
    setErrors({});
  }, [itemData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newVal };

      const fieldConfig = activeFields.find((f) => f.name === name);
      if (fieldConfig?.onChange) {
        fieldConfig.onChange(newVal, updated, setFormData, itemData);
      }

      return updated;
    });

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const activeFieldsSource = (
    typeof fields === "function" ? fields(formData, itemData) : fields
  ).filter((f) => !f.showIf || f.showIf(formData, itemData));

  const maxCols = activeFieldsSource.length > 6 ? 3 : 2;

  const processedFields = (() => {
    const result = [];
    let currentRowCols = 0;

    for (let i = 0; i < activeFieldsSource.length; i++) {
      const field = activeFieldsSource[i];
      const isTextArea = field.type === "textarea";
      const isExplicitFull = field.fullWidth;
      const nextField = activeFieldsSource[i + 1];
      const isNextFull =
        nextField && (nextField.fullWidth || nextField.type === "textarea");

      let effectivelyFull = isTextArea || isExplicitFull || maxCols === 1;

      if (!effectivelyFull && currentRowCols === 0) {
        if (!nextField || isNextFull) {
          effectivelyFull = true;
        }
      }

      result.push({ ...field, effectivelyFull });

      if (effectivelyFull) {
        currentRowCols = 0;
      } else {
        currentRowCols = (currentRowCols + 1) % maxCols;
      }
    }
    return result;
  })();

  const activeFields = processedFields;
  const columnCount = maxCols;
  const isEditing = Boolean(itemData);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    activeFields.forEach((f) => {
      if (f.required) {
        const val = formData[f.name];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[f.name] = true;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = activeFields.find((f) => newErrors[f.name]);
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField.name)[0];
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    const hasFile = activeFields.some(
      (f) =>
        f.type === "file" &&
        (formData[f.name] instanceof File || formData[f.name] instanceof Blob),
    );

    if (hasFile) {
      const fd = new FormData();
      activeFields.forEach((f) => {
        if (isEditing && f.disabledOnEdit) return;

        let val = formData[f.name];
        if (val !== undefined && val !== "") {
          if (f.type === "file") {
            if (val instanceof File || val instanceof Blob) {
              fd.append(f.name, val);
            }
          } else {
            if (f.coerce) val = f.coerce(val);
            fd.append(f.name, val);
          }
        }
      });
      onSave(fd);
    } else {
      const coerced = Object.fromEntries(
        activeFields
          .filter((f) => !(isEditing && f.disabledOnEdit))
          .filter((f) => {
            if (f.type === "file") {
              return (
                formData[f.name] instanceof File ||
                formData[f.name] instanceof Blob
              );
            }
            return true;
          })
          .map((f) => {
            let val = formData[f.name];
            if (val === "" || val === undefined) return [f.name, undefined];
            if (f.coerce) val = f.coerce(val);
            return [f.name, val];
          })
          .filter(([name, value]) => value !== undefined),
      );
      onSave(coerced);
    }
  };

  const getFieldStyles = (fieldName) => ({
    borderColor: errors[fieldName]
      ? "red.500"
      : focusedField === fieldName
        ? primaryMaroon
        : "gray.200",
    boxShadow: errors[fieldName]
      ? "0 0 0 1px red.500"
      : focusedField === fieldName
        ? `0 0 0 1px ${primaryMaroon}`
        : "none",
  });

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      size={activeFields.length > 6 ? "xl" : "md"}
    >
      <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <DialogPositioner alignItems="center">
        <DialogContent
          borderRadius="14px"
          overflow="hidden"
          boxShadow="2xl"
          maxH="95vh"
          display="flex"
          flexDirection="column"
        >
          <DialogHeader
            bg={primaryMaroon}
            color="white"
            fontSize="md"
            py={4}
            px={8}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="relative"
            borderBottom="1px solid rgba(255,255,255,0.1)"
          >
            <Text fontWeight="600" letterSpacing="0.5px" fontSize="md">
              {isEditing
                ? `EDIT ${title.toUpperCase()}`
                : `ADD NEW ${title.toUpperCase()}`}
            </Text>
            <DialogCloseTrigger
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              color="white"
              bg="whiteAlpha.200"
              borderRadius="full"
              _hover={{ bg: "whiteAlpha.400" }}
              p={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={LuX} fontSize="18px" />
            </DialogCloseTrigger>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <DialogBody
              py={8}
              px={8}
              bg="white"
              flex="1"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(233, 227, 227, 0.1)",
                  borderRadius: "10px",
                },
              }}
            >
              <SimpleGrid
                columns={{ base: 1, md: activeFields.length > 6 ? 3 : 2 }}
                gap={5}
              >
                {activeFields.map((f) => {
                  const hasValue = String(formData[f.name] || "").length > 0;
                  const isFocused = focusedField === f.name;
                  const shouldFloat =
                    isFocused || hasValue || f.type === "select";

                  return (
                    <Box
                      key={f.name}
                      w="full"
                      position="relative"
                      gridColumn={
                        f.effectivelyFull ? `span ${columnCount}` : "auto"
                      }
                      display={f.type === "checkbox" ? "flex" : "block"}
                      alignItems={f.type === "checkbox" ? "center" : "initial"}
                    >
                      {f.type !== "file" && f.type !== "checkbox" && (
                        <Text
                          as="label"
                          position="absolute"
                          left={shouldFloat ? "10px" : "12px"}
                          top={shouldFloat ? "0" : "50%"}
                          transform={
                            shouldFloat
                              ? "translateY(-50%) scale(0.85)"
                              : "translateY(-50%)"
                          }
                          transformOrigin="left top"
                          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                          color={isFocused ? primaryMaroon : "gray.500"}
                          bg="white"
                          px={1}
                          zIndex={2}
                          fontSize={shouldFloat ? "sm" : "sm"}
                          fontWeight={shouldFloat ? "700" : "500"}
                          pointerEvents="none"
                          letterSpacing="0.3px"
                        >
                          {f.label}
                          {f.required && (
                            <Text as="span" color="red.500" ml={1}>
                              *
                            </Text>
                          )}
                        </Text>
                      )}

                      {f.type === "file" ? (
                        <VStack
                          spacing={3}
                          align="center"
                          w="full"
                          gridColumn={
                            f.effectivelyFull ? `span ${columnCount}` : "auto"
                          }
                        >
                          <Box
                            w="full"
                            minH="200px"
                            borderRadius="12px"
                            border="2px dashed"
                            borderColor={
                              previews[f.name] ? primaryMaroon : "gray.200"
                            }
                            bg={previews[f.name] ? "gray.900" : "gray.50"}
                            transition="all 0.3s"
                            _hover={{
                              borderColor: primaryMaroon,
                              bg: previews[f.name]
                                ? "gray.900"
                                : "rgba(123, 13, 30, 0.05)",
                            }}
                            position="relative"
                            overflow="hidden"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            cursor="pointer"
                            onClick={() =>
                              document.getElementById(`file-${f.name}`).click()
                            }
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files[0];
                              if (file && file.type.startsWith("image/")) {
                                const url = URL.createObjectURL(file);
                                setPreviews((prev) => ({
                                  ...prev,
                                  [f.name]: url,
                                }));
                                setFormData((prev) => ({
                                  ...prev,
                                  [f.name]: file,
                                }));
                              }
                            }}
                          >
                            {previews[f.name] ? (
                              <Box position="relative" w="full" h="full">
                                <Box
                                  as="img"
                                  src={previews[f.name]}
                                  alt="Preview"
                                  w="full"
                                  h="200px"
                                  objectFit="cover"
                                />
                                <Box
                                  position="absolute"
                                  top={0}
                                  left={0}
                                  right={0}
                                  bottom={0}
                                  bg="blackAlpha.400"
                                  opacity={0}
                                  _hover={{ opacity: 1 }}
                                  transition="opacity 0.2s"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <VStack spacing={2}>
                                    <Icon
                                      as={LuUpload}
                                      color="white"
                                      fontSize="24px"
                                    />
                                    <Text
                                      color="white"
                                      fontSize="xs"
                                      fontWeight="bold"
                                    >
                                      Change Image
                                    </Text>
                                  </VStack>
                                </Box>
                                <Button
                                  size="xs"
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  bg="white"
                                  color="red.500"
                                  borderRadius="full"
                                  boxShadow="md"
                                  _hover={{ bg: "red.50" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    URL.revokeObjectURL(previews[f.name]);
                                    setPreviews((prev) => {
                                      const next = { ...prev };
                                      delete next[f.name];
                                      return next;
                                    });
                                    setFormData((prev) => ({
                                      ...prev,
                                      [f.name]: null,
                                    }));
                                  }}
                                >
                                  <Icon as={LuTrash2} />
                                </Button>
                              </Box>
                            ) : (
                              <VStack spacing={3} py={6}>
                                <Box
                                  p={4}
                                  borderRadius="full"
                                  bg="rgba(123, 13, 30, 0.08)"
                                  color={primaryMaroon}
                                >
                                  <Icon as={LuImage} fontSize="32px" />
                                </Box>
                                <VStack spacing={1}>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="700"
                                    color="gray.700"
                                  >
                                    Click to upload Family Photo
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    or drag and drop
                                  </Text>
                                  <Text fontSize="10px" color="gray.400">
                                    PNG, JPG or WEBP (Max 5MB)
                                  </Text>
                                </VStack>
                              </VStack>
                            )}
                            <input
                              id={`file-${f.name}`}
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setPreviews((prev) => ({
                                    ...prev,
                                    [f.name]: url,
                                  }));
                                  setFormData((prev) => ({
                                    ...prev,
                                    [f.name]: file,
                                  }));
                                }
                              }}
                            />
                          </Box>
                        </VStack>
                      ) : f.type === "textarea" ? (
                        <Textarea
                          name={f.name}
                          value={formData[f.name] || ""}
                          onChange={handleChange}
                          onFocus={() => setFocusedField(f.name)}
                          onBlur={() => setFocusedField(null)}
                          required={f.required}
                          disabled={isEditing && f.disabledOnEdit}
                          rows={f.rows || 3}
                          borderRadius="lg"
                          fontSize="sm"
                          pt={3}
                          {...getFieldStyles(f.name)}
                        />
                      ) : f.type === "select" ? (
                        <Box
                          position="relative"
                          ref={(el) => {
                            if (el) selectContainerRef.current[f.name] = el;
                          }}
                        >
                          <Box
                            name={f.name}
                            onClick={() => {
                              if (!isEditing || !f.disabledOnEdit) {
                                setOpenSelect(
                                  openSelect === f.name ? null : f.name,
                                );
                              }
                            }}
                            onFocus={() => {
                              if (!(isEditing && f.disabledOnEdit))
                                setFocusedField(f.name);
                            }}
                            onBlur={() => setFocusedField(null)}
                            ref={(el) => {
                              if (el) {
                                el.focus = () => setOpenSelect(f.name);
                              }
                            }}
                            tabIndex={!isEditing || !f.disabledOnEdit ? 0 : -1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpenSelect(
                                  openSelect === f.name ? null : f.name,
                                );
                              }
                            }}
                            style={{
                              width: "100%",
                              height: "38px",
                              borderRadius: "8px",
                              borderWidth: "1px",
                              fontSize: "var(--chakra-fontSizes-sm)",
                              paddingLeft: "12px",
                              paddingRight: "30px",
                              display: "flex",
                              alignItems: "center",
                              background:
                                isEditing && f.disabledOnEdit
                                  ? "var(--chakra-colors-gray-100)"
                                  : "white",
                              cursor:
                                isEditing && f.disabledOnEdit
                                  ? "not-allowed"
                                  : "pointer",
                              position: "relative",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              opacity: isEditing && f.disabledOnEdit ? 0.6 : 1,
                            }}
                            {...getFieldStyles(f.name)}
                          >
                            <Text noOfLines={1} fontSize="sm">
                              {(() => {
                                const selectedOpt = f.options?.find(
                                  (opt) =>
                                    (typeof opt === "object"
                                      ? opt.value
                                      : opt) == formData[f.name],
                                );
                                if (selectedOpt) {
                                  return typeof selectedOpt === "object"
                                    ? selectedOpt.label
                                    : selectedOpt;
                                }
                                return `Select ${f.label}`;
                              })()}
                            </Text>
                            <Box
                              position="absolute"
                              right="10px"
                              top="50%"
                              transform="translateY(-50%)"
                              pointerEvents="none"
                            >
                              <Icon
                                as={LuChevronDown}
                                fontSize="14px"
                                color="gray.400"
                              />
                            </Box>
                          </Box>

                          {openSelect === f.name && (
                            <Box
                              position="absolute"
                              top="42px"
                              left={0}
                              right={0}
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="8px"
                              boxShadow="lg"
                              zIndex={100}
                              maxH="260px"
                              display="flex"
                              flexDirection="column"
                              overflow="hidden"
                            >
                              <Box
                                px={2}
                                py={2}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                bg="gray.50"
                              >
                                <Input
                                  ref={searchRef}
                                  placeholder={`Search ${f.label}...`}
                                  size="xs"
                                  value={selectSearch}
                                  onChange={(e) =>
                                    setSelectSearch(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  bg="white"
                                  borderRadius="md"
                                  fontSize="xs"
                                  h="28px"
                                  _focus={{
                                    borderColor: primaryMaroon,
                                    boxShadow: `0 0 0 1px ${primaryMaroon}`,
                                  }}
                                />
                              </Box>

                              <Box
                                flex="1"
                                overflowY="auto"
                                py={1}
                                css={{
                                  "&::-webkit-scrollbar": { width: "4px" },
                                  "&::-webkit-scrollbar-track": {
                                    background: "transparent",
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    background: "rgba(0,0,0,0.1)",
                                    borderRadius: "10px",
                                  },
                                }}
                              >
                                {!f.required && !selectSearch && (
                                  <Box
                                    px={3}
                                    py={2}
                                    fontSize="sm"
                                    cursor="pointer"
                                    _hover={{
                                      bg: "gray.50",
                                      color: primaryMaroon,
                                    }}
                                    onMouseDownCapture={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleChange({
                                        target: { name: f.name, value: "" },
                                      });
                                      setOpenSelect(null);
                                      setSelectSearch("");
                                    }}
                                  >
                                    Select {f.label}
                                  </Box>
                                )}

                                {f.options
                                  ?.filter((opt) => {
                                    if (!selectSearch) return true;
                                    const lbl =
                                      typeof opt === "object" ? opt.label : opt;
                                    return String(lbl)
                                      .toLowerCase()
                                      .includes(selectSearch.toLowerCase());
                                  })
                                  .map((opt, i) => {
                                    const isObj =
                                      typeof opt === "object" && opt !== null;
                                    const val = isObj ? opt.value : opt;
                                    const lbl = isObj ? opt.label : opt;
                                    const isSelected =
                                      String(formData[f.name]) === String(val);

                                    return (
                                      <Box
                                        key={i}
                                        px={3}
                                        py={2}
                                        fontSize="sm"
                                        cursor="pointer"
                                        bg={
                                          isSelected
                                            ? "rgba(123, 13, 30, 0.05)"
                                            : "transparent"
                                        }
                                        color={
                                          isSelected
                                            ? primaryMaroon
                                            : "gray.700"
                                        }
                                        fontWeight={isSelected ? "600" : "400"}
                                        _hover={{
                                          bg: "gray.50",
                                          color: primaryMaroon,
                                        }}
                                        onMouseDownCapture={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleChange({
                                            target: {
                                              name: f.name,
                                              value: val,
                                            },
                                          });
                                          setOpenSelect(null);
                                          setSelectSearch("");
                                        }}
                                      >
                                        {lbl}
                                      </Box>
                                    );
                                  })}

                                {f.options?.filter((opt) => {
                                  const lbl =
                                    typeof opt === "object" ? opt.label : opt;
                                  return String(lbl)
                                    .toLowerCase()
                                    .includes(selectSearch.toLowerCase());
                                }).length === 0 && (
                                  <Box
                                    px={3}
                                    py={4}
                                    textAlign="center"
                                    color="gray.400"
                                    fontSize="xs"
                                  >
                                    No results found
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ) : f.type === "checkbox" ? (
                        <Flex align="center" gap={3} py={2}>
                          <input
                            type="checkbox"
                            name={f.name}
                            checked={Boolean(formData[f.name])}
                            onChange={handleChange}
                            id={`check-${f.name}`}
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                              accentColor: errors[f.name]
                                ? "red"
                                : primaryMaroon,
                              outline: errors[f.name]
                                ? "2px solid red"
                                : "none",
                              outlineOffset: "2px",
                              borderRadius: "2px",
                            }}
                          />
                          <Text
                            as="label"
                            htmlFor={`check-${f.name}`}
                            fontSize="sm"
                            fontWeight="600"
                            color="gray.700"
                            cursor="pointer"
                            userSelect="none"
                          >
                            {f.label}
                            {f.required && (
                              <Text as="span" color="red.500" ml={1}>
                                *
                              </Text>
                            )}
                          </Text>
                        </Flex>
                      ) : (
                        <Input
                          name={f.name}
                          type={f.type || "text"}
                          value={
                            f.type === "file" ? undefined : formData[f.name]
                          }
                          onChange={(e) => {
                            if (f.type === "file") {
                              setFormData((prev) => ({
                                ...prev,
                                [f.name]: e.target.files[0],
                              }));
                            } else {
                              handleChange(e);
                            }
                          }}
                          onFocus={() => setFocusedField(f.name)}
                          onBlur={() => setFocusedField(null)}
                          disabled={isEditing && f.disabledOnEdit}
                          {...getFieldStyles(f.name)}
                          borderRadius="8px"
                          h="38px"
                          fontSize="sm"
                          pt={f.type === "file" ? "10px" : "auto"}
                        />
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </DialogBody>

            <DialogFooter
              px={8}
              pb={6}
              pt={2}
              bg="white"
              display="flex"
              justifyContent="flex-end"
            >
              <Button
                type="submit"
                bg={primaryMaroon}
                color="white"
                borderRadius="lg"
                h="40px"
                px={4}
                fontSize="md"
                fontWeight="bold"
                _hover={{
                  bg: "#6b0f1a",
                  boxShadow: "md",
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0)" }}
                loading={isLoading}
                display="flex"
                alignItems="center"
                gap={1.5}
                transition="all 0.2s"
              >
                <Icon as={isEditing ? LuSave : LuPlus} fontSize="14px" />
                {isEditing ? "Save Changes" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default GenericFormModal;