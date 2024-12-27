export async function createAutomaticDiscount(session, { title, spendingGoal, discountType, discountValue }) {
  const client = await session;

  const discountConfig = {
    automaticBasic: {
      title,
      customerSelection: {
        all: true
      },
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToAmount: spendingGoal.toString()
        }
      },
      startsAt: new Date().toISOString(),
      customerGets: discountType === 0 ? {
        shipping: {
          discount: {
            onShipping: true
          }
        }
      } : {
        value: {
          [discountType === 1 ? 'percentage' : 'fixedAmount']: 
            discountType === 1 ? discountValue : discountValue.toString()
        }
      }
    }
  };

  const response = await client.query({
    data: {
      query: `mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
          automaticDiscountNode {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        automaticBasicDiscount: discountConfig.automaticBasic
      }
    }
  });

  const result = response.body.data.discountAutomaticBasicCreate;
  
  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result;
}

export async function updateAutomaticDiscount(session, { discountId, title, spendingGoal, discountType, discountValue }) {
  const client = await session;

  const response = await client.query({
    data: {
      query: `mutation discountAutomaticBasicUpdate($automaticBasicDiscount: DiscountAutomaticBasicInput!, $id: ID!) {
        discountAutomaticBasicUpdate(automaticBasicDiscount: $automaticBasicDiscount, id: $id) {
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        id: discountId,
        automaticBasicDiscount: {
          title,
          minimumRequirement: {
            subtotal: {
              greaterThanOrEqualToAmount: spendingGoal.toString()
            }
          },
          customerGets: discountType === 0 ? {
            shipping: {
              discount: {
                onShipping: true
              }
            }
          } : {
            value: {
              [discountType === 1 ? 'percentage' : 'fixedAmount']: 
                discountType === 1 ? discountValue : discountValue.toString()
            }
          }
        }
      }
    }
  });

  const result = response.body.data.discountAutomaticBasicUpdate;
  
  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result;
}

export async function deleteAutomaticDiscount(session, discountId) {
  const client = await session;

  const response = await client.query({
    data: {
      query: `mutation discountAutomaticBasicDelete($id: ID!) {
        discountAutomaticBasicDelete(id: $id) {
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        id: discountId
      }
    }
  });

  const result = response.body.data.discountAutomaticBasicDelete;
  
  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result;
}