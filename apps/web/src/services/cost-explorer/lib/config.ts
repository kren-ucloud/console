export const GRANULARITY = {
    DAILY: 'DAILY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
} as const;

export const GROUP_BY = {
    PROJECT_GROUP: 'project_group_id',
    PROJECT: 'project_id',
    PROVIDER: 'provider',
    SERVICE_ACCOUNT: 'service_account_id',
    PRODUCT: 'product',
    REGION: 'region_code',
    USAGE_TYPE: 'usage_type',
} as const;

export const ADDITIONAL_GROUP_BY = {
    TAGS: 'tags',
    ADDITIONAL_INFO: 'additional_info',
};

export const ADDITIONAL_GROUP_BY_ITEM_MAP = {
    [ADDITIONAL_GROUP_BY.TAGS]: { name: ADDITIONAL_GROUP_BY.TAGS, label: 'Tags' },
    [ADDITIONAL_GROUP_BY.ADDITIONAL_INFO]: { name: ADDITIONAL_GROUP_BY.ADDITIONAL_INFO, label: 'Additional Info' },
} as const;

export const GROUP_BY_ITEM_MAP = {
    [GROUP_BY.PROJECT_GROUP]: { name: GROUP_BY.PROJECT_GROUP, label: 'Project Group' },
    [GROUP_BY.PROJECT]: { name: GROUP_BY.PROJECT, label: 'Project' },
    [GROUP_BY.PROVIDER]: { name: GROUP_BY.PROVIDER, label: 'Provider' },
    [GROUP_BY.SERVICE_ACCOUNT]: { name: GROUP_BY.SERVICE_ACCOUNT, label: 'Service Account' },
    [GROUP_BY.PRODUCT]: { name: GROUP_BY.PRODUCT, label: 'Product' },
    [GROUP_BY.REGION]: { name: GROUP_BY.REGION, label: 'Region' },
    [GROUP_BY.USAGE_TYPE]: { name: GROUP_BY.USAGE_TYPE, label: 'Usage Type' },
} as const;

export const ADDITIONAL_FILTER = {
    TAGS: 'tags',
    ADDITIONAL_INFO: 'additional_info',
};
export const FILTER = {
    ...GROUP_BY,
    ...ADDITIONAL_FILTER,
} as const;

export const USAGE_TYPE_ADDITIONAL_FILTER_MAP = {
    cost: 'cost',
    usage: 'usage',
} as const;
export type UsageTypeAdditionalFilter = typeof USAGE_TYPE_ADDITIONAL_FILTER_MAP[keyof typeof USAGE_TYPE_ADDITIONAL_FILTER_MAP];
