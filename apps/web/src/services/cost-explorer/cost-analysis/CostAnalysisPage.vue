<script lang="ts" setup>
import {
    onUnmounted, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router/composables';

import {
    queryStringToArray,
    queryStringToObject,
    queryStringToString,
} from '@/lib/router-query-string';

import { DYNAMIC_COST_QUERY_SET_PARAMS } from '@/services/cost-explorer/cost-analysis/config';
import CostAnalysisChart from '@/services/cost-explorer/cost-analysis/modules/CostAnalysisChart.vue';
import CostAnalysisDataTable from '@/services/cost-explorer/cost-analysis/modules/CostAnalysisDataTable.vue';
import CostAnalysisGroupByFilter from '@/services/cost-explorer/cost-analysis/modules/CostAnalysisGroupByFilter.vue';
import CostAnalysisHeader from '@/services/cost-explorer/cost-analysis/modules/CostAnalysisHeader.vue';
import CostAnalysisQueryFilter from '@/services/cost-explorer/cost-analysis/modules/CostAnalysisQueryFilter.vue';
import type { CostAnalysisPageUrlQuery } from '@/services/cost-explorer/cost-analysis/type';
import { useCostAnalysisPageStore } from '@/services/cost-explorer/store/cost-analysis-page-store';
import type {
    CostQuerySetModel, Granularity,
} from '@/services/cost-explorer/type';


const route = useRoute();
const router = useRouter();

const costAnalysisPageStore = useCostAnalysisPageStore();

/* util */
const getQueryOptionsFromUrlQuery = (urlQuery: CostAnalysisPageUrlQuery): CostQuerySetModel['options'] => ({
    granularity: queryStringToString(urlQuery.granularity) as Granularity,
    group_by: queryStringToArray(urlQuery.group_by),
    period: queryStringToObject(urlQuery.period),
    filters: queryStringToObject(urlQuery.filters),
});

onUnmounted(() => {
    costAnalysisPageStore.$dispose();
    costAnalysisPageStore.$reset();
});

watch(() => costAnalysisPageStore.selectedQuerySet, async (selectedQuerySet) => {
    if (selectedQuerySet) {
        await costAnalysisPageStore.setQueryOptions(selectedQuerySet.options);
    } else if (route.params.costQuerySetId === DYNAMIC_COST_QUERY_SET_PARAMS) {
        const currentQuery = router.currentRoute.query;
        const costQuerySetOptions = getQueryOptionsFromUrlQuery(currentQuery);
        await costAnalysisPageStore.setQueryOptions(costQuerySetOptions);
    } else {
        await costAnalysisPageStore.setQueryOptions();
    }
}, { immediate: true });
</script>

<template>
    <div class="cost-analysis-page">
        <cost-analysis-header />
        <div class="content-wrapper">
            <div class="overflow-wrapper">
                <cost-analysis-query-filter />
                <div class="contents-wrapper">
                    <cost-analysis-group-by-filter />
                    <cost-analysis-chart />
                    <cost-analysis-data-table />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.cost-analysis-page {
    .content-wrapper {
        overflow-x: auto;
        padding-bottom: 1.625rem;
        .overflow-wrapper {
            min-width: 50rem;
            .contents-wrapper {
                @apply bg-white rounded-md border border-gray-200;
                padding: 0 1rem 2.5rem 1rem;
            }
        }
    }
}
</style>
