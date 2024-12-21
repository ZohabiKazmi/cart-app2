-- CreateTable
CREATE TABLE "SpendingGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spendingGoal" REAL NOT NULL,
    "announcement" TEXT NOT NULL,
    "selectedTab" INTEGER NOT NULL,
    "freeShipping" TEXT,
    "percentageDiscount" REAL,
    "fixedAmountDiscount" REAL
);
