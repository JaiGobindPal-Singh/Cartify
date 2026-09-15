/**
 * @brief this file contains the permissions enum which will define the all permissions that user can have
 * @abstract these permission are only for super users simple customers don't require these permissions
 * @access 
 * * _R denotes read access
 * * _W denotes create, update and delete access
 * * _<MESSAGE> custom access defined by <MESSAGE>
 */
const PERMISSIONS = [
    // Users
    'USR_R',
    'USR_W',

    // Orders
    'ORD_R',
    'ORD_W',
    'ORD_CANCEL',
    'ORD_REFUND',

    // Products
    // 'PRD_R',   not required allowed to all
    'PRD_W',

    // Categories
    // 'CAT_R', not required allowed to all
    'CAT_W',

    // Inventory
    'INV_R',
    'INV_W',

    // Payments
    'PAY_R',
    'PAY_W',
    'PAY_REFUND',

    // Returns
    'RET_R',
    'RET_W',
    'RET_APPROVE',

    // Delivery
    'DLV_R',
    'DLV_W',
    'DLV_ASSIGN',
    'DLV_STATUS',

    // Coupons
    'CPN_R',
    'CPN_W',

    // Reviews
    // 'REV_R',             not required allowed to all
    'REV_W',

    // Notifications
    'NTF_R',
    'NTF_W',

    // Reports
    'RPT_R',

    // Settings
    'SET_R',
    'SET_W',

    // Roles & permissions
    'ROL_R',
    'ROL_W',
    'PER_R',
    'PER_W'
];


export default PERMISSIONS;