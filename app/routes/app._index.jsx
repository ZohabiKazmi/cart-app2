// components/Index.jsx

import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { SpendingGoal } from "./components/SpendingGoal"; // Import the SpendingGoal component

export default function Index() {
  const fetcher = useFetcher();

  const [spendingGoals, setSpendingGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  // Fetch existing spending goals when the component mounts
  useEffect(() => {
    async function fetchGoals() {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const { spendingGoals } = await response.json();
          setSpendingGoals(spendingGoals || []);
        } else {
          console.error("Failed to fetch spending goals:", response.status);
        }
      } catch (error) {
        console.error("Error fetching spending goals:", error);
      }
    }
    fetchGoals();
  }, []);

  // Handle adding a new spending goal
  const handleAddSpendingGoal = () => {
    setSpendingGoals([...spendingGoals, { id: Date.now(), spendingGoal: 0, announcement: "" }]);
  };

  // Handle deleting a spending goal
  const handleDeleteSpendingGoal = (id) => {
    setSpendingGoals(spendingGoals.filter((goal) => goal.id !== id));
  };

  // Handle saving the spending goals to the server
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    const settings = { spendingGoals };

    try {
      console.log("Saving settings:", settings); // Debugging log
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json(); // Parse response
      if (response.ok) {
        console.log("Save successful:", data); // Debugging log
        setToastMessage("Settings saved successfully");
        setToastError(false);
      } else {
        console.error("Save error response:", data); // Debugging log
        setToastMessage("Failed to save settings");
        setToastError(true);
      }
    } catch (error) {
      console.error("Save request error:", error); // Debugging log
      setToastMessage("Failed to save settings");
      setToastError(true);
    } finally {
      setIsLoading(false);
      setToastActive(true);
    }
  }, [spendingGoals]);

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <Frame>
      <Page>
        <TitleBar
          title="Cart App"
          primaryAction={{
            content: "Save",
            onAction: handleSave,
            loading: isLoading,
          }}
        />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <>
                {spendingGoals.map((goal) => (
                  <SpendingGoal
                    key={goal.id}
                    id={goal.id}
                    spendingGoal={goal.spendingGoal}
                    announcement={goal.announcement}
                    onDelete={handleDeleteSpendingGoal}
                  />
                ))}
                <div style={{ margin: "1rem 0 0 0" }}>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleAddSpendingGoal}
                  >
                    Add new discount
                  </Button>
                </div>
              </>

              <div style={{ marginTop: "1rem" }}>
                <Button
                  primary
                  fullWidth
                  onClick={handleSave}
                  loading={isLoading}
                >
                  Save Settings
                </Button>
              </div>
            </Layout.Section>
          </Layout>
        </BlockStack>
        {toastMarkup}
      </Page>
    </Frame>
  );
}
