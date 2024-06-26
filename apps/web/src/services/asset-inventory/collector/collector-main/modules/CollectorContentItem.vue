<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import {
    PButton, PCard, PLazyImg,
} from '@spaceone/design-system';

import { i18n } from '@/translations';

import { isMobile } from '@/lib/helper/cross-browsing-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { useCollectorPageStore } from '@/services/asset-inventory/collector/collector-main/collector-page-store';
import CollectorItemSchedule
    from '@/services/asset-inventory/collector/collector-main/modules/collector-item-info/CollectorItemSchedule.vue';
import type { CollectorItemInfo, JobAnalyzeStatus } from '@/services/asset-inventory/collector/collector-main/type';
import type { CollectorUpdateParameter } from '@/services/asset-inventory/collector/model';
import {
    useCollectorDataModalStore,
} from '@/services/asset-inventory/collector/shared/collector-data-modal/collector-data-modal-store';
import { useCollectorFormStore } from '@/services/asset-inventory/collector/shared/collector-forms/collector-form-store';
import CollectorCurrentStatus from '@/services/asset-inventory/collector/shared/CollectorCurrentStatus.vue';
import RecentCollectorJobList from '@/services/asset-inventory/collector/shared/RecentCollectorJobList.vue';

interface Props {
    item: CollectorItemInfo;
}

const props = defineProps<Props>();

const collectorPageStore = useCollectorPageStore();
const collectorPageState = collectorPageStore.$state;
const collectorDataModalStore = useCollectorDataModalStore();
const collectorFormStore = useCollectorFormStore();

const state = reactive({
    plugin: computed<{name?: string; version: string}|null>(() => {
        const plugin = props.item.plugin;
        if (plugin) return { name: plugin.name, version: plugin.info.version };
        return null;
    }),
    recentJob: computed<JobAnalyzeStatus|undefined>(() => {
        if (!props.item) return undefined;
        return props.item.recentJobAnalyze?.filter((rj) => rj.job_id === collectorPageStore.recentJobForAllAccounts?.job_id)[0];
    }),
    isScheduleActivated: false,
});

const handleChangeToggle = async () => {
    try {
        state.isScheduleActivated = !state.isScheduleActivated;
        const params: CollectorUpdateParameter = {
            collector_id: props.item.collectorId,
            schedule: {
                ...props.item.schedule,
                state: state.isScheduleActivated ? 'ENABLED' : 'DISABLED',
            },
        };
        const response = await collectorPageStore.updateCollectorSchedule(params);
        await collectorFormStore.setOriginCollector(response);
    } catch (e) {
        ErrorHandler.handleRequestError(e, i18n.t('INVENTORY.COLLECTOR.ALT_E_UPDATE_SCHEDULE'));
    }
};

/* API */
const handleClickCollectData = async () => {
    if (!props.item) return;
    await collectorPageStore.setSelectedCollector(props.item.collectorId);
    await collectorDataModalStore.$patch((_state) => {
        if (!props.item) return;
        _state.visible = true;
        _state.selectedCollector = collectorPageState.selectedCollector;
    });
};

/* Watcher */
watch(() => props.item.schedule, (schedule) => {
    if (schedule) {
        state.isScheduleActivated = schedule.state === 'ENABLED';
    }
}, { immediate: true });
</script>

<template>
    <div class="collector-content-item">
        <p-card :header="false"
                style-type="white"
                class="collector-item"
        >
            <div class="collector-item-wrapper">
                <span class="collector-item-name">{{ props.item.name }}</span>
                <div class="collector-plugin">
                    <p-lazy-img :src="props.item.plugin.icon"
                                width="1.5rem"
                                height="1.5rem"
                                class="plugin-icon"
                    />
                    <div class="title-wrapper">
                        <span class="plugin-name">{{ props.item.plugin.name }}</span>
                        <span class="plugin-version">v{{ props.item.plugin.info.version }}</span>
                    </div>
                </div>
                <div class="collector-info-wrapper">
                    <div v-if="props.item"
                         class="collector-info-view"
                    >
                        <collector-current-status :hours="props.item.schedule?.hours"
                                                  :recent-job="state.recentJob"
                                                  :is-schedule-activated="state.isScheduleActivated"
                        />
                        <recent-collector-job-list :recent-jobs="props.item.recentJobAnalyze"
                                                   :history-link="props.item.historyLink"
                                                   class="collector-info-view-recent-collector"
                        />
                    </div>
                    <collector-item-schedule :collector-id="props.item.collectorId"
                                             :is-schedule-activated="state.isScheduleActivated"
                                             @change-toggle="handleChangeToggle"
                    />
                </div>
            </div>
            <div :class="['collector-status-wrapper', { 'is-mobile': isMobile()}]">
                <p-button style-type="tertiary"
                          class="collector-data-button"
                          @click.stop="handleClickCollectData"
                >
                    {{ $t('INVENTORY.COLLECTOR.MAIN.COLLECT_DATA') }}
                </p-button>
            </div>
        </p-card>
    </div>
</template>

<style lang="postcss" scoped>
.collector-content-item {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    /* custom design-system component - p-card */
    :deep(.p-card) {
        &:hover {
            .body {
                @apply bg-blue-100;
            }
        }
    }
    .collector-item {
        @apply relative;
        &:hover {
            @apply cursor-pointer;
            .collector-status-wrapper {
                .collector-data-button {
                    opacity: 1;
                }
            }
        }
        .collector-status-wrapper {
            @apply absolute;
            top: 1.25rem;
            right: 1.5rem;
            gap: 0.25rem;
            &.is-mobile {
                position: initial;
                margin-top: 0.75rem;
                margin-bottom: 0.5rem;
                .collector-data-button {
                    width: 100%;
                    opacity: 1;
                }
            }
            .collector-data-button {
                @apply flex items-center;
                opacity: 0;
                padding-top: 0.065rem;
            }
        }
        .collector-item-wrapper {
            @apply flex flex-col;
            gap: 0.875rem;
            padding: 0.5rem 0.625rem;
            .collector-item-name {
                @apply text-label-xl font-bold;
            }
            .collector-plugin {
                @apply flex items-center;
                width: 100%;
                gap: 0.5rem;
                .title-wrapper {
                    @apply relative flex flex-col truncate;
                    height: 2.125rem;
                    flex: 1;
                    .plugin-name {
                        @apply truncate text-label-md;
                    }
                    .plugin-version {
                        @apply absolute text-label-sm text-gray-400 truncate;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                    }
                }
            }
            .collector-info-wrapper {
                margin-top: 1.125rem;

                @screen tablet {
                    @apply flex-col;
                    gap: 1rem;
                }
                .collector-info-view {
                    @apply flex justify-between;
                    .collector-info-view-recent-collector {
                        @apply flex flex-col items-end;
                    }
                    .info-item {
                        @apply relative flex flex-col flex-wrap;
                        gap: 0.5rem;
                    }

                    @screen mobile {
                        @apply relative;
                        display: initial;
                    }
                }
            }
        }
    }
}
</style>
