
import {exec} from 'child_process'

export function executeCommand(cmd, args, cwd = ''):Promise<any> {
  const out = {
    stdStr: '',
    errStr: '',
    retcode: 0
  }
  return  new Promise(resolve => {
    let cmdstr = cmd + ' ' + args.join(' ')
    const proc = exec(cmdstr, {cwd})
    proc.stdout.on('data', data => {
      out.stdStr += data.toString()
    })
    proc.stderr.on('data', data => {
      out.errStr += data.toString()
    })
    proc.on('error', error => {
      console.error(error)
      if(!out.errStr) out.errStr = error.message
      out.retcode = -1
      resolve(out)
    })
    proc.on('close', code => {
      out.retcode = code
      resolve(out)
    })
  })
}
