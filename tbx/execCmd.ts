
import {spawn} from 'child_process'

export function executeCommand(cmd, args, cwd, silent=false):Promise<any> {
  return  new Promise(resolve => {
    const proc = spawn(cmd, args, {cwd})
    proc.stdout.on('data', data => {
      if(silent) return
      const str = data.toString().trim()
      console.log(str)
    })
    proc.stderr.on('data', data => {
      if(silent) return
      const str = data.toString().trim()
      console.error(str)
    })
    proc.on('error', error => {
      console.error(error)
      resolve(-1)
    })
    proc.on('close', code => {
      resolve(code)
    })
  })
}
