// jao-custom-prototype/index.d.ts
export {};

export type ColumnSelector<T> = Array<keyof T> | Record<string, keyof T>;

declare global {
    interface Array<T> {
        /**
         * Checks whether the array contains zero elements.
         * @returns {boolean} True if the array length is 0, otherwise false.
         */
        isEmpty(): boolean;

        /**
         * Checks whether the array contains one or more elements.
         * @returns {boolean} True if the array length is greater than 0, otherwise false.
         */
        isNotEmpty(): boolean;

        /**
         * Forms a flat Key-Value Pair (KvP) object from two columns: { [keyColumn]: valueColumn }.
         * @param keyColumn The column name to use as object keys.
         * @param valueColumn The column name to use as object values.
         */
        toKvP<K extends keyof T, V extends keyof T>(
            keyColumn: K,
            valueColumn: V
        ): Record<string, T[V]>;

        /**
         * Indexes rows by a primary column key, keeping only selected or aliased columns.
         * @param keyColumn The column name to use as the top-level object key.
         * @param valueColumns Optional array of column names or alias map { newKey: 'oldColumn' }.
         */
        toIndexedKvP<K extends keyof T>(
            keyColumn: K,
            valueColumns?: ColumnSelector<T>
        ): Record<string, Record<string, any>>;

        /**
         * Extracts specific columns (or renames them via an alias map) into a new array of KvP objects.
         * @param columns Array of column names or alias map { newKey: 'oldColumn' }.
         */
        extract(columns: ColumnSelector<T>): Array<Record<string, any>>;

        /**
         * Groups rows by a shared column value into a KvP object of arrays.
         * @param groupColumn The column name to group rows by.
         * @param valueColumns Optional array of column names or alias map { newKey: 'oldColumn' }.
         */
        toGroupedKvP<K extends keyof T>(
            groupColumn: K,
            valueColumns?: ColumnSelector<T>
        ): Record<string, Array<Record<string, any>>>;

        /**
         * Serializes the array into a JSON string.
         * @param pretty Whether to format the JSON with 2-space indentation.
         */
        toJson(pretty?: boolean): string;
    }

    interface ReadonlyArray<T> {
        /**
         * Checks whether the array contains zero elements.
         * @returns {boolean} True if the array length is 0, otherwise false.
         */
        isEmpty(): boolean;

        /**
         * Checks whether the array contains one or more elements.
         * @returns {boolean} True if the array length is greater than 0, otherwise false.
         */
        isNotEmpty(): boolean;

        /**
         * Forms a flat Key-Value Pair (KvP) object from two columns: { [keyColumn]: valueColumn }.
         * @param keyColumn The column name to use as object keys.
         * @param valueColumn The column name to use as object values.
         */
        toKvP<K extends keyof T, V extends keyof T>(
            keyColumn: K,
            valueColumn: V
        ): Record<string, T[V]>;

        /**
         * Indexes rows by a primary column key, keeping only selected or aliased columns.
         * @param keyColumn The column name to use as the top-level object key.
         * @param valueColumns Optional array of column names or alias map { newKey: 'oldColumn' }.
         */
        toIndexedKvP<K extends keyof T>(
            keyColumn: K,
            valueColumns?: ColumnSelector<T>
        ): Record<string, Record<string, any>>;

        /**
         * Extracts specific columns (or renames them via an alias map) into a new array of KvP objects.
         * @param columns Array of column names or alias map { newKey: 'oldColumn' }.
         */
        extract(columns: ColumnSelector<T>): Array<Record<string, any>>;

        /**
         * Groups rows by a shared column value into a KvP object of arrays.
         * @param groupColumn The column name to group rows by.
         * @param valueColumns Optional array of column names or alias map { newKey: 'oldColumn' }.
         */
        toGroupedKvP<K extends keyof T>(
            groupColumn: K,
            valueColumns?: ColumnSelector<T>
        ): Record<string, Array<Record<string, any>>>;

        /**
         * Serializes the array into a JSON string.
         * @param pretty Whether to format the JSON with 2-space indentation.
         */
        toJson(pretty?: boolean): string;
    }
}