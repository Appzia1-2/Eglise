// src/components/SearchableSelect.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Icon, Input, Text } from "@chakra-ui/react";
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

/**
 * Searchable dropdown that behaves like a native <select>
 * but supports type-to-filter.
 *
 * Props:
 *   value        — current selected value (string | number | "")
 *   onChange     — (value) => void
 *   options      — [{ value, label, sublabel? }, ...]
 *   placeholder  — shown when nothing is selected
 *   isDisabled   — bool
 *   isClearable  — bool (default true)
 *   error        — bool (renders red border)
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  isDisabled = false,
  isClearable = true,
  error = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const main = String(o.label || "").toLowerCase();
      const sub = String(o.sublabel || "").toLowerCase();
      return main.includes(q) || sub.includes(q);
    });
  }, [options, query]);

  // close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () =>
      document.removeEventListener("mousedown", onDocClick);
  }, []);

  // focus the search input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // keep highlighted option visible
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlighted];
    if (item && item.scrollIntoView) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const commit = (opt) => {
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.("");
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (isDisabled) return;

    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      setHighlighted(0);
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) =>
        Math.min(h + 1, Math.max(filtered.length - 1, 0))
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(filtered[highlighted]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
      onKeyDown={onKeyDown}
    >
      {/* TRIGGER */}
      <Flex
        align="center"
        justify="space-between"
        height="42px"
        px={3}
        border="1px solid"
        borderColor={
          error ? "#F3C4C4" : open ? PRIMARY_MAROON : BORDER
        }
        borderRadius="7px"
        bg={isDisabled ? "#F7F9FC" : "white"}
        cursor={isDisabled ? "not-allowed" : "pointer"}
        boxShadow={open ? `0 0 0 1px ${PRIMARY_MAROON}` : "none"}
        onClick={() => !isDisabled && setOpen((o) => !o)}
        _hover={{ borderColor: isDisabled ? BORDER : "#BFC7D4" }}
        transition="border-color 0.15s, box-shadow 0.15s"
      >
        <Text
          fontSize="13px"
          color={selected ? DARK : "#98A2B3"}
          isTruncated
          pr={2}
        >
          {selected ? selected.label : placeholder}
        </Text>

        <Flex align="center" gap={1} flexShrink={0}>
          {isClearable && selected && !isDisabled && (
            <Box
              as="span"
              onClick={clear}
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="18px"
              height="18px"
              borderRadius="full"
              color={MUTED}
              _hover={{ bg: "#F4F6F9", color: DARK }}
            >
              <Icon as={LuX} boxSize={3} />
            </Box>
          )}
          <Icon
            as={LuChevronDown}
            boxSize={4}
            color={MUTED}
            transform={open ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 0.15s"
          />
        </Flex>
      </Flex>

      {/* DROPDOWN */}
      {open && !isDisabled && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="7px"
          boxShadow="0 8px 24px rgba(16,24,40,0.12)"
          zIndex={50}
          overflow="hidden"
        >
          {/* SEARCH INPUT */}
          <Box
            px={2}
            py={2}
            borderBottom="1px solid"
            borderColor="#EEF1F5"
            position="relative"
          >
            <Icon
              as={LuSearch}
              position="absolute"
              left="12px"
              top="50%"
              transform="translateY(-50%)"
              color={MUTED}
              boxSize={3.5}
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              placeholder="Type to search…"
              height="34px"
              pl="30px"
              fontSize="12px"
              borderColor={BORDER}
              borderRadius="5px"
              _focus={{
                borderColor: PRIMARY_MAROON,
                boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
              }}
            />
          </Box>

          {/* OPTIONS */}
          <Box
            ref={listRef}
            maxH="240px"
            overflowY="auto"
            py={1}
          >
            {filtered.length === 0 ? (
              <Text
                fontSize="12px"
                color={MUTED}
                px={3}
                py={3}
                textAlign="center"
              >
                No matches
              </Text>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected =
                  String(opt.value) === String(value);
                const isHighlighted = idx === highlighted;
                return (
                  <Box
                    key={opt.value}
                    px={3}
                    py="7px"
                    cursor="pointer"
                    bg={
                      isHighlighted
                        ? "#FFF5F7"
                        : isSelected
                        ? "#FAFBFC"
                        : "transparent"
                    }
                    _hover={{ bg: "#FFF5F7" }}
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => commit(opt)}
                    borderLeft="2px solid"
                    borderLeftColor={
                      isSelected ? PRIMARY_MAROON : "transparent"
                    }
                  >
                    <Text
                      fontSize="12px"
                      color={DARK}
                      fontWeight={isSelected ? "600" : "400"}
                    >
                      {opt.label}
                    </Text>
                    {opt.sublabel && (
                      <Text fontSize="10px" color={MUTED} mt="1px">
                        {opt.sublabel}
                      </Text>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SearchableSelect;