import { TranslateResult } from 'vue-i18n';

export interface IFilterOptions {
  name: TranslateResult;
  rotated?: boolean; // undefined means that user won't be able to change order
}
export type IFilters<T extends string = string> = Record<T, IFilterOptions>;
export interface IFilterInputPayload<T extends string = string> extends Omit<IFilterOptions, 'name'> {
  key: T;
}
