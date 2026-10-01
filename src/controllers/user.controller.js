import User from "../models/user.model.js";
export const updateUserDetails = async (req, res) => {
    try {
        const { streetAddress, city, state, postalCode, country, uid } = req.body;
        
        if (!req.user?.id) {
            return res.status(400).json({
                error: "Login required"
            })
        }
        const addressObj = { streetAddress, city, state, postalCode, country }
        let user = {}
        //only update address
        if(!uid){
            user = await User.findByIdAndUpdate(req.user?.id, {
                $set: { address: addressObj }
            });
        } else {
            //check if user already exist with same uid
            const temp = await User.findOne({uid:uid});
            if(temp){
                return res.status(400).json({code:"DUP_UID",error: "user with uid already exist"});
            }

            user = await User.findByIdAndUpdate(req.user?.id, {
                $set: { address: addressObj, uid }
            });
        }
        return res.status(200).json({
            success: true,
            user
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "internal server error" })
    }
}
