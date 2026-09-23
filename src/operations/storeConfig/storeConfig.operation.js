import StoreConfig from "../../models/storeConfig.model.js"

//method to initialize the store config on app start
export const initializeStoreConfig = async () =>{
await StoreConfig.findByIdAndUpdate(
        "store-config",
        {},
        {
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
}

export const updateStoreConfig = async (updates) => {
    return StoreConfig.findByIdAndUpdate(
        "store-config",
        { $set: updates },
        {
            new: true,
            runValidators: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
};

export const getStoreConfig = async () =>{
    return StoreConfig.findOne({});
}

