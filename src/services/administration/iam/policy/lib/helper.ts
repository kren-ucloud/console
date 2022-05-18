import { PolicyTypes, POLICY_TYPES } from '@/services/administration/iam/policy/lib/config';
import { KeyDataType, ValueHandler, ValueItem } from '@spaceone/console-core-lib/component-util/query-search/type';
import { PolicyDataModel } from '@/services/administration/iam/policy/lib/type';
import { TimeStamp } from '@/models';
import { iso8601Formatter } from '@spaceone/console-core-lib';

export const policyTypeBadgeColorFormatter = (policyType: PolicyTypes) => {
    switch (policyType) {
    case POLICY_TYPES.MANAGED: return 'gray';
    case POLICY_TYPES.CUSTOM: return 'primary1';
    default: return '';
    }
};

export const policyTypeURIFormatter = (policyType: PolicyTypes) => {
    switch (policyType) {
    case POLICY_TYPES.MANAGED: return 'repository';
    case POLICY_TYPES.CUSTOM: return 'identity';
    default: return '';
    }
};

export const policyCreatedAtFormatter = (createdAt: TimeStamp, selectedPolicyType: PolicyTypes, timezone: string): string => {
    if (selectedPolicyType === POLICY_TYPES.MANAGED) return '--';
    return iso8601Formatter(createdAt.toString(), timezone, 'YYYY-MM-DD hh:mm:ss');
};

export const makeCustomValueHandler = (policyList: PolicyDataModel[], distinct: string, dataType?: KeyDataType): ValueHandler|undefined => {
    if (['datetime', 'boolean'].includes(dataType || '')) return undefined;

    const allItemSet = new Set<string>();
    policyList.forEach((d) => {
        allItemSet.add(d[distinct]);
    });
    const allItems: ValueItem[] = Array.from(allItemSet).map(d => ({ name: d, label: d }));

    return async (inputText: string) => {
        let res: ValueItem[] = [...allItems];
        if (inputText) {
            const regex = RegExp(inputText, 'i');
            res = allItems.reduce((result, d) => {
                if (regex.test(d.label) || regex.test(d.name)) result.push(d);
                return result;
            }, [] as ValueItem[]);
        }
        const totalCount = res.length;

        return {
            results: res,
            totalCount,
        };
    };
};