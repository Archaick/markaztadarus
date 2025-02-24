import React, { useState } from "react";
import { Accordion, Text, Table, Box } from "@mantine/core";
import { IconChevronsDown } from "@tabler/icons-react";

const DailyActivitiesAccordion = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAccordionToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box
      style={{
        backgroundColor: "#D9D9D9",
        padding: "1rem",
        borderRadius: "8px",
        margin: "4rem 0",
      }}
    >
      {/* Accordion Header */}
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={handleAccordionToggle}
      >
        <Text fw={700} size="xl" mb={10} color="#0a3867">
          KEGIATAN HARIAN
        </Text>
        <IconChevronsDown
          size={24}
          color="#AE8126"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            color: isOpen ? "#228BE6" : "#AE8126", // Blue when open, brown when closed
          }}
        />
      </Box>

      {/* Accordion Content */}
      <Accordion
        value={isOpen ? "activities" : null}
        onChange={handleAccordionToggle}
        styles={{
          content: {
            padding: 0, // Remove default padding
          },
        }}
        transitionDuration={1000}
      >
        <Accordion.Item value="activities">
          <Accordion.Panel>
            {/* Responsive Table */}
            <Table
              striped
              highlightOnHover
              style={{
                width: "100%",
                marginTop: "1rem",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "10px",
                      minWidth: "50px",
                      textAlign: "center",
                    }}
                  >
                    Jam
                  </th>

                  <th style={{ padding: "10px" }}>Kegiatan</th>
                  <th style={{ padding: "10px" }}>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {/* Map through the data prop to render rows */}
                {data.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#AFC2D6" : "#D9D9D9",
                    }}
                  >
                    <td
                      style={{
                        padding: "2px",
                      }}
                    >
                      {row.time}
                    </td>
                    <td style={{ padding: "2px", textAlign: "center" }}>
                      {row.activity}
                    </td>
                    <td style={{ padding: "2px" }}>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
};

export default DailyActivitiesAccordion;
