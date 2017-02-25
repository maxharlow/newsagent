System.transpiler = 'babel'

System.meta['*.json'] = { loader: 'https://cdnjs.cloudflare.com/ajax/libs/systemjs-plugin-json/0.2.2/json.min.js' }

System.paths['page'] = 'https://cdnjs.cloudflare.com/ajax/libs/page.js/1.7.1/page.min.js'
System.paths['react'] = 'https://cdnjs.cloudflare.com/ajax/libs/react/15.4.1/react.js'
System.paths['react-dom'] = 'https://cdnjs.cloudflare.com/ajax/libs/react/15.4.1/react-dom.js'
System.paths['moment'] = 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.16.0/moment.min.js'
System.paths['moment-duration-format'] = 'https://cdnjs.cloudflare.com/ajax/libs/moment-duration-format/1.3.0/moment-duration-format.min.js'
System.paths['later'] = 'https://cdnjs.cloudflare.com/ajax/libs/later/1.2.0/later.min.js'
System.paths['prettycron'] = 'https://cdn.rawgit.com/azza-bazoo/prettycron/master/prettycron.js'

System.import('/Routes.js')
