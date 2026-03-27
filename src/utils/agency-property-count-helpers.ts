import type mongoose from "mongoose";
import { AgencyModel } from "@/database/models/AgencyModel";
import { PropertyPurposeEnum } from "@/enum/PropertyEnum";
import logger from "@/utils/logger";

/**
 * Increment agency property count based on property purpose
 * Only updates counts for agency-owned properties that are active (verified + enabled)
 */
export const incrementAgencyPropertyCount = async (agencyId: mongoose.Types.ObjectId, propertyPurpose: number, session?: mongoose.ClientSession): Promise<void> => {
  const updateField = propertyPurpose === PropertyPurposeEnum.Sell ? "activeSalePropertiesCount" : "activeRentPropertiesCount";

  await AgencyModel.updateOne({ _id: agencyId }, { $inc: { [updateField]: 1 } }, { session });
};

/**
 * Decrement agency property count based on property purpose
 * Only decrements counts for agency-owned properties that were active
 * Prevents count from going below zero by checking if count > 0 before decrementing
 */
export const decrementAgencyPropertyCount = async (agencyId: mongoose.Types.ObjectId, propertyPurpose: number, session?: mongoose.ClientSession): Promise<void> => {
  const updateField = propertyPurpose === PropertyPurposeEnum.Sell ? "activeSalePropertiesCount" : "activeRentPropertiesCount";

  // Only decrement if the count is greater than 0 to prevent negative values
  const result = await AgencyModel.updateOne(
    { 
      _id: agencyId,
      [updateField]: { $gt: 0 }
    }, 
    { $inc: { [updateField]: -1 } }, 
    { session }
  );

  // Log warning if decrement was skipped due to count already being 0
  if (result.matchedCount === 0 || result.modifiedCount === 0) {
    logger.warn(`Skipped decrement for agency ${agencyId.toString()}: ${updateField} was already 0 or agency not found`);
  }
};
