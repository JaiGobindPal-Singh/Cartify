export function arraysMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    // Convert everything to lowercase strings and sort
    const sorted1 = arr1.map(val => String(val).trim().toLowerCase()).sort();
    const sorted2 = arr2.map(val => String(val).trim().toLowerCase()).sort();

    return sorted1.every((value, index) => value === sorted2[index]);
}