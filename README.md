# Casbin Objection Adapter

![tests](https://github.com/lfarrel6/casbin-objection-adapter/workflows/tests/badge.svg)

<!-- prettier-ignore-start -->

<!-- toc -->

- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Advanced usage](#advanced-usage)
    + [Filtered policy loading](#filtered-policy-loading)

<!-- tocstop -->

<!-- prettier-ignore-end -->

## Installation

```bash
npm install casbin-objection-adapter --save
```

```bash
yarn add casbin-objection-adapter
```

```bash
pnpm add casbin-objection-adapter
```

## Basic usage

See [the Casbin adapters documentation](https://casbin.org/docs/en/adapters) for more information.

```js
import Knex from "knex";
import { newEnforcer } from "casbin";
import { ObjectionAdapter } from "casbin-objection-adapter";

const knex = Knex({
  /* regular knex options */
});

// All configuration is optional
const adapter = await ObjectionAdapter.newAdapter(knex, {});

// Create the enforcer with the given model
const enforcer = await newEnforcer("basic_model.conf", adapter);

// Supports auto-save
// See: https://casbin.org/docs/en/adapters#autosave
enforcer.enableAutoSave(true);

// No need to save explicitly since auto-save is enabled
await enforcer.addPolicies([
  ["alice", "data1", "read"],
  ["bob", "data2", "write"],
]);

await enforcer.enforce("alice", "data1", "read"); // true
await enforcer.enforce("bob", "data1", "read"); // false
```

## Advanced usage

The following options are available:

| Option        | Default value | Description                                                                                                     |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| `createTable` | `true`        | Whether or not to create the table when initialized.                                                            |
| `modelClass`  | `CasbinRule`  | The model to use when querying policies. You can override this if you would like to control the table name      |
| `logger`      | `noop`        | An optional logger in case additional visiblity is needed into the adapter. The inteface should match `console` |

#### Filtered policy loading

This adapter supports filtered policy loading as of v0.3.1.
Policies are filtered using the `loadFilteredPolicy` function on the enforcer. Note that loading a filtered policy clears the in memory policy data. This is a feature of Casbin and not this adapter.
Filter examples taken from [casbin-pg-adapter](https://github.com/touchifyapp/casbin-pg-adapter)

The filters take an object with keys refering to the ptype of the filter, and values containing an array of filter values.
Any empty string, undefined, or null value is ignored in the filter. Plain strings (such as those used in the simple filter example below) are
tested for simple equality.
Strings prefixed with `regex:` or `like:` are tested using pattern matching.

Simple filter example:

```js
await enforcer.loadFilteredPolicy({
  p: ["alice"],
  g: ["", "role:admin"],
});
```

Using the above filter, you will get:

- all records with `ptype` of p, and subject of `admin`
- and all records with `ptype` of g, and a second argument of `admin`

Complex filter example:

```js
await enforcer.loadFilteredPolicy({
  p: ["regex:(role:.*)|(alice)"],
  g: ["", "like:role:%"],
});
```

Using the above filter you will get:

- all records with `ptype` of p, and subjects that match the regex `(role:.*)|(alice)`
- and all records with `ptype` of g, and a second argument that is `like` `role:%`
