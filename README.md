# ![pageres](https://github.com/one-orm/one-orm.org/raw/master/media/logo-large.png)

A light and extensible ORM for Javascript applications.

[![Build Status: Linux](https://travis-ci.org/one-orm/core.svg?branch=master)](https://travis-ci.org/one-orm/core)
[![Coverage Status](https://coveralls.io/repos/github/one-orm/core/badge.svg?branch=master)](https://coveralls.io/github/one-orm/core?branch=master)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/one-orm/core)
[![Gitter](https://badges.gitter.im/join_chat.svg)](https://gitter.im/one-orm/Lobby)


## Goals

- Light. No frills. Frills are the providence of extensions!
- Support server _and_ client-side use.
- Useful, complete, verbose, and evolving documentation.
- Excellent test-suite and code coverage.
- Minimum configuration required, but maximum flexibility allowed.
- Not re-inventing the wheel. Capitalize on common libraries without introducing bloat.


## Feature Overview

- Entirely ES6, if that matters to you
- AST-based queries for extensibility
- Supports typical relations (one-to-many, many-to-one, one-to-one, many-to-many)
- Supports many-to-many with custom bridge tables
- Supports custom foreign key definitions


## Installation

One ORM Core is not intended for direct installation. It doesn't really serve a purpose beyond underpinning the extensions that use it. That said, installation is easily accomplished via NPM:

```
npm i one-orm-core
```


## Usage

One ORM Core is not intended to be used directly. Extensions rely on core to handle model management and AST generation, but core does not perform communication with underlying datastores on its own. That said, if you wish to understand how core works, please see [SPECIFICATION](SPECIFICATION.md).


## Contribute

See [CONTRIBUTING](CONTRIBUTING.md).


## Change Log

See [CHANGELOG](CHANGELOG.md).


## Licence

MIT Licensed. See [LICENSE](LICENSE).


## Authors

[Thomas P. Wilson](https://github.com/thomas-p-wilson) created One ORM.

[Andrew Hartwig](https://github.com/Andrew1431) named One ORM.

[Trevor Delamorandiere](https://github.com/tdelam) was really stoked about One ORM.

[These fine people](https://github.com/one-orm/core/contributors) have brought One ORM closer to becoming _the_ One ORM to rule them all!