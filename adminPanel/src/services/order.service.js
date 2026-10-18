import api from "../configs/axios.config"

export const getOrders = async (pageNo = 1, pageSize = 10, orderStatus) => {
    const response = await api.get(`/orders/all?pn=${pageNo}&ps=${pageSize}&${orderStatus ? `status=${orderStatus}` : ''}`);
    return {
        orders: response.data.orders,
        pagination: {
            hasNextPage: response.data.hasNextPage,
            currentPage: response.data.currentPage,
            hasPrevPage: response.data.hasPrevPage,
            totalPages: response.data.totalPages,
            totalOrders: response.data.totalOrders
        }
    };
}

export const getSpecificOrder = async (orderId) => {
    if (!orderId) {
        throw new Error("orderId is required")
    }
    const response = await api.get(`/orders/${orderId}`);
    return response.data.order;
}

export const updateOrderStatus = async (orderId, orderStatus) => {
    if (!orderId) {
        throw new Error("orderId is required")
    }
    if (!orderStatus) {
        throw new Error("orderStatus is required")
    }
    const response = await api.patch(`/orders/${orderId}`, { status: orderStatus });
    return response.data.order;
}

export const updateDeliveryPartner = async (orderId, deliveryPartner, trackingId) => {
    if (!orderId) {
        throw new Error("orderId is required")
    }
    if (!deliveryPartner || !trackingId) {
        throw new Error("deliveryPartner and trackingId are required")
    }
    const response = await api.patch(`/orders/delivery/${orderId}`, { deliveryPartner, trackingId });
    return response.data.order;
}



export const getDeliveryOptions = async () => {
    const toDeliveryOption = (option) => {
        if (typeof option === "string" || typeof option === "number") {
            return { value: String(option), label: String(option) };
        }

        const value = option?.value ?? option?.deliveryType ?? option?.type ?? option?.id ?? option?._id ?? option?.name;
        if (value == null) return null;

        return {
            value: String(value),
            label: String(option?.label ?? option?.optionName ?? option?.name ?? option?.title ?? option?.type ?? value),
        };
    };
    try {
        const response = await api.get("/delivery-options");
        const payload = response?.data;
        const options = Array.isArray(payload)
            ? payload
            : payload?.deliveryOptions ?? payload?.options ?? payload?.data ?? [];
        const normalizedOptions = Array.isArray(options) ? options.map(toDeliveryOption).filter(Boolean) : [];
        return normalizedOptions.length ? normalizedOptions : [{ value: "standard", label: "Standard" }];
    } catch {
        return [{ value: "standard", label: "Standard" }];
    }
};