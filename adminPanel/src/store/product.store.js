import { create } from 'zustand';

const initialState = {
    products: {}, // Structure: { [pageNumber]: { items: [], hasNextPage: bool, hasPrevPage: bool } }
};

const useProductStore = create((set) => ({
    ...initialState,

    setProducts: (payload) =>
        set((state) => {
            const page = payload?.currentPage ?? 1;
            
            return {
                products: {
                    ...state.products,
                    [page]: {
                        items: payload?.products ?? [], // Renamed to 'items' for cleaner data access
                        hasNextPage: !!payload?.hasNextPage, // Forces strict boolean conversion
                        hasPrevPage: !!payload?.hasPrevPage,
                    },
                },
            };
        }),
        
        
    resetProducts: () => set(initialState),
}));

export default useProductStore;
