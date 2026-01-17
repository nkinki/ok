import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, AuthenticatedRequest } from '../../utils/middleware'
import { MockGameRoomRepository, MockGameQuestionRepository } from '../../../services/mockGameDatabase'
import { ExerciseType } from '../../../types'

export default async function roomExercisesHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const { id } = req.query
  const teacher = req.teacher!

  if (typeof id !== 'string') {
    res.status(400).json({ message: 'Érvénytelen verseny azonosító' })
    return
  }

  try {
    // Check if room exists and belongs to teacher
    const room = await MockGameRoomRepository.findById(id)
    if (!room) {
      res.status(404).json({ message: 'Verseny nem található' })
      return
    }

    if (room.teacherId !== teacher.id) {
      res.status(403).json({ message: 'Nincs jogosultsága ehhez a versenyhez' })
      return
    }

    switch (req.method) {
      case 'GET':
        // Get room exercises/questions
        const questions = await MockGameQuestionRepository.findByRoom(id)
        res.status(200).json({ questions })
        break

      case 'POST':
        // Add exercises to room
        const { selectedExercises } = req.body

        if (!selectedExercises || !Array.isArray(selectedExercises)) {
          res.status(400).json({ message: 'Érvénytelen feladat adatok' })
          return
        }

        // Clear existing questions
        await MockGameQuestionRepository.deleteByRoom(id)

        // Convert exercises to questions
        let questionOrder = 1
        for (const exercise of selectedExercises) {
          const questions = convertExerciseToQuestions(exercise, id, questionOrder)
          for (const question of questions) {
            await MockGameQuestionRepository.create(question)
            questionOrder++
          }
        }

        res.status(200).json({ 
          message: 'Feladatok sikeresen hozzáadva',
          questionCount: questionOrder - 1
        })
        break

      default:
        res.status(405).json({ message: 'Method not allowed' })
        break
    }

  } catch (error) {
    console.error('Room exercises error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

function convertExerciseToQuestions(exercise: any, roomId: string, startOrder: number): any[] {
  const questions: any[] = []
  
  switch (exercise.data.type) {
    case ExerciseType.QUIZ:
      if (exercise.data.content?.questions) {
        exercise.data.content.questions.forEach((q: any, index: number) => {
          questions.push({
            roomId,
            questionOrder: startOrder + index,
            questionText: q.question,
            questionType: 'multiple_choice',
            options: q.options || [],
            correctAnswers: q.correctIndices || [q.correctIndex || 0],
            points: 100,
            timeLimit: 30
          })
        })
      }
      break

    case ExerciseType.MATCHING:
      if (exercise.data.content?.pairs) {
        // Convert matching pairs to multiple choice questions
        exercise.data.content.pairs.forEach((pair: any, index: number) => {
          questions.push({
            roomId,
            questionOrder: startOrder + index,
            questionText: `Párosítsd: ${pair.left}`,
            questionType: 'multiple_choice',
            options: [pair.right, ...generateDistractors(pair.right, exercise.data.content.pairs)],
            correctAnswers: [0],
            points: 100,
            timeLimit: 30
          })
        })
      }
      break

    case ExerciseType.CATEGORIZATION:
      if (exercise.data.content?.items) {
        // Convert categorization items to multiple choice questions
        exercise.data.content.items.forEach((item: any, index: number) => {
          const category = exercise.data.content.categories.find((cat: any) => cat.id === item.categoryId)
          const otherCategories = exercise.data.content.categories.filter((cat: any) => cat.id !== item.categoryId)
          
          questions.push({
            roomId,
            questionOrder: startOrder + index,
            questionText: `Melyik kategóriába tartozik: ${item.text}`,
            questionType: 'multiple_choice',
            options: [category?.name, ...otherCategories.slice(0, 3).map((cat: any) => cat.name)],
            correctAnswers: [0],
            points: 100,
            timeLimit: 30
          })
        })
      }
      break
  }

  return questions
}

function generateDistractors(correct: string, allPairs: any[]): string[] {
  const others = allPairs
    .filter(pair => pair.right !== correct)
    .map(pair => pair.right)
    .slice(0, 3)
  
  // Shuffle the array
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]]
  }
  
  return others
}