import { json } from "@remix-run/node";
import db from "../db.server";
import {
  createAutomaticDiscount,
  updateAutomaticDiscount,
  deleteAutomaticDiscount,
} from "./utils/discounts.server";
import { authenticate } from "../shopify.server";

// Helper: Format the discount title
function formatDiscountTitle(spendingGoal, selectedTab, percentageDiscount, fixedAmountDiscount) {
  return `Spend ${spendingGoal} to get ${
    selectedTab === 0
      ? "free shipping"
      : selectedTab === 1
      ? `${percentageDiscount}% off`
      : `$${fixedAmountDiscount} off`
  }`;
}

// Handler: Create a new goal
async function handleCreate(formData, SpendingGoal) {
  try {
    const newGoalData = {
      shop: formData.get("shop") || "",
      spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
      announcement: formData.get("announcement") || "",
      selectedTab: parseInt(formData.get("selectedTab") || "0"),
      freeShipping: formData.get("freeShipping") === "true",
      percentageDiscount: formData.get("percentageDiscount")
        ? parseFloat(formData.get("percentageDiscount"))
        : null,
      fixedAmountDiscount: formData.get("fixedAmountDiscount")
        ? parseFloat(formData.get("fixedAmountDiscount"))
        : null,
      DiscountId: formData.get("DiscountId") || null,
    };

    // Debugging log to check newGoalData
    console.log("New Goal Data:", newGoalData);

    // Validate required fields
    if (!newGoalData.shop || !newGoalData.spendingGoal) {
      throw new Error("Shop and spending goal are required.");
    }

    // Create Shopify discount
    const title = formatDiscountTitle(
      newGoalData.spendingGoal,
      newGoalData.selectedTab,
      newGoalData.percentageDiscount,
      newGoalData.fixedAmountDiscount
    );

    const discountResponse = await createAutomaticDiscount(SpendingGoal, {
      title,
      spendingGoal: newGoalData.spendingGoal,
      discountType: newGoalData.selectedTab,
      discountValue:
        newGoalData.selectedTab === 1
          ? newGoalData.percentageDiscount
          : newGoalData.selectedTab === 2
          ? newGoalData.fixedAmountDiscount
          : null,
    });

    // Debugging log for discountResponse
    console.log("Discount Response:", discountResponse);

    if (discountResponse.userErrors?.length) {
      throw new Error(discountResponse.userErrors[0].message);
    }

    // Store the Shopify discount ID
    const newGoal = await db.spendingGoal.create({
      data: {
        ...newGoalData,
        DiscountId: discountResponse.automaticDiscountNode.id,
      },
    });

    return json({ success: true, data: newGoal });
  } catch (error) {
    console.error("Error creating goal:", error);
    return json({ success: false, error: error.message || "Failed to create goal" }, { status: 500 });
  }
}

