// import { useState, useCallback } from "react";
// import {
//   LegacyCard,
//   Tabs,
//   TextField,
//   Text,
//   Button,
// } from "@shopify/polaris";

// export function SpendingGoal({ id, onDelete, onSave }) {
//   const [spendingGoal, setSpendingGoal] = useState("50");
//   const [selectedTab, setSelectedTab] = useState(0);
//   const [freeShipping, setFreeShipping] = useState("Free Shipping 🚚");
//   const [percentageDiscount, setPercentageDiscount] = useState("5");
//   const [fixedAmountDiscount, setFixedAmountDiscount] = useState("5");
//   const [announcement, setAnnouncement] = useState(
//     "Add {{amount_left}} to get free shipping! 🚚"
//   );

//   const tabs = [
//     { id: "free-shipping", content: "Free Shipping", panelID: "free-shipping-panel" },
//     { id: "percent", content: "Percent", panelID: "percent-panel" },
//     { id: "fixed-amount", content: "Fixed Amount", panelID: "fixed-amount-panel" },
//   ];

//   const handleTabChange = useCallback((selectedTabIndex) => {
//     setSelectedTab(selectedTabIndex);
//   }, []);

//   const percentDisplay = `${percentageDiscount}% off`;
//   const fixedAmountDisplay = `$${fixedAmountDiscount} off`;

//   const handleNumericInput = (value) => {
//     return value >= 0 ? value : "0"; // Prevent negative inputs
//   };

//   const handleSave = async () => {
//     const updatedGoal = {
//       id, // Ensure this is the correct id from the form data
//       spendingGoal,
//       announcement,
//       selectedTab,
//       freeShipping: selectedTab === 0 ? freeShipping : null,
//       percentageDiscount: selectedTab === 1 ? percentageDiscount : null,
//       fixedAmountDiscount: selectedTab === 2 ? fixedAmountDiscount : null,
//     };

//     const method = id ? "PUT" : "POST"; // Use PUT if editing existing, POST if creating new
//     const response = await fetch(`/api/cart`, {
//       method,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ updatedGoal }),
//     });

//     const data = await response.json();
//     if (response.ok) {
//       alert(data.message);
//       onSave(data);
//     } else {
//       alert("Failed to save changes: " + data.message);
//     }
//   };

//   return (
//     <>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginTop: "0.5rem",
//         }}
//       >
//         <Text variant="headingMd">Spending Goal {id}</Text>
//         <Button
//           variant="plain"
//           tone="critical"
//           onClick={() => onDelete(id)}
//         >
//           Delete Discount
//         </Button>
//       </div>
//       <TextField
//         label={`Target Amount ${id}`}
//         type="number"
//         value={spendingGoal}
//         onChange={(value) => setSpendingGoal(handleNumericInput(value))}
//         suffix="px"
//         autoComplete="off"
//       />
//       <Text variant="bodyMd" as="p">
//         Spending goal in your store's primary currency
//       </Text>
//       <div style={{ marginTop: "1rem" }}></div>
//       <LegacyCard>
//         <Tabs
//           tabs={tabs}
//           selected={selectedTab}
//           onSelect={handleTabChange}
//           fitted
//         >
//           <LegacyCard.Section title={tabs[selectedTab].content}>
//             {selectedTab === 0 && (
//               <>
//                 <TextField
//                   label="Reward Text"
//                   type="text"
//                   value={freeShipping}
//                   onChange={setFreeShipping}
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Text before the goal is reached"
//                   type="text"
//                   value={announcement}
//                   onChange={setAnnouncement}
//                   autoComplete="off"
//                 />
//               </>
//             )}
//             {selectedTab === 1 && (
//               <>
//                 <TextField
//                   label="Set Percentage for Discount"
//                   type="number"
//                   value={percentageDiscount}
//                   onChange={(value) =>
//                     setPercentageDiscount(handleNumericInput(value))
//                   }
//                   suffix="%"
//                   autoComplete="off"
//                 />
//               </>
//             )}
//             {selectedTab === 2 && (
//               <>
//                 <TextField
//                   label="Set Fixed Discount"
//                   type="number"
//                   value={fixedAmountDiscount}
//                   onChange={(value) =>
//                     setFixedAmountDiscount(handleNumericInput(value))
//                   }
//                   suffix="px"
//                   autoComplete="off"
//                 />
//               </>
//             )}
//           </LegacyCard.Section>
//         </Tabs>
//       </LegacyCard>
//       <Button onClick={handleSave}>Save Changes</Button>
//     </>
//   );
// }


import { useState, useEffect, useCallback } from "react";
import { LegacyCard, Tabs, TextField, Text, Button } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react"; // To handle fetch requests for save and delete actions

