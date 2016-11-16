System.transpiler = 'babel'

System.meta['*.json'] = { loader: '//cdn.rawgit.com/systemjs/plugin-json/master/json.js' }

System.paths['page'] = '//cdnjs.cloudflare.com/ajax/libs/page.js/1.7.1/page.min.js'
System.paths['react'] = '//cdnjs.cloudflare.com/ajax/libs/react/15.3.2/react.js'
System.paths['react-dom'] = '//cdnjs.cloudflare.com/ajax/libs/react/15.3.2/react-dom.js'
System.paths['moment'] = '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.16.0/moment.min.js'
System.paths['later'] = '//cdnjs.cloudflare.com/ajax/libs/later/1.2.0/later.min.js'
System.paths['prettycron'] = '//cdn.rawgit.com/azza-bazoo/prettycron/master/prettycron.js'

System.import('/Routes.js')
