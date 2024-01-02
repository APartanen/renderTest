const express = require('express')
const app = express()
let morgan  = require("morgan");
const cors = require('cors')
require('dotenv').config()
const Person = require('./models/person')

//Stackoverflow https://stackoverflow.com/questions/23494956/how-to-use-morgan-logger
morgan.token('postData', (request) => {
  if (request.method == 'POST') return ' ' + JSON.stringify(request.body);
  else return ' ';
});

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :postData'
  )
);

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {    
    return response.status(400).json({ error: error.message })  
  }

  next(error)
}

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
  .then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
  .then(result => {
    response.status(204).end()
  })
  .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const updatedPerson = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, updatedPerson , { new: true,runValidators: true, context: 'query' })
    .then(responsePerson => {
      response.json(responsePerson)
    })
    .catch(error => next(error))
})


app.post('/api/persons', (request, response, next) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({ 
      error: 'name or number missing from request body' 
    })
  }
  
  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
  .catch(error => next(error))
})

app.get('/info', (req, res) => {
  Person.find({}).then(result => {
    res.send(`<div> <p>Phonebook has info for ${result.length} people</p> <p>${new Date()} </p> </div>`)
  })
  .catch(error => next(error))
})

  
app.get('/api/persons', (req, res, next) => {
  Person.find({}).then(result => {
    res.json(result)
  })
  .catch(error => next(error))
})

//Place as last app.use so the errors are routed to it by next
app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})