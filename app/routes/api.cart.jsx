import { json } from "@remix-run/node";
import db from "../db.server"; 

export const loader = async () => {
  try {
    // Fetch spending goals from the database
    const spendingGoals = await db.spendingGoal.findMany();

    return json({
      status: "success",
      spendingGoals,
    });
  } catch (error) {
    console.error("Error fetching spending goals:", error);
    return json(
      { status: "error", message: "Failed to fetch spending goals" },
      { status: 500 },
    );
  }
};

export async function action({ request }) {
  if (request.method === "POST") {
    try {
      const body = await request.json(); // Parse the JSON body
      console.log("Received body:", body); // Log the entire received body

      // Verify the structure of the received data
      const { spendingGoals } = body;
      if (!spendingGoals || !Array.isArray(spendingGoals)) {
        console.error("Received invalid or empty spendingGoals array", body);
        return json(
          { message: "Invalid or empty spendingGoals array" },
          { status: 400 },
        );
      }

      // Check if the first goal has the required fields
      if (!spendingGoals[0]?.spendingGoal) {
        console.error(
          "spendingGoal field is missing in the first goal",
          spendingGoals,
        );
        return json({ message: "Missing spendingGoal field" }, { status: 400 });
      }

      // Save to the database
      const savedGoals = await db.spendingGoal.createMany({
        data: spendingGoals.map((goal) => ({
          spendingGoal: goal.spendingGoal,
          announcement: goal.announcement,
          selectedTab: goal.selectedTab,
          freeShipping: goal.freeShipping || null,
          percentageDiscount: goal.percentageDiscount || null,
          fixedAmountDiscount: goal.fixedAmountDiscount || null,
        })),
      });

      console.log("Saved spending goals:", savedGoals);
      return json({ message: "Spending goals saved successfully", savedGoals });
    } catch (error) {
      console.error("Error saving spending goals:", error);
      return json(
        { message: "Failed to save spending goals", error: error.message },
        { status: 500 },
      );
    }
  }

  return json({ message: "Method not allowed" }, { status: 405 });
}


// import { json } from "@remix-run/node";
// import db from "../db.server";

// // Fetch the spending goals
// export const loader = async () => {
//   try {
//     // Fetch spending goals from the database
//     const spendingGoals = await db.spendingGoal.findMany();

//     return json({
//       status: "success",
//       spendingGoals,
//     });
//   } catch (error) {
//     console.error("Error fetching spending goals:", error);
//     return json(
//       { status: "error", message: "Failed to fetch spending goals" },
//       { status: 500 }
//     );
//   }
// };

// // Handle POST (for saving) and DELETE (for removing) requests
// export async function action({ request }) {
//   const method = request.method;
//   if (method === "POST") {
//     try {
//       const body = await request.json(); // Parse the JSON body
//       console.log("Received body:", body); // Log the entire received body

//       const { updatedGoal } = body; // Extract the updated goal object
//       if (!updatedGoal || !updatedGoal.id) {
//         console.error("Invalid goal data received:", body);
//         return json({ message: "Invalid or missing goal data" }, { status: 400 });
//       }

//       // Check if the goal already exists in the database
//       const existingGoal = await db.spendingGoal.findUnique({
//         where: { id: updatedGoal.id },
//       });

//       if (!existingGoal) {
//         console.error("Goal not found for ID:", updatedGoal.id);
//         return json({ message: "Goal not found" }, { status: 404 });
//       }

//       // Update the spending goal in the database
//       const updatedSpendingGoal = await db.spendingGoal.update({
//         where: { id: updatedGoal.id },
//         data: {
//           spendingGoal: updatedGoal.spendingGoal,
//           announcement: updatedGoal.announcement,
//           selectedTab: updatedGoal.selectedTab,
//           freeShipping: updatedGoal.selectedTab === 0 ? updatedGoal.freeShipping : null,
//           percentageDiscount: updatedGoal.selectedTab === 1 ? updatedGoal.percentageDiscount : null,
//           fixedAmountDiscount: updatedGoal.selectedTab === 2 ? updatedGoal.fixedAmountDiscount : null,
//         },
//       });

//       console.log("Updated spending goal:", updatedSpendingGoal);
//       return json({ message: "Spending goal updated successfully", updatedSpendingGoal });
//     } catch (error) {
//       console.error("Error updating spending goal:", error);
//       return json(
//         { message: "Failed to update spending goal", error: error.message },
//         { status: 500 }
//       );
//     }
//   }

//   if (method === "DELETE") {
//     try {
//       const { id } = await request.json(); // Extract goal ID to delete

//       // Check if the goal exists in the database
//       const existingGoal = await db.spendingGoal.findUnique({
//         where: { id },
//       });

//       if (!existingGoal) {
//         console.error("Goal not found for ID:", id);
//         return json({ message: "Goal not found" }, { status: 404 });
//       }

//       // Delete the spending goal from the database
//       await db.spendingGoal.delete({
//         where: { id },
//       });

//       console.log("Deleted spending goal with ID:", id);
//       return json({ message: "Spending goal deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting spending goal:", error);
//       return json(
//         { message: "Failed to delete spending goal", error: error.message },
//         { status: 500 }
//       );
//     }
//   }

//   return json({ message: "Method not allowed" }, { status: 405 });
// }




// import { json } from "@remix-run/node";
// import db from "../db.server";

// export const loader = async () => {
//   try {
//     // Fetch spending goals from the database
//     const spendingGoals = await db.spendingGoal.findMany();

//     return json({
//       status: "success",
//       spendingGoals,
//     });
//   } catch (error) {
//     console.error("Error fetching spending goals:", error);
//     return json(
//       { status: "error", message: "Failed to fetch spending goals" },
//       { status: 500 }
//     );
//   }
// };

// export async function action({ request }) {
//   if (request.method === "POST") {
//     try {
//       const body = await request.json();
//       const { spendingGoal } = body;

//       // Ensure the correct structure for the data
//       if (!spendingGoal || !spendingGoal.spendingGoal) {
//         return json(
//           { message: "Invalid spendingGoal data" },
//           { status: 400 }
//         );
//       }

//       // Save to the database
//       const savedGoal = await db.spendingGoal.create({
//         data: {
//           spendingGoal: spendingGoal.spendingGoal,
//           announcement: spendingGoal.announcement,
//           selectedTab: spendingGoal.selectedTab,
//           freeShipping: spendingGoal.selectedTab === 0 ? spendingGoal.freeShipping : null,
//           percentageDiscount: spendingGoal.selectedTab === 1 ? spendingGoal.percentageDiscount : null,
//           fixedAmountDiscount: spendingGoal.selectedTab === 2 ? spendingGoal.fixedAmountDiscount : null,
//         },
//       });

//       return json({ message: "Spending goal saved successfully", savedGoal });
//     } catch (error) {
//       console.error("Error saving spending goal:", error);
//       return json(
//         { message: "Failed to save spending goal", error: error.message },
//         { status: 500 }
//       );
//     }
//   }

//   return json({ message: "Method not allowed" }, { status: 405 });
// }
