import mongoose from 'mongoose'
import { Schema, model } from 'mongoose'
import Joi from 'joi'

const SongSchema = new Schema({
  _id: String,
  name: String,
  artist: String,
  filePath: String,
  numberOfPlays: Number,
})

SongSchema.method('present', function() {
  return {
    _id: this._id,
    name: this.name,
    artist: this.artist,
    numberOfPlays: this.numberOfPlays,
  }
})

export default model('Song', SongSchema)

export const JoiSongSchema = Joi.object().keys({
  _id: Joi.string()
    .uuid()
    .required(),
  name: Joi.string(),
  artist: Joi.string(),
  numberOfPlays: Joi.number().min(0),
})
