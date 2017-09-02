System.config({
    map: {
        'systemjs-babel-build': 'https://unpkg.com/systemjs-plugin-babel@0.0.x/systemjs-babel-browser.js',
        'systemjs-plugin-babel': 'https://unpkg.com/systemjs-plugin-babel@0.0.x/plugin-babel.js',
        'systemjs-plugin-json': 'https://unpkg.com/systemjs-plugin-json@0.3.x',
        'page': 'https://unpkg.com/page@1.7.x/page.js',
        'react': 'https://unpkg.com/react@15.6.x/dist/react.js',
        'react-dom': 'https://unpkg.com/react-dom@15.6.x/dist/react-dom.js',
        'moment': 'https://unpkg.com/moment@2.18.x',
        'moment-duration-format': 'https://unpkg.com/moment-duration-format@1.3.x',
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
