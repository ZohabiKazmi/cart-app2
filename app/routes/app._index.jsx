// import { useState, useEffect, useCallback } from "react";
// import { useFetcher } from "@remix-run/react";
// import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
// import { TitleBar } from "@shopify/app-bridge-react";
// import { SpendingGoal } from "./components/SpendingGoal"; 
// // import { validateDiscountData } from "./utils/discountHelpers";
// // import { deleteAutomaticDiscount } from "./utils/discounts.server";

// export default function Index() {
//   const fetcher = useFetcher();

//   const [spendingGoals, setSpendingGoals] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [toastActive, setToastActive] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const [toastError, setToastError] = useState(false);

//   useEffect(() => {
//     async function fetchGoals() {
//       try {
//         const response = await fetch("/api/cart");
//         if (response.ok) {
//           const result = await response.json();
//           if (result.success && Array.isArray(result.data)) {
//             setSpendingGoals(result.data);
//           } else {
//             setSpendingGoals([]);
//           }
//         } else {
//           setSpendingGoals([]);
//         }
//       } catch {
//         setSpendingGoals([]);
//       }
//     }
//     fetchGoals();
//   }, []);

//   const handleAddSpendingGoal = async () => {
//     const formData = new FormData();
//     formData.append("_action", "CREATE");
//     formData.append("shop", "zohaibalishah.myshopify.com");
//     formData.append("title", "Discount Title");
//     formData.append("spendingGoal", "50");
//     formData.append("announcement", "Add {{amount_left}} to get discounts");
//     formData.append("selectedTab", "0");

//     try {
//       const response = await fetch("/api/cart", {
//         method: "POST",
//         body: formData
//       });

//       if (response.ok) {
//         const { data } = await response.json();
//         setSpendingGoals(prevGoals => [...prevGoals, data]);
//         setToastMessage("Goal created successfully");
//         setToastError(false);
//         setToastActive(true);
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to create goal");
//       }
//     } catch (error) {
//       setToastMessage(error.message || "Failed to create goal");
//       setToastError(true);
//       setToastActive(true);
//     }
//   };

//   const handleDeleteSpendingGoal = async (id) => {
//     const formData = new FormData();
//     formData.append("_action", "DELETE");
//     formData.append("goalId", id.toString());

//     try {
//       const response = await fetch("/api/cart", {
//         method: "POST",
//         body: formData
//       });

//       if (response.ok) {
//         setSpendingGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
//         setToastMessage("Goal deleted successfully");
//         setToastError(false);
//         setToastActive(true);
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to delete goal");
//       }
//     } catch (error) {
//       setToastMessage(error.message || "Failed to delete goal");
//       setToastError(true);
//       setToastActive(true);
//     }
//   };

//   const handleGoalUpdate = (goalId, updates) => {
//     setSpendingGoals(prevGoals =>
//       prevGoals.map(goal =>
//         goal.id === goalId ? { ...goal, ...updates } : goal
//       )
//     );
//   };

//   const handleSaveChanges = async () => {
//     const formData = new FormData();
//     formData.append("_action", "SAVE");
    
//     if (!Array.isArray(spendingGoals)) {
//       console.error("spendingGoals is not an array:", spendingGoals);
//       setToastMessage("Failed to save changes: spendingGoals is not an array.");
//       setToastError(true);
//       setToastActive(true);
//       return;
//     }

//     spendingGoals.forEach(goal => {
//       formData.append("goals[]", JSON.stringify({
//         id: goal.id,
//         shop: goal.shop,
//         title: goal.title,
//         spendingGoal: goal.spendingGoal,
//         announcement: goal.announcement,
//         selectedTab: goal.selectedTab,
//         freeShipping: goal.freeShipping,
//         percentageDiscount: goal.percentageDiscount,
//         fixedAmountDiscount: goal.fixedAmountDiscount,
//       }));
//     });

