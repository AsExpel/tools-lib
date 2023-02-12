/**
 * Created by PanJiaChen on 16/11/18.
 */

let isFireFox = navigator.userAgent.indexOf('Firefox') > -1;
/**
 * Parse the time to string
 * @param {(Object|string|number)} time
 * @param {string} cFormat
 * @returns {string | null}
 */
export function parseTime(time, cFormat) {
  // console.log(time, '------>time')
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string')) {
      if ((/^[0-9]+$/.test(time))) {
        // support "1548221490638"
        time = parseInt(time)
      } else {
        if (isFireFox) {
          // support firefox
          time = time.replace(new RegExp(/\//gm), '-')
        } else {
          // support safari
          // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
          time = time.replace(new RegExp(/-/gm), '/')
        }
      }
    }

    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
    const value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value ] }
    return value.toString().padStart(2, '0')
  })
  return time_str
}

const SECOND_AN_HOUR = 3600
const SECOND_A_DAY = 24 * SECOND_AN_HOUR
/**
 * 秒转换为时间字符串
 * @param s {number}
 * @param options {{filterZero: boolean, format: string[]}}
 * @returns {string}
 */
export function secondToDate(s = 0, options = {filterZero: false, format: ['{h}小时', '{i}分钟', '{s}秒']}) {
  const {filterZero = false, format = ['{h}小时', '{i}分钟', '{s}秒']} = options;
  const timeMap = {
    d: Math.floor(s / SECOND_A_DAY).toFixed(),
    h: Math.floor((format.indexOf('{d}') > -1 ? (s % SECOND_A_DAY) : s) / SECOND_AN_HOUR).toFixed(),
    i: Math.floor((format.indexOf('{h}') > -1 ? (s % SECOND_AN_HOUR) : s) / 60).toFixed().padStart(2, '0'),
    s: Math.floor(s % 60).toFixed().padStart(2, '0'),
  }
  const result = []
  format.forEach(item => {
    let allowPush = true;
    const itemStr = item.replace(/{([dhis])+}/g, (result, key) => {
      const currentTime = timeMap[key]
      if (filterZero) {
        allowPush = (currentTime !== '0') && (currentTime !== '00')
      }
      return currentTime || ''
    })
    allowPush && result.push(itemStr)
  })
  // console.log('format',format, result)
  return result.join('')
}

/**
 * @param {number} time
 * @param {string} option
 * @returns {string}
 */
export function formatTime(time, option) {
  if (('' + time).length === 10) {
    time = parseInt(time) * 1000
  } else {
    time = +time
  }
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time, option)
  } else {
    return (
      d.getMonth() +
      1 +
      '月' +
      d.getDate() +
      '日' +
      d.getHours() +
      '时' +
      d.getMinutes() +
      '分'
    )
  }
}

/**
 * @param {string} url
 * @returns {Object}
 */
export function getQueryObject(url) {
  url = url == null ? window.location.href : url
  const search = url.substring(url.lastIndexOf('?') + 1)
  const obj = {}
  const reg = /([^?&=]+)=([^?&=]*)/g
  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1)
    let val = decodeURIComponent($2)
    val = String(val)
    obj[name] = val
    return rs
  })
  return obj
}

/**
 * @param {string} input value
 * @returns {number} output value
 */
export function byteLength(str) {
  // returns the byte length of an utf8 string
  let s = str.length
  for (var i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i)
    if (code > 0x7f && code <= 0x7ff) s++
    else if (code > 0x7ff && code <= 0xffff) s += 2
    if (code >= 0xDC00 && code <= 0xDFFF) i--
  }
  return s
}

/**
 * @param {Array} actual
 * @returns {Array}
 */
export function cleanArray(actual) {
  const newArray = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}

/**
 * @param {Object} json
 * @returns {Array}
 */
export function param(json) {
  if (!json) return ''
  return cleanArray(
    Object.keys(json).map(key => {
      if (json[key] === undefined) return ''
      return encodeURIComponent(key) + '=' + encodeURIComponent(json[key])
    })
  ).join('&')
}

/**
 * Merges two objects, giving the last one precedence
 * @param {Object} target
 * @param {(Object|Array)} source
 * @returns {Object}
 */
