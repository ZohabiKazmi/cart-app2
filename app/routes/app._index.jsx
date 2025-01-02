import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Frame,
  Page,
  Layout,
  Button,
  Toast,
  BlockStack,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { SpendingGoal } from "./components/SpendingGoal";
// import { validateDiscountData } from "./utils/discountHelpers";
// import { deleteAutomaticDiscount } from "./utils/discounts.server";

export default function Index() {
  const fetcher = useFetcher();

  const [spendingGoals, setSpendingGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

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

  const handleAddSpendingGoal = async () => {
    const formData = new FormData();
    formData.append("_action", "CREATE");
    formData.append("shop", "zohaibalishah.myshopify.com");
    formData.append("title", "Discount Title");
    formData.append("spendingGoal", "50");
    formData.append("announcement", "Add {{amount_left}} to get discounts");
    formData.append("selectedTab", "0");

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
        setToastActive(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create goal");
      }
    } catch (error) {
      setToastMessage(error.message || "Failed to create goal");
      setToastError(true);
      setToastActive(true);
    }
  };

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
        setSpendingGoals((prevGoals) =>
          prevGoals.filter((goal) => goal.id !== id),
        );
        setToastMessage("Goal deleted successfully");
        setToastError(false);
        setToastActive(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete goal");
      }
    } catch (error) {
      setToastMessage(error.message || "Failed to delete goal");
      setToastError(true);
      setToastActive(true);
    }
  };

  const handleGoalUpdate = (goalId, updates) => {
    setSpendingGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal,
      ),
    );
  };

  const handleSaveChanges = async () => {
    const formData = new FormData();
    formData.append("_action", "SAVE");

    if (!Array.isArray(spendingGoals)) {
      console.error("spendingGoals is not an array:", spendingGoals);
      setToastMessage("Failed to save changes: spendingGoals is not an array.");
      setToastError(true);
      setToastActive(true);
      return;
    }

    spendingGoals.forEach((goal) => {
      formData.append(
        "goals[]",
        JSON.stringify({
          id: goal.id,
          shop: goal.shop,
          title: goal.title,
          spendingGoal: goal.spendingGoal,
          announcement: goal.announcement,
          selectedTab: goal.selectedTab,
          freeShipping: goal.freeShipping,
          percentageDiscount: goal.percentageDiscount,
          fixedAmountDiscount: goal.fixedAmountDiscount,
        }),
      );
    });

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setToastMessage("Changes saved successfully.");
          setToastError(false);
        } else {
          throw new Error(result.error || "Failed to save changes.");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save changes.");
      }
    } catch (error) {
      console.error("Save changes error:", error);
      setToastMessage(error.message || "Failed to save changes.");
      setToastError(true);
    } finally {
      setToastActive(true);
    }
  };

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
          onAction: handleSaveChanges,
          loading: isLoading,
          primary: true,
          disabled: isLoading,
        }}
      >
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Text as="p" tone="caution">
                Create a Shopify discount for the relevant fields below. These
                values will appear exclusively on the store when applied as an
                app block!
              </Text>

              <>
                {Array.isArray(spendingGoals) &&
                  spendingGoals.map((goal) => (
                    <SpendingGoal
                      key={goal.id}
                      {...goal}
                      onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
                      onDelete={handleDeleteSpendingGoal}
                    />
                  ))}
                <div style={{ margin: "1rem 0 2rem 0" }}>
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

// 2.0

// import { useState, useEffect } from "react";
// import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
// import { SpendingGoal } from "./components/SpendingGoal";

// export default function Index() {
//   const [spendingGoals, setSpendingGoals] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [toastActive, setToastActive] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const [toastError, setToastError] = useState(false);

//   // Fetch goals from backend
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
//           console.error(`Error fetching goals: ${response.statusText}`);
//           setSpendingGoals([]);
//         }
//       } catch (error) {
//         console.error(`Fetch goals failed: ${error.message}`);
//         setSpendingGoals([]);
//       }
//     }
//     fetchGoals();
//   }, []);

