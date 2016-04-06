const Process = require('process')
const Babel = require('babel-register')

Babel({
    plugins: [
        'transform-es2015-modules-commonjs',
        'transform-async-to-generator'
    ]
})

const Routes = require('./Routes')
const Runner = require('./Runner')

const args = Process.argv.slice(2)
const filename = args[0]

Runner.setup(filename)
Routes.listen()
