import {expect} from 'chai';
import {setNestedValue} from '../../../../src/cli/utils/nestedValueParser';

describe('setNestedValue()', () => {
    it('creates a simple nested path', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'db.url', 'http://localhost');

        expect(config).to.deep.equal({db: {url: 'http://localhost'}});
    });

    it('creates a deeply nested path', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'a.b.c.d', 'value');

        expect(config).to.deep.equal({a: {b: {c: {d: 'value'}}}});
    });

    it('preserves supported special characters in property names', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'db.auth-source.api_key', 'secret');

        expect(config).to.deep.equal({db: {'auth-source': {api_key: 'secret'}}});
    });

    it('preserves existing nested properties while replacing the selected value', () => {
        const config = {db: {url: 'old', credentials: {path: 'key.json'}}};

        setNestedValue(config, 'db.url', 'new');

        expect(config.db).to.deep.equal({url: 'new', credentials: {path: 'key.json'}});
    });

    it('replaces incompatible existing values with the required container', () => {
        const config: Record<string, unknown> = {db: 'flat', hosts: {primary: 'old'}};

        setNestedValue(config, 'db.url', 'new');
        setNestedValue(config, 'hosts.0', 'localhost');

        expect(config).to.deep.equal({db: {url: 'new'}, hosts: ['localhost']});
    });

    it('coerces boolean, integer, and decimal strings', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'flags.enabled', 'true');
        setNestedValue(config, 'flags.disabled', 'false');
        setNestedValue(config, 'db.timeout', '5000');
        setNestedValue(config, 'db.ratio', '3.14');
        setNestedValue(config, 'db.negative', '-2.5');

        expect(config).to.deep.equal({
            flags: {enabled: true, disabled: false},
            db: {timeout: 5000, ratio: 3.14, negative: -2.5}
        });
    });

    it('preserves strings that are not finite numeric or boolean values', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'values.empty', '');
        setNestedValue(config, 'values.text', '5000ms');
        setNestedValue(config, 'values.overflow', '9'.repeat(400));

        expect(config).to.deep.equal({values: {empty: '', text: '5000ms', overflow: '9'.repeat(400)}});
    });

    it('preserves non-string values including null and undefined', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'values.number', 12);
        setNestedValue(config, 'values.null', null);
        setNestedValue(config, 'values.undefined', undefined);

        expect(config.values).to.deep.equal({number: 12, null: null, undefined: undefined});
    });

    it('creates and fills arrays using numeric path segments', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'db.hosts.0', 'primary');
        setNestedValue(config, 'db.hosts.1', 'secondary');

        expect(config).to.deep.equal({db: {hosts: ['primary', 'secondary']}});
    });

    it('creates objects inside arrays for deeper paths', () => {
        const config: Record<string, unknown> = {};

        setNestedValue(config, 'db.hosts.0.url', 'localhost');

        expect(config).to.deep.equal({db: {hosts: [{url: 'localhost'}]}});
    });

    it('replaces incompatible containers and supports a numeric root key', () => {
        const config: Record<string, unknown> = {db: []};
        const array: unknown[] = [];

        setNestedValue(config, 'db.connection.url', 'localhost');
        setNestedValue(array, '0', 'first');

        expect(config.db).to.deep.equal({connection: {url: 'localhost'}});
        expect(array).to.deep.equal(['first']);
    });

    it('rejects empty paths and empty path segments', () => {
        const config: Record<string, unknown> = {};

        expect(() => setNestedValue(config, '', 'value')).to.throw(TypeError, 'non-empty');
        expect(() => setNestedValue(config, '.db', 'value')).to.throw(TypeError, 'non-empty');
        expect(() => setNestedValue(config, 'db.', 'value')).to.throw(TypeError, 'non-empty');
        expect(() => setNestedValue(config, 'db..url', 'value')).to.throw(TypeError, 'non-empty');
    });

    it('rejects prototype-related path segments', () => {
        const config: Record<string, unknown> = {};

        expect(() => setNestedValue(config, '__proto__.polluted', true)).to.throw(TypeError, 'prototype-related');
        expect(() => setNestedValue(config, 'db.constructor.value', true)).to.throw(TypeError, 'prototype-related');
        expect(() => setNestedValue(config, 'db.prototype.value', true)).to.throw(TypeError, 'prototype-related');
        expect(({} as Record<string, unknown>).polluted).to.be.undefined;
    });

    it('rejects non-numeric array path segments', () => {
        const hosts: unknown[] = [];

        expect(() => setNestedValue(hosts, 'primary', 'localhost')).to.throw(
            TypeError,
            'non-negative integer: primary'
        );
    });

    it('rejects array indexes above JavaScript maximum', () => {
        const config: Record<string, unknown> = {};

        expect(() => setNestedValue(config, 'hosts.4294967295', 'localhost')).to.throw(
            RangeError,
            'maximum supported value'
        );
    });

    it('rejects a non-object target at runtime', () => {
        expect(() => setNestedValue(null, 'db.url', 'value')).to.throw(TypeError, 'Target must be an object');
        expect(() => setNestedValue(undefined, 'db.url', 'value')).to.throw(TypeError, 'Target must be an object');
    });
});
