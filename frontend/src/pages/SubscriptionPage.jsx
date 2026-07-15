import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listGrades,
} from "../api/registryServices";

const SUBSCRIPTION_COLUMNS = [
  { header: "Grade", key: "grade_name" },
  { header: "Term", key: "term" },
  { header: "Start Date", key: "start_date" },
  { header: "End Date", key: "end_date" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status_label" },
];

const SubscriptionPage = () => {
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const gRes = await listGrades();
        setGrades(gRes.data || []);
      } catch (err) {
        console.error("Error fetching subscription options:", err);
      }
    };
    fetchOptions();
  }, []);

  const subscriptionFields = [
    {
      name: "grade",
      label: "Grade",
      type: "select",
      required: true,
      options: grades.map((g) => ({ value: g.id, label: g.name })),
      coerce: Number,
    },
    { name: "term", label: "Term", required: true },
    {
      name: "start_date",
      label: "Start Date",
      type: "date",
      required: true,
    },
    {
      name: "end_date",
      label: "End Date",
      type: "date",
      required: true,
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      coerce: Number,
    },
    { name: "is_cancelled", label: "Cancelled", type: "checkbox" },
    {
      name: "cancel_reason",
      label: "Cancel Reason",
      type: "textarea",
      fullWidth: true,
      showIf: (formData) => formData.is_cancelled,
    },
  ];

  const listSubscriptionsEnriched = async () => {
    try {
      const [sRes, gRes] = await Promise.all([
        listSubscriptions(),
        listGrades(),
      ]);
      const subscriptions = sRes.data || [];
      const gradesLocal = gRes.data || [];

      const mapped = subscriptions.map((s) => {
        const gradeObj = gradesLocal.find(
          (g) => g.id === (s.grade?.id || s.grade),
        );
        return {
          ...s,
          grade_name: s.grade?.name || gradeObj?.name || "—",
          status_label: s.is_cancelled ? "Cancelled" : "Active",
        };
      });
      return { ...sRes, data: mapped };
    } catch (error) {
      console.error("Error enriching subscriptions:", error);
      return listSubscriptions();
    }
  };

  return (
    <RegistryTable
      title="Subscriptions"
      addLabel="Add Subscription"
      nameKey="grade_name"
      columns={SUBSCRIPTION_COLUMNS}
      columnLabel="Grade"
      emptyMessage="No subscriptions found."
      listFn={listSubscriptionsEnriched}
      createFn={createSubscription}
      updateFn={updateSubscription}
      deleteFn={deleteSubscription}
      fields={subscriptionFields}
    />
  );
};

export default SubscriptionPage;