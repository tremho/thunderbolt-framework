
import {gatherInfo} from './gatherInfo'
const fs = require('fs')
const path = require('path')

let pages, appRiotFile

export function makePageList() {
    const info = gatherInfo()
    info.projPath
    pages = path.resolve(path.join(info.projPath, 'src', 'pages'))
    appRiotFile = path.resolve(path.join(info.fwcomp, 'global', 'main', 'app.riot'))
    const list = enumerateRiotPages()
    createAppRiot(list)
}

// ------------------

const appRiotTemplate =
    `
<app>
    <div bind="!page.navInfo">
$$$PageList$$$
    </div>
    <style>
    </style>
    <script>
      import {newCommon} from 'Framework/app-core/ComCommon'
      let cm;
      export default {
        onMounted(props, state) {
          cm = newCommon(this)
          cm.bindComponent()
        },
        onBeforeUpdate(props, state) {
          console.log('App Page Context Updating', this.b('navInfo.pageId'))              
        }
      }
    </script>
</app>
  
`

function enumerateRiotPages() {
    const pageOut = []
    const dirents = fs.readdirSync(pages, {withFileTypes:true})
    dirents.forEach(dirent => {
        const name = dirent.name
        const did = name.lastIndexOf('.')
        if(did !== -1) {
            const ext = name.substring(did)
            if(ext === '.riot') {
                const pageName = name.substring(0, did)
                let di = pageName.indexOf('-page')
                if(di !== -1) {
                    const pageId = pageName.substring(0, di)
                    if(fs.existsSync(path.join(pages, pageName+'.ts'))) { // we must have a code page too
                        pageOut.push(pageId)
                    }
                } else {
                    console.warn(`non-page .riot file "${name}" found in "pages" folder`)
                }
            }
        }
    })
    return pageOut
}
function createAppRiot(pageList = []) {
    let pagegen = ''
    pageList.forEach(pageId => {
        pagegen += `        <${pageId}-page if="{((this.bound||{}).navInfo||{}).pageId === '${pageId}'}"/>\n`
    })
    pagegen = pagegen.substring(0, pagegen.length-1) // take off the last \n
    let src = appRiotTemplate.replace('$$$PageList$$$', pagegen)
    fs.writeFileSync(appRiotFile, src)
    console.log('app.riot written to ' + appRiotFile)
}

