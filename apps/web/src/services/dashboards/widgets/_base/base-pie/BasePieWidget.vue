<script setup lang="ts">
import {
    computed,
    defineExpose,
    defineProps, nextTick, reactive, ref, toRef,
} from 'vue';
import type { Location } from 'vue-router/types/router';

import { color } from '@amcharts/amcharts5';
import { PDataLoader, PSkeleton } from '@spaceone/design-system';

import { getPageStart } from '@cloudforet/core-lib/component-util/pagination';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import type { ReferenceType } from '@/store/reference/all-reference-store';

import { arrayToQueryString, objectToQueryString, primitiveToQueryString } from '@/lib/router-query-string';

import { useAmcharts5 } from '@/common/composables/amcharts5';
import ErrorHandler from '@/common/composables/error/errorHandler';

import { gray } from '@/styles/colors';

import { DYNAMIC_COST_QUERY_SET_PARAMS } from '@/services/cost-explorer/cost-analysis/config';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import type { Field } from '@/services/dashboards/widgets/_components/type';
import WidgetDataTable from '@/services/dashboards/widgets/_components/WidgetDataTable.vue';
import WidgetFrame from '@/services/dashboards/widgets/_components/WidgetFrame.vue';
import { CHART_TYPE, GRANULARITY } from '@/services/dashboards/widgets/_configs/config';
import type { WidgetExpose, WidgetProps, WidgetEmit } from '@/services/dashboards/widgets/_configs/config';
import { COST_GROUP_BY_ITEM_MAP } from '@/services/dashboards/widgets/_configs/view-config';
import {
    getPieChartLegends, getRefinedPieChartData,
} from '@/services/dashboards/widgets/_helpers/widget-chart-helper';
import { getWidgetLocationFilters } from '@/services/dashboards/widgets/_helpers/widget-location-helper';
import { getReferenceTypeOfGroupBy } from '@/services/dashboards/widgets/_helpers/widget-table-helper';
import { useWidgetColorSet } from '@/services/dashboards/widgets/_hooks/use-widget-color-set';
import { useWidgetLifecycle } from '@/services/dashboards/widgets/_hooks/use-widget-lifecycle';
import { useWidgetPagination } from '@/services/dashboards/widgets/_hooks/use-widget-pagination';
// eslint-disable-next-line import/no-cycle
import { useWidget } from '@/services/dashboards/widgets/_hooks/use-widget/use-widget';
import type { Legend, CostAnalyzeResponse } from '@/services/dashboards/widgets/type';

interface Data {
    cost_sum?: Array<{
        [field_group: string]: any;
        value: number
    }>
    _total_cost_sum?: number;
}
type FullData = CostAnalyzeResponse<Data>;
interface ChartData extends Data {
    [groupBy: string]: string | any;
}

const chartContext = ref<HTMLElement|null>(null);
const chartHelper = useAmcharts5(chartContext);

const props = defineProps<WidgetProps>();
const emit = defineEmits<WidgetEmit>();

const { colorSet } = useWidgetColorSet({
    theme: toRef(props, 'theme'),
    dataSize: computed(() => state.chartData?.length ?? 0),
});

const { widgetState, widgetFrameProps, widgetFrameEventHandlers } = useWidget(props, emit, {
    widgetLocation: computed<Location>(() => ({
        name: COST_EXPLORER_ROUTE.COST_ANALYSIS.QUERY_SET._NAME,
        params: {
            dataSourceId: widgetState.options.cost_data_source,
            costQuerySetId: DYNAMIC_COST_QUERY_SET_PARAMS,
        },
        query: {
            granularity: primitiveToQueryString(GRANULARITY.DAILY),
            group_by: arrayToQueryString([widgetState.groupBy]),
            period: objectToQueryString(widgetState.dateRange),
            filters: arrayToQueryString(getWidgetLocationFilters(widgetState.options.filters)),
        },
    })),
});

const { pageSize, thisPage } = useWidgetPagination(widgetState);

const state = reactive({
    loading: true,
    data: null as FullData|null,
    chart: null as null|ReturnType<typeof chartHelper.createPieChart | typeof chartHelper.createDonutChart>,
    series: null as null|ReturnType<typeof chartHelper.createPieSeries>,
    chartData: computed<ChartData[]>(() => {
        if (!state.data?.results?.length) return [];
        return getRefinedPieChartData(state.data.results, widgetState.groupBy, props.allReferenceTypeInfo);
    }),
    tableFields: computed<Field[]>(() => {
        if (!widgetState.groupBy) return [];
        const groupByLabel = COST_GROUP_BY_ITEM_MAP[widgetState.groupBy]?.label ?? widgetState.groupBy;
        const referenceType = getReferenceTypeOfGroupBy(props.allReferenceTypeInfo, widgetState.groupBy) as ReferenceType;
        return [
            {
                name: widgetState.groupBy,
                label: groupByLabel,
                textOptions: { type: 'reference', referenceType },
            },
            {
                label: 'Cost',
                name: 'cost_sum',
                textOptions: { type: 'cost' },
                textAlign: 'right',
            },
        ];
    }),
    legends: [] as Legend[],
});

