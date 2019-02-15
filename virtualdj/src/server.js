'use strict'

import Hapi from 'hapi'
import Inert from 'inert'
import Vision from 'vision'
import HapiSwagger from 'hapi-swagger'
import Joi from 'joi'
import Boom from 'boom'
import uuid from 'uuid'

import redis from 'redis'
import { promisify } from 'util'

const paths = {
  song_directory: '/home/user/music/',
  static_folder_path: '../static/',
}

const server = Hapi.server({
  host: '0.0.0.0',
  port: 8080,
})

const swaggerOptions = {
  info: {
    title: 'Virtual DJ API Documentation',
    version: '0.1.0',
  },
}

server.route({
  method: 'GET',
  path: '/songs',
  handler: async function(request, h) {
    let res = await getAsync('songs')
    if (!res) {
      res = {}
    }
    return res
  },
  options: {
    description: 'Get a list of all songs in the database',
    tags: ['api'],
  },
})

server.route({
  method: 'POST',
  path: '/song',
  handler: async function(request, h) {
    // TODO: Validation of file type, etc
    // TODO: Deal with the song file upload
    const { songTitle, songArtist } = request
    const id = uuid.v1()
    let data = {
      id,
      title: songTitle,
      artist: songArtist,
    }
    let songs = await getAsync('songs')
    if (!songs) {
      songs = {}
    }
    songs[id] = data
    await setAsync('songs', songs)
    return data
  },
  config: {
    plugins: {
      'hapi-swagger': {
        payloadType: 'form',
      },
    },
    tags: ['api'],
    validate: {
      payload: {
        songTitle: Joi.string()
          .required()
          .description('The title of the song'),
        songArtist: Joi.string()
          .required()
          .description('The artist'),
        file: Joi.any()
          .meta({ swaggerType: 'file' })
          .required()
          .description('The song file'),
      },
    },
    payload: {
      maxBytes: 1048576,
      output: 'file',
      allow: 'multipart/form-data',
    },
  },
})

const start = async function() {
  try {
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: swaggerOptions,
      },
    ])
    await server.start()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server running at:', server.info.uri)
}

const client = redis.createClient(process.env.REDIS_URL)
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)

client.on('connect', function() {
  console.log('Redis client connected')
  start()
})

client.on('error', function(err) {
  console.error('Something went wrong ' + err)
})
