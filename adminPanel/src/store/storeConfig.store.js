import { create } from 'zustand';

const useStoreConfigStore = create((set) => ({
	config: null,

	setStoreConfig: (response) =>
		set({ config: response }),

	setConfig: (updates) =>
		set((state) => ({
			config: {
				...(state.config ?? {}),
				...updates,
			},
		})),
}));

export default useStoreConfigStore;
