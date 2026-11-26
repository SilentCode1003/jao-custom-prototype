// jao-custom-prototype/index.d.ts
export { };

declare global {
    interface Array<T> {
        /**
         * Checks whether the array contains zero elements.
         * @returns {boolean} True if the array length is 0, otherwise false.
         */
        isEmpty(): boolean;

        /**
         * Checks whether the array contains zero elements.
         * @returns {boolean} True if the array length is 0, otherwise false.
         */
        isNotEmpty(): boolean;

    }

    interface ReadonlyArray<T> {
        /**
         * Checks whether the array contains zero elements.
         * @returns {boolean} True if the array length is 0, otherwise false.
         */
        isEmpty(): boolean;

        /**
     * Checks whether the array contains zero elements.
     * @returns {boolean} True if the array length is 0, otherwise false.
     */
        isNotEmpty(): boolean;
    }
}