const Babel = require('babel-register')

Babel({
    plugins: [
        'transform-es2015-modules-commonjs',
        'transform-async-to-generator'
    ]
})

const Routes = require('./Routes')

Routes.listen()
