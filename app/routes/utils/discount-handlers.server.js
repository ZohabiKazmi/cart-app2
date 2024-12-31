import { json } from "@remix-run/node";
import db from "../../db.server";
import { createAutomaticDiscount, updateAutomaticDiscount, deleteAutomaticDiscount } from "../utils/discounts.server";

export async function handleCreateDiscount(request, formData) {
  try {
    const data = {
      shop: formData.get("shop"),
      title: formData.get("title") || "Spending Goal Discount",
      spendingGoal: parseFloat(formData.get("spendingGoal")),
      announcement: formData.get("announcement"),
      selectedTab: parseInt(formData.get("selectedTab")),
      percentageDiscount: parseFloat(formData.get("percentageDiscount") || "0"),
      fixedAmountDiscount: parseFloat(formData.get("fixedAmountDiscount") || "0"),
      freeShipping: formData.get("freeShipping") === "true"
    };

    // Validate required fields
    if (!data.shop || !data.spendingGoal) {
      throw new Error("Missing required fields");
    }

    // Create discount in Shopify
    const discountResult = await createAutomaticDiscount(request, data);
    
    if (!discountResult?.automaticDiscountNode?.id) {
      throw new Error("Failed to create Shopify discount");
    }

    // Save to database
    const goal = await db.spendingGoal.create({
      data: {
        ...data,
        DiscountId: discountResult.automaticDiscountNode.id
      }
    });

    return json({ success: true, data: goal });
  } catch (error) {
    console.error("Create discount error:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function handleUpdateDiscount(request, formData) {
  try {
    const goalId = parseInt(formData.get("goalId"));
    const data = {
      title: formData.get("title"),
      spendingGoal: parseFloat(formData.get("spendingGoal")),
      announcement: formData.get("announcement"),
      selectedTab: parseInt(formData.get("selectedTab")),
      percentageDiscount: parseFloat(formData.get("percentageDiscount") || "0"),
      fixedAmountDiscount: parseFloat(formData.get("fixedAmountDiscount") || "0")
    };

    const goal = await db.spendingGoal.findUnique({
      where: { id: goalId }
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    // Update discount in Shopify
    await updateAutomaticDiscount(request, {
      discountId: goal.DiscountId,
      ...data
    });

    // Update in database
    const updatedGoal = await db.spendingGoal.update({
      where: { id: goalId },
      data
    });

    return json({ success: true, data: updatedGoal });
  } catch (error) {
    console.error("Update discount error:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function handleDeleteDiscount(request, formData) {
  try {
    const goalId = parseInt(formData.get("goalId"));
    const goal = await db.spendingGoal.findUnique({
      where: { id: goalId }
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    // Delete from Shopify
    if (goal.DiscountId) {
      await deleteAutomaticDiscount(request, goal.DiscountId);
    }

    // Delete from database
    await db.spendingGoal.delete({
      where: { id: goalId }
    });

    return json({ success: true });
  } catch (error) {
    console.error("Delete discount error:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
}