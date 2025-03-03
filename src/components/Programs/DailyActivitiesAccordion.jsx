import React, { useState } from "react";
import { Accordion, Text, Table, Box } from "@mantine/core";
import { IconChevronsDown } from "@tabler/icons-react";

const DailyActivitiesAccordion = ({ columns, data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAccordionToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box
      style={{
        backgroundColor: "#f7f7f7",
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
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          color={isOpen ? "#228BE6" : "#AE8126"}
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
                  {/* Render column headers dynamically */}
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      style={{
                        padding: "10px",
                        minWidth: col.minWidth || "50px",
                        textAlign: col.textAlign || "center",
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Render table rows dynamically */}
                {data.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#AFC2D6" : "#f7f7f7",
                    }}
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          padding: "2px",
                          textAlign: col.textAlign || "center",
                        }}
                      >
                        {row[col.key]}
                      </td>
                    ))}
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
