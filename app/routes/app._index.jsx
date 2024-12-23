import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { SpendingGoal } from "./components/SpendingGoal"; 

export default function Index() {
  const fetcher = useFetcher();

  const [spendingGoals, setSpendingGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  // Updated to fetch from Prisma database
  useEffect(() => {
    async function fetchGoals() {
      try {
        const response = await fetch("/api/cart");
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && Array.isArray(result.data)) {
            setSpendingGoals(result.data);
          } else {
            setSpendingGoals([]);
          }
        } else {
          setSpendingGoals([]);
        }
      } catch {
        setSpendingGoals([]);
      }
    }
    fetchGoals();
  }, []);

  // Updated to handle Prisma creation
  const handleAddSpendingGoal = async () => {
    const formData = new FormData();
    formData.append("_action", "CREATE");
    formData.append("shop", "zohaibalishah.myshopify.com"); 
    formData.append("spendingGoal", "0");
    formData.append("announcement", "");
    formData.append("selectedTab", "0");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const { data } = await response.json();
        setSpendingGoals([...spendingGoals, data]);
        setToastMessage("Goal created successfully");
        setToastError(false);
        setToastActive(true);
      }
    } catch {
      setToastMessage("Failed to create goal");
      setToastError(true);
      setToastActive(true);
    }
  };

  // Updated to handle Prisma deletion
  const handleDeleteSpendingGoal = async (id) => {
    const formData = new FormData();
    formData.append("_action", "DELETE");
    formData.append("goalId", id.toString());

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setSpendingGoals(spendingGoals.filter(goal => goal.id !== id));
        setToastMessage("Goal deleted successfully");
        setToastError(false);
        setToastActive(true);
      }
    } catch {
      setToastMessage("Failed to delete goal");
      setToastError(true);
      setToastActive(true);
    }
  };

  // Add function to update individual goal state
  const handleGoalUpdate = (goalId, updates) => {
    setSpendingGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      )
    );
  };

  // Updated to handle Prisma updates
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create an array of promises for each goal update
      const updatePromises = spendingGoals.map(async (goal) => {
        const formData = new FormData();
        formData.append("_action", "UPDATE");
        formData.append("goalId", goal.id);
        formData.append("shop", goal.shop);
        formData.append("spendingGoal", goal.spendingGoal.toString());
        formData.append("announcement", goal.announcement);
        formData.append("selectedTab", goal.selectedTab.toString());
        formData.append("freeShipping", goal.freeShipping ? "true" : "false");
        formData.append("percentageDiscount", (goal.percentageDiscount || 0).toString());
        formData.append("fixedAmountDiscount", (goal.fixedAmountDiscount || 0).toString());

        const response = await fetch("/api/cart", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update goal ${goal.id}`);
        }

        return response.json();
      });

      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      if (results.every(result => result.success)) {
        setToastMessage("All changes saved successfully");
        setToastError(false);
      } else {
        throw new Error("Some updates failed");
      }
    } catch (error) {
      setToastMessage(error.message || "Failed to save changes");
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
      <Page
        title="Cart App"
        primaryAction={{
          content: isLoading ? "Saving..." : "Save Changes",
          onAction: handleSave,
          loading: isLoading,
          primary: true,
          disabled: isLoading
        }}
      >
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <>
                {Array.isArray(spendingGoals) && spendingGoals.map((goal) => (
                  <SpendingGoal
                    key={goal.id}
                    {...goal}
                    onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
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
            </Layout.Section>
          </Layout>
        </BlockStack>
        {toastMarkup}
      </Page>
    </Frame>
  );
}