//   // Handle adding a spending goal
//   const handleAddSpendingGoal = async () => {
//     const formData = new FormData();
//     formData.append("_action", "CREATE_DISCOUNT");
//     formData.append("shop", "zohaibalishah.myshopify.com");
//     formData.append("spendingGoal", "50");
//     formData.append("announcement", "Add {{amount_left}} to get discounts");
//     formData.append("selectedTab", "0");
//     formData.append("percentageDiscount", "10");
//     formData.append("fixedAmountDiscount", "5");
//     formData.append("freeShipping", "false");

//     try {
//       const response = await fetch("/api/cart", {
//         method: "POST",
//         body: formData,
//       });

//       if (response.ok) {
//         const { data } = await response.json();
//         setSpendingGoals((prevGoals) => [...prevGoals, data]);
//         setToastMessage("Discount created successfully");
//         setToastError(false);
//       } else {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error("Failed to create discount");
//       }
//     } catch (error) {
//       setToastMessage(error.message || "Failed to create discount");
//       setToastError(true);
//     } finally {
//       setToastActive(true);
//     }
//   };

//   // Handle deleting a spending goal
//   const handleDeleteSpendingGoal = async (id) => {
//     const formData = new FormData();
//     formData.append("_action", "DELETE");
//     formData.append("goalId", id.toString());

//     try {
//       const response = await fetch("/api/cart", {
//         method: "POST",
//         body: formData,
//       });

//       if (response.ok) {
//         const { success, error } = await response.json();
//         if (success) {
//           setSpendingGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
//           setToastMessage("Goal deleted successfully");
//           setToastError(false);
//         } else {
//           throw new Error(error || "Failed to delete goal");
//         }
//       } else {
//         throw new Error(await response.text());
//       }
//     } catch (error) {
//       console.error("Delete goal failed:", error);
//       setToastMessage(error.message || "Failed to delete goal");
//       setToastError(true);
//     } finally {
//       setToastActive(true);
//     }
//   };

//   // Handle saving changes to goals
//   const handleSaveChanges = async () => {
//     const formData = new FormData();
//     formData.append("_action", "SAVE");

