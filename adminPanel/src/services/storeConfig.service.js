
import api from "../configs/axios.config";
import useStoreConfigStore from "../store/storeConfig.store";

export const fetchStoreConfig = async () => {
	const { config, setStoreConfig } = useStoreConfigStore.getState();

	if (config) {
		return config;
	}

	const response = await api.get("/config");
	setStoreConfig(response.data.config);

	return response.data?.config;
}

export const updateStoreConfig = async(supportedCurrencies) =>{
    if(!supportedCurrencies || !Array.isArray(supportedCurrencies) || !supportedCurrencies.length){
        throw new Error("supported Currencies is required");
    }
    const {setStoreConfig} = useStoreConfigStore.getState();
    try{
        const response = await api.post("/config", { supportedCurrencies});
        if(!response.data){
            throw new Error("no response");
        }
        //storing in store
        setStoreConfig(response.data);
        }catch(e){
            const err = new Error("unable to update config");
            err.cause = e;
            throw err;
    }
}