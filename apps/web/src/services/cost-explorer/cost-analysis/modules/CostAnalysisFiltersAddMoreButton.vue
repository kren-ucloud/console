<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import {
    computed, defineEmits, reactive, ref, toRef, watch,
} from 'vue';

import {
    PButton, PContextMenu, useContextMenuController,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/types/inputs/context-menu/type';
import { debounce } from 'lodash';

import { QueryHelper } from '@cloudforet/core-lib/query';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { useCostAnalysisPageStore } from '@/services/cost-explorer/store/cost-analysis-page-store';


const emit = defineEmits<{(e: 'disable-filter', value: string): void;
    (e: 'disable-all-filters'): void;
}>();

const costAnalysisPageStore = useCostAnalysisPageStore();
const costAnalysisPageState = costAnalysisPageStore.$state;

const state = reactive({
    menuItems: computed<MenuItem[]>(() => {
        const tagsMenuItems = state.tagsMenuItems;
        if (!tagsMenuItems.length) return costAnalysisPageStore.defaultGroupByItems;
        return [
            ...costAnalysisPageStore.defaultGroupByItems,
            { type: 'header', label: 'Tags', name: 'tags' },
            ...tagsMenuItems,
        ];
    }),
    tagsMenuItems: [] as MenuItem[],
    selectedItems: [] as MenuItem[],
    searchText: '',
    dataSourceId: computed<string>(() => costAnalysisPageStore.selectedDataSourceId ?? ''),
});

const containerRef = ref<HTMLElement|null>(null);
const contextMenuRef = ref<any|null>(null);
const targetRef = ref<HTMLElement | null>(null);
const {
    visibleMenu,
    refinedMenu,
    contextMenuStyle,
    showContextMenu,
    hideContextMenu,
    initiateMenu,
    reloadMenu,
    showMoreMenu,
} = useContextMenuController({
    useFixedStyle: true,
    targetRef,
    contextMenuRef,
    useMenuFiltering: true,
    useReorderBySelection: true,
    menu: toRef(state, 'menuItems'),
    selected: toRef(state, 'selectedItems'),
    searchText: toRef(state, 'searchText'),
    pageSize: 10,
});
onClickOutside(containerRef, hideContextMenu);

/* Api */
const resourceQueryHelper = new QueryHelper();
const fetchSearchResources = getCancellableFetcher<{results: {name: string; key: string}[]}>(SpaceConnector.client.addOns.autocomplete.distinct);
const getTagsResources = async (): Promise<{name: string; key: string}[]|undefined> => {
    try {
        resourceQueryHelper.setFilters([{ k: 'data_source_id', v: [state.dataSourceId], o: '=' }]);
        const { status, response } = await fetchSearchResources({
            resource_type: 'cost_analysis.Cost',
            distinct_key: 'tags',
            options: {
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

/* Event */
const handleClickAddMore = () => {
    if (visibleMenu.value) {
        hideContextMenu();
    } else {
        initiateMenu();
        showContextMenu();
    }
};
const handleSelectAddMoreMenuItem = (item: MenuItem, _, isSelected: boolean) => {
    costAnalysisPageStore.$patch((_state) => {
        if (isSelected) {
            _state.enabledFiltersProperties = [...(_state.enabledFiltersProperties ?? []), item.name as string];
        } else {
            _state.enabledFiltersProperties = _state.enabledFiltersProperties?.filter((d) => d !== item.name);
            emit('disable-filter', item.name as string);
        }
    });
};
const handleClearAddMoreMenuItems = () => {
    costAnalysisPageStore.$patch((_state) => {
        _state.enabledFiltersProperties = [];
        emit('disable-all-filters');
    });
};
const handleUpdateSearchText = debounce((text: string) => {
    state.searchText = text;
    reloadMenu();
}, 200);
const handleClickShowMore = async () => {
    await showMoreMenu();
};

watch(() => costAnalysisPageState.enabledFiltersProperties, (_enabledFiltersProperties) => {
    if (_enabledFiltersProperties?.length) {
        state.selectedItems = state.menuItems.filter((d) => _enabledFiltersProperties.includes(d.name));
    }
}, { immediate: true });

watch(() => state.dataSourceId, async (dataSourceId) => {
    if (!dataSourceId) return;
    const tagsResources = await getTagsResources();
    state.tagsMenuItems = tagsResources ? tagsResources.map((d) => ({ name: `tags.${d.key}`, label: d.name })) : [];
}, { immediate: true });
</script>

<template>
    <div ref="containerRef"
         class="cost-analysis-add-more-button"
    >
        <p-button ref="targetRef"
                  style-type="transparent"
                  icon-left="ic_plus_bold"
                  @click="handleClickAddMore"
        >
            {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ADD_MORE') }}
        </p-button>
        <p-context-menu v-show="visibleMenu"
                        ref="contextMenuRef"
                        class="add-more-context-menu"
                        searchable
                        :search-text="state.searchText"
                        :style="contextMenuStyle"
                        :menu="refinedMenu"
                        :selected="state.selectedItems"
                        multi-selectable
                        show-select-marker
                        show-clear-selection
                        @select="handleSelectAddMoreMenuItem"
                        @clear-selection="handleClearAddMoreMenuItems"
                        @click-show-more="handleClickShowMore"
                        @update:search-text="handleUpdateSearchText"
        />
    </div>
</template>

<style lang="postcss" scoped>
.cost-analysis-add-more-button {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    .add-more-context-menu {
        min-width: 10rem;
    }
}
</style>
