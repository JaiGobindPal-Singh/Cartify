import { updateStoreConfig,
	getStoreConfig as getConfig
 } from "../operations/storeConfig/storeConfig.operation.js";
import { cleanMongoObject } from "../utils/mongo.utils.js";

/**
 * Updates a store's configuration after validating the request payload.
 */
export const updateStoreConfigController = async (req, res) => {

	const config = req.body;

	if (!config || typeof config !== "object" || Array.isArray(config)) {
		return res.status(400).json({
			success: false,
			message: "A valid store configuration is required",
		});
	}

	if (Object.keys(config).length === 0) {
		return res.status(400).json({
			success: false,
			message: "At least one configuration field is required",
		});
	}

	const updatedConfig = await updateStoreConfig(config);

	return res.status(200).json({
		success: true,
		data: updatedConfig,
	});

};

export const getStoreConfigController = async (req, res) =>{
	const storeC = await getConfig();
	return res.status(200).json({success: true,
		config: cleanMongoObject(storeC)});
}

export default updateStoreConfigController;
