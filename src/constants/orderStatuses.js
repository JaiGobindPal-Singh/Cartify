export const statusEnum = [
    'PAYMENT_FAILED',
    'PAYMENT_PENDING',
    'ABANDONED',
    'ORDER_PLACED',
    'PROCESSING',
    'HOLD',                     // order held by admin
    'SHIPPED',                  // order out for delivery
    'DELIVERED',
    'CANCELLED',                        // cancelled by user or admin
    'RETURN_REQUESTED',          // return requested by user
    'RETURN_APPROVED',              // return approved by admin
    'RETURNED'                                  // order is returned
]