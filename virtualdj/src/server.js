'use strict'

import Hapi from 'hapi'
import Inert from 'inert'
import Vision from 'vision'
import HapiSwagger from 'hapi-swagger'
import Joi from 'joi'
import Boom from 'boom'
import uuid from 'uuid'
import mongoose from 'mongoose'

import Song, { JoiSongSchema } from './models/song'

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
  handler: async (request, h) => {
    return (await Song.find()).map(x => x.present())
  },
  options: {
    description: 'Get a list of all songs in the database',
    tags: ['api'],
    response: {
      schema: Joi.array().items(JoiSongSchema),
    },
  },
})

server.route({
  method: 'POST',
  path: '/song',
  handler: async (request, h) => {
    // TODO: Validation of file type, etc
    // TODO: Deal with the song file upload
    const { songTitle, songArtist } = request.payload
    console.log(`Title: ${songTitle}\nArtist: ${songArtist}`)
    const id = uuid.v1()
    const newSong = new Song({
      _id: id,
      name: songTitle,
      artist: songArtist,
      filePath: '',
      numberOfPlays: 0,
    })
    await newSong.save()
    return newSong.present()
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
    response: {
      schema: JoiSongSchema,
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

const url = 'mongodb://mongo_db/virtualdj'
mongoose.connect(url, {
  useNewUrlParser: true,
})
mongoose.connection.once('open', () => {
  console.log('connected to database')
  start()
})
