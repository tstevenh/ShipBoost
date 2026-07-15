-- DailyOutreachDiscount: one shared Premium Launch discount code per UTC day.
CREATE TABLE IF NOT EXISTS "DailyOutreachDiscount" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "code" TEXT NOT NULL,
  "dodoDiscountId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "displayDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyOutreachDiscount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyOutreachDiscount_date_key" ON "DailyOutreachDiscount"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyOutreachDiscount_code_key" ON "DailyOutreachDiscount"("code");
