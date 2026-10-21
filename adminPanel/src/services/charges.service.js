import api from "../configs/axios.config"

export const getAllCharges = async () =>{
    const response = await api.get('/charges?includeInactive=true');
    return response.data.charges;
}

export const createCharge = async ({chargeName, chargeType, chargeAmount, }, {matchStrategy ="ANY_CONDITION", postalCodes=[], countries=[], minOrderAmount, deliveryType,currency }) => {

    const chargeData = {
        chargeName: chargeName,
        chargeType: chargeType,
        chargeAmount: chargeAmount,
        policyType: "conditional", //this is the default policy type, we can change it later if needed

        chargeExemption: {
            matchStrategy: matchStrategy,
            conditions:{} 
        }
    }
    if (postalCodes.length > 0) {
        chargeData.chargeExemption.conditions.postalCodes = postalCodes;
    }
    if (countries.length > 0) {
        chargeData.chargeExemption.conditions.countries = countries;
    }
    if (currency) {
        chargeData.chargeExemption.conditions.currency = currency.trim();
    }
    if (minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== '' && !isNaN(minOrderAmount) && Number(minOrderAmount) > 0) {
        chargeData.chargeExemption.conditions.minOrderAmount = minOrderAmount;
    }
    if (deliveryType) {
        chargeData.chargeExemption.conditions.deliveryType = deliveryType;
    }

    const response = await api.post('/charges', chargeData);
    return response.data.charge;
}

//pass full object even if only single field is being updated, as the API requires all fields to be present in the request body
export const updateCharge = async (chargeId, isActive, {chargeName, chargeType, chargeAmount, matchStrategy="ANY_CONDITION" }={}, {postalCodes=[], countries=[], minOrderAmount, deliveryType, currency }={}) => {

    const chargeData =
    {
        chargeName: chargeName,
        chargeType: chargeType,
        chargeAmount: chargeAmount,
        isActive: isActive,
        policyType: "conditional", //this is the default policy type, we can change it later if needed

        chargeExemption: {
            matchStrategy: matchStrategy,
            conditions:{
            } 
        }
    }
    
    if (postalCodes.length > 0) {
        chargeData.chargeExemption.conditions.postalCodes = postalCodes;
    }
    if (countries.length > 0) {
        chargeData.chargeExemption.conditions.countries = countries;
    }

    if (minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== '' && !isNaN(minOrderAmount) && Number(minOrderAmount) > 0) {
        chargeData.chargeExemption.conditions.minOrderAmount = minOrderAmount;
    }
    if(currency){
        chargeData.chargeExemption.conditions.currency = currency.trim();
    }
    if (deliveryType) {
        chargeData.chargeExemption.conditions.deliveryType = deliveryType;
    }

    const response = await api.put(`/charges/${chargeId}`, chargeData);
    return response.data.charge;
}

export const deleteCharge = async (chargeId) => {
    const response = await api.delete(`/charges/${chargeId}`);
    return response.data;
}

export const getChargeById = async (chargeId) => {
    const response = await api.get(`/charges/${chargeId}`);
    return response.data.charge;
}
