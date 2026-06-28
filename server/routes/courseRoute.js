import express from 'express'
import { getAllCourses, getCourseId, getCoursePeserta } from '../controllers/courseController.js'

const courseRouter = express.Router()

courseRouter.get('/all', getAllCourses)
courseRouter.get('/:id/peserta', getCoursePeserta)
courseRouter.get('/:id', getCourseId)


export default courseRouter;