//     // Ensure spendingGoals is an array before processing
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
//         body: formData,
//       });

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success) {
//           setToastMessage("Changes saved successfully");
//           setToastError(false);
//         } else {
//           throw new Error(result.error || "Failed to save changes");
//         }
//       } else {
//         throw new Error(await response.text());
//       }
//     } catch (error) {
//       console.error("Save changes failed:", error);
//       setToastMessage(error.message || "Failed to save changes");
//       setToastError(true);
//     } finally {
//       setToastActive(true);
//     }
//   };

//   const toastMarkup = toastActive && (
//     <Toast
//       content={toastMessage}
//       error={toastError}
//       onDismiss={() => setToastActive(false)}
//     />
//   );

//   const handleGoalUpdate = (goalId, updates) => {
//     setSpendingGoals((prevGoals) =>
//       prevGoals.map((goal) =>
//         goal.id === goalId ? { ...goal, ...updates } : goal
//       )
//     );
//   };

//   return (
//     <Frame>
//       <Page
//         title="Cart App"
//         primaryAction={{
//           content: isLoading ? "Saving..." : "Save Changes",
//           onAction: handleSaveChanges,
//           loading: isLoading,
//           primary: true,
//           disabled: isLoading,
//         }}
//       >
//         <BlockStack gap="500">
//           <Layout>
//             <Layout.Section>
//               {spendingGoals.map((goal) => (
//                 <SpendingGoal
//                   key={goal.id}
//                   {...goal}
//                   onUpdate={(updates) => handleGoalUpdate(goal.id, updates)}
//                   onDelete={handleDeleteSpendingGoal}
//                 />
//               ))}
//               <Button
//                 variant="primary"
//                 fullWidth
//                 onClick={handleAddSpendingGoal}
//                 disabled={isLoading}
//               >
//                 Add New Discount
//               </Button>
//             </Layout.Section>
//           </Layout>
//         </BlockStack>
//         {toastMarkup}
//       </Page>
//     </Frame>
//   );
// }

// 3.0

// import { useState, useCallback } from "react";
// import { Frame, Page, Layout, Button, Toast, BlockStack } from "@shopify/polaris";
// import { SpendingGoal } from "./components/SpendingGoal";
// import { useSubmit, useLoaderData } from "@remix-run/react";
// import { json } from "@remix-run/node";
// import db from "../db.server";
// import { handleCreateDiscount, handleUpdateDiscount, handleDeleteDiscount } from "./utils/discount-handlers.server";

// // Loader function to fetch spending goals
// export async function loader() {
//   try {
//     const goals = await db.spendingGoal.findMany();
//     return json({ success: true, data: goals });
//   } catch (error) {
//     console.error("Loader Error:", error);
//     return json({ success: false, error: error.message }, { status: 400 });
//   }
// }

// // Action function to handle form submissions
// export async function action({ request }) {
//   const formData = await request.formData();
//   const actionType = formData.get("_action");

//   try {
//     switch (actionType) {
//       case "CREATE_DISCOUNT":
//         return await handleCreateDiscount(request, formData);
//       case "UPDATE":
//         return await handleUpdateDiscount(request, formData);
//       case "DELETE":
//         return await handleDeleteDiscount(request, formData);
//       default:
//         throw new Error("Invalid action type");
//     }
//   } catch (error) {
//     console.error("Action Error:", error);
//     return json({ success: false, error: error.message }, { status: 400 });
//   }
// }

// // Component
// export default function Index() {
//   const submit = useSubmit();
//   const { data: spendingGoals = [] } = useLoaderData();
//   const [isLoading, setIsLoading] = useState(false);
//   const [toast, setToast] = useState({ active: false, content: "", error: false });

//   const showToast = useCallback((content, error = false) => {
//     setToast({ active: true, content, error });
//   }, []);

//   const handleAddSpendingGoal = async () => {
//     setIsLoading(true);
//     const formData = new FormData();
//     formData.append("_action", "CREATE_DISCOUNT");
//     formData.append("title", "New Discount");
//     formData.append("spendingGoal", "50");
//     formData.append("announcement", "Add {{amount_left}} to get discounts");
//     formData.append("selectedTab", "0");
//     formData.append("freeShipping", "true");

//     try {
//       await submit(formData, { method: "post" });
//       showToast("Discount created successfully");
//     } catch (error) {
//       showToast(error.message || "Failed to create discount", true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGoalUpdate = useCallback((goalId, updates) => {
//     const formData = new FormData();
//     formData.append("_action", "UPDATE");
//     formData.append("goalId", goalId.toString());
//     Object.entries(updates).forEach(([key, value]) => {
//       formData.append(key, value.toString());
//     });

//     try {
//       submit(formData, { method: "post" });
//     } catch (error) {
//       showToast(error.message || "Failed to update discount", true);
//     }
//   }, [submit, showToast]);

//   const handleDeleteSpendingGoal = useCallback(async (id) => {
//     const formData = new FormData();
//     formData.append("_action", "DELETE");
//     formData.append("goalId", id.toString());

//     try {
//       await submit(formData, { method: "post" });
//       showToast("Discount deleted successfully");
//     } catch (error) {
//       showToast(error.message || "Failed to delete discount", true);
//     }
//   }, [submit, showToast]);

//   return (
//     <Frame>
//       <Page
//         title="Spending Goals"
//         primaryAction={{
//           content: "Save Changes",
//           onAction: () => showToast("All changes saved"),
//           loading: isLoading,
//           disabled: isLoading,
//         }}
//       >
//         <BlockStack gap="500">
//           <Layout>
//             <Layout.Section>
//               {spendingGoals.map((goal) => (
//                 <SpendingGoal
//                   key={goal.id}
//                   {...goal}
//                   onUpdate={handleGoalUpdate}
//                   onDelete={handleDeleteSpendingGoal}
//                 />
//               ))}
//               <Button
//                 variant="primary"
//                 fullWidth
//                 onClick={handleAddSpendingGoal}
//                 disabled={isLoading}
//               >
//                 Add New Discount
//               </Button>
//             </Layout.Section>
//           </Layout>
//         </BlockStack>

//         {toast.active && (
//           <Toast
//             content={toast.content}
//             error={toast.error}
//             onDismiss={() => setToast({ ...toast, active: false })}
//           />
//         )}
//       </Page>
//     </Frame>
//   );
// }
