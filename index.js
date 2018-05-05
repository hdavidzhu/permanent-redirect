const cheerio = require('cheerio')
const request = require('request-promise')

const STARTING_URL = 'https://permanent-redirect.xyz/pages/1515229822'

async function getPage(url) {
  const html = await request.get(url)
  const $ = cheerio.load(html)
  const nextUrl = getUrl($)
  const creationDate = getDate($)
  const visitorCount = getVisitorCount($)
  console.log(nextUrl, visitorCount, creationDate)
  setImmediate(getPage, nextUrl)
}

// @returns {String}
function getUrl($) {
  const localUrl = $('a').attr('href')
  return `https://permanent-redirect.xyz/pages${localUrl.substring(1)}`
}

// @returns {String}
function getDate($) {
  // Substring the part with the Date string
  const dateStr = $('div.meta p').text().substring(29)
  return new Date(dateStr).toISOString()
}

// @returns {Number}
function getVisitorCount($) {
  const resultStr = $('.counter')
    .children()
    .map((i, el) => $(el).attr('src'))
    .get()
    .map((el) => el[7]) // Where the number is in the img url
    .join('')
  return Number(resultStr)
}

getPage(STARTING_URL)
