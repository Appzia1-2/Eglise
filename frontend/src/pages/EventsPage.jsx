import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/registryServices";

const EVENT_FIELDS = [
  {
    name: "name",
    label: "Event Name",
    type: "text",
    required: true,
  },
];

const EVENT_COLUMNS = [
  { header: "Event Name", key: "name", textAlign: "left" },
];

const EventsPage = () => (
  <RegistryTable
    title="Events"
    addLabel="Add New Event"
    nameKey="name"
    columns={EVENT_COLUMNS}
    emptyMessage="No events found."
    listFn={listEvents}
    createFn={createEvent}
    updateFn={updateEvent}
    deleteFn={deleteEvent}
    fields={EVENT_FIELDS}
    isMaster={true}
  />
);

export default EventsPage;
