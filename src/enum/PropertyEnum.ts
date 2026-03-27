export const PropertyCategoryEnum = {
  Residential: 1,
  Commercial: 2,
  Land: 3,
} as const;

export const PropertyPurposeEnum = {
  Sell: 1,
  Rent: 2,
} as const;

export const FurnishingEnum = {
  Unfurnished: 1,
  Semi_Furnished: 2,
  Fully_Furnished: 3,
} as const;

export const PossessionStatusEnum = {
  Ready: 1,
  In_Progress: 2,
} as const;

export const CustomerShipEnum = {
  Running: 1,
  Vacant: 2,
} as const;

export const PropertyConditionEnum = {
  Well_Maintained: 1,
  Needs_Renovation: 2,
  Under_Renovation: 3,
} as const;

export const ZoneTypeEnum = {
  Residential: 1,
  Commercial: 2,
  Industrial: 3,
  IT: 4,
  Mixed: 5,
  Agricultural: 6,
} as const;

export const LocationHubEnum = {
  MainRoad: 1,
  InnerRoad: 2,
  Highway: 3,
  Mall: 4,
  CommercialComplex: 5,
  ItPark: 6,
  ResidentialArea: 7,
  IndustrialArea: 8,
  MarketArea: 9,
  BusinessDistrict: 10,
} as const;

export const PropertySortByEnum = {
  Popular: 1,
  Lowest_price: 2,
  Highest_price: 3,
  Newest: 4,
  Oldest: 5,
} as const;

export const SortDirectionEnum = {
  Ascending: 0,
  Descending: 1,
} as const;

export type TPropertyCategoryEnum = (typeof PropertyCategoryEnum)[keyof typeof PropertyCategoryEnum];
export type TPropertyPurposeEnum = (typeof PropertyPurposeEnum)[keyof typeof PropertyPurposeEnum];
export type TFurnishingEnum = (typeof FurnishingEnum)[keyof typeof FurnishingEnum];
export type TPossessionStatusEnum = (typeof PossessionStatusEnum)[keyof typeof PossessionStatusEnum];
export type TCustomerShipEnum = (typeof CustomerShipEnum)[keyof typeof CustomerShipEnum];
export type TPropertyConditionEnum = (typeof PropertyConditionEnum)[keyof typeof PropertyConditionEnum];
export type TZoneTypeEnum = (typeof ZoneTypeEnum)[keyof typeof ZoneTypeEnum];
export type TLocationHubEnum = (typeof LocationHubEnum)[keyof typeof LocationHubEnum];
export type TPropertySortByEnum = (typeof PropertySortByEnum)[keyof typeof PropertySortByEnum];
export type TSortDirectionEnum = (typeof SortDirectionEnum)[keyof typeof SortDirectionEnum];
