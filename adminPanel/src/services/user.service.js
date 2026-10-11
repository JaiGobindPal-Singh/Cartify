import api from "../configs/axios.config.js";
import userStore from "../store/user.store.js";


export const getUser = async () => {
    const { name, uid, role, id, email } = userStore.getState();
    let user;

    //if user is not stored make auto login request
    if (!name || !role || !id || !email) {
        const response = await api.get("/auth").catch(e => null);
        //if user is not logged in return {}
        if (!response) {
            return {}
        }

        const payload = response?.data;
        const serverUser = payload?.user;
        if (serverUser) {
            user = {
                name: serverUser?.name || "",
                uid: serverUser?.uid || "",
                email: serverUser?.email || "",
                id: serverUser?.id || ""
            };
            if (user.id) {
                userStore.getState().setUser({ ...user });
            }
        }
    } else {   //use stored details
        user = { name, uid, email, id };
    }
    return user;
};

export const loginUser = async (uid, email, password) => {

    if (!password) {
        const er = new Error("Password is Required");
        er.code = 400;
        throw er;
    }

    const reqBody = {};
    if (uid) reqBody.uid = uid;
    if (email) reqBody.email = email;
    const response = await api.post("/auth/login", {
        ...reqBody,
        password
    }).catch(e => null);
    const payload = response?.data;
    const serverUser = payload?.user;
    if (!serverUser) {
        const er = new Error("Invalid Credentials ");
        er.code = 404;
        throw er;
    }
    const normalizedUser = {
        name: serverUser?.name || "",
        uid: serverUser?.uid || "",
        id: serverUser?.id || "",
        role: serverUser?.role || "",
        email: serverUser?.email || ""
    };
    if (!normalizedUser.id) {
        const er = new Error("Invalid Credentials");
        er.code = 404;
        throw er;
    }

    userStore.getState().setUser({ ...normalizedUser });
    // getCart(true);  //to sync the cart with backend
    return normalizedUser;
};

export const logoutUser = async () => {
    let response;

    response = await api.post("/auth/logout");

    userStore.getState().resetUser();
    return response?.data ?? { success: true };
}