// src/components/ReportFilterBar.jsx

import React from "react";
import { Box, Button, Flex } from "@chakra-ui/react";
import { LuCalendar, LuChevronDown } from "react-icons/lu";

const DARK = "#182338";
const MUTED = "#60708C";
const RED = "#D7193F";
const BORDER = "#DCE2EA";

const SelectBox = ({ value, onChange, placeholder, options }) => (
  <Box position="relative" flex="1" minW="200px">
    <Box
      as="select"
      value={value}
      onChange={onChange}
      width="100%"
      height="44px"
      px={4}
      pr={10}
      fontSize="13px"
      color={value ? DARK : MUTED}
      fontWeight="500"
      bg="white"
      border={`1px solid ${BORDER}`}
      borderRadius="6px"
      outline="none"
      cursor="pointer"
      appearance="none"
      _focus={{ borderColor: RED, boxShadow: `0 0 0 1px ${RED}` }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Box>
    <Box
      position="absolute"
      right="12px"
      top="50%"
      transform="translateY(-50%)"
      pointerEvents="none"
      color={RED}
    >
      <LuChevronDown size={16} />
    </Box>
  </Box>
);

const ReportFilterBar = ({
  search,
  setSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onReset,
}) => {
  return (
    <Box mb={4}>
      <Flex wrap="wrap" gap={3} align="center">
        <Box position="relative" flex="1" minW="200px">
          <Box
            as="input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            width="100%"
            height="44px"
            px={4}
            pr={12}
            fontSize="13px"
            color={DARK}
            fontWeight="500"
            bg="white"
            border={`1px solid ${BORDER}`}
            borderRadius="6px"
            outline="none"
            _focus={{ borderColor: RED, boxShadow: `0 0 0 1px ${RED}` }}
          />
          <Box
            position="absolute"
            right="12px"
            top="50%"
            transform="translateY(-50%)"
            pointerEvents="none"
            color={RED}
          >
            <LuCalendar size={16} />
          </Box>
        </Box>

        <SelectBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="All Voucher Types"
          options={[
            { value: "receipt", label: "Receipt" },
            { value: "payment", label: "Payment" },
            { value: "journal", label: "Journal" },
          ]}
        />

        <SelectBox
          value=""
          onChange={() => {}}
          placeholder="All Transactions"
          options={[
            { value: "cash", label: "Cash" },
            { value: "bank", label: "Bank" },
          ]}
        />

        <SelectBox
          value=""
          onChange={() => {}}
          placeholder="Sort By"
          options={[
            { value: "date_asc", label: "Date (Ascending)" },
            { value: "date_desc", label: "Date (Descending)" },
          ]}
        />

        <Button
          bg="white"
          color={RED}
          border={`1.5px solid ${RED}`}
          h="44px"
          px={8}
          fontSize="13px"
          fontWeight="700"
          borderRadius="6px"
          onClick={onReset}
          _hover={{ bg: "#FFF0F4" }}
        >
          Filter
        </Button>
      </Flex>
    </Box>
  );
};

export default ReportFilterBar;