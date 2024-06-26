<script setup lang="ts">
import {
    computed, defineExpose, defineProps, nextTick, reactive,
} from 'vue';
import type { Location } from 'vue-router/types/router';

import {
    PProgressBar,
} from '@spaceone/design-system';

import { getPageStart } from '@cloudforet/core-lib/component-util/pagination';
import { QueryHelper } from '@cloudforet/core-lib/query';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import { store } from '@/store';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import type { Field, WidgetTableData } from '@/services/dashboards/widgets/_components/type';
import WidgetDataTable from '@/services/dashboards/widgets/_components/WidgetDataTable.vue';
import WidgetFrame from '@/services/dashboards/widgets/_components/WidgetFrame.vue';
import type { WidgetExpose, WidgetProps, WidgetEmit } from '@/services/dashboards/widgets/_configs/config';
import { COST_GROUP_BY } from '@/services/dashboards/widgets/_configs/config';
import { useWidgetLifecycle } from '@/services/dashboards/widgets/_hooks/use-widget-lifecycle';
import { useWidgetPagination } from '@/services/dashboards/widgets/_hooks/use-widget-pagination';
// eslint-disable-next-line import/no-cycle
import { useWidget } from '@/services/dashboards/widgets/_hooks/use-widget/use-widget';
import type { BudgetUsageAnalyzeResponse } from '@/services/dashboards/widgets/type';


interface Data {
    budget_id: string,
    name?: string;
    project_id?: string;
    project_group_id?: string;
    total_spent?: number;
    total_budget?: number;
    budget_usage?: number;
}
type Response = BudgetUsageAnalyzeResponse<Data>;

const budgetQueryHelper = new QueryHelper();
const props = defineProps<WidgetProps>();
const emit = defineEmits<WidgetEmit>();

const { widgetState, widgetFrameProps, widgetFrameEventHandlers } = useWidget(props, emit, {
    widgetLocation: computed<Location>(() => {
        const dataSourceId = widgetState.options.cost_data_source;
        return {
            name: COST_EXPLORER_ROUTE.BUDGET._NAME,
            params: {},
            query: {
                filters: budgetQueryHelper.setFilters([{ k: 'data_source_id', v: [dataSourceId], o: '=' }]).rawQueryStrings,
            },
        };
    }),
});
const state = reactive({
    loading: true,
    data: undefined as Response | undefined,
    tableFields: computed<Field[]>(() => [
        { label: 'Budget', name: 'name' },
        { label: 'Target', name: 'target', textOptions: { type: 'reference', referenceType: 'projectGroup' } },
        {
            label: 'Total spent', name: 'total_spent', textOptions: { type: 'cost' }, textAlign: 'right',
        },
        {
            label: 'Total budget', name: 'total_budget', textOptions: { type: 'cost' }, textAlign: 'right',
        },
        { label: ' ', name: 'progress' },
        {
            label: 'Rate', name: 'budget_usage', textOptions: { type: 'percent' }, textAlign: 'right',
        },
    ]),
    tableItems: computed<WidgetTableData[]>(() => state.data?.results?.map((d) => ({
        ...d,
        target: d.project_id ?? d.project_group_id,
        progress: d.budget_usage,
    })) ?? []),
});

const { pageSize, thisPage } = useWidgetPagination(widgetState);

/* Util */
const targetTextFormatter = (value: string): string => {
    const isProjectGroup = value.startsWith('pg-');
    if (isProjectGroup) return props.allReferenceTypeInfo.projectGroup.referenceMap[value].label ?? value;
    return props.allReferenceTypeInfo.project.referenceMap[value]?.label ?? value;
};

/* Api */
const apiQueryHelper = new ApiQueryHelper();
const fetchBudgetUsageAnalyze = getCancellableFetcher<Response>(SpaceConnector.clientV2.costAnalysis.budgetUsage.analyze);
const fetchData = async (): Promise<Response> => {
    try {
        apiQueryHelper.setFilters(widgetState.budgetConsoleFilters);
        if (pageSize.value) apiQueryHelper.setPage(getPageStart(thisPage.value, pageSize.value), pageSize.value);
        const { status, response } = await fetchBudgetUsageAnalyze({
            data_source_id: widgetState.options.cost_data_source,
            query: {
                granularity: widgetState.granularity,
                group_by: ['budget_id', 'name', COST_GROUP_BY.PROJECT_GROUP, COST_GROUP_BY.PROJECT],
                start: widgetState.dateRange.start,
                end: widgetState.dateRange.end,
                fields: {
                    total_spent: {
                        key: 'cost',
                        operator: 'sum',
                    },
                    total_budget: {
                        key: 'limit',
                        operator: 'sum',
                    },
                },
                select: {
                    budget_id: 'budget_id',
                    name: 'name',
                    [COST_GROUP_BY.PROJECT_GROUP]: COST_GROUP_BY.PROJECT_GROUP,
                    [COST_GROUP_BY.PROJECT]: COST_GROUP_BY.PROJECT,
                    total_spent: 'total_spent',
                    total_budget: 'total_budget',
                    budget_usage: {
                        operator: 'multiply',
                        fields: [
                            {
                                operator: 'divide',
                                fields: ['total_spent', 'total_budget'],
                            },
                            100,
                        ],
                    },
                },
                sort: [{ key: 'budget_usage', desc: true }],
                ...apiQueryHelper.data,
            },
        });
        if (status === 'succeed') return response;
    } catch (e) {
        ErrorHandler.handleError(e);
    }
    return { results: [], more: false };
};

const initWidget = async (data?: Response): Promise<Response> => {
    state.loading = true;
    state.data = data ?? await fetchData();
    state.loading = false;
    return state.data;
};
const refreshWidget = async (_thisPage = 1): Promise<Response> => {
    await nextTick();
    state.loading = true;
    thisPage.value = _thisPage;
    state.data = await fetchData();
    state.loading = false;
    return state.data;
};

/* Event */
const handleUpdateThisPage = (_thisPage: number) => {
    thisPage.value = _thisPage;
    refreshWidget(_thisPage);
};

(async () => {
    await Promise.allSettled([
        store.dispatch('reference/project/load'),
        store.dispatch('reference/projectGroup/load'),
    ]);
})();

useWidgetLifecycle({
    disposeWidget: undefined,
    initWidget,
    refreshWidget,
    props,
    emit,
    widgetState,
});

defineExpose<WidgetExpose<Response>>({
    initWidget,
    refreshWidget,
});
</script>

<template>
    <widget-frame v-bind="widgetFrameProps"
                  class="budget-usage-by-target"
                  v-on="widgetFrameEventHandlers"
    >
        <widget-data-table :loading="props.loading || state.loading"
                           :fields="state.tableFields"
                           :items="state.tableItems"
                           :currency="widgetState.currency"
                           @update:thisPage="handleUpdateThisPage"
        >
            <template #col-target="{value}">
                {{ targetTextFormatter(value) }}
            </template>
            <template #col-progress="{value}">
                <p-progress-bar size="lg"
                                :percentage="value"
                />
            </template>
        </widget-data-table>
    </widget-frame>
</template>

<style lang="postcss" scoped>
.budget-usage-by-target {
    .widget-data-table {
        width: 100%;
        height: 100%;
    }
    &.full {
        .widget-data-table {
            height: auto;
        }
    }
}
</style>