/* Api */
const apiQueryHelper = new ApiQueryHelper();
const fetchCostAnalyze = getCancellableFetcher<FullData>(SpaceConnector.clientV2.costAnalysis.cost.analyze);
const fetchData = async (): Promise<FullData> => {
    try {
        apiQueryHelper.setFilters(widgetState.consoleFilters);
        if (pageSize.value) apiQueryHelper.setPage(getPageStart(thisPage.value, pageSize.value), pageSize.value);
        const { status, response } = await fetchCostAnalyze({
            data_source_id: widgetState.options.cost_data_source,
            query: {
                granularity: widgetState.granularity,
                group_by: [widgetState.groupBy],
                start: widgetState.dateRange.start,
                end: widgetState.dateRange.end,
                fields: {
                    cost_sum: {
                        key: 'cost',
                        operator: 'sum',
                    },
                },
                sort: [{ key: 'cost_sum', desc: true }],
                ...apiQueryHelper.data,
            },
        });
        if (status === 'succeed') {
            return response;
        }
        return { results: [], more: false };
    } catch (e) {
        ErrorHandler.handleError(e);
        return { results: [], more: false };
    }
};

const drawChart = (chartData: ChartData[]) => {
    let chart;
    if (widgetState.chartType === CHART_TYPE.DONUT) chart = chartHelper.createDonutChart();
    else chart = chartHelper.createPieChart();
    const seriesSettings = {
        categoryField: widgetState.groupBy,
        valueField: 'cost_sum',
    };
    const series = chartHelper.createPieSeries(seriesSettings);
    series.labels.template.set('forceHidden', true);
    series.ticks.template.set('forceHidden', true);
    chart.series.push(series);
    chartHelper.setChartColors(chart, colorSet.value);

    if (chartData.some((d) => d.cost_sum && d.cost_sum > 0)) {
        const tooltip = chartHelper.createTooltip();
        chartHelper.setPieTooltipText(series, tooltip, widgetState.currency);
        series.slices.template.set('tooltip', tooltip);
        series.data.setAll(chartData);
    } else {
        series.data.setAll([{
            cost_sum: 1,
        }]);
        series.slices.template.setAll({
            fill: color(gray[200]),
            strokeOpacity: 0,
            forceInactive: true,
        });
    }

    state.chart = chart;
    state.series = series;
};

const initWidget = async (data?: FullData): Promise<FullData> => {
    state.loading = true;
    state.data = data ?? await fetchData();
    state.legends = getPieChartLegends(state.data.results, widgetState.groupBy);
    await nextTick();
    if (chartHelper.root.value) drawChart(state.chartData);
    state.loading = false;
    return state.data;
};

const refreshWidget = async (_thisPage = 1): Promise<FullData> => {
    await nextTick();
    state.loading = true;
    thisPage.value = _thisPage;
    state.data = await fetchData();
    state.legends = getPieChartLegends(state.data.results, widgetState.groupBy);
    chartHelper.refreshRoot();
    await nextTick();
    if (chartHelper.root.value) drawChart(state.chartData);
    state.loading = false;
    return state.data;
};

/* Event */
const handleToggleLegend = (index) => {
    chartHelper.toggleSeries(state.chart, index);
};
const handleUpdateThisPage = (_thisPage: number) => {
    thisPage.value = _thisPage;
    state.data = undefined;
    refreshWidget(_thisPage);
};

useWidgetLifecycle({
    disposeWidget: chartHelper.disposeRoot,
    initWidget,
    refreshWidget,
    props,
    emit,
    widgetState,
    onCurrencyUpdate: async () => {
        if (!state.data) return;
        state.legends = getPieChartLegends(state.data.results, widgetState.groupBy);
        chartHelper.refreshRoot();
        await nextTick();
        if (chartHelper.root.value) drawChart(state.chartData);
    },
});

defineExpose<WidgetExpose<FullData>>({
    initWidget,
    refreshWidget,
});
</script>

<template>
    <widget-frame v-bind="widgetFrameProps"
                  class="base-pie-widget"
                  v-on="widgetFrameEventHandlers"
    >
        <div class="data-container">
            <div class="chart-wrapper">
                <p-data-loader class="chart-loader"
                               :loading="props.loading || state.loading"
                               :data="state.data"
                               loader-type="skeleton"
                               :loader-backdrop-opacity="1"
                               show-data-from-scratch
                >
                    <div ref="chartContext"
                         class="chart"
                    />
                    <template #loader>
                        <p-skeleton width="155px"
                                    height="155px"
                        />
                    </template>
                </p-data-loader>
            </div>
            <widget-data-table :loading="props.loading || state.loading"
                               :fields="state.tableFields"
                               :items="state.data ? state.data.results: []"
                               :legends.sync="state.legends"
                               :currency="widgetState.currency"
                               :this-page="thisPage"
                               :show-next-page="state.data ? state.data.more: false"
                               :color-set="colorSet"
                               :all-reference-type-info="props.allReferenceTypeInfo"
                               show-legend
                               @toggle-legend="handleToggleLegend"
                               @update:thisPage="handleUpdateThisPage"
            />
        </div>
    </widget-frame>
</template>

<style scoped lang="postcss">
.base-pie-widget {
    .data-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .chart-wrapper {
        height: 155px;
        margin-bottom: 1rem;
        .chart {
            height: 100%;
        }
    }
    .chart-loader {
        height: 100%;
    }
    .widget-data-table {
        flex-grow: 1;
    }
    &.full {
        .widget-data-table {
            height: auto;
        }
    }
}
</style>
