import { GRANULARITY } from '@/services/dashboards/config';
import type { WidgetConfig } from '@/services/dashboards/widgets/_configs/config';
import {
    getWidgetFilterOptionsSchema,
    getWidgetFilterSchemaPropertyNames,
    getWidgetInheritOptions,
    getWidgetInheritOptionsForFilter,
    getWidgetOptionsSchema,
} from '@/services/dashboards/widgets/_helpers/widget-schema-helper';

const budgetUsageByTargetWidgetConfig: WidgetConfig = {
    widget_config_id: 'budgetUsageByTarget',
    title: 'Budget Usage by Target',
    widget_component: () => ({
        component: import('@/services/dashboards/widgets/cost-widgets/budget-usage-by-target/BudgetUsageByTargetWidget.vue'),
    }),
    labels: ['Cost'],
    description: {
        translation_id: 'DASHBOARDS.WIDGET.BUDGET_USAGE_WITH_FORECAST.DESC',
        preview_image: 'widget-img_budgetUsageWithForecast--thumbnail.png',
    },
    scopes: ['PROJECT', 'WORKSPACE'],
    theme: {
        inherit: false,
    },
    sizes: ['lg', 'full'],
    options: {
        granularity: GRANULARITY.MONTHLY,
        cost_group_by: 'budget_id',
    },
    inherit_options: {
        ...getWidgetInheritOptions('cost_data_source'),
        ...getWidgetInheritOptionsForFilter(
            'project',
            'cost_product',
        ),
    },
    options_schema: {
        default_properties: [
            'cost_data_source',
            ...getWidgetFilterSchemaPropertyNames(
                'project',
                'service_account',
            ),
        ],
        fixed_properties: ['cost_data_source'],
        schema: {
            type: 'object',
            properties: {
                ...getWidgetOptionsSchema('cost_data_source'),
                ...getWidgetFilterOptionsSchema(
                    'project',
                    'service_account',
                ),
            },
            order: [
                'cost_data_source',
                ...getWidgetFilterSchemaPropertyNames(
                    'project',
                    'service_account',
                ),
            ],
        },
    },
} as WidgetConfig;

export default budgetUsageByTargetWidgetConfig;
