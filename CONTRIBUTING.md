### General Requirements

1. Before doing _anything_, search for [existing ones](https://github.com/one-orm/core/issues). Avoid duplication and add your voice to existing issues.
2. No relevant issues yet? Create a [new issue](https://github.com/one-orm/core/issues/new).

## Github Issues

If you have a question about OneORM, how it works, or any idiosyncrasies you're experience, please [search our docs](http://docs.one-orm.org) first. Who knows, you might just find an answer!

### Bugs and Quirks

- Post relevant code samples (a la sscce.org).
    - Code that reproduces the issue you're having is more likely to receive a helpful response as opposed to an onslaught of requests for clarification.
    - Describe your problem in code, not words.
    - Do not use CoffeeScript, TypeScript or others. ES5 or ES6 _only_.
- If you're experiencing an error, include the stack trace.
- Include NodeJS, DB, and OneORM versions at minimum. Include other version numbers if they're relevant.

### Feature Requests

- Make sure the feature hasn't [already been requested](https://github.com/one-orm/core/issues). If not, create a [new issue](https://github.com/one-orm/core/issues/new).
- At minimum, provide a complete description of at least one use case for it.
- Bonus points for including one or more test cases.

## Documentation

We don't have docs yet. We won't be releasing an RC until we do though. Ideas and contributions welcome!

## Contributing Code

- Before writing code, ensure that there isn't already someone working on the same or similar [feature or bug](https://github.com/one-orm/core/issues).
- Your code contributions _must_ be written in ES6. None of this funky CoffeeScript or TypeScript business.
- Fork the [project](https://github.com/one-orm/core)
- Conform to the style of the project. At a glance:
    - 4-space indentation
    - Zero trailing whitespace
    - Inline documentation for new methods, class members, etc.
    - Single space between flow control keywords and their conditions, no space before function signature
        - `if (...) {}`
        - `for (...) {}`
        - `while (...) {}`
        - `function(...) {}`
- No contribution will be considered until there are passing tests validating its operation, or that existing tests have been altered accordingly.

### Running Tests

```
npm run test
```

## Plugin Search

You may also contribute to the [plugin website](http://plugins.one-orm.org/), which is similarly open source. If you're looking to create a plugin, then you need only build your NPM library and add it to npmjs.com. If you're looking to have a library brought directly under one-orm.org purview, please contact info@one-orm.org.