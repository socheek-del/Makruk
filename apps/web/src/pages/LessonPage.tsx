import { Navigate, useNavigate, useParams } from 'react-router';
import { findLesson } from '../features/learn/lessons';
import { LessonPlayer } from '../features/learn/LessonPlayer';
import { useProgress } from '../stores/progress';

export function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useProgress((s) => s.completeLesson);
  const lesson = findLesson(lessonId);

  if (!lesson) return <Navigate to="/learn" replace />;
  if (lesson.route) return <Navigate to={lesson.route} replace />;

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      onExit={() => navigate('/learn')}
      onFinish={(stars) => {
        completeLesson(lesson.id, stars, lesson.xp);
        navigate('/learn');
      }}
    />
  );
}
