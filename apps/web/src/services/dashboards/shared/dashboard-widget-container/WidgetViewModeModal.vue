<script setup lang="ts">
import type { AsyncComponent, ComponentPublicInstance } from 'vue';
import {
    computed, reactive, toRef, watch,
} from 'vue';

import {
    PButton, PBadge, PI,
} from '@spaceone/design-system';
import { cloneDeep } from 'lodash';

import type { AllReferenceTypeInfo } from '@/store/reference/all-reference-store';
import { useAllReferenceStore } from '@/store/reference/all-reference-store';

import { useManagePermissionState } from '@/common/composables/page-manage-permission';

import { gray } from '@/styles/colors';

import type { DashboardSettings, DashboardVariables, DashboardVariablesSchema } from '@/services/dashboards/config';
import DashboardToolset from '@/services/dashboards/shared/dashboard-toolset/DashboardToolset.vue';
import DashboardVariablesSelectDropdown
    from '@/services/dashboards/shared/dashboard-variables/DashboardVariablesSelectDropdown.vue';
import WidgetViewModeSidebar from '@/services/dashboards/shared/dashboard-widget-container/WidgetViewModeSidebar.vue';
import { useDashboardDetailInfoStore } from '@/services/dashboards/store/dashboard-detail-info';
import type {
    DashboardLayoutWidgetInfo, WidgetExpose, WidgetProps,
    WidgetSize,
    UpdatableWidgetInfo,
} from '@/services/dashboards/widgets/_configs/config';
import type { WidgetTheme } from '@/services/dashboards/widgets/_configs/view-config';
import { getWidgetComponent } from '@/services/dashboards/widgets/_helpers/widget-helper';


interface WidgetViewModeModalProps {
    visible: boolean;
    widgetKey?: string;
    size?: WidgetSize;
    theme?: WidgetTheme;
}
type WidgetComponent = ComponentPublicInstance<WidgetProps, WidgetExpose>;

const props = withDefaults(defineProps<WidgetViewModeModalProps>(), {
    visible: false,
    widgetKey: undefined,
    size: undefined,
    theme: undefined,
});
const emit = defineEmits<{(e: 'update:visible', visible: boolean): void;
}>();

const dashboardDetailStore = useDashboardDetailInfoStore();
const dashboardDetailState = dashboardDetailStore.$state;
const allReferenceStore = useAllReferenceStore();
const state = reactive({
    widgetRef: null as WidgetComponent|null,
    loadingWidget: true,
    hasManagePermission: useManagePermissionState(),
    allReferenceTypeInfo: computed<AllReferenceTypeInfo>(() => allReferenceStore.getters.allReferenceTypeInfo),
    component: null as AsyncComponent|null,
    variablesSnapshot: {} as DashboardVariables,
    variableSchemaSnapshot: {} as DashboardVariablesSchema,
    settingsSnapshot: {} as DashboardSettings,
    sidebarVisible: false,
    hasNonInheritedWidgetOptions: false,
    originWidgetInfo: computed<DashboardLayoutWidgetInfo|undefined>(() => {
        if (!props.widgetKey) return undefined;
        return dashboardDetailState.dashboardWidgetInfoList.find((widgetInfo) => widgetInfo.widget_key === props.widgetKey);
    }),
    updatedWidgetInfo: undefined as Partial<DashboardLayoutWidgetInfo>|undefined,
});
const widgetRef = toRef(state, 'widgetRef');

/* Util */
const initSnapshot = () => {
    state.variablesSnapshot = cloneDeep(dashboardDetailState.variables);
    state.variableSchemaSnapshot = cloneDeep(dashboardDetailState.variablesSchema);
    state.settingsSnapshot = cloneDeep(dashboardDetailState.settings);
};

const handleCloseModal = () => {
    dashboardDetailStore.$patch((_state) => {
        _state.variables = state.variablesSnapshot;
        _state.variablesSchema = state.variableSchemaSnapshot;
        _state.settings = state.settingsSnapshot;
    });
    emit('update:visible', false);
};
const handleClickEditOption = () => {
    state.sidebarVisible = true;
};
const handleCloseSidebar = (save: boolean) => {
    state.sidebarVisible = false;
    if (!save) state.updatedWidgetInfo = cloneDeep(state.originWidgetInfo);
    state.widgetRef?.refreshWidget();
};
const handleUpdateSidebarWidgetInfo = (widgetInfo: UpdatableWidgetInfo) => {
    // NOTE: Do not refresh when the title changes. There are no cases where title and other options change together.
    const refreshWidget = widgetInfo.title === state.updatedWidgetInfo?.title;
    state.updatedWidgetInfo = widgetInfo;
    if (refreshWidget) state.widgetRef?.refreshWidget();
};
const handleUpdateHasNonInheritedWidgetOptions = (value: boolean) => {
    state.hasNonInheritedWidgetOptions = value;
};

const handleUpdateWidgetInfo = (widgetKey: string, widgetInfo: UpdatableWidgetInfo) => {
    state.updatedWidgetInfo = widgetInfo;
    dashboardDetailStore.updateWidgetInfo(widgetKey, widgetInfo);
};
const handleUpdateValidation = (widgetKey: string, isValid: boolean) => {
    dashboardDetailStore.updateWidgetValidation(isValid, widgetKey);
};

watch(() => props.visible, async (visible) => {
    if (!state.originWidgetInfo) return;
    if (visible) {
        initSnapshot();
        state.component = getWidgetComponent(state.originWidgetInfo.widget_name);
    } else {
        state.loadingWidget = true;
        state.sidebarVisible = false;
        state.component = null;
        emit('update:visible', false);
    }
});

