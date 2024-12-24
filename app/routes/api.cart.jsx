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
//       data: goals
//     });
//   } catch (error) {
//     console.error('Error fetching spending goals:', error);
//     return json({
//       success: false,
//       error: 'Failed to fetch spending goals'
//     }, { status: 500 });
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
//             shop: formData.get("shop") || "",
//             spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
//             announcement: formData.get("announcement") || "",
//             selectedTab: parseInt(formData.get("selectedTab") || "0"),
//             freeShipping: formData.get("freeShipping") || null,
//             percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
//           }
//         });
//         return json({ success: true, data: newGoal });

//       case "UPDATE":
//         const goalId = parseInt(formData.get("goalId"));
//         const updatedGoal = await db.spendingGoal.update({
//           where: { id: goalId },
//           data: {
//             shop: formData.get("shop"),
//             spendingGoal: parseFloat(formData.get("spendingGoal")),
//             announcement: formData.get("announcement"),
//             selectedTab: parseInt(formData.get("selectedTab")),
//             freeShipping: formData.get("freeShipping") || null,
//             percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
//             fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
//           }
//         });
//         return json({ success: true, data: updatedGoal });

//       case "DELETE":
//         const deleteId = parseInt(formData.get("goalId"));
//         await db.spendingGoal.delete({
//           where: { id: deleteId }
//         });
//         return json({ success: true });

//       default:
//         return json({ success: false, error: "Invalid action" }, { status: 400 });
//     }
//   } catch (error) {
//     console.error('Error managing spending goals:', error);
//     return json({
//       success: false,
//       error: 'Failed to process spending goal operation'
//     }, { status: 500 });
//   }
// }




import { json } from "@remix-run/node";
import db from "../db.server";

const SHOPIFY_API_VERSION = "2023-04"; // Use the appropriate API version
const SHOPIFY_ADMIN_API_URL = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// Helper Function to Create Shopify Discounts
async function createShopifyDiscount(goal) {
  const { selectedTab, spendingGoal, percentageDiscount, fixedAmountDiscount } = goal;

  // Construct Shopify discount data based on the discount type
  let discountData;
  if (selectedTab === 0) { // Free Shipping
    discountData = {
      price_rule: {
        title: `Free Shipping Discount - ${spendingGoal}`,
        target_type: "shipping_line",
        allocation_method: "each",
        value_type: "fixed_amount",
        value: "0.0",
        customer_selection: "all",
        starts_at: new Date().toISOString(),
        minimum_requirement: {
          target_type: "subtotal",
          threshold: spendingGoal
        }
      }
    };
  } else if (selectedTab === 1) { // Percentage Discount
    discountData = {
      price_rule: {
        title: `Percentage Discount - ${percentageDiscount}%`,
        target_type: "line_item",
        allocation_method: "across",
        value_type: "percentage",
        value: `-${percentageDiscount}`,
        customer_selection: "all",
        starts_at: new Date().toISOString(),
        minimum_requirement: {
          target_type: "subtotal",
          threshold: spendingGoal
        }
      }
    };
  } else if (selectedTab === 2) { // Fixed Amount Discount
    discountData = {
      price_rule: {
        title: `Fixed Amount Discount - $${fixedAmountDiscount}`,
        target_type: "line_item",
        allocation_method: "across",
        value_type: "fixed_amount",
        value: `-${fixedAmountDiscount}`,
        customer_selection: "all",
        starts_at: new Date().toISOString(),
        minimum_requirement: {
          target_type: "subtotal",
          threshold: spendingGoal
        }
      }
    };
  }

  // Send the request to Shopify
  try {
    const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/price_rules.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discountData)
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Shopify API Error:", result);
      throw new Error(result.errors || "Failed to create discount");
    }

    return result.price_rule; // Return the created price rule data
  } catch (error) {
    console.error("Error creating Shopify discount:", error);
    throw new Error("Failed to create Shopify discount");
  }
}

// Helper Function to Delete Shopify Discounts
async function deleteShopifyDiscount(shopifyDiscountId) {
  try {
    const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/price_rules/${shopifyDiscountId}.json`, {
      method: "DELETE",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN
      }
    });

    if (!response.ok) {
      const result = await response.json();
      console.error("Error deleting Shopify discount:", result);
      throw new Error(result.errors || "Failed to delete discount");
    }
  } catch (error) {
    console.error("Error deleting Shopify discount:", error);
    throw new Error("Failed to delete Shopify discount");
  }
}

// Loader Function to Fetch Spending Goals
export async function loader() {
  try {
    const goals = await db.spendingGoal.findMany();
    return json({ success: true, data: goals });
  } catch (error) {
    console.error("Error fetching spending goals:", error);
    return json({ success: false, error: "Failed to fetch spending goals" }, { status: 500 });
  }
}

// Action Function for Creating, Updating, and Deleting Discounts
export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    switch (action) {
      case "CREATE": {
        const newGoal = await db.spendingGoal.create({
          data: {
            shop: formData.get("shop") || "",
            spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
            announcement: formData.get("announcement") || "",
            selectedTab: parseInt(formData.get("selectedTab") || "0"),
            freeShipping: formData.get("freeShipping") === "true" || false,
            percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
          }
        });

        const shopifyDiscount = await createShopifyDiscount(newGoal);

        // Save the Shopify discount ID to the database for future updates/deletions
        await db.spendingGoal.update({
          where: { id: newGoal.id },
          data: { shopifyDiscountId: shopifyDiscount.id }
        });

        return json({ success: true, data: newGoal });
      }

      case "UPDATE": {
        const goalId = parseInt(formData.get("goalId"));
        const existingGoal = await db.spendingGoal.findUnique({ where: { id: goalId } });

        if (!existingGoal) {
          throw new Error("Goal not found");
        }

        const updatedGoal = await db.spendingGoal.update({
          where: { id: goalId },
          data: {
            shop: formData.get("shop"),
            spendingGoal: parseFloat(formData.get("spendingGoal")),
            announcement: formData.get("announcement"),
            selectedTab: parseInt(formData.get("selectedTab")),
            freeShipping: formData.get("freeShipping") === "true" || false,
            percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
          }
        });

        // Delete the old discount and create a new one
        await deleteShopifyDiscount(existingGoal.shopifyDiscountId);
        const shopifyDiscount = await createShopifyDiscount(updatedGoal);

        await db.spendingGoal.update({
          where: { id: updatedGoal.id },
          data: { shopifyDiscountId: shopifyDiscount.id }
        });

        return json({ success: true, data: updatedGoal });
      }

      case "DELETE": {
        const goalId = parseInt(formData.get("goalId"));
        const existingGoal = await db.spendingGoal.findUnique({ where: { id: goalId } });

        if (!existingGoal) {
          throw new Error("Goal not found");
        }

        // Delete the Shopify discount
        await deleteShopifyDiscount(existingGoal.shopifyDiscountId);

        // Delete the goal from the database
        await db.spendingGoal.delete({ where: { id: goalId } });

        return json({ success: true });
      }

      default:
        return json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in action:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

