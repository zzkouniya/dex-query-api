import fs from 'fs'
import path from 'path'
import 'reflect-metadata'
import { container, modules } from './container'
import { DexLogger } from '../component'

export default class Bootstrap {
  private readonly logger: DexLogger = new DexLogger(Bootstrap.name)

  #ready = false

  async bootstrap (): Promise<void> {
    if (!this.#ready) {
      try {
        await this.register()
        this.#ready = true
      } catch (err) {
        this.logger.error(err)
      }
    }
  }

  private readFileList (dir: string, filesList: string[] = []): string[] {
    const files = fs.readdirSync(dir)
    // console.log(files);
    files.forEach((item) => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        this.readFileList(path.join(dir, item), filesList)
      } else {
        filesList.push(fullPath)
      }
    })
    return filesList
  }

  private async register (): Promise<void> {
    // const modulesDir = path.join(__dirname, 'modules');
    const modulesDir = path.resolve(__dirname, '../modules')
    const modulePaths: string[] = []
    this.readFileList(modulesDir, modulePaths)

    for (const modulePath of modulePaths) {
      if (modulePath.lastIndexOf('map') !== -1) {
        continue
      }

      await this.registerModule(modulePath)
    }
  }

  private async registerModule (modulePath: string): Promise<void> {
    try {
      const { default: m } = await import(modulePath)

      modules[m.name] = Symbol(m.name)
      container.bind(modules[m.name]).to(m)
      // eslint-disable-next-line no-template-curly-in-string
      this.logger.debug('\x1b[36m${m.name}\x1b[0m is loaded')
    } catch (error) {
      console.log(modulePath)
      this.logger.error(error)
    }
  }
}
