// src/components/BankAccountSelect.jsx

import { useEffect, useState } from "react";
import {
  Dialog,
  Portal,
  Button,
  Field,
  Input,
  VStack,
  Switch,
  HStack,
  Text,
  useDisclosure,
  Spinner,
  Icon,
  Box,
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";

import {
  listBankAccounts,
  createBankAccount,
} from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const inputStyle = {
  h: "42px",
  fontSize: "13px",
  borderColor: BORDER,
  borderRadius: "7px",
  color: DARK,
  bg: "white",
  _placeholder: { color: "#98A2B3" },
  _hover: { borderColor: "#BFC7D4" },
  _focus: {
    borderColor: PRIMARY_MAROON,
    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
  },
};

export default function BankAccountSelect({
  value,
  onChange,
  label = "Bank Account",
  isRequired = false,
  errorText,
  showAddButton = true,
}) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    opening_balance: "", // ✅ NEW
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { open, onOpen, onClose } = useDisclosure();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await listBankAccounts();
      const active = (res.data || []).filter((a) => a.is_active);
      setAccounts(active);
      if (!value && active.length === 1) onChange(active[0].id);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleCreate = async () => {
    const trimmed = {
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase() || null,
      branch: form.branch.trim() || null,
      opening_balance: Number(form.opening_balance || 0), // ✅ NEW
      is_active: form.is_active,
    };

    const errs = {};
    if (!trimmed.bank_name) errs.bank_name = "Bank name is required.";
    if (!trimmed.account_number)
      errs.account_number = "Account number is required.";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const res = await createBankAccount(trimmed);
      setAccounts((prev) => [...prev, res.data]);
      onChange(res.data.id);
      toaster.create({
        title: "Bank account added",
        type: "success",
        duration: 2500,
      });
      onClose();
      setForm({
        bank_name: "",
        account_number: "",
        ifsc_code: "",
        branch: "",
        opening_balance: "",
        is_active: true,
      });
      setErrors({});
    } catch (err) {
      const data = err?.response?.data || {};
      const mapped = {};
      Object.entries(data).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v.join(", ") : String(v);
      });
      setErrors(mapped);
      toaster.create({
        title: "Could not save",
        description: data.detail || "Please check the fields.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Field.Root required={isRequired}>
        <Field.Label>
          {label}
          {isRequired && <Field.RequiredIndicator />}
        </Field.Label>

        {loading ? (
          <HStack>
            <Spinner size="xs" color={PRIMARY_MAROON} />
            <Text fontSize="12px" color={MUTED}>
              Loading accounts…
            </Text>
          </HStack>
        ) : (
          <HStack align="stretch">
            <select
              value={value || ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              disabled={accounts.length === 0}
              style={{
                width: "100%",
                height: "42px",
                border: `1px solid ${BORDER}`,
                borderRadius: "7px",
                padding: "0 11px",
                fontSize: "13px",
                color: DARK,
                background: "white",
                outline: "none",
                cursor:
                  accounts.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {accounts.length === 0
                  ? "No bank accounts configured"
                  : "Select bank account"}
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.display_name ||
                    `${a.bank_name} ${a.masked_account_number || ""}`}
                </option>
              ))}
            </select>

            {showAddButton && (
              <Button
                h="42px"
                px={4}
                leftIcon={<Icon as={LuPlus} boxSize={4} />}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                _hover={{ bg: "#650A18" }}
                onClick={onOpen}
                whiteSpace="nowrap"
              >
                Add Bank
              </Button>
            )}
          </HStack>
        )}

        {errorText && (
          <Text fontSize="11px" color="#B42318" mt={1}>
            {errorText}
          </Text>
        )}

        {!loading && accounts.length === 0 && showAddButton && (
          <Text fontSize="11px" color="#B54708" mt={1}>
            No bank accounts yet. Click Add Bank to create one.
          </Text>
        )}
      </Field.Root>

      {/* INLINE ADD DIALOG (Chakra v3) */}
      <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="9px">
              <Dialog.Header>
                <Dialog.Title fontSize="16px" color={DARK}>
                  Add Bank Account
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <VStack spacing={4} align="stretch">
                  <Field.Root required invalid={!!errors.bank_name}>
                    <Field.Label>
                      Bank Name <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      value={form.bank_name}
                      onChange={(e) => setField("bank_name", e.target.value)}
                      placeholder="e.g. State Bank of India"
                      {...inputStyle}
                      borderColor={errors.bank_name ? "#F3C4C4" : BORDER}
                    />
                    {errors.bank_name && (
                      <Field.ErrorText>{errors.bank_name}</Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root required invalid={!!errors.account_number}>
                    <Field.Label>
                      Account Number <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      value={form.account_number}
                      onChange={(e) =>
                        setField("account_number", e.target.value)
                      }
                      fontFamily="monospace"
                      {...inputStyle}
                      borderColor={
                        errors.account_number ? "#F3C4C4" : BORDER
                      }
                    />
                    {errors.account_number && (
                      <Field.ErrorText>
                        {errors.account_number}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>IFSC Code</Field.Label>
                    <Input
                      value={form.ifsc_code}
                      onChange={(e) =>
                        setField("ifsc_code", e.target.value.toUpperCase())
                      }
                      fontFamily="monospace"
                      placeholder="SBIN0001234"
                      {...inputStyle}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Branch</Field.Label>
                    <Input
                      value={form.branch}
                      onChange={(e) => setField("branch", e.target.value)}
                      placeholder="e.g. Koliyadi Branch"
                      {...inputStyle}
                    />
                  </Field.Root>

                  {/* ✅ NEW: OPENING BALANCE */}
                  <Field.Root invalid={!!errors.opening_balance}>
                    <Field.Label>Opening Balance (₹)</Field.Label>
                    <Input
                      type="number"
                      value={form.opening_balance}
                      onChange={(e) => setField("opening_balance", e.target.value)}
                      placeholder="0.00"
                      {...inputStyle}
                      borderColor={errors.opening_balance ? "#F3C4C4" : BORDER}
                    />
                    {errors.opening_balance && (
                      <Field.ErrorText>{errors.opening_balance}</Field.ErrorText>
                    )}
                  </Field.Root>

                  <HStack spacing={3}>
                    <Switch.Root
                      checked={form.is_active}
                      onCheckedChange={(e) =>
                        setField("is_active", e.checked)
                      }
                      colorPalette="green"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                    <Text fontSize="12px" fontWeight="600" color={DARK}>
                      Active
                    </Text>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  borderColor={RED}
                  color={RED}
                  h="36px"
                  px={5}
                  borderRadius="7px"
                  fontSize="12px"
                  mr={2}
                  onClick={onClose}
                  _hover={{ bg: "#FFF5F7" }}
                >
                  Cancel
                </Button>
                <Button
                  h="36px"
                  px={5}
                  bg={PRIMARY_MAROON}
                  color="white"
                  borderRadius="7px"
                  fontSize="12px"
                  fontWeight="600"
                  loading={saving}
                  onClick={handleCreate}
                  _hover={{ bg: "#650A18" }}
                >
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}