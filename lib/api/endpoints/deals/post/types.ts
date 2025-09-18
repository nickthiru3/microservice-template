// Types and interfaces for Deals POST handler

export type TDealCategory =
  | "foodDrink"
  | "bathroom"
  | "jewelery"
  | "sports"
  | "tech"
  | "auto"
  | "entertainment"
  | "travel";

export interface IDealEntity {
  PK: string;
  SK: string;
  EntityType: "Deal";
  Id: string; // dealId
  Title: string;
  OriginalPrice: number;
  Discount: number; // percentage 0-100
  Category: TDealCategory;
  Expiration: string; // ISO 8601
  MerchantId: string; // userId of merchant
  LogoFileKey: string;
  CreatedAt: string; // ISO 8601
}

export type TCreateDealPayload = {
  userId: string;
  title: string;
  originalPrice: number | string;
  discount: number | string;
  category: TDealCategory;
  expiration: string; // ISO
  logoFileKey: string;
  dealId?: string;
};

export type TResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: import("#src/helpers/api").TApiResponse };
