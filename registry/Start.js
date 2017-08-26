const Babel = require('babel-register')

Babel({
    plugins: [
        'transform-es2015-modules-commonjs'
    ]
})

const Routes = require('./Routes')

Routes.listen()
