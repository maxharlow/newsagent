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
const command = args[0]
const filename = args[1]

if (command === 'setup') Runner.setup(filename)
else if (command === 'serve') {
    Runner.schedule(filename)
    Routes.listen()
}
