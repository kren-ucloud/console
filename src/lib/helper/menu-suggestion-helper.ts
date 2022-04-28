import { GNBMenu } from '@/store/modules/display/type';

export interface SuggestionMenu {
    id: string;
    label: string;
    parents?: SuggestionMenu[];
    icon?: string;
}

export const getAllSuggestionMenuList = (menuList: GNBMenu[], parent?: SuggestionMenu): SuggestionMenu[] => {
    const results: SuggestionMenu[] = [];
    if (parent) {
        results.push({
            id: parent.id, label: parent.label, parents: parent.parents, icon: parent.icon,
        });
    }
    menuList.forEach((menu) => {
        if (parent) {
            const tempMenu: SuggestionMenu = {
                id: menu.id,
                label: menu.label,
                parents: [{ id: parent.id, label: parent.label, icon: parent.icon }],
            };
            if (parent.parents && tempMenu.parents) {
                tempMenu.parents.unshift(...parent.parents);
            }
            if (menu?.subMenuList?.length) {
                results.push(...getAllSuggestionMenuList(menu.subMenuList, tempMenu));
            } else {
                results.push(tempMenu);
            }
        } else if (menu?.subMenuList?.length) {
            results.push(...getAllSuggestionMenuList(menu.subMenuList, menu));
        }
    });
    return results;
};
