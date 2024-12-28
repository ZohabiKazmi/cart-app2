import { authenticate } from "../../shopify.server";

export async function createAutomaticDiscount(session, { title, spendingGoal, discountType, discountValue }) {
  const client = await authenticate.admin(session);

  const discountConfig = {
    automaticBasic: {
      title: title,
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