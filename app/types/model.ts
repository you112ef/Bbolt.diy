export type ProviderInfo = import('~/lib/modules/llm/types').ProviderInfo;

export type UIProviderInfoLite = Pick<
  ProviderInfo,
  'name' | 'staticModels' | 'getApiKeyLink' | 'labelForGetApiKey' | 'icon'
>;

export interface IProviderSetting {
  enabled?: boolean;
  baseUrl?: string;
}

export type IProviderConfig = UIProviderInfoLite & {
  settings: IProviderSetting;
};
