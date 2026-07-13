export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type EntityId<TEntity extends string> = Brand<string, `${TEntity}Id`>;
export type IsoDateTimeString = Brand<string, "IsoDateTimeString">;
export type NewYorkDateString = Brand<string, "NewYorkDateString">;
export type CurrencyCode = Brand<string, "CurrencyCode">;
export type MinorUnitAmount = Brand<bigint, "MinorUnitAmount">;
export type MicroMinorUnitAmount = Brand<bigint, "MicroMinorUnitAmount">;
export type BasisPoints = Brand<number, "BasisPoints">;
