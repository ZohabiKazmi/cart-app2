// import { useState, useCallback } from "react";
// import { Card, TextField, Button, Select, BlockStack } from "@shopify/polaris";

// const DISCOUNT_TYPES = {
//   FREE_SHIPPING: 0,
//   PERCENTAGE: 1,
//   FIXED_AMOUNT: 2,
// };

// const DISCOUNT_OPTIONS = [
//   { label: "Free Shipping", value: DISCOUNT_TYPES.FREE_SHIPPING.toString() },
//   { label: "Percentage Discount", value: DISCOUNT_TYPES.PERCENTAGE.toString() },
//   { label: "Fixed Amount", value: DISCOUNT_TYPES.FIXED_AMOUNT.toString() },
// ];

// export function SpendingGoal({
//   id,
//   title = "",
//   spendingGoal = 0,
//   announcement = "",
//   selectedTab = DISCOUNT_TYPES.FREE_SHIPPING,
//   percentageDiscount = 0,
//   fixedAmountDiscount = 0,
//   onUpdate,
//   onDelete,
// }) {
//   const [values, setValues] = useState({
//     title,
//     spendingGoal,
//     announcement,
//     selectedTab,
//     percentageDiscount,
//     fixedAmountDiscount,
//   });

//   const handleChange = useCallback((key, value) => {
//     const newValues = { ...values, [key]: value };
//     setValues(newValues);
//     onUpdate(id, newValues);
//   }, [values, id, onUpdate]);

//   const handleTabChange = useCallback((value) => {
//     const newTab = parseInt(value);
//     const newAnnouncement = newTab === DISCOUNT_TYPES.FREE_SHIPPING
//       ? `Add {{amount_left}} more to get free shipping`
//       : `Add {{amount_left}} more to get discount`;

//     handleChange("selectedTab", newTab);
//     handleChange("announcement", newAnnouncement);
//   }, [handleChange]);

//   return (
//     <Card>
//       <BlockStack gap="400">
//         <TextField
//           label="Title"
//           value={values.title}
//           onChange={(value) => handleChange("title", value)}
//           autoComplete="off"
//         />

//         <Select
//           label="Discount Type"
//           options={DISCOUNT_OPTIONS}
//           value={values.selectedTab.toString()}
//           onChange={handleTabChange}
//         />

//         <TextField
//           label="Spending Goal"
//           type="number"
//           value={values.spendingGoal.toString()}
//           onChange={(value) => handleChange("spendingGoal", parseFloat(value) || 0)}
//           autoComplete="off"
//           prefix="$"
//         />

//         <TextField
//           label="Announcement Message"
//           value={values.announcement}
//           onChange={(value) => handleChange("announcement", value)}
//           autoComplete="off"
//           multiline
//           helpText="Use {{amount_left}} to show the remaining amount"
//         />

//         {values.selectedTab === DISCOUNT_TYPES.PERCENTAGE && (
//           <TextField
//             label="Percentage Discount"
//             type="number"
//             value={values.percentageDiscount.toString()}
//             onChange={(value) => handleChange("percentageDiscount", parseFloat(value) || 0)}
//             suffix="%"
//             autoComplete="off"
//           />
//         )}

//         {values.selectedTab === DISCOUNT_TYPES.FIXED_AMOUNT && (
//           <TextField
//             label="Fixed Amount Discount"
//             type="number"
//             value={values.fixedAmountDiscount.toString()}
//             onChange={(value) => handleChange("fixedAmountDiscount", parseFloat(value) || 0)}
//             prefix="$"
//             autoComplete="off"
//           />
//         )}

//         <Button destructive onClick={() => onDelete(id)}>
//           Delete
//         </Button>
//       </BlockStack>
//     </Card>
//   );
// }

// 1.0

import { useState, useRef, useCallback } from "react";
import { Card, TextField, Button, Select, BlockStack } from "@shopify/polaris";

// Constants for reusable values
const DISCOUNT_TYPES = {
  FREE_SHIPPING: 0,
  PERCENTAGE: 1,
  FIXED_AMOUNT: 2,
};

const DISCOUNT_OPTIONS = [
  { label: "Percentage Discount", value: DISCOUNT_TYPES.PERCENTAGE.toString() },
  { label: "Fixed Amount", value: DISCOUNT_TYPES.FIXED_AMOUNT.toString() },
  { label: "Free Shipping", value: DISCOUNT_TYPES.FREE_SHIPPING.toString() },
];

// const MESSAGES = {
//   FREE_SHIPPING: "more to get free shipping",
//   DISCOUNT: "more to get discount"
// };

