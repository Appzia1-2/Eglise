import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listOfferings,
  createOffering,
  updateOffering,
  deleteOffering,
  listEvents,
  listMembers,
} from "../api/registryServices";

const OFFERING_COLUMNS = [
  { header: "Member", key: "member_name" },
  { header: "Event", key: "event_name" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status_label" },
];

const OfferingPage = () => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [eRes, mRes] = await Promise.all([listEvents(), listMembers()]);
        setEvents(eRes.data || []);
        setMembers(mRes.data || []);
      } catch (err) {
        console.error("Error fetching offering options:", err);
      }
    };
    fetchOptions();
  }, []);

  const offeringFields = [
    {
      name: "event",
      label: "Event",
      type: "select",
      required: true,
      options: events.map((e) => ({ value: e.id, label: e.name })),
      coerce: Number,
      placeholder: "Select event"
    },
    {
      name: "member",
      label: "Member",
      type: "select",
      required: true,
      options: members.map((m) => ({ value: m.id, label: m.name })),
      coerce: Number,
      placeholder: "Select member"
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      coerce: Number,
      min: 0,
      step: 0.01,
      placeholder: "0.00"
    },
    { 
      name: "narration", 
      label: "Narration", 
      type: "textarea", 
      fullWidth: true,
      rows: 3,
      placeholder: "Add narration (optional)"
    },
    { 
      name: "is_cancelled", 
      label: "Cancelled", 
      type: "checkbox" 
    },
    {
      name: "cancel_reason",
      label: "Cancel Reason",
      type: "textarea",
      fullWidth: true,
      rows: 2,
      required: true,  // 👈 Made mandatory
      placeholder: "Reason for cancellation",
      showIf: (formData) => formData.is_cancelled,
    },
  ];

  const listOfferingsEnriched = async () => {
    try {
      const [oRes, eRes, mRes] = await Promise.all([
        listOfferings(),
        listEvents(),
        listMembers(),
      ]);
      const offerings = oRes.data || [];
      const eventsLocal = eRes.data || [];
      const membersLocal = mRes.data || [];

      const mapped = offerings.map((o) => {
        const eventObj = eventsLocal.find(
          (e) => e.id === (o.event?.id || o.event),
        );
        const memberObj = membersLocal.find(
          (m) => m.id === (o.member?.id || o.member),
        );
        return {
          ...o,
          event_name: o.event?.name || eventObj?.name || "—",
          member_name: o.member?.name || memberObj?.name || "—",
          status_label: o.is_cancelled ? "Cancelled" : "Active",
        };
      });
      return { ...oRes, data: mapped };
    } catch (error) {
      console.error("Error enriching offerings:", error);
      return listOfferings();
    }
  };

  return (
    <RegistryTable
      title="Member Offerings"
      addLabel="Add Offering"
      nameKey="member_name"
      columns={OFFERING_COLUMNS}
      columnLabel="Member"
      emptyMessage="No offerings found."
      listFn={listOfferingsEnriched}
      createFn={createOffering}
      updateFn={updateOffering}
      deleteFn={deleteOffering}
      fields={offeringFields}
    />
  );
};

export default OfferingPage;