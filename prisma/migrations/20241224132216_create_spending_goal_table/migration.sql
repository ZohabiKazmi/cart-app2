-- CreateTable
CREATE TABLE "SpendingGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "spendingGoal" REAL NOT NULL,
    "announcement" TEXT,
    "selectedTab" INTEGER NOT NULL,
    "freeShipping" BOOLEAN,
    "percentageDiscount" REAL,
    "fixedAmountDiscount" REAL,
    "shopifyDiscountId" TEXT
);
