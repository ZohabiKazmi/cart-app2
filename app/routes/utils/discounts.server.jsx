// import { authenticate } from "../../shopify.server";
// import { db } from "../../db.server";

// export async function createAutomaticDiscount(SpendingGoal, { title, spendingGoal: goalAmount, selectedTab, percentageDiscount, fixedAmountDiscount, freeShipping }) {
//   const client = await authenticate.admin(SpendingGoal); 

//   // Log the input parameters
//   console.log("Creating automatic discount with parameters:", { title, goalAmount, selectedTab, percentageDiscount, fixedAmountDiscount, freeShipping });

//   const discountConfig = {
//     title: title || `Discount for spending over ${goalAmount}`,
//     startsAt: new Date().toISOString(),
//     endsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
//     minimumRequirement: {
//       subtotal: {
//         greaterThanOrEqualToSubtotal: goalAmount,
//       },
//     },
//     customerGets: selectedTab === 0 // Free Shipping
//       ? {
//           shipping: {
//             discount: {
//               onShipping: freeShipping,
//             },
//           },
//         }
//       : {
//           value: {
//             [selectedTab === 1 ? "percentage" : "fixedAmount"]: selectedTab === 1 ? percentageDiscount : fixedAmountDiscount,
//           },
//         },
//   };

//   try {
//     const response = await client.query({
//       data: {
//         query: `#graphql
//           mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
//             discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
//               automaticDiscountNode {
//                 id
//                 automaticDiscount {
//                   ... on DiscountAutomaticBasic {
//                     startsAt
//                     endsAt
//                     minimumRequirement {
//                       ... on DiscountMinimumSubtotal {
//                         greaterThanOrEqualToSubtotal {
//                           amount
//                           currencyCode
//                         }
//                       }
//                     }
//                     customerGets {
//                       value {
//                         ... on DiscountAmount {
//                           amount {
//                             amount
//                             currencyCode
//                           }
//                           appliesOnEachItem
//                         }
//                       }
//                       items {
//                         ... on AllDiscountItems {
//                           allItems
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//               userErrors {
//                 field
//                 code
//                 message
//               }
//             }
//           }
//         `,
//         variables: {
//           automaticBasicDiscount: discountConfig,
//         },
//       },
//     });

//     const result = response.body.data.discountAutomaticBasicCreate;
//     if (result.userErrors?.length) {
//       console.error("User errors from Shopify:", result.userErrors);
//       throw new Error(result.userErrors[0].message);
//     }

//     return result;
//   } catch (error) {
//     console.error("Error creating automatic discount:", error.message);
//     throw new Error("Failed to create Shopify automatic discount.");
//   }
// }

// export async function updateAutomaticDiscount(SpendingGoal, { discountId, title, spendingGoal, discountType, discountValue }) {
//   const client = await authenticate.admin(SpendingGoal);

//   const discountConfig = {
//     title: title,
//     minimumRequirement: {
//       subtotal: {
//         greaterThanOrEqualToAmount: spendingGoal.toString(),
//       },
//     },
//     customerGets: discountType === 0
//       ? {
//           shipping: {
//             discount: {
//               onShipping: true,
//             },
//           },
//         }
//       : {
//           value: {
//             [discountType === 1 ? "percentage" : "fixedAmount"]: discountValue.toString(),
//           },
//         },
//   };

//   try {
//     const response = await client.query({
//       data: {
//         query: `
//           mutation discountAutomaticBasicUpdate($id: ID!, $automaticBasicDiscount: DiscountAutomaticBasicInput!) {
//             discountAutomaticBasicUpdate(id: $id, automaticBasicDiscount: $automaticBasicDiscount) {
//               userErrors {
//                 field
//                 message
//               }
//             }
//           }
//         `,
//         variables: {
//           id: discountId,
//           automaticBasicDiscount: discountConfig,
//         },
//       },
//     });

//     const result = response.body.data.discountAutomaticBasicUpdate;

//     if (result.userErrors?.length) {
//       throw new Error(result.userErrors[0].message);
//     }

//     return result;
//   } catch (error) {
//     console.error("Error updating automatic discount:", error.message);
//     throw new Error("Failed to update Shopify automatic discount.");
//   }
// }

// export async function deleteAutomaticDiscount(SpendingGoal, discountId) {
//   const client = await authenticate.admin(SpendingGoal);

//   try {
//     const response = await client.query({
//       data: {
//         query: `
//           mutation discountAutomaticBasicDelete($id: ID!) {
//             discountAutomaticBasicDelete(id: $id) {
//               userErrors {
//                 field
//                 message
//               }
//             }
//           }
//         `,
//         variables: { id: discountId },
//       },
//     });

//     const result = response.body.data.discountAutomaticBasicDelete;

//     if (result.userErrors?.length) {
//       throw new Error(result.userErrors[0].message);
//     }

//     return result;
//   } catch (error) {
//     console.error("Error deleting automatic discount:", error.message);
//     throw new Error("Failed to delete Shopify automatic discount.");
//   }
// }


import { authenticate } from "../../shopify.server";
import { db } from "../../db.server";