//     try {
//       const response = await fetch("/api/cart", {
//         method: "POST",
//         body: formData
//       });

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success) {
//           setToastMessage("Changes saved successfully.");
//           setToastError(false);
//         } else {
//           throw new Error(result.error || "Failed to save changes.");
//         }
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to save changes.");
//       }
//     } catch (error) {
//       console.error("Save changes error:", error);
//       setToastMessage(error.message || "Failed to save changes.");
//       setToastError(true);
//     } finally {
//       setToastActive(true);
//     }
//   };

//   const toastMarkup = toastActive ? (
//     <Toast
//       content={toastMessage}
//       error={toastError}
//       onDismiss={() => setToastActive(false)}
//     />
//   ) : null;

//   return (
//     <Frame>
//       <Page
//         title="Cart App"
//         primaryAction={{
//           content: isLoading ? "Saving..." : "Save Changes",
//           onAction: handleSaveChanges,
//           loading: isLoading,
//           primary: true,
//           disabled: isLoading
//         }}
//       >
//         <BlockStack gap="500">
//           <Layout>
//             <Layout.Section>
//               <>
//                 {Array.isArray(spendingGoals) && spendingGoals.map((goal) => (
//                   <SpendingGoal
//                     key={goal.id}
//                     {...goal}
//                     onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
//                     onDelete={handleDeleteSpendingGoal}
//                   />
//                 ))}
//                 <div style={{ margin: "1rem 0 0 0" }}>
//                   <Button
//                     variant="primary"
//                     fullWidth
//                     onClick={handleAddSpendingGoal}
//                   >
//                     Add new discount
//                   </Button>
//                 </div>
//               </>
//             </Layout.Section>
//           </Layout>
//         </BlockStack>
//         {toastMarkup}
//       </Page>
//     </Frame>
//   );
// }





import { useState, useEffect } from "react";
import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
import { SpendingGoal } from "./components/SpendingGoal";

export default function Index() {
  const [spendingGoals, setSpendingGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const [nextId, setNextId] = useState(101);

  // Fetch goals from backend
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
          console.error(`Error fetching goals: ${response.statusText}`);
          setSpendingGoals([]);
        }
      } catch (error) {
        console.error(`Fetch goals failed: ${error.message}`);
        setSpendingGoals([]);
      }
    }
    fetchGoals();
  }, []);

  // Handle adding a spending goal
  const handleAddSpendingGoal = async () => {
    const formData = new FormData();
    formData.append("_action", "CREATE");
    formData.append("shop", "zohaibalishah.myshopify.com");
    formData.append("title", "Discount Title");
    formData.append("spendingGoal", "50");
    formData.append("announcement", "Add {{amount_left}} to get discounts");
    formData.append("selectedTab", "0");
    formData.append("DiscountId", nextId);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { data } = await response.json();
        setSpendingGoals((prevGoals) => [...prevGoals, data]);
        setToastMessage("Goal created successfully");
        setToastError(false);
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to create goal");
      }
    } catch (error) {
      setToastMessage(error.message || "Failed to create goal");
      setToastError(true);
    } finally {
      setToastActive(true);
    }
    setNextId((prevId) => prevId + 1);
  };

  // Handle deleting a spending goal
  const handleDeleteSpendingGoal = async (id) => {
    const formData = new FormData();
    formData.append("_action", "DELETE");
    formData.append("goalId", id.toString());

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { success, error } = await response.json();
        if (success) {
          setSpendingGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
          setToastMessage("Goal deleted successfully");
          setToastError(false);
        } else {
          throw new Error(error || "Failed to delete goal");
        }
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Delete goal failed:", error);
      setToastMessage(error.message || "Failed to delete goal");
      setToastError(true);
    } finally {
      setToastActive(true);
    }
  };

  // Handle saving changes to goals
  const handleSaveChanges = async () => {
    const formData = new FormData();
    formData.append("_action", "SAVE");

    // Ensure spendingGoals is an array before processing
    if (!Array.isArray(spendingGoals)) {
      console.error("spendingGoals is not an array:", spendingGoals);
      setToastMessage("Failed to save changes: spendingGoals is not an array.");
      setToastError(true);
      setToastActive(true);
      return;
    }

    spendingGoals.forEach(goal => {
      formData.append("goals[]", JSON.stringify({
        id: goal.id,
        shop: goal.shop,
        title: goal.title,
        spendingGoal: goal.spendingGoal,
        announcement: goal.announcement,
        selectedTab: goal.selectedTab,
        freeShipping: goal.freeShipping,
        percentageDiscount: goal.percentageDiscount,
        fixedAmountDiscount: goal.fixedAmountDiscount,
      }));
    });

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setToastMessage("Changes saved successfully");
          setToastError(false);
        } else {
          throw new Error(result.error || "Failed to save changes");
        }
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Save changes failed:", error);
      setToastMessage(error.message || "Failed to save changes");
      setToastError(true);
    } finally {
      setToastActive(true);
    }
  };

  const toastMarkup = toastActive && (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  );

  const handleGoalUpdate = (goalId, updates) => {
    setSpendingGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      )
    );
  };

  return (
    <Frame>
      <Page
        title="Cart App"
        primaryAction={{
          content: isLoading ? "Saving..." : "Save Changes",
          onAction: handleSaveChanges,
          loading: isLoading,
          primary: true,
          disabled: isLoading,
        }}
      >
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              {spendingGoals.map((goal) => (
                <SpendingGoal
                  key={goal.id}
                  {...goal}
                  onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
                  onDelete={handleDeleteSpendingGoal}
                />
              ))}
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddSpendingGoal}
                disabled={isLoading}
              >
                Add New Discount
              </Button>
            </Layout.Section>
          </Layout>
        </BlockStack>
        {toastMarkup}
      </Page>
    </Frame>
  );
}
