import { Getter } from 'vuex';
import { CostAnalysisStoreState, CostQueryFilterItemsMap } from '@/services/billing/cost-management/cost-analysis/store/type';
import { ResourceItem } from '@/store/modules/resource/type';

export const filterItemsMap: Getter<CostAnalysisStoreState, any> = ({ filters }, getters, rootState): CostQueryFilterItemsMap => {
    const itemsMap: CostQueryFilterItemsMap = {};
    const resourceItemsMap = {
        project_id: rootState.resource.project.items,
        service_account_id: rootState.resource.serviceAccount.items,
        provider: rootState.resource.provider.items,
        region_code: rootState.resource.region.items,
    };

    Object.entries(filters).forEach(([key, data]) => {
        const resourceItems = resourceItemsMap[key];
        if (resourceItems) {
            itemsMap[key] = data?.map((d) => {
                const resourceItem: ResourceItem = resourceItems[d];
                return { name: d, label: resourceItem?.label ?? d };
            });
        } else itemsMap[key] = data?.map(d => ({ name: d, label: d }));
    });
    return itemsMap;
};