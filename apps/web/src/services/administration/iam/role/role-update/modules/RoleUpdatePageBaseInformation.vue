<template>
    <p-pane-layout class="role-update-page-base-information">
        <p-heading heading-type="sub"
                   :title="$t('IAM.ROLE.DETAIL.BASE_INFORMATION')"
        />
        <div class="input-wrapper">
            <p-field-group
                :label="$t('IAM.ROLE.DETAIL.NAME')"
                :invalid="invalidState.roleName"
                :invalid-text="invalidTexts.roleName"
                required
            >
                <template #default="{invalid}">
                    <p-text-input class="role-name-input input"
                                  :value="roleName"
                                  :invalid="invalid"
                                  @update:value="setForm('roleName', $event)"
                    />
                </template>
            </p-field-group>
            <p-field-group
                :label="$t('IAM.ROLE.DETAIL.DESCRIPTION')"
            >
                <template #default="{invalid}">
                    <p-text-input v-model="roleDescription"
                                  class="role-description-input input"
                                  :invalid="invalid"
                    />
                </template>
            </p-field-group>
            <p-field-title :label="$t('IAM.ROLE.DETAIL.ROLE_TYPE')" />
            <div v-if="!roleTypeInputDisabled"
                 class="select-card-wrapper"
            >
                <p-select-card v-for="(roleType, index) in roleTypes"
                               :key="roleType.key"
                               v-model="selectedRoleType"
                               :tab-index="index"
                               class="card"
                               :value="roleType.key"
                               :label="roleType.label"
                >
                    <p-field-title class="role-type-name">
                        {{ roleType.label }}
                    </p-field-title>
                    <p class="role-type-description">
                        {{ roleType.description }}
                    </p>
                </p-select-card>
            </div>
            <span v-else-if="savedRoleType"
                  class="role-type-saved-text"
            >{{ `${savedRoleType.label} (${savedRoleType.description})` }}</span>
        </div>
    </p-pane-layout>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import {
    computed, reactive, toRefs, watch,
} from 'vue';
import type { TranslateResult } from 'vue-i18n';

import {
    PPaneLayout, PHeading, PFieldGroup, PFieldTitle, PTextInput, PSelectCard,
} from '@spaceone/design-system';

import { i18n } from '@/translations';

import { useFormValidator } from '@/common/composables/form-validator';

import type { RoleType } from '@/services/administration/iam/role/config';
import { ROLE_TYPE, ROLE_TYPE_BADGE_OPTION } from '@/services/administration/iam/role/config';
import type { BaseInfoFormData } from '@/services/administration/iam/role/role-update/modules/RoleUpdateForm.vue';

interface RoleTypeForm {label: string; key: string; description: TranslateResult}

export default {
    name: 'RoleUpdatePageBaseInformation',
    components: {
        PPaneLayout,
        PHeading,
        PFieldGroup,
        PTextInput,
        PFieldTitle,
        PSelectCard,
    },
    props: {
        initialFormData: {
            type: Object as PropType<BaseInfoFormData>,
            default: () => ({}),
        },
        roleTypeInputDisabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const {
            forms: {
                roleName,
            },
            setForm,
            invalidState,
            invalidTexts,
            isAllValid,
        } = useFormValidator({
            roleName: undefined,
        }, {
            roleName(value?: string) {
                if (value === undefined) return '';
                return value.trim().length > 2 ? '' : i18n.t('IAM.ROLE.FORM.VALIDATION_ROLE_NAME');
            },
        });

        const state = reactive({
            roleDescription: undefined as undefined | string,
            roleTypes: computed<RoleTypeForm[]>(() => [
                { label: ROLE_TYPE_BADGE_OPTION.PROJECT.label, key: ROLE_TYPE.PROJECT, description: i18n.t('IAM.ROLE.FORM.ROLE_TYPE_PROJECT') },
                { label: ROLE_TYPE_BADGE_OPTION.DOMAIN.label, key: ROLE_TYPE.DOMAIN, description: i18n.t('IAM.ROLE.FORM.ROLE_TYPE_DOMAIN') },
            ]),
            selectedRoleType: ROLE_TYPE.PROJECT as RoleType,
            savedRoleType: computed<RoleTypeForm|undefined>(() => {
                const roleType = props.initialFormData?.roleType;
                return state.roleTypes.find((type) => type.key === roleType);
            }),
        });
        watch(() => isAllValid.value, (after) => {
            emit('update-validation', after);
        }, { immediate: true });
        watch([() => state.selectedRoleType, () => state.roleDescription, () => roleName.value], ([selectedRoleType, roleDescription, roleNameValue]) => {
            emit('update-form', { roleName: roleNameValue, roleDescription, roleType: selectedRoleType });
        }, { immediate: true });
        watch(() => props.initialFormData, (initialFormData) => {
            setForm('roleName', initialFormData.roleName);
            state.roleDescription = initialFormData.roleDescription;
            state.selectedRoleType = initialFormData.roleType;
        });
        return {
            ...toRefs(state),
            roleName,
            setForm,
            invalidState,
            invalidTexts,
            isAllValid,
        };
    },
};
</script>

<style lang="postcss" scoped>
.role-update-page-base-information {
    @apply mx-0;
    max-width: 100%;

    .input-wrapper {
        @apply mx-4 mb-8 flex flex-wrap gap-1 flex-col;

        .input {
            max-width: 43.5rem;
            width: 100%;
        }

        .select-card-wrapper {
            @apply flex flex-wrap gap-2 w-full;
            max-width: 43.5rem;
            .card {
                width: calc(50% - 0.25rem);

                /* custom design-system component - p-select-card */
                :deep(&) {
                    .marker {
                        display: none;
                    }
                    &.selected {
                        .marker {
                            display: block;
                        }
                        .role-type-name {
                            @apply text-blue-600;
                        }
                        .role-type-description {
                            @apply text-blue-500;
                        }
                    }
                }
                .role-type-description {
                    @apply text-gray-500;
                    font-size: 0.75rem;
                }
            }
        }
        .role-type-saved-text {
            font-size: 0.875rem;
            line-height: 1.3125rem;
        }
    }
}
</style>
