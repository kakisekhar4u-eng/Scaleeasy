-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('draft', 'reviewed', 'verified');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('new_enquiry', 'consultant_assigned', 'contact_attempted', 'requirement_confirmed', 'quote_in_preparation', 'quote_sent', 'follow_up', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "CRMDeliveryStatus" AS ENUM ('disabled', 'pending', 'submitted', 'failed', 'manual_intervention');

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'draft',
    "profile" JSONB NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationMonth" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "seasonScore" INTEGER NOT NULL,
    "seasonLabel" TEXT NOT NULL,
    "rainfall" TEXT NOT NULL,
    "humidity" TEXT NOT NULL,
    "crowdLevel" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,

    CONSTRAINT "DestinationMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationSource" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "reliability" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'klar-concierge',
    "stage" "LeadStage" NOT NULL DEFAULT 'new_enquiry',
    "priority" "LeadPriority" NOT NULL DEFAULT 'medium',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "preferredContactChannel" TEXT NOT NULL,
    "preferredContactTime" TEXT,
    "additionalNotes" TEXT,
    "consent" BOOLEAN NOT NULL,
    "consentTimestamp" TIMESTAMP(3) NOT NULL,
    "tripBrief" JSONB NOT NULL,
    "transcript" JSONB NOT NULL,
    "selectedConceptId" TEXT,
    "selectedDestinationSlug" TEXT,
    "selectedDirection" TEXT,
    "itinerary" JSONB NOT NULL,
    "leadScore" INTEGER NOT NULL,
    "leadScoreReasons" JSONB NOT NULL,
    "crmStatus" "CRMDeliveryStatus" NOT NULL DEFAULT 'disabled',
    "crmProvider" TEXT NOT NULL DEFAULT 'placeholder',
    "crmAttempts" INTEGER NOT NULL DEFAULT 0,
    "crmReferenceId" TEXT,
    "crmLastError" TEXT,
    "crmLastAttempt" TIMESTAMP(3),
    "crmNextRetryAt" TIMESTAMP(3),
    "consultantOwner" TEXT,
    "followUpDueAt" TIMESTAMP(3),
    "conversationSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadRecommendation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "destinationSlug" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "score" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "tradeOff" TEXT NOT NULL,

    CONSTRAINT "LeadRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadItineraryDay" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "pace" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "notes" JSONB NOT NULL,

    CONSTRAINT "LeadItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Klar team',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "consultantName" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "props" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_status_idx" ON "Destination"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationMonth_destinationId_month_key" ON "DestinationMonth"("destinationId", "month");

-- CreateIndex
CREATE INDEX "DestinationSource_destinationId_idx" ON "DestinationSource"("destinationId");

-- CreateIndex
CREATE INDEX "ConversationMessage_sessionId_idx" ON "ConversationMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");

-- CreateIndex
CREATE INDEX "Lead_crmStatus_idx" ON "Lead"("crmStatus");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "LeadRecommendation_leadId_idx" ON "LeadRecommendation"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadItineraryDay_leadId_day_key" ON "LeadItineraryDay"("leadId", "day");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_idx" ON "LeadAssignment"("leadId");

-- CreateIndex
CREATE INDEX "CRMDeliveryAttempt_leadId_idx" ON "CRMDeliveryAttempt"("leadId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AuditRecord_action_createdAt_idx" ON "AuditRecord"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "DestinationMonth" ADD CONSTRAINT "DestinationMonth_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationSource" ADD CONSTRAINT "DestinationSource_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_conversationSessionId_fkey" FOREIGN KEY ("conversationSessionId") REFERENCES "ConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadRecommendation" ADD CONSTRAINT "LeadRecommendation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadItineraryDay" ADD CONSTRAINT "LeadItineraryDay_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMDeliveryAttempt" ADD CONSTRAINT "CRMDeliveryAttempt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

