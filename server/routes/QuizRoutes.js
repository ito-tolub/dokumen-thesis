import express from "express";

import {
  getCourseQuizzes,
  getQuiz,
  submitQuiz,
} from "../controllers/quizController.js";

const quizRouter = express.Router();

quizRouter.get("/course/:courseId", getCourseQuizzes);
quizRouter.get("/:quizId", getQuiz);
quizRouter.post("/:quizId/submit", submitQuiz);

export default quizRouter;