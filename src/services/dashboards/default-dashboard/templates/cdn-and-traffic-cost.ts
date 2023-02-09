import type { DashboardConfig } from '@/services/dashboards/config';
import type { DefaultDashboardPreviewConfig } from '@/services/dashboards/default-dashboard/config';
import { getDashboardLayoutWidgetInfoList } from '@/services/dashboards/default-dashboard/helper';
import type { WidgetCustomTitleMap } from '@/services/dashboards/default-dashboard/templates/type';

const widgetList = [
    'awsDataTransferCostTrend',
    'awsDataTransferByRegion',
    'awsCloudFrontCost',
];

export const cdnAndTrafficCostDashboardPreview: DefaultDashboardPreviewConfig = {
    name: 'CDN & Traffic Cost',
    labels: ['Cost'],
    version: '1',
    description: {
        icon: 'ic_dashboard-template_cdn-traffic-cost',
        preview_image: 'cdnAndTrafficCost',
    },
};

const widgetCustomTitleMap: WidgetCustomTitleMap = {
    awsCloudFrontCost: 'AWS CloudFront Cost by Project',
};

export const cdnAndTrafficCostDashboard: DashboardConfig = {
    ...cdnAndTrafficCostDashboardPreview,
    settings: {
        date_range: {
            enabled: true,
        },
        currency: {
            enabled: true,
        },
        refresh_interval_option: '5m',
    },
    variables_schema: {
        properties: {},
        order: [],
    },
    variables: {},
    layouts: [
        getDashboardLayoutWidgetInfoList(widgetList, widgetCustomTitleMap),
    ],
};
