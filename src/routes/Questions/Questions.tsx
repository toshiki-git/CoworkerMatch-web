import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Layout } from '@/layouts';
import { fetcher, post } from '@/api/fetcher';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ChoiceCard';
import { Loading } from '@/components/Loading';
import { Error } from '@/components/Error';
import { Question } from '@/types/Question';
import { useSession } from 'next-auth/react';

export function QuestionsPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const { data, error } = useSWR<Question[]>('/matching_questions', fetcher);

  if (error) return <Error />;
  if (!data) return <Loading />;

  const handleChoiceClick = async (choiceIndex: number) => {
    const newSelectedChoices = [...selectedChoices];
    newSelectedChoices[currentQuestionIndex] = choiceIndex;
    setSelectedChoices(newSelectedChoices);

    if (currentQuestionIndex < data.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setLoading(true);

      const answers = newSelectedChoices.map((choice, index) => ({
        question_id: data[index].question_id,
        answer: choice === 1 ? 'yes' : 'no',
      }));

      const requestBody = {
        user_id: session?.userId,
        answers,
      };

      try {
        const result = await post('/matching_questions', requestBody);

        setTimeout(() => {
          router.push(`/matchings/${result.matching_id}?firstVisit=true`);
        }, 2000);
      } catch (error) {
        setLoading(false);
        setErrorMessage('マッチングしたユーザーはいませんでした');
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const currentQuestion = data[currentQuestionIndex];
  const selectedChoice = selectedChoices[currentQuestionIndex];

  if (loading) {
    return <Loading loadingMessage="マッチング中です" />;
  }

  return (
    <Layout>
      <div className="w-full flex flex-col items-center gap-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {errorMessage ? (
          <div className="text-center">
            <p className="mb-4  font-bold">{errorMessage}</p>
            <Button
              onClick={handleRetry}
              className="h-16 sm:h-20 md:h-24 px-6 sm:px-8 md:px-10 py-4 sm:py-6 md:py-7 text-sm sm:text-base md:text-lg w-full"
            >
              新しいマッチングを開始する →
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-9 items-center">
              <div>
                <span className="text-4xl font-bold">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-xl">/{data.length}</span>
              </div>
              <div>
                <p className="text-xl font-bold">
                  あなたが友達になりたいのは...
                </p>
                <p className="text-xl font-bold">You want to be friends...</p>
              </div>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">
                {currentQuestion?.question_text}
              </h1>
            </div>
            <div className="flex space-x-4">
              <ChoiceCard
                choice_text={currentQuestion?.choice1.choice_text}
                choice_image_url={currentQuestion?.choice1.choice_image_url}
                isSelected={selectedChoice === 1}
                onClick={() => handleChoiceClick(1)}
              />
              <ChoiceCard
                choice_text={currentQuestion?.choice2.choice_text}
                choice_image_url={currentQuestion?.choice2.choice_image_url}
                isSelected={selectedChoice === 2}
                onClick={() => handleChoiceClick(2)}
              />
            </div>
            <div className="mt-6 h-12 flex items-center">
              {currentQuestionIndex > 0 && (
                <Button onClick={handlePreviousQuestion} className="px-4 py-2">
                  ← 前の質問に戻る
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
