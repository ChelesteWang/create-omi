const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { prompt } = require('enquirer')

const {
    yellow,
    green,
    red
} = require('kolorist')

const renameFiles = {
    _gitignore: '.gitignore'
}

const TEMPLATES = [
    'admin',
    'vite',
    'components'
]

const cwd = process.cwd()
let targetDir = argv._[0]
const defaultProjectName = !targetDir ? 'omi-project' : targetDir

async function init() {
    if (!targetDir) {
        const { name } = await prompt({
            type: "input",
            name: "name",
            message: "Project name:",
            initial: defaultProjectName
        })
        targetDir = name
    } else {
        console.log(green(`your project will created in ${path.join(cwd, targetDir)}`))
    }
    const root = path.join(cwd, targetDir)
    if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true })
    }
    const existing = fs.readdirSync(root)
    if (existing.length) {
        const { yes } = await prompt({
            type: 'confirm',
            name: 'yes',
            initial: 'Y',
            message:
                `Target directory ${targetDir} is not empty.\n` +
                `Remove existing files and continue?`
        })
        if (yes) {
            // emptyDir(root)
            console.log(root)
        } else {
            return
        }
    } else {

    }
    initTemplate()
        .catch((error) => { console.error(error) })
        .then(() => { installDependencies(root) })
        .then(() => console.log(yellow(`Scaffolding project in ${root}...`)))
}

async function initTemplate() {
    let template = argv.t || argv.template
    if (!template) {
        const { t } = await prompt({
            type: "select",
            name: "t",
            message: "Select a template:",
            choices: TEMPLATES
        })
        template = yellow(t)
        const templateDir = path.join(__dirname, `template-${template}`)
    }
}

async function installDependencies(root) {
    console.log(`\nDone. Now run:\n`)
    if (root !== cwd) {
        console.log(`cd ${path.relative(cwd, root)}`)
    }
    console.log(`npm install (or \`yarn\`)`)
    console.log(`npm run dev (or \`yarn dev\`)`)
}

init().catch((error) => {
    console.error(error)
})

function copyDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
    }
}

function copy(src, dest) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        copyDir(src, dest)
    } else {
        fs.copyFileSync(src, dest)
    }
}

function emptyDir(dir) {
    if (!fs.existsSync(dir)) {
        return
    }
    for (const file of fs.readdirSync(dir)) {
        const abs = path.resolve(dir, file)
        if (fs.lstatSync(abs).isDirectory()) {
            emptyDir(abs)
            fs.rmdirSync(abs)
        } else {
            fs.unlinkSync(abs)
        }
    }
}

