ALTER TABLE "Transaction"
ADD COLUMN "settlesTransactionId" TEXT;

CREATE UNIQUE INDEX "Transaction_settlesTransactionId_key"
ON "Transaction"("settlesTransactionId");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_settlesTransactionId_fkey"
FOREIGN KEY ("settlesTransactionId") REFERENCES "Transaction"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