// Handler: Update an existing goal
async function handleUpdate(formData, SpendingGoal) {
  try {
    const goalId = parseInt(formData.get("goalId"));
    const goal = await db.spendingGoal.findUnique({ where: { id: goalId } });

    if (!goal) {
      throw new Error("Goal not found");
    }

    const updatedData = {
      shop: formData.get("shop"),
      spendingGoal: parseFloat(formData.get("spendingGoal")),
      announcement: formData.get("announcement"),
      selectedTab: parseInt(formData.get("selectedTab")),
      freeShipping: formData.get("freeShipping") === "true",
      percentageDiscount: formData.get("percentageDiscount")
        ? parseFloat(formData.get("percentageDiscount"))
        : null,
      fixedAmountDiscount: formData.get("fixedAmountDiscount")
        ? parseFloat(formData.get("fixedAmountDiscount"))
        : null,
    };
    console.log("updated data----->",updatedData);

    const title = formatDiscountTitle(
      updatedData.spendingGoal,
      updatedData.selectedTab,
      updatedData.percentageDiscount,
      updatedData.fixedAmountDiscount
    );

    // Update Shopify discount
    if (goal.DiscountId) {
      await updateAutomaticDiscount(SpendingGoal, {
        discountId: goal.DiscountId,
        title,
        spendingGoal: updatedData.spendingGoal,
        discountType: updatedData.selectedTab,
        discountValue:
          updatedData.selectedTab === 1
            ? updatedData.percentageDiscount
            : updatedData.selectedTab === 2
            ? updatedData.fixedAmountDiscount
            : null,
      });
    }

    return db.spendingGoal.update({
      where: { id: goalId },
      data: updatedData,
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    throw new Error(error.message || "Failed to update goal");
  }
}

// Handler: Delete an existing goal
async function handleDelete(formData, SpendingGoal) {
  try {
    const goalId = parseInt(formData.get("goalId"));
    const goalToDelete = await db.spendingGoal.findUnique({ where: { id: goalId } });

    if (!goalToDelete) {
      throw new Error("Goal not found");
    }

    // Delete Shopify discount
    if (goalToDelete.DiscountId) {
      await deleteAutomaticDiscount(SpendingGoal, goalToDelete.DiscountId);
    }

    await db.spendingGoal.delete({
      where: { id: goalId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw new Error(error.message || "Failed to delete goal");
  }
}

// Loader: Fetch all goals
export async function loader({ request }) {
  try {
    const goals = await db.spendingGoal.findMany();
    return json({ success: true, data: goals });
  } catch (error) {
    console.error("Error fetching spending goals:", error);
    return json({ success: false, error: "Failed to fetch spending goals" }, { status: 500 });
  }
}

// Action: Handle CREATE, UPDATE, DELETE actions
export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const SpendingGoal = await authenticate.admin(request);

  console.log("Received action type:", actionType); // Debugging log
  console.log("Form data keys:", Array.from(formData.keys())); // Log all keys in formData

  try {
    switch (actionType) {
      case "CREATE": {
        try {
          const newGoalData = {
            shop: formData.get("shop") || "zohaibalishah.myshopify.com",
            spendingGoal: parseFloat(formData.get("spendingGoal") || "50"),
            announcement: formData.get("announcement") || "Add {{amount_left}} to avail discount!",
            selectedTab: parseInt(formData.get("selectedTab") || "0"),
            freeShipping: formData.get("freeShipping") === "true",
            percentageDiscount: formData.get("percentageDiscount")
              ? parseFloat(formData.get("percentageDiscount"))
              : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount")
              ? parseFloat(formData.get("fixedAmountDiscount"))
              : null,
            DiscountId: formData.get("DiscountId") || null,
          };

          // Debugging log to check newGoalData
          console.log("New Goal Data:", newGoalData);

          // Validate required fields
          if (!newGoalData.shop || !newGoalData.spendingGoal) {
            throw new Error("Shop and spending goal are required.");
          }

          // Create Shopify discount
          const title = formatDiscountTitle(
            newGoalData.spendingGoal,
            newGoalData.selectedTab,
            newGoalData.percentageDiscount,
            newGoalData.fixedAmountDiscount
          );

          const discountResponse = await createAutomaticDiscount(SpendingGoal, {
            title,
            spendingGoal: newGoalData.spendingGoal,
            discountType: newGoalData.selectedTab,
            discountValue:
              newGoalData.selectedTab === 1
                ? newGoalData.percentageDiscount
                : newGoalData.selectedTab === 2
                ? newGoalData.fixedAmountDiscount
                : null,
          });

          // Debugging log for discountResponse
          console.log("Discount Response:", discountResponse);

          if (discountResponse.userErrors?.length) {
            throw new Error(discountResponse.userErrors[0].message);
          }

          // Store the Shopify discount ID
          const newGoal = await db.spendingGoal.create({
            data: {
              ...newGoalData,
              DiscountId: discountResponse.automaticDiscountNode.id,
            },
          });

          return json({ success: true, data: newGoal });
        } catch (error) {
          console.error("Error creating goal:", error);
          return json({ success: false, error: error.message || "Failed to create goal" }, { status: 500 });
        }
      }

      case "UPDATE":
        const updatedGoal = await handleUpdate(formData, SpendingGoal);
        return json({ success: true, data: updatedGoal });

      case "DELETE":
        const result = await handleDelete(formData, SpendingGoal);
        return json(result);

        case "SAVE": {
          try {
            const goalsData = formData.getAll("goals[]");
            const goals = goalsData.map(data => JSON.parse(data));
  
            // Debugging log to check the parsed goals
            console.log("Parsed goals data:", goals);
  
            const results = await Promise.all(goals.map(async (goal) => {
              // Ensure goal.id is valid
              if (!goal.id) {
                throw new Error("Goal ID is missing");
              }
  
              // Update the goal in the database
              return db.spendingGoal.update({
                where: { id: goal.id },
                data: {
                  title: goal.title,
                  spendingGoal: goal.spendingGoal,
                  announcement: goal.announcement,
                  selectedTab: goal.selectedTab,
                  freeShipping: goal.freeShipping,
                  percentageDiscount: goal.percentageDiscount,
                  fixedAmountDiscount: goal.fixedAmountDiscount,
                }
              });
            }));
  
            // Return the results of all updates
            return json({ success: true, data: results });
          } catch (error) {
            console.error("Error saving goals:", error);
            return json({ success: false, error: 'Failed to save goals: ' + error.message }, { status: 500 });
          }
        }
  

      default:
        return json({ success: false, error: "Invalid action type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling action:", error);
    return json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





// 1.0 - Stores in database only - but it works

// import { json } from "@remix-run/node";
// import db from "../db.server";

// export async function loader({ request }) {
//   try {
//     console.log("Fetching goals from Prisma...");
//     const goals = await db.spendingGoal.findMany();
//     console.log("Retrieved goals from Prisma:", goals);

//     // Return the data in the expected format
//     return json({
//       success: true,
//       data: goals,
//     });
//   } catch (error) {
//     console.error("Error fetching spending goals:", error);
//     return json(
//       {
//         success: false,
//         error: "Failed to fetch spending goals",
//       },
//       { status: 500 },
//     );
//   }
// }

// export async function action({ request }) {
//   const formData = await request.formData();
//   const action = formData.get("_action");

//   try {
//     switch (action) {
//       case "CREATE":
//         const newGoal = await db.spendingGoal.create({
//           data: {
//             title: formData.get("title") || "Discount Title",
//             shop: formData.get("shop") || "",
//             spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
//             announcement: formData.get("announcement") || "",
//             selectedTab: parseInt(formData.get("selectedTab") || "0"),
//             freeShipping: formData.get("freeShipping") === 'true',
//             percentageDiscount: formData.get("percentageDiscount")
//               ? parseFloat(formData.get("percentageDiscount"))
//               : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount")
//               ? parseFloat(formData.get("fixedAmountDiscount"))
//               : null,
//           },
//         });
//         return json({ success: true, data: newGoal });

//       case "UPDATE":
//         const goalId = parseInt(formData.get("goalId"));
//         const updatedGoal = await db.spendingGoal.update({
//           where: { id: goalId },
//           data: {
//             title: formData.get("title"),
//             shop: formData.get("shop"),
//             spendingGoal: parseFloat(formData.get("spendingGoal")),
//             announcement: formData.get("announcement"),
//             selectedTab: parseInt(formData.get("selectedTab")),
//             freeShipping: formData.get("freeShipping") === 'true',
//             percentageDiscount: formData.get("percentageDiscount")
//               ? parseFloat(formData.get("percentageDiscount"))
//               : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount")
//               ? parseFloat(formData.get("fixedAmountDiscount"))
//               : null,
//           },
//         });
//         return json({ success: true, data: updatedGoal });

//       case "DELETE":
//         const deleteId = parseInt(formData.get("goalId"));
//         await db.spendingGoal.delete({
//           where: { id: deleteId },
//         });
//         return json({ success: true });

//       case "SAVE":
//         try {
//           const goalsData = formData.getAll("goals[]");
//           const goals = goalsData.map(data => JSON.parse(data));

//           // Debugging log to check the parsed goals
//           console.log("Parsed goals data:", goals);

//           const results = await Promise.all(goals.map(async (goal) => {
//             // Ensure goal.id is valid
//             if (!goal.id) {
//               throw new Error("Goal ID is missing");
//             }

//             // Update the goal in the database
//             return db.spendingGoal.update({
//               where: { id: goal.id },
//               data: {
//                 title: goal.title,
//                 spendingGoal: goal.spendingGoal,
//                 announcement: goal.announcement,
//                 selectedTab: goal.selectedTab,
//                 freeShipping: goal.freeShipping,
//                 percentageDiscount: goal.percentageDiscount,
//                 fixedAmountDiscount: goal.fixedAmountDiscount,
//               }
//             });
//           }));

//           // Return the results of all updates
//           return json({ success: true, data: results });
//         } catch (error) {
//           console.error("Error saving goals:", error);
//           return json({ success: false, error: 'Failed to save goals: ' + error.message }, { status: 500 });
//         }

//       default:
//         return json({ success: false, error: 'Invalid action' }, { status: 400 });
//     }
//   } catch (error) {
//     console.error("Error managing spending goals:", error);
//     return json(
//       {
//         success: false,
//         error: "Failed to process spending goal operation",
//       },
//       { status: 500 },
//     );
//   }
// }



// 2.0

// import { json } from "@remix-run/node";
// import db from "../db.server";

// const SHOPIFY_API_VERSION = "2023-04"; // Use the appropriate API version
// const SHOPIFY_ADMIN_API_URL = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`;
// const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// // Helper Function to Create Shopify Discounts
// async function createShopifyDiscount(goal) {
//   const { selectedTab, spendingGoal, percentageDiscount, fixedAmountDiscount } = goal;

//   // Construct Shopify discount data based on the discount type
//   let discountData;
//   if (selectedTab === 0) { // Free Shipping
//     discountData = {
//       price_rule: {
//         title: `Free Shipping Discount - ${spendingGoal}`,
//         target_type: "shipping_line",
//         allocation_method: "each",
//         value_type: "fixed_amount",
//         value: "0.0",
//         customer_selection: "all",
//         starts_at: new Date().toISOString(),
//         minimum_requirement: {
//           target_type: "subtotal",
//           threshold: spendingGoal
//         }
//       }
//     };
//   } else if (selectedTab === 1) { // Percentage Discount
//     discountData = {
//       price_rule: {
//         title: `Percentage Discount - ${percentageDiscount}%`,
//         target_type: "line_item",
//         allocation_method: "across",
//         value_type: "percentage",
//         value: `-${percentageDiscount}`,
//         customer_selection: "all",
//         starts_at: new Date().toISOString(),
//         minimum_requirement: {
//           target_type: "subtotal",
//           threshold: spendingGoal
//         }
//       }
//     };
//   } else if (selectedTab === 2) { // Fixed Amount Discount
//     discountData = {
//       price_rule: {
//         title: `Fixed Amount Discount - $${fixedAmountDiscount}`,
//         target_type: "line_item",
//         allocation_method: "across",
//         value_type: "fixed_amount",
//         value: `-${fixedAmountDiscount}`,
//         customer_selection: "all",
//         starts_at: new Date().toISOString(),
//         minimum_requirement: {
//           target_type: "subtotal",
//           threshold: spendingGoal
//         }
//       }
//     };
//   }

//   // Send the request to Shopify
//   try {
//     const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/price_rules.json`, {
//       method: "POST",
//       headers: {
//         "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(discountData)
//     });

//     const result = await response.json();
//     if (!response.ok) {
//       console.error("Shopify API Error:", result);
//       throw new Error(result.errors || "Failed to create discount");
//     }

//     return result.price_rule; // Return the created price rule data
//   } catch (error) {
//     console.error("Error creating Shopify discount:", error);
//     throw new Error("Failed to create Shopify discount");
//   }
// }

// // Helper Function to Delete Shopify Discounts
// async function deleteShopifyDiscount(shopifyDiscountId) {
//   try {
//     const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/price_rules/${shopifyDiscountId}.json`, {
//       method: "DELETE",
//       headers: {
//         "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN
//       }
//     });

//     if (!response.ok) {
//       const result = await response.json();
//       console.error("Error deleting Shopify discount:", result);
//       throw new Error(result.errors || "Failed to delete discount");
//     }
//   } catch (error) {
//     console.error("Error deleting Shopify discount:", error);
//     throw new Error("Failed to delete Shopify discount");
//   }
// }

// // Loader Function to Fetch Spending Goals
// export async function loader() {
//   try {
//     const goals = await db.spendingGoal.findMany();
//     return json({ success: true, data: goals });
//   } catch (error) {
//     console.error("Error fetching spending goals:", error);
//     return json({ success: false, error: "Failed to fetch spending goals" }, { status: 500 });
//   }
// }

// // Action Function for Creating, Updating, and Deleting Discounts
// export async function action({ request }) {
//   const formData = await request.formData();
//   const action = formData.get("_action");

//   try {
//     switch (action) {
//       case "CREATE": {
//         const newGoal = await db.spendingGoal.create({
//           data: {
//             shop: formData.get("shop") || "",
//             spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
//             announcement: formData.get("announcement") || "",
//             selectedTab: parseInt(formData.get("selectedTab") || "0"),
//             freeShipping: formData.get("freeShipping") === "true" || false,
//             percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
//           }
//         });

//         const shopifyDiscount = await createShopifyDiscount(newGoal);

//         // Save the Shopify discount ID to the database for future updates/deletions
//         await db.spendingGoal.update({
//           where: { id: newGoal.id },
//           data: { shopifyDiscountId: shopifyDiscount.id }
//         });

//         return json({ success: true, data: newGoal });
//       }

//       case "UPDATE": {
//         const goalId = parseInt(formData.get("goalId"));
//         const existingGoal = await db.spendingGoal.findUnique({ where: { id: goalId } });

//         if (!existingGoal) {
//           throw new Error("Goal not found");
//         }

//         const updatedGoal = await db.spendingGoal.update({
//           where: { id: goalId },
//           data: {
//             shop: formData.get("shop"),
//             spendingGoal: parseFloat(formData.get("spendingGoal")),
//             announcement: formData.get("announcement"),
//             selectedTab: parseInt(formData.get("selectedTab")),
//             freeShipping: formData.get("freeShipping") === "true" || false,
//             percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
//           }
//         });

//         // Delete the old discount and create a new one
//         await deleteShopifyDiscount(existingGoal.shopifyDiscountId);
//         const shopifyDiscount = await createShopifyDiscount(updatedGoal);

//         await db.spendingGoal.update({
//           where: { id: updatedGoal.id },
//           data: { shopifyDiscountId: shopifyDiscount.id }
//         });

//         return json({ success: true, data: updatedGoal });
//       }

//       case "DELETE": {
//         const goalId = parseInt(formData.get("goalId"));
//         const existingGoal = await db.spendingGoal.findUnique({ where: { id: goalId } });

//         if (!existingGoal) {
//           throw new Error("Goal not found");
//         }

//         // Delete the Shopify discount
//         await deleteShopifyDiscount(existingGoal.shopifyDiscountId);

//         // Delete the goal from the database
//         await db.spendingGoal.delete({ where: { id: goalId } });

//         return json({ success: true });
//       }

//       default:
//         return json({ success: false, error: "Invalid action" }, { status: 400 });
//     }
//   } catch (error) {
//     console.error("Error in action:", error);
//     return json({ success: false, error: error.message }, { status: 500 });
//   }
// }




// 3.0

// import { json } from "@remix-run/node";
// import db from "../db.server";
// // import { createAutomaticDiscount, updateAutomaticDiscount, deleteAutomaticDiscount } from "/discounts.server";
// import { createAutomaticDiscount, updateAutomaticDiscount, deleteAutomaticDiscount } from "./utils/discounts.server";

// import { authenticate } from "../shopify.server";

// export async function loader({ request }) {
//   try {
//     console.log("Fetching goals from Prisma...");
//     const goals = await db.spendingGoal.findMany();
//     console.log("Retrieved goals from Prisma:", goals);

//     return json({
//       success: true,
//       data: goals,
//     });
//   } catch (error) {
//     console.error("Error fetching spending goals:", error);
//     return json(
//       {
//         success: false,
//         error: "Failed to fetch spending goals",
//       },
//       { status: 500 },
//     );
//   }
// }

// export async function action({ request }) {
//   const formData = await request.formData();
//   const action = formData.get("_action");
//   const session = await authenticate.admin(request);

//   try {
//     switch (action) {
//       case "CREATE":
//         const newGoalData = {
//           shop: formData.get("shop") || "",
//           spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
//           announcement: formData.get("announcement") || "",
//           selectedTab: parseInt(formData.get("selectedTab") || "0"),
//           freeShipping: formData.get("freeShipping") || null,
//           percentageDiscount: formData.get("percentageDiscount")
//             ? parseFloat(formData.get("percentageDiscount"))
//             : null,
//           fixedAmountDiscount: formData.get("fixedAmountDiscount")
//             ? parseFloat(formData.get("fixedAmountDiscount"))
//             : null,
//         };

//         // Create Shopify discount first
//         const discountResponse = await createAutomaticDiscount(session, {
//           title: `Spend ${newGoalData.spendingGoal} to get ${
//             newGoalData.selectedTab === 0 ? "free shipping" :
//             newGoalData.selectedTab === 1 ? `${newGoalData.percentageDiscount}% off` :
//             `$${newGoalData.fixedAmountDiscount} off`
//           }`,
//           spendingGoal: newGoalData.spendingGoal,
//           discountType: newGoalData.selectedTab,
//           discountValue: newGoalData.selectedTab === 1 ? newGoalData.percentageDiscount :
//                         newGoalData.selectedTab === 2 ? newGoalData.fixedAmountDiscount : null
//         });

//         if (discountResponse.userErrors?.length) {
//           throw new Error(discountResponse.userErrors[0].message);
//         }

//         // Store the Shopify discount ID
//         const newGoal = await db.spendingGoal.create({
//           data: {
//             ...newGoalData,
//             shopifyDiscountId: discountResponse.automaticDiscountNode.id
//           },
//         });

//         return json({ success: true, data: newGoal });

//       case "UPDATE":
//         const goalId = parseInt(formData.get("goalId"));
//         const goal = await db.spendingGoal.findUnique({ where: { id: goalId } });
        
//         if (!goal) {
//           throw new Error("Goal not found");
//         }

//         const updatedData = {
//           shop: formData.get("shop"),
//           spendingGoal: parseFloat(formData.get("spendingGoal")),
//           announcement: formData.get("announcement"),
//           selectedTab: parseInt(formData.get("selectedTab")),
//           freeShipping: formData.get("freeShipping") || null,
//           percentageDiscount: formData.get("percentageDiscount")
//             ? parseFloat(formData.get("percentageDiscount"))
//             : null,
//           fixedAmountDiscount: formData.get("fixedAmountDiscount")
//             ? parseFloat(formData.get("fixedAmountDiscount"))
//             : null,
//         };

//         // Update Shopify discount
//         if (goal.shopifyDiscountId) {
//           await updateAutomaticDiscount(session, {
//             discountId: goal.shopifyDiscountId,
//             title: `Spend ${updatedData.spendingGoal} to get ${
//               updatedData.selectedTab === 0 ? "free shipping" :
//               updatedData.selectedTab === 1 ? `${updatedData.percentageDiscount}% off` :
//               `$${updatedData.fixedAmountDiscount} off`
//             }`,
//             spendingGoal: updatedData.spendingGoal,
//             discountType: updatedData.selectedTab,
//             discountValue: updatedData.selectedTab === 1 ? updatedData.percentageDiscount :
//                           updatedData.selectedTab === 2 ? updatedData.fixedAmountDiscount : null
//           });
//         }

//         const updatedGoal = await db.spendingGoal.update({
//           where: { id: goalId },
//           data: updatedData,
//         });

//         return json({ success: true, data: updatedGoal });

//       case "DELETE":
//         const deleteId = parseInt(formData.get("goalId"));
//         const goalToDelete = await db.spendingGoal.findUnique({ where: { id: deleteId } });

//         // Delete Shopify discount first
//         if (goalToDelete?.shopifyDiscountId) {
//           await deleteAutomaticDiscount(session, goalToDelete.shopifyDiscountId);
//         }

//         await db.spendingGoal.delete({
//           where: { id: deleteId },
//         });

//         return json({ success: true });

//       case "SAVE":
//         try {
//           const goals = JSON.parse(formData.get("goals[]")); 
          
//           const results = await Promise.all(goals.map(async (goal) => {
//             // Update Shopify discount if it exists
//             if (goal.shopifyDiscountId) {
//               await updateAutomaticDiscount(session, {
//                 discountId: goal.shopifyDiscountId,
//                 title: `Spend ${goal.spendingGoal} to get ${
//                   goal.selectedTab === 0 ? "free shipping" :
//                   goal.selectedTab === 1 ? `${goal.percentageDiscount}% off` :
//                   `$${goal.fixedAmountDiscount} off`
//                 }`,
//                 spendingGoal: goal.spendingGoal,
//                 discountType: goal.selectedTab,
//                 discountValue: goal.selectedTab === 1 ? goal.percentageDiscount :
//                              goal.selectedTab === 2 ? goal.fixedAmountDiscount : null
//               });
//             }

//             return db.spendingGoal.update({
//               where: { id: goal.id },
//               data: {
//                 spendingGoal: goal.spendingGoal,
//                 announcement: goal.announcement,
//                 selectedTab: goal.selectedTab,
//                 freeShipping: goal.freeShipping,
//                 percentageDiscount: goal.percentageDiscount,
//                 fixedAmountDiscount: goal.fixedAmountDiscount,
//               }
//             });
//           }));

//           return json({ success: true });
//         } catch (error) {
//           console.error("Error saving goals:", error);
//           return json({ success: false, error: 'Failed to save goals' }, { status: 500 });
//         }

//       default:
//         return json({ success: false, error: 'Invalid action' }, { status: 400 });
//     }
//   } catch (error) {
//     console.error("Error managing spending goals:", error);
//     return json(
//       {
//         success: false,
//         error: "Failed to process spending goal operation",
//       },
//       { status: 500 },
//     );
//   }
// }

