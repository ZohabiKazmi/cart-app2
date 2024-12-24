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

// Function to create the discount on Shopify
async function createShopifyDiscount(goal) {
  const { selectedTab, spendingGoal, percentageDiscount, fixedAmountDiscount } = goal;

  let discountData;

  if (selectedTab === 0) { // Free Shipping
    discountData = {
      discount_type: "free_shipping",
      value: 0,
      minimum_requirement: { target_type: "subtotal", threshold: spendingGoal },
    };
  } else if (selectedTab === 1) { // Percentage Discount
    discountData = {
      discount_type: "percentage",
      value: percentageDiscount,
      minimum_requirement: { target_type: "subtotal", threshold: spendingGoal },
    };
  } else if (selectedTab === 2) { // Fixed Amount Discount
    discountData = {
      discount_type: "fixed_amount",
      value: fixedAmountDiscount,
      minimum_requirement: { target_type: "subtotal", threshold: spendingGoal },
    };
  }

  try {
    const response = await fetch(
      `${SHOPIFY_ADMIN_API_URL}/price_rules.json`,
      {
        method: 'POST',
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_rule: discountData
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create discount on Shopify");
    }

    const data = await response.json();
    return data;  // Return Shopify discount data
  } catch (error) {
    console.error("Failed to create discount on Shopify:", error.message);
    throw new Error("Failed to create discount");
  }
}

export async function loader({ request }) {
  try {
    console.log("Fetching goals from Prisma...");
    const goals = await db.spendingGoal.findMany();
    console.log("Retrieved goals from Prisma:", goals);
    
    // Return the data in the expected format
    return json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching spending goals:', error);
    return json({
      success: false,
      error: 'Failed to fetch spending goals'
    }, { status: 500 });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    switch (action) {
      case "CREATE":
        // Create a new goal in the database
        const newGoal = await db.spendingGoal.create({
          data: {
            shop: formData.get("shop") || "",
            spendingGoal: parseFloat(formData.get("spendingGoal") || "50"),
            announcement: formData.get("announcement") || "",
            selectedTab: parseInt(formData.get("selectedTab") || "0"),
            freeShipping: formData.get("freeShipping") || null,
            percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
          }
        });

        // Create a discount on Shopify
        const discount = await createShopifyDiscount(newGoal);

        return json({ success: true, data: { ...newGoal, discount } });

      case "UPDATE":
        const goalId = parseInt(formData.get("goalId"));
        const updatedGoal = await db.spendingGoal.update({
          where: { id: goalId },
          data: {
            shop: formData.get("shop"),
            spendingGoal: parseFloat(formData.get("spendingGoal")),
            announcement: formData.get("announcement"),
            selectedTab: parseInt(formData.get("selectedTab")),
            freeShipping: formData.get("freeShipping") || null,
            percentageDiscount: formData.get("percentageDiscount") ? parseFloat(formData.get("percentageDiscount")) : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount") ? parseFloat(formData.get("fixedAmountDiscount")) : null
          }
        });

        // Update Shopify discount if necessary
        const updatedDiscount = await createShopifyDiscount(updatedGoal);

        return json({ success: true, data: { ...updatedGoal, updatedDiscount } });

      case "DELETE":
        const deleteId = parseInt(formData.get("goalId"));
        await db.spendingGoal.delete({
          where: { id: deleteId }
        });
        return json({ success: true });

      default:
        return json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing spending goals:', error);
    return json({
      success: false,
      error: 'Failed to process spending goal operation'
    }, { status: 500 });
  }
}
