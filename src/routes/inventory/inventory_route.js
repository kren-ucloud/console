const BaseHeader = () => import('@/containers/header/CTHD_001_Header');

const InventoryMain = () => import('../../views/inventory/IVNT_001_InventoryMain');
const InventorySidebar = () => import('../../views/inventory/IVNT_002_InventorySidebar');

const DataCenter = () => import('../../views/inventory/region_zone/IVDC_001_DataCenter');
const Server = () => import('../../views/inventory/server/IVSV_001_Server');
const CollectorPlugin = () => import('../../views/inventory/settings/IVST_001_CollectorPlugin');

export default {
    path: 'inventory',
    name: 'inventory',
    redirect: 'inventory/data-center',
    meta: { label: 'Inventory', requiresAuth: true },
    components: {
        header: BaseHeader,
        sidebar: InventorySidebar,
        main: InventoryMain
    },
    children: [
        {
            path: 'data-center',
            name: 'dataCenter',
            meta: { label: 'Data Center', requiresAuth: true },
            component: DataCenter
        },
        {
            path: 'server',
            name: 'server',
            meta: { label: 'Server', requiresAuth: true },
            component: Server
        },
        {
            path: 'settings',
            name: 'settings',
            meta: { label: 'Settings', requiresAuth: true },
            component: CollectorPlugin
        }
    ]
};
