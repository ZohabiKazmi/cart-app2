import { authenticate } from "../../shopify.server";

export async function createAutomaticDiscount(session, { title, spendingGoal, discountType, discountValue }) {
  const client = await authenticate.admin(session); // Ensure authentication here.

  const discountConfig = {
    title: title,
    customerSelection: {
      all: true,
    },
    minimumRequirement: {
      subtotal: {
        greaterThanOrEqualToAmount: spendingGoal.toString(),
      },
    },
    startsAt: new Date().toISOString(),
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
          mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
              automaticDiscountNode {
                id
              }
              userErrors {
                field
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

    const result = response.body.data.discountAutomaticBasicCreate;

    if (result.userErrors?.length) {
      throw new Error(result.userErrors[0].message);
    }

    return result;
  } catch (error) {
    console.error("Error creating automatic discount:", error.message);
    throw new Error("Failed to create Shopify automatic discount.");
  }
}

export async function updateAutomaticDiscount(session, { discountId, title, spendingGoal, discountType, discountValue }) {
  const client = await authenticate.admin(session);

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

export async function deleteAutomaticDiscount(session, discountId) {
  const client = await authenticate.admin(session);

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
