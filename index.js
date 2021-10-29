const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { prompt } = require('enquirer')

const { log, error, success, info } = require('./log')
const { TEMPLATES } = require('./templates')

const renameFiles = {
    _gitignore: '.gitignore'
}

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
        success(`your project will created in ${path.join(cwd, targetDir)}`)
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
            log(root)
        } else {
            return
        }
    }
    chooseTemplate()
        .then(() => { copyTemplate() })
        .then(() => { installDependencies(root) })
        .then(() => info(`Scaffolding project in ${root}...`))
        .catch((err) => { error(err) })
}

async function chooseTemplate() {
    let template = argv.t || argv.template
    if (!template || !TEMPLATES.includes(template)) {
        const { t } = await prompt({
            type: "select",
            name: "t",
            message: "Select a template:",
            choices: TEMPLATES
        })
        template = t
        const templateDir = path.join(__dirname, `template/${template}`)
    } else {
        log(`Template will choose ${template}`)
    }
    success(`your project will created in ${path.join(cwd, targetDir)}`)
}

async function copyTemplate() {
    const files = fs.readdirSync(templateDir)
    const write = (file, content) => {
        const targetPath = renameFiles[file]
            ? path.join(root, renameFiles[file])
            : path.join(root, file)
        if (content) {
            fs.writeFileSync(targetPath, content)
        } else {
            copy(path.join(templateDir, file), targetPath)
        }
    }
    for (const file of files.filter((f) => f !== 'package.json')) {
        write(file)
    }
    const pkg = require(path.join(templateDir, `package.json`))
    pkg.name = path.basename(root)
    write('package.json', JSON.stringify(pkg, null, 2))
}

async function installDependencies(root) {
    log(`\nDone. Now run:\n`)
    if (root !== cwd) {
        log(`cd ${path.relative(cwd, root)}`)
    }
    log(`npm install (or \`yarn\`)`)
    log(`npm run dev (or \`yarn dev\`)`)
}

init().catch((err) => {
    error(err)
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

