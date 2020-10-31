const GEO_KEY = '2XRBZ-SWY66-YV7ST-M4YOG-HLQYQ-DSFDM'

// 获取IP定位URL
const tencentLocationURL = 'https://apis.map.qq.com/ws/location/v1/ip' 

// 解析地址URL
const parseAddressURL = 'https://apis.map.qq.com/ws/geocoder/v1/'

// 距离计算URL
const computeDistanceURL = 'https://apis.map.qq.com/ws/distance/v1/matrix'

/**
 * IP定位
 */
// IP输入框
const ipInputDom = getDom('ipInput') 

/**
 * 地址解析
 */
// 地址解析输入
const addressInputDom = getDom('addressInput') 
// 默认解析地址
const default_parse_address = addressInputDom.value

/**
 * 距离计算
 */
const startInputDom = getDom('startInput')
const endInputDom = getDom('endInput')

// 起点位置
let startPointVal = startInputDom.value
// 终点位置
let endPointVal = endInputDom.value


function getDom(id) {
  return document.getElementById(id)
}

ipInputDom.addEventListener('change', bindIPInputChange)
addressInputDom.addEventListener('change', bindAddressInputChange)
startInputDom.addEventListener('change', bindStartInputChange)
endInputDom.addEventListener('change', bindEndInputChange)


function bindIPInputChange(e) {
  const { value } = e.target
  getIPLocation(value)
}

function bindAddressInputChange(e) {
  const { value } = e.target
  parseAddress(value)
}

function bindEndInputChange(e) {
  const { value } = e.target
  endPointVal = value
  computeDistance(startPointVal, endPointVal)
}

function bindStartInputChange(e) {
  const { value } = e.target
  startPointVal = value
  computeDistance(startPointVal, endPointVal)
}

// 解析地址为经纬度
function parseAddress(val) {
  if (!val) return 

  const url = `${parseAddressURL}?key=${GEO_KEY}&address=${val}`
  return new Promise((resolve, reject) => {
    axios.get(url).then(res => {
      if (res.status == 0 && res.result && res.result.location && res.result.location) {
        const { lat, lng } = res.result.location
        const { city, district, province, street, street_number } = res.result.address_components

        // 赋值解析经纬度
        getDom('parseLatLngResult').innerText = `${lat}, ${lng}`
        // 赋值解析精确地址
        getDom('parseAddressResult').innerText = `${province} ${city} ${district} ${street} ${street_number}`
        resolve({ lat, lng })
      } else {
        reject()
        alert(res.message)
      }
    }).catch(() => {
      reject()
    })
  })
  
}

// 根据IP获取地址
function getIPLocation(ip) {
  return new Promise((resolve, reject) => {
    let _url = `${tencentLocationURL}?key=${GEO_KEY}`
    if (ip) {
      _url += `&ip=${ip}`
    }

    axios.get(_url).then(res => {
      if (res.status == 0 && res.result) {
        const { ip: _ip } = res.result
        // 赋值IP
        getDom('locationIpResult').innerText = _ip || ''

        if (res.result.ad_info) {
          const { ad_info: { nation, province, city, district, adcode } } = res.result
          // 赋值地址
          getDom('locationAddressResult').innerText = `${nation} ${province} ${city} ${district}` || ''
          getDom('locationAdCodeResult').innerText = adcode || ''
         
           
          // 解析地址
          parseAddress(city)
          if (city) {
            // 复制给解析输入框
            addressInputDom.value = city
          }
        }
        if (res.result.location) {
          const { location: { lat, lng } } = res.result
          // 赋值经纬度
          getDom('locationLatLngResult').innerText = (lat && lng) ? `${lat},${lng}` : ``
        }
        
      } else {
        alert(res.message)
      }
      resolve(res)
    }).catch(() => resolve({}))
  })
}

// 获取地址，包括IP和原生接口
function getLocation() {
  let res = {}
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(pos => {
        if (pos && pos.coords && pos.coords.latitude && pos.coords.longitude) {
          res = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
          resolve(res)
        } else {
          getIPLocation().then(resp => resolve(resp))
        }
      }, () => {
        getIPLocation().then(resp => resolve(resp))
        
      })
    } catch (e) {
      getIPLocation().then(resp => resolve(resp))

    }

  })
}

// 计算距离
function computeDistance(startVal, endVal) {
  const mode = 'driving'
  let from = ''
  let end = ''
  parseAddress(startVal).then(res =>{
    const { lat, lng } = res
    from = `${lat},${lng}`
    parseAddress(endVal).then(res2 => {
      const { lat, lng } = res2
      to = `${lat},${lng}`

      const url = `${computeDistanceURL}?mode=${mode}&from=${from}&to=${to}&key=${GEO_KEY}`
      axios.get(url).then(res => {
        if (res.status == 0 && res.result && res.result.rows && res.result.rows[0] && res.result.rows[0].elements && res.result.rows[0].elements[0]) {
          const { distance, duration } = res.result.rows[0].elements[0]
          if (distance > 3000) {
            getDom('distanceResult').innerText = `${Math.round(distance / 1000)} 公里`
          } else {
            getDom('distanceResult').innerText = `${Math.round(distance / 1000)} 米`
          }
        }

      })


    })
  })

}


getIPLocation()
parseAddress(default_parse_address)
computeDistance(startPointVal, endPointVal)


