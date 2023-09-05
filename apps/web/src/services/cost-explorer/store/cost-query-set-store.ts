import { defineStore } from 'pinia';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { store } from '@/store';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { managedCostQuerySets } from '@/services/cost-explorer/cost-analysis/config';
import type { DataSourceModel } from '@/services/cost-explorer/model';
import type { CostQuerySetModel } from '@/services/cost-explorer/type';

interface CostAnalysisLNBState {
    costQuerySetList: CostQuerySetModel[];
    dataSourceList: DataSourceModel[];
    selectedQuerySetId?: string;
    selectedDataSourceId?: string;
}

export const useCostQuerySetStore = defineStore('cost-query-set', {
    state: (): CostAnalysisLNBState => ({
        costQuerySetList: [],
        dataSourceList: [],
        selectedQuerySetId: undefined,
        selectedDataSourceId: undefined,
    }),
    getters: {
        selectedQuerySet: (state): CostQuerySetModel|undefined => {
            if (!state.selectedQuerySetId) return undefined;
            return state.costQuerySetList.find((item) => item.cost_query_set_id === state.selectedQuerySetId);
        },
    },
    actions: {
        async listDataSources(): Promise<void> {
            try {
                const { results } = await SpaceConnector.clientV2.costAnalysis.dataSource.list();
                this.dataSourceList = results;
            } catch (e) {
                ErrorHandler.handleError(e);
                this.dataSourceList = [];
            }
        },
        async listCostQuerySets(): Promise<void> {
            try {
                // TODO: apply v2
                const { results } = await SpaceConnector.client.costAnalysis.costQuerySet.list({
                    data_source_id: this.selectedDataSourceId,
                    query: {
                        filter: [{ k: 'user_id', v: store.state.user.userId, o: 'eq' }],
                    },
                });
                this.costQuerySetList = [...managedCostQuerySets, ...results];
            } catch (e) {
                ErrorHandler.handleError(e);
                this.costQuerySetList = [...managedCostQuerySets];
            }
        },
    },
});
