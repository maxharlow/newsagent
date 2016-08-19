System.transpiler = 'babel'

System.meta['*.json'] = { loader: '//cdn.rawgit.com/systemjs/plugin-json/master/json.js' }

System.paths['page'] = '//cdnjs.cloudflare.com/ajax/libs/page.js/1.7.1/page.min.js'
System.paths['react'] = '//cdnjs.cloudflare.com/ajax/libs/react/15.3.0/react.min.js'
System.paths['react-dom'] = '//cdnjs.cloudflare.com/ajax/libs/react/15.3.0/react-dom.min.js'
System.paths['moment'] = '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.14.1/moment.min.js'
System.paths['later'] = '//cdnjs.cloudflare.com/ajax/libs/later/1.2.0/later.min.js'
System.paths['prettycron'] = 'https://cdn.rawgit.com/azza-bazoo/prettycron/master/prettycron.js'

System.import('/Routes.js')
