// Helper functions for discount-related operations
export function getDiscountTitle(data) {
    return `Spend ${data.spendingGoal} to get ${
      data.selectedTab === 0 ? "free shipping" :
      data.selectedTab === 1 ? `${data.percentageDiscount}% off` :
      `$${data.fixedAmountDiscount} off`
    }`;
  }
  
  export function getDiscountValue(data) {
    return data.selectedTab === 1 ? data.percentageDiscount :
           data.selectedTab === 2 ? data.fixedAmountDiscount : null;
  }
  
  export function validateDiscountData(data) {
    if (!data.spendingGoal || data.spendingGoal <= 0) {
      throw new Error("Invalid spending goal");
    }
  
    if (data.selectedTab === 1 && (!data.percentageDiscount || data.percentageDiscount <= 0)) {
      throw new Error("Invalid percentage discount");
    }
  
    if (data.selectedTab === 2 && (!data.fixedAmountDiscount || data.fixedAmountDiscount <= 0)) {
      throw new Error("Invalid fixed amount discount");
    }
  }