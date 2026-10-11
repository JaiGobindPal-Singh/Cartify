import { create } from 'zustand';

const initialState = {
    name: "",
    id: "",
    uid: "",
    email:"",
}
const userStore = create((set) => ({
    ...initialState,
    setUser: (user) => set({ ...user }),  //set the user
    resetUser: () => set(initialState)
}));

export default userStore;