<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';

import {
    PSelectButton, PSelectDropdown,
} from '@spaceone/design-system';
import type {
    AutocompleteHandler,
    SelectDropdownMenuItem,
} from '@spaceone/design-system/types/inputs/dropdown/select-dropdown/type';
import { xor } from 'lodash';

import { QueryHelper } from '@cloudforet/core-lib/query';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';

import { i18n } from '@/translations';

import { showInfoMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { GROUP_BY_ITEM_MAP } from '@/services/cost-explorer/lib/config';
import { useCostAnalysisPageStore } from '@/services/cost-explorer/store/cost-analysis-page-store';


interface GroupBySelectButtonItem {
    name: string;
    label: string;
}

const costAnalysisPageStore = useCostAnalysisPageStore();
const costAnalysisPageState = costAnalysisPageStore.$state;

const state = reactive({
    selectedGroupByItems: computed<SelectDropdownMenuItem[]>(() => costAnalysisPageState.groupBy.map((d) => {
        if (GROUP_BY_ITEM_MAP[d]) return GROUP_BY_ITEM_MAP[d];
        return { name: d, label: d.split('.')[1] };
    })),
    selectedTagsMenu: [] as SelectDropdownMenuItem[],
    dataSourceId: computed<string>(() => costAnalysisPageStore.selectedDataSourceId ?? ''),
});

/* fetcher */
const resourceQueryHelper = new QueryHelper();
const fetchSearchResources = getCancellableFetcher<{results: {name: string; key: string}[]}>(SpaceConnector.client.addOns.autocomplete.distinct);
const getResources = async (inputText: string, distinctKey: string): Promise<{name: string; key: string}[]|undefined> => {
    try {
        resourceQueryHelper.setFilters([{ k: 'data_source_id', v: [state.dataSourceId], o: '=' }]);
        const { status, response } = await fetchSearchResources({
            resource_type: 'cost_analysis.Cost',
            distinct_key: distinctKey,
            search: inputText,
            options: {
                limit: 10,
                filter: resourceQueryHelper.apiQuery.filter,
            },
        });
        if (status === 'succeed') return response.results;
        return undefined;
    } catch (e: any) {
        ErrorHandler.handleError(e);
        return undefined;
    }
};

/* util */
const tagsMenuHandler: AutocompleteHandler = async (value: string) => {
    const results = await getResources(value, 'tags');
    return { results: results ? results.map((d) => ({ name: `tags.${d.key}`, label: d.name })) : [] };
};
const predicate = (current, data) => Object.keys(current).every((key) => data && current[key] === data[key]);
const setSelectedTagsMenu = (groupBy?: string[]) => {
    if (!groupBy) return;
    state.selectedTagsMenu = groupBy
        .filter((d) => d.startsWith('tags.'))
        .map((d) => ({ name: d, label: d.split('.')[1] })) ?? [];
};

/* event */
const handleChangeDefaultGroupBy = async (selectedItems: GroupBySelectButtonItem[], isSelected: boolean) => {
    if (isSelected && state.selectedGroupByItems.length >= 3) {
        showInfoMessage(i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_ADD_GROUP_BY'), i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_ADD_GROUP_BY_DESC'));
        return;
    }
    if (isSelected) {
        const addedGroupByName: string = xor(costAnalysisPageState.groupBy, selectedItems.map((d) => d.name))[0];
        costAnalysisPageStore.$patch((_state) => {
            _state.groupBy = [addedGroupByName, ..._state.groupBy];
            _state.chartGroupBy = addedGroupByName;
        });
    } else {
        costAnalysisPageStore.$patch((_state) => {
            _state.groupBy = selectedItems.map((d) => d.name);
        });
    }
};
const handleSelectTagsGroupBy = (selectedItem: SelectDropdownMenuItem, isSelected: boolean) => {
    if (isSelected) {
        if (state.selectedGroupByItems.length + 1 > 3) {
            showInfoMessage(i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_ADD_GROUP_BY'), i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_ADD_GROUP_BY_DESC'));
            state.selectedTagsMenu = state.selectedTagsMenu.filter((d) => d.name !== selectedItem.name);
            return;
        }
        costAnalysisPageStore.$patch((_state) => {
            _state.groupBy = [selectedItem.name as string, ..._state.groupBy];
            _state.chartGroupBy = selectedItem.name;
        });
    } else {
        costAnalysisPageStore.$patch((_state) => {
            _state.groupBy = _state.groupBy.filter((d) => d !== selectedItem.name);
        });
    }
};
const handleClearTagsGroupBy = () => {
    costAnalysisPageStore.$patch((_state) => {
        _state.groupBy = _state.groupBy.filter((d) => !d.startsWith('tags.'));
    });
};

watch(() => costAnalysisPageState.groupBy, (groupBy) => {
    setSelectedTagsMenu(groupBy);
});
</script>

<template>
    <div class="cost-analysis-group-by-filter">
        <b class="label">{{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.GROUP_BY') }}:</b>
        <p class="count-text">
            <span class="selected-group-by-items-count">{{ state.selectedGroupByItems.length }}</span>
            <span>/3</span>
        </p>
        <p-select-button v-for="defaultGroupByItem in costAnalysisPageStore.defaultGroupByItems"
                         :key="defaultGroupByItem.name"
                         :value="defaultGroupByItem"
                         :selected="state.selectedGroupByItems"
                         multi-selectable
                         size="sm"
                         :predicate="predicate"
                         @change="handleChangeDefaultGroupBy"
        >
            {{ defaultGroupByItem.label }}
        </p-select-button>
        <div class="tags-button-wrapper">
            <p-select-dropdown :handler="tagsMenuHandler"
                               :selected.sync="state.selectedTagsMenu"
                               selection-label="Tags"
                               appearance-type="badge"
                               :show-delete-all-button="false"
                               multi-selectable
                               selection-highlight
                               show-select-marker
                               is-filterable
                               @select="handleSelectTagsGroupBy"
                               @clear-selection="handleClearTagsGroupBy"
            />
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.cost-analysis-group-by-filter {
    @apply flex flex-wrap;
    column-gap: 0.375rem;
    row-gap: 0.5rem;
    align-items: center;
    font-size: 0.875rem;
    padding: 1rem 0;

    .count-text {
        @apply text-label-lg text-gray-500;
        .selected-group-by-items-count {
            @apply text-gray-900;
        }
    }
    .tags-button-wrapper {
        position: relative;
        padding-right: 3.5rem;

        /* custom design-system component - p-select-dropdown */
        :deep(.p-select-dropdown) {
            .dropdown-button-component {
                .dropdown-button {
                    height: 1.375rem;
                    min-height: 1.5rem;
                    .placeholder {
                        font-size: 0.75rem;
                    }
                }
                &.selected {
                    .dropdown-button {
                        @apply bg-secondary border-secondary text-white;
                        .p-badge {
                            @apply bg-white text-gray-800;
                            margin-left: 0.375rem;
                        }
                        .selection-wrapper, .arrow-button {
                            @apply text-white;
                        }
                    }
                }
            }
            .selection-wrapper {
                font-size: 0.75rem;
            }
            .p-context-menu {
                min-width: 9rem;
            }
        }
    }
}
</style>