export function SpendingGoal({
  id,
  shop,
  title,
  spendingGoal,
  announcement,
  selectedTab,
  freeShipping: initialFreeShipping,
  percentageDiscount: initialPercentageDiscount,
  fixedAmountDiscount: initialFixedAmountDiscount,
  discountId,
  onDelete,
  onUpdate,
}) {
  // Unified state management for all form fields
  const [state, setState] = useState({
    title: title || " ",
    spendingGoal,
    announcement,
    selectedTab: selectedTab || DISCOUNT_TYPES.FREE_SHIPPING,
    freeShipping: initialFreeShipping || false,
    percentageDiscount: initialPercentageDiscount || 0,
    fixedAmountDiscount: initialFixedAmountDiscount || 0,
    discountId: discountId || null,
  });

  // Cache previous state to prevent unnecessary updates
  const previousValues = useRef(state);

  // Generic update handler for all state changes
  const handleUpdate = useCallback(
    (updates) => {
      const newState = { ...state, ...updates };

      // Only update if values actually changed
      if (JSON.stringify(newState) !== JSON.stringify(previousValues.current)) {
        previousValues.current = newState;
        setState(newState);
        onUpdate(newState);
      }
    },
    [state, onUpdate],
  );

  // Handle discount type changes
  const handleTabChange = useCallback(
    (value) => {
      const newTab = parseInt(value);
      const updates = {
        selectedTab: newTab,
        announcement:
          newTab === DISCOUNT_TYPES.FREE_SHIPPING
            ? `Add {{amount_left}} more to get free shipping`
            : `Add {{amount_left}} more to get discount`,
        freeShipping: newTab === DISCOUNT_TYPES.FREE_SHIPPING,
      };

      handleUpdate(updates);
    },
    [handleUpdate],
  );

  // Render appropriate discount input field based on selected type
  const renderDiscountField = useCallback(() => {
    switch (state.selectedTab) {
      case DISCOUNT_TYPES.PERCENTAGE:
        return (
          <TextField
            label="Percentage Discount"
            type="number"
            value={state.percentageDiscount.toString()}
            onChange={(value) =>
              handleUpdate({ percentageDiscount: parseFloat(value) || 0 })
            }
            autoComplete="off"
            suffix="%"
          />
        );
      case DISCOUNT_TYPES.FIXED_AMOUNT:
        return (
          <TextField
            label="Fixed Amount Discount"
            type="number"
            value={state.fixedAmountDiscount.toString()}
            onChange={(value) =>
              handleUpdate({ fixedAmountDiscount: parseFloat(value) || 0 })
            }
            autoComplete="off"
            prefix="$"
          />
        );
      default:
        return null;
    }
  }, [
    state.selectedTab,
    state.percentageDiscount,
    state.fixedAmountDiscount,
    handleUpdate,
  ]);

  return (
    <div style={{margin: "1rem 0"}}>
      <Card>
        <BlockStack gap="400">
          <TextField
            label="Title of Discount"
            type="text"
            value={state.title}
            onChange={(value) =>
              handleUpdate({ title: value || "Discount Title" })
            }
            autoComplete="off"
          />
          {/* Discount Type Selector */}
          <Select
            label="Discount Type"
            options={DISCOUNT_OPTIONS}
            onChange={handleTabChange}
            value={state.selectedTab.toString()}
          />
          {/* Spending Goal Input */}
          <TextField
            label="Spending Goal"
            type="number"
            value={state.spendingGoal.toString()}
            onChange={(value) =>
              handleUpdate({ spendingGoal: parseFloat(value) || 0 })
            }
            autoComplete="off"
          />
          {/* Announcement Message Input */}
          <TextField
            label="Announcement Message"
            value={state.announcement}
            onChange={(value) => handleUpdate({ announcement: value })}
            autoComplete="off"
            multiline
            helpText="{{amount_left}} will be replaced with the amount left"
          />
          {/* Dynamic Discount Input Field */}
          {renderDiscountField()}
          {/* Delete Button */}
          <Button destructive onClick={() => onDelete(id)}>
            Delete
          </Button>
        </BlockStack>
      </Card>
    </div>
  );
}
// <script>
// const calculateFinalCartTotal = (cartTotal, deliveryCharges) => {
//     let finalTotal = cartTotal;

//     // Check if free shipping goal is reached
//     if (state.selectedTab === DISCOUNT_TYPES.FREE_SHIPPING && state.freeShippingUsed) {
//       finalTotal -= deliveryCharges; // Exclude delivery charges
//     }

//     // Apply percentage discount
//     if (state.selectedTab === DISCOUNT_TYPES.PERCENTAGE) {
//       const discountAmount = (state.percentageDiscount / 100) * cartTotal;
//       finalTotal -= discountAmount;
//     }

//     // Apply fixed amount discount
//     if (state.selectedTab === DISCOUNT_TYPES.FIXED_AMOUNT) {
//       finalTotal -= state.fixedAmountDiscount;
//     }

//     return Math.max(finalTotal, 0); // Ensure total doesn't go below zero
//   };

//   // Example usage in your checkout process
//   const handleCheckout = async () => {
//     const cartTotal = await getCartTotal(); // Function to get the current cart total
//     const deliveryCharges = await getDeliveryCharges(); // Function to get delivery charges
//     const finalTotal = calculateFinalCartTotal(cartTotal, deliveryCharges);

//     // Create a checkout URL with the final total
//     const checkoutUrl = `https://${shop}/cart?total=${finalTotal}`;
//     console.log("Checkout URL:", checkoutUrl);

//     // Redirect to the Shopify checkout page
//     window.location.href = checkoutUrl;
//   };
// </script>
