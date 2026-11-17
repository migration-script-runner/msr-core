type MutableContainer = Record<string, unknown> | unknown[];

const MAX_ARRAY_INDEX = 4_294_967_294;

/**
 * Assign a value at a dot-notation path, creating missing objects and arrays.
 * Existing nested containers and their unrelated properties are preserved.
 * String values containing booleans or finite decimal numbers are coerced.
 *
 * @param target - Object to update
 * @param path - Dot-separated property path, such as `db.connection.timeout`
 * @param value - Value to assign; `undefined` is preserved when called directly
 * @returns Nothing; the target object is mutated
 * @throws TypeError when the target or path is invalid or attempts prototype mutation
 * @throws RangeError when an array index exceeds JavaScript's maximum array index
 *
 * @example
 * ```typescript
 * const config: Record<string, unknown> = {};
 * setNestedValue(config, 'db.hosts.0', 'localhost');
 * setNestedValue(config, 'db.timeout', '5000');
 * // { db: { hosts: ['localhost'], timeout: 5000 } }
 * ```
 */
export function setNestedValue(target: object | null | undefined, path: string, value: unknown): void {
    if (target === null || typeof target !== 'object') {
        throw new TypeError('Target must be an object');
    }

    const keys = path.split('.');
    if (keys.some((key) => key.length === 0)) {
        throw new TypeError('Path must contain non-empty dot-separated keys');
    }
    if (keys.some(isUnsafeKey)) {
        throw new TypeError('Path cannot contain prototype-related keys');
    }

    let current: MutableContainer = target as MutableContainer;
    for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        const nextKey = keys[index + 1];
        const currentValue = getValue(current, key);
        const nextContainer = getContainer(currentValue, isArrayIndex(nextKey));

        if (nextContainer === undefined) {
            const createdContainer: MutableContainer = isArrayIndex(nextKey) ? [] : {};
            setValue(current, key, createdContainer);
            current = createdContainer;
        } else {
            current = nextContainer;
        }
    }

    setValue(current, keys[keys.length - 1], coerceValue(value));
}

function isUnsafeKey(key: string): boolean {
    return key === '__proto__' || key === 'prototype' || key === 'constructor';
}

function isArrayIndex(key: string): boolean {
    return /^(0|[1-9]\d*)$/.test(key);
}

function getContainer(value: unknown, expectArray: boolean): MutableContainer | undefined {
    if (typeof value !== 'object' || value === null) {
        return undefined;
    }

    if (expectArray === Array.isArray(value)) {
        return value as MutableContainer;
    }

    return undefined;
}

function getValue(container: MutableContainer, key: string): unknown {
    if (Array.isArray(container)) {
        return container[parseArrayIndex(key)];
    }

    return Object.prototype.hasOwnProperty.call(container, key) ? container[key] : undefined;
}

function setValue(container: MutableContainer, key: string, value: unknown): void {
    if (Array.isArray(container)) {
        container[parseArrayIndex(key)] = value;
        return;
    }

    container[key] = value;
}

function parseArrayIndex(key: string): number {
    if (isArrayIndex(key)) {
        const index = Number(key);
        if (index <= MAX_ARRAY_INDEX) {
            return index;
        }

        throw new RangeError(`Array index exceeds the maximum supported value: ${key}`);
    }

    throw new TypeError(`Array path segment must be a non-negative integer: ${key}`);
}

function coerceValue(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value;
    }

    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }

    if (/^-?\d+(?:\.\d+)?$/.test(value)) {
        const numberValue = Number(value);
        if (Number.isFinite(numberValue)) {
            return numberValue;
        }
    }

    return value;
}
