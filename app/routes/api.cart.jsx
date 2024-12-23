import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ success: false, error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    const spendingGoals = await db.spendingGoal.findMany({
      where: {
        shop: shop
      },
      orderBy: {
        spendingGoal: 'asc'
      }
    });

    return json({
      success: true,
      data: spendingGoals
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
  const shop = formData.get("shop");
  const action = formData.get("_action");

  if (!shop) {
    return json({ success: false, error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    switch (action) {
      case "CREATE":
        const newGoal = await db.spendingGoal.create({
          data: {
            shop,
            spendingGoal: Number(formData.get("spendingGoal")),
            selectedTab: Number(formData.get("selectedTab")),
            freeShipping: formData.get("freeShipping"),
            percentageDiscount: Number(formData.get("percentageDiscount")),
            fixedAmountDiscount: Number(formData.get("fixedAmountDiscount")),
            announcement: formData.get("announcement")
          }
        });
        return json({ success: true, data: newGoal });

      case "UPDATE":
        const goalId = formData.get("goalId");
        const updatedGoal = await db.spendingGoal.update({
          where: { id: goalId },
          data: {
            spendingGoal: Number(formData.get("spendingGoal")),
            selectedTab: Number(formData.get("selectedTab")),
            freeShipping: formData.get("freeShipping"),
            percentageDiscount: Number(formData.get("percentageDiscount")),
            fixedAmountDiscount: Number(formData.get("fixedAmountDiscount")),
            announcement: formData.get("announcement")
          }
        });
        return json({ success: true, data: updatedGoal });

      case "DELETE":
        const deleteId = formData.get("goalId");
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
