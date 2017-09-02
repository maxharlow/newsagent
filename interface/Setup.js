System.transpiler = 'babel'

System.meta['*.json'] = { loader: 'https://unpkg.com/systemjs-plugin-json@0.3.x' }

System.paths['page'] = 'https://unpkg.com/page@1.7.x/page.js'
System.paths['react'] = 'https://unpkg.com/react@15.6.x/dist/react.js'
System.paths['react-dom'] = 'https://unpkg.com/react-dom@15.6.x/dist/react-dom.js'
System.paths['moment'] = 'https://unpkg.com/moment@2.18.x'
System.paths['moment-duration-format'] = 'https://unpkg.com/moment-duration-format@1.3.x'
System.paths['later'] = 'https://unpkg.com/later@1.2.x/later.js'
System.paths['prettycron'] = 'https://cdn.rawgit.com/azza-bazoo/prettycron/master/prettycron.js'

System.import('/Routes.js')