export function SpendingGoal({ id, onDelete }) {
  const [spendingGoal, setSpendingGoal] = useState("50");
  const [selectedTab, setSelectedTab] = useState(0);
  const [freeShipping, setFreeShipping] = useState("Free Shipping 🚚");
  const [percentageDiscount, setPercentageDiscount] = useState("5");
  const [fixedAmountDiscount, setFixedAmountDiscount] = useState("5");
  const [announcement, setAnnouncement] = useState("Add {{amount_left}} to get free shipping! 🚚");

  const fetcher = useFetcher(); // Use fetcher to send POST requests for save

  // Tabs for different discount types
  const tabs = [
    { id: "free-shipping", content: "Free Shipping", panelID: "free-shipping-panel" },
    { id: "percent", content: "Percent", panelID: "percent-panel" },
    { id: "fixed-amount", content: "Fixed Amount", panelID: "fixed-amount-panel" },
  ];

  // Handle tab changes
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  // Display values for percentage and fixed amount discount
  const percentDisplay = `${percentageDiscount}% off`;
  const fixedAmountDisplay = `$${fixedAmountDiscount} off`;

  // Handle numeric input to prevent negative values
  const handleNumericInput = (value) => {
    return value >= 0 ? value : "0";
  };

  // Load existing data when the component is mounted
  useEffect(() => {
    // This should ideally come from the server, but for simplicity, it's mocked
    const loadData = async () => {
      // Replace with API call to load data from the database
      const response = await fetch(`/api/spendingGoal/${id}`);
      const data = await response.json();
      if (data.status === "success") {
        setSpendingGoal(data.spendingGoal.spendingGoal);
        setFreeShipping(data.spendingGoal.freeShipping);
        setPercentageDiscount(data.spendingGoal.percentageDiscount);
        setFixedAmountDiscount(data.spendingGoal.fixedAmountDiscount);
        setAnnouncement(data.spendingGoal.announcement);
        setSelectedTab(data.spendingGoal.selectedTab);
      }
    };

    loadData();
  }, [id]);

  const handleSave = () => {
    const updatedGoal = {
      id,
      spendingGoal: spendingGoal,
      announcement: announcement,
      selectedTab: selectedTab,
      freeShipping: selectedTab === 0 ? freeShipping : null,
      percentageDiscount: selectedTab === 1 ? percentageDiscount : null,
      fixedAmountDiscount: selectedTab === 2 ? fixedAmountDiscount : null,
    };

    // Send the updated data to the backend using fetcher
    fetcher.submit({ updatedGoal }, { method: "POST" });
  };

  const handleDelete = () => {
    // Call the delete function passed in as a prop
    onDelete(id);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.5rem",
        }}
      >
        <Text variant="headingMd">Spending Goal {id}</Text>
        <Button variant="plain" tone="critical" onClick={handleDelete}>
          Delete Discount
        </Button>
      </div>

      <TextField
        label={`Target Amount ${id}`}
        type="number"
        value={spendingGoal}
        onChange={(value) => setSpendingGoal(handleNumericInput(value))}
        suffix="px"
        autoComplete="off"
      />
      <Text variant="bodyMd" as="p">
        Spending goal in your store's primary currency
      </Text>

      <div style={{ marginTop: "1rem" }}></div>

      <LegacyCard>
        <Tabs
          tabs={tabs}
          selected={selectedTab}
          onSelect={handleTabChange}
          fitted
        >
          <LegacyCard.Section title={tabs[selectedTab].content}>
            {selectedTab === 0 && (
              <>
                <TextField
                  label="Reward Text"
                  type="text"
                  value={freeShipping}
                  onChange={setFreeShipping}
                  autoComplete="off"
                />
                <TextField
                  label="Text before the goal is reached"
                  type="text"
                  value={announcement}
                  onChange={setAnnouncement}
                  autoComplete="off"
                />
              </>
            )}
            {selectedTab === 1 && (
              <>
                <TextField
                  label="Set Percentage for Discount"
                  type="number"
                  value={percentageDiscount}
                  onChange={(value) =>
                    setPercentageDiscount(handleNumericInput(value))
                  }
                  suffix="%"
                  autoComplete="off"
                />
              </>
            )}
            {selectedTab === 2 && (
              <>
                <TextField
                  label="Set Fixed Discount"
                  type="number"
                  value={fixedAmountDiscount}
                  onChange={(value) =>
                    setFixedAmountDiscount(handleNumericInput(value))
                  }
                  suffix="px"
                  autoComplete="off"
                />
              </>
            )}
          </LegacyCard.Section>
        </Tabs>
      </LegacyCard>

      <Button onClick={handleSave}>Save Changes</Button>
    </>
  );
}
