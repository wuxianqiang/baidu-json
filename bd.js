const request = require('request');
const url = 'https://mp.jd.com/docs/dev/component/view/view.html'
const fs = require('fs')


const keys = {
  'view_cover-image': 'cover-image',
  'view_movable-area': 'movable-area',
  'view_movable-view': 'movable-view',
  'view_scroll-view': 'scroll-view',
  'view_swiper': 'swiper',
  'view_swiper-item': 'swiper-item',
  'view_view': 'view',
  'base_icon': 'icon',
  'base_progress': 'progress',
  'base_rich-text': 'rich-text',
  'base_text': 'text',
  'formlist_button': 'button',
  'formlist_checkbox': 'checkbox',
  'formlist_checkbox-group': 'checkbox-group',
  'formlist_form': 'form',
  'formlist_input': 'input',
  'formlist_label': 'label',
  'formlist_picker': 'picker',
  'formlist_picker-view': 'picker-view',
  'formlist_picker-view-column': 'picker-view-column',
  'formlist_radio': 'radio',
  'formlist_radio-group': 'radio-group',
  'formlist_slider': 'slider',
  'formlist_switch': 'switch',
  'formlist_textarea': 'textarea',
  'nav': 'navigator',
  'tabs': 'tabs',
  'tab-item': 'tab-item',
  'animation-video': 'animation-video',
  'animation-view-Lottie': 'animation-view',
  'media_audio': 'audio',
  'media_camera': 'camera',
  'media_ar-camera': 'ar-camera',
  'media_image': 'image',
  'media_live-player': 'live-player',
  'media_video': 'video',
  'media_rtc-room': 'rtc-room',
  'media_rtc-room-item': 'rtc-room-item',
  'map': 'map',
  'canvas': 'canvas',
  'ad': 'ad',
  'open': 'open-data',
  'open_web-view': 'web-view',
  // 'extended/component-content/like': 'like',
  // 'extended/component-content/follow-swan': 'follow-swan',
  // 'extended/component-content/interaction': 'swan-interaction',
  // 'extended/component-content/comment-list': 'comment-list',
  // 'extended/component-content/comment-detail': 'comment-detail',
  // 'extended/component-content/editor': 'editor',
}

async function toJson () {
  let requestList = []
  for (const key in keys) {
    requestList.push(handleRequest(key, keys[key]))
  }
  let result = await Promise.all(requestList)
  result = result.filter(item => Boolean(item))
  fs.writeFileSync('bd.json', JSON.stringify(result))
  console.log('写入完成')
}

toJson()

function handleRequest (key, realKey) {
  return new Promise((resolve, reject) => {
    let url = formKeyToUrl(key)
    request(url, (err, response, body) => {
      if (err) {
        reject({})
      }
      let item = {}
      let data = JSON.parse(body).data.content
      // // let html = body.split('page-meta\n')[1]
      // // let content = html.split('\n')[0]
      // let reg = /<main.*?>([\s\S]*?)<\/main>/
      // let section = reg.exec(body)[0]
      // // let tbody = /<tbody.*?>([\s\S]*?)<\/tbody>/
      // let tip = /<h\d.*?>[\s\S]*?<\/h\d>/

      // let list = section.replace(/<pre.*?>([\s\S]*?)<\/pre>/, '').split(tip)
      // let table = list.find(current => current.includes('<table>'))
      // if (table) {
      //   // let table = reg.exec(desc)[1]
      //   // let body = tbody.exec(table)[1]
      //   let tableList = formTableToJson(table)
      //   item.tableList = tableList
      // }
      // console.log(data)
      if (!data.params) {
        resolve()
        return
      }
      let list = {}
      let {header, cells} = data.params[0].tableList[0].tableContent
      cells.forEach(cell => {
        let row = []
        cell.forEach((attr, index) => {
          row.push(`${header[index]}：${handleText(attr)}`)
        })
        list[cell[0]] = row
      })
      // console.log(data.params[0].tableList[0].tableContent)
      let descriptList = formPtoJson(data.explaintion)
      item.descriptList = descriptList
      item.tableList = list
      resolve({[realKey]: item})
    })
  })
}

function formKeyToUrl (key) {
  // return `https://microapp.bytedance.com/docs/zh-CN/mini-app/develop/component/view-container/view/`
  return `https://smartprogram.baidu.com/forum/api/docs_detail?path=/develop/component/${key}`
}

function formTableToJson (table) {
  let td = /<td.*?>([\s\S]*?)<\/td>/g
  let tr = /<tr.*?>([\s\S]*?)<\/tr>/g
  let link = /<a.*?>([\s\S]*?)<\/a>/
  let result = {}
  let flag = false
  table.replace(tr, (...args) => {
    if (!flag) {
      flag = true
      return
    }
    let list = []
    args[1].replace(td, (...args) => {
      let val = args[1].replace('<span></span>', '')
      if (link.test(val)) {
        val = link.exec(val)[1]
      }
      list.push(val)
    })
    let [
      attr = '',
      type = '',
      defaultValue = '',
      reqired = '',
      explain = '',
      edition = ''
    ] = list
    result[attr] = [
      `属性：${attr}`,
      `类型：${type}`,
      `默认值：${handleText(defaultValue)}`,
      `必填：${reqired}`,
      `说明：${handleText(explain)}`,
      `最低版本：${edition}`
    ]
  })
  return result
}

function formPtoJson (desc) {
  // let p = /<p.*?>([\s\S]*?)<\/p>/g
  let descList = []
  // desc.replace(p, (...args) => {
  //   let val = handleText(args[1])
  //   descList.push(val)
  // })
  let val = handleText(desc)
  descList.push(val)
  return descList
}

function handleText (text) {
  let link = /<a.*?>([\s\S]*?)<\/a>/g
  let code = /<code.*?>([\s\S]*?)<\/code>/g
  let strong = /<strong.*?>([\s\S]*?)<\/strong>/g
  let span = /<span.*?>([\s\S]*?)<\/span>/g
  text = text.replace(/&quot;/g, '')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&#x27;/g, '')
  if (link.test(text)) {
    text = text.replace(link, (...args) => {
      return args[1]
    })
  }
  if (code.test(text)) {
    text = text.replace(code, (...args) => {
      return `\`${args[1].replace(/\s+/g, ' ')}\``
    })
  }
  if (strong.test(text)) {
    text = text.replace(strong, (...args) => {
      return `**${args[1]}**`
    })
  }
  if (span.test(text)) {
    text = text.replace(span, (...args) => {
      return `${args[1]}`
    })
  }
  text = text.replace(/<p>/g, '')
  return text
}