</script>

<template>
    <transition name="slide-up">
        <div v-show="props.visible"
             class="widget-view-mode-modal"
        >
            <div class="content-wrapper">
                <div class="top-wrapper">
                    <p-button icon-left="ic_arrow-left"
                              style-type="transparent"
                              size="lg"
                              @click="handleCloseModal"
                    >
                        {{ $t('DASHBOARDS.FULL_SCREEN_VIEW.BACK_TO_DASHBOARD') }}
                    </p-button>
                    <div class="right">
                        <template v-if="state.hasNonInheritedWidgetOptions">
                            <p-i name="ic_warning-filled"
                                 width="1rem"
                                 height="1rem"
                                 :color="gray[700]"
                            />
                            <p-badge badge-type="subtle"
                                     style-type="primary3"
                                     class="non-inherit-badge"
                            >
                                <span class="text">
                                    {{ $t('DASHBOARDS.FULL_SCREEN_VIEW.NON_INHERIT_OPTION_APPLIED') }}
                                </span>
                            </p-badge>
                        </template>
                        <p-button icon-left="ic_edit"
                                  size="md"
                                  style-type="tertiary"
                                  :disabled="!state.hasManagePermission || state.sidebarVisible"
                                  class="edit-button"
                                  @click="handleClickEditOption"
                        >
                            {{ $t('DASHBOARDS.FULL_SCREEN_VIEW.EDIT_OPTION') }}
                        </p-button>
                    </div>
                </div>
                <div class="filter-wrapper">
                    <div class="left-part">
                        <dashboard-variables-select-dropdown :is-manageable="state.hasManagePermission"
                                                             disable-more-button
                                                             disable-save-button
                                                             :origin-variables="state.variablesSnapshot"
                                                             :origin-variables-schema="state.variableSchemaSnapshot"
                        />
                    </div>
                    <div class="right-part">
                        <dashboard-toolset />
                    </div>
                </div>
                <div v-if="state.originWidgetInfo && state.component"
                     class="widget-wrapper"
                >
                    <component :is="state.component"
                               ref="widgetRef"
                               :widget-key="props.widgetKey"
                               :widget-config-id="state.originWidgetInfo.widget_name"
                               :title="state.updatedWidgetInfo?.title ?? state.originWidgetInfo.title"
                               :options="state.updatedWidgetInfo?.widget_options ?? state.originWidgetInfo.widget_options"
                               :inherit-options="state.updatedWidgetInfo?.inherit_options ?? state.originWidgetInfo.inherit_options"
                               :schema-properties="state.updatedWidgetInfo?.schema_properties ?? state.originWidgetInfo.schema_properties"
                               size="full"
                               :theme="props.theme"
                               :error-mode="dashboardDetailState.widgetValidMap[props.widgetKey] === false"
                               :all-reference-type-info="state.allReferenceTypeInfo"
                               :dashboard-settings="dashboardDetailState.settings"
                               :dashboard-variables-schema="dashboardDetailState.variablesSchema"
                               :dashboard-variables="dashboardDetailState.variables"
                               :loading="state.loadingWidget"
                               @mounted="state.loadingWidget = false"
                               @update-widget-info="handleUpdateWidgetInfo(props.widgetKey, $event)"
                               @update-widget-validation="handleUpdateValidation(props.widgetKey, $event)"
                    />
                </div>
            </div>
            <transition name="slide-left">
                <widget-view-mode-sidebar v-if="state.originWidgetInfo"
                                          v-show="state.sidebarVisible"
                                          :widget-config-id="state.originWidgetInfo.widget_name"
                                          :widget-key="state.originWidgetInfo.widget_key"
                                          :visible="state.sidebarVisible"
                                          @close="handleCloseSidebar"
                                          @update:widget-info="handleUpdateSidebarWidgetInfo"
                                          @update:has-non-inherited-widget-options="handleUpdateHasNonInheritedWidgetOptions"
                />
            </transition>
        </div>
    </transition>
</template>

<style lang="postcss" scoped>
.widget-view-mode-modal {
    @apply bg-gray-100;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    .content-wrapper {
        height: 100%;
        overflow: auto;
        padding: 0 2rem 2rem 2rem;
    }

    .top-wrapper {
        @apply border-b border-gray-200;
        display: flex;
        width: 100%;
        padding: 1.5rem 0;
        .right {
            display: flex;
            align-items: center;
            margin-left: auto;
            .non-inherit-badge {
                margin-left: 0.25rem;
                margin-right: 0.5rem;
            }
        }
    }
    .filter-wrapper {
        padding: 1rem 0;
        .left-part {
            display: inline-block;
            padding-bottom: 0.75rem;
        }
        .right-part {
            display: inline-block;
            float: right;
            padding-bottom: 0.75rem;
        }
        .dashboard-variables-select-dropdown {
            @apply relative flex items-center flex-wrap;
            gap: 0.5rem;
            z-index: 10;
        }
    }
}

/* transition */
.slide-up-enter-active {
    transition: all 0.3s ease;
}
.slide-up-leave-active {
    transition: all 0.3s ease-out;
}
.slide-up-enter, .slide-up-leave-to {
    transform: translateY(100px);
    opacity: 0;
}
.slide-left-leave-active,
.slide-left-enter-active {
    transition: all 0.3s ease;
}
.slide-left-enter {
    transform: translate(100%, 0);
}
.slide-left-leave {
    transform: translate(0, 0);
}
.slide-left-leave-to {
    transform: translate(100%, 0);
}
.slide-left-enter-to {
    transform: translate(0, 0);
}
</style>
