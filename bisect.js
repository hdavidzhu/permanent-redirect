// Quickly find the what the latest generated link is by using a combination of
// bisecting and linearly trying the latest links. All links are generated via
// a timestamp.

const request = require('request-promise')

// Use the cache to reduce the amount of pinginng we need to do for the server
const cache = new Map()

var failCount = 0

function setCache(time, success) {
  if (success == true) {
    console.log(time)
    failCount = 0
  }
  failCount += 1

  // After some time, kill the script b/c there are no more valid links
  if (failCount > 100) process.exit()

  cache.set(time, success)
}

// @param currentTime {Number} secs
// @param futureTime {Number} secs
// @param now {Number} secs
async function getPage(currentTime, futureTime, now) {
  try {
    await getHtml(futureTime)
    setImmediate(getPage, futureTime, now, now)
  } catch (err) {
    const halfTime = Math.floor(((futureTime - currentTime) / 2) + currentTime)
    if (currentTime == halfTime) {
      const nextTime = await keepGettingNextHtml(currentTime + 1)
      return setImmediate(getPage, nextTime, now, now)
    }
    setImmediate(getPage, currentTime, halfTime, now)
  }
}

// Linearly attempt to find the next valid link
async function keepGettingNextHtml(time) {
  try {
    await getHtml(time)
    return time
  } catch (err) {
    return await keepGettingNextHtml(time + 1)
  }
}

async function getHtml(time) {
  try {
    if (cache.get(time) === false) {
      throw new Error('Already failed before')
    }
    const html = await request.get(`https://permanent-redirect.xyz/pages/${time}`)
    if (html.indexOf('$hits') > 0) {
      throw new Error('Not our page')
    }
    setCache(time, true)
    return html
  } catch (err) {
    setCache(time, false)
    throw err
  }
}

const now = Math.floor(Date.now() / 1000)
getPage(1515208561, now, now)