export function objectMerge(target, source) {
  if (typeof target !== 'object') {
    target = {}
  }
  if (Array.isArray(source)) {
    return source.slice()
  }
  Object.keys(source).forEach(property => {
    const sourceProperty = source[property]
    if (typeof sourceProperty === 'object') {
      target[property] = objectMerge(target[property], sourceProperty)
    } else {
      target[property] = sourceProperty
    }
  })
  return target
}

/**
 * @param {HTMLElement} element
 * @param {string} className
 */
export function toggleClass(element, className) {
  if (!element || !className) {
    return
  }
  let classString = element.className
  const nameIndex = classString.indexOf(className)
  if (nameIndex === -1) {
    classString += '' + className
  } else {
    classString =
      classString.substr(0, nameIndex) +
      classString.substr(nameIndex + className.length)
  }
  element.className = classString
}

/**
 * 生成随机字符串
 * @param e 字符串长度
 * @returns {string}
 */
export function randomString(e) {
  e = e || 32;
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz012345678";
  const a = t.length;
  let n = "";
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n
}

/* 防抖函数 */
// 标记
let canThrottle = {};
// 节流计时器句柄
let throttleHandle = {};
// 默认key
let throttleStoreKey = '';

/**
 * 节流函数 (先执行)
 * @param fn
 * @param delay
 * @param key
 */
export function throttleTool(fn = () => {}, delay = 300, key= '') {
  let usingKey = key
  if (!key) {
    throttleStoreKey = throttleStoreKey || randomString(5);
    usingKey = throttleStoreKey
  }
  // console.log('call throttleTool', {key, usingKey}, canThrottle[usingKey])
  if (!canThrottle[usingKey]) {
    if (typeof fn !== "function") {
      console.warn('fn is not a func in throttleTool')
      return;
    }
    fn.apply(this)
    // console.log('in throttleTool', {key, usingKey})
    canThrottle[usingKey] = true;
    const clearHandle = function () {
      clearTimeout(throttleHandle[usingKey]);
      delete throttleHandle[usingKey];
    }
    if (throttleHandle[usingKey]) {
      clearHandle()
    }
    throttleHandle[usingKey] = setTimeout(() => {
      delete canThrottle[usingKey];
      if (usingKey === throttleStoreKey) throttleStoreKey = '';
      // console.log('done debounceTool', {key, usingKey})
      clearHandle()
    }, delay || 300)
  }
}

// 防抖标记
let canDebounce = {};
// 防抖计时器句柄
let debounceHandle = {};
// 默认key
let debounceStoreKey = '';

/**
 *    防抖函数 debounce (后执行)
 * @param {Function} fn 回调
 * @param {Number} delay 延时
 * @param {String} key
 */
export function debounceTool(fn = () => {}, delay = 300, key= '') {
  let usingKey = key
  if (!key) {
    debounceStoreKey = debounceStoreKey || randomString(5);
    usingKey = debounceStoreKey
  }
  // console.log('call debounceTool', {key, usingKey}, canDebounce[usingKey])
  const clearHandle = function () {
    clearTimeout(debounceHandle[usingKey]);
    delete debounceHandle[usingKey];
  }
  if (!canDebounce[usingKey]) {
    if (typeof fn !== "function") {
      console.warn('fn is not a func in debounceTool')
      return;
    }
    // console.log('in debounceTool', {key, usingKey})
    canDebounce[usingKey] = true;
  }
  if (debounceHandle[usingKey]) {
    clearHandle()
  }
  debounceHandle[usingKey] = setTimeout(() => {
    delete canDebounce[usingKey];
    if (usingKey === debounceStoreKey) debounceStoreKey = '';
    // console.log('done debounceTool', {key, usingKey})
    fn.apply(this)
    clearHandle()
  }, delay || 300)
}


/**
 *  el-form校验失败滚动到对应的错误位置
 */
export function elFormErrorScrollIntoView() {
  // 获取第一个校验错误的元素
  const elements = document.querySelectorAll('.el-form-item__error')
  if(elements && elements.length) {
    const element = elements[0]
    // 滚动到错误元素对应位置
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}

/**
 * 得到一个两数之间的随机整数
 * @param min
 * @param max
 * @param allowBoundary 可随机出边界值
 * @returns {number}
 */
export function randomNumber({min = 0, max = 1, allowBoundary = false }) {
    min = Math.ceil(min);
    max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + (allowBoundary ? 1 : 0))) + min;
}
