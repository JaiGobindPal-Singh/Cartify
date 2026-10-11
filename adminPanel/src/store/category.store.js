import { create } from 'zustand';

//store format
// {
//   "categories": {
//     "1": [
//       { "id": "cat-001", "name": "Clothing" },
//       { "id": "cat-002", "name": "Shoes" }
//     ],
//     "2": [
//       { "id": "cat-101", "name": "Electronics" },
//       { "id": "cat-102", "name": "Home & Kitchen" },
//       { "id": "cat-103", "name": "Books" }
//     ]
//   }
// }

const initialState = {
    categories: {},
};

const useCategoryStore = create((set) => ({
    ...initialState,

    setCategories: (payload) =>
        set((state) => {
            const page = payload?.currentPage ?? 1;
            return {
                ...state,
                categories: {
                    ...state.categories,
                    [page]: {
                        categories: payload?.categories ?? [],
                        hasNextPage: payload?.hasNextPage ?? false,
                        hasPrevPage: payload?.hasPrevPage ?? false,
                    },
                },
            };
        }),
    resetCategories: () => set(initialState),
}));

export default useCategoryStore;