export async function createAutomaticDiscount(SpendingGoal, { title, spendingGoal: goalAmount, selectedTab, percentageDiscount, fixedAmountDiscount, freeShipping }) {
  const client = await authenticate.admin(SpendingGoal);

  // Convert goalAmount to proper format
  const formattedGoalAmount = parseFloat(goalAmount).toFixed(2);

  // Prepare the discount configuration
  const discountConfig = {
    title: title || `Spend ${formattedGoalAmount} to save`,
    startsAt: new Date().toISOString(),
    endsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    minimumRequirement: {
      subtotal: {
        greaterThanOrEqualToAmount: formattedGoalAmount
      }
    },
    customerSelection: {
      all: true
    }
  };

  // Add the appropriate discount type
  if (selectedTab === 0) { // Free Shipping
    discountConfig.customerGets = {
      shippingLine: {
        discount: {
          fixedAmount: {
            amount: 999999 // Effectively makes shipping free
          }
        }
      }
    };
  } else if (selectedTab === 1) { // Percentage
    discountConfig.customerGets = {
      value: {
        percentage: parseFloat(percentageDiscount)
      },
      items: {
        all: true
      }
    };
  } else { // Fixed Amount
    discountConfig.customerGets = {
      value: {
        fixedAmount: {
          amount: parseFloat(fixedAmountDiscount).toFixed(2)
        }
      },
      items: {
        all: true
      }
    };
  }

  try {
    const response = await client.query({
      data: {
        query: `#graphql
          mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
              automaticDiscount {
                id
                title
                status
                startsAt
                endsAt
                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToAmount {
                      amount
                      currencyCode
                    }
                  }
                }
                customerGets {
                  ... on DiscountAutomaticBasicCustomerGets {
                    value {
                      ... on DiscountPercentage {
                        percentage
                      }
                      ... on DiscountAmount {
                        amount {
                          amount
                          currencyCode
                        }
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
              userErrors {
                field
                code
                message
              }
            }
          }
        `,
        variables: {
          automaticBasicDiscount: discountConfig
        }
      }
    });

    const { data, errors } = response.body;

    if (errors?.length > 0) {
      console.error('GraphQL Errors:', errors);
      throw new Error(errors[0].message);
    }

    const result = data.discountAutomaticBasicCreate;
    
    if (result.userErrors?.length > 0) {
      console.error('User Errors:', result.userErrors);
      throw new Error(result.userErrors[0].message);
    }

    // Return the created discount data
    return {
      success: true,
      discountId: result.automaticDiscount.id,
      data: result.automaticDiscount
    };

  } catch (error) {
    console.error('Error creating discount:', error);
    throw new Error(`Failed to create discount: ${error.message}`);
  }
}

export async function updateAutomaticDiscount(SpendingGoal, { discountId, title, spendingGoal, selectedTab, percentageDiscount, fixedAmountDiscount }) {
  const client = await authenticate.admin(SpendingGoal);

  // Convert spendingGoal to proper format
  const formattedGoalAmount = parseFloat(spendingGoal).toFixed(2);

  // Prepare the discount configuration
  const discountConfig = {
    title: title,
    minimumRequirement: {
      subtotal: {
        greaterThanOrEqualToAmount: formattedGoalAmount
      }
    },
    customerSelection: {
      all: true
    }
  };

  // Add the appropriate discount type
  if (selectedTab === 0) {
    discountConfig.customerGets = {
      shippingLine: {
        discount: {
          fixedAmount: {
            amount: 999999
          }
        }
      }
    };
  } else if (selectedTab === 1) {
    discountConfig.customerGets = {
      value: {
        percentage: parseFloat(percentageDiscount)
      },
      items: {
        all: true
      }
    };
  } else {
    discountConfig.customerGets = {
      value: {
        fixedAmount: {
          amount: parseFloat(fixedAmountDiscount).toFixed(2)
        }
      },
      items: {
        all: true
      }
    };
  }

  try {
    const response = await client.query({
      data: {
        query: `#graphql
          mutation discountAutomaticBasicUpdate($id: ID!, $automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicUpdate(id: $id, automaticBasicDiscount: $automaticBasicDiscount) {
              automaticDiscount {
                id
                title
                status
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
          id: discountId,
          automaticBasicDiscount: discountConfig
        }
      }
    });

    const { data, errors } = response.body;

    if (errors?.length > 0) {
      throw new Error(errors[0].message);
    }

    const result = data.discountAutomaticBasicUpdate;
    
    if (result.userErrors?.length > 0) {
      throw new Error(result.userErrors[0].message);
    }

    return {
      success: true,
      data: result.automaticDiscount
    };

  } catch (error) {
    console.error('Error updating discount:', error);
    throw new Error(`Failed to update discount: ${error.message}`);
  }
}

export async function deleteAutomaticDiscount(SpendingGoal, discountId) {
  const client = await authenticate.admin(SpendingGoal);

  try {
    const response = await client.query({
      data: {
        query: `#graphql
          mutation discountAutomaticBasicDelete($id: ID!) {
            discountAutomaticBasicDelete(id: $id) {
              deletedAutomaticDiscountId
              userErrors {
                field
                code
                message
              }
            }
          }
        `,
        variables: {
          id: discountId
        }
      }
    });

    const { data, errors } = response.body;

    if (errors?.length > 0) {
      throw new Error(errors[0].message);
    }

    const result = data.discountAutomaticBasicDelete;
    
    if (result.userErrors?.length > 0) {
      throw new Error(result.userErrors[0].message);
    }

    return {
      success: true,
      deletedId: result.deletedAutomaticDiscountId
    };

  } catch (error) {
    console.error('Error deleting discount:', error);
    throw new Error(`Failed to delete discount: ${error.message}`);
  }
}