// jao-custom-prototype/index.d.ts
import type { Model, InferAttributes } from 'sequelize';

/**
 * Unwraps a Sequelize Model to its pure column attributes,
 * or leaves plain objects / BaseModelProperty classes as-is.
 */
export type RowShape<T> = T extends Model ? InferAttributes<T> : T;

/**
 * Valid column keys for a given row type (excludes internal Sequelize methods).
 */
export type ColumnKey<T> = keyof RowShape<T>;

/**
 * Accepts either an array of column names: ['id', 'email']
 * or an alias map: { userId: 'id', userEmail: 'email' }
 */
export type ColumnSelector<T> =
    | ReadonlyArray<ColumnKey<T>>
    | Record<string, ColumnKey<T>>;

/**
 * Infers the exact output object shape based on the ColumnSelector passed in.
 */
export type ProjectedRow<T, S extends ColumnSelector<T> | undefined> =
    S extends undefined
    ? RowShape<T>
    : S extends ReadonlyArray<infer K extends ColumnKey<T>>
    ? Pick<RowShape<T>, K>
    : S extends Record<string, ColumnKey<T>>
    ? { [Alias in keyof S]: RowShape<T>[S[Alias]] }
    : Record<string, any>;

declare global {
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
         * Forms a flat Key-Value Pair (KvP) object from two columns: `{ [keyColumn]: valueColumn }`.
         * @param keyColumn The column name to use as object keys.
         * @param valueColumn The column name to use as object values.
         */
        toKvP<K extends ColumnKey<T>, V extends ColumnKey<T>>(
            keyColumn: K,
            valueColumn: V
        ): Record<string, RowShape<T>[V]>;

        /**
         * Indexes rows by a primary column key, keeping only selected or aliased columns.
         * @param keyColumn The column name to use as the top-level object key.
         * @param valueColumns Optional array of column names or alias map `{ newKey: 'oldColumn' }`.
         */
        toIndexedKvP<
            K extends ColumnKey<T>,
            S extends ColumnSelector<T> | undefined = undefined
        >(
            keyColumn: K,
            valueColumns?: S
        ): Record<string, ProjectedRow<T, S>>;

        /**
         * Extracts specific columns (or renames them via an alias map) into a new array of KvP objects.
         * @param columns Array of column names or alias map `{ newKey: 'oldColumn' }`.
         */
        extract<S extends ColumnSelector<T>>(
            columns: S
        ): Array<ProjectedRow<T, S>>;

        /**
         * Groups rows by a shared column value into a KvP object of arrays.
         * @param groupColumn The column name to group rows by.
         * @param valueColumns Optional array of column names or alias map `{ newKey: 'oldColumn' }`.
         */
        toGroupedKvP<
            K extends ColumnKey<T>,
            S extends ColumnSelector<T> | undefined = undefined
        >(
            groupColumn: K,
            valueColumns?: S
        ): Record<string, Array<ProjectedRow<T, S>>>;

        /**
         * Serializes the array into a JSON string.
         * @param pretty Whether to format the JSON with 2-space indentation.
         */
        toJson(pretty?: boolean): string;
    }
}

export { };