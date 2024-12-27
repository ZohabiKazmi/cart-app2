import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }) {
  try {
    console.log("Fetching goals from Prisma...");
    const goals = await db.spendingGoal.findMany();
    console.log("Retrieved goals from Prisma:", goals);

    // Return the data in the expected format
    return json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error("Error fetching spending goals:", error);
    return json(
      {
        success: false,
        error: "Failed to fetch spending goals",
      },
      { status: 500 },
    );
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    switch (action) {
      case "CREATE":
        const newGoal = await db.spendingGoal.create({
          data: {
            shop: formData.get("shop") || "",
            spendingGoal: parseFloat(formData.get("spendingGoal") || "0"),
            announcement: formData.get("announcement") || "",
            selectedTab: parseInt(formData.get("selectedTab") || "0"),
            freeShipping: formData.get("freeShipping") === 'true',
            percentageDiscount: formData.get("percentageDiscount")
              ? parseFloat(formData.get("percentageDiscount"))
              : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount")
              ? parseFloat(formData.get("fixedAmountDiscount"))
              : null,
          },
        });
        return json({ success: true, data: newGoal });

      case "UPDATE":
        const goalId = parseInt(formData.get("goalId"));
        const updatedGoal = await db.spendingGoal.update({
          where: { id: goalId },
          data: {
            shop: formData.get("shop"),
            spendingGoal: parseFloat(formData.get("spendingGoal")),
            announcement: formData.get("announcement"),
            selectedTab: parseInt(formData.get("selectedTab")),
            freeShipping: formData.get("freeShipping") === 'true',
            percentageDiscount: formData.get("percentageDiscount")
              ? parseFloat(formData.get("percentageDiscount"))
              : null,
            fixedAmountDiscount: formData.get("fixedAmountDiscount")
              ? parseFloat(formData.get("fixedAmountDiscount"))
              : null,
          },
        });
        return json({ success: true, data: updatedGoal });

      case "DELETE":
        const deleteId = parseInt(formData.get("goalId"));
        await db.spendingGoal.delete({
          where: { id: deleteId },
        });
        return json({ success: true });

      case "SAVE":
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

      default:
        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing spending goals:", error);
    return json(
      {
        success: false,
        error: "Failed to process spending goal operation",
      },
      { status: 500 },
    );
  }
}