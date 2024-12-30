import { authenticate } from "../../shopify.server";
import { db } from "../../db.server";

export async function createAutomaticDiscount(SpendingGoal, { title, id, spendingGoal: goalAmount, discountType, discountValue }) {
  const client = await authenticate.admin(SpendingGoal); 

  // Log the input parameters
  console.log("Creating automatic discount with parameters:", { title, id, goalAmount, discountType, discountValue });

  const discountSettings = await db.discountSettings.findUnique({
    where: { id },
  });

  // Destructure the values from the fetched settings
  const {
    spendingGoal: fetchedSpendingGoal,
    discountType: fetchedDiscountType, // Rename to avoid conflict
    percentageDiscount,
    fixedAmountDiscount,
    freeShipping,
  } = discountSettings;

  const discountConfig = {
    title: title || `Discount for spending over ${goalAmount}`, // Use goalAmount instead of spendingGoal
    startsAt: new Date().toISOString(),
    endsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    minimumRequirement: {
      subtotal: {
        greaterThanOrEqualToSubtotal: goalAmount, // Use goalAmount instead of spendingGoal
      },
    },
    customerGets: fetchedDiscountType === 0
      ? {
          shipping: {
            discount: {
              onShipping: freeShipping, // Use the fetched value
            },
          },
        }
      : {
          value: {
            [fetchedDiscountType === 1 ? "percentage" : "fixedAmount"]: fetchedDiscountType === 1 ? percentageDiscount : fixedAmountDiscount,
          },
        },
  };

  try {
    const response = await client.query({
      data: {
        query: `#graphql
          mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
              automaticDiscountNode {
                id
                automaticDiscount {
                  ... on DiscountAutomaticBasic {
                    startsAt
                    endsAt
                    minimumRequirement {
                      ... on DiscountMinimumSubtotal {
                        greaterThanOrEqualToSubtotal {
                          amount
                          currencyCode
                        }
                      }
                    }
                    customerGets {
                      value {
                        ... on DiscountAmount {
                          amount {
                            amount
                            currencyCode
                          }
                          appliesOnEachItem
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                      }
                    }
                  }
                }
              }
              userErrors {
                field
                code
                message
              }
            }
          }
        `,
        variables: {
          automaticBasicDiscount: discountConfig,
        },
      },
    });

    // Log the response for debugging
    console.log('Response from Shopify:', response);

    const result = response.body.data.discountAutomaticBasicCreate;
    if (result.userErrors?.length) {
      console.error("User errors from Shopify:", result.userErrors);
      throw new Error(result.userErrors[0].message);
    }

    return result;
  } catch (error) {
    console.error("Error creating automatic discount:", error.message);
    throw new Error("Failed to create Shopify automatic discount.");
  }
}

export async function updateAutomaticDiscount(SpendingGoal, { discountId, title, spendingGoal, discountType, discountValue }) {
  const client = await authenticate.admin(SpendingGoal);

  const discountConfig = {
    title: title,
    minimumRequirement: {
      subtotal: {
        greaterThanOrEqualToAmount: spendingGoal.toString(),
      },
    },
    customerGets: discountType === 0
      ? {
          shipping: {
            discount: {
              onShipping: true,
            },
          },
        }
      : {
          value: {
            [discountType === 1 ? "percentage" : "fixedAmount"]: discountValue.toString(),
          },
        },
  };

  try {
    const response = await client.query({
      data: {
        query: `
          mutation discountAutomaticBasicUpdate($id: ID!, $automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicUpdate(id: $id, automaticBasicDiscount: $automaticBasicDiscount) {
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          id: discountId,
          automaticBasicDiscount: discountConfig,
        },
      },
    });

    const result = response.body.data.discountAutomaticBasicUpdate;

    if (result.userErrors?.length) {
      throw new Error(result.userErrors[0].message);
    }

    return result;
  } catch (error) {
    console.error("Error updating automatic discount:", error.message);
    throw new Error("Failed to update Shopify automatic discount.");
  }
}

export async function deleteAutomaticDiscount(SpendingGoal, discountId) {
  const client = await authenticate.admin(SpendingGoal);

  try {
    const response = await client.query({
      data: {
        query: `
          mutation discountAutomaticBasicDelete($id: ID!) {
            discountAutomaticBasicDelete(id: $id) {
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: { id: discountId },
      },
    });

    const result = response.body.data.discountAutomaticBasicDelete;

    if (result.userErrors?.length) {
      throw new Error(result.userErrors[0].message);
    }

    return result;
  } catch (error) {
    console.error("Error deleting automatic discount:", error.message);
    throw new Error("Failed to delete Shopify automatic discount.");
  }
}
