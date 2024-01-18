const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

const format = require('date-fns/format')

const connectionWithServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}
connectionWithServer()

//API_1

app.get('/todos/', async (request, response) => {
  const p = [`HIGH`, `MEDIUM`, `LOW`]
  const s = [`TO DO`, `IN PROGRESS`, `DONE`]
  const c = [`WORK`, `HOME`, `LEARNING`]

  const z = request.query
  const key = Object.keys(z)

  let queryExec
  let res

  switch (true) {
    case key.length === 1 && key[0] === 'status':
      if (s.includes(z['status'])) {
        queryExec = `
               SELECT * FROM todo WHERE status LIKE '${z['status']}';
            `
      } else {
        res = 'Invalid Todo Status'
      }
      break

    case key.length === 1 && key[0] === 'priority':
      if (p.includes(z['priority'])) {
        queryExec = `
              SELECT * FROM todo WHERE priority='${z['priority']}';
             `
      } else {
        res = 'Invalid Todo Priority'
      }
      break

    case key.length === 2 && ['status', 'priority'].every(i => key.includes(i)):
      if (s.includes(z['status']) && p.includes(z['priority'])) {
        queryExec = `
                 SELECT * FROM todo 
                 WHERE status LIKE '${z['status']}' AND 
                 priority LIKE '${z['priority']}';
            `
      } else if (s.includes(z['status']) == false) {
        res = 'Invalid Todo Status'
      } else {
        res = 'Invalid Todo Priority'
      }
      break

    case key.length === 1 && key[0] === 'search_q':
      queryExec = `
              SELECT * FROM todo WHERE todo LIKE '%${z['search_q']}%';
         `
      break

    case key.length === 2 && ['status', 'category'].every(i => key.includes(i)):
      if (s.includes(z['status']) && c.includes(z['category'])) {
        queryExec = `
                 SELECT * FROM todo 
                 WHERE status LIKE '${z['status']}' AND 
                 category LIKE '${z['category']}';
            `
      } else if (s.includes(z['status']) == false) {
        res = 'Invalid Todo Status'
      } else {
        res = 'Invalid Todo Category'
      }
      break

    case key.length === 1 && key[0] === 'category':
      if (c.includes(z['category'])) {
        queryExec = `
              SELECT * FROM todo WHERE category LIKE '${z['category']}';
          `
      } else {
        res = 'Invalid Todo Category'
      }
      break

    case key.length === 2 &&
      ['priority', 'category'].every(i => key.includes(i)):
      if (p.includes(z['priority']) && c.includes(z['category'])) {
        queryExec = `
                 SELECT * FROM todo 
                 WHERE priority LIKE '${z['priority']}' AND 
                 category LIKE '${z['category']}';
            `
      } else if (p.includes(z['priority']) == false) {
        res = 'Invalid Todo Priority'
      } else {
        res = 'Invalid Todo Category'
      }
      break
  }

  try {
    const resQuery = await db.all(queryExec)
    response.send(resQuery)
  } catch (e) {
    response.status = 400
    response.send(res)
  }
})

//API_2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const singleQuery = `
          SELECT * FROM todo WHERE id=${todoId};
    `
  const resQuery = await db.get(singleQuery)
  response.send(resQuery)
})

//API_3

app.get('/agenda/', async (request, response) => {
  let {date} = request.query
  date = format(new Date(date), 'yyyy-MM-dd')
  const dueQuery = `
        SELECT * FROM todo WHERE due_date ='${date}';
  `
  const resDueDate = await db.all(dueQuery)
  response.send(resDueDate)
})

//API_4

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const createQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');
  `
  const resCreatedQuery = await db.run(createQuery)
  response.send('Todo Successfully Added')
})

//API_5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const t = request.body
  const key = Object.keys(t)

  let updQuery
  let result

  switch (true) {
    case key.length === 1 && key[0] === 'status':
      updQuery = `
            UPDATE todo SET status='${t['status']}' WHERE id=${todoId};
         `
      result = 'Status Updated'
      break

    case key.length === 1 && key[0] === 'priority':
      updQuery = `
            UPDATE todo SET priority='${t['priority']}' WHERE id=${todoId};
            `
      result = 'Priority Updated'
      break

    case key.length === 1 && key[0] === 'todo':
      updQuery = `
            UPDATE todo SET todo='${t['todo']}' WHERE id=${todoId};
            `
      result = 'Todo Updated'
      break

    case key.length === 1 && key[0] === 'category':
      updQuery = `
            UPDATE todo SET category='${t['category']}' WHERE id=${todoId};
            `
      result = 'Category Updated'
      break

    case key.length === 1 && key[0] === 'dueDate':
      const updDate = format(new Date(t['dueDate']), 'yyyy-MM-dd')
      updQuery = `
            UPDATE todo SET due_date='${t['dueDate']}' WHERE id=${todoId};
            `
      result = 'Due Date Updated'
      break
  }
  const updRes = await db.run(updQuery)
  response.send(result)
})

//API_6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const delQuery = `
      DELETE FROM todo WHERE id=${todoId};
  `
  const delRun = await db.run(delQuery)
  response.send('Todo Deleted')
})

module.exports = app
