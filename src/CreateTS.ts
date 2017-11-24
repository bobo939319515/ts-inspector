import IFunction from './IFunction'
import IClass from './IClass'
import IProp from './IProp'
import IConstuctor from './IConstructor'
import File from '../../src/node/MFile'
import * as fs from 'fs-extra'
import config from './config'

interface IPropInner {
    key: string
    val: string
}

interface IDoc {
    name: string
    props: Array<IPropInner>
}

class CreateTS {
    private filePath: string
    constructor(filePath: string) {
        this.filePath = filePath
    }
    createTS() {
        const fileNames = File.getFiles(this.filePath, false, false)
        let tsPath = '../../types/mtime-util.d.ts'
        fs.removeSync(tsPath)
        fs.createFileSync(tsPath)
        let header = 'declare module "@mtime-node-mlibs/live-util-ts" {' + '\n'
        fs.appendFileSync(tsPath, header)
        for (let i = 0; i < fileNames.length; i++) {
            let arr = []
            let name = fileNames[i]
            const whiteList = config.whiteList
            if (whiteList.indexOf(name) > -1) {
                continue
            }
            let json = fs.readJsonSync('./json/' + name + '.json')
            arr.push(this.createClass(json))
            arr.push(this.createConstuctor(json.constructor))
            arr.push(this.createProps(json.properties))
            arr.push(this.createFuns(json.functions))
            arr.push('}')
            fs.appendFileSync(tsPath, arr.join('\n') + '\n')
        }
        fs.appendFileSync(tsPath, '}')
    }
    private createDoc(doc: IDoc, isClass?: boolean) {
        let str1 = '/**' + '\n'
        let str2 = ' * ' + doc.name + '\n'
        let str3 = ''
        if (doc.props) {
            for (let i = 0; i < doc.props.length; i++) {
                let prop = doc.props[i]
                str3 += '\t * @param ' + prop.key + ' ' + prop.val + '\n'
            }
        }
        let str4 = ' */' + '\n'
        let returnStr = ''
        if (isClass) {
            returnStr = str1 + str2 + str3 + str4
        } else {
            returnStr = '\t' + str1 + '\t' + str2 + str3 + '\t' + str4
        }
        return returnStr
    }
    private createConstuctor(con: IConstuctor) {
        if (con.parameters && con.parameters.length === 0) {
            return ''
        }
        let fun = {} as IFunction
        fun.name = 'constructor'
        fun.static = false
        fun.decorate = ''
        fun.returnType = con.returnType
        fun.documentation = con.documentation
        fun.parameters = con.parameters
        return this.createFun(fun)
    }
    private createClass(ci: IClass) {
        let doc = {} as IDoc
        doc.name = ci.documentation
        let str = this.createDoc(doc, true)
        str += `export class ${ci.name} {`
        // let doc = `/** \n * ${ci.documentation}\n */\ndeclare class ${ci.name} {`
        return str
    }
    private createProps(props: Array<IProp>) {
        let arr = []
        for (let i = 0; i < props.length; i++) {
            let prop = props[i]
            let str = this.createProp(prop)
            arr.push(str)
        }
        return arr.join('')
    }
    private createProp(prop: IProp) {
        // static maxAge: number //静态变量
        let doc = {} as IDoc
        doc.name = prop.documentation
        let str1 = this.createDoc(doc)
        let str2 = prop.name + ': ' + prop.type + '\n'
        return str1 + '\t' + str2
    }
    private createFuns(funs: Array<IFunction>) {
        let arr = []
        for (let i = 0; i < funs.length; i++) {
            let fun = funs[i]
            let str = this.createFun(fun)
            arr.push(str)
        }
        return arr.join('')
    }
    /**
     * 创建函数的.d.ts文件
     * @param fun 接口类型
     */
    private createFun(fun: IFunction) {
        if (fun.decorate === 'private') {
            return ''
        }
        let doc = {} as IDoc
        doc.name = fun.documentation
        let params = []
        for (let i = 0; i < fun.parameters.length; i++) {
            let param = fun.parameters[i]
            let interParam = {} as IPropInner
            interParam.key = param.name
            interParam.val = param.documentation
            params.push(interParam)
        }
        doc.props = params

        let paramFun = []
        for (let i = 0; i < fun.parameters.length; i++) {
            let param = fun.parameters[i]
            paramFun.push(param.name + ': ' + param.type)
            if (i < fun.parameters.length - 1) {
                paramFun.push(', ')
            }
        }

        // 拼接规则参照本方法注释
        let str1 = this.createDoc(doc)
        let isStatic = fun.static ? 'static ' : ''
        let str2 =
            '\t' +
            isStatic +
            fun.name +
            '(' +
            paramFun.join('') +
            '): ' +
            fun.returnType +
            '\n'

        return str1 + str2
    }
}

export default CreateTS