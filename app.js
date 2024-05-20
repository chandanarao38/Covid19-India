const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
module.exports = app

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const resultFunc1 = item => {
  return {
    stateId: item.state_id,
    stateName: item.state_name,
    population: item.population,
  }
}

const resultfunc2 = item => {
  return {
    stateId: item.state_id,
    stateName: item.state_name,
    population: item.population,
  }
}
const resultFunc3 = item => {
  return {
    districtId: item.district_id,
    districtName: item.district_name,
    stateId: item.state_id,
    cases: item.cases,
    cured: item.cured,
    active: item.active,
    deaths: item.deaths,
  }
}

//API 1
app.get('/states/', async (request, response) => {
  const getStateQuery = `
    SELECT *
    FROM State`
  const result = await db.all(getStateQuery)
  console.log(result.map(item => resultFunc1(item)))
  response.send(result.map(item => resultFunc1(item)))
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT *
  FROM State
  WHERE state_id = ${stateId}`
  const result = await db.get(getStateQuery)
  console.log(result)
  response.send(resultfunc2(result))
})

//API 3
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
  INSERT INTO 
    District(district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})
  `
  const dbResponse = await db.run(addDistrictQuery)
  const districtId = dbResponse.lastId
  console.log(dbResponse)
  response.send('District Successfully Added')
})

//API 4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT * 
  FROM District
  WHERE district_id = ${districtId}
  `
  const result = await db.get(getDistrictQuery)
  console.log(resultFunc3(result))
  response.send(resultFunc3(result))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM District
    WHERE district_id = ${districtId}
    `
  await db.run(deleteDistrictQuery)
  console.log('District Removed')
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
    UPDATE District
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE district_id = ${districtId}
  `
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
  console.log('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatQuery = `
  SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM District
  WHERE state_id = ${stateId}
  `
  const result = await db.get(getStatQuery)
  console.log(result)
  response.send({
    totalCases: result['SUM(cases)'],
    totalCured: result['SUM(cured)'],
    totalActive: result['SUM(active)'],
    totalDeaths: result['SUM(deaths)'],
  })
})

//API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    SELECT state_id FROM District
    WHERE district_id = ${districtId};
    `
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)

  const getStateNameQuery = `
    SELECT state_name as stateName FROM state
    WHERE state_id = ${getDistrictIdQueryResponse.state_id};
    `
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
  console.log(getStateNameQueryResponse)
})
