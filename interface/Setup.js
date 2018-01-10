System.config({
    map: {
        'systemjs-babel-build': 'https://unpkg.com/systemjs-plugin-babel@0.0.x/systemjs-babel-browser.js',
        'systemjs-plugin-babel': 'https://unpkg.com/systemjs-plugin-babel@0.0.x/plugin-babel.js',
        'systemjs-plugin-json': 'https://unpkg.com/systemjs-plugin-json@0.3.x',
        'page': 'https://unpkg.com/page@1.7.x/page.js',
        'react': 'https://unpkg.com/react@16.2.x/umd/react.development.js',
        'react-dom': 'https://unpkg.com/react-dom@16.2.x/umd/react-dom.development.js',
        'react-dom-factories': 'https://unpkg.com/react-dom-factories@1.0.x',
        'moment': 'https://unpkg.com/moment@2.20.x',
        'moment-duration-format': 'https://unpkg.com/moment-duration-format@2.1.x',
        'later': 'https://unpkg.com/later@1.2.x/later.js',
        'prettycron': 'https://cdn.rawgit.com/azza-bazoo/prettycron/master/prettycron.js'
    },
    transpiler: 'systemjs-plugin-babel',
    meta: {
        '*.json': {
            loader: 'systemjs-plugin-json'
        }
    }
})

System.import('/Routes.js').catch(console.error)
