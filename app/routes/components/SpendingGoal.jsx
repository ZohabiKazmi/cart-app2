import { useState, useRef, useCallback } from 'react';
import { Card, TextField, Button, Select, BlockStack } from "@shopify/polaris";

// Constants for reusable values
const DISCOUNT_TYPES = {
  FREE_SHIPPING: 0,
  PERCENTAGE: 1,
  FIXED_AMOUNT: 2
};

const DISCOUNT_OPTIONS = [
  { label: "Percentage Discount", value: DISCOUNT_TYPES.PERCENTAGE.toString() },
  { label: "Fixed Amount", value: DISCOUNT_TYPES.FIXED_AMOUNT.toString() },
  { label: "Free Shipping", value: DISCOUNT_TYPES.FREE_SHIPPING.toString() }
];

const MESSAGES = {
  FREE_SHIPPING: "more to get free shipping",
  DISCOUNT: "more to get discount"
};

export function SpendingGoal({
  id,
  shop,
  spendingGoal,
  announcement,
  selectedTab,
  freeShipping: initialFreeShipping,
  percentageDiscount: initialPercentageDiscount,
  fixedAmountDiscount: initialFixedAmountDiscount,
  onDelete,
  onUpdate,
  isFreeShippingUsed,
}) {
  // Unified state management for all form fields
  const [state, setState] = useState({
    spendingGoal,
    announcement,
    selectedTab: DISCOUNT_TYPES.PERCENTAGE,
    freeShipping: initialFreeShipping,
    percentageDiscount: initialPercentageDiscount || 0,
    fixedAmountDiscount: initialFixedAmountDiscount || 0,
    freeShippingUsed: initialFreeShipping // Track if free shipping was ever used
  });

  // Cache previous state to prevent unnecessary updates
  const previousValues = useRef(state);

  // Generic update handler for all state changes
  const handleUpdate = useCallback((updates) => {
    const newState = { ...state, ...updates };
    
    // Only update if values actually changed
    if (JSON.stringify(newState) !== JSON.stringify(previousValues.current)) {
      previousValues.current = newState;
      setState(newState);
      onUpdate(newState);
    }
  }, [state, onUpdate]);

  // Handle discount type changes
  const [errorMessage, setErrorMessage] = useState('');

  const handleTabChange = useCallback((value) => {
    const newTab = parseInt(value);
    const updates = {
      selectedTab: newTab,
      announcement: newTab === DISCOUNT_TYPES.FREE_SHIPPING 
        ? `Add {{amount_left}} more to get free shipping` 
        : `Add {{amount_left}} more to get discount`,
      freeShipping: newTab === DISCOUNT_TYPES.FREE_SHIPPING // Set freeShipping based on selectedTab
    };

    // Handle free shipping logic
    if (newTab === DISCOUNT_TYPES.FREE_SHIPPING && isFreeShippingUsed) {
      setErrorMessage("Free shipping has already been used in another discount goal.");
      return; // Prevent selecting free shipping if already used elsewhere
    }

    if (newTab === DISCOUNT_TYPES.FREE_SHIPPING) {
      updates.freeShippingUsed = true; // Mark free shipping as used
      setErrorMessage(''); // Clear error message
    } else {
      updates.freeShippingUsed = false; // Reset freeShippingUsed for other discount types
      setErrorMessage(''); // Clear error message
    }

    handleUpdate(updates);
  }, [isFreeShippingUsed, handleUpdate]);

  // Render appropriate discount input field based on selected type
  const renderDiscountField = useCallback(() => {
    switch (state.selectedTab) {
      case DISCOUNT_TYPES.PERCENTAGE:
        return (
          <TextField
            label="Percentage Discount"
            type="number"
            value={state.percentageDiscount.toString()}
            onChange={(value) => handleUpdate({ percentageDiscount: parseFloat(value) || 0 })}
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
            onChange={(value) => handleUpdate({ fixedAmountDiscount: parseFloat(value) || 0 })}
            autoComplete="off"
            prefix="$"
          />
        );
      default:
        return null;
    }
  }, [state.selectedTab, state.percentageDiscount, state.fixedAmountDiscount, handleUpdate]);

  return (
    <Card>
      <BlockStack gap="400">
        {/* Discount Type Selector */}
        <Select
          label="Discount Type"
          options={DISCOUNT_OPTIONS.map(option => ({
            ...option,
            disabled: parseInt(option.value) === DISCOUNT_TYPES.FREE_SHIPPING && 
                     (state.freeShippingUsed || isFreeShippingUsed)
          }))}
          onChange={handleTabChange}
          value={state.selectedTab.toString()}
        />
        {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>} {/* Error message */}

        {/* Spending Goal Input */}
        <TextField
          label="Spending Goal"
          type="number"
          value={state.spendingGoal.toString()}
          onChange={(value) => handleUpdate({ spendingGoal: parseFloat(value) || 0 })}
          autoComplete="off"
        />

        {/* Announcement Message Input */}
        <TextField
          label="Announcement Message"
          value={state.announcement}
          onChange={(value) => handleUpdate({ announcement: value })}
          autoComplete="off"
          multiline
          helpText="{{amount_text}} will be replaced with the amount left"
        />

        {/* Dynamic Discount Input Field */}
        {renderDiscountField()}

        {/* Delete Button */}
        <Button destructive onClick={() => onDelete(id)}>
          Delete
        </Button>
      </BlockStack>
    </Card>
  );
}
