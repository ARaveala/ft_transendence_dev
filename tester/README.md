How to use tester:

1. Try "npx playwright test" to see if you have dependencies installed
    - If not, installer might want to replace some files, dont replace them. (at least playwright config)
    - install_deps.sh might be necessary on school pc
    - tester.sh also installs something
2. "npx playwright codegen" to create tests. It will record clicks and filled in texts as code. Add assertions manually or with codegen browser tools.
3. Copy paste the code into tester/e2e/<name>.spec.js
4. Utils can go to e2e/utils.js
5. "npx playwright test" starts tester when app is running
6. Utils has random username generator.
